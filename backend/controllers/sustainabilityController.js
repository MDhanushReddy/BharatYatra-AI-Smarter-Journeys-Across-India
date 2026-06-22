// Sustainability & Eco-Friendly Options Controller - Step 13 Implementation
// Suggests eco-friendly transport, accommodations, and activities with eco-scores

export const getEcoFriendlyOptions = async (req, res) => {
  try {
    const {
      destination = '',
      category = 'all', // transport, accommodation, activities, all
      lat,
      lng,
      radius = '10000',
      maxResults = 20
    } = req.query;

    if (!destination && !lat && !lng) {
      return res.status(400).json({
        error: 'Destination or coordinates are required'
      });
    }

    console.log('Eco-friendly options request:', {
      destination, category, lat, lng, radius, maxResults
    });

    // Get eco-friendly options based on category
    const ecoOptions = await getEcoFriendlyOptionsByCategory(
      destination,
      category,
      lat,
      lng,
      radius,
      parseInt(maxResults)
    );

    // Calculate eco-scores for each option
    const scoredOptions = ecoOptions.map(option => ({
      ...option,
      ecoScore: calculateEcoScore(option),
      sustainabilityImpact: calculateSustainabilityImpact(option)
    }));

    // Sort by eco-score
    const sortedOptions = scoredOptions.sort((a, b) => b.ecoScore - a.ecoScore);

    // Generate sustainability insights
    const insights = generateSustainabilityInsights(sortedOptions);

    res.json({
      success: true,
      destination: destination,
      category: category,
      options: sortedOptions.slice(0, parseInt(maxResults)),
      insights: insights,
      totalFound: ecoOptions.length,
      algorithm: 'eco_friendly_scoring',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Eco-friendly options error:', error);
    res.status(500).json({
      error: 'Failed to fetch eco-friendly options',
      message: error.message
    });
  }
};

// Get sustainability recommendations for a trip
export const getSustainabilityRecommendations = async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      groupSize = 1,
      travelStyle = 'moderate',
      preferences = {}
    } = req.body;

    if (!destination || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Destination, start date, and end date are required'
      });
    }

    console.log('Sustainability recommendations request:', {
      destination, startDate, endDate, groupSize, travelStyle
    });

    // Generate comprehensive sustainability recommendations
    const recommendations = await generateSustainabilityRecommendations(
      destination,
      startDate,
      endDate,
      parseInt(groupSize),
      travelStyle,
      preferences
    );

    // Calculate carbon footprint estimate
    const carbonFootprint = calculateCarbonFootprint(
      destination,
      startDate,
      endDate,
      parseInt(groupSize),
      travelStyle,
      recommendations
    );

    res.json({
      success: true,
      destination: destination,
      recommendations: recommendations,
      carbonFootprint: carbonFootprint,
      sustainabilityScore: calculateOverallSustainabilityScore(recommendations),
      tips: getSustainabilityTips(travelStyle, groupSize),
      algorithm: 'comprehensive_sustainability_analysis'
    });

  } catch (error) {
    console.error('Sustainability recommendations error:', error);
    res.status(500).json({
      error: 'Failed to generate sustainability recommendations',
      message: error.message
    });
  }
};

// Get eco-friendly options by category
async function getEcoFriendlyOptionsByCategory(destination, category, lat, lng, radius, maxResults) {
  const options = [];

  // Transport options
  if (category === 'transport' || category === 'all') {
    options.push(...getEcoFriendlyTransport(destination));
  }

  // Accommodation options
  if (category === 'accommodation' || category === 'all') {
    options.push(...getEcoFriendlyAccommodation(destination));
  }

  // Activity options
  if (category === 'activities' || category === 'all') {
    options.push(...getEcoFriendlyActivities(destination));
  }

  return options.slice(0, maxResults);
}

