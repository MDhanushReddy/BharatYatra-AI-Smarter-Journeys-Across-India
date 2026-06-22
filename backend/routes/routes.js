import { Router } from 'express';
import { optimizeRoute, getRouteDetails, calculateDistance } from '../controllers/routeController.js';

const router = Router();

// Optimize route using AI algorithms
router.post('/optimize', optimizeRoute);

// Get detailed route information
router.get('/details', getRouteDetails);

// Calculate distance between points
router.post('/distance', calculateDistance);

export default router;
