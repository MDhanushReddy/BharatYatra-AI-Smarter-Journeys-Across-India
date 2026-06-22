import weatherService from '../services/weatherService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { validateRequiredQueryParams, isValidNumber } from '../utils/requestValidator.js';

// Get weather alerts for destination
export const getWeatherAlerts = async (req, res) => {
  try {
    const {
      destination = '',
      days = 5,
      includeForecast = true
    } = req.query;

    // Validate required query parameters
    if (!validateRequiredQueryParams(req, res, ['destination'])) return;

    // Validate days parameter
    const daysNum = isValidNumber(days, 1, 14) ? parseInt(days) : 5;

    console.log('Weather alerts request:', { destination, days, includeForecast });

    // Get weather forecast
    const weatherForecast = await weatherService.getWeatherForecast(destination, daysNum);

    // Generate travel alerts based on weather
    const travelAlerts = await weatherService.generateTravelAlerts(
      destination, 
      weatherForecast.map(day => day.date)
    );

    // Categorize alerts by severity
    const alertsBySeverity = categorizeAlertsBySeverity(travelAlerts);

    // Generate recommendations
    const recommendations = generateWeatherRecommendations(weatherForecast, travelAlerts);

    return sendSuccess(res, {
      weatherForecast: includeForecast ? weatherForecast : null,
      alerts: travelAlerts,
      alertsBySeverity: alertsBySeverity,
      recommendations: recommendations
    }, {
      destination: destination,
      totalAlerts: travelAlerts.length
    });

  } catch (error) {
    console.error('Weather alerts error:', error);
    sendError(res, 'Failed to get weather alerts', 'WEATHER_ALERTS_ERROR', error.message, 500);
  }
};

// Get travel alerts and recommendations
export const getTravelAlerts = async (req, res) => {
  try {
    const {
      destination = '',
      tripDates = [],
      tripType = 'leisure',
      groupType = 'couple'
    } = req.query;

    // Validate required query parameters
    if (!validateRequiredQueryParams(req, res, ['destination'])) return;

    console.log('Travel alerts request:', { destination, tripDates, tripType, groupType });

    // Get weather-based alerts
    const weatherAlerts = await weatherService.generateTravelAlerts(destination, tripDates);

    // Get general travel alerts for destination
    const generalAlerts = getGeneralTravelAlerts(destination);

    // Get real-time alerts (simulated)
    const realTimeAlerts = await getRealTimeAlerts(destination);

    // Combine all alerts
    const allAlerts = [...weatherAlerts, ...generalAlerts, ...realTimeAlerts];

    // Categorize and prioritize alerts
    const categorizedAlerts = categorizeAndPrioritizeAlerts(allAlerts, { tripType, groupType });

    // Generate actionable recommendations
    const recommendations = generateTravelRecommendations(categorizedAlerts, { tripType, groupType });

    return sendSuccess(res, {
      alerts: categorizedAlerts,
      recommendations: recommendations,
      alertSummary: {
        total: allAlerts.length,
        high: categorizedAlerts.high.length,
        medium: categorizedAlerts.medium.length,
        low: categorizedAlerts.low.length
      }
    }, {
      destination: destination
    });

  } catch (error) {
    console.error('Travel alerts error:', error);
    sendError(res, 'Failed to get travel alerts', 'TRAVEL_ALERTS_ERROR', error.message, 500);
  }
};

