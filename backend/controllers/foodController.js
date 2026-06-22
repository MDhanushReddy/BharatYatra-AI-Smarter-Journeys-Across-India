import axios from 'axios';
import aiRecommendationService from '../services/aiRecommendationService.js';
import sentimentAnalysisService from '../services/sentimentAnalysisService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const GOOGLE_PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

// Enhanced food search with AI filtering
export const searchRestaurants = async (req, res) => {
  try {
    const {
      destination = '',
      lat,
      lng,
      radius = '5000',
      cuisine = '',
      priceRange = '',
      minRating = 3.5,
      dietary = '',
      maxResults = 20,
      page = '1',
      limit = '20'
    } = req.query;

    // Pagination support
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || parseInt(maxResults) || 20));
    const skip = (pageNum - 1) * limitNum;

    console.log('AI Food search request:', { 
      destination, lat, lng, radius, cuisine, priceRange, minRating, dietary, maxResults 
    });

    // Get base restaurants using Google Places API
    const baseRestaurants = await getBaseRestaurants(destination, lat, lng, radius, maxResults);
    
    if (!baseRestaurants || baseRestaurants.length === 0) {
      return sendSuccess(res, {
        restaurants: [],
        recommendations: [],
        insights: {}
      }, {
        source: 'fallback',
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
        message: 'No restaurants found for the given criteria'
      });
    }

    // Apply AI-powered filtering
    let filteredRestaurants = baseRestaurants.filter(restaurant => 
      restaurant.rating >= parseFloat(minRating)
    );

    // Filter by cuisine
    if (cuisine) {
      const cuisines = cuisine.split(',').map(c => c.trim().toLowerCase());
      filteredRestaurants = filteredRestaurants.filter(restaurant => 
        cuisines.some(c => 
          restaurant.cuisine?.toLowerCase().includes(c) ||
          restaurant.description?.toLowerCase().includes(c)
        )
      );
    }

    // Filter by price range
    if (priceRange) {
      const priceRanges = {
        '1': { min: 0, max: 300 },      // ₹
        '2': { min: 300, max: 700 },    // ₹₹
        '3': { min: 700, max: 1500 },   // ₹₹₹
        '4': { min: 1500, max: 5000 }   // ₹₹₹₹
      };
      const range = priceRanges[priceRange];
      if (range) {
        filteredRestaurants = filteredRestaurants.filter(restaurant => 
          restaurant.priceRange >= range.min && restaurant.priceRange <= range.max
        );
      }
    }

    // Apply dietary restrictions - use more lenient filtering
    if (dietary) {
      const dietaryLower = dietary.toLowerCase().trim();
      const beforeFilter = filteredRestaurants.length;
      
      filteredRestaurants = filteredRestaurants.filter(restaurant => {
        // Direct property check (more reliable)
        if (dietaryLower === 'vegetarian' || dietaryLower === 'veg') {
          // For vegetarian: Include if explicitly marked as vegetarian OR if not explicitly marked as non-vegetarian
          // Many restaurants serve both vegetarian and non-vegetarian food
          if (restaurant.vegetarian === true) {
            return true; // Explicitly vegetarian
          } else if (restaurant.vegetarian === false) {
            return false; // Explicitly non-vegetarian
          } else {
            // Not explicitly marked - check name/description for vegetarian indicators
            const name = (restaurant.name || '').toLowerCase();
            const desc = (restaurant.description || '').toLowerCase();
            const hasVegIndicators = name.includes('veg') || name.includes('vegetarian') || 
                                     desc.includes('veg') || desc.includes('vegetarian') ||
                                     name.includes('pure veg') || name.includes('sattvik');
            // If has vegetarian indicators, include; otherwise, be lenient and include (many restaurants serve both)
            return hasVegIndicators || true; // Be lenient - include unless explicitly non-vegetarian
          }
        } else if (dietaryLower === 'halal') {
          // For halal: Include if explicitly marked as halal OR if not explicitly marked as non-halal
          if (restaurant.halal === true) {
            return true;
          } else if (restaurant.halal === false) {
            return false;
          } else {
            // Check name for halal indicators
            const name = (restaurant.name || '').toLowerCase();
            return name.includes('halal') || name.includes('muslim') || true; // Be lenient
          }
        } else if (dietaryLower === 'vegan') {
          // For vegan: More strict - must have vegan indicators
          const name = (restaurant.name || '').toLowerCase();
          const desc = (restaurant.description || '').toLowerCase();
          return name.includes('vegan') || desc.includes('vegan') || restaurant.vegetarian === true;
        } else {
          // For other dietary preferences, use classification but with lower threshold
          return aiRecommendationService.classifyFoodPreference(restaurant, { dietary }) > 0.1;
        }
      });
      
      console.log(`📊 After dietary filter (${dietary}): ${filteredRestaurants.length} restaurants remain (from ${beforeFilter} before filter)`);
      
      // If all restaurants were filtered out, be more lenient
      if (filteredRestaurants.length === 0 && beforeFilter > 0) {
        console.warn(`⚠️ All restaurants filtered out with dietary=${dietary}. Using more lenient filter...`);
        // Re-apply with more lenient rules
        filteredRestaurants = baseRestaurants.filter(restaurant => 
          restaurant.rating >= parseFloat(minRating)
        );
        console.log(`📊 Using lenient filter: ${filteredRestaurants.length} restaurants`);
      }
    }

    // Apply sentiment analysis for enhanced insights
    const enhancedRestaurants = sentimentAnalysisService.analyzeRestaurantSentiment(filteredRestaurants);

    // Generate food insights
    const insights = generateFoodInsights(enhancedRestaurants);

    // Generate recommendations
    const recommendations = generateFoodRecommendations(enhancedRestaurants, { cuisine, dietary, priceRange });

    // Apply pagination
    const paginatedRestaurants = enhancedRestaurants.slice(skip, skip + limitNum);

    return sendSuccess(res, {
      restaurants: paginatedRestaurants,
      recommendations: recommendations,
      insights: insights
    }, {
      source: 'ai_enhanced',
      algorithm: 'naive_bayes_classification',
      total: enhancedRestaurants.length,
      totalFound: baseRestaurants.length,
      filteredCount: enhancedRestaurants.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(enhancedRestaurants.length / limitNum)
    });

  } catch (error) {
    console.error('AI Food search error:', error);
    sendError(res, 'Failed to fetch restaurants', 'SEARCH_ERROR', error.message, 500);
  }
};

