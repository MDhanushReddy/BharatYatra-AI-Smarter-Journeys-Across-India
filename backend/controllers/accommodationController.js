import axios from 'axios';
import aiRecommendationService from '../services/aiRecommendationService.js';
import sentimentAnalysisService from '../services/sentimentAnalysisService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { validateRequiredQueryParams, isValidNumber, isValidDate } from '../utils/requestValidator.js';

const GOOGLE_PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

// Helper function to get city ID for Booking.com API
const getCityId = (destination) => {
  const cityMap = {
    'mumbai': 20089219,
    'delhi': 20089220,
    'bangalore': 20089221,
    'goa': -2140479,
    'kolkata': 20089222,
    'chennai': 20089223,
    'hyderabad': 20089224,
    'pune': 20089225,
    'jaipur': 20089226,
    'ahmedabad': 20089227
  };
  return cityMap[destination.toLowerCase()] || 20089219;
};

function normalizeDestinationName(destination) {
  if (!destination) return '';
  return destination.split(',')[0].trim().toLowerCase();
}

function applyMaxPriceFilter(accommodations, maxPrice) {
  if (!maxPrice || maxPrice <= 0) return accommodations;
  const withinBudget = accommodations.filter(acc => (acc.price || 0) <= maxPrice * 1.5);
  if (withinBudget.length > 0) return withinBudget;
  return [...accommodations].sort((a, b) => (a.price || 0) - (b.price || 0)).slice(0, 10);
}

async function resolveRapidApiDestId(destination, rapidApiKey) {
  try {
    const response = await axios.get('https://booking-com.p.rapidapi.com/v1/hotels/locations', {
      params: { name: destination, locale: 'en-gb' },
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com',
      },
      timeout: 10000,
    });
    const match = response.data?.find(
      (item) => item.dest_type === 'city' || item.search_type === 'city'
    ) || response.data?.[0];
    return match?.dest_id || getDestinationId(normalizeDestinationName(destination));
  } catch (error) {
    console.warn('RapidAPI location lookup failed, using static map:', error.message);
    return getDestinationId(normalizeDestinationName(destination));
  }
}

async function fetchRapidApiAccommodations(destination, checkin, checkout, adults, rooms, rapidApiKey) {
  const destId = await resolveRapidApiDestId(destination, rapidApiKey);
  const checkinDate = checkin || new Date().toISOString().slice(0, 10);
  const checkoutDate = checkout || new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const response = await axios.get('https://booking-com.p.rapidapi.com/v1/hotels/search', {
    params: {
      order_by: 'popularity',
      adults_number: adults,
      checkin_date: checkinDate,
      checkout_date: checkoutDate,
      filter_by_currency: 'INR',
      locale: 'en-gb',
      units: 'metric',
      room_number: String(rooms),
      dest_type: 'city',
      dest_id: destId,
    },
    headers: {
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': 'booking-com.p.rapidapi.com',
    },
    timeout: 15000,
  });

  const hotels = response.data?.result || [];
  return hotels.map((hotel, index) => {
    const rawRating = hotel.review_score || 8;
    const rating = rawRating > 5 ? rawRating / 2 : rawRating;
    return {
      id: hotel.hotel_id || `rapid_${index}`,
      name: hotel.hotel_name || hotel.hotel_name_trans || `Hotel ${index + 1}`,
      rating: Math.min(5, Math.max(0, rating)),
      price: hotel.min_total_price || hotel.composite_price_breakdown?.gross_amount?.value || 2500,
      address: hotel.address || hotel.city_trans || `${destination}, India`,
      amenities: ['Free WiFi', 'Restaurant', 'Parking'],
      coordinates: [hotel.latitude || 0, hotel.longitude || 0],
      imageUrl: hotel.max_photo_url || hotel.main_photo_url || '',
      description: hotel.hotel_name_trans || hotel.hotel_name || '',
      reviews: hotel.review_nr || 0,
      distanceFromCenter: 0,
      cluster: 0,
      source: 'rapidapi_booking',
    };
  });
}

