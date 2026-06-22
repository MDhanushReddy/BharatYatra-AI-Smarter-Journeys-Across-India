import axios from 'axios';
import aiRecommendationService from '../services/aiRecommendationService.js';

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';
const MAPMYINDIA_BASE_URL = 'https://atlas.mapmyindia.com/api/places';
const TRAVEL_ADVISOR_BASE_URL = 'https://travel-advisor.p.rapidapi.com';

const parseNumber = (v, fb) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

// Enhanced attractions search with AI recommendations
export const searchAttractions = async (req, res) => {
  try {
    const {
      destination = '',
      lat,
      lng,
      radius = '10000',
      minRating = '4',
      maxResults = '20',
      interests = '',
      budget = 'medium'
    } = req.query;

    console.log('AI Attractions search request:', { 
      destination, lat, lng, radius, minRating, maxResults, interests, budget 
    });

    // Get base attractions using existing logic
    const baseAttractions = await getBaseAttractions(destination, lat, lng, radius, minRating, maxResults);
    
    if (!baseAttractions || baseAttractions.length === 0) {
      return res.json({ 
        attractions: [], 
        recommendations: [], 
        source: 'fallback',
        message: 'No attractions found for the given criteria'
      });
    }

    // Apply AI-powered content-based filtering if interests are provided
    let recommendations = baseAttractions;
    if (interests) {
      const userInterests = interests.split(',').map(i => i.trim());
      recommendations = aiRecommendationService.contentBasedRecommendation(userInterests, baseAttractions);
    }

    // Filter by budget if specified
    if (budget !== 'any') {
      recommendations = filterByBudget(recommendations, budget);
    }

    // Add AI-generated insights
    const insights = generateAttractionInsights(recommendations);

    res.json({
      attractions: recommendations.slice(0, parseNumber(maxResults, 20)),
      recommendations: insights,
      totalFound: baseAttractions.length,
      filteredCount: recommendations.length,
      source: 'ai_enhanced',
      algorithm: 'content_based_filtering'
    });

  } catch (error) {
    console.error('AI Attractions search error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch attractions',
      message: error.message,
      attractions: []
    });
  }
};

// Get AI-powered recommendations based on user profile
export const getRecommendedAttractions = async (req, res) => {
  try {
    const {
      destination,
      userInterests = [],
      tripType = 'leisure',
      groupType = 'couple',
      budget = 'medium',
      duration = 3,
      previousVisits = []
    } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    // Get base attractions
    const baseAttractions = await getBaseAttractions(destination, null, null, '15000', '3', '50');
    
    if (!baseAttractions || baseAttractions.length === 0) {
      return res.json({ 
        recommendations: [], 
        message: 'No attractions found for the destination'
      });
    }

    // Create user profile for recommendations
    const userProfile = {
      interests: userInterests,
      tripType: tripType,
      groupType: groupType,
      budget: budget,
      duration: duration,
      previousVisits: previousVisits
    };

    // Apply multiple AI algorithms for comprehensive recommendations
    const recommendations = await generateComprehensiveRecommendations(baseAttractions, userProfile);

    res.json({
      recommendations: recommendations,
      userProfile: userProfile,
      totalAnalyzed: baseAttractions.length,
      algorithm: 'multi_ai_ensemble',
      confidence: calculateRecommendationConfidence(recommendations)
    });

  } catch (error) {
    console.error('AI Recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
};

// Helper function to get base attractions using existing API logic
async function getBaseAttractions(destination, lat, lng, radius, minRating, maxResults) {
  try {
    // Try Travel Advisor first
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (rapidApiKey && destination) {
      try {
        const locationSearchResponse = await axios.get(`${TRAVEL_ADVISOR_BASE_URL}/locations/search`, {
          params: { query: destination, limit: 1 },
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
          },
          timeout: 10000
        });

        const locationId = locationSearchResponse.data?.data?.[0]?.location_id;
        if (locationId) {
          const travelAdvisorResponse = await axios.get(`${TRAVEL_ADVISOR_BASE_URL}/attractions/list`, {
            params: {
              location_id: locationId,
              currency: 'INR',
              lang: 'en_US',
              lunit: 'km',
              limit: parseNumber(maxResults, 20)
            },
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
            },
            timeout: 10000
          });

          const attractions = travelAdvisorResponse.data?.data || [];
          const minR = parseNumber(minRating, 0);
          
          const formattedAttractions = attractions
            .filter(attraction => (attraction.rating || 0) >= minR)
            .map((attraction, idx) => ({
              id: attraction.location_id || idx,
              name: attraction.name || `Attraction ${idx + 1}`,
              rating: attraction.rating || 0,
              price: attraction.price_level ? attraction.price_level * 100 : 0,
              duration: '1-2 hours',
              description: attraction.description || '',
              coordinates: attraction.latitude && attraction.longitude 
                ? [parseFloat(attraction.latitude), parseFloat(attraction.longitude)]
                : [28.6139, 77.2090],
              imageUrl: attraction.photo?.images?.large?.url || '',
              category: this.categorizeAttraction(attraction.name, attraction.description),
              facilities: this.extractFacilities(attraction.description),
              city: destination,
              state: 'India',
              reviews: attraction.num_reviews || 0
            }));

          if (formattedAttractions.length > 0) {
            return formattedAttractions;
          }
        }
      } catch (error) {
        console.log('Travel Advisor API failed, trying alternatives');
      }
    }

    // Fallback to enhanced mock data
    return getEnhancedMockAttractions(destination);

  } catch (error) {
    console.error('Error getting base attractions:', error);
    return getEnhancedMockAttractions(destination);
  }
}

