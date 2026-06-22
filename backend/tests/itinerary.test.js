// Itinerary Generation Tests - Step 17 Implementation
// Unit tests for itinerary generation functionality

import { describe, it, expect } from '@jest/globals';
import {
  generateItinerary,
  optimizeItinerary
} from '../controllers/itineraryController.js';

describe('Itinerary Controller', () => {
  describe('generateItinerary', () => {
    it('should generate itinerary for valid trip details', async () => {
      const req = {
        body: {
          destination: 'mumbai',
          startDate: '2024-12-01',
          endDate: '2024-12-05',
          attractions: [
            { id: 1, name: 'Gateway of India', category: 'monument' },
            { id: 2, name: 'Marine Drive', category: 'scenic' }
          ],
          userPreferences: {
            interests: ['culture', 'nature']
          }
        }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await generateItinerary(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      
      expect(response.success).toBe(true);
      expect(response.itinerary).toBeDefined();
      expect(Array.isArray(response.itinerary)).toBe(true);
    });

    it('should return error for missing required fields', async () => {
      const req = {
        body: {
          destination: 'mumbai'
          // Missing dates
        }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await generateItinerary(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return error for invalid date range', async () => {
      const req = {
        body: {
          destination: 'mumbai',
          startDate: '2024-12-05',
          endDate: '2024-12-01', // End before start
          attractions: []
        }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await generateItinerary(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('optimizeItinerary', () => {
    it('should optimize existing itinerary', async () => {
      const req = {
        body: {
          itinerary: [
            {
              day: 1,
              attractions: [
                { id: 1, name: 'Attraction 1', coordinates: [18.9289, 72.8281] },
                { id: 2, name: 'Attraction 2', coordinates: [18.9217, 72.8331] }
              ]
            }
          ],
          optimizationCriteria: 'time'
        }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await optimizeItinerary(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      
      expect(response.success).toBe(true);
      expect(response.optimizedItinerary).toBeDefined();
    });
  });
});

