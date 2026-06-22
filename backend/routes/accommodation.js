import { Router } from 'express';
import { searchAccommodations, getAccommodationRecommendations, clusterAccommodations, searchNearbyLodging, getBookingDetailsForHotel, createBooking } from '../controllers/accommodationController.js';

const router = Router();

// Search accommodations with AI clustering
router.get('/search', searchAccommodations);

// Get AI-powered accommodation recommendations
router.post('/recommendations', getAccommodationRecommendations);

// Cluster accommodations by preferences
router.post('/cluster', clusterAccommodations);

// Google Places lodging discovery
router.get('/google/nearby', searchNearbyLodging);

// Booking.com details and booking
router.get('/booking/details', getBookingDetailsForHotel);
router.post('/booking/reserve', createBooking);

export default router;