// Get eco-friendly transport options
function getEcoFriendlyTransport(destination, lat, lng) {
  const transportOptions = [
    {
      id: 'public_transport',
      name: 'Public Transportation',
      type: 'transport',
      category: 'eco_friendly',
      description: 'Use local buses, trains, and metro systems',
      ecoScore: 90,
      carbonReduction: 'High - Reduces individual vehicle emissions by up to 80%',
      cost: 'Low to Moderate',
      availability: 'Widely available in major cities',
      icon: '🚇',
      tags: ['public', 'sustainable', 'affordable']
    },
    {
      id: 'cycling',
      name: 'Cycling',
      type: 'transport',
      category: 'eco_friendly',
      description: 'Rent bicycles or use bike-sharing services',
      ecoScore: 100,
      carbonReduction: 'Maximum - Zero emissions',
      cost: 'Low',
      availability: 'Available in most tourist destinations',
      icon: '🚲',
      tags: ['zero_emission', 'healthy', 'affordable']
    },
    {
      id: 'walking',
      name: 'Walking',
      type: 'transport',
      category: 'eco_friendly',
      description: 'Explore on foot - best for short distances',
      ecoScore: 100,
      carbonReduction: 'Maximum - Zero emissions',
      cost: 'Free',
      availability: 'Always available',
      icon: '🚶',
      tags: ['zero_emission', 'healthy', 'free']
    },
    {
      id: 'electric_vehicles',
      name: 'Electric Vehicles',
      type: 'transport',
      category: 'eco_friendly',
      description: 'Rent electric cars or use EV taxis',
      ecoScore: 75,
      carbonReduction: 'Medium to High - Significantly lower emissions than gasoline',
      cost: 'Moderate to High',
      availability: 'Growing availability in urban areas',
      icon: '🔌',
      tags: ['electric', 'low_emission', 'modern']
    },
    {
      id: 'shared_rides',
      name: 'Shared Rides',
      type: 'transport',
      category: 'eco_friendly',
      description: 'Use ride-sharing services to reduce per-person emissions',
      ecoScore: 60,
      carbonReduction: 'Medium - Reduces emissions through shared travel',
      cost: 'Moderate',
      availability: 'Available via apps',
      icon: '🚗',
      tags: ['shared', 'convenient', 'moderate_emission']
    }
  ];

  return transportOptions.map(option => ({
    ...option,
    destination: destination || 'Any',
    coordinates: lat && lng ? [parseFloat(lat), parseFloat(lng)] : null
  }));
}

// Get eco-friendly accommodation options
function getEcoFriendlyAccommodation(destination) {
  const accommodationOptions = [
    {
      id: 'eco_lodges',
      name: 'Eco-Lodges',
      type: 'accommodation',
      category: 'eco_friendly',
      description: 'Sustainable accommodations with environmental certifications',
      ecoScore: 85,
      features: ['Renewable energy', 'Water conservation', 'Waste reduction', 'Local sourcing'],
      certifications: ['Green Key', 'LEED', 'EarthCheck'],
      cost: 'Moderate to High',
      availability: 'Growing availability',
      icon: '🏡',
      tags: ['certified', 'sustainable', 'eco_lodge']
    },
    {
      id: 'green_hotels',
      name: 'Green Hotels',
      type: 'accommodation',
      category: 'eco_friendly',
      description: 'Hotels with environmental sustainability programs',
      ecoScore: 70,
      features: ['Energy efficient', 'Recycling programs', 'Local partnerships'],
      certifications: ['Green Key', 'Green Seal'],
      cost: 'Moderate',
      availability: 'Available in major destinations',
      icon: '🏨',
      tags: ['certified', 'hotel', 'sustainable']
    },
    {
      id: 'homestays',
      name: 'Homestays',
      type: 'accommodation',
      category: 'eco_friendly',
      description: 'Local homestays supporting community tourism',
      ecoScore: 80,
      features: ['Local economy support', 'Cultural immersion', 'Lower resource use'],
      certifications: [],
      cost: 'Low to Moderate',
      availability: 'Widely available',
      icon: '🏠',
      tags: ['local', 'community', 'authentic']
    },
    {
      id: 'camping',
      name: 'Camping',
      type: 'accommodation',
      category: 'eco_friendly',
      description: 'Eco-campsites with minimal environmental impact',
      ecoScore: 90,
      features: ['Low impact', 'Nature immersion', 'Minimal facilities'],
      certifications: ['Leave No Trace'],
      cost: 'Low',
      availability: 'Available in natural areas',
      icon: '⛺',
      tags: ['outdoor', 'minimal_impact', 'nature']
    }
  ];

  return accommodationOptions.map(option => ({
    ...option,
    destination: destination || 'Any'
  }));
}