// Enhanced mock attractions with more realistic data
function getEnhancedMockAttractions(destination) {
  const destinationAttractions = {
    'mumbai': [
      { 
        id: 1, 
        name: 'Gateway of India', 
        rating: 4.5, 
        price: 0, 
        duration: '1-2 hours', 
        description: 'Iconic monument and historic gateway to Mumbai', 
        coordinates: [18.9220, 72.8347], 
        category: 'monument', 
        facilities: ['Photography', 'Boat Rides', 'Shopping'],
        imageUrl: '',
        reviews: 12500
      },
      { 
        id: 2, 
        name: 'Marine Drive', 
        rating: 4.3, 
        price: 0, 
        duration: '2-3 hours', 
        description: 'Famous promenade along the Arabian Sea', 
        coordinates: [18.9445, 72.8238], 
        category: 'scenic', 
        facilities: ['Walking', 'Photography', 'Food Stalls'],
        imageUrl: '',
        reviews: 8900
      },
      { 
        id: 3, 
        name: 'Elephanta Caves', 
        rating: 4.4, 
        price: 250, 
        duration: '3-4 hours', 
        description: 'Ancient rock-cut caves with Hindu sculptures', 
        coordinates: [18.9585, 72.9308], 
        category: 'heritage', 
        facilities: ['Boat Transport', 'Guided Tours', 'Museum'],
        imageUrl: '',
        reviews: 6700
      },
      { 
        id: 4, 
        name: 'Chhatrapati Shivaji Terminus', 
        rating: 4.6, 
        price: 0, 
        duration: '1 hour', 
        description: 'UNESCO World Heritage railway station', 
        coordinates: [18.9398, 72.8355], 
        category: 'heritage', 
        facilities: ['Photography', 'Architecture Tour', 'Shopping'],
        imageUrl: '',
        reviews: 5400
      },
      { 
        id: 5, 
        name: 'Haji Ali Dargah', 
        rating: 4.2, 
        price: 0, 
        duration: '1-2 hours', 
        description: 'Famous mosque on an islet', 
        coordinates: [18.9833, 72.8167], 
        category: 'religious', 
        facilities: ['Photography', 'Prayer', 'Cultural Experience'],
        imageUrl: '',
        reviews: 4300
      }
    ],
    'delhi': [
      { 
        id: 1, 
        name: 'Red Fort', 
        rating: 4.6, 
        price: 50, 
        duration: '2-3 hours', 
        description: 'Historic fort and UNESCO World Heritage Site', 
        coordinates: [28.6562, 77.2410], 
        category: 'heritage', 
        facilities: ['Audio Guide', 'Museum', 'Photography'],
        imageUrl: '',
        reviews: 15200
      },
      { 
        id: 2, 
        name: 'India Gate', 
        rating: 4.4, 
        price: 0, 
        duration: '1-2 hours', 
        description: 'War memorial and national monument', 
        coordinates: [28.6129, 77.2295], 
        category: 'monument', 
        facilities: ['Photography', 'Walking', 'Evening Light Show'],
        imageUrl: '',
        reviews: 11800
      },
      { 
        id: 3, 
        name: 'Qutub Minar', 
        rating: 4.5, 
        price: 40, 
        duration: '2-3 hours', 
        description: 'Tallest brick minaret in the world', 
        coordinates: [28.5244, 77.1855], 
        category: 'heritage', 
        facilities: ['Photography', 'Guided Tours', 'Archaeological Site'],
        imageUrl: '',
        reviews: 9200
      }
    ],
    'goa': [
      { 
        id: 1, 
        name: 'Calangute Beach', 
        rating: 4.2, 
        price: 0, 
        duration: 'Full day', 
        description: 'Popular beach destination with water sports', 
        coordinates: [15.5385, 73.7553], 
        category: 'beach', 
        facilities: ['Water Sports', 'Beach Shacks', 'Shopping'],
        imageUrl: '',
        reviews: 8900
      },
      { 
        id: 2, 
        name: 'Old Goa Churches', 
        rating: 4.6, 
        price: 0, 
        duration: '2-3 hours', 
        description: 'UNESCO World Heritage churches', 
        coordinates: [15.4986, 73.9108], 
        category: 'heritage', 
        facilities: ['Photography', 'Guided Tours', 'Religious Sites'],
        imageUrl: '',
        reviews: 5600
      }
    ]
  };

  return destinationAttractions[destination.toLowerCase()] || [
    {
      id: 1,
      name: `${destination} Tourist Spot`,
      rating: 4.2,
      price: 0,
      duration: '2-3 hours',
      description: `A popular tourist destination in ${destination}`,
      coordinates: [28.6139, 77.2090],
      imageUrl: '',
      category: 'attraction',
      facilities: ['Parking', 'Restrooms', 'Guided Tours'],
      reviews: 1000
    }
  ];
}

