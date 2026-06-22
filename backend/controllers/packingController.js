import aiRecommendationService from '../services/aiRecommendationService.js';
import weatherService from '../services/weatherService.js';

// Generate AI-powered packing list using decision tree logic
export const generatePackingList = async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      tripType = 'leisure',
      groupType = 'couple',
      groupSize = 2,
      interests = [],
      budget = 'medium',
      specialNeeds = '',
      accommodation = null
    } = req.body;

    if (!destination || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Destination, start date, and end date are required' 
      });
    }

    console.log('Packing list generation request:', { 
      destination, startDate, endDate, tripType, groupType, groupSize, interests, budget 
    });

    // Calculate trip duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Get weather data for the destination
    const weatherData = await weatherService.getWeatherForecast(destination, days);

    // Create trip details object
    const tripDetails = {
      destination,
      duration: days,
      tripType,
      groupType,
      groupSize,
      interests,
      budget,
      specialNeeds,
      accommodation
    };

    // Generate packing list using AI decision tree
    const packingList = aiRecommendationService.generatePackingList(tripDetails, weatherData);

    // Enhance with destination-specific recommendations
    const enhancedPackingList = enhancePackingListForDestination(packingList, destination, tripDetails);

    // Add budget-specific adjustments
    const budgetAdjustedList = adjustPackingListForBudget(enhancedPackingList, budget, days);

    // Generate packing insights and tips
    const insights = generatePackingInsights(budgetAdjustedList, tripDetails, weatherData);

    // Generate packing recommendations
    const recommendations = generatePackingRecommendations(budgetAdjustedList, tripDetails, weatherData);

    res.json({
      success: true,
      tripDetails: tripDetails,
      packingList: budgetAdjustedList,
      insights: insights,
      recommendations: recommendations,
      weatherSummary: getWeatherSummary(weatherData),
      estimatedWeight: calculateEstimatedWeight(budgetAdjustedList),
      algorithm: 'decision_tree_with_weather_analysis',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Packing list generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate packing list',
      message: error.message 
    });
  }
};

// Get packing recommendations based on criteria
export const getPackingRecommendations = async (req, res) => {
  try {
    const {
      destination = '',
      tripType = 'leisure',
      duration = 3,
      season = '',
      budget = 'medium',
      groupSize = 2
    } = req.query;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    console.log('Packing recommendations request:', { 
      destination, tripType, duration, season, budget, groupSize 
    });

    // Get weather data if season is not specified
    let weatherData = [];
    if (!season) {
      try {
        weatherData = await weatherService.getWeatherForecast(destination, parseInt(duration));
      } catch (error) {
        console.log('Could not fetch weather data, using season-based recommendations');
      }
    }

    // Generate recommendations based on criteria
    const recommendations = generateRecommendationsByCriteria({
      destination,
      tripType,
      duration: parseInt(duration),
      season,
      budget,
      groupSize: parseInt(groupSize)
    }, weatherData);

    res.json({
      success: true,
      destination: destination,
      recommendations: recommendations,
      criteria: { tripType, duration, season, budget, groupSize },
      tips: getGeneralPackingTips(tripType, duration),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Packing recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to get packing recommendations',
      message: error.message 
    });
  }
};

