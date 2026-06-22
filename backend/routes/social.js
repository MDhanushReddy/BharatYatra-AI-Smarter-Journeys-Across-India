import { Router } from 'express';
import { getSocialInsights, getEcoFriendlyOptions, analyzeSustainability } from '../controllers/socialController.js';

const router = Router();

// Get social insights and sentiment analysis
router.get('/insights', getSocialInsights);

// Get eco-friendly accommodation and activity options
router.get('/eco-friendly', getEcoFriendlyOptions);

// Analyze sustainability of travel choices
router.post('/sustainability', analyzeSustainability);

export default router;
