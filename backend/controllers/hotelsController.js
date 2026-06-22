import axios from 'axios';
import defaultCityMap from '../utils/cityMap.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

// Simple in-memory cache to avoid frequent external API calls
// Keyed by a JSON of query params; expires after ttlMs
const cacheStore = new Map();
const ttlMs = 5 * 60 * 1000; // 5 minutes

const getCache = (key) => {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > ttlMs) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
};

const setCache = (key, value) => {
  cacheStore.set(key, { value, time: Date.now() });
};

const parseIntSafe = (value, fallback = 0) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const searchHotels = async (req, res, next) => {
  try {
    const {
      destination = '',
      checkin = '',
      checkout = '',
      adults = '1',
      rooms = '1',
      maxPrice = '',
      cityId,
      page = '1',
      limit = '20'
    } = req.query;

    // Pagination support
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    console.log('Hotel search request:', { destination, checkin, checkout, adults, rooms, maxPrice, cityId });

    const maxPriceInt = parseIntSafe(maxPrice, 0);

    const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    
    console.log('API Configuration:');
    console.log('- Google Maps API Key:', googleKey ? 'Present' : 'Missing');

    const cacheKey = JSON.stringify({ destination, checkin, checkout, adults, rooms, maxPrice: maxPriceInt });
    const cached = getCache(cacheKey);
    if (cached) {
      // Apply pagination to cached results
      if (cached.hotels && Array.isArray(cached.hotels)) {
        const paginatedHotels = cached.hotels.slice(skip, skip + limitNum);
        return sendSuccess(res, { hotels: paginatedHotels }, {
          source: cached.source || 'cache',
          total: cached.hotels.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(cached.hotels.length / limitNum)
        });
      }
      return sendSuccess(res, cached, { source: 'cache' });
    }

    // Use Google Places API to search for hotels (lodging)
    if (googleKey && destination) {
      try {
        // First, geocode the destination to get coordinates
        let location = null;
        if (destination) {
          const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
              address: `${destination}, India`,
              key: googleKey
            },
            timeout: 10000
          });

          if (geocodeResponse.data?.status === 'OK' && geocodeResponse.data?.results?.[0]) {
            const result = geocodeResponse.data.results[0];
            if (result?.geometry?.location) {
              location = `${result.geometry.location.lat},${result.geometry.location.lng}`;
            }
          }
        }

        if (location) {
          // Search for hotels using Google Places Nearby Search
          const nearbyResponse = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
            params: {
              location: location,
              radius: 10000,
              type: 'lodging',
              key: googleKey,
              language: 'en'
            },
            timeout: 10000
          });

          if (nearbyResponse.data?.status === 'OK') {
            const places = nearbyResponse.data.results || [];
            
            // Get detailed information for each hotel
            const hotels = await Promise.all(
              places.slice(0, parseInt(maxResults) || 20).map(async (place) => {
                try {
                  const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
                    params: {
                      place_id: place.place_id,
                      fields: 'name,rating,price_level,formatted_address,types,photos,reviews,opening_hours,international_phone_number,website',
                      key: googleKey,
                      language: 'en'
                    },
                    timeout: 5000
                  });

                  const details = detailsResponse.data?.result;
                  return {
                    id: place.place_id,
                    name: details?.name || place.name,
                    price: details?.price_level ? (details.price_level * 1000 + 1000) : 2000, // Convert to approximate INR
                    currency: 'INR',
                    rating: details?.rating || place.rating || 0,
                    image: details?.photos?.[0] ? 
                      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${details.photos[0].photo_reference}&key=${googleKey}` : '',
                    location: details?.formatted_address || place.vicinity || destination,
                    amenities: extractAmenities(details?.types || place.types || [])
                  };
                } catch (error) {
                  return {
                    id: place.place_id,
                    name: place.name,
                    price: 2000,
                    currency: 'INR',
                    rating: place.rating || 0,
                    image: '',
                    location: place.vicinity || destination,
                    amenities: []
                  };
                }
              })
            );

            const validHotels = hotels.filter(Boolean);
            const capped = maxPriceInt > 0 ? validHotels.filter(h => !h.price || h.price <= maxPriceInt) : validHotels;
            const paginatedHotels = capped.slice(skip, skip + limitNum);
            const payload = { hotels: paginatedHotels };
            setCache(cacheKey, { hotels: capped, source: 'google_places' });
            return sendSuccess(res, payload, {
              source: 'google_places',
              total: capped.length,
              page: pageNum,
              limit: limitNum,
              totalPages: Math.ceil(capped.length / limitNum)
            });
          }
        }
      } catch (apiErr) {
        console.warn('Google Places API failed, falling back to mock:', apiErr?.message);
      }
    }

    // Enhanced mock fallback with destination-specific hotels
    const generateMockHotels = (dest, maxPrice) => {
      const baseHotels = [
        { id: 1, name: `${dest} City Inn`, price: 1200, rating: 4.2, image: '', location: dest, amenities: ['Free WiFi','Parking'], type: 'Hotel' },
        { id: 2, name: `${dest} Comfort Stay`, price: 1800, rating: 4.4, image: '', location: dest, amenities: ['Free WiFi','Breakfast'], type: 'Hotel' },
        { id: 3, name: `${dest} Budget Lodge`, price: 800, rating: 3.9, image: '', location: dest, amenities: ['Free WiFi'], type: 'Hostel' },
        { id: 4, name: `${dest} Business Hotel`, price: 2600, rating: 4.5, image: '', location: dest, amenities: ['Gym','Restaurant'], type: 'Hotel' },
        { id: 5, name: `${dest} Boutique Resort`, price: 3200, rating: 4.7, image: '', location: dest, amenities: ['Spa','Restaurant'], type: 'Resort' },
      ];
      
      return maxPrice > 0 ? baseHotels.filter(h => h.price <= maxPrice) : baseHotels;
    };

    const mockHotels = generateMockHotels(destination || 'Unknown', maxPriceInt);
    const paginatedHotels = mockHotels.slice(skip, skip + limitNum);
    const payload = { hotels: paginatedHotels };
    setCache(cacheKey, { hotels: mockHotels, source: 'mock' });
    return sendSuccess(res, payload, {
      source: 'mock',
      total: mockHotels.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(mockHotels.length / limitNum)
    });
  } catch (err) {
    console.error('Hotel search error:', err);
    sendError(res, 'Failed to search hotels', 'SEARCH_ERROR', err.message, 500);
  }
};

// Helper function to extract amenities from Google Places types
function extractAmenities(types) {
  const amenities = [];
  if (types.includes('lodging')) amenities.push('Accommodation');
  if (types.includes('restaurant')) amenities.push('Restaurant');
  if (types.includes('gym')) amenities.push('Gym');
  if (types.includes('spa')) amenities.push('Spa');
  if (types.includes('parking')) amenities.push('Parking');
  if (types.includes('wifi')) amenities.push('Free WiFi');
  return amenities.length > 0 ? amenities : ['Basic Amenities'];
}