// Get AI-powered food recommendations
export const getFoodRecommendations = async (req, res) => {
  try {
    const {
      destination,
      userPreferences = {},
      dietaryRestrictions = [],
      budget = 'medium',
      cuisinePreferences = [],
      mealType = 'any', // breakfast, lunch, dinner, any
      groupSize = 2
    } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    // Get base restaurants
    const baseRestaurants = await getBaseRestaurants(destination, null, null, '10000', 50);
    
    if (!baseRestaurants || baseRestaurants.length === 0) {
      return res.json({ 
        recommendations: [], 
        message: 'No restaurants found for the destination'
      });
    }

    // Create user profile for recommendations
    const userProfile = {
      dietary: dietaryRestrictions.join(','),
      budget: budget,
      cuisine: cuisinePreferences.join(','),
      mealType: mealType,
      groupSize: groupSize,
      preferences: userPreferences
    };

    // Apply AI-powered recommendations
    const recommendations = generatePersonalizedFoodRecommendations(baseRestaurants, userProfile);

    res.json({
      recommendations: recommendations,
      userProfile: userProfile,
      totalAnalyzed: baseRestaurants.length,
      algorithm: 'naive_bayes_with_preferences',
      confidence: calculateFoodRecommendationConfidence(recommendations)
    });

  } catch (error) {
    console.error('AI Food recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to generate food recommendations',
      message: error.message
    });
  }
};