// Enhanced accommodation search with AI clustering
export const searchAccommodations = async (req, res) => {
  try {
    console.log('=== searchAccommodations called ===');
    console.log('Query params:', req.query);
    
    // Validate required query parameters
    if (!validateRequiredQueryParams(req, res, ['destination'])) {
      console.log('Validation failed - destination missing');
      return;
    }

    const {
      destination = '',
      checkin = '',
      checkout = '',
      adults = 2,
      rooms = 1,
      maxPrice = 10000,
      minRating = 3,
      amenities = '',
      budget = 'medium',
      page = 1,
      limit = 20
    } = req.query;

    // Validate numeric parameters
    const adultsNum = isValidNumber(adults, 1, 10) ? parseInt(adults) : 2;
    const roomsNum = isValidNumber(rooms, 1, 10) ? parseInt(rooms) : 1;
    const maxPriceNum = isValidNumber(maxPrice, 0) ? parseFloat(maxPrice) : 10000;
    const minRatingNum = isValidNumber(minRating, 0, 5) ? parseFloat(minRating) : 3;
    const pageNum = isValidNumber(page, 1) ? parseInt(page) : 1;
    const limitNum = isValidNumber(limit, 1, 100) ? parseInt(limit) : 20;

    // Validate dates if provided
    if (checkin && !isValidDate(checkin)) {
      return sendError(res, 'Invalid check-in date format. Use YYYY-MM-DD', 'VALIDATION_ERROR', null, 400);
    }
    if (checkout && !isValidDate(checkout)) {
      return sendError(res, 'Invalid check-out date format. Use YYYY-MM-DD', 'VALIDATION_ERROR', null, 400);
    }

    console.log('AI Accommodation search request:', { 
      destination, checkin, checkout, adults: adultsNum, rooms: roomsNum, maxPrice: maxPriceNum, minRating: minRatingNum, amenities, budget 
    });

    // Get base accommodations using existing API logic
    let baseAccommodations = [];
    try {
      const accommodationsResult = await getBaseAccommodations(destination, checkin, checkout, adultsNum, roomsNum, maxPriceNum);
      baseAccommodations = Array.isArray(accommodationsResult) ? accommodationsResult : [];
    } catch (baseError) {
      console.error('❌ Error in getBaseAccommodations:', baseError);
      console.error('Stack:', baseError.stack);
      baseAccommodations = [];
    }
    
    // Determine the actual data source from accommodations
    let actualSource = 'fallback';
    if (baseAccommodations && baseAccommodations.length > 0) {
      actualSource = baseAccommodations[0]?.source || 'fallback';
      // Ensure all accommodations have the source set
      baseAccommodations.forEach(acc => {
        if (!acc.source) acc.source = actualSource;
      });
    }
    
    console.log(`📊 Data source: ${actualSource}, Found ${baseAccommodations?.length || 0} accommodations`);
    if (baseAccommodations && baseAccommodations.length > 0) {
      console.log(`📊 Sample accommodation source: ${baseAccommodations[0].source}`);
    }
    
    if (!baseAccommodations || baseAccommodations.length === 0) {
      return sendSuccess(res, { 
        accommodations: [], 
        clusters: [],
        recommendations: []
      }, {
        source: actualSource,
        message: 'No accommodations found for the given criteria',
        total: 0,
        page: pageNum,
        limit: limitNum
      });
    }

    // Apply K-means clustering for better recommendations
    let clusteredAccommodations = baseAccommodations;
    try {
      clusteredAccommodations = aiRecommendationService.kMeansClustering(baseAccommodations, 3);
    } catch (clusterError) {
      console.warn('K-means clustering failed, using original accommodations:', clusterError.message);
      clusteredAccommodations = baseAccommodations;
    }
    
    // Apply sentiment analysis for enhanced insights
    let enhancedAccommodations = clusteredAccommodations;
    try {
      enhancedAccommodations = sentimentAnalysisService.analyzeAccommodationSentiment(clusteredAccommodations);
    } catch (sentimentError) {
      console.warn('Sentiment analysis failed, using clustered accommodations:', sentimentError.message);
      enhancedAccommodations = clusteredAccommodations;
    }

    // Filter by rating, amenities, and budget - be very lenient to avoid filtering everything out
    console.log(`📊 Pre-filtering: ${enhancedAccommodations.length} accommodations`);
    console.log(`📊 Filter criteria: minRating=${minRatingNum}, maxPrice=${maxPriceNum}`);
    
    // Log sample accommodations before filtering
    if (enhancedAccommodations.length > 0) {
      console.log(`📊 Sample accommodation before filtering:`, {
        name: enhancedAccommodations[0].name,
        price: enhancedAccommodations[0].price,
        rating: enhancedAccommodations[0].rating,
        source: enhancedAccommodations[0].source
      });
    }
    
    let filteredAccommodations = enhancedAccommodations.filter(acc => {
      const price = acc.price || 0;
      const rating = acc.rating || 0;
      // Ensure source is preserved during filtering
      if (!acc.source) acc.source = actualSource;
      
      // Very lenient filtering to avoid filtering everything out:
      // 1. Allow accommodations with price 0 or missing (will be handled on frontend)
      // 2. Allow accommodations up to 2x the budget (give flexibility)
      // 3. Lower the minimum rating requirement significantly (allow 2.0+ or unrated)
      // 4. If maxPrice is 0 or very low, be even more lenient
      const adjustedMinRating = maxPriceNum > 0 ? Math.min(minRatingNum, 2.0) : 0; // Cap at 2.0 minimum, or 0 if no price limit
      const passesRating = rating >= adjustedMinRating || rating === 0 || !rating; // Allow unrated or missing rating
      const adjustedMaxPrice = maxPriceNum > 0 ? maxPriceNum * 2 : Number.MAX_SAFE_INTEGER; // Allow up to 2x budget, or unlimited if no limit
      const passesPrice = price === 0 || !price || price <= adjustedMaxPrice;
      
      const passes = passesRating && passesPrice;
      if (!passes) {
        console.log(`❌ Filtered out: ${acc.name} (price: ${price}, rating: ${rating}, passesPrice: ${passesPrice}, passesRating: ${passesRating})`);
      }
      return passes;
    });
    
    console.log(`📊 Post-filtering: ${filteredAccommodations.length} accommodations remain`);
    if (filteredAccommodations.length === 0 && enhancedAccommodations.length > 0) {
      console.warn(`⚠️ All accommodations filtered out! This might be due to strict filters.`);
      console.warn(`⚠️ Consider: minRating=${minRatingNum} might be too high, or maxPrice=${maxPriceNum} might be too low`);
    }
    
    // Ensure source is set on all filtered accommodations
    filteredAccommodations.forEach(acc => {
      if (!acc.source) acc.source = actualSource;
    });
    
    // Sort by price within budget and recommend based on budget allocation
    filteredAccommodations = filteredAccommodations.sort((a, b) => {
      // Prefer accommodations closer to 80% of maxPrice (better value)
      const targetPrice = maxPriceNum * 0.8;
      const scoreA = a.rating * 0.6 - Math.abs(a.price - targetPrice) / targetPrice;
      const scoreB = b.rating * 0.6 - Math.abs(b.price - targetPrice) / targetPrice;
      return scoreB - scoreA;
    });

    if (amenities) {
      const requiredAmenities = amenities.split(',').map(a => a.trim().toLowerCase());
      filteredAccommodations = filteredAccommodations.filter(acc => 
        requiredAmenities.some(amenity => 
          acc.amenities?.some(accAmenity => 
            accAmenity.toLowerCase().includes(amenity)
          )
        )
      );
    }

    // Group by clusters
    let clusters = [];
    try {
      clusters = groupAccommodationsByCluster(filteredAccommodations);
    } catch (clusterError) {
      console.error('Error grouping clusters:', clusterError);
      clusters = [];
    }
    
    // Generate recommendations
    let recommendations = [];
    try {
      recommendations = generateAccommodationRecommendations(filteredAccommodations, budget);
    } catch (recError) {
      console.error('Error generating recommendations:', recError);
      recommendations = [];
    }

    // If all accommodations were filtered out, use the original accommodations with minimal filtering
    if (filteredAccommodations.length === 0 && enhancedAccommodations.length > 0) {
      console.warn(`⚠️ All accommodations filtered out! Using original accommodations with minimal filtering.`);
      // Apply only the most basic filters - just ensure we have valid data
      filteredAccommodations = enhancedAccommodations.filter(acc => {
        // Only filter out accommodations with completely invalid data
        return acc && acc.name && (acc.price >= 0 || !acc.price);
      });
      console.log(`📊 After minimal filtering: ${filteredAccommodations.length} accommodations`);
    }
    
    // Pagination - ensure we don't paginate beyond available data
    const totalAvailable = filteredAccommodations.length;
    const skip = Math.max(0, (pageNum - 1) * limitNum);
    const paginatedAccommodations = filteredAccommodations.slice(skip, skip + limitNum);
    
    // Final check: ensure all paginated accommodations have source set
    paginatedAccommodations.forEach(acc => {
      if (!acc.source) acc.source = actualSource;
    });
    
    console.log(`📤 Sending response: ${paginatedAccommodations.length} accommodations (page ${pageNum}/${Math.ceil(totalAvailable / limitNum)}), source: ${actualSource}`);
    console.log(`📤 Total available: ${totalAvailable}, Filtered: ${filteredAccommodations.length}, Paginated: ${paginatedAccommodations.length}`);
    if (paginatedAccommodations.length > 0) {
      console.log(`📤 Sample accommodation in response:`, {
        name: paginatedAccommodations[0].name,
        source: paginatedAccommodations[0].source,
        price: paginatedAccommodations[0].price,
        rating: paginatedAccommodations[0].rating
      });
    } else {
      console.warn(`⚠️ No accommodations in paginated result. Total available: ${totalAvailable}, Page: ${pageNum}, Limit: ${limitNum}`);
      console.warn(`⚠️ Base accommodations: ${baseAccommodations.length}, Enhanced: ${enhancedAccommodations.length}, Filtered: ${filteredAccommodations.length}`);
    }

    return sendSuccess(res, {
      accommodations: paginatedAccommodations,
      clusters: clusters,
      recommendations: recommendations
    }, {
      source: actualSource, // Preserve the actual data source (google_places, booking_com, or fallback)
      algorithm: 'k_means_clustering',
      totalFound: baseAccommodations.length,
      filteredCount: filteredAccommodations.length,
      total: filteredAccommodations.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filteredAccommodations.length / limitNum)
    });

  } catch (error) {
    console.error('❌ AI Accommodation search error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    sendError(res, 'Failed to fetch accommodations', 'ACCOMMODATION_SEARCH_ERROR', error.message, 500);
  }
};

