import aiRecommendationService from '../services/aiRecommendationService.js';
import routeOptimizationService from '../services/routeOptimizationService.js';
import { sendSuccess, sendError, sendValidationError } from '../utils/responseHelper.js';
import { validateRequestBody, validateRequiredFields, isValidDate, isValidDateRange } from '../utils/requestValidator.js';

// Generate AI-powered itinerary using constraint-based scheduling
export const generateItinerary = async (req, res) => {
  try {
    // Validate request body
    if (!validateRequestBody(req, res)) return;

    // Validate required fields
    if (!validateRequiredFields(req, res, ['destination', 'startDate', 'endDate'])) return;

    const {
      destination,
      startDate,
      endDate,
      attractions = [],
      accommodation = null,
      userPreferences = {},
      tripDetails = {}
    } = req.body;

    // Validate date format
    if (!isValidDate(startDate)) {
      return sendValidationError(res, ['startDate must be in YYYY-MM-DD format']);
    }

    if (!isValidDate(endDate)) {
      return sendValidationError(res, ['endDate must be in YYYY-MM-DD format']);
    }

    // Validate date range
    if (!isValidDateRange(startDate, endDate)) {
      return sendValidationError(res, ['endDate must be after or equal to startDate']);
    }

    console.log('AI Itinerary generation request:', { 
      destination, startDate, endDate, attractionsCount: attractions.length, hasAccommodation: !!accommodation 
    });

    // Calculate trip duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // This check is now redundant (handled by isValidDateRange), but keeping for safety
    if (days <= 0) {
      return sendValidationError(res, ['End date must be after start date']);
    }

    // Generate daily itinerary using AI scheduling
    const itinerary = aiRecommendationService.generateOptimalItinerary(
      attractions,
      accommodation,
      days,
      userPreferences
    );

    // Optimize routes for each day
    const optimizedItinerary = await optimizeDailyRoutes(itinerary, accommodation);

    // Generate itinerary insights
    const insights = generateItineraryInsights(optimizedItinerary, tripDetails);

    // Generate recommendations
    const recommendations = generateItineraryRecommendations(optimizedItinerary, userPreferences);

    return sendSuccess(res, {
      itinerary: optimizedItinerary,
      insights: insights,
      recommendations: recommendations,
      tripSummary: {
        destination: destination,
        duration: days,
        totalAttractions: attractions.length,
        startDate: startDate,
        endDate: endDate
      }
    }, {
      algorithm: 'constraint_based_scheduling'
    });

  } catch (error) {
    console.error('Itinerary generation error:', error);
    sendError(res, 'Failed to generate itinerary', 'ITINERARY_GENERATION_ERROR', error.message, 500);
  }
};

// Optimize existing itinerary
export const optimizeItinerary = async (req, res) => {
  try {
    // Validate request body
    if (!validateRequestBody(req, res)) return;

    // Validate required fields
    if (!validateRequiredFields(req, res, ['itinerary'])) return;

    const {
      itinerary = [],
      optimizationCriteria = 'time', // 'time', 'distance', 'balanced'
      constraints = {}
    } = req.body;

    // Validate itinerary is an array
    if (!Array.isArray(itinerary) || itinerary.length === 0) {
      return sendValidationError(res, ['itinerary must be a non-empty array']);
    }

    console.log('Itinerary optimization request:', { 
      days: itinerary.length, 
      optimizationCriteria,
      constraints 
    });

    // Optimize each day's route
    const optimizedItinerary = await Promise.all(
      itinerary.map(async (day) => {
        if (!day.attractions || day.attractions.length === 0) {
          return day;
        }

        // Apply route optimization
        const optimizedRoute = await routeOptimizationService.optimizeRouteWithRealTime(
          day.attractions,
          null // No accommodation for individual day optimization
        );

        return {
          ...day,
          optimizedRoute: optimizedRoute.route,
          routeMetrics: optimizedRoute,
          optimizationApplied: true
        };
      })
    );

    // Calculate overall optimization metrics
    const optimizationMetrics = calculateOptimizationMetrics(itinerary, optimizedItinerary);

    return sendSuccess(res, {
      originalItinerary: itinerary,
      optimizedItinerary: optimizedItinerary,
      optimizationMetrics: optimizationMetrics
    }, {
      criteria: optimizationCriteria,
      algorithm: 'dijkstra_optimization'
    });

  } catch (error) {
    console.error('Itinerary optimization error:', error);
    sendError(res, 'Failed to optimize itinerary', 'OPTIMIZATION_ERROR', error.message, 500);
  }
};

