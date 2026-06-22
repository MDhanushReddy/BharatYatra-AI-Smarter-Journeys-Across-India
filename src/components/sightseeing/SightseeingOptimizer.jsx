import React, { useState, useEffect } from 'react';
import { useTripPlanning } from '../../context/TripPlanningContext';
import { fetchAttractionsReal } from '../../services/api';

const SightseeingOptimizer = () => {
  const { tripDetails, selectedAttractions, setSelectedAttractions, calculateTripDuration } = useTripPlanning();
  const [availableAttractions, setAvailableAttractions] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    duration: 'all',
    rating: 0,
    priceRange: 'all'
  });

  useEffect(() => {
    loadAttractions();
  }, [tripDetails.destination, tripDetails.startDate, tripDetails.endDate, tripDetails.budget]);

  // Load attractions on component mount even if no destination is set
  useEffect(() => {
    if (availableAttractions.length === 0) {
      loadAttractions();
    }
  }, []);

  useEffect(() => {
    if (selectedAttractions.length > 0) {
      optimizeRoute();
    }
  }, [selectedAttractions]);

  const loadAttractions = async () => {
    setLoading(true);
    try {
      // Use destination from tripDetails or fallback to a default
      const destination = tripDetails.destination || 'Mumbai';
      const { attractions } = await fetchAttractionsReal({ destination });
      setAvailableAttractions(attractions || []);
    } catch (error) {
      console.error('Error loading attractions:', error);
      // Fallback to mock data if API fails
      const mockAttractions = generateMockAttractions(tripDetails.destination || 'Mumbai');
      setAvailableAttractions(mockAttractions);
    } finally {
      setLoading(false);
    }
  };

  const generateMockAttractions = (destination) => {
    const attractionsByDestination = {
      'Delhi': [
        {
          id: 1,
          name: 'Red Fort',
          category: 'monuments',
          duration: '2-3 hours',
          rating: 4.5,
          price: 35,
          coordinates: [28.6562, 77.2410],
          description: 'UNESCO World Heritage site, this 17th-century fort complex was the main residence of Mughal Emperors.',
          bestTimeToVisit: 'Early morning or late afternoon',
          facilities: ['Guide Available', 'Photography Allowed', 'Wheelchair Accessible']
        },
        {
          id: 2,
          name: 'Qutub Minar',
          category: 'monuments',
          duration: '1-2 hours',
          rating: 4.6,
          price: 30,
          coordinates: [28.5244, 77.1855],
          description: 'UNESCO World Heritage site featuring a 73-meter tall minaret built in 1193.',
          bestTimeToVisit: 'Early morning',
          facilities: ['Guide Available', 'Photography Allowed', 'Souvenir Shop']
        },
        {
          id: 3,
          name: 'India Gate',
          category: 'monuments',
          duration: '30 minutes',
          rating: 4.5,
          price: 0,
          coordinates: [28.6129, 77.2295],
          description: 'War memorial dedicated to Indian soldiers who died in World War I.',
          bestTimeToVisit: 'Evening',
          facilities: ['Street Food', 'Photography Allowed', 'Park Area']
        },
        {
          id: 4,
          name: 'Lotus Temple',
          category: 'religious',
          duration: '1 hour',
          rating: 4.4,
          price: 0,
          coordinates: [28.5535, 77.2588],
          description: 'A stunning Bahá\'í House of Worship in the shape of a lotus flower.',
          bestTimeToVisit: 'Morning or evening',
          facilities: ['Meditation Area', 'Photography Allowed', 'Wheelchair Accessible']
        },
        {
          id: 5,
          name: 'Humayun\'s Tomb',
          category: 'monuments',
          duration: '1-2 hours',
          rating: 4.7,
          price: 35,
          coordinates: [28.5933, 77.2507],
          description: 'Beautiful garden tomb that inspired the Taj Mahal\'s architecture.',
          bestTimeToVisit: 'Late afternoon',
          facilities: ['Guide Available', 'Photography Allowed', 'Garden']
        }
      ],
      'Mumbai': [
        {
          id: 6,
          name: 'Gateway of India',
          category: 'monuments',
          duration: '1 hour',
          rating: 4.6,
          price: 0,
          coordinates: [18.9217, 72.8347],
          description: 'Iconic arch monument built in the early 20th century, overlooking the Arabian Sea.',
          bestTimeToVisit: 'Early morning or sunset',
          facilities: ['Photography Allowed', 'Street Food Nearby', 'Boat Rides']
        },
        {
          id: 7,
          name: 'Marine Drive',
          category: 'nature',
          duration: '1-2 hours',
          rating: 4.7,
          price: 0,
          coordinates: [18.9432, 72.8237],
          description: '3.6-kilometer-long boulevard along the coastline, also known as the Queen\'s Necklace.',
          bestTimeToVisit: 'Evening',
          facilities: ['Street Food', 'Jogging Track', 'Benches']
        },
        {
          id: 8,
          name: 'Elephanta Caves',
          category: 'monuments',
          duration: '4-5 hours',
          rating: 4.4,
          price: 40,
          coordinates: [18.9633, 72.9315],
          description: 'Ancient cave temples dedicated to Lord Shiva on Elephanta Island.',
          bestTimeToVisit: 'Morning',
          facilities: ['Ferry Service', 'Guide Available', 'Souvenir Shop']
        }
      ]
    };

    return attractionsByDestination[destination] || [];
  };

  const optimizeRoute = () => {
    if (selectedAttractions.length < 2) return;

    // Simple optimization algorithm - in real implementation, this would use more sophisticated algorithms
    const optimized = [...selectedAttractions];
    
    // Sort by opening hours and proximity
    optimized.sort((a, b) => {
      // Prioritize by rating and duration
      const scoreA = a.rating * (a.duration.includes('1') ? 1 : 0.8);
      const scoreB = b.rating * (b.duration.includes('1') ? 1 : 0.8);
      return scoreB - scoreA;
    });

    // Calculate total time and distance
    const totalTime = optimized.reduce((total, attraction) => {
      const duration = parseInt(attraction.duration.split('-')[0]);
      return total + duration;
    }, 0);

    setOptimizedRoute(optimized);
  };

  const handleAttractionToggle = (attraction) => {
    const isSelected = selectedAttractions.some(att => att.id === attraction.id);
    
    if (isSelected) {
      setSelectedAttractions(prev => prev.filter(att => att.id !== attraction.id));
    } else {
      setSelectedAttractions(prev => [...prev, attraction]);
    }
  };

  const filteredAttractions = availableAttractions.filter(attraction => {
    if (filters.category !== 'all' && attraction.category !== filters.category) {
      return false;
    }
    
    if (filters.duration !== 'all') {
      const duration = parseInt(attraction.duration.split('-')[0]);
      if (filters.duration === 'short' && duration > 1) return false;
      if (filters.duration === 'medium' && (duration < 2 || duration > 3)) return false;
      if (filters.duration === 'long' && duration < 4) return false;
    }
    
    if (filters.rating > 0 && attraction.rating < filters.rating) {
      return false;
    }
    
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      if (attraction.price < min || attraction.price > max) {
        return false;
      }
    }
    
    return true;
  });

  const getCategoryIcon = (category) => {
    const icons = {
      'monuments': '🏛️',
      'nature': '🌲',
      'religious': '🕌',
      'culture': '🎭',
      'shopping': '🛍️',
      'food': '🍽️'
    };
    return icons[category] || '📍';
  };

  const getDurationColor = (duration) => {
    const hours = parseInt(duration.split('-')[0]);
    if (hours <= 1) return 'text-green-600';
    if (hours <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="travel-section">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[hsla(var(--misty-foam)/0.8)] rounded-full w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-[hsla(var(--misty-foam)/0.65)] rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="travel-section space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-earth">
            Sightseeing Optimization
          </h3>
          <p className="travel-subtle-text text-sm">
            Balance must-see highlights with relaxed pacing and travel-friendly timing.
          </p>
        </div>
        <span className="travel-pill text-sm">
          {selectedAttractions.length} attractions selected
        </span>
      </div>

      {/* Filters */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="travel-label">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="travel-input w-full px-4 py-3"
            >
              <option value="all">All Categories</option>
              <option value="monuments">Monuments</option>
              <option value="nature">Nature</option>
              <option value="religious">Religious</option>
              <option value="culture">Culture</option>
              <option value="shopping">Shopping</option>
              <option value="food">Food</option>
            </select>
          </div>

          {/* Duration Filter */}
          <div className="space-y-2">
            <label className="travel-label">Duration</label>
            <select
              value={filters.duration}
              onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
              className="travel-input w-full px-4 py-3"
            >
              <option value="all">All Durations</option>
              <option value="short">Short (1 hour)</option>
              <option value="medium">Medium (2-3 hours)</option>
              <option value="long">Long (4+ hours)</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="travel-label">Price Range</label>
            <select
              value={filters.priceRange}
              onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
              className="travel-input w-full px-4 py-3"
            >
              <option value="all">All Prices</option>
              <option value="0-0">Free</option>
              <option value="1-50">₹1-₹50</option>
              <option value="51-100">₹51-₹100</option>
              <option value="101-999">Above ₹100</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div className="space-y-2">
            <label className="travel-label">Minimum Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters(prev => ({ ...prev, rating: Number(e.target.value) }))}
              className="travel-input w-full px-4 py-3"
            >
              <option value="0">Any Rating</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>
        </div>
      </div>

      {/* Optimized Route Display */}
      {optimizedRoute.length > 0 && (
        <div className="glass-card p-5 space-y-3">
          <h4 className="text-lg font-semibold text-earth">
            Optimized Route
          </h4>
          <div className="space-y-3">
            {optimizedRoute.map((attraction, index) => (
              <div key={attraction.id} className="flex items-center gap-3">
                <span className="travel-pill text-sm bg-sunset-soft text-earth w-8 h-8 flex items-center justify-center font-semibold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-earth">{attraction.name}</div>
                  <div className="travel-subtle-text text-sm">
                    {attraction.duration} • {attraction.bestTimeToVisit}
                  </div>
                </div>
                <div className="travel-subtle-text text-sm">
                  {attraction.price === 0 ? 'Free' : `₹${attraction.price}`}
                </div>
              </div>
            ))}
          </div>
          <div className="travel-subtle-text text-sm">
            <strong>Total Time:</strong> {optimizedRoute.reduce((total, att) => total + parseInt(att.duration.split('-')[0]), 0)} hours
          </div>
        </div>
      )}

      {/* Attractions List */}
      <div className="space-y-4">
        {filteredAttractions.map(attraction => {
          const isSelected = selectedAttractions.some(att => att.id === attraction.id);
          
          return (
            <div
              key={attraction.id}
              className={`glass-card p-5 transition-transform cursor-pointer ${
                isSelected
                  ? 'soft-shadow ring-2 ring-[hsla(var(--warm-sky)/0.45)]'
                  : 'hover:soft-shadow hover:-translate-y-1'
              }`}
              onClick={() => handleAttractionToggle(attraction)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[hsla(var(--warm-sky)/0.25)] text-earth rounded-xl flex items-center justify-center text-2xl">
                  {getCategoryIcon(attraction.category)}
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-earth">
                      {attraction.name}
                    </h4>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 travel-subtle-text">
                        <span className="text-yellow-500">★</span>
                        {attraction.rating}
                      </div>
                      <div className={`travel-pill text-xs ${getDurationColor(attraction.duration)}`}>
                        {attraction.duration}
                      </div>
                      <div className="travel-subtle-text">
                        {attraction.price === 0 ? 'Free' : `₹${attraction.price}`}
                      </div>
                    </div>
                  </div>
                  
                  <p className="travel-body-text text-sm leading-relaxed mb-3">
                    {attraction.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {attraction.facilities.map(facility => (
                      <span
                        key={facility}
                        className="travel-pill text-xs bg-misty text-earth"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                  
                  <div className="travel-subtle-text text-sm">
                    <strong>Best time to visit:</strong> {attraction.bestTimeToVisit}
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? 'border-[hsla(var(--sunset-peach)/0.7)] bg-[hsla(var(--sunset-peach)/0.9)]'
                      : 'border-[hsla(var(--border)/0.8)]'
                  }`}>
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAttractions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📍</div>
          <h3 className="text-lg font-semibold text-earth mb-2">No attractions found</h3>
          <p className="travel-subtle-text">Try adjusting your filters to uncover more experiences.</p>
        </div>
      )}
    </div>
  );
};

export default SightseeingOptimizer;