// Analyze existing packing list
export const analyzePackingList = async (req, res) => {
  try {
    const {
      packingList = {},
      tripDetails = {},
      destination = '',
      startDate = '',
      endDate = ''
    } = req.body;

    if (!packingList || Object.keys(packingList).length === 0) {
      return res.status(400).json({ 
        error: 'Packing list is required for analysis' 
      });
    }

    console.log('Packing list analysis request:', { 
      destination, hasTripDetails: !!tripDetails, categoriesCount: Object.keys(packingList).length 
    });

    // Analyze the packing list
    const analysis = analyzePackingListCompleteness(packingList, tripDetails);

    // Get weather data for recommendations
    let weatherRecommendations = [];
    if (destination && startDate && endDate) {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 1000));
        const weatherData = await weatherService.getWeatherForecast(destination, days);
        weatherRecommendations = getWeatherBasedRecommendations(weatherData, packingList);
      } catch (error) {
        console.log('Could not fetch weather data for analysis');
      }
    }

    // Generate improvement suggestions
    const suggestions = generateImprovementSuggestions(analysis, tripDetails);

    // Calculate packing efficiency
    const efficiency = calculatePackingEfficiency(packingList, tripDetails);

    res.json({
      success: true,
      analysis: analysis,
      weatherRecommendations: weatherRecommendations,
      suggestions: suggestions,
      efficiency: efficiency,
      overallScore: calculateOverallPackingScore(analysis, efficiency),
      algorithm: 'comprehensive_packing_analysis'
    });

  } catch (error) {
    console.error('Packing list analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze packing list',
      message: error.message 
    });
  }
};

// Enhance packing list for specific destination
function enhancePackingListForDestination(packingList, destination, tripDetails) {
  const enhanced = { ...packingList };

  // Destination-specific items
  const destinationItems = {
    'goa': {
      accessories: ['Swimming suit', 'Beach towel', 'Sunglasses', 'Beach bag', 'Waterproof phone case'],
      clothing: ['Beach shorts', 'Flip flops', 'Cover-up', 'Light cotton clothing'],
      essentials: ['Sunscreen SPF 50+', 'Aloe vera gel', 'Waterproof bag']
    },
    'delhi': {
      accessories: ['Air pollution mask', 'Hand sanitizer', 'Tissue papers', 'Comfortable walking shoes'],
      clothing: ['Modest clothing', 'Light jacket', 'Long pants', 'Closed-toe shoes'],
      essentials: ['Water bottle', 'Lip balm', 'Moisturizer']
    },
    'mumbai': {
      accessories: ['Compact umbrella', 'Quick-dry towel', 'Portable fan'],
      clothing: ['Light cotton clothing', 'Rain jacket', 'Comfortable sandals'],
      essentials: ['Mosquito repellent', 'Sunscreen', 'Water bottle']
    },
    'bangalore': {
      accessories: ['Light jacket', 'Comfortable walking shoes', 'Backpack'],
      clothing: ['Layered clothing', 'Jeans', 'T-shirts', 'Sweater'],
      essentials: ['Sunscreen', 'Lip balm', 'Water bottle']
    }
  };

  const destItems = destinationItems[destination.toLowerCase()];
  if (destItems) {
    Object.keys(destItems).forEach(category => {
      if (!enhanced[category]) enhanced[category] = [];
      enhanced[category] = [...enhanced[category], ...destItems[category]];
    });
  }

  // Trip type specific enhancements
  if (tripDetails.tripType === 'adventure') {
    enhanced.essentials = [...(enhanced.essentials || []), 'First aid kit', 'Emergency whistle', 'Multi-tool'];
    enhanced.accessories = [...(enhanced.accessories || []), 'Hiking boots', 'Backpack', 'Water bottle'];
  } else if (tripDetails.tripType === 'business') {
    enhanced.clothing = [...(enhanced.clothing || []), 'Business suit', 'Formal shoes', 'Tie'];
    enhanced.electronics = [...(enhanced.electronics || []), 'Laptop', 'Presentation materials', 'Business cards'];
  }

  return enhanced;
}