// Get itinerary recommendations
export const getItineraryRecommendations = async (req, res) => {
  try {
    // Validate required query parameters
    if (!validateRequiredQueryParams(req, res, ['destination'])) return;

    const {
      destination,
      days = 3,
      tripType = 'leisure',
      groupType = 'couple',
      interests = [],
      budget = 'medium'
    } = req.query;

    // Validate days is a valid number
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 30) {
      return sendValidationError(res, ['days must be a number between 1 and 30']);
    }

    console.log('Itinerary recommendations request:', { 
      destination, days, tripType, groupType, interests, budget 
    });

    // Generate sample itinerary based on preferences
    const recommendations = await generateSampleItineraries(
      destination,
      parseInt(days),
      { tripType, groupType, interests: interests.split(','), budget }
    );

    return sendSuccess(res, {
      recommendations: recommendations,
      preferences: { tripType, groupType, interests, budget }
    }, {
      destination: destination,
      days: daysNum
    });

  } catch (error) {
    console.error('Itinerary recommendations error:', error);
    sendError(res, 'Failed to generate itinerary recommendations', 'RECOMMENDATIONS_ERROR', error.message, 500);
  }
};

// Optimize daily routes
async function optimizeDailyRoutes(itinerary, accommodation) {
  const optimizedDays = await Promise.all(
    itinerary.map(async (day, index) => {
      if (!day.attractions || day.attractions.length === 0) {
        return day;
      }

      try {
        // Optimize route for this day
        const optimizedRoute = await routeOptimizationService.optimizeRouteWithRealTime(
          day.attractions,
          accommodation
        );

        // Update attraction order based on optimization
        const optimizedAttractions = optimizedRoute.route.map(routeSegment => routeSegment.to);
        
        return {
          ...day,
          attractions: optimizedAttractions,
          routeOptimization: {
            totalDistance: optimizedRoute.totalDistance,
            totalTime: optimizedRoute.totalTime,
            efficiency: calculateDayEfficiency(day.attractions, optimizedRoute)
          }
        };
      } catch (error) {
        console.error(`Error optimizing day ${index + 1}:`, error);
        return day; // Return original day if optimization fails
      }
    })
  );

  return optimizedDays;
}

// Generate itinerary insights
function generateItineraryInsights(itinerary) {
  const insights = {
    efficiency: {},
    diversity: {},
    balance: {},
    recommendations: []
  };

  // Calculate efficiency metrics
  const totalAttractions = itinerary.reduce((sum, day) => sum + day.attractions.length, 0);
  const totalDays = itinerary.length;
  const avgAttractionsPerDay = totalAttractions / totalDays;

  insights.efficiency = {
    totalAttractions: totalAttractions,
    averagePerDay: Math.round(avgAttractionsPerDay * 10) / 10,
    efficiency: avgAttractionsPerDay <= 4 ? 'good' : avgAttractionsPerDay <= 6 ? 'moderate' : 'busy'
  };

  // Analyze diversity
  const allCategories = itinerary.flatMap(day => 
    day.attractions.map(attraction => attraction.category)
  );
  const uniqueCategories = [...new Set(allCategories)];
  
  insights.diversity = {
    categoryCount: uniqueCategories.length,
    categories: uniqueCategories,
    diversity: uniqueCategories.length >= 3 ? 'high' : uniqueCategories.length >= 2 ? 'moderate' : 'low'
  };

  // Analyze balance
  const dayBalances = itinerary.map(day => ({
    day: day.day,
    attractionCount: day.attractions.length,
    estimatedDuration: day.attractions.reduce((sum, attr) => sum + parseDuration(attr.duration), 0),
    balance: day.attractions.length <= 4 ? 'good' : day.attractions.length <= 6 ? 'moderate' : 'busy'
  }));

  insights.balance = {
    dailyBalances: dayBalances,
    overallBalance: dayBalances.every(day => day.balance === 'good') ? 'excellent' :
                   dayBalances.every(day => day.balance !== 'busy') ? 'good' : 'needs_optimization'
  };

  // Generate recommendations
  if (insights.efficiency.efficiency === 'busy') {
    insights.recommendations.push({
      type: 'efficiency',
      message: 'Consider reducing attractions per day for a more relaxed experience',
      priority: 'medium'
    });
  }

  if (insights.diversity.diversity === 'low') {
    insights.recommendations.push({
      type: 'diversity',
      message: 'Add more variety to your itinerary with different types of attractions',
      priority: 'low'
    });
  }

  if (insights.balance.overallBalance === 'needs_optimization') {
    insights.recommendations.push({
      type: 'balance',
      message: 'Redistribute attractions across days for better balance',
      priority: 'high'
    });
  }

  return insights;
}

