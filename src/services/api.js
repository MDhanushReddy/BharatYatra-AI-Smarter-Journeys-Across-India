// API endpoints and service functions
// In development, use relative path '/api' which will be proxied by Vite to backend
// In production, use full URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : '/api');

// Log API configuration for debugging
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    API_BASE_URL,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    isDev: import.meta.env.DEV,
    mode: import.meta.env.MODE
  });
}

// Default timeout for API calls (15 seconds)
const DEFAULT_TIMEOUT = 15000;

// Fetch with timeout wrapper
const fetchWithTimeout = async (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error(`⏱️ Request timeout after ${timeout}ms for:`, url);
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    // Handle network errors (connection refused, etc.)
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.error('🌐 Network error - Backend may not be running:', url);
      console.error('💡 Make sure the backend server is running on port 5000');
      throw new Error('Cannot connect to backend server. Please ensure the backend is running on port 5000.');
    }
    throw error;
  }
};

export const fetchDestinationDetails = async (destination) => {
  try {
    // Use the Indian Locations API for destination details
    const destinationData = await import('./indianLocationsAPI.js');
    const details = destinationData.getDestinationDetails(destination);
    
    if (details) {
      return {
        name: destination,
        description: details.description,
        attractions: details.attractions || [],
        restaurants: [], // Will be populated by separate API call
        hotels: [], // Will be populated by separate API call
        coordinates: details.coordinates,
        bestSeason: details.bestSeason,
        localTransport: details.localTransport,
        averageCost: details.averageCost,
        languages: details.languages,
        emergencyContacts: details.emergencyContacts
      };
    }
    
    // Fallback if destination not found in static data
    return {
      name: destination,
      description: `Explore the beautiful destination of ${destination}`,
      attractions: [],
      restaurants: [],
      hotels: []
    };
  } catch (error) {
    console.error('Error fetching destination details:', error);
    throw error;
  }
};

export const fetchWeatherForecast = async (location, dates) => {
  try {
    // Use the real weather API service
    const weatherAPI = await import('../utils/weatherAPI.js');
    
    if (!dates || dates.length === 0) {
      throw new Error('No dates provided for weather forecast');
    }
    
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    const forecast = await weatherAPI.getDailyForecast(location, startDate, endDate);
    
    return {
      forecast: forecast.map(day => ({
        date: day.date,
        temperature: day.temperature.max,
        condition: day.weather,
        precipitation: day.precipitation,
        minTemp: day.temperature.min,
        maxTemp: day.temperature.max,
        sunrise: day.sunrise,
        sunset: day.sunset
      }))
    };
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    // Fallback to mock data if weather API fails
    return {
      forecast: dates.map(date => ({
        date,
        temperature: Math.floor(Math.random() * 30) + 10,
        condition: 'sunny',
        precipitation: 0
      }))
    };
  }
};

export const fetchAttractions = async (location) => {
  try {
    // Use the real attractions API (fetchAttractionsReal)
    return await fetchAttractionsReal({
      destination: location,
      maxResults: 20,
      minRating: 4
    });
  } catch (error) {
    console.error('Error fetching attractions:', error);
    // Do not return mock data - return empty array instead
    return [];
  }
};