// Adjust packing list for budget
function adjustPackingListForBudget(packingList, budget, days) {
  const adjusted = { ...packingList };

  const budgetAdjustments = {
    'low': {
      remove: ['Luxury toiletries', 'Designer clothing', 'Expensive accessories'],
      add: ['Basic toiletries', 'Versatile clothing items', 'Multi-purpose items']
    },
    'medium': {
      remove: ['Excessive luxury items'],
      add: ['Quality basics', 'Essential accessories']
    },
    'high': {
      remove: [],
      add: ['Premium items', 'Extra accessories', 'Luxury toiletries']
    },
    'luxury': {
      remove: [],
      add: ['High-end items', 'Premium accessories', 'Luxury amenities']
    }
  };

  const adjustments = budgetAdjustments[budget] || budgetAdjustments.medium;

  // Apply adjustments
  Object.keys(adjusted).forEach(category => {
    if (adjustments.remove.length > 0) {
      adjusted[category] = adjusted[category].filter(item => 
        !adjustments.remove.some(removeItem => item.toLowerCase().includes(removeItem.toLowerCase()))
      );
    }
    if (adjustments.add.length > 0) {
      adjusted[category] = [...adjusted[category], ...adjustments.add];
    }
  });

  // Adjust quantities based on trip duration
  if (days > 7) {
    Object.keys(adjusted).forEach(category => {
      adjusted[category] = adjusted[category].map(item => {
        if (item.includes('underwear') || item.includes('socks')) {
          return `${item} (x${Math.min(Math.ceil(days / 2), 10)})`;
        }
        return item;
      });
    });
  }

  return adjusted;
}

// Generate packing insights
function generatePackingInsights(packingList, tripDetails, weatherData) {
  const insights = {
    completeness: {},
    weatherAlignment: {},
    efficiency: {},
    recommendations: []
  };

  // Analyze completeness
  const categories = Object.keys(packingList);
  const totalItems = Object.values(packingList).flat().length;
  
  insights.completeness = {
    categoriesCovered: categories.length,
    totalItems: totalItems,
    completenessScore: Math.min((categories.length / 6) * 100, 100), // Assuming 6 main categories
    missingCategories: getMissingCategories(categories)
  };

  // Analyze weather alignment
  const avgTemp = weatherData.reduce((sum, day) => sum + day.temperature.avg, 0) / weatherData.length;
  const hasRain = weatherData.some(day => day.precipitation > 5);
  const hasCold = weatherData.some(day => day.temperature.min < 15);

  insights.weatherAlignment = {
    averageTemperature: Math.round(avgTemp),
    weatherConditions: {
      rain: hasRain,
      cold: hasCold,
      hot: avgTemp > 30
    },
    alignmentScore: calculateWeatherAlignmentScore(packingList, weatherData),
    weatherRecommendations: getWeatherRecommendations(weatherData)
  };

  // Analyze efficiency
  insights.efficiency = {
    estimatedWeight: calculateEstimatedWeight(packingList),
    versatility: calculateVersatilityScore(packingList),
    spaceEfficiency: calculateSpaceEfficiency(packingList, tripDetails.duration),
    efficiencyScore: calculateOverallEfficiency(packingList, tripDetails)
  };

  return insights;
}

// Generate packing recommendations
function generatePackingRecommendations(packingList, tripDetails, weatherData) {
  const recommendations = [];

  // Weather-based recommendations
  const avgTemp = weatherData.reduce((sum, day) => sum + day.temperature.avg, 0) / weatherData.length;
  
  if (avgTemp > 30 && !packingList.clothing?.some(item => item.toLowerCase().includes('light'))) {
    recommendations.push({
      type: 'weather',
      priority: 'high',
      message: 'Hot weather expected - ensure you have light, breathable clothing',
      items: ['Light cotton shirts', 'Shorts', 'Sun hat', 'Sunscreen']
    });
  }

  if (weatherData.some(day => day.precipitation > 5) && !packingList.accessories?.some(item => item.toLowerCase().includes('umbrella'))) {
    recommendations.push({
      type: 'weather',
      priority: 'high',
      message: 'Rain expected - pack rain protection',
      items: ['Umbrella', 'Rain jacket', 'Waterproof shoes']
    });
  }

  // Trip type recommendations
  if (tripDetails.tripType === 'adventure' && !packingList.essentials?.some(item => item.toLowerCase().includes('first aid'))) {
    recommendations.push({
      type: 'activity',
      priority: 'high',
      message: 'Adventure trip requires safety equipment',
      items: ['First aid kit', 'Emergency whistle', 'Multi-tool']
    });
  }

  // Duration recommendations
  if (tripDetails.duration > 7 && !packingList.essentials?.some(item => item.toLowerCase().includes('laundry'))) {
    recommendations.push({
      type: 'duration',
      priority: 'medium',
      message: 'Long trip - consider laundry options',
      items: ['Laundry detergent', 'Travel-sized detergent', 'Clothesline']
    });
  }

  // Group size recommendations
  if (tripDetails.groupSize > 4 && !packingList.essentials?.some(item => item.toLowerCase().includes('group'))) {
    recommendations.push({
      type: 'group',
      priority: 'low',
      message: 'Large group - consider group coordination items',
      items: ['Group contact list', 'Meeting point plan', 'Shared supplies']
    });
  }

  return recommendations;
}

