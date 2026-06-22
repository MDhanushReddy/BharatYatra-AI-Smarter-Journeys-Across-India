// Define categories first
const categories = {
  monuments: {
    name: "Monuments",
    icon: "🏛️",
    description: "Historical monuments and landmarks",
    subcategories: ["Ancient", "Medieval", "Modern", "Colonial", "Religious"]
  },
  nature: {
    name: "Nature",
    icon: "🌲",
    description: "Natural attractions and parks",
    subcategories: ["Gardens", "Parks", "Lakes", "Wildlife"]
  },
  religious: {
    name: "Religious",
    icon: "🕌",
    description: "Temples, mosques, and other religious sites",
    subcategories: ["Temple", "Mosque", "Church", "Gurudwara"]
  },
  culture: {
    name: "Culture",
    icon: "🎭",
    description: "Museums, art galleries, and cultural centers",
    subcategories: ["Museum", "Art Gallery", "Theater", "Cultural Center"]
  },
  shopping: {
    name: "Shopping",
    icon: "🛍️",
    description: "Markets, malls, and shopping districts",
    subcategories: ["Market", "Mall", "Bazaar", "Street Shopping"]
  },
  food: {
    name: "Food",
    icon: "🍽️",
    description: "Food markets and famous eateries",
    subcategories: ["Street Food", "Restaurant", "Cafe", "Food Market"]
  }
};

