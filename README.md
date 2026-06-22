# AI Trip Planner

An intelligent travel planning application that helps users plan their trips across India with AI-powered recommendations, real-time weather data, and comprehensive destination information.

## ✨ Features

- 🧠 **AI-Powered Travel Assistant** - Intelligent chatbot for travel planning
- 🏨 **Hotel Search** - Integration with Booking.com APIs via RapidAPI
- 🗺️ **Location Services** - MapMyIndia integration for Indian destinations
- 🌤️ **Weather Forecast** - Real-time weather data using Open-Meteo (free, no key required)
- 🎯 **Attractions & Places** - Tourist attractions with AI-powered recommendations
- 💰 **Budget Management** - Intelligent budget allocation and cost estimation
- 🔐 **User Authentication** - Secure JWT-based user registration and login
- 📋 **Itinerary Generation** - AI-powered day-by-day itinerary planning
- 🍽️ **Restaurant Recommendations** - AI-filtered restaurant suggestions with sentiment analysis
- 🎒 **Packing Lists** - Weather-aware packing recommendations
- 🛡️ **Safety & Alerts** - Travel advisories and safety information
- 🌱 **Sustainability** - Eco-friendly travel options and carbon footprint estimation
- 📤 **Export & Share** - Export itinerary as PDF/text and share via email/social media
- 💾 **Save & Resume** - Save trip drafts and generated itineraries
- 📊 **Progress Tracking** - Visual progress indicators for trip planning

## API Status

### ✅ Working APIs
- **Authentication**: User registration, login, and profile management
- **Weather**: Real-time weather forecasts (no API key required)
- **Indian Locations**: Comprehensive static data for Indian destinations
- **AI Chatbot**: Intelligent travel assistant with travel knowledge

### ⚠️ Partially Working APIs (Require API Keys)
- **Hotels**: Booking.com integration (requires API keys)
- **Places/Attractions**: MapMyIndia and Google Places integration
- **Location Search**: MapMyIndia API integration

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Required for authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Optional - MongoDB connection (uses in-memory DB if not set)
MONGO_URI=mongodb://localhost:27017/ai-trip-planner

# MapMyIndia API (for location services)
MAPMYINDIA_API_KEY=your_mapmyindia_api_key

# Google Places API (fallback for attractions)
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# RapidAPI Key (for both Booking.com hotels and Travel Advisor attractions)
# Get your API key from: https://rapidapi.com/
# Subscribe to Booking.com API and Travel Advisor API on RapidAPI
RAPIDAPI_KEY=your_rapidapi_key_here

# Booking.com Demand API (Optional - alternative hotel API)
DEMAND_API_TOKEN=your_demand_api_token

# Server configuration
PORT=5000
NODE_ENV=development
```

### 2. API Key Setup

#### MapMyIndia API (Recommended)
1. Visit [MapMyIndia API](https://www.mapmyindia.com/api/)
2. Sign up for a free account
3. Get your API key
4. Add to `.env` file as `MAPMYINDIA_API_KEY`

#### Google Places API (Optional)
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Places API
3. Create API key
4. Add to `.env` file as `GOOGLE_PLACES_API_KEY`

#### RapidAPI (Already Configured)
The application uses a single RapidAPI key for both:
1. **Booking.com API** - For hotel and accommodation search
2. **Travel Advisor API** - For attractions and sightseeing places

The key is already configured in the environment file.

### 3. Installation

```bash
# Install dependencies
npm install

# Start development server (both frontend and backend)
npm run dev

# Or start individually
npm run frontend  # Frontend only
npm run backend   # Backend only
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Hotels & Accommodations
- `GET /api/hotels/search` - Search hotels (Booking.com via RapidAPI)
  - Query params: `destination`, `checkin`, `checkout`, `adults`, `rooms`, `maxPrice`
- `GET /api/accommodation/search` - Search accommodations with AI filtering
- `GET /api/accommodation/recommendations` - Get AI-powered accommodation recommendations

### Places & Attractions
- `GET /api/places/search` - Search tourist attractions
  - Query params: `destination`, `lat`, `lng`, `radius`, `minRating`, `maxResults`
- `GET /api/attractions/search` - AI-powered attraction search (TF-IDF + Cosine Similarity)
- `POST /api/attractions/recommendations` - Get personalized attraction recommendations

### Food & Restaurants
- `GET /api/food/search` - Search restaurants with AI filtering (Naive Bayes classification)
  - Query params: `destination`, `cuisine`, `priceRange`, `dietary`, `minRating`, `maxResults`
- `POST /api/food/recommendations` - Get AI-powered food recommendations
- `POST /api/food/analyze-sentiment` - Analyze restaurant reviews (VADER sentiment analysis)