// Get weather summary
function getWeatherSummary(weatherData) {
  if (!weatherData || weatherData.length === 0) {
    return { message: 'Weather data not available' };
  }

  const avgTemp = weatherData.reduce((sum, day) => sum + day.temperature.avg, 0) / weatherData.length;
  const hasRain = weatherData.some(day => day.precipitation > 5);
  const hasHot = weatherData.some(day => day.temperature.max > 35);
  const hasCold = weatherData.some(day => day.temperature.min < 15);

  return {
    averageTemperature: Math.round(avgTemp),
    conditions: {
      rain: hasRain,
      hot: hasHot,
      cold: hasCold
    },
    temperatureRange: {
      min: Math.min(...weatherData.map(day => day.temperature.min)),
      max: Math.max(...weatherData.map(day => day.temperature.max))
    }
  };
}

// Calculate estimated weight
function calculateEstimatedWeight(packingList) {
  const weightEstimates = {
    clothing: 15, // kg
    essentials: 3,
    accessories: 2,
    electronics: 5,
    documents: 0.5
  };

  let totalWeight = 0;
  Object.keys(packingList).forEach(category => {
    const itemCount = packingList[category].length;
    const categoryWeight = weightEstimates[category] || 2;
    totalWeight += (categoryWeight * itemCount) / 10; // Rough estimate
  });

  return Math.round(totalWeight * 10) / 10;
}

// Generate recommendations by criteria
function generateRecommendationsByCriteria(criteria) {
  const { tripType, duration, season } = criteria;

  const recommendations = {
    essentials: [],
    clothing: [],
    accessories: [],
    electronics: [],
    tips: []
  };

  // Duration-based recommendations
  if (duration <= 3) {
    recommendations.essentials.push('Minimal toiletries', 'Basic first aid');
    recommendations.tips.push('Pack light for short trip');
  } else if (duration <= 7) {
    recommendations.essentials.push('Full toiletries', 'Laundry detergent');
    recommendations.tips.push('Pack versatile items for medium trip');
  } else {
    recommendations.essentials.push('Extended toiletries', 'Laundry supplies', 'Extra items');
    recommendations.tips.push('Pack for long-term travel');
  }

  // Trip type recommendations
  if (tripType === 'business') {
    recommendations.clothing.push('Business attire', 'Formal shoes', 'Professional accessories');
    recommendations.electronics.push('Laptop', 'Chargers', 'Business cards');
  } else if (tripType === 'adventure') {
    recommendations.clothing.push('Outdoor clothing', 'Hiking boots', 'Quick-dry items');
    recommendations.accessories.push('Backpack', 'Water bottle', 'Safety equipment');
  } else if (tripType === 'family') {
    recommendations.essentials.push('Children supplies', 'Entertainment items', 'Safety items');
    recommendations.tips.push('Pack extra items for children');
  }

  // Season-based recommendations
  if (season === 'summer') {
    recommendations.clothing.push('Light clothing', 'Sunscreen', 'Hat');
  } else if (season === 'winter') {
    recommendations.clothing.push('Warm clothing', 'Jacket', 'Thermal wear');
  } else if (season === 'monsoon') {
    recommendations.accessories.push('Umbrella', 'Rain jacket', 'Waterproof bags');
  }

  return recommendations;
}