export const fetchRestaurants = async ({ destination, lat, lng, radius = 5000, maxResults = 20, minRating = 3.5, cuisine, priceRange, dietary }) => {
  try {
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (lat) params.set('lat', String(lat));
    if (lng) params.set('lng', String(lng));
    params.set('radius', String(radius));
    params.set('maxResults', String(maxResults));
    params.set('minRating', String(minRating));
    if (cuisine) params.set('cuisine', cuisine);
    if (priceRange) params.set('priceRange', priceRange);
    if (dietary) params.set('dietary', dietary);

    const url = `${API_BASE_URL}/food/search?${params.toString()}`;
    console.log('🔍 Fetching restaurants from:', url);
    
    const res = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Restaurant API error:', { 
        status: res.status, 
        statusText: res.statusText,
        url,
        errorText 
      });
      throw new Error(`Failed to fetch restaurants: ${res.status}`);
    }
    const rawData = await res.json();
    console.log('fetchRestaurants raw response:', rawData);
    console.log('fetchRestaurants response structure:', {
      hasSuccess: rawData.success !== undefined,
      hasData: rawData.data !== undefined,
      dataType: rawData.data ? typeof rawData.data : 'undefined',
      dataKeys: rawData.data ? Object.keys(rawData.data) : [],
      hasRestaurants: rawData.data?.restaurants !== undefined,
      restaurantsCount: rawData.data?.restaurants?.length || 0
    });
    
    // Handle wrapped response structure from sendSuccess: { success: true, data: {...}, meta: {...} }
    // Backend returns: { success: true, data: { restaurants: [...], recommendations: [...], insights: {...} }, meta: {...} }
    let data = rawData;
    
    // Extract data from wrapped response
    if (rawData.success !== undefined && rawData.data) {
      data = rawData.data;
      console.log('✅ Extracted data from wrapped response');
    } else if (rawData.data) {
      data = rawData.data;
      console.log('✅ Extracted data from data property');
    }
    
    // Extract restaurants from various possible structures
    let restaurants = [];
    if (Array.isArray(data)) {
      // Response is directly an array
      restaurants = data;
      console.log('✅ Restaurants found as direct array');
    } else if (data && data.restaurants && Array.isArray(data.restaurants)) {
      // Response has restaurants property
      restaurants = data.restaurants;
      console.log(`✅ Restaurants found in data.restaurants: ${restaurants.length}`);
    } else if (data && data.data && Array.isArray(data.data)) {
      // Nested data structure
      restaurants = data.data;
      console.log('✅ Restaurants found in nested data.data');
    } else {
      console.warn('⚠️ Could not find restaurants array in response structure');
      console.warn('Available keys:', data ? Object.keys(data) : 'data is null/undefined');
    }
    
    console.log(`✅ Found ${restaurants.length} restaurants from API`);
    return restaurants.length > 0 ? restaurants : [];
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    // Do not return mock data - return empty array instead
    return [];
  }
}; 

export const fetchAttractionsReal = async ({ destination, lat, lng, radius = 10000, minRating = 4, maxResults = 20 }) => {
  try {
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (lat) params.set('lat', String(lat));
    if (lng) params.set('lng', String(lng));
    params.set('radius', String(radius));
    params.set('minRating', String(minRating));
    params.set('maxResults', String(maxResults));

    const url = `${API_BASE_URL}/places/search?${params.toString()}`;
    console.log('🔍 Fetching attractions from:', url);
    
    const res = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('❌ API Error Response:', { 
        status: res.status, 
        statusText: res.statusText, 
        url,
        errorData 
      });
      throw new Error(errorData?.error?.message || `Failed to fetch attractions: ${res.status} ${res.statusText}`);
    }
    
    const response = await res.json();
    
    // Handle standardized response format: { success: true, data: [...], meta: {...} }
    // or direct array format
    if (response.success !== undefined && response.data) {
      // Standardized format
      return { attractions: response.data, ...response.meta };
    } else if (Array.isArray(response)) {
      // Direct array format
      return { attractions: response };
    } else if (response.attractions) {
      // Already has attractions key
      return response;
    } else {
      // Empty or unknown format
      console.warn('Unexpected API response format:', response);
      return { attractions: [] };
    }
  } catch (error) {
    console.error('Error fetching attractions:', error);
    throw error;
  }
};

