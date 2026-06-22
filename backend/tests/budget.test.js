// Budget Allocation Tests - Step 17 Implementation
// Unit tests for budget allocation functionality

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  allocateBudget,
  getBudgetRecommendations
} from '../controllers/budgetController.js';

describe('Budget Allocation Controller', () => {
  describe('allocateBudget', () => {
    it('should allocate budget correctly for moderate travel style', async () => {
      const req = {
        body: {
          totalBudget: 50000,
          duration: 5,
          travelStyle: 'moderate',
          groupType: 'couple',
          groupSize: 2
        }
      };
      
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await allocateBudget(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      
      expect(response.success).toBe(true);
      expect(response.budgetAllocation).toBeDefined();
      expect(response.budgetAllocation.accommodation).toBeGreaterThan(0);
      expect(response.budgetAllocation.food).toBeGreaterThan(0);
      expect(response.budgetAllocation.transportation).toBeGreaterThan(0);
      expect(response.budgetAllocation.activities).toBeGreaterThan(0);
    });

    it('should adjust allocation for luxury travel style', async () => {
      const req = {
        body: {
          totalBudget: 100000,
          duration: 7,
          travelStyle: 'luxury',
          groupType: 'solo',
          groupSize: 1
        }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await allocateBudget(req, res);

      const response = res.json.mock.calls[0][0];
      
      // Luxury should have higher accommodation percentage
      const accommodationPct = response.budgetAllocation.accommodation.percentage;
      expect(accommodationPct).toBeGreaterThan(40);
    });

    it('should return error for missing required fields', async () => {
      const req = {
        body: {
          totalBudget: 50000
          // Missing duration
        }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await allocateBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('required')
        })
      );
    });

    it('should calculate per-person budget correctly for groups', async () => {
      const req = {
        body: {
          totalBudget: 60000,
          duration: 4,
          travelStyle: 'moderate',
          groupType: 'family',
          groupSize: 4
        }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await allocateBudget(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.summary.perPersonBudget).toBe(15000);
      expect(response.summary.groupSize).toBe(4);
    });
  });

  describe('getBudgetRecommendations', () => {
    it('should return budget recommendations for destination', async () => {
      const req = {
        query: {
          destination: 'mumbai',
          duration: 3,
          travelStyle: 'moderate',
          groupType: 'couple',
          groupSize: 2
        }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await getBudgetRecommendations(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      
      expect(response.success).toBe(true);
      expect(response.estimatedCosts).toBeDefined();
      expect(response.recommendations).toBeDefined();
    });

    it('should return error for missing destination', async () => {
      const req = {
        query: {
          duration: 3,
          travelStyle: 'moderate'
        }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await getBudgetRecommendations(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