// Generate itinerary recommendations
function generateItineraryRecommendations(itinerary, userPreferences) {
  const recommendations = {
    timeManagement: [],
    experience: [],
    logistics: [],
    alternatives: []
  };

  // Time management recommendations
  itinerary.forEach(day => {
    const totalDuration = day.attractions.reduce((sum, attr) => sum + parseDuration(attr.duration), 0);
    
    if (totalDuration > 8) {
      recommendations.timeManagement.push({
        day: day.day,
        message: `Day ${day.day} is packed with activities (${totalDuration} hours). Consider reducing attractions or extending your stay.`,
        priority: 'high'
      });
    } else if (totalDuration < 4) {
      recommendations.timeManagement.push({
        day: day.day,
        message: `Day ${day.day} has light activities (${totalDuration} hours). You could add more attractions or have a relaxing day.`,
        priority: 'low'
      });
    }
  });

  // Experience recommendations
  const categories = [...new Set(itinerary.flatMap(day => day.attractions.map(attr => attr.category)))];
  
  if (!categories.includes('cultural') && userPreferences.interests?.includes('culture')) {
    recommendations.experience.push({
      type: 'cultural',
      message: 'Consider adding cultural attractions like museums or historical sites',
      priority: 'medium'
    });
  }

  if (!categories.includes('nature') && userPreferences.interests?.includes('nature')) {
    recommendations.experience.push({
      type: 'nature',
      message: 'Consider adding nature attractions like parks or scenic viewpoints',
      priority: 'medium'
    });
  }

  // Logistics recommendations
  if (userPreferences.groupType === 'family') {
    recommendations.logistics.push({
      type: 'family',
      message: 'Ensure attractions are family-friendly and have facilities like restrooms and parking',
      priority: 'medium'
    });
  }

  if (userPreferences.tripType === 'budget') {
    recommendations.logistics.push({
      type: 'budget',
      message: 'Consider mixing free attractions with paid ones to manage costs',
      priority: 'high'
    });
  }

  return recommendations;
}

// Generate sample itineraries
async function generateSampleItineraries(destination, days, preferences) {
  const sampleItineraries = [];

  // Generate different itinerary styles
  const styles = [
    { name: 'Cultural Explorer', focus: ['heritage', 'cultural', 'monument'] },
    { name: 'Nature Lover', focus: ['nature', 'beach', 'scenic'] },
    { name: 'Adventure Seeker', focus: ['adventure', 'sports', 'outdoor'] },
    { name: 'Relaxation', focus: ['beach', 'spa', 'scenic'] },
    { name: 'Food & Culture', focus: ['cultural', 'food', 'local'] }
  ];

  for (const style of styles) {
    const itinerary = generateSampleItinerary(destination, days, style, preferences);
    sampleItineraries.push(itinerary);
  }

  return sampleItineraries;
}

// Generate a single sample itinerary
function generateSampleItinerary(destination, days, style, preferences) {
  const itinerary = {
    name: style.name,
    description: `A ${days}-day ${style.name.toLowerCase()} itinerary for ${destination}`,
    days: [],
    highlights: [],
    estimatedCost: calculateEstimatedCost(days, preferences.budget),
    difficulty: 'moderate'
  };

  // Generate daily plans
  for (let day = 1; day <= days; day++) {
    const dayPlan = {
      day: day,
      theme: getDayTheme(day, style, days),
      attractions: generateDayAttractions(destination, day, style, preferences),
      meals: generateMealPlan(day, preferences),
      estimatedDuration: 0,
      highlights: []
    };

    // Calculate estimated duration
    dayPlan.estimatedDuration = dayPlan.attractions.reduce((sum, attr) => sum + parseDuration(attr.duration), 0);
    
    // Add highlights
    dayPlan.highlights = dayPlan.attractions.filter(attr => attr.rating >= 4.5).map(attr => attr.name);
    
    itinerary.days.push(dayPlan);
  }

  // Overall highlights
  itinerary.highlights = itinerary.days.flatMap(day => day.highlights).slice(0, 5);

  return itinerary;
}

