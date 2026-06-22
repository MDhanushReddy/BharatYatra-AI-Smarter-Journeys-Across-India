// Budget Allocation Controller - Step 3 Implementation
// Takes total budget, duration, and travel style to distribute funds across categories

export const allocateBudget = async (req, res) => {
  try {
    const {
      totalBudget,
      duration,
      travelStyle = 'moderate', // relaxed, moderate, intense, luxury, budget
      groupType = 'solo', // solo, couple, family, friends, group
      groupSize = 1,
      destination = '',
      preferences = {}
    } = req.body;

    if (!totalBudget || !duration) {
      return res.status(400).json({
        error: 'Total budget and duration are required'
      });
    }

    console.log('Budget allocation request:', {
      totalBudget, duration, travelStyle, groupType, groupSize, destination
    });

    // Calculate budget allocation based on travel style
    const allocation = calculateBudgetAllocation(
      parseFloat(totalBudget),
      parseInt(duration),
      travelStyle,
      groupType,
      parseInt(groupSize),
      preferences
    );

    // Generate budget insights and recommendations
    const insights = generateBudgetInsights(allocation, duration, travelStyle);
    const recommendations = generateBudgetRecommendations(allocation, duration, travelStyle, preferences);

    res.json({
      success: true,
      budgetAllocation: allocation,
      insights: insights,
      recommendations: recommendations,
      summary: {
        totalBudget: totalBudget,
        duration: duration,
        dailyBudget: Math.round(totalBudget / duration),
        perPersonBudget: Math.round(totalBudget / (groupSize || 1)),
        groupSize: groupSize || 1,
        travelStyle: travelStyle
      },
      algorithm: 'intelligent_budget_allocation',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Budget allocation error:', error);
    res.status(500).json({
      error: 'Failed to allocate budget',
      message: error.message
    });
  }
};

// Get budget recommendations based on criteria
export const getBudgetRecommendations = async (req, res) => {
  try {
    const {
      destination = '',
      duration = 3,
      travelStyle = 'moderate',
      groupType = 'couple',
      groupSize = 2
    } = req.query;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    console.log('Budget recommendations request:', {
      destination, duration, travelStyle, groupType, groupSize
    });

    // Get estimated costs for destination
    const estimatedCosts = estimateDestinationCosts(
      destination,
      parseInt(duration),
      travelStyle,
      groupType,
      parseInt(groupSize)
    );

    // Generate budget range recommendations
  const recommendations = generateBudgetRangeRecommendations(
      estimatedCosts,
      travelStyle
    );

    res.json({
      success: true,
      destination: destination,
      estimatedCosts: estimatedCosts,
      recommendations: recommendations,
      travelStyle: travelStyle,
      groupType: groupType,
      groupSize: parseInt(groupSize),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Budget recommendations error:', error);
    res.status(500).json({
      error: 'Failed to get budget recommendations',
      message: error.message
    });
  }
};

// Calculate budget allocation based on multiple factors
function calculateBudgetAllocation(totalBudget, duration, travelStyle, groupType, groupSize, preferences) {
  // Base allocation percentages by travel style
  const baseAllocations = {
    'budget': {
      accommodation: 0.30,
      food: 0.20,
      transportation: 0.25,
      activities: 0.20,
      miscellaneous: 0.05
    },
    'relaxed': {
      accommodation: 0.35,
      food: 0.25,
      transportation: 0.20,
      activities: 0.15,
      miscellaneous: 0.05
    },
    'moderate': {
      accommodation: 0.35,
      food: 0.25,
      transportation: 0.20,
      activities: 0.15,
      miscellaneous: 0.05
    },
    'intense': {
      accommodation: 0.30,
      food: 0.20,
      transportation: 0.25,
      activities: 0.20,
      miscellaneous: 0.05
    },
    'luxury': {
      accommodation: 0.45,
      food: 0.30,
      transportation: 0.15,
      activities: 0.08,
      miscellaneous: 0.02
    }
  };

  let allocation = baseAllocations[travelStyle] || baseAllocations['moderate'];

  // Adjust based on group type
  if (groupType === 'family') {
    allocation.accommodation = Math.min(allocation.accommodation + 0.05, 0.50);
    allocation.activities = Math.max(allocation.activities - 0.02, 0.10);
  } else if (groupType === 'solo') {
    allocation.accommodation = Math.max(allocation.accommodation - 0.05, 0.25);
    allocation.food = allocation.food + 0.02;
  }

  // Calculate per person budget
  // Calculate amounts for each category
  const breakdown = {
    accommodation: {
      amount: Math.round(totalBudget * allocation.accommodation),
      percentage: Math.round(allocation.accommodation * 100),
      perDay: Math.round((totalBudget * allocation.accommodation) / duration),
      perPerson: Math.round((totalBudget * allocation.accommodation) / (groupSize || 1)),
      description: getCategoryDescription('accommodation', travelStyle, groupType)
    },
    food: {
      amount: Math.round(totalBudget * allocation.food),
      percentage: Math.round(allocation.food * 100),
      perDay: Math.round((totalBudget * allocation.food) / duration),
      perPerson: Math.round((totalBudget * allocation.food) / (groupSize || 1)),
      description: getCategoryDescription('food', travelStyle, groupType)
    },
    transportation: {
      amount: Math.round(totalBudget * allocation.transportation),
      percentage: Math.round(allocation.transportation * 100),
      perDay: Math.round((totalBudget * allocation.transportation) / duration),
      perPerson: Math.round((totalBudget * allocation.transportation) / (groupSize || 1)),
      description: getCategoryDescription('transportation', travelStyle, groupType)
    },
    activities: {
      amount: Math.round(totalBudget * allocation.activities),
      percentage: Math.round(allocation.activities * 100),
      perDay: Math.round((totalBudget * allocation.activities) / duration),
      perPerson: Math.round((totalBudget * allocation.activities) / (groupSize || 1)),
      description: getCategoryDescription('activities', travelStyle, groupType)
    },
    miscellaneous: {
      amount: Math.round(totalBudget * allocation.miscellaneous),
      percentage: Math.round(allocation.miscellaneous * 100),
      perDay: Math.round((totalBudget * allocation.miscellaneous) / duration),
      perPerson: Math.round((totalBudget * allocation.miscellaneous) / (groupSize || 1)),
      description: getCategoryDescription('miscellaneous', travelStyle, groupType)
    }
  };

  // Add shopping category if specified
  if (preferences.includeShopping) {
    const shoppingAllocation = 0.05;
    const currentTotal = Object.values(allocation).reduce((sum, val) => sum + val, 0);
    
    if (currentTotal + shoppingAllocation <= 1.0) {
      breakdown.shopping = {
        amount: Math.round(totalBudget * shoppingAllocation),
        percentage: Math.round(shoppingAllocation * 100),
        perDay: Math.round((totalBudget * shoppingAllocation) / duration),
        perPerson: Math.round((totalBudget * shoppingAllocation) / (groupSize || 1)),
        description: 'Shopping and souvenirs budget'
      };
    }
  }

  // Calculate total to ensure it matches
  const totalAllocated = Object.values(breakdown).reduce((sum, cat) => sum + cat.amount, 0);
  const difference = totalBudget - totalAllocated;
  
  // Adjust the largest category to cover the difference
  if (Math.abs(difference) > 0) {
    const largestCategory = Object.entries(breakdown).reduce((max, [key, value]) => 
      value.amount > max.amount ? { key, amount: value.amount } : max,
      { key: 'accommodation', amount: 0 }
    );
    breakdown[largestCategory.key].amount += Math.round(difference);
  }

  return breakdown;
}

// Get category description based on travel style
function getCategoryDescription(category, travelStyle) {
  const descriptions = {
    accommodation: {
      budget: 'Hostels, guesthouses, or budget hotels',
      relaxed: 'Comfortable hotels with good amenities',
      moderate: 'Mid-range hotels or resorts',
      luxury: 'Premium hotels or luxury resorts',
      intense: 'Basic accommodation to save for activities'
    },
    food: {
      budget: 'Street food and local restaurants',
      relaxed: 'Mix of local and restaurant dining',
      moderate: 'Restaurants with occasional fine dining',
      luxury: 'Fine dining and premium restaurants',
      intense: 'Quick meals and local food'
    },
    transportation: {
      budget: 'Public transport and shared rides',
      relaxed: 'Mix of public and private transport',
      moderate: 'Private cabs and rental vehicles',
      luxury: 'Private transport and premium vehicles',
      intense: 'Public transport and group tours'
    },
    activities: {
      budget: 'Free attractions and low-cost activities',
      relaxed: 'Main attractions with some premium experiences',
      moderate: 'Major attractions and experiences',
      luxury: 'Exclusive experiences and private tours',
      intense: 'Maximum activities and adventures'
    },
    miscellaneous: {
      budget: 'Emergency fund and essentials',
      relaxed: 'Shopping, tips, and extras',
      moderate: 'Shopping, tips, and leisure',
      luxury: 'Shopping, tips, and premium extras',
      intense: 'Emergency fund and activity extras'
    }
  };

  return descriptions[category]?.[travelStyle] || descriptions[category]?.moderate || 'Budget allocation for this category';
}

// Generate budget insights
function generateBudgetInsights(allocation, duration, travelStyle) {
  const insights = {
    categoryDistribution: {},
    budgetEfficiency: {},
    recommendations: []
  };

  // Analyze category distribution
  Object.entries(allocation).forEach(([category, data]) => {
    insights.categoryDistribution[category] = {
      percentage: data.percentage,
      perDay: data.perDay,
      priority: data.percentage >= 30 ? 'high' : data.percentage >= 15 ? 'medium' : 'low'
    };
  });

  // Budget efficiency analysis
  const dailyBudget = Object.values(allocation).reduce((sum, cat) => sum + cat.perDay, 0);
  
  insights.budgetEfficiency = {
    dailyBudget: dailyBudget,
    budgetPerDay: Math.round(dailyBudget),
    efficiencyRating: calculateEfficiencyRating(allocation, travelStyle),
    affordability: getAffordabilityRating(dailyBudget)
  };

  // Generate recommendations
  if (allocation.accommodation.percentage < 25) {
    insights.recommendations.push({
      type: 'accommodation',
      priority: 'medium',
      message: 'Accommodation budget is low - consider hostels or shared accommodations',
      suggestion: 'Look for budget-friendly options or consider adjusting your travel style'
    });
  }

  if (allocation.activities.percentage < 10) {
    insights.recommendations.push({
      type: 'activities',
      priority: 'low',
      message: 'Low activity budget - focus on free attractions',
      suggestion: 'Look for free walking tours and public parks'
    });
  }

  return insights;
}

// Calculate efficiency rating
function calculateEfficiencyRating(allocation, travelStyle) {
  const idealPercentages = {
    budget: { accommodation: 30, food: 20, transportation: 25, activities: 20 },
    moderate: { accommodation: 35, food: 25, transportation: 20, activities: 15 },
    luxury: { accommodation: 45, food: 30, transportation: 15, activities: 8 }
  };

  const ideal = idealPercentages[travelStyle] || idealPercentages.moderate;
  let score = 100;

  Object.keys(ideal).forEach(category => {
    if (allocation[category]) {
      const difference = Math.abs(allocation[category].percentage - ideal[category]);
      score -= difference * 2; // Penalize deviations
    }
  });

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Get affordability rating
function getAffordabilityRating(dailyBudget) {
  if (dailyBudget < 1000) return 'very_budget';
  if (dailyBudget < 2500) return 'budget';
  if (dailyBudget < 5000) return 'moderate';
  if (dailyBudget < 10000) return 'comfortable';
  return 'luxury';
}

// Generate budget recommendations
function generateBudgetRecommendations(allocation, duration) {
  const recommendations = [];

  // Duration-based recommendations
  if (duration > 7) {
    recommendations.push({
      type: 'duration',
      priority: 'medium',
      message: 'Long trip - consider booking accommodations in advance for better rates',
      action: 'Book early to get discounts'
    });
  }

  // Category-specific recommendations
  if (allocation.accommodation.percentage > 40) {
    recommendations.push({
      type: 'accommodation',
      priority: 'high',
      message: 'High accommodation budget - look for package deals',
      action: 'Consider booking accommodation + activities packages'
    });
  }

  if (allocation.food.percentage < 20) {
    recommendations.push({
      type: 'food',
      priority: 'medium',
      message: 'Low food budget - explore street food and local markets',
      action: 'Research affordable local food options'
    });
  }

  return recommendations;
}

// Estimate destination costs
function estimateDestinationCosts(destination, duration, travelStyle, groupType, groupSize) {
  // Base daily costs by destination tier (simplified)
  const destinationTiers = {
    'mumbai': { budget: 1500, moderate: 3500, luxury: 12000 },
    'delhi': { budget: 1200, moderate: 3000, luxury: 10000 },
    'goa': { budget: 1800, moderate: 4000, luxury: 15000 },
    'bangalore': { budget: 1400, moderate: 3200, luxury: 11000 }
  };

  const dest = destination.toLowerCase();
  const tier = destinationTiers[dest] || destinationTiers['mumbai'];
  
  const styleMap = {
    budget: tier.budget,
    relaxed: tier.moderate * 0.9,
    moderate: tier.moderate,
    intense: tier.budget * 1.2,
    luxury: tier.luxury
  };

  const dailyCost = styleMap[travelStyle] || tier.moderate;
  const totalCost = dailyCost * duration * groupSize;

  return {
    dailyPerPerson: Math.round(dailyCost),
    totalPerPerson: Math.round(dailyCost * duration),
    totalForGroup: Math.round(totalCost),
    destination: destination,
    duration: duration,
    groupSize: groupSize
  };
}

// Generate budget range recommendations
function generateBudgetRangeRecommendations(estimatedCosts, travelStyle, groupSize) {
  const { totalForGroup } = estimatedCosts;
  
  const ranges = {
    minimum: Math.round(totalForGroup * 0.8),
    recommended: Math.round(totalForGroup * 1.1),
    comfortable: Math.round(totalForGroup * 1.3),
    luxury: Math.round(totalForGroup * 1.8)
  };

  return {
    budgetRanges: ranges,
    recommendedBudget: ranges.recommended,
    bufferPercentage: 10,
    emergencyFund: Math.round(ranges.recommended * 0.1),
    explanation: `Based on ${travelStyle} travel style for ${groupSize} person(s)`
  };
}

