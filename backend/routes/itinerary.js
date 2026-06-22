import { Router } from 'express';
import { generateItinerary, optimizeItinerary, getItineraryRecommendations, saveItinerary, getSavedItineraries } from '../controllers/itineraryController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Generate AI-powered itinerary
router.post('/generate', generateItinerary);

// Optimize existing itinerary
router.post('/optimize', optimizeItinerary);

// Get itinerary recommendations
router.get('/recommendations', getItineraryRecommendations);

// Save itinerary (protected route)
router.post('/save', authenticate, saveItinerary);

// Get saved itineraries (protected route)
router.get('/saved', authenticate, getSavedItineraries);

export default router;
