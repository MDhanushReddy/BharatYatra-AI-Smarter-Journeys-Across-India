import { attractionsData } from '../data/attractionsData';

// Calculate the recommendation score for an attraction based on user preferences
const calculateAttractionScore = (attraction, userPreferences, budget) => {
  let score = 0;
  const perAttractionBudget = budget * 0.4 / userPreferences.duration; // Allocate 40% of daily budget for attractions

  // Budget compatibility (0-30 points)
  const budgetScore = attraction.price <= perAttractionBudget ? 30 : 
    (perAttractionBudget / attraction.price) * 30;
  score += budgetScore;

  // Interest matching (0-40 points)
  if (userPreferences.interests.some(interest => 
    attraction.category.toLowerCase().includes(interest.toLowerCase()))) {
    score += 40;
  }

  // Travel style compatibility (0-20 points)
  const travelStyleScores = {
    relaxed: ['Culture & History', 'Relaxation', 'Arts & Museums'],
    moderate: ['Food & Cuisine', 'Shopping', 'Nature & Outdoors'],
    intense: ['Adventure Sports', 'Nightlife']
  };

  if (travelStyleScores[userPreferences.travelStyle].includes(attraction.category)) {
    score += 20;
  }

  // Group type compatibility (0-10 points)
  const groupTypeScores = {
    solo: ['Adventure Sports', 'Arts & Museums', 'Culture & History'],
    family: ['Nature & Outdoors', 'Culture & History', 'Food & Cuisine'],
    friends: ['Nightlife', 'Adventure Sports', 'Shopping']
  };

  if (groupTypeScores[userPreferences.groupType].includes(attraction.category)) {
    score += 10;
  }

  return score;
};

// Get recommended attractions based on user preferences and budget
export const getRecommendedAttractions = (destination, userPreferences, budget) => {
  if (!attractionsData[destination] || !attractionsData[destination].attractions) {
    return [];
  }

  const attractions = attractionsData[destination].attractions;
  
  // Calculate scores for each attraction
  const scoredAttractions = attractions.map(attraction => ({
    ...attraction,
    score: calculateAttractionScore(attraction, userPreferences, budget)
  }));

  // Sort attractions by score
  const sortedAttractions = scoredAttractions.sort((a, b) => b.score - a.score);

  // Add recommendation reasons
  return sortedAttractions.map(attraction => ({
    ...attraction,
    recommendationReason: generateRecommendationReason(attraction, userPreferences)
  }));
};

// Generate a personalized recommendation reason
const generateRecommendationReason = (attraction, userPreferences) => {
  const reasons = [];

  // Budget-based reason
  if (attraction.price <= 500) {
    reasons.push("Budget-friendly option");
  }

  // Interest-based reason
  if (userPreferences.interests.some(interest => 
    attraction.category.toLowerCase().includes(interest.toLowerCase()))) {
    reasons.push(`Matches your interest in ${attraction.category}`);
  }

  // Travel style reason
  const styleReasons = {
    relaxed: "Perfect for a relaxed exploration",
    moderate: "Great for balanced sightseeing",
    intense: "Ideal for adventure seekers"
  };
  reasons.push(styleReasons[userPreferences.travelStyle]);

  // Group type reason
  const groupReasons = {
    solo: "Great for solo travelers",
    family: "Family-friendly attraction",
    friends: "Popular among friend groups"
  };
  reasons.push(groupReasons[userPreferences.groupType]);

  // Weather-based reason (if available)
  if (attraction.weatherSensitive) {
    reasons.push("Best visited in good weather");
  }

  // Return top 2 most relevant reasons
  return reasons.slice(0, 2).join(" • ");
};

// Filter attractions based on specific criteria
export const filterAttractions = (attractions, filters) => {
  return attractions.filter(attraction => {
    // Price filter
    if (filters.maxPrice && attraction.price > filters.maxPrice) {
      return false;
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(attraction.category)) {
        return false;
      }
    }

    // Duration filter
    if (filters.maxDuration && attraction.duration > filters.maxDuration) {
      return false;
    }

    return true;
  });
};

// Get popular combinations of attractions
export const getAttractionCombinations = (attractions, duration) => {
  const combinations = [];
  const maxAttractionsPerDay = 3;

  for (let i = 0; i < attractions.length - 1; i++) {
    for (let j = i + 1; j < attractions.length; j++) {
      const attraction1 = attractions[i];
      const attraction2 = attractions[j];

      // Check if these attractions can be visited on the same day
      const totalDuration = parseDuration(attraction1.duration) + parseDuration(attraction2.duration);
      if (totalDuration <= 8) { // 8 hours max per day
        combinations.push({
          attractions: [attraction1, attraction2],
          totalDuration: totalDuration,
          totalPrice: attraction1.price + attraction2.price
        });
      }
    }
  }

  return combinations.sort((a, b) => b.score - a.score).slice(0, 5);
};

// Helper function to parse duration string to hours
const parseDuration = (duration) => {
  const [hours] = duration.split('-')[0].match(/\d+/);
  return parseInt(hours);
}; 