// Get eco-friendly activity options
function getEcoFriendlyActivities(destination) {
  const activityOptions = [
    {
      id: 'nature_walks',
      name: 'Nature Walks & Hiking',
      type: 'activity',
      category: 'eco_friendly',
      description: 'Explore natural areas on foot',
      ecoScore: 95,
      impact: 'Positive - Supports conservation and minimal environmental impact',
      cost: 'Low to Free',
      availability: 'Available in natural areas',
      icon: '🥾',
      tags: ['nature', 'outdoor', 'zero_emission']
    },
    {
      id: 'wildlife_conservation',
      name: 'Wildlife Conservation Tours',
      type: 'activity',
      category: 'eco_friendly',
      description: 'Conservation-focused tours supporting wildlife protection',
      ecoScore: 85,
      impact: 'Positive - Directly supports conservation efforts',
      cost: 'Moderate to High',
      availability: 'Available in wildlife areas',
      icon: '🐘',
      tags: ['wildlife', 'conservation', 'educational']
    },
    {
      id: 'eco_tours',
      name: 'Eco-Tours',
      type: 'activity',
      category: 'eco_friendly',
      description: 'Environmentally responsible tour experiences',
      ecoScore: 75,
      impact: 'Positive - Raises environmental awareness',
      cost: 'Moderate',
      availability: 'Growing availability',
      icon: '🌱',
      tags: ['educational', 'sustainable', 'guided']
    },
    {
      id: 'local_markets',
      name: 'Local Markets & Craft Villages',
      type: 'activity',
      category: 'eco_friendly',
      description: 'Support local artisans and sustainable practices',
      ecoScore: 80,
      impact: 'Positive - Supports local economy and sustainable production',
      cost: 'Low to Moderate',
      availability: 'Available in most destinations',
      icon: '🛍️',
      tags: ['local', 'cultural', 'support_local']
    },
    {
      id: 'beach_cleanup',
      name: 'Beach Cleanup Activities',
      type: 'activity',
      category: 'eco_friendly',
      description: 'Participate in beach cleanup and conservation activities',
      ecoScore: 100,
      impact: 'Maximum - Direct positive environmental impact',
      cost: 'Free to Low',
      availability: 'Available in coastal areas',
      icon: '🏖️',
      tags: ['volunteer', 'conservation', 'positive_impact']
    }
  ];

  return activityOptions.map(option => ({
    ...option,
    destination: destination || 'Any'
  }));
}

// Calculate eco-score for an option (0-100)
function calculateEcoScore(option) {
  let score = 0;

  // Base score based on category
  const categoryScores = {
    'transport': { 'public_transport': 90, 'cycling': 100, 'walking': 100, 'electric_vehicles': 75, 'shared_rides': 60 },
    'accommodation': { 'eco_lodges': 85, 'green_hotels': 70, 'homestays': 80, 'camping': 90 },
    'activity': { 'nature_walks': 95, 'wildlife_conservation': 85, 'eco_tours': 75, 'local_markets': 80, 'beach_cleanup': 100 }
  };

  if (categoryScores[option.type] && categoryScores[option.type][option.id]) {
    score = categoryScores[option.type][option.id];
  }

  // Adjustments based on features
  if (option.features) {
    score += option.features.length * 2; // +2 points per eco-feature
  }

  if (option.certifications && option.certifications.length > 0) {
    score += option.certifications.length * 5; // +5 points per certification
  }

  return Math.min(100, Math.round(score));
}

// Calculate sustainability impact
function calculateSustainabilityImpact(option) {
  const impacts = {
    'transport': {
      'public_transport': 'Reduces CO2 emissions by 60-80% compared to private vehicles',
      'cycling': 'Zero emissions - completely carbon neutral',
      'walking': 'Zero emissions - completely carbon neutral',
      'electric_vehicles': 'Reduces CO2 emissions by 50-70% compared to gasoline vehicles',
      'shared_rides': 'Reduces per-person emissions by 30-50%'
    },
    'accommodation': {
      'eco_lodges': 'Minimal environmental footprint with renewable energy and conservation practices',
      'green_hotels': 'Reduced resource consumption and waste generation',
      'homestays': 'Supports local economy and reduces large-scale infrastructure impact',
      'camping': 'Minimal impact with Leave No Trace principles'
    },
    'activity': {
      'nature_walks': 'Zero emissions activity supporting natural conservation',
      'wildlife_conservation': 'Direct contribution to wildlife protection and habitat conservation',
      'eco_tours': 'Raises environmental awareness and supports conservation',
      'local_markets': 'Supports local sustainable production and reduces transportation footprint',
      'beach_cleanup': 'Direct positive environmental impact through cleanup and conservation'
    }
  };

  return impacts[option.type]?.[option.id] || 'Positive environmental impact';
}

