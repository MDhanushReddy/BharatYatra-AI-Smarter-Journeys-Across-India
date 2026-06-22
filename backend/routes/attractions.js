import { Router } from 'express';
import { searchAttractions, getRecommendedAttractions } from '../controllers/attractionsController.js';

const router = Router();

// Get attractions with AI-powered recommendations
router.get('/search', searchAttractions);
router.get('/recommendations', getRecommendedAttractions);

export default router;
