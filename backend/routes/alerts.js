import { Router } from 'express';
import { getWeatherAlerts, getTravelAlerts, subscribeToAlerts } from '../controllers/alertsController.js';

const router = Router();

// Get weather alerts for destination
router.get('/weather', getWeatherAlerts);

// Get travel alerts and recommendations
router.get('/travel', getTravelAlerts);

// Subscribe to real-time alerts (WebSocket simulation)
router.post('/subscribe', subscribeToAlerts);

export default router;
