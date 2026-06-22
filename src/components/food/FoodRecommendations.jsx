import React, { useState, useEffect, useRef } from 'react';
import { useTripPlanning } from '../../context/TripPlanningContext';
import { getDestinationDetails } from '../../services/indianLocationsAPI';
import { fetchRestaurants as fetchRestaurantsAPI } from '../../services/api';
import RestaurantDetailModal from './RestaurantDetailModal';
import EmptyState from '../ui/EmptyState';

const FoodRecommendations = () => {
  const { tripDetails, selectedRestaurants, addRestaurant, removeRestaurant } = useTripPlanning();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    cuisine: 'all',
    dietaryPreference: 'all',
    priceRange: 'all',
    mealType: 'all',
    rating: 0
  });
  const debounceTimerRef = useRef(null);

  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian', icon: '🌱' },
    { value: 'nonVegetarian', label: 'Non-Vegetarian', icon: '🍖' },
    { value: 'vegan', label: 'Vegan', icon: '🌿' },
    { value: 'jain', label: 'Jain', icon: '🕉️' },
    { value: 'halal', label: 'Halal', icon: '🕌' }
  ];

  const cuisineTypes = [
    'Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Continental', 'South Indian', 'North Indian', 'Street Food'
  ];

  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts', 'Beverages'];

  // Debounced effect for loading restaurants
  useEffect(() => {
    if (!tripDetails.destination) return;
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer for debounced API call
    debounceTimerRef.current = setTimeout(() => {
      loadRestaurants();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 600); // 600ms debounce
    
    // Cleanup timer on unmount or dependency change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [tripDetails.destination, tripDetails.budget, tripDetails.groupSize, filters.cuisine, filters.priceRange, filters.dietaryPreference, filters.rating]);

  const loadRestaurants = async () => {
    setLoading(true);
    setError(null);
    try {
      const destinationInfo = getDestinationDetails(tripDetails.destination);

      // Build API parameters for shared API helper
      const apiParams = {
        destination: tripDetails.destination,
        lat: destinationInfo?.coordinates ? destinationInfo.coordinates[0] : undefined,
        lng: destinationInfo?.coordinates ? destinationInfo.coordinates[1] : undefined,
        radius: 10000,
        maxResults: 20,
        minRating: filters.rating > 0 ? filters.rating : 3.5,
      };

      // Add filters if set
      if (filters.cuisine !== 'all') {
        apiParams.cuisine = filters.cuisine;
      }
      if (filters.priceRange !== 'all') {
        const priceMap = {
          '₹': '1',
          '₹₹': '2',
          '₹₹₹': '3',
          '₹₹₹₹': '4'
        };
        apiParams.priceRange = priceMap[filters.priceRange] || undefined;
      }
      if (filters.dietaryPreference !== 'all') {
        apiParams.dietary = filters.dietaryPreference;
      }

      console.log('Fetching restaurants via API helper with params:', apiParams);

      // Use shared API helper that knows about proxy base URL and response format
      const restaurantsList = await fetchRestaurantsAPI(apiParams);
      
      console.log(`Found ${restaurantsList.length} restaurants from API`);
      
      // If API responded successfully but returned no restaurants (likely due to
      // missing/invalid Google Places key or no matches), fall back to smart mock data
      if (!restaurantsList || restaurantsList.length === 0) {
        console.warn('No restaurants returned from API, using smart mock recommendations');
        const budgetPerPerson = tripDetails.groupSize > 0 
          ? tripDetails.budget / tripDetails.groupSize 
          : tripDetails.budget;
        const budgetRange = getBudgetRange(budgetPerPerson);
        const mockRestaurants = generateMockRestaurants(tripDetails.destination, budgetRange);
        setRestaurants(mockRestaurants);
        return;
      }
      
      // Normalize restaurant data
      const normalizedRestaurants = restaurantsList.map(restaurant => ({
        id: restaurant.id || restaurant.place_id,
        name: restaurant.name,
        cuisine: restaurant.cuisine || 'Multi-Cuisine',
        priceRange: restaurant.priceRange ? 
          (restaurant.priceRange <= 300 ? '₹' : 
           restaurant.priceRange <= 700 ? '₹₹' : 
           restaurant.priceRange <= 1500 ? '₹₹₹' : '₹₹₹₹') : '₹₹',
        rating: restaurant.rating || 0,
        image: restaurant.imageUrl || restaurant.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
        dietaryOptions: [
          restaurant.vegetarian ? 'vegetarian' : null,
          restaurant.halal ? 'halal' : null,
          restaurant.vegan ? 'vegan' : null
        ].filter(Boolean),
        mealTypes: restaurant.openingHours ? ['Breakfast', 'Lunch', 'Dinner'] : ['Lunch', 'Dinner'],
        location: restaurant.address || restaurant.location || tripDetails.destination,
        description: restaurant.description || `${restaurant.name} - ${restaurant.cuisine} cuisine`,
        specialties: restaurant.specialties || [],
        avgCost: restaurant.priceRange || 500
      }));
      
      setRestaurants(normalizedRestaurants);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setError(error.message || 'Failed to load restaurants');
      
      // Use smart mock data whenever the API is unavailable or fails for any reason
      if (
        error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') || 
        error.message.includes('timeout') ||
        error.message.includes('Failed to fetch restaurants')
      ) {
        console.log('Network/API error detected, using fallback mock data');
        const budgetPerPerson = tripDetails.budget / tripDetails.groupSize;
        const budgetRange = getBudgetRange(budgetPerPerson);
        const mockRestaurants = generateMockRestaurants(tripDetails.destination, budgetRange);
        setRestaurants(mockRestaurants);
      } else {
        // Unexpected error - show empty state
        console.log('Unexpected API error, showing empty state');
        setRestaurants([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getBudgetRange = (budgetPerPerson) => {
    if (budgetPerPerson < 1000) return 'budget';
    if (budgetPerPerson < 2500) return 'midRange';
    return 'luxury';
  };

  const generateMockRestaurants = (destination, budgetRange) => {
    const baseRestaurants = {
      budget: [
        {
          id: 1,
          name: "Local Street Food Stall",
          cuisine: "Street Food",
          priceRange: "₹",
          rating: 4.3,
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
          dietaryOptions: ["vegetarian", "nonVegetarian"],
          mealTypes: ["Snacks", "Lunch"],
          location: "Street Market",
          description: "Authentic local street food with traditional flavors",
          specialties: ["Vada Pav", "Samosa", "Chai"],
          avgCost: 50
        },
        {
          id: 2,
          name: "Family Restaurant",
          cuisine: "Indian",
          priceRange: "₹₹",
          rating: 4.1,
          image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
          dietaryOptions: ["vegetarian", "nonVegetarian", "jain"],
          mealTypes: ["Lunch", "Dinner"],
          location: "City Center",
          description: "Traditional Indian restaurant with homely atmosphere",
          specialties: ["Dal Makhani", "Butter Chicken", "Naan"],
          avgCost: 200
        }
      ],
      midRange: [
        {
          id: 3,
          name: "Modern Indian Bistro",
          cuisine: "Indian",
          priceRange: "₹₹₹",
          rating: 4.5,
          image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
          dietaryOptions: ["vegetarian", "nonVegetarian", "vegan", "jain"],
          mealTypes: ["Lunch", "Dinner"],
          location: "Business District",
          description: "Contemporary Indian cuisine with modern presentation",
          specialties: ["Tandoori Platter", "Biryani", "Gulab Jamun"],
          avgCost: 500
        },
        {
          id: 4,
          name: "Multi-Cuisine Restaurant",
          cuisine: "Continental",
          priceRange: "₹₹₹",
          rating: 4.4,
          image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400",
          dietaryOptions: ["vegetarian", "nonVegetarian", "vegan"],
          mealTypes: ["Breakfast", "Lunch", "Dinner"],
          location: "Shopping Mall",
          description: "International cuisine with Indian and continental options",
          specialties: ["Pasta", "Pizza", "Grilled Chicken"],
          avgCost: 600
        }
      ],
      luxury: [
        {
          id: 5,
          name: "Fine Dining Restaurant",
          cuisine: "Indian",
          priceRange: "₹₹₹₹",
          rating: 4.8,
          image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
          dietaryOptions: ["vegetarian", "nonVegetarian", "vegan", "jain", "halal"],
          mealTypes: ["Dinner"],
          location: "Hotel",
          description: "Premium fine dining with exquisite Indian cuisine",
          specialties: ["Royal Thali", "Kebabs", "Kulfi"],
          avgCost: 1500
        },
        {
          id: 6,
          name: "Rooftop Restaurant",
          cuisine: "Continental",
          priceRange: "₹₹₹₹",
          rating: 4.7,
          image: "https://images.unsplash.com/photo-1551218808-b8f297d7378c?w=400",
          dietaryOptions: ["vegetarian", "nonVegetarian", "vegan"],
          mealTypes: ["Dinner", "Beverages"],
          location: "Rooftop",
          description: "Elegant rooftop dining with city views",
          specialties: ["Wine Pairing", "Grilled Seafood", "Desserts"],
          avgCost: 2000
        }
      ]
    };

    return baseRestaurants[budgetRange] || baseRestaurants.midRange;
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    if (filters.cuisine !== 'all' && restaurant.cuisine !== filters.cuisine) {
      return false;
    }
    
    if (filters.dietaryPreference !== 'all' && !restaurant.dietaryOptions.includes(filters.dietaryPreference)) {
      return false;
    }
    
    if (filters.priceRange !== 'all' && restaurant.priceRange !== filters.priceRange) {
      return false;
    }
    
    if (filters.mealType !== 'all' && !restaurant.mealTypes.includes(filters.mealType)) {
      return false;
    }
    
    if (filters.rating > 0 && restaurant.rating < filters.rating) {
      return false;
    }
    
    return true;
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getCuisineIcon = (cuisine) => {
    const icons = {
      'Indian': '🍛',
      'Chinese': '🥢',
      'Italian': '🍝',
      'Mexican': '🌮',
      'Thai': '🍜',
      'Continental': '🍽️',
      'South Indian': '🍛',
      'North Indian': '🍛',
      'Street Food': '🌭'
    };
    return icons[cuisine] || '🍽️';
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
            Food & Dining Recommendations
          </h3>
          <p className="travel-subtle-text text-sm">
            Cozy cafes to street eats, curated to match your tastes and budget.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="travel-pill text-sm">
            {filteredRestaurants.length} restaurants
          </span>
          {selectedRestaurants.length > 0 && (
            <span className="travel-pill text-sm bg-sunset-soft text-earth">
              {selectedRestaurants.length} saved
            </span>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="travel-note border border-[hsla(var(--destructive)/0.35)] bg-[hsla(var(--destructive)/0.15)] text-[hsl(var(--earth-brown))]">
          <div className="flex items-start gap-2">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-5">
        {/* Dietary Preferences */}
        <div className="space-y-2">
          <label className="travel-label">Dietary Preferences</label>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('dietaryPreference', option.value)}
                className={`travel-interest text-sm flex items-center gap-2 ${
                  filters.dietaryPreference === option.value ? 'travel-interest-active' : ''
                }`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Cuisine Filter */}
          <div className="space-y-2">
            <label className="travel-label">Cuisine Type</label>
            <select
              value={filters.cuisine}
              onChange={(e) => handleFilterChange('cuisine', e.target.value)}
              className="travel-input w-full px-4 py-3"
            >
              <option value="all">All Cuisines</option>
              {cuisineTypes.map(cuisine => (
                <option key={cuisine} value={cuisine}>{cuisine}</option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="travel-label">Price Range</label>
            <select
              value={filters.priceRange}
              onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              className="travel-input w-full px-4 py-3"
            >
              <option value="all">All Prices</option>
              <option value="₹">₹ (Under ₹100)</option>
              <option value="₹₹">₹₹ (₹100-₹300)</option>
              <option value="₹₹₹">₹₹₹ (₹300-₹800)</option>
              <option value="₹₹₹₹">₹₹₹₹ (Above ₹800)</option>
            </select>
          </div>

          {/* Meal Type Filter */}
          <div className="space-y-2">
            <label className="travel-label">Meal Type</label>
            <select
              value={filters.mealType}
              onChange={(e) => handleFilterChange('mealType', e.target.value)}
              className="travel-input w-full px-4 py-3"
            >
              <option value="all">All Meals</option>
              {mealTypes.map(meal => (
                <option key={meal} value={meal}>{meal}</option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div className="space-y-2">
            <label className="travel-label">Minimum Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', Number(e.target.value))}
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

      {/* Restaurants List */}
      <div className="space-y-4">
        {filteredRestaurants.map(restaurant => {
          const isSelected = selectedRestaurants.some(res => res.id === restaurant.id);
          
          return (
          <div 
            key={restaurant.id} 
            className={`glass-card p-4 sm:p-5 transition-transform ${isSelected ? 'soft-shadow ring-2 ring-[hsla(var(--sunset-peach)/0.45)]' : 'hover:soft-shadow hover:-translate-y-1'}`}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-28 h-28 flex-shrink-0 overflow-hidden rounded-xl soft-shadow">
                <img
                  src={restaurant.image || 'https://via.placeholder.com/150?text=Restaurant'}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150?text=Restaurant';
                  }}
                />
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-earth flex items-center gap-2">
                      {restaurant.name}
                      <span className="travel-pill text-xs">
                        {getCuisineIcon(restaurant.cuisine)} {restaurant.cuisine}
                      </span>
                    </h4>
                    <div className="travel-subtle-text text-sm">
                      {restaurant.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-earth">
                      {restaurant.priceRange}
                    </div>
                    <div className="travel-subtle-text text-sm">Avg: ₹{restaurant.avgCost}</div>
                    <div className="travel-subtle-text text-sm flex items-center gap-1 justify-end mt-1">
                      <span className="text-yellow-500">★</span>
                      {restaurant.rating}
                    </div>
                  </div>
                </div>
                
                <p className="travel-body-text text-sm leading-relaxed">
                  {restaurant.description}
                </p>
                
                {restaurant.specialties.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-earth">Specialties:</div>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.specialties.map(specialty => (
                        <span
                          key={specialty}
                          className="travel-pill text-xs bg-sunset-soft text-earth"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {restaurant.dietaryOptions.map(option => {
                    const dietaryOption = dietaryOptions.find(d => d.value === option);
                    return (
                      <span
                        key={option}
                        className="travel-pill text-xs bg-warm-sky-soft text-earth flex items-center gap-1"
                      >
                        <span>{dietaryOption?.icon}</span>
                        <span>{dietaryOption?.label}</span>
                      </span>
                    );
                  })}
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {restaurant.mealTypes.map(meal => (
                      <span
                        key={meal}
                        className="travel-pill text-xs bg-misty text-earth"
                      >
                        {meal}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        setIsModalOpen(true);
                      }}
                      className="travel-pill text-sm bg-misty text-earth hover:opacity-85 transition-opacity duration-200"
                    >
                      View Details
                    </button>
                    {isSelected ? (
                      <button 
                        onClick={() => removeRestaurant(restaurant.id)}
                        className="travel-pill text-sm bg-sunset-soft text-earth hover:opacity-85 transition-opacity duration-200"
                      >
                        ✓ Added
                      </button>
                    ) : (
                      <button 
                        onClick={() => addRestaurant(restaurant)}
                        className="travel-button px-6 py-2 text-sm font-medium"
                      >
                        Add to Trip
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {filteredRestaurants.length === 0 && (
        <EmptyState
          icon="🍽️"
          title="No restaurants found"
          description="Try adjusting your filters to discover more delicious stops."
        />
      )}

      {/* Detail Modal */}
      <RestaurantDetailModal
        restaurant={selectedRestaurant}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={addRestaurant}
        onRemove={removeRestaurant}
        isSelected={selectedRestaurant ? selectedRestaurants.some(res => res.id === selectedRestaurant.id) : false}
      />
    </div>
  );
};

export default FoodRecommendations;