// Get day theme
function getDayTheme(day, style, totalDays) {
  if (day === 1) return 'Arrival & Orientation';
  if (day === totalDays) return 'Departure & Last-minute Exploration';
  
  const themes = {
    'Cultural Explorer': ['Heritage Sites', 'Museums & Galleries', 'Local Culture'],
    'Nature Lover': ['Beaches & Water', 'Parks & Gardens', 'Scenic Views'],
    'Adventure Seeker': ['Outdoor Activities', 'Sports & Adventure', 'Nature Trails'],
    'Relaxation': ['Beach Time', 'Spa & Wellness', 'Scenic Relaxation'],
    'Food & Culture': ['Local Cuisine', 'Cultural Sites', 'Food Markets']
  };

  const styleThemes = themes[style.name] || ['Sightseeing', 'Local Exploration', 'Cultural Experience'];
  return styleThemes[(day - 2) % styleThemes.length];
}

// Generate day attractions
function generateDayAttractions(destination, day, style) {
  // This would typically fetch from the attractions API
  // For now, return sample attractions based on style
  const sampleAttractions = {
    'Cultural Explorer': [
      { name: `${destination} Museum`, category: 'cultural', duration: '2-3 hours', rating: 4.3 },
      { name: `${destination} Heritage Site`, category: 'heritage', duration: '1-2 hours', rating: 4.5 },
      { name: `${destination} Monument`, category: 'monument', duration: '1 hour', rating: 4.2 }
    ],
    'Nature Lover': [
      { name: `${destination} Park`, category: 'nature', duration: '2-3 hours', rating: 4.4 },
      { name: `${destination} Beach`, category: 'beach', duration: '3-4 hours', rating: 4.3 },
      { name: `${destination} Scenic View`, category: 'scenic', duration: '1 hour', rating: 4.6 }
    ],
    'Adventure Seeker': [
      { name: `${destination} Adventure Park`, category: 'adventure', duration: '3-4 hours', rating: 4.5 },
      { name: `${destination} Sports Center`, category: 'sports', duration: '2 hours', rating: 4.2 },
      { name: `${destination} Outdoor Activity`, category: 'outdoor', duration: '2-3 hours', rating: 4.4 }
    ]
  };

  const attractions = sampleAttractions[style.name] || sampleAttractions['Cultural Explorer'];
  return attractions.slice(0, Math.min(3, day === 1 || day === 2 ? 2 : 3)); // Fewer attractions on first/last day
}

// Generate meal plan
function generateMealPlan(day, preferences) {
  const meals = [
    { type: 'breakfast', time: '08:00', suggestion: 'Hotel breakfast or local cafe' },
    { type: 'lunch', time: '13:00', suggestion: 'Local restaurant or street food' },
    { type: 'dinner', time: '19:00', suggestion: 'Traditional restaurant or fine dining' }
  ];

  if (preferences.budget === 'luxury') {
    meals[2].suggestion = 'Fine dining restaurant with local cuisine';
  } else if (preferences.budget === 'low') {
    meals[1].suggestion = 'Street food or budget restaurant';
    meals[2].suggestion = 'Local family restaurant';
  }

  return meals;
}

// Calculate estimated cost
function calculateEstimatedCost(days, budget) {
  const costRanges = {
    'low': { perDay: 1500, accommodation: 2000 },
    'medium': { perDay: 3000, accommodation: 4000 },
    'high': { perDay: 6000, accommodation: 8000 },
    'luxury': { perDay: 12000, accommodation: 15000 }
  };

  const range = costRanges[budget] || costRanges.medium;
  return {
    total: (range.perDay * days) + (range.accommodation * days),
    perDay: range.perDay,
    accommodation: range.accommodation * days,
    currency: 'INR'
  };
}

