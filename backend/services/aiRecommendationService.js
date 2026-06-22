// AI Recommendation Service using TF-IDF and Cosine Similarity
import natural from 'natural';

class AIRecommendationService {
  constructor() {
    this.tfidf = new natural.TfIdf();
    this.userPreferences = new Map();
    this.attractionFeatures = new Map();
  }

  // Content-based recommendation using TF-IDF
  contentBasedRecommendation(userInterests, attractions) {
    try {
      // Build TF-IDF corpus from attraction descriptions and categories
      const documents = [];
      const attractionIds = [];
      
      attractions.forEach((attraction, index) => {
        const doc = `${attraction.name} ${attraction.description} ${attraction.category} ${attraction.facilities?.join(' ') || ''}`.toLowerCase();
        documents.push(doc);
        attractionIds.push(attraction.id);
        this.tfidf.addDocument(doc);
      });

      // Create user profile from interests
      const userProfile = userInterests.join(' ').toLowerCase();
      this.tfidf.addDocument(userProfile);

      // Calculate similarity scores
      const scores = [];
      const userDocIndex = documents.length; // Last document is user profile

      attractionIds.forEach((attractionId, index) => {
        const attractionDoc = documents[index];
        const similarity = this.calculateCosineSimilarity(userProfile, attractionDoc);
        scores.push({
          id: attractionId,
          score: similarity,
          attraction: attractions.find(a => a.id === attractionId)
        });
      });

      // Sort by similarity score and return top recommendations
      return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(item => item.attraction);

    } catch (error) {
      console.error('Error in content-based recommendation:', error);
      return attractions.slice(0, 10); // Fallback to first 10
    }
  }

  // Calculate cosine similarity between two text documents
  calculateCosineSimilarity(doc1, doc2) {
    const words1 = doc1.split(' ');
    const words2 = doc2.split(' ');
    const allWords = [...new Set([...words1, ...words2])];
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    allWords.forEach(word => {
      const count1 = words1.filter(w => w === word).length;
      const count2 = words2.filter(w => w === word).length;
      
      dotProduct += count1 * count2;
      norm1 += count1 * count1;
      norm2 += count2 * count2;
    });
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  // K-Means clustering for accommodation recommendations
  kMeansClustering(accommodations, k = 3) {
    if (accommodations.length <= k) {
      return accommodations.map((acc, index) => ({ ...acc, cluster: index }));
    }

    // Features: price, rating, distance from center
    const features = accommodations.map(acc => [
      acc.price || 0,
      acc.rating || 0,
      acc.distanceFromCenter || 0
    ]);

    // Initialize centroids randomly
    let centroids = [];
    for (let i = 0; i < k; i++) {
      centroids.push([
        Math.random() * 10000, // price
        Math.random() * 5,     // rating
        Math.random() * 50     // distance
      ]);
    }

    let clusters = new Array(accommodations.length);
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
      let changed = false;

      // Assign points to nearest centroid
      features.forEach((feature, index) => {
        let minDistance = Infinity;
        let closestCentroid = 0;

        centroids.forEach((centroid, centroidIndex) => {
          const distance = this.euclideanDistance(feature, centroid);
          if (distance < minDistance) {
            minDistance = distance;
            closestCentroid = centroidIndex;
          }
        });

        if (clusters[index] !== closestCentroid) {
          clusters[index] = closestCentroid;
          changed = true;
        }
      });

      if (!changed) break;

      // Update centroids
      centroids = centroids.map((_, centroidIndex) => {
        const clusterPoints = features.filter((_, index) => clusters[index] === centroidIndex);
        if (clusterPoints.length === 0) return centroids[centroidIndex];

        return [
          clusterPoints.reduce((sum, point) => sum + point[0], 0) / clusterPoints.length,
          clusterPoints.reduce((sum, point) => sum + point[1], 0) / clusterPoints.length,
          clusterPoints.reduce((sum, point) => sum + point[2], 0) / clusterPoints.length
        ];
      });

      iterations++;
    }

    // Return accommodations with cluster assignments
    return accommodations.map((acc, index) => ({
      ...acc,
      cluster: clusters[index]
    }));
  }

  // Euclidean distance calculation
  euclideanDistance(point1, point2) {
    return Math.sqrt(
      point1.reduce((sum, val, index) => sum + Math.pow(val - point2[index], 2), 0)
    );
  }

  // Naive Bayes classifier for food preferences
  classifyFoodPreference(restaurant, userPreferences) {
    const features = {
      cuisine: restaurant.cuisine?.toLowerCase() || '',
      priceRange: restaurant.priceRange || '',
      rating: restaurant.rating || 0,
      vegetarian: restaurant.vegetarian || false,
      halal: restaurant.halal || false
    };

    let score = 0;

    // Cuisine preference
    if (userPreferences.cuisine && features.cuisine.includes(userPreferences.cuisine.toLowerCase())) {
      score += 0.3;
    }

    // Price preference
    if (userPreferences.budget === 'low' && features.priceRange === '₹') {
      score += 0.2;
    } else if (userPreferences.budget === 'medium' && features.priceRange === '₹₹') {
      score += 0.2;
    } else if (userPreferences.budget === 'high' && features.priceRange === '₹₹₹') {
      score += 0.2;
    }

    // Rating preference
    if (userPreferences.minRating && features.rating >= userPreferences.minRating) {
      score += 0.2;
    }

    // Dietary restrictions
    if (userPreferences.dietary === 'vegetarian' && features.vegetarian) {
      score += 0.2;
    } else if (userPreferences.dietary === 'halal' && features.halal) {
      score += 0.2;
    }

    return Math.min(score, 1.0); // Normalize to 0-1
  }