// Enhanced attractions data with travel-specific features
export const attractionsData = {
  delhi: {
    coordinates: [28.6139, 77.2090],
    cityInfo: {
      name: "Delhi",
      state: "Delhi",
      description: "India's capital territory, a massive metropolitan area in the country's north.",
      airports: ["Indira Gandhi International Airport"],
      mainStations: ["New Delhi Railway Station", "Hazrat Nizamuddin"],
      bestSeason: "October to March",
      localTransport: ["Metro", "Bus", "Auto-rickshaw", "Taxi"],
      averageCost: {
        budget: 2000,
        midRange: 4000,
        luxury: 8000
      },
      languages: ["Hindi", "English"],
      emergencyContacts: {
        police: "100",
        ambulance: "102",
        tourist_helpline: "1363"
      },
      weather: {
        summer: "Hot (March-June)",
        monsoon: "Humid (July-September)",
        winter: "Cool (October-February)"
      }
    },
    attractions: [
      {
        id: "delhi_001",
        name: "Red Fort",
        category: "monuments",
        description: "UNESCO World Heritage site, this 17th-century fort complex was the main residence of Mughal Emperors.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Red_Fort_in_Delhi_03-2016_img3.jpg/1280px-Red_Fort_in_Delhi_03-2016_img3.jpg",
        price: 35,
        duration: "2-3 hours",
        rating: 4.5,
        bestTimeToVisit: "Early morning or late afternoon",
        coordinates: [28.6562, 77.2410],
        bestFor: ["History", "Architecture", "Photography"],
        facilities: ["Guide Available", "Photography Allowed", "Wheelchair Accessible"]
      },
      {
        id: "delhi_002",
        name: "Qutub Minar",
        category: "monuments",
        description: "UNESCO World Heritage site featuring a 73-meter tall minaret built in 1193.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Qutub_Minar_in_the_monsoons.jpg/1280px-Qutub_Minar_in_the_monsoons.jpg",
        price: 30,
        duration: "1-2 hours",
        rating: 4.6,
        bestTimeToVisit: "Early morning",
        coordinates: [28.5244, 77.1855],
        bestFor: ["History", "Architecture", "Photography"],
        facilities: ["Guide Available", "Photography Allowed", "Souvenir Shop"]
      },
      {
        id: "delhi_003",
        name: "Humayun's Tomb",
        category: "monuments",
        description: "Beautiful garden tomb that inspired the Taj Mahal's architecture.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Humayun%27s_Tomb_2.jpg/1280px-Humayun%27s_Tomb_2.jpg",
        price: 35,
        duration: "1-2 hours",
        rating: 4.7,
        bestTimeToVisit: "Late afternoon",
        coordinates: [28.5933, 77.2507],
        bestFor: ["History", "Architecture", "Photography"],
        facilities: ["Guide Available", "Photography Allowed", "Garden"]
      },
      {
        id: "delhi_004",
        name: "India Gate",
        category: "monuments",
        description: "War memorial dedicated to Indian soldiers who died in World War I.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/India_Gate_at_Night.jpg/1280px-India_Gate_at_Night.jpg",
        price: 0,
        duration: "30 minutes",
        rating: 4.5,
        bestTimeToVisit: "Evening",
        coordinates: [28.6129, 77.2295],
        bestFor: ["History", "Photography", "Evening Visit"],
        facilities: ["Street Food", "Photography Allowed", "Park Area"]
      },
      {
        id: "delhi_005",
        name: "Lotus Temple",
        category: "religious",
        description: "A stunning Bahá'í House of Worship in the shape of a lotus flower.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Lotus_Temple_in_Delhi_03-2016.jpg/1280px-Lotus_Temple_in_Delhi_03-2016.jpg",
        price: 0,
        duration: "1 hour",
        rating: 4.4,
        bestTimeToVisit: "Morning or evening",
        coordinates: [28.5535, 77.2588],
        bestFor: ["Architecture", "Spirituality", "Photography"],
        facilities: ["Meditation Area", "Photography Allowed", "Wheelchair Accessible"]
      }
    ]
  },
  mumbai: {
    coordinates: [19.0760, 72.8777],
    cityInfo: {
      name: "Mumbai",
      state: "Maharashtra",
      description: "India's financial capital and home to Bollywood.",
      airports: ["Chhatrapati Shivaji Maharaj International Airport"],
      bestTimeToVisit: "October to February",
      languages: ["Marathi", "Hindi", "English"],
      weather: {
        summer: "Hot & Humid (March-May)",
        monsoon: "Heavy Rainfall (June-September)",
        winter: "Pleasant (October-February)"
      }
    },
    attractions: [
      {
        id: "mumbai_001",
        name: "Gateway of India",
        category: "monuments",
        description: "Iconic arch monument built in the early 20th century, overlooking the Arabian Sea.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Gateway_of_India_at_Night.jpg/1280px-Gateway_of_India_at_Night.jpg",
        price: 0,
        duration: "1 hour",
        rating: 4.6,
        bestTimeToVisit: "Early morning or sunset",
        coordinates: [18.9217, 72.8347],
        bestFor: ["History", "Photography", "Architecture"],
        facilities: ["Photography Allowed", "Street Food Nearby", "Boat Rides"]
      },
      {
        id: "mumbai_002",
        name: "Marine Drive",
        category: "nature",
        description: "3.6-kilometer-long boulevard along the coastline, also known as the Queen's Necklace.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Marine_Drive_Mumbai.jpg/1280px-Marine_Drive_Mumbai.jpg",
        price: 0,
        duration: "1-2 hours",
        rating: 4.7,
        bestTimeToVisit: "Evening",
        coordinates: [18.9432, 72.8237],
        bestFor: ["Sunset", "Walking", "Photography"],
        facilities: ["Street Food", "Jogging Track", "Benches"]
      },
      {
        id: "mumbai_003",
        name: "Elephanta Caves",
        category: "monuments",
        description: "Ancient cave temples dedicated to Lord Shiva on Elephanta Island.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Elephanta_Caves_Mumbai.jpg/1280px-Elephanta_Caves_Mumbai.jpg",
        price: 40,
        duration: "4-5 hours",
        rating: 4.4,
        bestTimeToVisit: "Morning",
        coordinates: [18.9633, 72.9315],
        bestFor: ["History", "Architecture", "Spirituality"],
        facilities: ["Ferry Service", "Guide Available", "Souvenir Shop"]
      }
    ]
  },
  agra: {
    coordinates: [27.1767, 78.0081],
    cityInfo: {
      name: "Agra",
      state: "Uttar Pradesh",
      description: "Home to the iconic Taj Mahal, this city showcases the finest Mughal architecture.",
      airports: ["Agra Airport"],
      bestTimeToVisit: "October to March",
      languages: ["Hindi", "English"],
      weather: {
        summer: "Very Hot (April-June)",
        monsoon: "Humid (July-September)",
        winter: "Cool (October-March)"
      }
    },
    attractions: [
      {
        id: "agra_001",
        name: "Taj Mahal",
        category: "monuments",
        description: "An ivory-white marble mausoleum, symbol of eternal love, built by Emperor Shah Jahan.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Taj_Mahal_in_India_-_Kristian_Bertel.jpg/1280px-Taj_Mahal_in_India_-_Kristian_Bertel.jpg",
        price: 1100,
        duration: "2-3 hours",
        rating: 4.9,
        bestTimeToVisit: "Sunrise or Sunset",
        coordinates: [27.1751, 78.0421],
        bestFor: ["History", "Architecture", "Romance", "Photography"],
        facilities: ["Guide Available", "Photography Allowed", "Wheelchair Accessible"]
      },
      {
        id: "agra_002",
        name: "Agra Fort",
        category: "monuments",
        description: "UNESCO World Heritage site, this red sandstone fort was the main residence of the Mughal Emperors.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Agra_Fort_01.jpg/1280px-Agra_Fort_01.jpg",
        price: 550,
        duration: "2-3 hours",
        rating: 4.6,
        bestTimeToVisit: "Early morning",
        coordinates: [27.1797, 78.0215],
        bestFor: ["History", "Architecture", "Photography"],
        facilities: ["Guide Available", "Photography Allowed", "Wheelchair Accessible"]
      },
      {
        id: "agra_003",
        name: "Fatehpur Sikri",
        category: "monuments",
        description: "Ancient capital city of the Mughal Empire, featuring stunning architecture.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Fatehpur_Sikri_Palace.jpg/1280px-Fatehpur_Sikri_Palace.jpg",
        price: 550,
        duration: "3-4 hours",
        rating: 4.5,
        bestTimeToVisit: "Early morning",
        coordinates: [27.0940, 77.6711],
        bestFor: ["History", "Architecture", "Photography"],
        facilities: ["Guide Available", "Photography Allowed", "Souvenir Shop"]
      }
    ]
  }
};

