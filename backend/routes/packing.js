import { Router } from 'express';
import { generatePackingList, getPackingRecommendations, analyzePackingList } from '../controllers/packingController.js';

const router = Router();

// Generate AI-powered packing list
router.post('/generate', generatePackingList);

// Get packing recommendations
router.get('/recommendations', getPackingRecommendations);

// Analyze existing packing list
router.post('/analyze', analyzePackingList);

export default router;