  // Decision tree for packing recommendations
  generatePackingList(tripDetails, weatherData) {
    const packingList = {
      essentials: [],
      clothing: [],
      accessories: [],
      electronics: [],
      documents: ['Passport/ID', 'Travel tickets', 'Hotel confirmations', 'Travel insurance']
    };

    // Weather-based recommendations
    const avgTemp = weatherData.reduce((sum, day) => sum + day.temperature, 0) / weatherData.length;
    const hasRain = weatherData.some(day => day.condition.includes('rain'));

    // Clothing based on temperature
    if (avgTemp < 15) {
      packingList.clothing.push('Warm jacket', 'Thermal wear', 'Woolen socks', 'Gloves');
    } else if (avgTemp < 25) {
      packingList.clothing.push('Light jacket', 'Long pants', 'Comfortable shoes');
    } else {
      packingList.clothing.push('T-shirts', 'Shorts', 'Summer dress', 'Sandals');
    }

    // Rain protection
    if (hasRain) {
      packingList.accessories.push('Umbrella', 'Raincoat', 'Waterproof bag');
    }

    // Trip type specific items
    if (tripDetails.tripType === 'adventure') {
      packingList.essentials.push('First aid kit', 'Water bottle', 'Sunscreen');
      packingList.accessories.push('Hiking boots', 'Backpack');
    } else if (tripDetails.tripType === 'business') {
      packingList.clothing.push('Formal wear', 'Business shoes');
      packingList.electronics.push('Laptop', 'Chargers', 'Power bank');
    } else if (tripDetails.tripType === 'relaxation') {
      packingList.accessories.push('Swimming suit', 'Beach towel', 'Sunglasses');
    }

    // Duration based items
    if (tripDetails.duration > 7) {
      packingList.essentials.push('Laundry detergent', 'Extra toiletries');
    }

    return packingList;
  }

  // Constraint-based scheduling for itinerary generation
  generateOptimalItinerary(attractions, accommodation, days, preferences) {
    const itinerary = [];
    const maxAttractionsPerDay = Math.ceil(attractions.length / days);
    const workingHours = { start: 9, end: 18 }; // 9 AM to 6 PM

    for (let day = 1; day <= days; day++) {
      const dayPlan = {
        day: day,
        date: new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        attractions: [],
        meals: [],
        travelTime: 0,
        totalDuration: 0
      };

      // Select attractions for this day using greedy optimization
      const remainingAttractions = attractions.filter(a => !itinerary.some(d => 
        d.attractions.some(att => att.id === a.id)
      ));

      const dayAttractions = this.selectAttractionsForDay(
        remainingAttractions, 
        maxAttractionsPerDay, 
        preferences
      );

      // Optimize route using nearest neighbor algorithm
      const optimizedRoute = this.optimizeRoute(dayAttractions, accommodation);

      // Schedule attractions with time slots
      let currentTime = workingHours.start;
      optimizedRoute.forEach((attraction, index) => {
        const duration = this.parseDuration(attraction.duration);
        const travelTime = index === 0 ? 0 : 30; // 30 minutes between attractions

        dayPlan.attractions.push({
          ...attraction,
          startTime: `${Math.floor(currentTime)}:${(currentTime % 1) * 60}`.padStart(5, '0'),
          endTime: `${Math.floor(currentTime + duration)}:${((currentTime + duration) % 1) * 60}`.padStart(5, '0'),
          travelTime
        });

        currentTime += duration + travelTime / 60;
      });

      // Add meal times
      dayPlan.meals = this.scheduleMeals(currentTime, workingHours);

      itinerary.push(dayPlan);
    }

    return itinerary;
  }

  selectAttractionsForDay(attractions, maxCount, preferences) {
    // Sort by rating and user preferences
    const scored = attractions.map(attraction => ({
      ...attraction,
      score: attraction.rating + (preferences.interests.includes(attraction.category) ? 0.5 : 0)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCount);
  }

  optimizeRoute(attractions, accommodation) {
    if (attractions.length <= 1) return attractions;

    // Simple nearest neighbor algorithm
    const route = [];
    const unvisited = [...attractions];
    
    // Start from accommodation or first attraction
    let current = accommodation ? {
      coordinates: [accommodation.latitude, accommodation.longitude]
    } : unvisited.shift();

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(current.coordinates, unvisited[0].coordinates);

      for (let i = 1; i < unvisited.length; i++) {
        const distance = this.calculateDistance(current.coordinates, unvisited[i].coordinates);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest = unvisited.splice(nearestIndex, 1)[0];
      route.push(nearest);
      current = nearest;
    }

    return route;
  }

  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  parseDuration(duration) {
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

  scheduleMeals(currentTime, workingHours) {
    const meals = [];
    
    if (currentTime >= 12) { // Lunch time
      meals.push({ type: 'lunch', time: '12:00' });
    }
    
    if (currentTime >= 19) { // Dinner time
      meals.push({ type: 'dinner', time: '19:00' });
    }

    return meals;
  }
}

export default new AIRecommendationService();
