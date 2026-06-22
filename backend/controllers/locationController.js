import axios from 'axios';
import { sendSuccess, sendError, sendValidationError } from '../utils/responseHelper.js';
import { validateRequiredQueryParams, isValidNumber } from '../utils/requestValidator.js';

const GOOGLE_PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';
const GOOGLE_GEOCODE_BASE = 'https://maps.googleapis.com/maps/api/geocode';

export const searchLocations = async (req, res) => {
  try {
    // Validate required query parameters
    if (!validateRequiredQueryParams(req, res, ['query'])) return;

    const { query, limit = 10, page = 1 } = req.query;
    
    // Validate limit
    const limitNum = isValidNumber(limit, 1, 100) ? parseInt(limit) : 10;
    const pageNum = isValidNumber(page, 1) ? parseInt(page) : 1;

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not configured, using fallback search');
      
      // Fallback to static Indian locations data
      const indianLocations = await import('../../src/services/indianLocationsAPI.js');
      const searchResults = indianLocations.searchDestinations(query);
      
      const locations = searchResults.slice(0, limit).map(result => ({
        id: result.name.toLowerCase().replace(/\s+/g, '_'),
        name: result.name,
        address: `${result.name}, ${result.state || 'India'}`,
        coordinates: {
          lat: result.coordinates[0],
          lng: result.coordinates[1]
        },
        type: result.type,
        city: result.name,
        state: result.state,
        country: 'India'
      }));
      
      return sendSuccess(res, { locations }, { source: 'fallback', total: locations.length, page: pageNum, limit: limitNum });
    }

    // Search for places using Google Places API Text Search
    const response = await axios.get(`${GOOGLE_PLACES_BASE}/textsearch/json`, {
      params: {
        query: `${query}, India`,
        key: apiKey,
        language: 'en',
        region: 'in'
      },
      timeout: 10000
    });

    const places = response.data?.results || [];
    
    // Transform the response to our format
    const locations = places.slice(0, limitNum).map(place => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address || place.vicinity,
      coordinates: {
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng
      },
      type: place.types?.[0] || 'establishment',
      city: extractCity(place.formatted_address),
      state: extractState(place.formatted_address),
      country: 'India',
      rating: place.rating || 0
    }));

    return sendSuccess(res, { locations }, { source: 'google_places', total: locations.length, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('Error searching locations:', error);
    
    // Fallback to static data on error
    try {
      const indianLocations = await import('../../src/services/indianLocationsAPI.js');
      const searchResults = indianLocations.searchDestinations(req.query.query || '');
      
      const locations = searchResults.slice(0, 10).map(result => ({
        id: result.name.toLowerCase().replace(/\s+/g, '_'),
        name: result.name,
        address: `${result.name}, ${result.state || 'India'}`,
        coordinates: {
          lat: result.coordinates[0],
          lng: result.coordinates[1]
        },
        type: result.type,
        city: result.name,
        state: result.state,
        country: 'India'
      }));
      
      return sendSuccess(res, { locations }, { source: 'fallback', total: locations.length, page: pageNum, limit: limitNum, warning: 'API failed, using fallback' });
    } catch (fallbackError) {
      sendError(res, 'Failed to search locations', 'LOCATION_SEARCH_ERROR', fallbackError.message, 500);
    }
  }
};

// Helper functions to extract city and state from address
function extractCity(address) {
  if (!address) return '';
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 2].trim() : '';
}

function extractState(address) {
  if (!address) return '';
  const parts = address.split(',');
  return parts.length > 0 ? parts[parts.length - 1].trim().replace('India', '').trim() : '';
}

export const getLocationDetails = async (req, res) => {
  try {
    const { placeId } = req.params;
    
    if (!placeId) {
      return sendValidationError(res, ['Place ID is required']);
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not configured, using fallback');
      
      // Fallback to static data
      const indianLocations = await import('../../src/services/indianLocationsAPI.js');
      const destinationDetails = indianLocations.getDestinationDetails(placeId);
      
      if (destinationDetails) {
        const locationDetails = {
          id: placeId,
          name: placeId,
          address: `${placeId}, ${destinationDetails.state || 'India'}`,
          coordinates: {
            lat: destinationDetails.coordinates[0],
            lng: destinationDetails.coordinates[1]
          },
          type: 'destination',
          city: placeId,
          state: destinationDetails.state,
          country: 'India',
          description: destinationDetails.description,
          bestSeason: destinationDetails.bestSeason,
          localTransport: destinationDetails.localTransport,
          averageCost: destinationDetails.averageCost
        };
        
        return sendSuccess(res, { location: locationDetails }, { source: 'fallback' });
      }
      
      return sendError(res, 'Location not found', 'NOT_FOUND', null, 404);
    }

    // Get detailed information about a specific place using Google Places API
    const response = await axios.get(`${GOOGLE_PLACES_BASE}/details/json`, {
      params: {
        place_id: placeId,
        key: apiKey,
        fields: 'name,formatted_address,geometry,rating,user_ratings_total,types,photos,reviews,website,international_phone_number,opening_hours',
        language: 'en'
      },
      timeout: 10000
    });

    if (response.data?.status !== 'OK' || !response.data?.result) {
      return sendError(res, 'Location not found', 'NOT_FOUND', null, 404);
    }

    const place = response.data.result;
    
    // Transform the response to our format
    const locationDetails = {
      id: placeId,
      name: place.name,
      address: place.formatted_address,
      coordinates: {
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng
      },
      type: place.types?.[0] || 'establishment',
      city: extractCity(place.formatted_address),
      state: extractState(place.formatted_address),
      country: 'India',
      description: place.types?.join(', ') || '',
      phone: place.international_phone_number,
      website: place.website,
      rating: place.rating || 0,
      reviews: place.reviews || [],
      userRatingsTotal: place.user_ratings_total || 0,
      openingHours: place.opening_hours,
      photos: place.photos?.map(photo => ({
        photo_reference: photo.photo_reference,
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`
      })) || []
    };

    return sendSuccess(res, { location: locationDetails }, { source: 'google_places' });
  } catch (error) {
    console.error('Error getting location details:', error);
    
    // Fallback to static data on error
    try {
      const indianLocations = await import('../../src/services/indianLocationsAPI.js');
      const destinationDetails = indianLocations.getDestinationDetails(req.params.placeId);
      
      if (destinationDetails) {
        const locationDetails = {
          id: req.params.placeId,
          name: req.params.placeId,
          address: `${req.params.placeId}, ${destinationDetails.state || 'India'}`,
          coordinates: {
            lat: destinationDetails.coordinates[0],
            lng: destinationDetails.coordinates[1]
          },
          type: 'destination',
          city: req.params.placeId,
          state: destinationDetails.state,
          country: 'India',
          description: destinationDetails.description,
          bestSeason: destinationDetails.bestSeason,
          localTransport: destinationDetails.localTransport,
          averageCost: destinationDetails.averageCost
        };
        
        return sendSuccess(res, { location: locationDetails }, { source: 'fallback', warning: 'API failed, using fallback' });
      }
      
      return sendError(res, 'Location not found', 'NOT_FOUND', null, 404);
    } catch (fallbackError) {
      sendError(res, 'Failed to get location details', 'LOCATION_DETAILS_ERROR', fallbackError.message, 500);
    }
  }
};
