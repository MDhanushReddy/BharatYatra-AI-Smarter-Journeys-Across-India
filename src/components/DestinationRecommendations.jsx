import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { attractionsData } from '../data/attractionsData';
import { fetchAttractionsReal } from '../services/api';
import { useTripPlanning } from '../context/TripPlanningContext';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const FilterSection = ({ activeFilters, handleFilterChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={activeFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="Culture & History">Culture & History</option>
            <option value="Nature & Outdoors">Nature & Outdoors</option>
            <option value="Food & Cuisine">Food & Cuisine</option>
            <option value="Shopping">Shopping</option>
            <option value="Adventure Sports">Adventure Sports</option>
            <option value="Relaxation">Relaxation</option>
            <option value="Religious">Religious Sites</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
          <select
            value={activeFilters.priceRange}
            onChange={(e) => handleFilterChange('priceRange', e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Prices</option>
            <option value="free">Free</option>
            <option value="budget">Budget (₹1-500)</option>
            <option value="moderate">Moderate (₹501-1000)</option>
            <option value="premium">Premium (₹1000+)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
          <select
            value={activeFilters.duration}
            onChange={(e) => handleFilterChange('duration', e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Durations</option>
            <option value="quick">Quick (1 hour or less)</option>
            <option value="short">Short (1-2 hours)</option>
            <option value="medium">Medium (2-4 hours)</option>
            <option value="long">Long (4+ hours)</option>
            <option value="fullday">Full Day</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Best For</label>
          <select
            value={activeFilters.bestFor}
            onChange={(e) => handleFilterChange('bestFor', e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="family">Family</option>
            <option value="couples">Couples</option>
            <option value="solo">Solo Travelers</option>
            <option value="friends">Friends</option>
            <option value="photography">Photography</option>
          </select>
        </div>
      </div>

      {/* Additional Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange('timeOfDay', 'morning')}
          className={`px-3 py-1 rounded-full text-sm ${
            activeFilters.timeOfDay === 'morning'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Morning
        </button>
        <button
          onClick={() => handleFilterChange('timeOfDay', 'afternoon')}
          className={`px-3 py-1 rounded-full text-sm ${
            activeFilters.timeOfDay === 'afternoon'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Afternoon
        </button>
        <button
          onClick={() => handleFilterChange('timeOfDay', 'evening')}
          className={`px-3 py-1 rounded-full text-sm ${
            activeFilters.timeOfDay === 'evening'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Evening
        </button>
        <button
          onClick={() => handleFilterChange('weatherSensitive', 'yes')}
          className={`px-3 py-1 rounded-full text-sm ${
            activeFilters.weatherSensitive === 'yes'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Weather Dependent
        </button>
      </div>
    </div>
  );
};

const ViewToggle = ({ selectedView, setSelectedView }) => {
  return (
    <div className="flex justify-end mb-6">
      <div className="bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setSelectedView('grid')}
          className={`px-4 py-2 rounded-md ${
            selectedView === 'grid'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Grid
        </button>
        <button
          type="button"
          onClick={() => setSelectedView('map')}
          className={`px-4 py-2 rounded-md ${
            selectedView === 'map'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Map
        </button>
      </div>
    </div>
  );
};

const MapView = ({ mapCenter, attractionsList, selectedAttractions, onAttractionSelect, hoveredAttraction, setHoveredAttraction }) => (
  <div className="h-[600px] rounded-lg overflow-hidden shadow-lg relative">
    {mapCenter && (
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {attractionsList.map(attraction => (
          <Marker
            key={attraction.id}
            position={[attraction.location.lat, attraction.location.lng]}
            eventHandlers={{
              mouseover: () => setHoveredAttraction(attraction),
              mouseout: () => setHoveredAttraction(null),
              click: () => onAttractionSelect(attraction)
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{attraction.name}</h3>
                <p className="text-sm text-gray-600">{attraction.description}</p>
                <div className="mt-2">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1">{attraction.rating}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    )}
  </div>
);

const GridView = ({ attractionsList, selectedAttractions, hoveredAttraction, handleAttractionSelect, setHoveredAttraction }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {attractionsList.map(attraction => (
      <div
        key={attraction.id}
        onClick={() => handleAttractionSelect(attraction)}
        onMouseEnter={() => setHoveredAttraction(attraction)}
        onMouseLeave={() => setHoveredAttraction(null)}
        className={`cursor-pointer transform transition-all duration-300 hover:scale-105 ${
          selectedAttractions.some(a => a.id === attraction.id)
            ? 'ring-2 ring-blue-500 ring-offset-2'
            : ''
        }`}
      >
        <AttractionCard
          attraction={attraction}
          isSelected={selectedAttractions.some(a => a.id === attraction.id)}
          isHovered={hoveredAttraction?.id === attraction.id}
          onSelect={handleAttractionSelect}
          onHover={setHoveredAttraction}
        />
      </div>
    ))}
  </div>
);

const AttractionCard = ({ attraction, isSelected, isHovered, onSelect }) => (
  <div 
    className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
      isHovered ? 'transform scale-105' : ''
    } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    onClick={() => onSelect(attraction)}
  >
    <div className="relative h-48">
      <img
        src={attraction.imageUrl}
        alt={attraction.name}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/400x300?text=No+Image+Available';
        }}
      />
      <div className="absolute top-2 right-2 flex space-x-2">
        <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium text-gray-700">
          {attraction.rating} ★
        </span>
        {isSelected && (
          <span className="bg-blue-500 px-2 py-1 rounded-full text-sm font-medium text-white">
            Selected
          </span>
        )}
      </div>
      {attraction.weatherSensitive && (
        <div className="absolute bottom-2 right-2">
          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
            Weather Sensitive
          </span>
        </div>
      )}
    </div>
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{attraction.name}</h3>
      <p className="text-sm text-blue-600 mb-2">{attraction.category}</p>
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{attraction.description}</p>
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">
          {(attraction.ticketPrice === undefined || attraction.ticketPrice === null) 
            ? (attraction.price === 0 || !attraction.price ? 'Free Entry' : `₹${attraction.price || 0}`)
            : (attraction.ticketPrice === 0 ? 'Free Entry' : `₹${attraction.ticketPrice}`)}
        </span>
        <span className="text-gray-500">{attraction.duration}</span>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Best time: {attraction.bestTimeToVisit}</span>
          <span>{attraction.reviews?.length || 0} reviews</span>
        </div>
      </div>
    </div>
  </div>
);

const SelectedAttractionsPanel = ({ selectedAttractions, handleAttractionSelect }) => (
  <div className="mt-8 bg-gray-50 rounded-lg p-6">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">
      Selected Attractions ({selectedAttractions.length})
    </h3>
    {selectedAttractions.length > 0 ? (
      <div className="space-y-4">
        {selectedAttractions.map(attraction => (
          <div
            key={attraction.id}
            className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <img
                src={attraction.imageUrl}
                alt={attraction.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h4 className="font-medium text-gray-900">{attraction.name}</h4>
                <p className="text-sm text-gray-500">{attraction.duration}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAttractionSelect(attraction);
              }}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-500 text-center py-4">No attractions selected yet</p>
    )}
  </div>
);

const DestinationRecommendations = ({ tripDetails, setCurrentStep }) => {
  const { selectedAttractions, addAttraction, removeAttraction } = useTripPlanning();
  const [attractionsList, setAttractionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    category: 'all',
    priceRange: 'all',
    duration: 'all',
    bestFor: 'all',
    timeOfDay: 'all',
    weatherSensitive: 'all'
  });
  const [selectedView, setSelectedView] = useState('grid');
  const [mapCenter, setMapCenter] = useState(null);
  const [hoveredAttraction, setHoveredAttraction] = useState(null);
  const [sortBy, setSortBy] = useState('rating');

  const applyFilters = (attractions) => {
    return attractions.filter(attraction => {
      if (activeFilters.category !== 'all' && 
          attraction.category !== activeFilters.category) {
        return false;
      }

      if (activeFilters.priceRange !== 'all') {
        const price = attraction.ticketPrice;
        switch (activeFilters.priceRange) {
          case 'free':
            if (price !== 0) return false;
            break;
          case 'budget':
            if (price > 500) return false;
            break;
          case 'moderate':
            if (price <= 500 || price > 1000) return false;
            break;
          case 'premium':
            if (price <= 1000) return false;
            break;
          default:
            break;
        }
      }

      if (activeFilters.duration !== 'all') {
        const [minHours] = attraction.duration.split('-').map(Number);
        switch (activeFilters.duration) {
          case 'quick':
            if (minHours >= 2) return false;
            break;
          case 'short':
            if (minHours < 2 || minHours >= 4) return false;
            break;
          case 'medium':
            if (minHours < 4) return false;
            break;
          case 'long':
            if (minHours < 4) return false;
            break;
          case 'fullday':
            if (minHours < 8) return false;
            break;
          default:
            break;
        }
      }

      if (activeFilters.bestFor !== 'all' && 
          attraction.bestFor !== activeFilters.bestFor) {
        return false;
      }

      if (activeFilters.timeOfDay !== 'all' && 
          attraction.bestTimeToVisit !== activeFilters.timeOfDay) {
        return false;
      }

      if (activeFilters.weatherSensitive !== 'all') {
        if (activeFilters.weatherSensitive === 'yes' !== attraction.weatherSensitive) {
          return false;
        }
      }

      return true;
    });
  };

  const sortAttractions = (attractions, sortType) => {
    return [...attractions].sort((a, b) => {
      switch (sortType) {
        case 'rating':
          return b.rating - a.rating;
        case 'price_low':
          return a.ticketPrice - b.ticketPrice;
        case 'price_high':
          return b.ticketPrice - a.ticketPrice;
        case 'duration':
          return parseInt(a.duration) - parseInt(b.duration);
        default:
          return 0;
      }
    });
  };

  useEffect(() => {
    const fetchAttractions = async () => {
      try {
        setLoading(true);
        setError(null);
        const destination = (tripDetails?.destination || '').toLowerCase();
        
        // First try to fetch from API
        try {
          console.log('Fetching attractions from API for:', destination);
          const apiResponse = await fetchAttractionsReal({
            destination: tripDetails?.destination,
            maxResults: 20,
            minRating: 4
          });
          
          if (apiResponse && apiResponse.attractions && apiResponse.attractions.length > 0) {
            console.log('API attractions loaded:', apiResponse.attractions.length);
            
            // Normalize attraction data
            const normalizedAttractions = apiResponse.attractions.map(attr => {
              const price = attr.price || attr.ticketPrice || 0;
              return {
                id: attr.id || attr.location_id,
                name: attr.name || 'Attraction',
                rating: attr.rating || 0,
                price: price,
                ticketPrice: price, // Set both for compatibility
                duration: attr.duration || '1-2 hours',
                description: attr.description || '',
                coordinates: attr.coordinates || 
                  (attr.latitude && attr.longitude ? [parseFloat(attr.latitude), parseFloat(attr.longitude)] : [28.6139, 77.2090]),
                imageUrl: attr.imageUrl || attr.image || '',
                category: attr.category || 'attraction',
                facilities: attr.facilities || [],
                city: attr.city || tripDetails?.destination,
                state: attr.state || 'India',
                reviews: attr.reviews || attr.num_reviews || 0,
                bestTimeToVisit: attr.bestTimeToVisit || 'Any time'
              };
            });
            
            setMapCenter(normalizedAttractions[0].coordinates || [28.6139, 77.2090]);
            let filteredAttractions = [...normalizedAttractions];
            
            // Apply filters
            filteredAttractions = applyFilters(filteredAttractions);
            
            // Apply sorting
            filteredAttractions = sortAttractions(filteredAttractions, sortBy);

            setAttractionsList(filteredAttractions);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.warn('API fetch failed, using fallback data:', apiError);
          setError(apiError.message || 'Failed to load attractions from API');
        }
        
        // Fallback to static data
        if (!destination || !attractionsData[destination]) {
          setError("No attractions data available for this destination yet.");
          setLoading(false);
          return;
        }

        setMapCenter(attractionsData[destination].coordinates);
        let filteredAttractions = [...attractionsData[destination].attractions];
        
        // Apply filters
        filteredAttractions = applyFilters(filteredAttractions);
        
        // Apply sorting
        filteredAttractions = sortAttractions(filteredAttractions, sortBy);

        setAttractionsList(filteredAttractions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching attractions:', err);
        setError("Failed to load attractions. Please try again.");
        setLoading(false);
      }
    };

    fetchAttractions();
  }, [tripDetails.destination, activeFilters, sortBy]);

  const handleAttractionSelect = (attraction) => {
    const isSelected = selectedAttractions.some(a => a.id === attraction.id);
    if (isSelected) {
      removeAttraction(attraction.id);
    } else {
      addAttraction(attraction);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleContinue = () => {
    if (selectedAttractions.length === 0) {
      setError("Please select at least one attraction");
      return;
    }
    // Navigate to budget tab in dashboard
    if (setCurrentStep) {
      setCurrentStep(3);
    } else {
      // If used in dashboard context, navigate to dashboard with budget tab
      // Store the target tab in sessionStorage for the dashboard to read
      sessionStorage.setItem('dashboardActiveTab', 'budget');
      // Navigate to dashboard
      window.location.href = '/dashboard';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => setError(null)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Explore {tripDetails.destination}
            </h2>
            <p className="text-gray-500 mt-2">
              {attractionsList.length} attractions available • {selectedAttractions.length} selected
            </p>
          </div>
          
          {/* Sorting Options */}
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border-gray-300 text-sm"
            >
              <option value="rating">Top Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>

        <FilterSection activeFilters={activeFilters} handleFilterChange={handleFilterChange} />
        <ViewToggle selectedView={selectedView} setSelectedView={setSelectedView} />

        {/* Main Content */}
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {selectedView === 'map' ? (
                <MapView
                  mapCenter={mapCenter}
                  attractionsList={attractionsList}
                  selectedAttractions={selectedAttractions}
                  onAttractionSelect={handleAttractionSelect}
                  hoveredAttraction={hoveredAttraction}
                  setHoveredAttraction={setHoveredAttraction}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {attractionsList.map(attraction => (
                    <AttractionCard
                      key={attraction.id}
                      attraction={attraction}
                      isSelected={selectedAttractions.some(a => a.id === attraction.id)}
                      isHovered={hoveredAttraction?.id === attraction.id}
                      onSelect={handleAttractionSelect}
                      onHover={setHoveredAttraction}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Selected Attractions Panel */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Selected Attractions</h3>
          {selectedAttractions.length > 0 ? (
            <div className="space-y-4">
              {selectedAttractions.map(attraction => (
                <div key={attraction.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img
                      src={attraction.imageUrl}
                      alt={attraction.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-medium">{attraction.name}</h4>
                      <p className="text-sm text-gray-500">{attraction.duration}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAttractionSelect(attraction);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No attractions selected yet</p>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentStep(1)}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            ← Back to Details
          </button>
          <button
            onClick={handleContinue}
            className={`px-8 py-3 rounded-lg ${
              selectedAttractions.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={selectedAttractions.length === 0}
          >
            Continue to Budget →
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationRecommendations; 