// Helper functions for coordinates
const coordsToArray = (coords) => {
  if (!coords) return null;
  if (Array.isArray(coords)) return coords;
  return coords.lat && coords.lng ? [coords.lat, coords.lng] : null;
};

const coordsToObject = (coords) => {
  if (!coords) return null;
  if (Array.isArray(coords)) return { lat: coords[0], lng: coords[1] };
  return coords.lat && coords.lng ? coords : null;
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (point1, point2) => {
  const R = 6371; // Earth's radius in km
  const p1 = coordsToArray(point1);
  const p2 = coordsToArray(point2);
  
  if (!p1 || !p2) return Infinity;
  
  const dLat = toRad(p2[0] - p1[0]);
  const dLon = toRad(p2[1] - p1[1]);
  const lat1 = toRad(p1[0]);
  const lat2 = toRad(p2[0]);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const toRad = (value) => value * Math.PI / 180;

// Helper functions
export const getAttractionsByCategory = (category) => {
  const allAttractions = [];
  Object.values(attractionsData).forEach(city => {
    city.attractions.forEach(attraction => {
      if (category === 'all' || attraction.category === category) {
        allAttractions.push({
          ...attraction,
          coordinates: coordsToArray(attraction.coordinates)
        });
      }
    });
  });
  return allAttractions;
};

export const getAttractionsByBudget = (maxPrice) => {
  const attractions = [];
  Object.values(attractionsData).forEach(city => {
    city.attractions.forEach(attraction => {
      if (attraction.price <= maxPrice) {
        attractions.push({
          ...attraction,
          coordinates: coordsToArray(attraction.coordinates)
        });
      }
    });
  });
  return attractions.sort((a, b) => a.price - b.price);
};

export const getAttractionsBySeason = (season) => {
  const allAttractions = [];
  Object.values(attractionsData).forEach(city => {
    if (city.cityInfo.weather[season.toLowerCase()]) {
      city.attractions.forEach(attraction => {
        allAttractions.push({
          ...attraction,
          coordinates: coordsToArray(attraction.coordinates)
        });
      });
    }
  });
  return allAttractions;
};

export const getPopularAttractions = () => {
  const allAttractions = [];
  Object.values(attractionsData).forEach(city => {
    city.attractions.forEach(attraction => {
      if (attraction.rating >= 4.5) {
        allAttractions.push({
          ...attraction,
          coordinates: coordsToArray(attraction.coordinates)
        });
      }
    });
  });
  return allAttractions.sort((a, b) => b.rating - a.rating);
};

export const getAttractionsByWeather = (weather) => {
  return Object.values(attractionsData).flatMap(city => 
    city.attractions.filter(attraction => 
      city.cityInfo.weather[weather.toLowerCase()]
    ).map(attraction => ({
      ...attraction,
      coordinates: coordsToArray(attraction.coordinates)
    }))
  );
};

export const getBudgetFriendlyAttractions = (maxPrice = 100) => {
  return Object.values(attractionsData).flatMap(city => 
    city.attractions.filter(attraction => 
      attraction.price <= maxPrice
    ).map(attraction => ({
      ...attraction,
      coordinates: coordsToArray(attraction.coordinates)
    }))
  ).sort((a, b) => a.price - b.price);
};

export const getNearbyAttractions = (attraction, radius = 2) => {
  return Object.values(attractionsData).flatMap(city => 
    city.attractions.filter(otherAttraction => {
      if (otherAttraction.id === attraction.id) return false;
      const distance = calculateDistance(
        attraction.coordinates,
        otherAttraction.coordinates
      );
      return distance <= radius;
    }).map(otherAttraction => ({
      ...otherAttraction,
      coordinates: coordsToArray(otherAttraction.coordinates)
    }))
  );
};

// Filter function
export const filterAttractions = (filters) => {
  const {
    category,
    subCategory,
    priceRange,
    duration,
    accessibility,
    rating,
    season
  } = filters;

  return Object.values(attractionsData).flatMap(city => 
    city.attractions.filter(attraction => {
      let matches = true;
      
      if (category && category !== 'all') {
        matches = matches && attraction.category === category;
      }
      
      if (subCategory) {
        matches = matches && attraction.subCategory === subCategory;
      }
      
      if (priceRange) {
        const [min, max] = priceRange;
        matches = matches && attraction.price >= min && attraction.price <= max;
      }
      
      if (duration) {
        matches = matches && attraction.duration === duration;
      }
      
      if (accessibility) {
        matches = matches && attraction.facilities.includes('Wheelchair Accessible');
      }
      
      if (rating) {
        matches = matches && attraction.rating >= rating;
      }
      
      if (season) {
        matches = matches && city.cityInfo.weather[season.toLowerCase()];
      }
      
      return matches;
    }).map(attraction => ({
      ...attraction,
      coordinates: coordsToArray(attraction.coordinates)
    }))
  );
};

// Utility functions
export const getAttractionPhotos = (attraction) => attraction.photos || [];
export const getAttractionReviews = (attraction) => attraction.reviews || [];
export const getAttractionOpeningHours = (attraction) => attraction.openingHours || {};
export const getAttractionPopularTimes = (attraction) => attraction.popularTimes || {};

// Additional helper functions
export const getFamilyFriendlyAttractions = () => {
  return Object.values(attractionsData).flatMap(city => 
    city.attractions.filter(attraction => 
      attraction.bestFor.includes("Family") || 
      attraction.facilities.includes("Wheelchair Accessible")
    ).map(attraction => ({
      ...attraction,
      coordinates: coordsToArray(attraction.coordinates)
    }))
  );
};

export const getPhotographySpots = () => {
  return Object.values(attractionsData).flatMap(city => 
    city.attractions.filter(attraction => 
      attraction.bestFor.includes("Photography")
    ).map(attraction => ({
      ...attraction,
      coordinates: coordsToArray(attraction.coordinates)
    }))
  );
};

export const getFoodByDietaryPreference = (preference) => {
  return Object.values(attractionsData).flatMap(city => 
    city.attractions.filter(attraction => 
      attraction.category === "food" && 
      attraction.dietaryOptions?.includes(preference)
    ).map(attraction => ({
      ...attraction,
      coordinates: coordsToArray(attraction.coordinates)
    }))
  );
};

export const getRestaurantsByPreference = (filters) => {
  const {
    cuisine,
    dietaryPreference,
    priceRange,
    mealType,
    rating
  } = filters;

  return Object.values(attractionsData).flatMap(city => 
    city.attractions.filter(attraction => {
      if (attraction.category !== "food") return false;

      let matches = true;

      if (cuisine) {
        matches = matches && attraction.cuisineTypes?.includes(cuisine);
      }

      if (dietaryPreference) {
        matches = matches && attraction.dietaryOptions?.includes(dietaryPreference);
      }

      if (priceRange) {
        matches = matches && attraction.priceRange === priceRange;
      }

      if (mealType) {
        matches = matches && attraction.mealTypes?.includes(mealType);
      }

      if (rating) {
        matches = matches && attraction.rating >= rating;
      }

      return matches;
    }).map(attraction => ({
      ...attraction,
      coordinates: coordsToArray(attraction.coordinates)
    }))
  );
};

export const getAttractionLocation = (attraction) => {
  return coordsToArray(attraction.coordinates);
};

export const getAttractionDirections = (attraction, userLocation, mode = "driving") => {
  const attractionCoords = coordsToArray(attraction.coordinates);
  const userCoords = coordsToArray(userLocation);
  
  if (!attractionCoords || !userCoords) return null;
  
  return {
    origin: userCoords,
    destination: attractionCoords,
    mode
  };
};

export const getAttractionStreetView = (attraction) => {
  const coords = coordsToArray(attraction.coordinates);
  return coords ? {
    position: coords,
    pov: { heading: 0, pitch: 0 }
  } : null;
};

// Export categories
export { categories };

// Add Google Maps integration structure
const googleMapsConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyBR7U052XVfS2P4sdB4EF18NBrGii0LTVk",
  defaultZoom: 12,
  mapStyles: {
    light: "mapbox://styles/mapbox/light-v10",
    dark: "mapbox://styles/mapbox/dark-v10"
  }
};

// Export the config
export { googleMapsConfig }; 