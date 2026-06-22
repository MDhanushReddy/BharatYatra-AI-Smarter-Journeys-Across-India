import express from 'express';
import {
  allocateBudget,
  getBudgetRecommendations
} from '../controllers/budgetController.js';

const router = express.Router();

// POST /api/budget/allocate - Allocate budget across categories
router.post('/allocate', allocateBudget);

// GET /api/budget/recommendations - Get budget recommendations
router.get('/recommendations', getBudgetRecommendations);

export default router;