// Generate sustainability insights
function generateSustainabilityInsights(options) {
  const insights = {
    averageEcoScore: 0,
    topCategories: {},
    recommendations: [],
    carbonReduction: {}
  };

  if (options.length === 0) {
    return insights;
  }

  // Calculate average eco-score
  insights.averageEcoScore = Math.round(
    options.reduce((sum, opt) => sum + (opt.ecoScore || 0), 0) / options.length
  );

  // Count by category
  options.forEach(option => {
    const category = option.category || 'other';
    insights.topCategories[category] = (insights.topCategories[category] || 0) + 1;
  });

  // Recommendations
  if (insights.averageEcoScore < 70) {
    insights.recommendations.push({
      type: 'improvement',
      message: 'Consider more eco-friendly options to improve sustainability score',
      priority: 'medium'
    });
  }

  return insights;
}

// Generate comprehensive sustainability recommendations
async function generateSustainabilityRecommendations(destination, startDate, endDate, groupSize, travelStyle) {
  const recommendations = {
    transport: getEcoFriendlyTransport(destination),
    accommodation: getEcoFriendlyAccommodation(destination),
    activities: getEcoFriendlyActivities(destination),
    tips: []
  };

  // Add style-specific recommendations
  if (travelStyle === 'budget') {
    recommendations.tips.push('Public transport and walking are most eco-friendly and budget-friendly');
  } else if (travelStyle === 'luxury') {
    recommendations.tips.push('Consider eco-lodges and green hotels for luxury sustainable options');
  }

  return recommendations;
}

// Calculate carbon footprint estimate
function calculateCarbonFootprint(destination, startDate, endDate, groupSize, travelStyle, recommendations) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  // Base carbon footprint estimates (kg CO2 per day per person)
  const baseFootprints = {
    budget: 5,      // Low carbon footprint
    moderate: 8,    // Medium carbon footprint
    luxury: 15      // Higher carbon footprint
  };

  const baseFootprint = baseFootprints[travelStyle] || baseFootprints.moderate;
  const totalFootprint = baseFootprint * days * groupSize;

  // Adjust based on eco-friendly choices
  let reduction = 0;
  if (recommendations.transport && recommendations.transport.length > 0) {
    reduction += 0.3; // 30% reduction with eco transport
  }
  if (recommendations.accommodation && recommendations.accommodation.length > 0) {
    reduction += 0.2; // 20% reduction with eco accommodation
  }

  const adjustedFootprint = totalFootprint * (1 - reduction);

  return {
    estimatedTotal: Math.round(adjustedFootprint),
    estimatedPerDay: Math.round(adjustedFootprint / days),
    estimatedPerPerson: Math.round(adjustedFootprint / groupSize),
    reductionPercentage: Math.round(reduction * 100),
    comparison: {
      standard: Math.round(totalFootprint),
      ecoFriendly: Math.round(adjustedFootprint),
      savings: Math.round(totalFootprint - adjustedFootprint)
    },
    unit: 'kg CO2 equivalent'
  };
}

// Calculate overall sustainability score
function calculateOverallSustainabilityScore(recommendations) {
  let score = 0;
  let count = 0;

  ['transport', 'accommodation', 'activities'].forEach(category => {
    if (recommendations[category] && recommendations[category].length > 0) {
      const avgScore = recommendations[category].reduce((sum, opt) => sum + (opt.ecoScore || 0), 0) / recommendations[category].length;
      score += avgScore;
      count++;
    }
  });

  return count > 0 ? Math.round(score / count) : 0;
}

// Get sustainability tips
function getSustainabilityTips(travelStyle, groupSize) {
  const tips = [
    'Choose public transportation or walking for short distances',
    'Support local businesses and communities',
    'Reduce plastic waste by carrying a reusable water bottle',
    'Choose accommodations with environmental certifications',
    'Participate in eco-friendly activities and conservation efforts',
    'Minimize energy consumption in accommodations',
    'Support sustainable tourism initiatives'
  ];

  if (travelStyle === 'budget') {
    tips.push('Public transport is both eco-friendly and budget-friendly');
  }

  if (groupSize > 1) {
    tips.push('Share rides and accommodations to reduce per-person environmental impact');
  }

  return tips;
}

