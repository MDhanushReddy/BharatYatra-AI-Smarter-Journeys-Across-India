import express from 'express';
import {
  getEcoFriendlyOptions,
  getSustainabilityRecommendations
} from '../controllers/sustainabilityController.js';

const router = express.Router();

// GET /api/sustainability/options - Get eco-friendly options
router.get('/options', getEcoFriendlyOptions);

// POST /api/sustainability/recommendations - Get sustainability recommendations
router.post('/recommendations', getSustainabilityRecommendations);

export default router;