// Calculate day efficiency
function calculateDayEfficiency(attractions, routeOptimization) {
  const totalAttractionTime = attractions.reduce((sum, attr) => sum + parseDuration(attr.duration), 0);
  const travelTime = routeOptimization.totalTime || 0;
  const efficiency = totalAttractionTime / (totalAttractionTime + travelTime);
  
  return {
    efficiency: Math.round(efficiency * 100),
    rating: efficiency >= 0.8 ? 'excellent' : efficiency >= 0.6 ? 'good' : 'needs_improvement'
  };
}

// Calculate optimization metrics
function calculateOptimizationMetrics(original, optimized) {
  const originalMetrics = calculateItineraryMetrics(original);
  const optimizedMetrics = calculateItineraryMetrics(optimized);

  return {
    original: originalMetrics,
    optimized: optimizedMetrics,
    improvement: {
      timeSaved: originalMetrics.totalTravelTime - optimizedMetrics.totalTravelTime,
      distanceReduced: originalMetrics.totalDistance - optimizedMetrics.totalDistance,
      efficiencyGain: ((optimizedMetrics.efficiency - originalMetrics.efficiency) / originalMetrics.efficiency * 100)
    }
  };
}

// Calculate itinerary metrics
function calculateItineraryMetrics(itinerary) {
  const totalTravelTime = itinerary.reduce((sum, day) => 
    sum + (day.routeOptimization?.totalTime || 0), 0
  );
  const totalDistance = itinerary.reduce((sum, day) => 
    sum + (day.routeOptimization?.totalDistance || 0), 0
  );
  const totalAttractions = itinerary.reduce((sum, day) => 
    sum + day.attractions.length, 0
  );

  return {
    totalTravelTime: Math.round(totalTravelTime),
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalAttractions: totalAttractions,
    efficiency: totalAttractions > 0 ? Math.round((totalAttractions / totalTravelTime) * 100) / 100 : 0
  };
}

// Parse duration string to hours
function parseDuration(duration) {
  if (typeof duration === 'string') {
    if (duration.includes('hour')) {
      const match = duration.match(/(\d+)/);
      return match ? parseInt(match[1]) : 1;
    } else if (duration.includes('day')) {
      return 8; // Full day = 8 hours
    }
  }
  return 2; // Default 2 hours
}

// Save itinerary to database
export const saveItinerary = async (req, res) => {
  try {
    // Validate request body
    if (!validateRequestBody(req, res)) return;

    // Validate required fields
    if (!validateRequiredFields(req, res, ['itinerary', 'tripDetails'])) return;

    const { itinerary, tripDetails } = req.body;
    const userId = req.user.id; // From auth middleware

    // Validate itinerary is an array
    if (!Array.isArray(itinerary)) {
      return sendValidationError(res, ['itinerary must be an array']);
    }

    // In a real implementation, you would save to MongoDB
    // For now, we'll return success (you can implement MongoDB saving later)
    console.log('Saving itinerary for user:', userId, {
      destination: tripDetails.destination,
      itineraryDays: itinerary.length
    });

    // TODO: Save to MongoDB using User model or create Itinerary model
    // const savedItinerary = await Itinerary.create({
    //   userId,
    //   itinerary,
    //   tripDetails,
    //   createdAt: new Date()
    // });

    return sendSuccess(res, {
      itineraryId: `itinerary_${Date.now()}`,
      message: 'Itinerary saved successfully'
    }, {
      savedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Save itinerary error:', error);
    sendError(res, 'Failed to save itinerary', 'SAVE_ERROR', error.message, 500);
  }
};

// Get saved itineraries for user
export const getSavedItineraries = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    console.log('Fetching saved itineraries for user:', userId);

    // TODO: Fetch from MongoDB
    // const savedItineraries = await Itinerary.find({ userId }).sort({ createdAt: -1 });

    // For now, return empty array (implement MongoDB query later)
    return sendSuccess(res, {
      itineraries: []
    }, {
      count: 0
    });

  } catch (error) {
    console.error('Get saved itineraries error:', error);
    sendError(res, 'Failed to fetch saved itineraries', 'FETCH_ERROR', error.message, 500);
  }
};