// Google Places: discover nearby accommodations (type=lodging)
export const searchNearbyLodging = async (req, res) => {
  try {
    const {
      destination = '',
      lat,
      lng,
      radius = '5000',
      maxResults = '20'
    } = req.query;

    const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    
    console.log('=== Accommodation API Debug ===');
    console.log('API Key present:', !!googleKey);
    console.log('API Key length:', googleKey ? googleKey.length : 0);
    console.log('API Key starts with:', googleKey ? googleKey.substring(0, 10) : 'N/A');
    
    if (!googleKey || googleKey === 'your_google_places_api_key_here' || !googleKey.startsWith('AIza')) {
      console.error('❌ Google Places API key not configured or invalid');
      console.error('Key validation:', {
        exists: !!googleKey,
        length: googleKey ? googleKey.length : 0,
        isDefault: googleKey === 'your_google_places_api_key_here'
      });
      return res.status(200).json({ 
        hotels: [], 
        accommodations: [],
        source: 'google_places', 
        message: 'Google Places API key not configured or invalid',
        error: 'API key missing or invalid'
      });
    }
    
    console.log('✅ Using Google Places API for accommodation search');

    let location = null;
    if (lat && lng) {
      location = `${lat},${lng}`;
      console.log('Using provided coordinates for accommodation:', location);
    } else if (destination) {
      console.log('Geocoding destination for accommodation:', destination);
      
      // Try Places textsearch first (better for tourist destinations)
      try {
        const textParams = { query: `${destination}, India`, key: googleKey, language: 'en' };
        const textUrl = `${GOOGLE_PLACES_BASE}/textsearch/json`;
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
      
      // Fallback to Geocoding API if textsearch fails
      if (!location) {
        try {
          const geocode = await axios.get(`${GOOGLE_PLACES_BASE}/geocode/json`, {
            params: { address: `${destination}, India`, key: googleKey },
            timeout: 10000
          });
          const result = geocode.data?.results?.[0];
          if (result?.geometry?.location) {
            location = `${result.geometry.location.lat},${result.geometry.location.lng}`;
            console.log('✅ Geocoded via geocode API:', location);
          } else {
            console.warn('Geocode API failed:', geocode.data?.status, geocode.data?.error_message);
          }
        } catch (geocodeError) {
          console.warn('Geocode API error:', geocodeError.message);
        }
      }
    }

    if (!location) {
      console.error('❌ Could not geocode destination for accommodation:', destination);
      return res.json({ hotels: [], accommodations: [], source: 'google_places', message: 'No location derived' });
    }

    const nearby = await axios.get(`${GOOGLE_PLACES_BASE}/nearbysearch/json`, {
      params: {
        location,
        radius: parseInt(radius, 10),
        type: 'lodging',
        key: googleKey,
        language: 'en'
      },
      timeout: 10000
    });

    if (nearby.data?.status !== 'OK') {
      console.error('❌ Google Places Nearby Search failed:', nearby.data?.status, nearby.data?.error_message);
      console.error('Full response:', JSON.stringify(nearby.data, null, 2));
      return res.status(200).json({ hotels: [], source: 'google_places', message: 'Search failed', error: nearby.data?.error_message });
    }

    const places = Array.isArray(nearby.data?.results) ? nearby.data.results : [];
    console.log(`✅ Found ${places.length} accommodations from Google Places API`);

    const details = await Promise.all(
      places.slice(0, parseInt(maxResults, 10)).map(async (p) => {
        try {
                  const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
                  console.log(`  Getting details for place_id: ${p.place_id}`);
                  
                  const det = await axios.get(detailsUrl, {
                    params: {
                      place_id: p.place_id,
                      fields: 'name,rating,formatted_address,geometry,photos,price_level,user_ratings_total',
                      key: googleKey,
                      language: 'en'
                    },
                    timeout: 10000
                  });
          const d = det.data?.result || {};
          return {
            id: p.place_id,
            name: d.name || p.name,
            rating: d.rating || p.rating || 0,
            address: d.formatted_address || p.vicinity || '',
            coordinates: [p.geometry?.location?.lat, p.geometry?.location?.lng],
            photoUrl: d.photos?.[0]
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${d.photos[0].photo_reference}&key=${googleKey}`
              : '',
            userRatingsTotal: d.user_ratings_total || 0,
            priceLevel: d.price_level ?? null,
            source: 'google_places'
          };
        } catch (_) {
          return {
            id: p.place_id,
            name: p.name,
            rating: p.rating || 0,
            address: p.vicinity || '',
            coordinates: [p.geometry?.location?.lat, p.geometry?.location?.lng],
            photoUrl: '',
            userRatingsTotal: 0,
            priceLevel: null,
            source: 'google_places'
          };
        }
      })
    );

    return res.json({ hotels: details, source: 'google_places' });
  } catch (err) {
    console.error('Google Places lodging search error:', err?.message);
    return res.status(500).json({ hotels: [], error: 'Failed to search lodging via Google Places' });
  }
};

// Booking.com: availability/pricing/details for a selected hotel name/destination
export const getBookingDetailsForHotel = async (req, res) => {
  try {
    const {
      name,
      destination = '',
      checkin = '',
      checkout = '',
      adults = '1',
      rooms = '1'
    } = req.query;

    if (!name) return res.status(400).json({ error: 'name is required' });

    const useDemandApi = Boolean(process.env.DEMAND_API_TOKEN);
    const useGooglePlaces = Boolean(process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY);

    // Helper to score name similarity (simple, case-insensitive)
    const scoreName = (a = '', b = '') => {
      const x = a.toLowerCase();
      const y = b.toLowerCase();
      if (x === y) return 1;
      if (x.includes(y) || y.includes(x)) return 0.8;
      return 0.3;
    };

    // DEMAND API path (if token present)
    if (useDemandApi && destination) {
      try {
        const url = `${DEMAND_API_BASE}/accommodations/search`;
        const payload = {
          platform: 'desktop',
          checkin,
          checkout,
          city: getCityId(destination),
          guests: [{ adults: parseInt(adults, 10) || 1 }]
        };
        const headers = { Authorization: `Bearer ${process.env.DEMAND_API_TOKEN}` };
        const { data } = await axios.post(url, payload, { headers, timeout: 15000 });
        const items = data?.accommodations || [];
        const scored = items.map(h => ({
          raw: h,
          score: scoreName(h.name || h.accommodation_name, name)
        })).sort((a,b) => b.score - a.score);

        if (scored[0]) {
          const h = scored[0].raw;
          return res.json({
            provider: 'booking_demand',
            hotelId: h.id || h.accommodation_id,
            name: h.name || h.accommodation_name,
            price: h?.price?.total_amount?.value || null,
            currency: h?.price?.total_amount?.currency || 'INR',
            rating: h.review_score || null,
            description: h.description || '',
            images: h.images || [],
            availability: h.availability || null
          });
        }
      } catch (e) {
        console.warn('Demand API details lookup failed:', e?.message);
      }
    }

    // Google Places API fallback
    if (useGooglePlaces && destination) {
      try {
        const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
        // Search for hotels using Google Places
        let location = null;
        const geocode = await axios.get(`${GOOGLE_PLACES_BASE}/geocode/json`, {
          params: { address: `${destination}, India`, key: googleKey },
          timeout: 5000
        });
        const result = geocode.data?.results?.[0];
        if (result?.geometry?.location) {
          location = `${result.geometry.location.lat},${result.geometry.location.lng}`;
        }

        if (location) {
          const nearby = await axios.get(`${GOOGLE_PLACES_BASE}/nearbysearch/json`, {
            params: {
              location,
              radius: 10000,
              type: 'lodging',
              keyword: name,
              key: googleKey,
              language: 'en'
            },
            timeout: 10000
          });

          if (nearby.data?.status === 'OK' && nearby.data?.results?.length > 0) {
            const place = nearby.data.results[0];
            const details = await axios.get(`${GOOGLE_PLACES_BASE}/details/json`, {
              params: {
                place_id: place.place_id,
                fields: 'name,rating,price_level,formatted_address,types,photos,reviews,opening_hours,international_phone_number,website',
                key: googleKey,
                language: 'en'
              },
              timeout: 5000
            });

            const hotelDetails = details.data?.result;
            return res.json({
              provider: 'google_places',
              hotelId: place.place_id,
              name: hotelDetails?.name || place.name,
              price: hotelDetails?.price_level ? (hotelDetails.price_level * 1000 + 1000) : null,
              currency: 'INR',
              rating: hotelDetails?.rating || place.rating || null,
              description: hotelDetails?.formatted_address || place.vicinity || '',
              images: hotelDetails?.photos?.map(photo => 
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${googleKey}`
              ) || [],
              availability: null
            });
          }
        }
      } catch (e) {
        console.warn('Google Places booking details lookup failed:', e?.message);
      }
    }

    return res.status(200).json({ provider: 'none', message: 'No matching hotel found', details: null });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking deeplink', message: err.message });
  }
};