// Filter attractions by budget
function filterByBudget(attractions, budget) {
  const budgetRanges = {
    'low': { min: 0, max: 100 },
    'medium': { min: 0, max: 500 },
    'high': { min: 0, max: 2000 },
    'luxury': { min: 0, max: 10000 }
  };

  const range = budgetRanges[budget] || budgetRanges.medium;
  return attractions.filter(attraction => 
    attraction.price >= range.min && attraction.price <= range.max
  );
}

// Generate comprehensive recommendations using multiple AI algorithms
async function generateComprehensiveRecommendations(attractions, userProfile) {
  const recommendations = {
    topRated: attractions.filter(a => a.rating >= 4.5).slice(0, 5),
    budgetFriendly: filterByBudget(attractions, userProfile.budget).slice(0, 5),
    contentBased: aiRecommendationService.contentBasedRecommendation(userProfile.interests, attractions).slice(0, 5),
    trending: attractions.filter(a => a.reviews > 5000).slice(0, 5),
    personalized: []
  };

  // Generate personalized recommendations based on user profile
  recommendations.personalized = generatePersonalizedRecommendations(attractions, userProfile);

  return recommendations;
}

// Generate personalized recommendations
function generatePersonalizedRecommendations(attractions, userProfile) {
  let personalized = [...attractions];

  // Apply trip type preferences
  if (userProfile.tripType === 'adventure') {
    personalized = personalized.filter(a => 
      ['adventure', 'nature', 'beach'].includes(a.category)
    );
  } else if (userProfile.tripType === 'cultural') {
    personalized = personalized.filter(a => 
      ['heritage', 'cultural', 'monument'].includes(a.category)
    );
  } else if (userProfile.tripType === 'relaxation') {
    personalized = personalized.filter(a => 
      ['beach', 'nature', 'scenic'].includes(a.category)
    );
  }

  // Apply group type preferences
  if (userProfile.groupType === 'family') {
    personalized = personalized.filter(a => 
      a.facilities.includes('Parking') || a.facilities.includes('Restrooms')
    );
  } else if (userProfile.groupType === 'solo') {
    personalized = personalized.filter(a => a.price <= 500); // Budget-friendly for solo travelers
  }

  // Score and rank
  return personalized
    .map(attraction => ({
      ...attraction,
      personalizedScore: calculatePersonalizedScore(attraction, userProfile)
    }))
    .sort((a, b) => b.personalizedScore - a.personalizedScore)
    .slice(0, 10);
}

