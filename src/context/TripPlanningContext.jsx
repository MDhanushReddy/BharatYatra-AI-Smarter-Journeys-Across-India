import React, { createContext, useContext, useState, useEffect } from 'react';

const TripPlanningContext = createContext();

export const useTripPlanning = () => {
  const context = useContext(TripPlanningContext);
  if (!context) {
    throw new Error('useTripPlanning must be used within a TripPlanningProvider');
  }
  return context;
};

// Utility functions for coordinate conversion
const coordsToArray = (coords) => {
  if (!coords) return null;
  if (Array.isArray(coords)) return coords;
  if (typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
    return [coords.lat, coords.lng];
  }
  return null;
};

const coordsToObject = (coords) => {
  if (!coords) return null;
  if (Array.isArray(coords)) {
    return { lat: coords[0], lng: coords[1] };
  }
  if (typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
    return coords;
  }
  return null;
};

export const TripPlanningProvider = ({ children }) => {
  const [tripDetails, setTripDetails] = useState(() => {
    // Don't load old trip data - always start fresh
    return {
      destination: '',
      startDate: '',
      endDate: '',
      budget: '10000',
      travelType: 'vacation',
      groupType: 'couple',
      groupSize: 2,
      interests: [],
      preferences: {
        accommodation: 'hotel',
        travelStyle: 'relaxed',
        foodPreference: 'all',
        dietaryPreferences: ['vegetarian'],
        budgetAllocation: {
          accommodation: 0.4,
          food: 0.3,
          transport: 0.2,
          activities: 0.1
        }
      },
      budgetBreakdown: null
    };
  });

  const [transportationDetails, setTransportationDetails] = useState({
    mode: 'public',
    options: [],
    selectedOptions: []
  });

  const [itinerary, setItinerary] = useState({
    days: [],
    totalCost: 0,
    warnings: [],
    recommendations: []
  });

  const [culturalInfo, setCulturalInfo] = useState({
    language: '',
    customs: [],
    phrases: [],
    emergencyContacts: {}
  });

  const [selectedAttractions, setSelectedAttractions] = useState(() => {
    // Don't load old attractions - always start fresh
    return [];
  });

  const [selectedRestaurants, setSelectedRestaurants] = useState(() => {
    // Don't load old restaurants - always start fresh
    return [];
  });

  const [selectedAccommodations, setSelectedAccommodations] = useState(() => {
    // Don't load old accommodations - always start fresh
    return [];
  });

  const [generatedItinerary, setGeneratedItinerary] = useState(() => {
    // Don't load old itinerary - always start fresh
    return null;
  });

  // Clear old trip data on mount to prevent loading stale data
  useEffect(() => {
    // Clear all old trip data from localStorage when context initializes
    localStorage.removeItem('tripDetails');
    localStorage.removeItem('selectedAttractions');
    localStorage.removeItem('selectedRestaurants');
    localStorage.removeItem('selectedAccommodations');
    localStorage.removeItem('generatedItinerary');
    localStorage.removeItem('lastDestination');
  }, []); // Only run once on mount

  // Clear selected attractions when destination changes
  useEffect(() => {
    const prevDestination = localStorage.getItem('lastDestination');
    const currentDestination = tripDetails.destination;
    
    if (prevDestination && prevDestination !== currentDestination && currentDestination) {
      // Destination changed - clear previous selections
      console.log('Destination changed, clearing previous attractions');
      setSelectedAttractions([]);
      setSelectedRestaurants([]);
      setSelectedAccommodations([]);
      setGeneratedItinerary(null);
    }
    
    if (currentDestination) {
      localStorage.setItem('lastDestination', currentDestination);
    }
  }, [tripDetails.destination]);

  const updateTripDetails = (details) => {
    setTripDetails(prev => {
      const updated = {
        ...prev,
        ...details
      };
      return updated;
    });
  };

  const updateTransportation = (details) => {
    setTransportationDetails(prev => ({
      ...prev,
      ...details
    }));
  };

  const updateItinerary = (details) => {
    setItinerary(prev => ({
      ...prev,
      ...details
    }));
  };

  const updateCulturalInfo = (info) => {
    setCulturalInfo(prev => ({
      ...prev,
      ...info
    }));
  };

  const calculateTripDuration = () => {
    if (!tripDetails.startDate || !tripDetails.endDate) return 0;
    const start = new Date(tripDetails.startDate);
    const end = new Date(tripDetails.endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const calculateBudgetPerDay = () => {
    const duration = calculateTripDuration();
    if (!duration) return 0;
    return Math.round(parseInt(tripDetails.budget) / duration);
  };

  const addAttraction = (attraction) => {
    setSelectedAttractions(prev => [...prev, attraction]);
  };

  const removeAttraction = (attractionId) => {
    setSelectedAttractions(prev => 
      prev.filter(attraction => attraction.id !== attractionId)
    );
  };

  const addRestaurant = (restaurant) => {
    setSelectedRestaurants(prev => [...prev, restaurant]);
  };

  const removeRestaurant = (restaurantId) => {
    setSelectedRestaurants(prev => 
      prev.filter(restaurant => restaurant.id !== restaurantId)
    );
  };

  const addAccommodation = (accommodation) => {
    setSelectedAccommodations(prev => [...prev, accommodation]);
  };

  const removeAccommodation = (accommodationId) => {
    setSelectedAccommodations(prev => 
      prev.filter(accommodation => accommodation.id !== accommodationId)
    );
  };

  const updateGeneratedItinerary = (itinerary) => {
    setGeneratedItinerary(itinerary);
  };

  const clearTripData = () => {
    setTripDetails({
      destination: '',
      startDate: '',
      endDate: '',
      budget: '10000',
      travelType: 'vacation',
      groupType: 'couple',
      groupSize: 2,
      interests: [],
      preferences: {
        accommodation: 'hotel',
        travelStyle: 'relaxed',
        foodPreference: 'all',
        dietaryPreferences: ['vegetarian'],
        budgetAllocation: {
          accommodation: 0.4,
          food: 0.3,
          transport: 0.2,
          activities: 0.1
        }
      },
      budgetBreakdown: null
    });
    setTransportationDetails({
      mode: 'public',
      options: [],
      selectedOptions: []
    });
    setItinerary({
      days: [],
      totalCost: 0,
      warnings: [],
      recommendations: []
    });
    setCulturalInfo({
      language: '',
      customs: [],
      phrases: [],
      emergencyContacts: {}
    });
    setSelectedAttractions([]);
    setSelectedRestaurants([]);
    setSelectedAccommodations([]);
    setGeneratedItinerary(null);
    // Clear all localStorage items
    localStorage.removeItem('tripDetails');
    localStorage.removeItem('selectedAttractions');
    localStorage.removeItem('selectedRestaurants');
    localStorage.removeItem('selectedAccommodations');
    localStorage.removeItem('generatedItinerary');
    localStorage.removeItem('lastDestination');
  };

  const value = {
    tripDetails,
    setTripDetails,
    transportationDetails,
    itinerary,
    culturalInfo,
    selectedAttractions,
    selectedRestaurants,
    selectedAccommodations,
    generatedItinerary,
    updateTripDetails,
    updateTransportation,
    updateItinerary,
    updateCulturalInfo,
    calculateTripDuration,
    calculateBudgetPerDay,
    addAttraction,
    removeAttraction,
    addRestaurant,
    removeRestaurant,
    addAccommodation,
    removeAccommodation,
    updateGeneratedItinerary,
    clearTripData,
    coordsToArray,
    coordsToObject
  };

  return (
    <TripPlanningContext.Provider value={value}>
      {children}
    </TripPlanningContext.Provider>
  );
};

export default TripPlanningContext; 