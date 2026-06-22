import axios from 'axios';
import { sendSuccess, sendError, formatResponse } from '../utils/responseHelper.js';

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

const parseNumber = (v, fb) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

export const searchAttractions = async (req, res) => {
  try {
    const {
      destination = '',
      lat,
      lng,
      radius = '10000',
      minRating = '4',
      maxResults = '20',
      page = '1',
      limit = '20'
    } = req.query;

    // Pagination support
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || parseInt(maxResults) || 20));
    const skip = (pageNum - 1) * limitNum;

    console.log('Attractions search request:', { destination, lat, lng, radius, minRating, maxResults });

    // Use Google Places API
    const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    console.log('Google Places API Key:', googleKey ? 'Present' : 'Missing');
    console.log('API Key validation:', {
      exists: !!googleKey,
      length: googleKey ? googleKey.length : 0,
      startsWithAIza: googleKey ? googleKey.startsWith('AIza') : false,
      isDefault: googleKey === 'your_google_places_api_key_here'
    });
    
    if (!googleKey || googleKey === 'your_google_places_api_key_here' || !googleKey.startsWith('AIza')) {
      console.error('❌ Google Maps API key not configured or invalid');
      console.error('Key details:', {
        exists: !!googleKey,
        length: googleKey ? googleKey.length : 0,
        startsWithAIza: googleKey ? googleKey.startsWith('AIza') : false,
        isDefault: googleKey === 'your_google_places_api_key_here'
      });
      return sendSuccess(res, [], {
        source: 'google_places',
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
        error: 'Google Places API key not configured'
      });
    }

    const paramsCommon = {
      key: googleKey,
      language: 'en',
      region: 'in'
    };

    let location = null;
    if (lat && lng) {
      location = `${lat},${lng}`;
      console.log('Using provided coordinates:', location);
    } else if (destination) {
      // Try multiple geocoding methods for better reliability
      console.log('Geocoding destination:', destination);
      
      // Method 1: Try Places textsearch first (better for tourist destinations)
      try {
        const textParams = { ...paramsCommon, query: `${destination}, India` };
        const textUrl = `${PLACES_BASE}/textsearch/json`;
        const { data: textData } = await axios.get(textUrl, { params: textParams, timeout: 10000 });
        
        if (textData?.status === 'OK' && textData?.results?.length > 0) {
          const first = textData.results[0];
          if (first?.geometry?.location) {
            location = `${first.geometry.location.lat},${first.geometry.location.lng}`;
            console.log('✅ Geocoded via textsearch:', location);
          }
        } else {
          console.warn('Textsearch failed:', textData?.status, textData?.error_message);
        }
      } catch (textError) {
        console.warn('Textsearch error:', textError.message);
      }
      
      // Method 2: Fallback to Geocoding API if textsearch fails
      if (!location) {
        try {
          const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
          const geocodeParams = { ...paramsCommon, address: `${destination}, India` };
          const { data: geocodeData } = await axios.get(geocodeUrl, { params: geocodeParams, timeout: 10000 });
          
          if (geocodeData?.status === 'OK' && geocodeData?.results?.length > 0) {
            const first = geocodeData.results[0];
            if (first?.geometry?.location) {
              location = `${first.geometry.location.lat},${first.geometry.location.lng}`;
              console.log('✅ Geocoded via geocode API:', location);
            }
          } else {
            console.warn('Geocode API failed:', geocodeData?.status, geocodeData?.error_message);
          }
        } catch (geocodeError) {
          console.warn('Geocode API error:', geocodeError.message);
        }
      }
    }

    if (!location) {
      console.error('❌ Could not geocode destination:', destination);
      return sendSuccess(res, [], {
        source: 'google_places',
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
        error: 'Could not find location for destination'
      });
    }

    // Nearby search for tourist attractions in India region
    const nearbyParams = {
      ...paramsCommon,
      location,
      radius: parseNumber(radius, 10000),
      type: 'tourist_attraction',
      keyword: 'india'
    };
    const nearbyUrl = `${PLACES_BASE}/nearbysearch/json`;
    
    console.log('Making nearby search request:', { location, radius: nearbyParams.radius, type: nearbyParams.type });
    let data;
    try {
      const response = await axios.get(nearbyUrl, { params: nearbyParams, timeout: 15000 });
      data = response.data;
      console.log('Nearby search response status:', data?.status);
      console.log('Nearby search results count:', data?.results?.length || 0);
      
      if (data?.status !== 'OK' && data?.status !== 'ZERO_RESULTS') {
        console.error('❌ Google Places API error:', data?.status, data?.error_message);
        if (data?.status === 'REQUEST_DENIED') {
          console.error('❌ API request denied - check API key permissions and billing');
        } else if (data?.status === 'INVALID_REQUEST') {
          console.error('❌ Invalid request - check parameters');
        } else if (data?.status === 'OVER_QUERY_LIMIT') {
          console.error('❌ API quota exceeded');
        }
        // Return empty array instead of fallback
        return sendSuccess(res, [], {
          source: 'google_places',
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
          error: data?.error_message || `API returned status: ${data?.status}`
        });
      }
    } catch (apiError) {
      console.error('❌ Error calling Google Places API:', apiError.message);
      if (apiError.response) {
        console.error('API Error Response:', apiError.response.data);
      }
      // Return empty array instead of fallback
      return sendSuccess(res, [], {
        source: 'google_places',
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
        error: apiError.message
      });
    }

    const minR = parseNumber(minRating, 0);

    const results = Array.isArray(data?.results) ? data.results : [];
    console.log(`Processing ${results.length} results, filtering by minRating: ${minR}`);
    
    const attractions = results
      .filter(p => (p.rating || 0) >= minR)
      .map((p, idx) => ({
        id: p.place_id || idx,
        name: p.name,
        rating: p.rating || 0,
        price: 0,
        duration: '1-2 hours',
        description: p.vicinity || p.formatted_address || '',
        coordinates: [p.geometry?.location?.lat, p.geometry?.location?.lng],
        imageUrl: p.photos?.[0] ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photos[0].photo_reference}&key=${googleKey}` : '',
        category: 'attraction',
        facilities: []
      }));

    console.log(`✅ Found ${attractions.length} attractions after filtering (from ${results.length} total results)`);

    if (attractions.length > 0) {
      // Apply pagination
      const paginatedAttractions = attractions.slice(skip, skip + limitNum);
      return sendSuccess(res, paginatedAttractions, {
        source: 'google_places',
        total: attractions.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(attractions.length / limitNum)
      });
    } else {
      // No attractions found - return empty array instead of fallback
      console.log('⚠️ Google Places returned no attractions for:', destination);
      return sendSuccess(res, [], {
        source: 'google_places',
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
        message: `No attractions found for ${destination}`
      });
    }
  } catch (err) {
    // Do not fall back to mock data - return error instead
    console.error('Error searching attractions:', err);
    sendError(res, 'Failed to search attractions', 'SEARCH_ERROR', err.message, 500);
  }
};


