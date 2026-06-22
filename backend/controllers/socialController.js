import sentimentAnalysisService from '../services/sentimentAnalysisService.js';

// Get social insights and sentiment analysis
export const getSocialInsights = async (req, res) => {
  try {
    const {
      destination = '',
      attractions = [],
      accommodations = [],
      restaurants = []
    } = req.query;

    if (!destination) {
      return res.status(400).json({ 
        error: 'Destination is required for social insights' 
      });
    }

    console.log('Social insights request:', { 
      destination, 
      attractionsCount: attractions.length, 
      accommodationsCount: accommodations.length,
      restaurantsCount: restaurants.length 
    });

    // Parse arrays from query strings
    const attractionsList = Array.isArray(attractions) ? attractions : attractions.split(',');
    const accommodationsList = Array.isArray(accommodations) ? accommodations : accommodations.split(',');
    const restaurantsList = Array.isArray(restaurants) ? restaurants : restaurants.split(',');

    // Generate social insights
    const socialInsights = sentimentAnalysisService.generateSocialInsights(
      attractionsList,
      accommodationsList,
      restaurantsList
    );

    // Get real-time sentiment monitoring
    const realTimeSentiment = await sentimentAnalysisService.monitorSocialSentiment(
      destination,
      [...attractionsList, ...accommodationsList, ...restaurantsList]
    );

    // Generate traveler recommendations
    const recommendations = generateTravelerRecommendations(socialInsights, realTimeSentiment);

    res.json({
      success: true,
      destination: destination,
      socialInsights: socialInsights,
      realTimeSentiment: realTimeSentiment,
      recommendations: recommendations,
      analysis: {
        totalReviewsAnalyzed: socialInsights.totalReviews || 0,
        overallSentiment: realTimeSentiment.overallSentiment,
        confidence: realTimeSentiment.sentimentScore * 100
      },
      algorithm: 'vader_sentiment_analysis',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Social insights error:', error);
    res.status(500).json({ 
      error: 'Failed to get social insights',
      message: error.message 
    });
  }
};

// Get eco-friendly accommodation and activity options
export const getEcoFriendlyOptions = async (req, res) => {
  try {
    const {
      destination = '',
      type = 'all', // 'accommodation', 'activities', 'all'
      budget = 'medium'
    } = req.query;

    if (!destination) {
      return res.status(400).json({ 
        error: 'Destination is required for eco-friendly options' 
      });
    }

    console.log('Eco-friendly options request:', { destination, type, budget });

    // Get eco-friendly options
    const ecoFriendlyOptions = await getEcoFriendlyRecommendations(destination, type, budget);

    // Calculate environmental impact
    const environmentalImpact = calculateEnvironmentalImpact(ecoFriendlyOptions, destination);

    // Generate sustainability tips
    const sustainabilityTips = generateSustainabilityTips(destination, type);

    // Get eco-certifications and standards
    const certifications = getEcoCertifications();

    res.json({
      success: true,
      destination: destination,
      type: type,
      budget: budget,
      ecoFriendlyOptions: ecoFriendlyOptions,
      environmentalImpact: environmentalImpact,
      sustainabilityTips: sustainabilityTips,
      certifications: certifications,
      ecoScore: calculateEcoScore(ecoFriendlyOptions),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Eco-friendly options error:', error);
    res.status(500).json({ 
      error: 'Failed to get eco-friendly options',
      message: error.message 
    });
  }
};

// Analyze sustainability of travel choices
export const analyzeSustainability = async (req, res) => {
  try {
    const {
      destination,
      tripDetails = {},
      selectedOptions = {},
      travelMode = 'flight',
      accommodation = {},
      activities = []
    } = req.body;

    if (!destination) {
      return res.status(400).json({ 
        error: 'Destination is required for sustainability analysis' 
      });
    }

    console.log('Sustainability analysis request:', { 
      destination, 
      travelMode, 
      activitiesCount: activities.length,
      hasAccommodation: !!accommodation 
    });

    // Calculate carbon footprint
    const carbonFootprint = calculateCarbonFootprint({
      destination,
      travelMode,
      tripDetails,
      accommodation,
      activities
    });

    // Analyze eco-friendliness of choices
    const ecoAnalysis = analyzeEcoFriendliness(selectedOptions, accommodation, activities);

    // Generate sustainability score
    const sustainabilityScore = calculateSustainabilityScore(carbonFootprint, ecoAnalysis);

    // Generate improvement recommendations
    const improvements = generateSustainabilityImprovements(carbonFootprint, ecoAnalysis, destination);

    // Calculate environmental impact
    const environmentalImpact = calculateOverallEnvironmentalImpact(carbonFootprint, ecoAnalysis);

    res.json({
      success: true,
      destination: destination,
      sustainabilityScore: sustainabilityScore,
      carbonFootprint: carbonFootprint,
      ecoAnalysis: ecoAnalysis,
      environmentalImpact: environmentalImpact,
      improvements: improvements,
      recommendations: generateSustainabilityRecommendations(sustainabilityScore, destination),
      algorithm: 'sustainability_impact_analysis',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sustainability analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze sustainability',
      message: error.message 
    });
  }
};

// Generate eco-friendly recommendations
async function getEcoFriendlyRecommendations(destination, type, budget) {
  const recommendations = {
    accommodations: [],
    activities: [],
    restaurants: [],
    transportation: []
  };

  // Eco-friendly accommodations
  if (type === 'all' || type === 'accommodation') {
    recommendations.accommodations = getEcoFriendlyAccommodations(destination, budget);
  }

  // Eco-friendly activities
  if (type === 'all' || type === 'activities') {
    recommendations.activities = getEcoFriendlyActivities(destination, budget);
  }

  // Eco-friendly restaurants
  if (type === 'all') {
    recommendations.restaurants = getEcoFriendlyRestaurants(destination, budget);
  }

  // Eco-friendly transportation
  if (type === 'all') {
    recommendations.transportation = getEcoFriendlyTransportation(destination);
  }

  return recommendations;
}

// Get eco-friendly accommodations
function getEcoFriendlyAccommodations(destination, budget) {
  const ecoAccommodations = {
    'goa': [
      {
        name: 'Goa Eco Resort',
        type: 'eco_resort',
        rating: 4.5,
        price: 6000,
        ecoFeatures: ['Solar power', 'Rainwater harvesting', 'Organic garden', 'Waste recycling'],
        certifications: ['Green Globe', 'Eco-Friendly'],
        description: 'Sustainable beachfront resort with eco-friendly practices'
      },
      {
        name: 'Spice Garden Eco Lodge',
        type: 'eco_lodge',
        rating: 4.3,
        price: 4000,
        ecoFeatures: ['Organic farming', 'Natural materials', 'Energy efficient', 'Local sourcing'],
        certifications: ['Eco-Friendly'],
        description: 'Rustic eco-lodge surrounded by spice gardens'
      }
    ],
    'mumbai': [
      {
        name: 'Green Hotel Mumbai',
        type: 'eco_hotel',
        rating: 4.2,
        price: 8000,
        ecoFeatures: ['LED lighting', 'Water conservation', 'Local sourcing', 'Waste reduction'],
        certifications: ['Green Building'],
        description: 'Urban eco-hotel with sustainable practices'
      }
    ],
    'delhi': [
      {
        name: 'Eco Heritage Hotel',
        type: 'heritage_eco',
        rating: 4.4,
        price: 7000,
        ecoFeatures: ['Heritage conservation', 'Solar panels', 'Organic food', 'Local artisans'],
        certifications: ['Heritage Green'],
        description: 'Historic hotel with modern eco-friendly amenities'
      }
    ]
  };

  const accommodations = ecoAccommodations[destination.toLowerCase()] || [
    {
      name: `${destination} Eco Hotel`,
      type: 'eco_hotel',
      rating: 4.0,
      price: 5000,
      ecoFeatures: ['Energy efficient', 'Water conservation', 'Local sourcing'],
      certifications: ['Eco-Friendly'],
      description: `Eco-friendly accommodation in ${destination}`
    }
  ];

  // Filter by budget
  return filterByBudget(accommodations, budget);
}

// Get eco-friendly activities
function getEcoFriendlyActivities(destination, budget) {
  const ecoActivities = {
    'goa': [
      {
        name: 'Spice Plantation Tour',
        type: 'eco_tourism',
        price: 800,
        ecoFeatures: ['Organic farming', 'Biodiversity conservation', 'Local community support'],
        duration: 'Half day',
        description: 'Educational tour of organic spice plantations'
      },
      {
        name: 'Mangrove Kayaking',
        type: 'nature_exploration',
        price: 1200,
        ecoFeatures: ['Ecosystem protection', 'Minimal impact', 'Wildlife conservation'],
        duration: '3 hours',
        description: 'Eco-friendly kayaking through mangrove forests'
      }
    ],
    'mumbai': [
      {
        name: 'Urban Farming Tour',
        type: 'eco_education',
        price: 600,
        ecoFeatures: ['Sustainable agriculture', 'Urban greening', 'Community building'],
        duration: '2 hours',
        description: 'Tour of urban farming initiatives in Mumbai'
      }
    ],
    'delhi': [
      {
        name: 'Heritage Walk (Eco-friendly)',
        type: 'cultural_eco',
        price: 500,
        ecoFeatures: ['Cultural preservation', 'Walking tour', 'Local guides'],
        duration: '3 hours',
        description: 'Sustainable heritage walking tour'
      }
    ]
  };

  const activities = ecoActivities[destination.toLowerCase()] || [
    {
      name: `${destination} Eco Tour`,
      type: 'eco_tourism',
      price: 800,
      ecoFeatures: ['Environmental education', 'Local community support'],
      duration: 'Half day',
      description: `Eco-friendly tour of ${destination}`
    }
  ];

  return filterByBudget(activities, budget);
}

// Get eco-friendly restaurants
function getEcoFriendlyRestaurants(destination, budget) {
  const ecoRestaurants = {
    'goa': [
      {
        name: 'Organic Kitchen',
        cuisine: 'Organic Indian',
        rating: 4.5,
        priceRange: 800,
        ecoFeatures: ['100% organic ingredients', 'Local sourcing', 'Zero waste', 'Composting'],
        certifications: ['Organic Certified']
      }
    ],
    'mumbai': [
      {
        name: 'Farm to Table',
        cuisine: 'Sustainable Indian',
        rating: 4.3,
        priceRange: 1200,
        ecoFeatures: ['Local farmers', 'Seasonal menu', 'Sustainable packaging'],
        certifications: ['Local Sourcing']
      }
    ]
  };

  const restaurants = ecoRestaurants[destination.toLowerCase()] || [
    {
      name: `${destination} Green Kitchen`,
      cuisine: 'Eco-friendly',
      rating: 4.0,
      priceRange: 600,
      ecoFeatures: ['Local ingredients', 'Sustainable practices'],
      certifications: ['Eco-Friendly']
    }
  ];

  return filterByBudget(restaurants, budget);
}

// Get eco-friendly transportation options
function getEcoFriendlyTransportation() {
  return [
    {
      type: 'public_transport',
      name: 'Metro/Bus System',
      ecoScore: 95,
      description: 'Most eco-friendly option for city travel',
      features: ['Low carbon footprint', 'Reduced traffic', 'Affordable']
    },
    {
      type: 'cycling',
      name: 'Bicycle Tours',
      ecoScore: 100,
      description: 'Zero-emission transportation',
      features: ['Zero carbon footprint', 'Healthy', 'Scenic routes']
    },
    {
      type: 'electric_vehicle',
      name: 'Electric Taxi',
      ecoScore: 85,
      description: 'Electric vehicle transportation',
      features: ['Low emissions', 'Clean energy', 'Comfortable']
    },
    {
      type: 'walking',
      name: 'Walking Tours',
      ecoScore: 100,
      description: 'Most sustainable way to explore',
      features: ['Zero emissions', 'Health benefits', 'Intimate experience']
    }
  ];
}

// Filter by budget
function filterByBudget(items, budget) {
  const budgetRanges = {
    'low': { min: 0, max: 1000 },
    'medium': { min: 0, max: 3000 },
    'high': { min: 0, max: 8000 },
    'luxury': { min: 0, max: 20000 }
  };

  const range = budgetRanges[budget] || budgetRanges.medium;
  return items.filter(item => {
    const price = item.price || item.priceRange || 0;
    return price >= range.min && price <= range.max;
  });
}

// Calculate environmental impact
function calculateEnvironmentalImpact(ecoFriendlyOptions) {
  const impact = {
    carbonReduction: 0,
    waterConservation: 0,
    wasteReduction: 0,
    biodiversitySupport: 0,
    overallScore: 0
  };

  // Calculate based on eco-friendly options selected
  const totalOptions = Object.values(ecoFriendlyOptions).flat().length;
  
  if (totalOptions > 0) {
    impact.carbonReduction = Math.min(totalOptions * 15, 100); // Up to 100%
    impact.waterConservation = Math.min(totalOptions * 12, 100);
    impact.wasteReduction = Math.min(totalOptions * 18, 100);
    impact.biodiversitySupport = Math.min(totalOptions * 10, 100);
    
    impact.overallScore = Math.round(
      (impact.carbonReduction + impact.waterConservation + 
       impact.wasteReduction + impact.biodiversitySupport) / 4
    );
  }

  return impact;
}

// Generate sustainability tips
function generateSustainabilityTips(destination, type) {
  const tips = {
    general: [
      'Choose eco-certified accommodations',
      'Support local businesses and communities',
      'Minimize waste and use reusable items',
      'Use public transportation or walking',
      'Respect local wildlife and ecosystems'
    ],
    accommodation: [
      'Look for hotels with energy-efficient practices',
      'Choose accommodations that support local communities',
      'Opt for places with water conservation measures',
      'Select hotels that use renewable energy'
    ],
    activities: [
      'Choose nature-based activities that support conservation',
      'Support eco-tourism initiatives',
      'Avoid activities that harm wildlife',
      'Participate in environmental education programs'
    ],
    transportation: [
      'Use public transportation when possible',
      'Choose walking or cycling for short distances',
      'Opt for electric or hybrid vehicles',
      'Offset carbon emissions for flights'
    ]
  };

  return tips[type] || tips.general;
}

// Get eco-certifications
function getEcoCertifications() {
  return [
    {
      name: 'Green Globe',
      description: 'Global certification for sustainable tourism',
      criteria: ['Environmental management', 'Social responsibility', 'Economic benefits']
    },
    {
      name: 'LEED Certified',
      description: 'Leadership in Energy and Environmental Design',
      criteria: ['Energy efficiency', 'Water conservation', 'Sustainable materials']
    },
    {
      name: 'Rainforest Alliance',
      description: 'Sustainable tourism and agriculture',
      criteria: ['Environmental protection', 'Social equity', 'Economic viability']
    },
    {
      name: 'EarthCheck',
      description: 'Environmental benchmarking and certification',
      criteria: ['Energy efficiency', 'Waste management', 'Water conservation']
    }
  ];
}

// Calculate eco score
function calculateEcoScore(ecoFriendlyOptions) {
  const totalOptions = Object.values(ecoFriendlyOptions).flat().length;
  const maxScore = 100;
  
  // Base score from number of eco-friendly options
  let score = Math.min(totalOptions * 15, 70);
  
  // Bonus for having options in all categories
  const categoriesWithOptions = Object.values(ecoFriendlyOptions).filter(cat => cat.length > 0).length;
  score += categoriesWithOptions * 5;
  
  return Math.min(score, maxScore);
}

// Calculate carbon footprint
function calculateCarbonFootprint(travelData) {
  const { destination, travelMode, tripDetails, accommodation, activities } = travelData;
  
  let carbonFootprint = {
    transportation: 0,
    accommodation: 0,
    activities: 0,
    total: 0,
    breakdown: {}
  };

  // Transportation carbon footprint (kg CO2)
  const transportEmissions = {
    'flight': 285, // kg CO2 per hour
    'train': 14,
    'bus': 89,
    'car': 120,
    'electric_vehicle': 53
  };

  // Estimate transportation emissions (simplified)
  const estimatedTravelTime = getEstimatedTravelTime(destination, travelMode);
  carbonFootprint.transportation = transportEmissions[travelMode] * estimatedTravelTime;

  // Accommodation emissions (kg CO2 per night)
  const accommodationEmissions = {
    'luxury_hotel': 45,
    'mid_range_hotel': 25,
    'eco_hotel': 15,
    'hostel': 10
  };

  const nights = tripDetails.duration || 3;
  const accommodationType = accommodation.type || 'mid_range_hotel';
  carbonFootprint.accommodation = accommodationEmissions[accommodationType] * nights;

  // Activity emissions (kg CO2 per activity)
  const activityEmissions = {
    'eco_tour': 5,
    'nature_walk': 0,
    'museum': 2,
    'adventure_sport': 20,
    'city_tour': 10
  };

  carbonFootprint.activities = activities.reduce((total, activity) => {
    return total + (activityEmissions[activity.type] || 10);
  }, 0);

  // Calculate total
  carbonFootprint.total = carbonFootprint.transportation + 
                          carbonFootprint.accommodation + 
                          carbonFootprint.activities;

  // Generate breakdown
  carbonFootprint.breakdown = {
    transportation: Math.round((carbonFootprint.transportation / carbonFootprint.total) * 100),
    accommodation: Math.round((carbonFootprint.accommodation / carbonFootprint.total) * 100),
    activities: Math.round((carbonFootprint.activities / carbonFootprint.total) * 100)
  };

  return carbonFootprint;
}

// Get estimated travel time
function getEstimatedTravelTime(destination, travelMode) {
  // Simplified estimation based on common destinations
  const travelTimes = {
    'flight': 2, // Average 2 hours for domestic flights
    'train': 8, // Average 8 hours for train travel
    'bus': 12, // Average 12 hours for bus travel
    'car': 6, // Average 6 hours for car travel
    'electric_vehicle': 6 // Same as car but cleaner
  };

  return travelTimes[travelMode] || 4;
}

// Analyze eco-friendliness of choices
function analyzeEcoFriendliness(selectedOptions, accommodation, activities) {
  const analysis = {
    accommodation: {
      ecoScore: 0,
      features: [],
      improvements: []
    },
    activities: {
      ecoScore: 0,
      features: [],
      improvements: []
    },
    transportation: {
      ecoScore: 0,
      features: [],
      improvements: []
    },
    overall: 0
  };

  // Analyze accommodation
  if (accommodation.ecoFeatures) {
    analysis.accommodation.ecoScore = accommodation.ecoFeatures.length * 20;
    analysis.accommodation.features = accommodation.ecoFeatures;
  } else {
    analysis.accommodation.improvements.push('Choose eco-friendly accommodation');
  }

  // Analyze activities
  const ecoActivities = activities.filter(activity => 
    activity.type?.includes('eco') || activity.ecoFeatures
  );
  analysis.activities.ecoScore = (ecoActivities.length / activities.length) * 100;
  analysis.activities.features = ecoActivities.map(a => a.name);

  if (ecoActivities.length === 0) {
    analysis.activities.improvements.push('Include eco-friendly activities');
  }

  // Analyze transportation (assume public transport is eco-friendly)
  analysis.transportation.ecoScore = 75; // Default score
  analysis.transportation.features = ['Public transport available'];

  // Calculate overall eco-friendliness
  analysis.overall = Math.round(
    (analysis.accommodation.ecoScore + 
     analysis.activities.ecoScore + 
     analysis.transportation.ecoScore) / 3
  );

  return analysis;
}

// Calculate sustainability score
function calculateSustainabilityScore(carbonFootprint, ecoAnalysis) {
  const maxCarbonFootprint = 1000; // kg CO2
  const carbonScore = Math.max(0, 100 - (carbonFootprint.total / maxCarbonFootprint) * 100);
  const ecoScore = ecoAnalysis.overall;
  
  return Math.round((carbonScore + ecoScore) / 2);
}

// Generate sustainability improvements
function generateSustainabilityImprovements(carbonFootprint, ecoAnalysis) {
  const improvements = [];

  // Carbon footprint improvements
  if (carbonFootprint.transportation > 500) {
    improvements.push({
      category: 'transportation',
      priority: 'high',
      message: 'Consider more eco-friendly transportation options',
      impact: 'Could reduce carbon footprint by 30-50%'
    });
  }

  if (carbonFootprint.accommodation > 100) {
    improvements.push({
      category: 'accommodation',
      priority: 'medium',
      message: 'Choose eco-friendly accommodation',
      impact: 'Could reduce carbon footprint by 20-40%'
    });
  }

  // Eco-friendliness improvements
  if (ecoAnalysis.accommodation.ecoScore < 50) {
    improvements.push({
      category: 'accommodation',
      priority: 'medium',
      message: 'Select accommodations with eco-friendly features',
      impact: 'Better environmental practices and local community support'
    });
  }

  if (ecoAnalysis.activities.ecoScore < 50) {
    improvements.push({
      category: 'activities',
      priority: 'medium',
      message: 'Include more eco-friendly activities',
      impact: 'Support local conservation and community initiatives'
    });
  }

  return improvements;
}

// Calculate overall environmental impact
function calculateOverallEnvironmentalImpact(carbonFootprint, ecoAnalysis) {
  return {
    carbonFootprint: carbonFootprint.total,
    ecoFriendliness: ecoAnalysis.overall,
    sustainability: calculateSustainabilityScore(carbonFootprint, ecoAnalysis),
    recommendations: {
      carbonReduction: Math.round(carbonFootprint.total * 0.3), // Potential 30% reduction
      ecoImprovement: Math.round((100 - ecoAnalysis.overall) * 0.5) // Potential improvement
    }
  };
}

// Generate sustainability recommendations
function generateSustainabilityRecommendations(sustainabilityScore) {
  const recommendations = [];

  if (sustainabilityScore >= 80) {
    recommendations.push({
      type: 'excellent',
      message: 'Your travel choices are highly sustainable!',
      suggestions: ['Continue your eco-friendly practices', 'Share your sustainable travel tips']
    });
  } else if (sustainabilityScore >= 60) {
    recommendations.push({
      type: 'good',
      message: 'Good sustainability practices with room for improvement',
      suggestions: ['Consider more eco-friendly transportation', 'Choose sustainable accommodations']
    });
  } else {
    recommendations.push({
      type: 'needs_improvement',
      message: 'Significant opportunities to improve sustainability',
      suggestions: [
        'Choose eco-friendly transportation options',
        'Select sustainable accommodations',
        'Include eco-friendly activities',
        'Minimize waste and use reusable items'
      ]
    });
  }

  return recommendations;
}

// Generate traveler recommendations
function generateTravelerRecommendations(socialInsights, realTimeSentiment) {
  const recommendations = [];

  // Positive recommendations
  if (socialInsights.topPositiveAspects.length > 0) {
    recommendations.push({
      type: 'positive',
      message: 'Highly recommended experiences based on traveler reviews',
      items: socialInsights.topPositiveAspects.slice(0, 5)
    });
  }

  // Caution recommendations
  if (socialInsights.commonComplaints.length > 0) {
    recommendations.push({
      type: 'caution',
      message: 'Consider these factors when planning your trip',
      items: socialInsights.commonComplaints.slice(0, 3)
    });
  }

  // Real-time sentiment recommendations
  if (realTimeSentiment.overallSentiment === 'positive') {
    recommendations.push({
      type: 'sentiment',
      message: 'Current social media sentiment is positive for your destination',
      note: 'Great time to visit based on recent traveler experiences'
    });
  }

  return recommendations;
}

