import React, { useEffect, useState } from 'react';
import { useTripPlanning } from '../../context/TripPlanningContext';
import { discoverLodging, fetchBookingDetails, createReservation } from '../../services/api';

const AccommodationTab = () => {
  const { tripDetails } = useTripPlanning();
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState('price');

  const propertyTypes = ['Hotel', 'Apartment', 'Resort', 'Villa', 'Hostel', 'Guesthouse'];
  const amenities = ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Parking', 'Air Conditioning'];

  const [lodging, setLodging] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const destination = tripDetails?.destination || '';
        const coords = tripDetails?.coordinates || null;
        const resp = await discoverLodging({
          destination,
          lat: coords?.lat,
          lng: coords?.lng,
          radius: 10000,
          maxResults: 20
        });
        setLodging(resp?.hotels || []);
      } catch (e) {
        setError('Failed to load accommodations');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripDetails?.destination]);

  const handleBookNow = async (hotel) => {
    try {
      const checkin = tripDetails?.dates?.[0] || '';
      const checkout = tripDetails?.dates?.[1] || '';
      const details = await fetchBookingDetails({
        name: hotel.name,
        destination: tripDetails?.destination || '',
        checkin,
        checkout,
        adults: 1,
        rooms: 1
      });
      const booking = await createReservation({
        provider: details?.provider,
        hotelId: details?.hotelId,
        name: hotel.name,
        destination: tripDetails?.destination || '',
        checkin,
        checkout,
        adults: 1,
        rooms: 1
      });
      if (booking?.deepLink) {
        window.open(booking.deepLink, '_blank');
      }
    } catch (_) {}
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const togglePropertyType = (type) => {
    setSelectedPropertyTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Filters Section */}
      <div className="col-span-1 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        
        {/* Price Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Price Range</label>
          <input
            type="range"
            min="0"
            max="1000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>$0</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>

        {/* Property Types */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Property Type</label>
          <div className="space-y-2">
            {propertyTypes.map(type => (
              <button
                key={type}
                onClick={() => togglePropertyType(type)}
                className={`px-3 py-1 rounded-full text-sm mr-2 mb-2 ${
                  selectedPropertyTypes.includes(type)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Amenities</label>
          <div className="space-y-2">
            {amenities.map(amenity => (
              <button
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                className={`px-3 py-1 rounded-full text-sm mr-2 mb-2 ${
                  selectedAmenities.includes(amenity)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Minimum Rating</label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => setSelectedRating(rating)}
                className={`w-8 h-8 rounded-full ${
                  selectedRating >= rating
                    ? 'bg-yellow-400'
                    : 'bg-gray-200'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accommodations List */}
      <div className="col-span-3">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Available Accommodations</h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        {loading && <div className="text-sm text-gray-600">Loading accommodations...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          {lodging.map(accommodation => (
            <div
              key={accommodation.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <img
                src={accommodation.photoUrl || ''}
                alt={accommodation.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold">{accommodation.name}</h3>
                <p className="text-gray-600">{accommodation.address}</p>
                <div className="flex items-center mt-2">
                  <span className="text-yellow-400">★</span>
                  <span className="ml-1">{accommodation.rating || 0}</span>
                </div>
                <button onClick={() => handleBookNow(accommodation)} className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccommodationTab; 