// Placeholder booking endpoint (returns deep-link suggestion)
export const createBooking = async (req, res) => {
  try {
    const { provider, name, destination, checkin, checkout, adults = 1, rooms = 1 } = req.body || {};
    // For production, integrate Booking.com Demand API reservation flow here.
    // As a safe fallback, respond with a Booking.com search deeplink.
    const params = new URLSearchParams({
      ss: name || destination || '',
      checkin: checkin || '',
      checkout: checkout || '',
      group_adults: String(adults || 1),
      no_rooms: String(rooms || 1)
    });
    const deepLink = `https://www.booking.com/searchresults.html?${params.toString()}`;
    return res.json({ success: true, provider: provider || 'fallback', deepLink });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking deeplink', message: err.message });
  }
};

// Get AI-powered accommodation recommendations
export const getAccommodationRecommendations = async (req, res) => {
  try {
    const {
      destination,
      userPreferences = {},
      tripType = 'leisure',
      groupType = 'couple',
      budget = 'medium',
      duration = 3,
      interests = []
    } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    // Get base accommodations
    const baseAccommodations = await getBaseAccommodations(destination, '', '', 2, 1, 15000);
    
    if (!baseAccommodations || baseAccommodations.length === 0) {
      return res.json({ 
        recommendations: [], 
        message: 'No accommodations found for the destination'
      });
    }

    // Apply K-means clustering
    const clusteredAccommodations = aiRecommendationService.kMeansClustering(baseAccommodations, 4);

    // Apply sentiment analysis
    const enhancedAccommodations = sentimentAnalysisService.analyzeAccommodationSentiment(clusteredAccommodations);

    // Generate personalized recommendations
    const recommendations = generatePersonalizedAccommodationRecommendations(
      enhancedAccommodations, 
      { userPreferences, tripType, groupType, budget, duration, interests }
    );

    res.json({
      recommendations: recommendations,
      userProfile: { tripType, groupType, budget, duration, interests },
      totalAnalyzed: baseAccommodations.length,
      algorithm: 'k_means_with_sentiment',
      confidence: calculateAccommodationConfidence(recommendations)
    });

  } catch (error) {
    console.error('AI Accommodation recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
};

// Cluster accommodations by preferences
export const clusterAccommodations = async (req, res) => {
  try {
    const {
      accommodations = [],
      clusterCount = 3,
      criteria = ['price', 'rating', 'distance']
    } = req.body;

    if (!accommodations || accommodations.length === 0) {
      return res.status(400).json({ 
        error: 'Accommodations array is required' 
      });
    }

    // Apply K-means clustering
    const clusteredAccommodations = aiRecommendationService.kMeansClustering(
      accommodations, 
      parseInt(clusterCount)
    );

    // Group by clusters
    const clusters = groupAccommodationsByCluster(clusteredAccommodations);

    // Analyze cluster characteristics
    const clusterAnalysis = analyzeClusters(clusters, criteria);

    res.json({
      success: true,
      clusters: clusters,
      analysis: clusterAnalysis,
      totalAccommodations: accommodations.length,
      clusterCount: parseInt(clusterCount),
      criteria: criteria
    });

  } catch (error) {
    console.error('Accommodation clustering error:', error);
    res.status(500).json({ 
      error: 'Failed to cluster accommodations',
      message: error.message
    });
  }
};

// Helper function to get base accommodations using existing API logic
async function getBaseAccommodations(destination, checkin, checkout, adults, rooms, maxPrice) {
  try {
    if (!destination) {
      console.warn('No destination provided, returning empty array');
      return [];
    }

    const normalizedDestination = normalizeDestinationName(destination);
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (rapidApiKey) {
      try {
        console.log('🔍 Trying RapidAPI Booking.com (preferred API)...');
        const rapidResults = await fetchRapidApiAccommodations(
          destination, checkin, checkout, adults, rooms, rapidApiKey
        );
        if (rapidResults.length > 0) {
          const filtered = applyMaxPriceFilter(rapidResults, maxPrice);
          console.log(`✅ RapidAPI returned ${filtered.length} accommodations`);
          return filtered;
        }
        console.warn('⚠️ RapidAPI returned no hotels for:', destination);
      } catch (rapidError) {
        console.error('❌ RapidAPI Booking.com failed:', rapidError.message);
      }
    } else {
      console.log('⚠️ RAPIDAPI_KEY not set — will try Google Places or mock data');
    }
    
    // Try multiple environment variable names
    const googleKey = process.env.GOOGLE_MAPS_API_KEY || 
                      process.env.GOOGLE_PLACES_API_KEY || 
                      process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
                      process.env.VITE_GOOGLE_MAPS_API_KEY;
    
    console.log('=== getBaseAccommodations Debug ===');
    console.log('Destination:', destination);
    console.log('All env vars:', {
      GOOGLE_MAPS_API_KEY: !!process.env.GOOGLE_MAPS_API_KEY,
      GOOGLE_PLACES_API_KEY: !!process.env.GOOGLE_PLACES_API_KEY,
      REACT_APP_GOOGLE_MAPS_API_KEY: !!process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      VITE_GOOGLE_MAPS_API_KEY: !!process.env.VITE_GOOGLE_MAPS_API_KEY
    });
    console.log('Google Maps API Key present:', !!googleKey);
    console.log('Google Maps API Key length:', googleKey ? googleKey.length : 0);
    console.log('Google Maps API Key starts with:', googleKey ? googleKey.substring(0, 15) + '...' : 'N/A');
    console.log('API Key check:', {
      exists: !!googleKey,
      notDefault: googleKey !== 'your_google_places_api_key_here',
      valid: googleKey && googleKey.startsWith('AIza') && googleKey !== 'your_google_places_api_key_here',
      keyLength: googleKey ? googleKey.length : 0
    });

    // Try Google Places API FIRST
    if (googleKey && googleKey !== 'your_google_places_api_key_here' && googleKey.startsWith('AIza') && destination) {
      try {
        console.log('🔍 Trying Google Places API for accommodations:', destination);
        
        // Geocode destination with improved fallback logic
        let location = null;
        console.log('Attempting geocoding for:', `${destination}, India`);
        console.log('Using API key:', googleKey ? `${googleKey.substring(0, 15)}...` : 'MISSING');
        
        // Method 1: Try Places textsearch first (better for tourist destinations)
        try {
          const textParams = { query: `${destination}, India`, key: googleKey, language: 'en', region: 'in' };
          const textUrl = `${GOOGLE_PLACES_BASE}/textsearch/json`;
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
            console.log('Trying geocode API as fallback');
            
            const geocode = await axios.get(geocodeUrl, {
              params: { 
                address: `${destination}, India`, 
                key: googleKey,
                region: 'in' // Bias to India
              },
              timeout: 10000
            });
            
            console.log('Geocoding response status:', geocode.data?.status);
            if (geocode.data?.status !== 'OK') {
              console.error('Geocoding failed:', geocode.data?.error_message || geocode.data?.status);
            }
            
            const result = geocode.data?.results?.[0];
            if (result?.geometry?.location) {
              location = `${result.geometry.location.lat},${result.geometry.location.lng}`;
              console.log('✅ Geocoded via geocode API:', location);
            }
          } catch (geocodeError) {
            console.warn('Geocode API error:', geocodeError.message);
          }
        }
        
        if (!location) {
          console.warn('⚠️ No location found in geocoding results');
        }
        
        if (location) {
          // Search for lodging
          console.log('Searching for lodging near:', location);
          console.log('API Key being used:', googleKey ? `${googleKey.substring(0, 15)}...` : 'MISSING');
          
          // Use correct Places API endpoint
          const nearbyUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
          console.log('Nearby search URL:', nearbyUrl);
          
          const nearby = await axios.get(nearbyUrl, {
            params: {
              location,
              radius: 10000,
              type: 'lodging',
              key: googleKey,
              language: 'en'
            },
            timeout: 15000
          });
          
          console.log('Nearby search response status:', nearby.data?.status);
          console.log('Nearby search results count:', nearby.data?.results?.length || 0);
          
          if (nearby.data?.status !== 'OK' && nearby.data?.status !== 'ZERO_RESULTS') {
            console.error('❌ Nearby search error:', nearby.data?.error_message || nearby.data?.status);
            if (nearby.data?.error_message) {
              console.error('Full error:', nearby.data.error_message);
            }
            if (nearby.data?.status === 'REQUEST_DENIED') {
              console.error('❌ API request denied - check API key permissions and billing');
            } else if (nearby.data?.status === 'INVALID_REQUEST') {
              console.error('❌ Invalid request - check parameters');
            } else if (nearby.data?.status === 'OVER_QUERY_LIMIT') {
              console.error('❌ API quota exceeded');
            }
            // Continue to try to process results even if status is not OK
          }
          
          if (nearby.data?.status === 'OK' && nearby.data?.results?.length > 0) {
            const places = nearby.data.results;
            console.log(`✅ Found ${places.length} accommodations from Google Places API`);
            
            // Get details for each place - increase limit to get more results
            console.log(`Processing ${Math.min(places.length, 20)} places for detailed information...`);
            const details = await Promise.all(
              places.slice(0, 20).map(async (p, index) => {
                console.log(`  [${index + 1}/${Math.min(places.length, 20)}] Getting details for: ${p.name}`);
                try {
                  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json`;
                  console.log(`  Getting details for place_id: ${p.place_id}`);
                  const det = await axios.get(detailsUrl, {
                    params: {
                      place_id: p.place_id,
                      fields: 'name,rating,formatted_address,geometry,photos,price_level,user_ratings_total',
                      key: googleKey,
                      language: 'en'
                    },
                    timeout: 7000
                  });
                  const d = det.data?.result || {};
                  
                  // Convert price level to approximate price based on destination market rates
                  // Google Places price_level: 0=free, 1=inexpensive, 2=moderate, 3=expensive, 4=very expensive
                  // Base prices vary by destination cost of living
                  const destinationPriceMultipliers = {
                    'mumbai': 1.5, 'delhi': 1.3, 'bangalore': 1.2, 'goa': 1.4,
                    'kolkata': 0.9, 'chennai': 1.0, 'hyderabad': 1.0, 'pune': 1.1,
                    'jaipur': 0.9, 'ahmedabad': 0.8
                  };
                  
                  const multiplier = destinationPriceMultipliers[destination.toLowerCase()] || 1.0;
                  let price = 2000;
                  
                  if (d.price_level !== null && d.price_level !== undefined) {
                    // More realistic pricing: base prices per level multiplied by destination
                    const basePrices = {
                      0: 500,    // Free/budget
                      1: 1500,   // Inexpensive  
                      2: 3000,   // Moderate
                      3: 6000,   // Expensive
                      4: 12000   // Very expensive/luxury
                    };
                    price = Math.round(basePrices[d.price_level] * multiplier);
                  } else {
                    // If no price_level, estimate based on rating
                    if (d.rating >= 4.5) {
                      price = Math.round(8000 * multiplier);
                    } else if (d.rating >= 4.0) {
                      price = Math.round(5000 * multiplier);
                    } else if (d.rating >= 3.5) {
                      price = Math.round(3000 * multiplier);
                    } else {
                      price = Math.round(2000 * multiplier);
                    }
                  }
                  
                  return {
                    id: p.place_id,
                    name: d.name || p.name,
                    rating: d.rating || p.rating || 0, // Google Places already uses 5-point scale
                    price: price,
                    address: d.formatted_address || p.vicinity || '',
                    amenities: ['Free WiFi', 'Parking'], // Default amenities
                    coordinates: [p.geometry?.location?.lat, p.geometry?.location?.lng],
                    imageUrl: d.photos?.[0]
                      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${d.photos[0].photo_reference}&key=${googleKey}`
                      : '',
                    description: `${d.name || p.name} in ${destination}`,
                    reviews: d.user_ratings_total || 0,
                    distanceFromCenter: 0,
                    cluster: 0,
                    source: 'google_places'
                  };
                } catch (_) {
                  return {
                    id: p.place_id,
                    name: p.name,
                    rating: p.rating || 0, // Google Places already uses 5-point scale
                    price: Math.round(2000 * (destinationPriceMultipliers[destination.toLowerCase()] || 1.0)),
                    address: p.vicinity || '',
                    amenities: ['Free WiFi'],
                    coordinates: [p.geometry?.location?.lat, p.geometry?.location?.lng],
                    imageUrl: '',
                    description: `${p.name} in ${destination}`,
                    reviews: 0,
                    distanceFromCenter: 0,
                    cluster: 0,
                    source: 'google_places'
                  };
                }
              })
            );
            
            const validAccommodations = details.filter(Boolean);
            if (validAccommodations.length > 0) {
              console.log(`✅ Successfully processed ${validAccommodations.length} accommodations from Google Places API`);
              // Ensure source is set on each accommodation
              validAccommodations.forEach(acc => {
                if (!acc.source) acc.source = 'google_places';
              });
              // Filter by maxPrice before returning (allow 50% buffer)
              const filteredByPrice = validAccommodations.filter(acc => {
                const price = acc.price || 0;
                return price > 0 && price <= maxPrice * 1.5;
              });
              if (filteredByPrice.length > 0) {
                console.log(`✅ Returning ${filteredByPrice.length} accommodations within budget (maxPrice: ${maxPrice})`);
                console.log(`✅ Source for all accommodations: google_places`);
                return filteredByPrice;
              } else {
                console.warn(`⚠️ All ${validAccommodations.length} accommodations exceeded maxPrice (${maxPrice}). Showing top results anyway.`);
                // Return top results even if over budget, so user can see options
                const results = validAccommodations.slice(0, 10);
                console.log(`✅ Returning ${results.length} accommodations (over budget) with source: google_places`);
                return results;
              }
            } else {
              console.warn('⚠️ No valid accommodations after processing Google Places API results');
            }
          } else {
            console.warn('⚠️ Google Places API returned no results');
            console.warn('Status:', nearby.data?.status);
            if (nearby.data?.error_message) {
              console.error('Error message:', nearby.data.error_message);
            }
            if (nearby.data?.status === 'REQUEST_DENIED') {
              console.error('❌ API request denied - check API key permissions and billing');
            } else if (nearby.data?.status === 'INVALID_REQUEST') {
              console.error('❌ Invalid request - check parameters');
            } else if (nearby.data?.status === 'OVER_QUERY_LIMIT') {
              console.error('❌ API quota exceeded');
            }
            console.warn('Full API response:', JSON.stringify(nearby.data, null, 2));
          }
        } else {
          console.warn('⚠️ Could not geocode destination:', destination);
        }
      } catch (error) {
        console.error('❌ Google Places API error in getBaseAccommodations:', error.message);
        if (error.response) {
          console.error('API Error Response Status:', error.response.status);
          console.error('API Error Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        if (error.code) {
          console.error('Error Code:', error.code);
        }
        // Return empty array instead of undefined to prevent fallback
        return [];
      }
    } else {
      console.warn('⚠️ Google Places API key not configured — continuing to mock fallback');
    }

    // Fallback to Booking.com API (skip for now - focus on Google Places)
    // console.log('🔄 Falling back to Booking.com API');
    
    // Skip Booking.com API for now - ensure Google Places is used
    const demandApiToken = process.env.BOOKING_COM_API_KEY;
    const DEMAND_API_BASE = 'https://api.test.hotelbeds.com/hotel-api/1.0';
    
    // Try Booking.com API only if Google Places failed and token exists
    if (demandApiToken && destination && googleKey) {
      try {
        const response = await axios.get(`${DEMAND_API_BASE}/hotels/search`, {
          params: {
            checkin: checkin || new Date().toISOString().split('T')[0],
            checkout: checkout || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            adults: adults,
            rooms: rooms,
            city_ids: getCityId(destination), // Uses proper city ID
            currency: 'INR',
            order_by: 'popularity'
          },
          headers: {
            'Authorization': `Bearer ${demandApiToken}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        const hotels = response.data?.result || [];
        const formattedHotels = hotels.map((hotel, index) => ({
          id: hotel.hotel_id || index,
          name: hotel.hotel_name || `Hotel ${index + 1}`,
          rating: hotel.review_score / 2 || 4.0, // Convert to 5-point scale
          price: hotel.min_total_price || 2000,
          address: hotel.address || `${destination}, India`,
          amenities: extractAmenities(hotel.facilities || []),
          coordinates: [hotel.latitude || 28.6139, hotel.longitude || 77.2090],
          imageUrl: hotel.main_photo_url || '',
          description: hotel.hotel_name_trans || '',
          reviews: hotel.review_nr || 0,
          distanceFromCenter: calculateDistanceFromCenter(hotel.latitude, hotel.longitude, destination),
          cluster: 0
        }));

        if (formattedHotels.length > 0) {
          return formattedHotels;
        }
      } catch (error) {
        console.error('❌ Booking.com API failed:', error.message);
        // Continue - don't fall back to mock
      }
    }

    console.log('🔄 Using enhanced mock accommodations for:', normalizedDestination || destination);
    const mockAccommodations = getEnhancedMockAccommodations(
      normalizedDestination || destination,
      maxPrice
    );
    mockAccommodations.forEach((acc) => {
      if (!acc.source) acc.source = 'mock';
    });
    console.log(`✅ Mock fallback returning ${mockAccommodations.length} accommodations`);
    return mockAccommodations;

  } catch (error) {
    console.error('❌ Error getting base accommodations:', error);
    console.error('Error stack:', error.stack);
    const normalizedDestination = normalizeDestinationName(destination);
    const mockAccommodations = getEnhancedMockAccommodations(
      normalizedDestination || destination,
      maxPrice
    );
    mockAccommodations.forEach((acc) => {
      if (!acc.source) acc.source = 'mock';
    });
    return mockAccommodations;
  }
}

// Enhanced mock accommodations with realistic data
function getEnhancedMockAccommodations(destination, maxPrice) {
  const destinationHotels = {
    'mumbai': [
      {
        id: 1,
        name: 'The Oberoi Mumbai',
        rating: 4.8,
        price: 15000,
        address: 'Nariman Point, Mumbai',
        amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Parking'],
        coordinates: [18.9289, 72.8281],
        imageUrl: '',
        description: 'Luxury hotel with Arabian Sea views',
        reviews: 1250,
        distanceFromCenter: 2.5,
        cluster: 0
      },
      {
        id: 2,
        name: 'Taj Mahal Palace',
        rating: 4.7,
        price: 12000,
        address: 'Apollo Bunder, Mumbai',
        amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Parking', 'Beach Access'],
        coordinates: [18.9217, 72.8331],
        imageUrl: '',
        description: 'Historic luxury hotel overlooking Gateway of India',
        reviews: 2100,
        distanceFromCenter: 1.2,
        cluster: 0
      },
      {
        id: 3,
        name: 'Hotel Marine Plaza',
        rating: 4.2,
        price: 6000,
        address: 'Marine Drive, Mumbai',
        amenities: ['WiFi', 'Restaurant', 'Gym', 'Parking'],
        coordinates: [18.9445, 72.8238],
        imageUrl: '',
        description: 'Comfortable hotel on Marine Drive',
        reviews: 890,
        distanceFromCenter: 3.1,
        cluster: 1
      },
      {
        id: 4,
        name: 'Treebo Trend Hotel',
        rating: 4.0,
        price: 3000,
        address: 'Andheri East, Mumbai',
        amenities: ['WiFi', 'Restaurant', 'Parking'],
        coordinates: [19.1136, 72.8697],
        imageUrl: '',
        description: 'Budget-friendly hotel near airport',
        reviews: 450,
        distanceFromCenter: 8.5,
        cluster: 2
      }
    ],
    'delhi': [
      {
        id: 1,
        name: 'The Leela Palace New Delhi',
        rating: 4.9,
        price: 18000,
        address: 'Chanakyapuri, New Delhi',
        amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Parking', 'Concierge'],
        coordinates: [28.5944, 77.1855],
        imageUrl: '',
        description: 'Luxury palace hotel in diplomatic area',
        reviews: 980,
        distanceFromCenter: 5.2,
        cluster: 0
      },
      {
        id: 2,
        name: 'Hotel Imperial',
        rating: 4.5,
        price: 8000,
        address: 'Janpath, New Delhi',
        amenities: ['WiFi', 'Restaurant', 'Gym', 'Parking'],
        coordinates: [28.6139, 77.2090],
        imageUrl: '',
        description: 'Historic hotel in central Delhi',
        reviews: 650,
        distanceFromCenter: 2.1,
        cluster: 1
      },
      {
        id: 3,
        name: 'OYO Rooms',
        rating: 3.8,
        price: 2500,
        address: 'Paharganj, New Delhi',
        amenities: ['WiFi', 'AC'],
        coordinates: [28.6488, 77.2090],
        imageUrl: '',
        description: 'Budget accommodation near railway station',
        reviews: 320,
        distanceFromCenter: 1.8,
        cluster: 2
      }
    ],
    'bangalore': [
      {
        id: 1,
        name: 'ITC Gardenia Bengaluru',
        rating: 4.7,
        price: 11000,
        address: 'Residency Road, Bangalore',
        amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Parking'],
        coordinates: [12.9686, 77.5963],
        imageUrl: '',
        description: 'Luxury business hotel in central Bangalore',
        reviews: 890,
        distanceFromCenter: 2.0,
        cluster: 0
      },
      {
        id: 2,
        name: 'The Oberoi Bangalore',
        rating: 4.6,
        price: 9500,
        address: 'Ulsoor, Bangalore',
        amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym', 'Parking'],
        coordinates: [12.9815, 77.6226],
        imageUrl: '',
        description: 'Premium hotel near MG Road',
        reviews: 720,
        distanceFromCenter: 3.5,
        cluster: 1
      },
      {
        id: 3,
        name: 'Treebo Trend Park Elite',
        rating: 4.1,
        price: 2800,
        address: 'Koramangala, Bangalore',
        amenities: ['WiFi', 'Restaurant', 'Parking'],
        coordinates: [12.9352, 77.6245],
        imageUrl: '',
        description: 'Comfortable mid-range stay in Koramangala',
        reviews: 410,
        distanceFromCenter: 5.2,
        cluster: 2
      },
      {
        id: 4,
        name: 'Zostel Bangalore',
        rating: 4.0,
        price: 1200,
        address: 'Indiranagar, Bangalore',
        amenities: ['WiFi', 'Common Kitchen'],
        coordinates: [12.9784, 77.6408],
        imageUrl: '',
        description: 'Budget-friendly hostel for young travelers',
        reviews: 560,
        distanceFromCenter: 4.8,
        cluster: 2
      }
    ],
    'goa': [
      {
        id: 1,
        name: 'The Leela Goa',
        rating: 4.6,
        price: 14000,
        address: 'Cavelossim, South Goa',
        amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Parking', 'Beach Access', 'Water Sports'],
        coordinates: [15.2159, 73.9432],
        imageUrl: '',
        description: 'Beachfront luxury resort',
        reviews: 750,
        distanceFromCenter: 12.3,
        cluster: 0
      },
      {
        id: 2,
        name: 'Taj Holiday Village Resort',
        rating: 4.4,
        price: 9000,
        address: 'Candolim, North Goa',
        amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym', 'Parking', 'Beach Access'],
        coordinates: [15.5385, 73.7553],
        imageUrl: '',
        description: 'Beach resort with traditional Goan architecture',
        reviews: 520,
        distanceFromCenter: 8.7,
        cluster: 1
      },
      {
        id: 3,
        name: 'Hotel Calangute Towers',
        rating: 3.9,
        price: 4000,
        address: 'Calangute, North Goa',
        amenities: ['WiFi', 'Pool', 'Restaurant', 'Parking'],
        coordinates: [15.5385, 73.7553],
        imageUrl: '',
        description: 'Mid-range hotel near Calangute Beach',
        reviews: 280,
        distanceFromCenter: 6.2,
        cluster: 2
      }
    ]
  };

  const cityKey = normalizeDestinationName(destination);
  const displayName = destination.split(',')[0].trim();
  const hotels = destinationHotels[cityKey] || [
    {
      id: 1,
      name: `${displayName} Grand Hotel`,
      rating: 4.3,
      price: 4500,
      address: `${displayName}, India`,
      amenities: ['WiFi', 'Restaurant', 'Parking', 'Gym'],
      coordinates: [28.6139, 77.2090],
      imageUrl: '',
      description: `Comfortable hotel in ${displayName}`,
      reviews: 320,
      distanceFromCenter: 3.0,
      cluster: 1,
      source: 'mock'
    },
    {
      id: 2,
      name: `${displayName} Comfort Inn`,
      rating: 4.0,
      price: 2800,
      address: `${displayName}, India`,
      amenities: ['WiFi', 'Restaurant', 'Parking'],
      coordinates: [28.6139, 77.2090],
      imageUrl: '',
      description: `Mid-range stay in ${displayName}`,
      reviews: 210,
      distanceFromCenter: 4.5,
      cluster: 2,
      source: 'mock'
    },
    {
      id: 3,
      name: `${displayName} Budget Lodge`,
      rating: 3.8,
      price: 1500,
      address: `${displayName}, India`,
      amenities: ['WiFi', 'AC'],
      coordinates: [28.6139, 77.2090],
      imageUrl: '',
      description: `Affordable accommodation in ${displayName}`,
      reviews: 150,
      distanceFromCenter: 2.0,
      cluster: 2,
      source: 'mock'
    },
    {
      id: 4,
      name: `${displayName} Heritage Resort`,
      rating: 4.5,
      price: 7500,
      address: `${displayName}, India`,
      amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'],
      coordinates: [28.6139, 77.2090],
      imageUrl: '',
      description: `Premium resort experience in ${displayName}`,
      reviews: 480,
      distanceFromCenter: 6.0,
      cluster: 0,
      source: 'mock'
    }
  ];

  const priceCap = maxPrice > 0 ? maxPrice * 1.5 : Infinity;
  const withinBudget = hotels.filter((hotel) => hotel.price <= priceCap);
  const result = withinBudget.length > 0
    ? withinBudget
    : [...hotels].sort((a, b) => a.price - b.price).slice(0, 5);

  return result.map((hotel) => ({ ...hotel, source: hotel.source || 'mock' }));
}

// Extract amenities from API response
function extractAmenities(facilities) {
  const amenityMap = {
    'wifi': 'WiFi',
    'parking': 'Parking',
    'pool': 'Pool',
    'restaurant': 'Restaurant',
    'gym': 'Gym',
    'spa': 'Spa',
    'beach_access': 'Beach Access',
    'water_sports': 'Water Sports',
    'concierge': 'Concierge'
  };

  return facilities.map(facility => 
    amenityMap[facility.toLowerCase()] || facility
  );
}


// Get destination ID for RapidAPI
function getDestinationId(destination) {
  const destMap = {
    'mumbai': '-2090174',
    'delhi': '-2090175',
    'bangalore': '-2090176',
    'goa': '-2090177',
    'kolkata': '-2090178',
    'chennai': '-2090179'
  };
  return destMap[destination.toLowerCase()] || '-2090174';
}

// Calculate distance from city center
function calculateDistanceFromCenter(lat, lng, destination) {
  const cityCenters = {
    'mumbai': [18.9220, 72.8347],
    'delhi': [28.6139, 77.2090],
    'bangalore': [12.9716, 77.5946],
    'goa': [15.2993, 74.1240]
  };

  const center = cityCenters[destination.toLowerCase()] || [28.6139, 77.2090];
  const R = 6371; // Earth's radius in km
  const dLat = (lat - center[0]) * Math.PI / 180;
  const dLon = (lng - center[1]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(center[0] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Group accommodations by cluster
function groupAccommodationsByCluster(accommodations) {
  const clusters = {};
  
  accommodations.forEach(acc => {
    if (!clusters[acc.cluster]) {
      clusters[acc.cluster] = [];
    }
    clusters[acc.cluster].push(acc);
  });

  // Sort clusters by average price
  return Object.keys(clusters).map(clusterId => ({
    clusterId: parseInt(clusterId),
    accommodations: clusters[clusterId],
    averagePrice: clusters[clusterId].reduce((sum, acc) => sum + acc.price, 0) / clusters[clusterId].length,
    averageRating: clusters[clusterId].reduce((sum, acc) => sum + acc.rating, 0) / clusters[clusterId].length,
    count: clusters[clusterId].length
  })).sort((a, b) => a.averagePrice - b.averagePrice);
}

// Generate accommodation recommendations
function generateAccommodationRecommendations(accommodations, budgetPreference) {
  const recommendations = {
    luxury: accommodations.filter(acc => acc.price >= 10000).slice(0, 3),
    midRange: accommodations.filter(acc => acc.price >= 3000 && acc.price < 10000).slice(0, 3),
    budget: accommodations.filter(acc => acc.price < 3000).slice(0, 3),
    topRated: accommodations.filter(acc => acc.rating >= 4.5).slice(0, 3),
    ecoFriendly: accommodations.filter(acc => acc.ecoFriendly?.isEcoFriendly).slice(0, 3),
    highlighted: budgetPreference === 'low'
      ? accommodations.filter(acc => acc.price < 3000).slice(0, 5)
      : budgetPreference === 'high'
        ? accommodations.filter(acc => acc.price >= 8000).slice(0, 5)
        : accommodations.slice(0, 5)
  };

  return recommendations;
}

// Generate personalized accommodation recommendations
function generatePersonalizedAccommodationRecommendations(accommodations, userProfile) {
  const { tripType, budget } = userProfile;

  let personalized = [...accommodations];

  // Filter by budget
  const budgetRanges = {
    'low': { min: 0, max: 3000 },
    'medium': { min: 0, max: 8000 },
    'high': { min: 0, max: 15000 },
    'luxury': { min: 0, max: 50000 }
  };
  const range = budgetRanges[budget] || budgetRanges.medium;
  personalized = personalized.filter(acc => acc.price >= range.min && acc.price <= range.max);

  // Filter by trip type
  if (tripType === 'business') {
    personalized = personalized.filter(acc => 
      acc.amenities.includes('WiFi') && acc.amenities.includes('Gym')
    );
  } else if (tripType === 'family') {
    personalized = personalized.filter(acc => 
      acc.amenities.includes('Pool') || acc.amenities.includes('Restaurant')
    );
  } else if (tripType === 'adventure') {
    personalized = personalized.filter(acc => 
      acc.amenities.includes('Parking') && acc.price <= 8000
    );
  }

  // Score and rank
  return personalized
    .map(acc => ({
      ...acc,
      personalizedScore: calculateAccommodationScore(acc, userProfile)
    }))
    .sort((a, b) => b.personalizedScore - a.personalizedScore)
    .slice(0, 10);
}

// Calculate personalized score for accommodation
function calculateAccommodationScore(accommodation, userProfile) {
  let score = accommodation.rating * 0.4; // Base rating weight

  // Price matching
  const budgetRanges = {
    'low': 3000, 'medium': 8000, 'high': 15000, 'luxury': 50000
  };
  const maxBudget = budgetRanges[userProfile.budget] || 8000;
  if (accommodation.price <= maxBudget) {
    score += 0.3;
  }

  // Eco-friendly bonus
  if (accommodation.ecoFriendly?.isEcoFriendly) {
    score += 0.2;
  }

  // Sentiment analysis bonus
  if (accommodation.sentimentAnalysis?.overallSentiment === 'positive') {
    score += 0.1;
  }

  return score;
}

// Analyze cluster characteristics
function analyzeClusters(clusters, criteria) {
  return clusters.map(cluster => {
    const analysis = {
      clusterId: cluster.clusterId,
      characteristics: {},
      recommendations: []
    };

    // Price analysis
    if (criteria.includes('price')) {
      analysis.characteristics.price = {
        average: Math.round(cluster.averagePrice),
        range: {
          min: Math.min(...cluster.accommodations.map(a => a.price)),
          max: Math.max(...cluster.accommodations.map(a => a.price))
        }
      };
    }

    // Rating analysis
    if (criteria.includes('rating')) {
      analysis.characteristics.rating = {
        average: Math.round(cluster.averageRating * 10) / 10,
        range: {
          min: Math.min(...cluster.accommodations.map(a => a.rating)),
          max: Math.max(...cluster.accommodations.map(a => a.rating))
        }
      };
    }

    // Distance analysis
    if (criteria.includes('distance')) {
      const distances = cluster.accommodations.map(a => a.distanceFromCenter);
      analysis.characteristics.distance = {
        average: Math.round(distances.reduce((a, b) => a + b, 0) / distances.length * 10) / 10,
        range: {
          min: Math.min(...distances),
          max: Math.max(...distances)
        }
      };
    }

    // Generate recommendations
    if (cluster.averagePrice < 5000) {
      analysis.recommendations.push('Budget-friendly cluster');
    } else if (cluster.averagePrice > 12000) {
      analysis.recommendations.push('Luxury accommodations');
    } else {
      analysis.recommendations.push('Mid-range options');
    }

    if (cluster.averageRating >= 4.5) {
      analysis.recommendations.push('Highly rated accommodations');
    }

    return analysis;
  });
}

// Calculate accommodation recommendation confidence
function calculateAccommodationConfidence(recommendations) {
  const totalRecommendations = Object.values(recommendations).flat().length;
  const highRatedCount = Object.values(recommendations).flat().filter(r => r.rating >= 4.3).length;
  
  return Math.round((highRatedCount / totalRecommendations) * 100);
}