// Analyze food reviews sentiment
export const analyzeFoodSentiment = async (req, res) => {
  try {
    const { restaurants = [], reviews = [] } = req.body;

    if (!restaurants || restaurants.length === 0) {
      return res.status(400).json({ 
        error: 'Restaurants array is required' 
      });
    }

    // Analyze sentiment for each restaurant
    const analyzedRestaurants = restaurants.map(restaurant => {
      const restaurantReviews = reviews.filter(review => 
        review.restaurantId === restaurant.id
      );

      const sentimentAnalysis = sentimentAnalysisService.analyzeReviewSentiment(restaurantReviews);
      
      return {
        ...restaurant,
        sentimentAnalysis,
        foodQualityScore: calculateFoodQualityScore(restaurant, sentimentAnalysis),
        recommendation: generateFoodRecommendation(restaurant, sentimentAnalysis)
      };
    });

    // Generate overall insights
    const insights = generateFoodSentimentInsights(analyzedRestaurants);

    res.json({
      success: true,
      restaurants: analyzedRestaurants,
      insights: insights,
      totalAnalyzed: restaurants.length,
      algorithm: 'vader_sentiment_analysis'
    });

  } catch (error) {
    console.error('Food sentiment analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze food sentiment',
      message: error.message
    });
  }
};

// Helper function to get base restaurants using Google Places API
async function getBaseRestaurants(destination, lat, lng, radius, maxResults) {
  try {
    const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    
    console.log('=== Food API Debug ===');
    console.log('API Key present:', !!googleKey);
    console.log('API Key length:', googleKey ? googleKey.length : 0);
    console.log('API Key starts with:', googleKey ? googleKey.substring(0, 10) : 'N/A');
    
    if (!googleKey || googleKey === 'your_google_places_api_key_here' || !googleKey.startsWith('AIza')) {
      console.error('❌ Google Places API key not configured or invalid');
      console.error('Key details:', {
        exists: !!googleKey,
        length: googleKey ? googleKey.length : 0,
        startsWithAIza: googleKey ? googleKey.startsWith('AIza') : false,
        isDefault: googleKey === 'your_google_places_api_key_here'
      });
      // Return empty array instead of mock data
      return [];
    }

    console.log('✅ Using Google Places API for food search:', { destination, lat, lng, radius });

    let location = null;
    if (lat && lng) {
      location = `${lat},${lng}`;
      console.log('Using provided coordinates:', location);
    } else if (destination) {
      // Try multiple geocoding strategies for better results
      const geocodeQueries = [
        `${destination}, India`,
        destination,
        `${destination} city, India`,
        destination.toLowerCase().charAt(0).toUpperCase() + destination.toLowerCase().slice(1)
      ];
      
      for (const query of geocodeQueries) {
        try {
          console.log('Geocoding destination:', query);
          const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
              address: query,
              key: googleKey,
              region: 'in' // Bias to India
            },
            timeout: 5000
          });

          if (geocodeResponse.data?.status === 'OK' && geocodeResponse.data?.results?.[0]) {
            const result = geocodeResponse.data.results[0];
            if (result?.geometry?.location) {
              location = `${result.geometry.location.lat},${result.geometry.location.lng}`;
              console.log('Geocoding successful:', location, 'for query:', query);
              break; // Success, exit loop
            }
          }
        } catch (geocodeError) {
          console.error('Geocoding error for query', query, ':', geocodeError.message);
          if (geocodeError.response) {
            console.error('Geocoding API response:', geocodeError.response.data);
          }
          // Continue to next query
          continue;
        }
      }
      
      if (!location) {
        console.warn('All geocoding attempts failed for:', destination);
      }
    }

    if (!location) {
      console.warn('Could not determine location for:', destination);
      // Return empty array instead of mock data
      return [];
    }

    // Search for restaurants using Google Places
    console.log('Searching for restaurants near:', location);
    const nearbyResponse = await axios.get(`${GOOGLE_PLACES_BASE}/nearbysearch/json`, {
      params: {
        location: location,
        radius: parseInt(radius),
        type: 'restaurant',
        key: googleKey,
        language: 'en'
      },
      timeout: 10000
    });

    if (nearbyResponse.data?.status !== 'OK') {
      console.error('❌ Google Places Nearby Search failed:', nearbyResponse.data?.status, nearbyResponse.data?.error_message);
      console.error('Full response:', JSON.stringify(nearbyResponse.data, null, 2));
      if (nearbyResponse.data?.status === 'REQUEST_DENIED') {
        console.error('❌ API request denied - check API key permissions and billing');
      } else if (nearbyResponse.data?.status === 'INVALID_REQUEST') {
        console.error('❌ Invalid request - check parameters');
      } else if (nearbyResponse.data?.status === 'OVER_QUERY_LIMIT') {
        console.error('❌ API quota exceeded');
      }
      // Return empty array instead of mock data
      return [];
    }

    const restaurants = nearbyResponse.data?.results || [];
    console.log(`✅ Found ${restaurants.length} restaurants from Google Places API`);
    
    if (restaurants.length === 0) {
      console.warn('⚠️ No restaurants found from Google Places API for:', destination);
      // Return empty array instead of mock data
      return [];
    }
    
    // Get detailed information for each restaurant
    const detailedRestaurants = await Promise.all(
      restaurants.slice(0, parseInt(maxResults)).map(async (place) => {
        try {
          const detailsResponse = await axios.get(`${GOOGLE_PLACES_BASE}/details/json`, {
            params: {
              place_id: place.place_id,
              fields: 'name,rating,price_level,formatted_address,types,photos,reviews,opening_hours',
              key: googleKey,
              language: 'en'
            },
            timeout: 5000
          });

          if (detailsResponse.data?.status === 'OK') {
            const details = detailsResponse.data.result;
            return formatRestaurantData(details, place, googleKey);
          } else {
            console.warn('Place details failed for:', place.place_id, detailsResponse.data?.status);
            return formatRestaurantData(null, place, googleKey);
          }
        } catch (error) {
          console.error('Error getting restaurant details for', place.place_id, ':', error.message);
          if (error.response) {
            console.error('API response:', error.response.data);
          }
          return formatRestaurantData(null, place, googleKey);
        }
      })
    );

    const validRestaurants = detailedRestaurants.filter(Boolean);
    console.log(`Successfully processed ${validRestaurants.length} restaurants from Google Places API`);
    return validRestaurants;

  } catch (error) {
    console.error('❌ Error getting base restaurants from Google Places API:', error.message);
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    // Return empty array instead of mock data
    return [];
  }
}

