import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { useTripPlanning } from '../context/TripPlanningContext';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DestinationRecommendations2 = ({
  destination,
  userPreferences,
  budget,
  selectedAttractions,
  onAttractionSelect,
  onAttractionRemove,
  mapCenter,
  attractions,
  onContinue
}) => {
  const { coordsToArray } = useTripPlanning();
  const [showMap, setShowMap] = useState(true);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  const categories = [
    { id: 'all', name: 'All Places', icon: '🌟' },
    { id: 'monuments', name: 'Monuments', icon: '🏛️' },
    { id: 'nature', name: 'Nature', icon: '🌲' },
    { id: 'religious', name: 'Religious', icon: '🕍' },
    { id: 'adventure', name: 'Adventure', icon: '🏃' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️' }
  ];

  const quickFilters = [
    { id: 'popular', name: 'Most Popular' },
    { id: 'budget', name: 'Budget Friendly' },
    { id: 'rating', name: 'Top Rated' },
    { id: 'duration', name: 'Quick Visits' }
  ];

  const filteredAttractions = attractions.filter(attraction => {
    if (activeCategory === 'all') return true;
    return attraction.category.toLowerCase().includes(activeCategory.toLowerCase());
  }).sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'budget':
        return a.price - b.price;
      case 'duration':
        return parseInt(a.duration) - parseInt(b.duration);
      default:
        return b.rating - a.rating;
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Categories */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Categories</h3>
        <div className="flex flex-wrap gap-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center px-4 py-2 rounded-full transition-colors ${
                activeCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Sort By</h3>
        <div className="flex flex-wrap gap-4">
          {quickFilters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setSortBy(filter.id)}
              className={`px-4 py-2 rounded-full transition-colors ${
                sortBy === filter.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attractions List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold mb-4">Available Attractions</h3>
          {filteredAttractions.map(attraction => (
            <div
              key={attraction.id}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{attraction.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{attraction.description}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 text-sm">{attraction.rating}</span>
                    <span className="mx-2">•</span>
                    <span className="text-sm text-gray-600">₹{attraction.price}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const isSelected = selectedAttractions.some(a => a.id === attraction.id);
                    if (isSelected) {
                      onAttractionRemove(attraction);
                    } else {
                      onAttractionSelect(attraction);
                    }
                  }}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    selectedAttractions.some(a => a.id === attraction.id)
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {selectedAttractions.some(a => a.id === attraction.id)
                    ? 'Remove'
                    : 'Add to Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Map View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="h-[600px]">
              <MapContainer
                center={coordsToArray(mapCenter) || [20.5937, 78.9629]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {filteredAttractions.map(attraction => {
                  const coords = coordsToArray(attraction.coordinates);
                  return coords ? (
                    <Marker
                      key={attraction.id}
                      position={coords}
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
                  ) : null;
                })}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={onContinue}
          disabled={selectedAttractions.length === 0}
          className={`px-6 py-3 rounded-lg font-medium ${
            selectedAttractions.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          Continue to Itinerary
        </button>
      </div>
    </div>
  );
};

export default DestinationRecommendations2; 