### Itinerary
- `POST /api/itinerary/generate` - Generate AI-powered itinerary (constraint-based scheduling)
- `POST /api/itinerary/optimize` - Optimize existing itinerary (Dijkstra's/A* algorithms)
- `GET /api/itinerary/recommendations` - Get itinerary recommendations
- `POST /api/itinerary/save` - Save itinerary to database (protected)
- `GET /api/itinerary/saved` - Get saved itineraries (protected)

### Locations
- `GET /api/locations/search` - Search locations
  - Query params: `query`, `limit`
- `GET /api/locations/details/:placeId` - Get location details

### Routes & Navigation
- `POST /api/routes/optimize` - Optimize route using AI algorithms (Dijkstra's, A*)
- `GET /api/routes/details` - Get detailed route information

### Budget
- `POST /api/budget/allocate` - Allocate budget across categories
- `GET /api/budget/recommendations` - Get budget recommendations

### Packing
- `POST /api/packing/generate` - Generate packing list (Decision Tree algorithm)
- `GET /api/packing/recommendations` - Get packing recommendations

### Safety
- `GET /api/safety/advisories` - Get travel advisories
- `GET /api/safety/emergency` - Get emergency contacts

### Alerts
- `GET /api/alerts` - Get travel alerts (weather, delays, etc.)

### Sustainability
- `GET /api/sustainability/options` - Get eco-friendly options
- `POST /api/sustainability/recommendations` - Get sustainability recommendations

### Social
- `POST /api/social/insights` - Get social insights and sentiment analysis

### Unified Travel Search
- `GET /api/travel/search` - Combined hotels and attractions search
  - Query params: `destination`, `checkin_date`, `checkout_date`, `adults_number`, `room_number`, `include_hotels`, `include_attractions`, `attractions_limit`, `hotels_limit`
  - Returns: Combined response with both hotels and attractions data

### Monitoring
- `GET /api/health` - Health check endpoint
- `GET /api/metrics` - System metrics and performance data

## Fallback Behavior

The application is designed to work even without API keys:

- **Hotels**: Falls back to mock data if APIs are unavailable
- **Places**: Uses static Indian destination data as fallback
- **Locations**: Uses comprehensive static data for Indian destinations
- **Weather**: Always works (uses free Open-Meteo API)
- **Authentication**: Always works (uses local database)
- **Unified Travel**: Combines hotels and attractions with individual fallbacks

## Technology Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

### APIs & Services
- Open-Meteo (Weather) - Free, no key required
- RapidAPI (Hotels & Attractions) - Single key for both Booking.com and Travel Advisor
- MapMyIndia (Locations) - Requires API key
- Google Places (Attractions Fallback) - Requires API key

## Development

```bash
# Run linting (frontend + backend)
npm run lint

# Run automated backend/API tests (integration-style)
node run-tests.js

# Optional: run focused backend tests
node test-backend-endpoints.js
node test-phase2-security.js

# Build for production (frontend)
npm run build

# Preview production build locally
npm run preview
```

## Testing & Coverage Expectations

- **Linting**: `npm run lint` must pass with **0 errors** before merging or deploying.
- **Data Flow Tests**: `node test-data-flow.js` - Verifies context persistence and itinerary integration (10/10 tests passing)
- **Comprehensive Tests**: `node test-phase3-comprehensive.js` - Integration, error handling, performance, security tests
- **Backend/API tests**:
  - `node run-tests.js` - Tests all major API endpoints
  - `node test-backend-endpoints.js` - Verifies core attractions/food endpoints
  - `node test-phase2-security.js` - Verifies security headers, rate limiting, and auth validation
- **Manual frontend checks** (before release):
  - Create a trip via `TripDetailsForm`, save draft, and resume
  - Select attractions/food/accommodation and ensure itinerary generation, export, and dashboard tabs work
  - Test sharing functionality (email, social media)
  - Verify data persists across page refreshes

## 🚀 Deployment

### Quick Deployment (30 minutes)

See [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md) for step-by-step deployment guide.

**Platforms:**
- **Frontend**: Vercel (free tier available)
- **Backend**: Render or Railway (free tier available)
- **Database**: MongoDB Atlas (free tier available)

**Cost**: $0/month on free tier

### Production Readiness

See [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md) for complete checklist.

## 📚 Documentation

- [API Endpoints Guide](./API_ENDPOINTS_GUIDE.md) - Complete API documentation
- [Architecture Overview](./ARCHITECTURE.md) - System architecture
- [Deployment Guide](./DEPLOYMENT.md) - Detailed deployment instructions
- [Testing Guide](./PHASE_3_TESTING_GUIDE.md) - Testing documentation
- [Data Flow Verification](./DATA_FLOW_VERIFICATION.md) - Data flow test results

## 🆕 Recent Features

### Phase 1-4 Complete ✅
- ✅ Complete data flow verification (10/10 tests passing)
- ✅ Itinerary save to backend
- ✅ Share itinerary via email, social media, and copy link
- ✅ Trip planning progress indicators
- ✅ Enhanced error handling and fallback mechanisms
- ✅ Comprehensive testing suite
- ✅ Production deployment configurations

### Key Improvements
- **Sharing**: Email, Twitter, Facebook, WhatsApp, copy link
- **Persistence**: All selections and itineraries persist across page refreshes
- **Progress Tracking**: Visual progress indicators in dashboard
- **Export**: PDF/print and text file download
- **Save**: Save itineraries to backend database

## 📖 User Guide

### Getting Started
1. **Register/Login**: Create an account or login
2. **Plan Trip**: Fill out trip details form (destination, dates, budget, preferences)
3. **Select Items**: Browse and select accommodations, restaurants, and attractions
4. **Generate Itinerary**: View your complete day-by-day itinerary
5. **Export/Share**: Export as PDF or share with others

### Tips
- Use "Save Draft" to save progress without completing the form
- Select multiple items in each category for better itinerary options
- Use filters to narrow down accommodations and restaurants
- Check progress indicator to see what's completed
- Export itinerary before your trip for offline access

## 🔗 Quick Links

- [Complete API Documentation](./API_DOCUMENTATION_COMPLETE.md)
- [Deployment Quick Start](./DEPLOYMENT_QUICK_START.md)
- [Production Readiness Checklist](./PRODUCTION_READINESS_CHECKLIST.md)
- [Testing Guide](./PHASE_3_TESTING_GUIDE.md)
- [Architecture Overview](./ARCHITECTURE.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (`npm run lint` and test suites)
5. Submit a pull request

## License

This project is licensed under the ISC License.

---

**Status**: Production Ready ✅  
**Last Updated**: Current Session
