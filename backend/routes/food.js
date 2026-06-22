import { Router } from 'express';
import { searchRestaurants, getFoodRecommendations, analyzeFoodSentiment } from '../controllers/foodController.js';

const router = Router();

// Search restaurants with AI filtering
router.get('/search', searchRestaurants);

// Get AI-powered food recommendations
router.post('/recommendations', getFoodRecommendations);

// Analyze food reviews sentiment
router.post('/analyze', analyzeFoodSentiment);

export default router;