export const fetchHotels = async ({ destination, checkin, checkout, adults = 1, rooms = 1, maxPrice }) => {
  try {
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (checkin) params.set('checkin', checkin);
    if (checkout) params.set('checkout', checkout);
    if (adults) params.set('adults', String(adults));
    if (rooms) params.set('rooms', String(rooms));
    if (maxPrice) params.set('maxPrice', String(maxPrice));

    // Use the accommodation endpoint which has Google Places API integration
    const url = `${API_BASE_URL}/accommodation/search?${params.toString()}`;
    console.log('🔍 Fetching accommodations from:', url);
    
    const res = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('❌ Accommodation API error:', { 
        status: res.status, 
        statusText: res.statusText,
        url,
        errorData 
      });
      throw new Error(errorData?.error?.message || errorData.message || `Failed to fetch accommodations: ${res.status} ${res.statusText}`);
    }
    const rawResponse = await res.json();
    console.log('fetchHotels raw response structure:', {
      hasSuccess: !!rawResponse.success,
      hasData: !!rawResponse.data,
      hasMeta: !!rawResponse.meta,
      metaSource: rawResponse.meta?.source,
      dataKeys: rawResponse.data ? Object.keys(rawResponse.data) : [],
      directKeys: Object.keys(rawResponse)
    });
    
    // Backend uses sendSuccess which wraps response as: { success: true, data: {...}, meta: {...} }
    const data = rawResponse.data || rawResponse; // Handle both wrapped and unwrapped responses
    
    // Extract source from multiple possible locations
    const source = rawResponse.meta?.source || 
                   data.source || 
                   rawResponse.source ||
                   (data.accommodations && data.accommodations[0]?.source) ||
                   'api';
    
    // Normalize response - handle different response structures
    // Backend can return wrapped: { success: true, data: { accommodations: [...] }, meta: {...} }
    // Or unwrapped: { accommodations: [...] } or array directly
    if (Array.isArray(rawResponse)) {
      // If response is directly an array, wrap it
      console.log('Response is array, wrapping it');
      const sourceFromArray = rawResponse[0]?.source || 'api';
      return { hotels: rawResponse, accommodations: rawResponse, source: sourceFromArray };
    }
    
    // Handle wrapped response structure from sendSuccess
    if (data.accommodations && Array.isArray(data.accommodations)) {
      // Extract source from meta first, then from accommodations themselves
      const metaSource = rawResponse.meta?.source;
      const accommodationSource = data.accommodations.length > 0 ? data.accommodations[0]?.source : undefined;
      const finalSource = metaSource || accommodationSource || source;
      
      console.log(`✅ Found ${data.accommodations.length} accommodations`);
      console.log(`   Source from meta: ${metaSource}`);
      console.log(`   Source from accommodation: ${accommodationSource}`);
      console.log(`   Final source: ${finalSource}`);
      
      // Ensure all accommodations have the source
      const accommodationsWithSource = data.accommodations.map(acc => ({
        ...acc,
        source: acc.source || finalSource
      }));
      
      // Return with accommodations array explicitly set (don't spread data to avoid overwriting)
      const result = { 
        hotels: accommodationsWithSource, 
        accommodations: accommodationsWithSource,
        source: finalSource,
        meta: rawResponse.meta
      };
      
      // Include other data properties but ensure accommodations is not overwritten
      Object.keys(data).forEach(key => {
        if (key !== 'accommodations' && key !== 'hotels') {
          result[key] = data[key];
        }
      });
      
      console.log(`✅ Returning ${accommodationsWithSource.length} accommodations in response`);
      console.log(`   Response structure:`, {
        hasHotels: !!result.hotels,
        hotelsLength: result.hotels?.length || 0,
        hasAccommodations: !!result.accommodations,
        accommodationsLength: result.accommodations?.length || 0,
        source: result.source
      });
      return result;
    }
    
    // Handle direct accommodations array
    if (Array.isArray(data.accommodations)) {
      return { hotels: data.accommodations, accommodations: data.accommodations, source: rawResponse.meta?.source || data.source || 'api' };
    }
    
    if (data.hotels && Array.isArray(data.hotels)) {
      return { hotels: data.hotels, accommodations: data.hotels, source: rawResponse.meta?.source || data.source || 'api' };
    }
    
    // If data itself is an array (shouldn't happen but handle it)
    if (Array.isArray(data)) {
      console.log('Data itself is array');
      return { hotels: data, accommodations: data, source: rawResponse.meta?.source || 'api' };
    }
    
    // If it's an object but structure is different, try to find any array property
    const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
    if (arrayKeys.length > 0) {
      console.log(`Found array in key: ${arrayKeys[0]}`);
      return { hotels: data[arrayKeys[0]], accommodations: data[arrayKeys[0]], source: rawResponse.meta?.source || data.source || 'api' };
    }
    
    console.warn('Unexpected response structure. Keys:', Object.keys(rawResponse));
    if (rawResponse.data) console.warn('Data keys:', Object.keys(rawResponse.data));
    return rawResponse;
  } catch (error) {
    console.error('Error fetching hotels:', error);
    throw error;
  }
};

