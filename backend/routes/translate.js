import express from 'express';
import { translateText } from '../controllers/translateController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Translate text
router.post('/', authLimiter, translateText);

export default router;

