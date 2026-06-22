import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import LoadingSpinner from './LoadingSpinner';
import WeatherForecast from './WeatherForecast';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ItineraryGenerator = ({ 
  selectedAttractions, 
  tripDates, 
  onSaveItinerary 
}) => {
  const [itinerary, setItinerary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [weatherRecommendations, setWeatherRecommendations] = useState([]);

  // Calculate the number of days for the trip
  const calculateTripDays = () => {
    if (!tripDates.startDate || !tripDates.endDate) return 0;
    const start = new Date(tripDates.startDate);
    const end = new Date(tripDates.endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Organize attractions by proximity
  const organizeAttractionsByProximity = (attractions) => {
    if (!attractions.length) return [];
    
    const organized = [];
    const unvisited = [...attractions];
    let current = unvisited.shift();
    organized.push(current);

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;
      
      unvisited.forEach((attraction, idx) => {
        const distance = calculateDistance(
          current.coordinates[0],
          current.coordinates[1],
          attraction.coordinates[0],
          attraction.coordinates[1]
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestIdx = idx;
        }
      });

      current = unvisited[nearestIdx];
      organized.push(current);
      unvisited.splice(nearestIdx, 1);
    }

    return organized;
  };

  // Distribute attractions across days based on visit duration and travel time
  const distributeAttractions = (organizedAttractions) => {
    const days = calculateTripDays();
    if (days === 0) return [];

    const dailyItinerary = Array.from({ length: days }, () => ({
      attractions: [],
      totalTime: 0,
      travelTime: 0,
      route: []
    }));

    const averageVisitTime = 2; // hours
    const maxDailyTime = 8; // hours

    let dayIndex = 0;
    organizedAttractions.forEach(attraction => {
      const currentDay = dailyItinerary[dayIndex];
      
      // Calculate additional time including travel
      const lastAttraction = currentDay.attractions[currentDay.attractions.length - 1];
      let travelTime = 0;
      
      if (lastAttraction) {
        const distance = calculateDistance(
          lastAttraction.coordinates[0],
          lastAttraction.coordinates[1],
          attraction.coordinates[0],
          attraction.coordinates[1]
        );
        travelTime = distance * 0.25; // Rough estimate: 15 min per km
      }

      const totalAdditionalTime = averageVisitTime + (travelTime / 60);

      // Check if we need to move to the next day
      if (currentDay.totalTime + totalAdditionalTime > maxDailyTime) {
        dayIndex = (dayIndex + 1) % days;
      }

      // Add attraction to the current day
      dailyItinerary[dayIndex].attractions.push(attraction);
      dailyItinerary[dayIndex].totalTime += totalAdditionalTime;
      dailyItinerary[dayIndex].travelTime += travelTime;
      dailyItinerary[dayIndex].route.push(attraction.coordinates);
    });

    return dailyItinerary;
  };

  // Generate the itinerary with route optimization
  useEffect(() => {
    const generateItinerary = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get accommodation location from context/selectedAccommodations
        const accommodation = selectedAttractions[0]?.accommodation || null;
        
        // Organize attractions by proximity
        const organizedAttractions = organizeAttractionsByProximity(selectedAttractions);
        
        // Optimize routes using backend API if accommodation is available
        let optimizedRoutes = [];
        if (accommodation?.coordinates && organizedAttractions.length > 0) {
          try {
            const routeResponse = await fetch('/api/routes/optimize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                attractions: organizedAttractions.map(attr => ({
                  id: attr.id,
                  name: attr.name,
                  coordinates: attr.coordinates
                })),
                accommodation: {
                  coordinates: accommodation.coordinates
                },
                optimizationType: 'time'
              })
            });
            
            if (routeResponse.ok) {
              const routeData = await routeResponse.json();
              optimizedRoutes = routeData.route || [];
              
              // Update organized attractions order based on optimized route
              if (routeData.route?.length > 0) {
                const routeOrder = routeData.route.map(r => r.to?.id || r.to?.name);
                organizedAttractions.sort((a, b) => {
                  const idxA = routeOrder.indexOf(a.id || a.name);
                  const idxB = routeOrder.indexOf(b.id || b.name);
                  return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
                });
              }
            }
          } catch (routeError) {
            console.warn('Route optimization failed, using proximity-based ordering:', routeError);
          }
        }
        
        // Distribute attractions across days with optimized routes
        const dailyItinerary = distributeAttractions(organizedAttractions);
        
        // Add accommodation as start point for each day's route
        if (accommodation?.coordinates) {
          dailyItinerary.forEach(day => {
            if (day.route.length > 0) {
              day.route.unshift(accommodation.coordinates);
            }
          });
        }
        
        setItinerary(dailyItinerary);
      } catch (err) {
        setError('Failed to generate itinerary. Please try again.');
        console.error('Itinerary generation error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    generateItinerary();
  }, [selectedAttractions, tripDates]);

  // Update itinerary based on weather recommendations
  const updateItineraryWithWeather = (recommendations) => {
    setWeatherRecommendations(recommendations);
  };

  if (isLoading) {
    return <LoadingSpinner message="Generating your perfect itinerary..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Days List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Itinerary</h2>
          {itinerary.map((day, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                activeDay === index
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-white border-2 border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setActiveDay(index)}
            >
              <h3 className="font-semibold text-lg text-gray-900">Day {index + 1}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {day.attractions.length} attractions • {Math.round(day.totalTime)} hours
              </p>
              <div className="mt-2 space-y-2">
                {day.attractions.map((attraction, attrIndex) => (
                  <div key={attrIndex} className="flex items-center text-sm">
                    <span className="w-8 text-gray-400">{attrIndex + 1}.</span>
                    <span className="text-gray-700">{attraction.name}</span>
                  </div>
                ))}
              </div>
              
              {/* Weather Recommendations */}
              {weatherRecommendations[index] && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-blue-600">
                    Weather-based suggestions:
                  </p>
                  <ul className="mt-1 text-sm text-gray-600">
                    {weatherRecommendations[index].recommended.slice(0, 2).map((rec, i) => (
                      <li key={i} className="text-xs">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Map and Weather View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map View */}
          <div className="bg-white rounded-lg shadow-lg p-4 h-[400px]">
            <MapContainer
              center={
                itinerary[activeDay]?.route[0] || [20.5937, 78.9629]
              }
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {itinerary[activeDay]?.attractions.map((attraction, index) => (
                <Marker
                  key={index}
                  position={attraction.coordinates}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{attraction.name}</p>
                      <p className="text-gray-600">Stop {index + 1}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Draw route line - connect all attractions in order */}
              {itinerary[activeDay]?.attractions && itinerary[activeDay].attractions.length > 1 && (() => {
                const routePoints = itinerary[activeDay].attractions
                  .map(attraction => {
                    const coords = attraction.coordinates;
                    if (Array.isArray(coords) && coords.length === 2) {
                      return coords;
                    }
                    return null;
                  })
                  .filter(coord => coord !== null);
                
                if (routePoints.length > 1) {
                  return (
                    <Polyline
                      positions={routePoints}
                      pathOptions={{
                        color: '#2563EB', // Bright blue
                        weight: 5,
                        opacity: 0.8,
                        smoothFactor: 1
                      }}
                    />
                  );
                }
                return null;
              })()}
              
              {/* Fallback: Use route array if available */}
              {itinerary[activeDay]?.route && Array.isArray(itinerary[activeDay].route) && itinerary[activeDay].route.length > 1 && (
                <Polyline
                  positions={itinerary[activeDay].route}
                  pathOptions={{
                    color: '#2563EB', // Bright blue
                    weight: 5,
                    opacity: 0.8,
                    smoothFactor: 1
                  }}
                />
              )}
            </MapContainer>
          </div>

          {/* Weather Forecast */}
          <WeatherForecast
            destination={selectedAttractions[0]?.location}
            dates={tripDates}
            dailyItinerary={itinerary}
            onUpdateRecommendations={updateItineraryWithWeather}
          />

          {/* Daily Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Day {activeDay + 1} Summary
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Attractions</p>
                <p className="text-2xl font-bold text-blue-600">
                  {itinerary[activeDay]?.attractions.length || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Time</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(itinerary[activeDay]?.totalTime || 0)}h
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Travel Time</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(itinerary[activeDay]?.travelTime || 0)}min
                </p>
              </div>
            </div>
            
            <button
              onClick={() => onSaveItinerary(itinerary)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Save Itinerary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryGenerator; 