// Calculate personalized score for attraction
function calculatePersonalizedScore(attraction, userProfile) {
  let score = attraction.rating * 0.4; // Base rating weight

  // Interest matching
  if (userProfile.interests.some(interest => 
    attraction.name.toLowerCase().includes(interest.toLowerCase()) ||
    attraction.description.toLowerCase().includes(interest.toLowerCase())
  )) {
    score += 1;
  }

  // Budget matching
  const budgetRanges = {
    'low': 100, 'medium': 500, 'high': 2000, 'luxury': 10000
  };
  const maxBudget = budgetRanges[userProfile.budget] || 500;
  if (attraction.price <= maxBudget) {
    score += 0.5;
  }

  // Duration matching
  if (userProfile.duration <= 2 && attraction.duration.includes('1-2 hours')) {
    score += 0.3;
  } else if (userProfile.duration >= 5 && attraction.duration.includes('Full day')) {
    score += 0.3;
  }

  return score;
}

// Generate attraction insights
function generateAttractionInsights(attractions) {
  const insights = {
    categories: {},
    averageRating: 0,
    priceRange: { min: 0, max: 0 },
    topFacilities: [],
    recommendations: []
  };

  // Category distribution
  attractions.forEach(attraction => {
    insights.categories[attraction.category] = (insights.categories[attraction.category] || 0) + 1;
  });

  // Average rating
  insights.averageRating = attractions.reduce((sum, a) => sum + a.rating, 0) / attractions.length;

  // Price range
  const prices = attractions.map(a => a.price).filter(p => p > 0);
  if (prices.length > 0) {
    insights.priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }

  // Top facilities
  const facilityCount = {};
  attractions.forEach(attraction => {
    attraction.facilities.forEach(facility => {
      facilityCount[facility] = (facilityCount[facility] || 0) + 1;
    });
  });
  insights.topFacilities = Object.entries(facilityCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([facility]) => facility);

  // Generate recommendations
  if (insights.categories.beach) {
    insights.recommendations.push('Beach destinations available - perfect for relaxation');
  }
  if (insights.categories.heritage) {
    insights.recommendations.push('Rich cultural heritage sites to explore');
  }
  if (insights.averageRating >= 4.3) {
    insights.recommendations.push('High-rated attractions with excellent visitor satisfaction');
  }

  return insights;
}

// Calculate recommendation confidence
function calculateRecommendationConfidence(recommendations) {
  const totalRecommendations = Object.values(recommendations).flat().length;
  const highRatedCount = Object.values(recommendations).flat().filter(r => r.rating >= 4.3).length;
  
  return Math.round((highRatedCount / totalRecommendations) * 100);
}