// Get general packing tips
function getGeneralPackingTips(tripType, duration) {
  const tips = [
    'Pack versatile items that can be mixed and matched',
    'Roll clothes instead of folding to save space',
    'Use packing cubes for better organization',
    'Pack heavy items at the bottom of your luggage',
    'Keep important documents and valuables in carry-on'
  ];

  if (tripType === 'business') {
    tips.push('Pack wrinkle-resistant clothing', 'Bring extra business cards');
  } else if (tripType === 'adventure') {
    tips.push('Pack safety equipment', 'Test gear before departure');
  }

  if (duration > 7) {
    tips.push('Plan for laundry', 'Pack extra supplies');
  }

  return tips;
}

// Analyze packing list completeness
function analyzePackingListCompleteness(packingList, tripDetails) {
  const analysis = {
    completeness: {},
    missing: {},
    excess: {},
    score: 0
  };

  const expectedCategories = ['essentials', 'clothing', 'accessories', 'electronics', 'documents'];
  const foundCategories = Object.keys(packingList);
  
  analysis.completeness = {
    categoriesFound: foundCategories.length,
    categoriesExpected: expectedCategories.length,
    missingCategories: expectedCategories.filter(cat => !foundCategories.includes(cat))
  };

  // Check for missing essential items
  analysis.missing = getMissingEssentialItems(packingList, tripDetails);

  // Check for excess items
  analysis.excess = getExcessItems(packingList, tripDetails);

  // Calculate overall score
  analysis.score = calculateCompletenessScore(analysis);

  return analysis;
}

// Get missing categories
function getMissingCategories(foundCategories) {
  const expectedCategories = ['essentials', 'clothing', 'accessories', 'electronics', 'documents'];
  return expectedCategories.filter(cat => !foundCategories.includes(cat));
}

// Calculate weather alignment score
function calculateWeatherAlignmentScore(packingList, weatherData) {
  let score = 0;
  const maxScore = 100;

  // Check for temperature-appropriate clothing
  const avgTemp = weatherData.reduce((sum, day) => sum + day.temperature.avg, 0) / weatherData.length;
  const clothing = packingList.clothing || [];
  
  if (avgTemp > 25 && clothing.some(item => item.toLowerCase().includes('light'))) {
    score += 25;
  }
  if (avgTemp < 15 && clothing.some(item => item.toLowerCase().includes('warm'))) {
    score += 25;
  }

  // Check for rain protection
  const hasRain = weatherData.some(day => day.precipitation > 5);
  const accessories = packingList.accessories || [];
  
  if (hasRain && accessories.some(item => item.toLowerCase().includes('umbrella'))) {
    score += 25;
  }
  if (!hasRain && !accessories.some(item => item.toLowerCase().includes('umbrella'))) {
    score += 25;
  }

  return Math.min(score, maxScore);
}

// Get weather recommendations
function getWeatherRecommendations(weatherData) {
  const recommendations = [];
  
  const avgTemp = weatherData.reduce((sum, day) => sum + day.temperature.avg, 0) / weatherData.length;
  const hasRain = weatherData.some(day => day.precipitation > 5);
  
  if (avgTemp > 30) {
    recommendations.push('Pack light, breathable clothing and sunscreen');
  }
  if (avgTemp < 15) {
    recommendations.push('Pack warm clothing and layers');
  }
  if (hasRain) {
    recommendations.push('Pack rain protection and waterproof items');
  }
  
  return recommendations;
}

// Calculate versatility score
function calculateVersatilityScore(packingList) {
  let score = 0;
  const clothing = packingList.clothing || [];
  
  // Check for versatile items
  if (clothing.some(item => item.toLowerCase().includes('versatile'))) score += 20;
  if (clothing.some(item => item.toLowerCase().includes('neutral'))) score += 20;
  if (clothing.some(item => item.toLowerCase().includes('mix'))) score += 20;
  if (clothing.some(item => item.toLowerCase().includes('match'))) score += 20;
  
  return Math.min(score, 100);
}