// Google Places: discover nearby lodging
export const discoverLodging = async ({ destination, lat, lng, radius = 5000, maxResults = 20 }) => {
  const params = new URLSearchParams();
  if (destination) params.set('destination', destination);
  if (lat) params.set('lat', String(lat));
  if (lng) params.set('lng', String(lng));
  params.set('radius', String(radius));
  params.set('maxResults', String(maxResults));
  const res = await fetchWithTimeout(`${API_BASE_URL}/accommodation/google/nearby?${params.toString()}`, {}, DEFAULT_TIMEOUT);
  if (!res.ok) throw new Error('Failed to discover lodging');
  return await res.json();
};

// Booking.com: get booking details for selected hotel name/destination
export const fetchBookingDetails = async ({ name, destination, checkin, checkout, adults = 1, rooms = 1 }) => {
  const params = new URLSearchParams({ name, destination: destination || '', checkin: checkin || '', checkout: checkout || '', adults: String(adults), rooms: String(rooms) });
  const res = await fetchWithTimeout(`${API_BASE_URL}/accommodation/booking/details?${params.toString()}`, {}, DEFAULT_TIMEOUT);
  if (!res.ok) throw new Error('Failed to fetch booking details');
  return await res.json();
};

// Booking.com: create booking (placeholder returns deep link)
export const createReservation = async ({ provider, hotelId, name, destination, checkin, checkout, adults = 1, rooms = 1 }) => {
  const res = await fetchWithTimeout(`${API_BASE_URL}/accommodation/booking/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, hotelId, name, destination, checkin, checkout, adults, rooms })
  }, DEFAULT_TIMEOUT);
  if (!res.ok) throw new Error('Failed to create reservation');
  return await res.json();
};

export const searchLocations = async (query) => {
  try {
    const params = new URLSearchParams();
    params.set('query', query);
    params.set('limit', '10');

    const res = await fetchWithTimeout(`${API_BASE_URL}/locations/search?${params.toString()}`, {}, DEFAULT_TIMEOUT);
    if (!res.ok) throw new Error('Failed to search locations');
    return await res.json();
  } catch (error) {
    console.error('Error searching locations:', error);
    throw error;
  }
};

export const getLocationDetails = async (placeId) => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/locations/details/${placeId}`, {}, DEFAULT_TIMEOUT);
    if (!res.ok) throw new Error('Failed to get location details');
    return await res.json();
  } catch (error) {
    console.error('Error getting location details:', error);
    throw error;
  }
};

// Unified Travel Search - combines hotels and attractions
export const searchTravel = async ({ 
  destination, 
  checkin_date, 
  checkout_date, 
  adults_number = 2, 
  room_number = 1,
  include_hotels = true,
  include_attractions = true,
  attractions_limit = 10,
  hotels_limit = 10
}) => {
  try {
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (checkin_date) params.set('checkin_date', checkin_date);
    if (checkout_date) params.set('checkout_date', checkout_date);
    if (adults_number) params.set('adults_number', String(adults_number));
    if (room_number) params.set('room_number', String(room_number));
    if (include_hotels !== undefined) params.set('include_hotels', String(include_hotels));
    if (include_attractions !== undefined) params.set('include_attractions', String(include_attractions));
    if (attractions_limit) params.set('attractions_limit', String(attractions_limit));
    if (hotels_limit) params.set('hotels_limit', String(hotels_limit));

    const res = await fetchWithTimeout(`${API_BASE_URL}/travel/search?${params.toString()}`, {}, DEFAULT_TIMEOUT);
    if (!res.ok) throw new Error('Failed to search travel data');
    return await res.json();
  } catch (error) {
    console.error('Error searching travel data:', error);
    throw error;
  }
};

// Save itinerary to backend
export const saveItinerary = async (itinerary, tripDetails) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetchWithTimeout(`${API_BASE_URL}/itinerary/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        itinerary,
        tripDetails,
        createdAt: new Date().toISOString()
      })
    }, DEFAULT_TIMEOUT);
    if (!res.ok) throw new Error('Failed to save itinerary');
    return await res.json();
  } catch (error) {
    console.error('Error saving itinerary:', error);
    throw error;
  }
};

// Get saved itineraries
export const getSavedItineraries = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetchWithTimeout(`${API_BASE_URL}/itinerary/saved`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    }, DEFAULT_TIMEOUT);
    if (!res.ok) throw new Error('Failed to fetch saved itineraries');
    return await res.json();
  } catch (error) {
    console.error('Error fetching saved itineraries:', error);
    throw error;
  }
};