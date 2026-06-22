import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import connectDB from './config/db.js';
import logger from './utils/logger.js';
import { validateAPIKeys } from './utils/apiKeyValidator.js';
import { validateEnvironment } from './utils/envValidator.js';
import { apiLimiter, authLimiter, searchLimiter } from './middleware/rateLimiter.js';
import { securityHeaders, requestSizeLimiter, getClientIP } from './middleware/security.js';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from the root directory
// Try multiple locations to ensure we find the .env file
const envPath1 = path.join(__dirname, '../.env');
const envPath2 = path.join(__dirname, '../../.env');
const envPath3 = path.join(__dirname, '.env');

if (fs.existsSync(envPath1)) {
  dotenv.config({ path: envPath1 });
  console.log('✅ Loaded .env from:', envPath1);
} else if (fs.existsSync(envPath2)) {
  dotenv.config({ path: envPath2 });
  console.log('✅ Loaded .env from:', envPath2);
} else if (fs.existsSync(envPath3)) {
  dotenv.config({ path: envPath3 });
  console.log('✅ Loaded .env from:', envPath3);
} else {
  // Fallback: try to load from default location
  dotenv.config();
  console.log('⚠️  Using default dotenv.config() - .env file location not explicitly found');
}

// Log API key status for debugging
const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
console.log('🔑 Google API Key Status:', {
  GOOGLE_MAPS_API_KEY: !!process.env.GOOGLE_MAPS_API_KEY,
  GOOGLE_PLACES_API_KEY: !!process.env.GOOGLE_PLACES_API_KEY,
  found: !!googleKey,
  startsWithAIza: googleKey ? googleKey.startsWith('AIza') : false,
  length: googleKey ? googleKey.length : 0
});

// Validate environment variables on startup
validateEnvironment();

// Validate API keys on startup
validateAPIKeys();

// Connect to database
connectDB();

const app = express();

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Security headers middleware (must be early in the chain)
app.use(securityHeaders);

// Request size limiting
app.use(requestSizeLimiter('10mb'));

// Request logging middleware
app.use((req, res, next) => {
  // Store real IP for rate limiting (don't override req.ip)
  req.clientIP = getClientIP(req);
  
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
  });
  
  next();
});

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      // Add production domains here
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
    ].filter(Boolean);
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Enhanced health check endpoint - Step 18
app.get('/api/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    services: {
      database: 'connected', // Will be enhanced with actual DB health check
      apis: 'operational'
    }
  };
  
  logger.info('Health check', { status: 'OK' });
  res.json(health);
});

// Routes with specific rate limiters
import authRoutes from './routes/auth.js';
app.use('/api/auth', authLimiter, authRoutes);
import hotelsRoutes from './routes/hotels.js';
app.use('/api/hotels', searchLimiter, hotelsRoutes);
import placesRoutes from './routes/places.js';
app.use('/api/places', searchLimiter, placesRoutes);
import locationRoutes from './routes/locations.js';
app.use('/api/locations', searchLimiter, locationRoutes);
import travelRoutes from './routes/travel.js';
app.use('/api/travel', searchLimiter, travelRoutes);

// New AI-powered routes
import attractionsRoutes from './routes/attractions.js';
app.use('/api/attractions', attractionsRoutes);
import routesRoutes from './routes/routes.js';
app.use('/api/routes', routesRoutes);
import accommodationRoutes from './routes/accommodation.js';
app.use('/api/accommodation', accommodationRoutes);
import foodRoutes from './routes/food.js';
app.use('/api/food', foodRoutes);
import itineraryRoutes from './routes/itinerary.js';
app.use('/api/itinerary', itineraryRoutes);
import alertsRoutes from './routes/alerts.js';
app.use('/api/alerts', alertsRoutes);
import safetyRoutes from './routes/safety.js';
app.use('/api/safety', safetyRoutes);
import packingRoutes from './routes/packing.js';
app.use('/api/packing', packingRoutes);
import socialRoutes from './routes/social.js';
app.use('/api/social', socialRoutes);
import budgetRoutes from './routes/budget.js';
app.use('/api/budget', budgetRoutes);
import sustainabilityRoutes from './routes/sustainability.js';
app.use('/api/sustainability', sustainabilityRoutes);
import translateRoutes from './routes/translate.js';
app.use('/api/translate', translateRoutes);

// Monitoring endpoints - Step 18
import { metricsHandler } from './middleware/monitoring.js';
app.get('/api/metrics', metricsHandler);

// Error handling middleware - Enhanced with logging
app.use((err, req, res, next) => {
  logger.logError(err, req);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`, { 
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
  console.log(`Server is running on port ${PORT}`);
}); 