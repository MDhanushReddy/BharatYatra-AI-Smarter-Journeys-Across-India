// Monitoring Middleware - Step 18 Implementation
// Tracks API performance, errors, and system metrics

import logger from '../utils/logger.js';

// Performance monitoring middleware
export const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const route = `${req.method} ${req.path}`;
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        route,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      });
    }
    
    // Log performance metrics
    logger.logPerformance(route, duration, {
      statusCode: res.statusCode,
      method: req.method
    });
  });
  
  next();
};

// Error tracking middleware
export const errorTracking = (err, req, res, next) => {
  logger.logError(err, req);
  next(err);
};

// Rate limiting tracking
let requestCounts = {};

export const rateLimitTracking = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `${ip}_${req.path}`;
  
  if (!requestCounts[key]) {
    requestCounts[key] = { count: 0, resetTime: Date.now() + 60000 };
  }
  
  requestCounts[key].count++;
  
  // Reset counter after 1 minute
  if (Date.now() > requestCounts[key].resetTime) {
    requestCounts[key] = { count: 1, resetTime: Date.now() + 60000 };
  }
  
  // Log high-frequency requests
  if (requestCounts[key].count > 100) {
    logger.warn('High-frequency request detected', {
      ip,
      path: req.path,
      count: requestCounts[key].count
    });
  }
  
  next();
};

// System metrics tracking
export const getSystemMetrics = () => {
  const usage = process.memoryUsage();
  
  return {
    memory: {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    },
    cpu: {
      uptime: process.uptime(),
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null
    },
    process: {
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version
    }
  };
};

// Metrics endpoint handler
export const metricsHandler = (req, res) => {
  const metrics = {
    system: getSystemMetrics(),
    requests: requestCounts,
    timestamp: new Date().toISOString()
  };
  
  logger.debug('Metrics requested', { metrics });
  res.json(metrics);
};

// Cleanup old request counts periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(requestCounts).forEach(key => {
    if (requestCounts[key].resetTime < now) {
      delete requestCounts[key];
    }
  });
}, 60000); // Clean up every minute

