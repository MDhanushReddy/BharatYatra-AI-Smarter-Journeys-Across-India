import React, { useState, useEffect } from 'react';
import { popularDestinations } from '../services/indianLocationsAPI';
import { useTripPlanning } from '../context/TripPlanningContext';
import { fetchAttractionsReal, fetchRestaurants, fetchHotels } from '../services/api';

const DestinationDetails = ({ destination }) => {
  const { tripDetails } = useTripPlanning();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [error, setError] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    attractions: true,
    restaurants: true,
    hotels: true
  });
  const [errors, setErrors] = useState({
    attractions: null,
    restaurants: null,
    hotels: null
  });

  useEffect(() => {
    if (!destination) return;

    const loadDestinationData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get base destination info from static data
        const key = destination?.toLowerCase();
        const pop = popularDestinations[destination] || 
                   popularDestinations[destination?.charAt(0).toUpperCase() + destination?.slice(1)];

        let baseDetails = {
          title: pop ? `${destination} - ${pop.state || 'India'}` : destination,
          description: pop?.description || `Explore the beautiful destination of ${destination}`,
          image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
          attractions: [],
          hotels: [],
          restaurants: [],
          transportation: { info: pop?.localTransport?.join(', ') || 'Local transport available' },
          bestTimeToVisit: pop?.bestSeason || 'Year-round',
          localTips: pop?.localTips || ['Use local transport where available', 'Check weather and plan accordingly']
        };

        // Get coordinates for API calls
        let lat = null;
        let lng = null;
        if (pop?.coordinates && Array.isArray(pop.coordinates) && pop.coordinates.length >= 2) {
          lat = pop.coordinates[0];
          lng = pop.coordinates[1];
        }

        // Fetch attractions from Google Places API
        setLoadingStates(prev => ({ ...prev, attractions: true }));
        setErrors(prev => ({ ...prev, attractions: null }));
        try {
          const attractionsParams = {
            destination: destination,
            maxResults: 10,
            minRating: 3.5
          };
          if (lat && lng) {
            attractionsParams.lat = lat;
            attractionsParams.lng = lng;
          }

          const attractionsResponse = await fetchAttractionsReal(attractionsParams);
          
          // Handle different response formats: { attractions: [...] } or { success: true, data: [...] }
          const attractionsArray = attractionsResponse?.attractions || attractionsResponse?.data || (Array.isArray(attractionsResponse) ? attractionsResponse : []);
          
          if (attractionsArray && attractionsArray.length > 0) {
            const formattedAttractions = attractionsArray.map(attr => ({
              name: attr.name || 'Attraction',
              description: attr.description || attr.vicinity || '',
              rating: attr.rating || 0,
              price: attr.price || (attr.priceLevel ? `${attr.priceLevel * 100}` : 'Free'),
              timing: attr.openingHours || 'Check locally',
              image: attr.imageUrl || attr.photoUrl || '',
              coordinates: attr.coordinates || [lat, lng]
            }));
            setAttractions(formattedAttractions);
          } else {
            setErrors(prev => ({ ...prev, attractions: 'No attractions found' }));
          }
        } catch (err) {
          console.error('Error fetching attractions:', err);
          setErrors(prev => ({ ...prev, attractions: 'Failed to load attractions' }));
        } finally {
          setLoadingStates(prev => ({ ...prev, attractions: false }));
        }

        // Fetch restaurants from Google Places API with preferences
        setLoadingStates(prev => ({ ...prev, restaurants: true }));
        setErrors(prev => ({ ...prev, restaurants: null }));
        try {
          const userPreferences = tripDetails?.preferences || {};
          const dietaryPreference = userPreferences.dietaryPreferences?.[0] || 
                                   (userPreferences.foodPreference === 'vegetarian' ? 'vegetarian' : '');

          const restaurantsParams = {
            destination: destination,
            radius: 10000,
            maxResults: 10,
            minRating: 3.5
          };
          if (lat && lng) {
            restaurantsParams.lat = lat;
            restaurantsParams.lng = lng;
          }
          if (dietaryPreference) {
            restaurantsParams.dietary = dietaryPreference;
          }
          if (userPreferences.cuisinePreference) {
            restaurantsParams.cuisine = userPreferences.cuisinePreference;
          }

          const restaurantsData = await fetchRestaurants(restaurantsParams);
          console.log('Restaurants data received:', restaurantsData);
          
          // Handle different response formats - check for wrapped response
          let restaurantsArray = [];
          if (Array.isArray(restaurantsData)) {
            restaurantsArray = restaurantsData;
          } else if (restaurantsData?.data?.restaurants) {
            restaurantsArray = restaurantsData.data.restaurants;
          } else if (restaurantsData?.restaurants) {
            restaurantsArray = restaurantsData.restaurants;
          } else if (restaurantsData?.data && Array.isArray(restaurantsData.data)) {
            restaurantsArray = restaurantsData.data;
          }
          
          console.log(`Processed ${restaurantsArray.length} restaurants from API response`);
          
          if (restaurantsArray && restaurantsArray.length > 0) {
            const formattedRestaurants = restaurantsArray.map(rest => ({
              name: rest.name || 'Restaurant',
              cuisine: rest.cuisine || 'Multi-cuisine',
              priceRange: rest.priceRange ? 
                (typeof rest.priceRange === 'number' ? 
                  (rest.priceRange < 300 ? 'Budget' : 
                   rest.priceRange < 700 ? 'Moderate' : 
                   rest.priceRange < 1500 ? 'Premium' : 'Fine Dining') : 
                  rest.priceRange) : 
                'Moderate',
              rating: rest.rating || 0,
              mustTry: rest.mustTry || rest.recommendedDishes || ['Local Specialties'],
              address: rest.address || '',
              image: rest.imageUrl || rest.photoUrl || '',
              vegetarian: rest.vegetarian || false,
              halal: rest.halal || false
            }));
            setRestaurants(formattedRestaurants);
          } else {
            console.warn('No restaurants returned from API');
            setErrors(prev => ({ ...prev, restaurants: 'No restaurants found' }));
          }
        } catch (err) {
          console.error('Error fetching restaurants in DestinationDetails:', err);
          console.error('Error fetching restaurants:', err);
          setErrors(prev => ({ ...prev, restaurants: 'Failed to load restaurants' }));
        } finally {
          setLoadingStates(prev => ({ ...prev, restaurants: false }));
        }

        // Fetch hotels/accommodations from Google Places API with preferences
        setLoadingStates(prev => ({ ...prev, hotels: true }));
        setErrors(prev => ({ ...prev, hotels: null }));
        try {
          const userPreferences = tripDetails?.preferences || {};
          const budget = tripDetails?.budget || 10000;
          const budgetAllocation = userPreferences.budgetAllocation || { accommodation: 0.4 };
          const maxPrice = Math.floor((parseFloat(budget) || 10000) * (budgetAllocation.accommodation || 0.4));

          const hotelsParams = {
            destination: destination,
            maxPrice: maxPrice,
            minRating: 3
          };
          if (tripDetails?.startDate && tripDetails?.endDate) {
            hotelsParams.checkin = tripDetails.startDate;
            hotelsParams.checkout = tripDetails.endDate;
          }
          hotelsParams.adults = tripDetails?.groupSize || 2;
          hotelsParams.rooms = Math.ceil((tripDetails?.groupSize || 2) / 2);

          const hotelsResponse = await fetchHotels(hotelsParams);
          
          // Handle different response formats
          const hotelsData = hotelsResponse?.hotels || hotelsResponse?.accommodations || hotelsResponse?.data?.accommodations || [];
          
          if (hotelsData && hotelsData.length > 0) {
            const formattedHotels = hotelsData.map(hotel => ({
              name: hotel.name || 'Hotel',
              category: hotel.category || 
                       (hotel.price < 3000 ? 'Budget' : 
                        hotel.price < 8000 ? 'Premium' : 'Luxury'),
              priceRange: hotel.priceRange || 
                        (hotel.price ? `₹${hotel.price.toLocaleString()}` : 'Check availability'),
              rating: hotel.rating || 0,
              amenities: hotel.amenities || hotel.facilities || ['WiFi'],
              address: hotel.address || '',
              image: hotel.imageUrl || hotel.photoUrl || '',
              reviews: hotel.reviews || hotel.userRatingsTotal || 0
            }));
            setHotels(formattedHotels);
          } else {
            setErrors(prev => ({ ...prev, hotels: 'No hotels found' }));
          }
        } catch (err) {
          console.error('Error fetching hotels:', err);
          setErrors(prev => ({ ...prev, hotels: 'Failed to load hotels' }));
        } finally {
          setLoadingStates(prev => ({ ...prev, hotels: false }));
        }

        setDetails(baseDetails);
      } catch (err) {
        console.error('Error loading destination data:', err);
        setError('Failed to load destination details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadDestinationData();
  }, [destination, tripDetails]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-8 mt-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-8 mt-8">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error || 'Destination not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 mt-8">
      <div className="space-y-8">
        {/* Destination Header */}
        <div className="relative h-64 rounded-2xl overflow-hidden">
          <img 
            src={details.image} 
            alt={details.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="p-6">
              <h2 className="text-3xl font-bold text-white">{details.title}</h2>
              <p className="text-gray-200 mt-2">{details.description}</p>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-blue-800">Best Time to Visit</h3>
            <p className="text-blue-600 mt-2">{details.bestTimeToVisit}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-green-800">Getting Around</h3>
            <ul className="mt-2 space-y-1">
              {Object.entries(details.transportation).map(([mode, info]) => (
                <li key={mode} className="text-green-600">
                  <span className="font-medium capitalize">{mode}</span>: {info}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Top Attractions */}
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Top Attractions</h3>
          {loadingStates.attractions ? (
            <div className="text-center py-8 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p>Loading attractions...</p>
            </div>
          ) : errors.attractions ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-red-600 mb-4">{errors.attractions}</p>
              <button
                onClick={() => {
                  const key = destination?.toLowerCase();
                  const pop = popularDestinations[destination] || 
                             popularDestinations[destination?.charAt(0).toUpperCase() + destination?.slice(1)];
                  let lat = null;
                  let lng = null;
                  if (pop?.coordinates && Array.isArray(pop.coordinates) && pop.coordinates.length >= 2) {
                    lat = pop.coordinates[0];
                    lng = pop.coordinates[1];
                  }
                  const attractionsParams = { destination, maxResults: 10, minRating: 3.5 };
                  if (lat && lng) {
                    attractionsParams.lat = lat;
                    attractionsParams.lng = lng;
                  }
                  setLoadingStates(prev => ({ ...prev, attractions: true }));
                  setErrors(prev => ({ ...prev, attractions: null }));
                  fetchAttractionsReal(attractionsParams)
                    .then(response => {
                      // Handle different response formats
                      const attractionsArray = response?.attractions || response?.data || (Array.isArray(response) ? response : []);
                      
                      if (attractionsArray && attractionsArray.length > 0) {
                        const formattedAttractions = attractionsArray.map(attr => ({
                          name: attr.name || 'Attraction',
                          description: attr.description || attr.vicinity || '',
                          rating: attr.rating || 0,
                          price: attr.price || (attr.priceLevel ? `${attr.priceLevel * 100}` : 'Free'),
                          timing: attr.openingHours || 'Check locally',
                          image: attr.imageUrl || attr.photoUrl || '',
                          coordinates: attr.coordinates || [lat, lng]
                        }));
                        setAttractions(formattedAttractions);
                        setErrors(prev => ({ ...prev, attractions: null }));
                      } else {
                        setErrors(prev => ({ ...prev, attractions: 'No attractions found for this destination yet.' }));
                      }
                    })
                    .catch(err => {
                      console.error('Error fetching attractions:', err);
                      setErrors(prev => ({ ...prev, attractions: 'Failed to load attractions. Please try again.' }));
                    })
                    .finally(() => {
                      setLoadingStates(prev => ({ ...prev, attractions: false }));
                    });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : attractions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {attractions.map((attraction, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                  {attraction.image && (
                    <img 
                      src={attraction.image} 
                      alt={attraction.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <h4 className="font-semibold text-lg text-gray-800">{attraction.name}</h4>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">{attraction.description}</p>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Rating:</span>
                      <span className="text-yellow-500 ml-2">
                        {'★'.repeat(Math.floor(attraction.rating))}
                        {attraction.rating % 1 >= 0.5 && '☆'}
                      </span>
                      <span className="text-gray-600 ml-1">({attraction.rating.toFixed(1)})</span>
                    </p>
                    <p className="text-sm"><span className="font-medium">Price:</span> {attraction.price}</p>
                    <p className="text-sm"><span className="font-medium">Timing:</span> {attraction.timing}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No attractions available for this destination.</p>
            </div>
          )}
        </div>

        {/* Hotels */}
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Recommended Hotels</h3>
          {hotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hotels.map((hotel, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                  {hotel.image && (
                    <img 
                      src={hotel.image} 
                      alt={hotel.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <h4 className="font-semibold text-lg text-gray-800">{hotel.name}</h4>
                  <p className="text-sm text-blue-600 font-medium">{hotel.category}</p>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Rating:</span>
                      <span className="text-yellow-500 ml-2">
                        {'★'.repeat(Math.floor(hotel.rating))}
                        {hotel.rating % 1 >= 0.5 && '☆'}
                      </span>
                      {hotel.reviews > 0 && (
                        <span className="text-gray-600 ml-1">({hotel.reviews} reviews)</span>
                      )}
                    </p>
                    <p className="text-sm"><span className="font-medium">Price Range:</span> {hotel.priceRange}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {hotel.amenities.slice(0, 3).map((amenity, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                          +{hotel.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : loadingStates.hotels ? (
            <div className="text-center py-8 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p>Loading accommodations...</p>
            </div>
          ) : errors.hotels ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-red-600 mb-4">{errors.hotels}</p>
              <button
                onClick={() => {
                  const userPreferences = tripDetails?.preferences || {};
                  const budget = tripDetails?.budget || 10000;
                  const budgetAllocation = userPreferences.budgetAllocation || { accommodation: 0.4 };
                  const maxPrice = Math.floor((parseFloat(budget) || 10000) * (budgetAllocation.accommodation || 0.4));
                  const hotelsParams = {
                    destination,
                    maxPrice,
                    minRating: 3
                  };
                  if (tripDetails?.startDate && tripDetails?.endDate) {
                    hotelsParams.checkin = tripDetails.startDate;
                    hotelsParams.checkout = tripDetails.endDate;
                  }
                  hotelsParams.adults = tripDetails?.groupSize || 2;
                  hotelsParams.rooms = Math.ceil((tripDetails?.groupSize || 2) / 2);
                  setLoadingStates(prev => ({ ...prev, hotels: true }));
                  setErrors(prev => ({ ...prev, hotels: null }));
                  fetchHotels(hotelsParams)
                    .then(response => {
                      const hotelsData = response?.hotels || response?.accommodations || response?.data?.accommodations || [];
                      if (hotelsData && hotelsData.length > 0) {
                        const formattedHotels = hotelsData.map(hotel => ({
                          name: hotel.name || 'Hotel',
                          category: hotel.category || 
                                   (hotel.price < 3000 ? 'Budget' : 
                                    hotel.price < 8000 ? 'Premium' : 'Luxury'),
                          priceRange: hotel.priceRange || 
                                    (hotel.price ? `₹${hotel.price.toLocaleString()}` : 'Check availability'),
                          rating: hotel.rating || 0,
                          amenities: hotel.amenities || hotel.facilities || ['WiFi'],
                          address: hotel.address || '',
                          image: hotel.imageUrl || hotel.photoUrl || '',
                          reviews: hotel.reviews || hotel.userRatingsTotal || 0
                        }));
                        setHotels(formattedHotels);
                        setErrors(prev => ({ ...prev, hotels: null }));
                      } else {
                        setErrors(prev => ({ ...prev, hotels: 'No hotels found' }));
                      }
                    })
                    .catch(err => {
                      console.error('Error fetching hotels:', err);
                      setErrors(prev => ({ ...prev, hotels: 'Failed to load hotels. Please try again.' }));
                    })
                    .finally(() => {
                      setLoadingStates(prev => ({ ...prev, hotels: false }));
                    });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No accommodations available for this destination.</p>
            </div>
          )}
        </div>

        {/* Restaurants */}
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Popular Restaurants</h3>
          {restaurants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {restaurants.map((restaurant, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                  {restaurant.image && (
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <h4 className="font-semibold text-lg text-gray-800">{restaurant.name}</h4>
                  <p className="text-sm text-orange-600 font-medium">{restaurant.cuisine}</p>
                  {(restaurant.vegetarian || restaurant.halal) && (
                    <div className="flex gap-1 mt-1">
                      {restaurant.vegetarian && (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Vegetarian
                        </span>
                      )}
                      {restaurant.halal && (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Halal
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Rating:</span>
                      <span className="text-yellow-500 ml-2">
                        {'★'.repeat(Math.floor(restaurant.rating))}
                        {restaurant.rating % 1 >= 0.5 && '☆'}
                      </span>
                    </p>
                    <p className="text-sm"><span className="font-medium">Price Range:</span> {restaurant.priceRange}</p>
                    <div>
                      <p className="text-sm font-medium mt-2">Must Try:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {restaurant.mustTry.slice(0, 3).map((dish, i) => (
                          <li key={i}>{dish}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : loadingStates.restaurants ? (
            <div className="text-center py-8 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p>Loading restaurants...</p>
            </div>
          ) : errors.restaurants ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-red-600 mb-4">{errors.restaurants}</p>
              <button
                onClick={() => {
                  const key = destination?.toLowerCase();
                  const pop = popularDestinations[destination] || 
                             popularDestinations[destination?.charAt(0).toUpperCase() + destination?.slice(1)];
                  let lat = null;
                  let lng = null;
                  if (pop?.coordinates && Array.isArray(pop.coordinates) && pop.coordinates.length >= 2) {
                    lat = pop.coordinates[0];
                    lng = pop.coordinates[1];
                  }
                  const userPreferences = tripDetails?.preferences || {};
                  const dietaryPreference = userPreferences.dietaryPreferences?.[0] || 
                                           (userPreferences.foodPreference === 'vegetarian' ? 'vegetarian' : '');
                  const restaurantsParams = {
                    destination,
                    radius: 10000,
                    maxResults: 10,
                    minRating: 3.5
                  };
                  if (lat && lng) {
                    restaurantsParams.lat = lat;
                    restaurantsParams.lng = lng;
                  }
                  if (dietaryPreference) {
                    restaurantsParams.dietary = dietaryPreference;
                  }
                  setLoadingStates(prev => ({ ...prev, restaurants: true }));
                  setErrors(prev => ({ ...prev, restaurants: null }));
                  fetchRestaurants(restaurantsParams)
                    .then(data => {
                      // Handle different response formats
                      const restaurantsArray = Array.isArray(data) ? data : (data?.restaurants || data?.data || []);
                      
                      if (restaurantsArray && restaurantsArray.length > 0) {
                        const formattedRestaurants = restaurantsArray.map(rest => ({
                          name: rest.name || 'Restaurant',
                          cuisine: rest.cuisine || 'Multi-cuisine',
                          priceRange: rest.priceRange ? 
                            (typeof rest.priceRange === 'number' ? 
                              (rest.priceRange < 300 ? 'Budget' : 
                               rest.priceRange < 700 ? 'Moderate' : 
                               rest.priceRange < 1500 ? 'Premium' : 'Fine Dining') : 
                              rest.priceRange) : 
                            'Moderate',
                          rating: rest.rating || 0,
                          mustTry: rest.mustTry || rest.recommendedDishes || ['Local Specialties'],
                          address: rest.address || '',
                          image: rest.imageUrl || rest.photoUrl || '',
                          vegetarian: rest.vegetarian || false,
                          halal: rest.halal || false
                        }));
                        setRestaurants(formattedRestaurants);
                        setErrors(prev => ({ ...prev, restaurants: null }));
                      } else {
                        setErrors(prev => ({ ...prev, restaurants: 'No restaurants found' }));
                      }
                    })
                    .catch(err => {
                      console.error('Error fetching restaurants:', err);
                      setErrors(prev => ({ ...prev, restaurants: 'Failed to load restaurants. Please try again.' }));
                    })
                    .finally(() => {
                      setLoadingStates(prev => ({ ...prev, restaurants: false }));
                    });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No restaurants available for this destination.</p>
            </div>
          )}
        </div>

        {/* Local Tips */}
        {details.localTips && details.localTips.length > 0 && (
          <div className="bg-yellow-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-yellow-800 mb-4">Local Tips</h3>
            <ul className="space-y-2">
              {details.localTips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-yellow-500">•</span>
                  <span className="text-yellow-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DestinationDetails; 