// Format restaurant data from Google Places API
function formatRestaurantData(details, place, googleKey) {
  const restaurant = {
    id: place.place_id,
    name: details?.name || place.name,
    rating: details?.rating || place.rating || 0,
    priceRange: details?.price_level ? details.price_level * 200 + 100 : 500, // Convert to INR
    address: details?.formatted_address || place.vicinity,
    cuisine: extractCuisine(details?.types || place.types),
    coordinates: [place.geometry?.location?.lat, place.geometry?.location?.lng],
    imageUrl: details?.photos?.[0] && googleKey
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${details.photos[0].photo_reference}&key=${googleKey}`
      : '',
    description: generateRestaurantDescription(details?.types || place.types),
    vegetarian: isVegetarianFriendly(details?.types || place.types, details?.name || place.name),
    halal: isHalalFriendly(details?.name || place.name),
    reviews: details?.reviews || [],
    openingHours: details?.opening_hours || null,
    facilities: extractRestaurantFacilities(details?.types || place.types)
  };

  return restaurant;
}

// Extract cuisine type from Google Places types
function extractCuisine(types) {
  const cuisineMap = {
    'meal_takeaway': 'Fast Food',
    'meal_delivery': 'Fast Food',
    'bakery': 'Bakery',
    'cafe': 'Cafe',
    'bar': 'Bar',
    'night_club': 'Night Club',
    'food': 'Multi-Cuisine'
  };

  for (const type of types) {
    if (cuisineMap[type]) {
      return cuisineMap[type];
    }
  }

  // Check for specific cuisine keywords
  const cuisineKeywords = {
    'indian': 'Indian',
    'chinese': 'Chinese',
    'italian': 'Italian',
    'mexican': 'Mexican',
    'thai': 'Thai',
    'japanese': 'Japanese',
    'continental': 'Continental'
  };

  for (const [keyword, cuisine] of Object.entries(cuisineKeywords)) {
    if (types.some(type => type.includes(keyword))) {
      return cuisine;
    }
  }

  return 'Multi-Cuisine';
}

// Generate restaurant description
function generateRestaurantDescription(types) {
  const descriptions = {
    'meal_takeaway': 'Quick service restaurant with takeaway options',
    'meal_delivery': 'Restaurant offering home delivery',
    'bakery': 'Fresh bakery with breads, pastries, and desserts',
    'cafe': 'Casual cafe serving coffee, snacks, and light meals',
    'bar': 'Bar and restaurant with alcoholic beverages',
    'restaurant': 'Full-service restaurant with diverse menu'
  };

  for (const type of types) {
    if (descriptions[type]) {
      return descriptions[type];
    }
  }

  return 'Restaurant offering various cuisines and dining options';
}

// Check if restaurant is vegetarian-friendly
function isVegetarianFriendly(types, name) {
  const nameText = name.toLowerCase();
  const vegKeywords = ['veg', 'vegetarian', 'pure veg', 'sattvik'];
  
  return vegKeywords.some(keyword => nameText.includes(keyword)) ||
         types.includes('vegetarian_restaurant');
}

// Check if restaurant is halal-friendly
function isHalalFriendly(name) {
  const nameText = name.toLowerCase();
  const halalKeywords = ['halal', 'muslim', 'islamic'];
  
  return halalKeywords.some(keyword => nameText.includes(keyword));
}

// Extract restaurant facilities
function extractRestaurantFacilities(types) {
  const facilities = [];
  
  if (types.includes('meal_delivery')) facilities.push('Home Delivery');
  if (types.includes('meal_takeaway')) facilities.push('Takeaway');
  if (types.includes('wheelchair_accessible_entrance')) facilities.push('Wheelchair Accessible');
  if (types.includes('bar')) facilities.push('Bar');
  if (types.includes('parking')) facilities.push('Parking');
  
  return facilities.length > 0 ? facilities : ['Dine-in'];
}

// Enhanced mock restaurants with realistic data
function getEnhancedMockRestaurants(destination) {
  const destinationRestaurants = {
    'mumbai': [
      {
        id: 'mock_1',
        name: 'Trishna Restaurant',
        rating: 4.6,
        priceRange: 800,
        address: 'Kala Ghoda, Mumbai',
        cuisine: 'Seafood',
        coordinates: [18.9289, 72.8281],
        imageUrl: '',
        description: 'Famous for authentic coastal cuisine and seafood',
        vegetarian: false,
        halal: true,
        reviews: [],
        facilities: ['Dine-in', 'Takeaway']
      },
      {
        id: 'mock_2',
        name: 'Cafe Mondegar',
        rating: 4.2,
        priceRange: 400,
        address: 'Colaba, Mumbai',
        cuisine: 'Continental',
        coordinates: [18.9217, 72.8331],
        imageUrl: '',
        description: 'Historic cafe with Continental and Indian dishes',
        vegetarian: true,
        halal: false,
        reviews: [],
        facilities: ['Dine-in', 'Bar']
      },
      {
        id: 'mock_3',
        name: 'Bademiya',
        rating: 4.4,
        priceRange: 300,
        address: 'Colaba Causeway, Mumbai',
        cuisine: 'Mughlai',
        coordinates: [18.9217, 72.8331],
        imageUrl: '',
        description: 'Famous street food joint for kebabs and rolls',
        vegetarian: false,
        halal: true,
        reviews: [],
        facilities: ['Takeaway', 'Street Food']
      }
    ],
    'delhi': [
      {
        id: 'mock_1',
        name: 'Karim\'s',
        rating: 4.5,
        priceRange: 600,
        address: 'Jama Masjid, Delhi',
        cuisine: 'Mughlai',
        coordinates: [28.6488, 77.2090],
        imageUrl: '',
        description: 'Legendary Mughlai restaurant since 1913',
        vegetarian: false,
        halal: true,
        reviews: [],
        facilities: ['Dine-in', 'Takeaway']
      },
      {
        id: 'mock_2',
        name: 'Indian Accent',
        rating: 4.8,
        priceRange: 2500,
        address: 'The Lodhi, New Delhi',
        cuisine: 'Modern Indian',
        coordinates: [28.5944, 77.1855],
        imageUrl: '',
        description: 'Award-winning modern Indian cuisine',
        vegetarian: true,
        halal: false,
        reviews: [],
        facilities: ['Fine Dining', 'Bar']
      }
    ],
    'goa': [
      {
        id: 'mock_1',
        name: 'Ritz Classic',
        rating: 4.3,
        priceRange: 500,
        address: 'Panjim, Goa',
        cuisine: 'Goan',
        coordinates: [15.4986, 73.9108],
        imageUrl: '',
        description: 'Authentic Goan cuisine with Portuguese influences',
        vegetarian: false,
        halal: false,
        reviews: [],
        facilities: ['Dine-in', 'Beer']
      }
    ]
  };

  return destinationRestaurants[destination.toLowerCase()] || [
    {
      id: 'mock_1',
      name: `${destination} Restaurant`,
      rating: 4.2,
      priceRange: 500,
      address: `${destination}, India`,
      cuisine: 'Multi-Cuisine',
      coordinates: [28.6139, 77.2090],
      imageUrl: '',
      description: `Popular restaurant in ${destination}`,
      vegetarian: true,
      halal: false,
      reviews: [],
      facilities: ['Dine-in']
    }
  ];
}

// Generate personalized food recommendations
function generatePersonalizedFoodRecommendations(restaurants, userProfile) {
  const { dietary, budget, cuisine } = userProfile;

  let personalized = [...restaurants];

  // Filter by dietary restrictions
  if (dietary) {
    const restrictions = dietary.split(',').map(d => d.trim().toLowerCase());
    personalized = personalized.filter(restaurant => {
      if (restrictions.includes('vegetarian') && !restaurant.vegetarian) return false;
      if (restrictions.includes('halal') && !restaurant.halal) return false;
      return true;
    });
  }

  // Filter by budget
  const budgetRanges = {
    'low': { min: 0, max: 400 },
    'medium': { min: 0, max: 800 },
    'high': { min: 0, max: 1500 },
    'luxury': { min: 0, max: 5000 }
  };
  const range = budgetRanges[budget] || budgetRanges.medium;
  personalized = personalized.filter(restaurant => 
    restaurant.priceRange >= range.min && restaurant.priceRange <= range.max
  );

  // Filter by cuisine preferences
  if (cuisine) {
    const cuisines = cuisine.split(',').map(c => c.trim().toLowerCase());
    personalized = personalized.filter(restaurant => 
      cuisines.some(c => restaurant.cuisine.toLowerCase().includes(c))
    );
  }

  // Score and rank
  return personalized
    .map(restaurant => ({
      ...restaurant,
      personalizedScore: calculateFoodScore(restaurant, userProfile)
    }))
    .sort((a, b) => b.personalizedScore - a.personalizedScore)
    .slice(0, 15);
}

// Calculate personalized score for restaurant
function calculateFoodScore(restaurant, userProfile) {
  let score = restaurant.rating * 0.4; // Base rating weight

  // Price matching
  const budgetRanges = {
    'low': 400, 'medium': 800, 'high': 1500, 'luxury': 5000
  };
  const maxBudget = budgetRanges[userProfile.budget] || 800;
  if (restaurant.priceRange <= maxBudget) {
    score += 0.3;
  }

  // Dietary matching
  if (userProfile.dietary) {
    const restrictions = userProfile.dietary.split(',').map(d => d.trim().toLowerCase());
    if (restrictions.includes('vegetarian') && restaurant.vegetarian) {
      score += 0.2;
    }
    if (restrictions.includes('halal') && restaurant.halal) {
      score += 0.2;
    }
  }

  // Cuisine matching
  if (userProfile.cuisine) {
    const cuisines = userProfile.cuisine.split(',').map(c => c.trim().toLowerCase());
    if (cuisines.some(c => restaurant.cuisine.toLowerCase().includes(c))) {
      score += 0.1;
    }
  }

  return score;
}

// Generate food insights
function generateFoodInsights(restaurants) {
  const insights = {
    cuisines: {},
    priceDistribution: {},
    averageRating: 0,
    topRated: [],
    budgetOptions: [],
    dietaryFriendly: {
      vegetarian: 0,
      halal: 0
    }
  };

  // Cuisine distribution
  restaurants.forEach(restaurant => {
    insights.cuisines[restaurant.cuisine] = (insights.cuisines[restaurant.cuisine] || 0) + 1;
  });

  // Average rating
  insights.averageRating = restaurants.reduce((sum, r) => sum + r.rating, 0) / restaurants.length;

  // Top rated
  insights.topRated = restaurants
    .filter(r => r.rating >= 4.5)
    .slice(0, 5)
    .map(r => ({ name: r.name, rating: r.rating, cuisine: r.cuisine }));

  // Budget options
  insights.budgetOptions = restaurants
    .filter(r => r.priceRange <= 500)
    .slice(0, 5)
    .map(r => ({ name: r.name, price: r.priceRange, rating: r.rating }));

  // Dietary friendly count
  insights.dietaryFriendly.vegetarian = restaurants.filter(r => r.vegetarian).length;
  insights.dietaryFriendly.halal = restaurants.filter(r => r.halal).length;

  return insights;
}

// Generate food recommendations
function generateFoodRecommendations(restaurants) {
  const recommendations = {
    topRated: restaurants.filter(r => r.rating >= 4.5).slice(0, 5),
    budgetFriendly: restaurants.filter(r => r.priceRange <= 500).slice(0, 5),
    vegetarian: restaurants.filter(r => r.vegetarian).slice(0, 5),
    halal: restaurants.filter(r => r.halal).slice(0, 5),
    local: restaurants.filter(r => r.cuisine === 'Local' || r.cuisine === 'Indian').slice(0, 5)
  };

  return recommendations;
}

// Calculate food quality score
function calculateFoodQualityScore(restaurant, sentimentAnalysis) {
  let score = restaurant.rating * 0.6; // Base rating weight
  
  if (sentimentAnalysis.overallSentiment === 'positive') {
    score += 0.3;
  } else if (sentimentAnalysis.overallSentiment === 'negative') {
    score -= 0.3;
  }
  
  return Math.min(Math.max(score, 0), 5);
}

// Generate food recommendation
function generateFoodRecommendation(restaurant, sentimentAnalysis) {
  if (sentimentAnalysis.overallSentiment === 'positive' && restaurant.rating >= 4.3) {
    return 'Highly recommended - excellent food quality and service';
  } else if (sentimentAnalysis.overallSentiment === 'positive') {
    return 'Good choice - positive reviews and decent ratings';
  } else if (sentimentAnalysis.overallSentiment === 'negative') {
    return 'Consider alternatives - mixed reviews reported';
  }
  return 'Average option - moderate reviews';
}

// Generate food sentiment insights
function generateFoodSentimentInsights(restaurants) {
  const insights = {
    overallSentiment: 'positive',
    averageRating: 0,
    topPerformers: [],
    areasForImprovement: [],
    recommendations: []
  };

  // Calculate overall sentiment
  const positiveCount = restaurants.filter(r => r.sentimentAnalysis.overallSentiment === 'positive').length;
  const negativeCount = restaurants.filter(r => r.sentimentAnalysis.overallSentiment === 'negative').length;
  
  if (positiveCount > negativeCount) {
    insights.overallSentiment = 'positive';
  } else if (negativeCount > positiveCount) {
    insights.overallSentiment = 'negative';
  } else {
    insights.overallSentiment = 'neutral';
  }

  // Average rating
  insights.averageRating = restaurants.reduce((sum, r) => sum + r.rating, 0) / restaurants.length;

  // Top performers
  insights.topPerformers = restaurants
    .filter(r => r.sentimentAnalysis.overallSentiment === 'positive' && r.rating >= 4.3)
    .slice(0, 3)
    .map(r => ({ name: r.name, rating: r.rating, sentiment: r.sentimentAnalysis.overallSentiment }));

  // Areas for improvement
  insights.areasForImprovement = restaurants
    .filter(r => r.sentimentAnalysis.overallSentiment === 'negative')
    .slice(0, 3)
    .map(r => ({ name: r.name, issues: r.sentimentAnalysis.commonComplaints }));

  return insights;
}

// Calculate food recommendation confidence
function calculateFoodRecommendationConfidence(recommendations) {
  const totalRecommendations = Object.values(recommendations).flat().length;
  const highRatedCount = Object.values(recommendations).flat().filter(r => r.rating >= 4.3).length;
  
  return Math.round((highRatedCount / totalRecommendations) * 100);
}