// Subscribe to real-time alerts (WebSocket simulation)
export const subscribeToAlerts = async (req, res) => {
  try {
    const {
      destination,
      tripDates = [],
      alertTypes = ['weather', 'traffic', 'safety'],
      userId
    } = req.body;

    if (!destination || !userId) {
      return res.status(400).json({ 
        error: 'Destination and user ID are required for subscription' 
      });
    }

    console.log('Alert subscription request:', { destination, tripDates, alertTypes, userId });

    // In a real implementation, this would establish a WebSocket connection
    // For now, we'll simulate subscription and return subscription details
    
    const subscription = {
      id: `sub_${Date.now()}`,
      userId: userId,
      destination: destination,
      tripDates: tripDates,
      alertTypes: alertTypes,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    // Store subscription (in real implementation, this would be in database)
    // subscriptionStore.set(subscription.id, subscription);

    // Send initial alerts
    const initialAlerts = await getInitialAlertsForSubscription(subscription);

    res.json({
      success: true,
      subscription: subscription,
      initialAlerts: initialAlerts,
      message: 'Successfully subscribed to real-time alerts',
      websocketUrl: `ws://localhost:5000/alerts/${subscription.id}`, // Simulated WebSocket URL
      instructions: {
        connect: 'Connect to the WebSocket URL to receive real-time alerts',
        disconnect: 'Send DISCONNECT message to unsubscribe',
        customAlerts: 'Send custom alert preferences via WebSocket'
      }
    });

  } catch (error) {
    console.error('Alert subscription error:', error);
    res.status(500).json({ 
      error: 'Failed to subscribe to alerts',
      message: error.message 
    });
  }
};

// Categorize alerts by severity
function categorizeAlertsBySeverity(alerts) {
  const categorized = {
    high: [],
    medium: [],
    low: []
  };

  alerts.forEach(alert => {
    switch (alert.severity) {
      case 'high':
        categorized.high.push(alert);
        break;
      case 'moderate':
      case 'medium':
        categorized.medium.push(alert);
        break;
      case 'low':
      case 'info':
        categorized.low.push(alert);
        break;
      default:
        categorized.medium.push(alert);
    }
  });

  return categorized;
}

// Generate weather recommendations
function generateWeatherRecommendations(weatherForecast) {
  const recommendations = [];

  // Analyze weather patterns
  const hasRain = weatherForecast.some(day => day.precipitation > 5);
  const hasHighTemp = weatherForecast.some(day => day.temperature.max > 35);
  const hasLowTemp = weatherForecast.some(day => day.temperature.min < 10);

  if (hasRain) {
    recommendations.push({
      type: 'packing',
      priority: 'high',
      message: 'Rain expected - pack rain gear and waterproof bags',
      items: ['Umbrella', 'Raincoat', 'Waterproof shoes', 'Plastic bags for electronics']
    });
  }

  if (hasHighTemp) {
    recommendations.push({
      type: 'health',
      priority: 'medium',
      message: 'High temperatures expected - stay hydrated and avoid prolonged sun exposure',
      items: ['Extra water bottles', 'Sunscreen SPF 50+', 'Hat', 'Light cotton clothing']
    });
  }

  if (hasLowTemp) {
    recommendations.push({
      type: 'packing',
      priority: 'medium',
      message: 'Low temperatures expected - pack warm clothing',
      items: ['Warm jacket', 'Thermal wear', 'Woolen socks', 'Gloves']
    });
  }

  // Activity recommendations based on weather
  const sunnyDays = weatherForecast.filter(day => day.weather.includes('clear') || day.weather.includes('sunny'));
  if (sunnyDays.length > 0) {
    recommendations.push({
      type: 'activities',
      priority: 'low',
      message: `${sunnyDays.length} sunny days - perfect for outdoor activities and sightseeing`,
      suggestions: ['Beach activities', 'Outdoor sightseeing', 'Photography', 'Walking tours']
    });
  }

  return recommendations;
}

// Get general travel alerts for destination
function getGeneralTravelAlerts(destination) {
  // In a real implementation, this would fetch from travel advisory APIs
  const generalAlerts = {
    'mumbai': [
      {
        type: 'traffic',
        severity: 'medium',
        message: 'Heavy traffic during peak hours (7-10 AM, 6-9 PM)',
        recommendations: ['Use metro or local trains', 'Avoid road travel during peak hours', 'Plan extra time for travel'],
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    'delhi': [
      {
        type: 'air_quality',
        severity: 'high',
        message: 'Poor air quality - consider wearing masks',
        recommendations: ['Wear N95 masks', 'Avoid outdoor activities during peak pollution hours', 'Stay indoors when possible'],
        validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    'goa': [
      {
        type: 'monsoon',
        severity: 'low',
        message: 'Monsoon season - expect occasional heavy rains',
        recommendations: ['Check weather before outdoor activities', 'Carry rain gear', 'Be cautious with water sports'],
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  };

  return generalAlerts[destination.toLowerCase()] || [];
}

// Get real-time alerts (simulated)
async function getRealTimeAlerts(destination) {
  // In a real implementation, this would connect to real-time data sources
  const mockRealTimeAlerts = [
    {
      type: 'traffic',
      severity: 'medium',
      message: 'Traffic congestion reported on main tourist routes',
      location: destination,
      timestamp: new Date().toISOString(),
      estimatedDelay: '15-30 minutes'
    },
    {
      type: 'safety',
      severity: 'low',
      message: 'Increased tourist police presence in popular areas',
      location: destination,
      timestamp: new Date().toISOString(),
      note: 'Enhanced security measures in effect'
    }
  ];

  return mockRealTimeAlerts;
}

// Categorize and prioritize alerts
function categorizeAndPrioritizeAlerts(alerts, userPreferences) {
  const { tripType, groupType } = userPreferences;
  
  const categorized = {
    high: [],
    medium: [],
    low: []
  };

  alerts.forEach(alert => {
    let priority = alert.severity;
    
    // Adjust priority based on trip type and group type
    if (tripType === 'family' && alert.type === 'safety') {
      priority = 'high';
    } else if (tripType === 'adventure' && alert.type === 'weather') {
      priority = 'high';
    } else if (groupType === 'solo' && alert.type === 'safety') {
      priority = 'medium';
    }

    switch (priority) {
      case 'high':
        categorized.high.push(alert);
        break;
      case 'medium':
      case 'moderate':
        categorized.medium.push(alert);
        break;
      case 'low':
      case 'info':
        categorized.low.push(alert);
        break;
      default:
        categorized.medium.push(alert);
    }
  });

  return categorized;
}

// Generate travel recommendations
function generateTravelRecommendations(categorizedAlerts, userPreferences) {
  const recommendations = {
    immediate: [],
    planning: [],
    general: []
  };

  // High priority alerts - immediate action needed
  categorizedAlerts.high.forEach(alert => {
    recommendations.immediate.push({
      type: alert.type,
      message: alert.message,
      action: getImmediateAction(alert),
      priority: 'urgent'
    });
  });

  // Medium priority alerts - planning considerations
  categorizedAlerts.medium.forEach(alert => {
    recommendations.planning.push({
      type: alert.type,
      message: alert.message,
      action: getPlanningAction(alert, userPreferences),
      priority: 'important'
    });
  });

  // Low priority alerts - general advice
  categorizedAlerts.low.forEach(alert => {
    recommendations.general.push({
      type: alert.type,
      message: alert.message,
      action: getGeneralAction(alert),
      priority: 'informational'
    });
  });

  return recommendations;
}

// Get immediate action for high priority alerts
function getImmediateAction(alert) {
  switch (alert.type) {
    case 'weather':
      return 'Reschedule outdoor activities or seek shelter immediately';
    case 'safety':
      return 'Avoid the affected area and follow local authorities\' instructions';
    case 'traffic':
      return 'Use alternative routes or delay travel';
    default:
      return 'Take appropriate precautions and monitor the situation';
  }
}

// Get planning action for medium priority alerts
function getPlanningAction(alert, userPreferences) {
  switch (alert.type) {
    case 'weather':
      return 'Plan indoor activities as backup and pack appropriate clothing';
    case 'traffic':
      return 'Allow extra travel time and consider public transportation';
    case 'air_quality':
      return userPreferences.tripType === 'family' ? 
        'Consider limiting outdoor activities for children' :
        'Pack masks and plan indoor activities';
    default:
      return 'Include contingency plans in your itinerary';
  }
}

// Get general action for low priority alerts
function getGeneralAction(alert) {
  switch (alert.type) {
    case 'weather':
      return 'Monitor weather updates and dress appropriately';
    case 'traffic':
      return 'Be flexible with travel times';
    case 'safety':
      return 'Stay aware of your surroundings';
    default:
      return 'Stay informed and prepared';
  }
}

// Get initial alerts for subscription
async function getInitialAlertsForSubscription(subscription) {
  const { destination, tripDates } = subscription;
  
  try {
    // Get current weather alerts
    const weatherAlerts = await weatherService.generateTravelAlerts(destination, tripDates);
    
    // Get general alerts
    const generalAlerts = getGeneralTravelAlerts(destination);
    
    // Get real-time alerts
    const realTimeAlerts = await getRealTimeAlerts(destination);
    
    return {
      weather: weatherAlerts,
      general: generalAlerts,
      realTime: realTimeAlerts,
      total: weatherAlerts.length + generalAlerts.length + realTimeAlerts.length
    };
  } catch (error) {
    console.error('Error getting initial alerts:', error);
    return {
      weather: [],
      general: [],
      realTime: [],
      total: 0,
      error: 'Failed to fetch initial alerts'
    };
  }
}