// Calculate space efficiency
function calculateSpaceEfficiency(packingList, duration) {
  const totalItems = Object.values(packingList).flat().length;
  const idealItems = duration * 5; // Rough estimate of 5 items per day
  
  if (totalItems <= idealItems) {
    return 100;
  } else if (totalItems <= idealItems * 1.5) {
    return 75;
  } else if (totalItems <= idealItems * 2) {
    return 50;
  } else {
    return 25;
  }
}

// Calculate overall efficiency
function calculateOverallEfficiency(packingList, tripDetails) {
  const versatility = calculateVersatilityScore(packingList);
  const spaceEfficiency = calculateSpaceEfficiency(packingList, tripDetails.duration);
  
  return Math.round((versatility + spaceEfficiency) / 2);
}

// Get missing essential items
function getMissingEssentialItems(packingList) {
  const missing = [];
  
  const essentials = packingList.essentials || [];
  
  if (!essentials.some(item => item.toLowerCase().includes('passport'))) {
    missing.push('Passport/ID');
  }
  if (!essentials.some(item => item.toLowerCase().includes('first aid'))) {
    missing.push('First aid kit');
  }
  if (!essentials.some(item => item.toLowerCase().includes('medicine'))) {
    missing.push('Prescription medications');
  }
  
  return missing;
}

// Get excess items
function getExcessItems(packingList, tripDetails) {
  const excess = [];
  
  if (tripDetails.duration <= 3) {
    const clothing = packingList.clothing || [];
    if (clothing.length > 10) {
      excess.push('Too many clothing items for short trip');
    }
  }
  
  return excess;
}

// Calculate completeness score
function calculateCompletenessScore(analysis) {
  let score = 0;
  
  // Category completeness (40 points)
  score += (analysis.completeness.categoriesFound / analysis.completeness.categoriesExpected) * 40;
  
  // Missing items penalty (30 points)
  score += Math.max(0, 30 - (analysis.missing.length * 5));
  
  // Excess items penalty (30 points)
  score += Math.max(0, 30 - (analysis.excess.length * 5));
  
  return Math.min(Math.round(score), 100);
}

// Get weather-based recommendations
function getWeatherBasedRecommendations(weatherData, packingList) {
  const recommendations = [];
  
  const avgTemp = weatherData.reduce((sum, day) => sum + day.temperature.avg, 0) / weatherData.length;
  const hasRain = weatherData.some(day => day.precipitation > 5);
  
  if (avgTemp > 30 && !packingList.clothing?.some(item => item.toLowerCase().includes('light'))) {
    recommendations.push('Add light, breathable clothing for hot weather');
  }
  
  if (hasRain && !packingList.accessories?.some(item => item.toLowerCase().includes('umbrella'))) {
    recommendations.push('Add rain protection items');
  }
  
  return recommendations;
}

// Generate improvement suggestions
function generateImprovementSuggestions(analysis) {
  const suggestions = [];
  
  if (analysis.missing.length > 0) {
    suggestions.push({
      type: 'missing',
      message: 'Add missing essential items',
      items: analysis.missing
    });
  }
  
  if (analysis.excess.length > 0) {
    suggestions.push({
      type: 'excess',
      message: 'Consider removing excess items',
      items: analysis.excess
    });
  }
  
  if (analysis.completeness.score < 70) {
    suggestions.push({
      type: 'completeness',
      message: 'Improve packing list completeness',
      action: 'Add items from missing categories'
    });
  }
  
  return suggestions;
}

// Calculate packing efficiency
function calculatePackingEfficiency(packingList) {
  const totalItems = Object.values(packingList).flat().length;
  const estimatedWeight = calculateEstimatedWeight(packingList);
  const versatility = calculateVersatilityScore(packingList);
  
  return {
    totalItems: totalItems,
    estimatedWeight: estimatedWeight,
    versatility: versatility,
    efficiency: Math.round((versatility + (100 - (estimatedWeight * 2))) / 2)
  };
}

// Calculate overall packing score
function calculateOverallPackingScore(analysis, efficiency) {
  const completenessScore = analysis.score;
  const efficiencyScore = efficiency.efficiency;
  
  return Math.round((completenessScore + efficiencyScore) / 2);
}

