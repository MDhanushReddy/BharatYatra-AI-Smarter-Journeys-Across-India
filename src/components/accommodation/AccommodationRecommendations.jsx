import React, { useState, useEffect } from 'react';
import { useTripPlanning } from '../../context/TripPlanningContext';
import { calculateBudgetSplit } from '../../utils/helpers';
import { fetchHotels, discoverLodging } from '../../services/api';
import { getDestinationDetails } from '../../services/indianLocationsAPI';
import AccommodationDetailModal from './AccommodationDetailModal';
import EmptyState from '../ui/EmptyState';

const AccommodationRecommendations = () => {
  const { tripDetails, selectedAccommodations, addAccommodation, removeAccommodation, calculateTripDuration } = useTripPlanning();
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    priceRange: 'all',
    rating: 0,
    amenities: []
  });

  useEffect(() => {
    loadAccommodations();
  }, [tripDetails.destination, tripDetails.budget, tripDetails.groupSize, tripDetails.startDate, tripDetails.endDate]);

  const loadAccommodations = async () => {
    setLoading(true);
    setError(null);
    try {
      const start = tripDetails.startDate ? new Date(tripDetails.startDate) : null;
      const end = tripDetails.endDate ? new Date(tripDetails.endDate) : null;
      const durationDays = start && end ? Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))) : 1;

      const totalBudget = parseInt(tripDetails.budget || '0', 10);
      const groupSize = Math.max(1, parseInt(tripDetails.groupSize || '1', 10));
      const perGroupBudget = totalBudget;
      const { accommodation: totalAccommodationBudget, nightlyAccommodationCap } = calculateBudgetSplit({
        totalBudget: perGroupBudget,
        durationDays,
        preferences: tripDetails.preferences
      });

      const rooms = Math.max(1, Math.ceil(groupSize / 2));
      // Calculate per-night cap: total accommodation budget divided by duration and rooms
      let perNightCap = Math.floor(totalAccommodationBudget / (durationDays * rooms));
      if (!Number.isFinite(perNightCap) || perNightCap <= 0) {
        perNightCap = Math.floor(totalAccommodationBudget / durationDays); // Fallback: divide by duration only
        if (!Number.isFinite(perNightCap) || perNightCap <= 0) {
          perNightCap = 2000; // Last resort fallback
        }
      }
      
      console.log('Budget calculation:', {
        totalBudget,
        totalAccommodationBudget,
        durationDays,
        nightlyAccommodationCap,
        perNightCap,
        rooms,
        maxTotalCost: totalAccommodationBudget * 1.1 // 10% tolerance
      });

      const checkin = start ? start.toISOString().slice(0, 10) : '';
      const checkout = end ? end.toISOString().slice(0, 10) : '';

      console.log('Loading accommodations for:', {
        destination: tripDetails.destination,
        checkin,
        checkout,
        adults: groupSize,
        rooms,
        maxPrice: perNightCap
      });

      // Use the main accommodation search endpoint which has proper pricing logic
      console.log('Fetching accommodations with proper pricing...');
      let response = await fetchHotels({
        destination: tripDetails.destination,
        checkin,
        checkout,
        adults: groupSize,
        rooms,
        maxPrice: perNightCap
      });
      
      // If no accommodations found or all are over budget, try without maxPrice filter
      // to see if there are cheaper options available
      if (!response.accommodations || response.accommodations.length === 0) {
        console.log('No accommodations found with budget filter, retrying without maxPrice...');
        const relaxedResponse = await fetchHotels({
          destination: tripDetails.destination,
          checkin,
          checkout,
          adults: groupSize,
          rooms
          // No maxPrice - let backend return all options
        });
        
        if (relaxedResponse.accommodations && relaxedResponse.accommodations.length > 0) {
          console.log(`Found ${relaxedResponse.accommodations.length} accommodations without price filter`);
          response = relaxedResponse;
        }
      }

      console.log('Accommodation response:', response);
      console.log('Response source:', response.source || response.meta?.source || 'unknown');
      console.log('Response has hotels:', !!response.hotels, response.hotels?.length || 0);
      console.log('Response has accommodations:', !!response.accommodations, response.accommodations?.length || 0);
      console.log('Response is array:', Array.isArray(response));
      console.log('Response keys:', Object.keys(response));
      
      // Initialize accommodations array
      let accommodations = [];
      
      // Helper function to normalize accommodation data
      const normalizeAccommodation = (hotel) => ({
        id: hotel.id || hotel.place_id || hotel.hotel_id || `acc_${Math.random().toString(36).substr(2, 9)}`,
        name: hotel.name || hotel.hotel_name || 'Hotel',
        price: hotel.price || hotel.min_total_price || hotel.rate || 2000,
        rating: hotel.rating || hotel.review_score || hotel.star_rating || 0,
        image: hotel.imageUrl || hotel.photoUrl || hotel.image || hotel.max_photo_url || hotel.main_photo_url || '',
        location: hotel.address || hotel.location || hotel.city_trans || tripDetails.destination,
        amenities: hotel.amenities || hotel.facilities || ['Free WiFi', 'Parking'],
        type: hotel.type || hotel.accommodation_type || 'Hotel',
        description: hotel.description || `${hotel.name || 'Hotel'} in ${tripDetails.destination}`,
        address: hotel.address || hotel.location || hotel.city_trans || tripDetails.destination,
        coordinates: hotel.coordinates || (hotel.latitude && hotel.longitude ? [hotel.latitude, hotel.longitude] : []),
        reviews: hotel.reviews || hotel.userRatingsTotal || hotel.review_nr || 0,
        source: hotel.source || response.source || response.meta?.source || 'api'
      });
      
      // Handle case where response is directly an array
      if (Array.isArray(response)) {
        console.log(`✅ Response is array with ${response.length} items`);
        accommodations = response.map(normalizeAccommodation);
      } 
      // Prioritize accommodations array over hotels array - check length explicitly
      else if (response.accommodations && Array.isArray(response.accommodations) && response.accommodations.length > 0) {
        console.log(`✅ Processing ${response.accommodations.length} accommodations from response.accommodations`);
        accommodations = response.accommodations.map(normalizeAccommodation);
      } 
      // Fallback to hotels array - check length explicitly
      else if (response.hotels && Array.isArray(response.hotels) && response.hotels.length > 0) {
        console.log(`✅ Processing ${response.hotels.length} hotels from response.hotels`);
        accommodations = response.hotels.map(normalizeAccommodation);
      }
      // Check if data property exists (wrapped response)
      else if (response.data) {
        const data = response.data;
        if (data.accommodations && Array.isArray(data.accommodations) && data.accommodations.length > 0) {
          console.log(`✅ Processing ${data.accommodations.length} accommodations from response.data.accommodations`);
          accommodations = data.accommodations.map(normalizeAccommodation);
        } else if (data.hotels && Array.isArray(data.hotels) && data.hotels.length > 0) {
          console.log(`✅ Processing ${data.hotels.length} hotels from response.data.hotels`);
          accommodations = data.hotels.map(normalizeAccommodation);
        }
      }
      
      // Additional check: if we still have no accommodations, log the full response structure
      if (accommodations.length === 0) {
        console.warn('⚠️ No accommodations extracted. Full response structure:', JSON.stringify(response, null, 2));
      }
      
      // Filter by budget and ensure prices are valid
      // Check both per-night price and total trip cost
      if (accommodations.length > 0) {
        const beforeFilter = accommodations.length;
        
        accommodations = accommodations.map(acc => {
          // If price is missing or invalid, assign a default based on budget
          if (!acc.price || acc.price <= 0) {
            acc.price = Math.min(perNightCap, 2000); // Default to budget cap or 2000, whichever is lower
          }
          
          // Calculate total cost for the trip
          const totalCost = acc.price * durationDays;
          
          // Mark as over budget if exceeds total accommodation budget
          const exceedsTotalBudget = totalCost > totalAccommodationBudget;
          const overBudgetAmount = exceedsTotalBudget ? totalCost - totalAccommodationBudget : 0;
          const overBudgetPercent = exceedsTotalBudget ? Math.round((overBudgetAmount / totalAccommodationBudget) * 100) : 0;
          
          return {
            ...acc,
            totalCost,
            overBudget: exceedsTotalBudget,
            overBudgetAmount,
            overBudgetPercent,
            budgetLimit: totalAccommodationBudget
          };
        });
        
        // Filter: Show accommodations, prioritizing those within budget
        // Show accommodations up to 200% of budget to ensure users see options
        // All accommodations over budget will be clearly marked
        const maxAllowedTotal = totalAccommodationBudget * 2; // Allow up to 200% for display purposes
        const filtered = accommodations.filter(acc => {
          const totalCost = acc.price * durationDays;
          return totalCost <= maxAllowedTotal;
        });
        
        // Sort by: 1) Within budget first, 2) Then by price (cheapest first)
        const sorted = filtered.sort((a, b) => {
          const aInBudget = !a.overBudget;
          const bInBudget = !b.overBudget;
          if (aInBudget && !bInBudget) return -1;
          if (!aInBudget && bInBudget) return 1;
          return (a.price || 0) - (b.price || 0);
        });
        
        // If still no results, show top 5 cheapest anyway (with strong warnings)
        if (sorted.length === 0 && accommodations.length > 0) {
          console.warn(`⚠️ All ${accommodations.length} accommodations exceed 200% of budget. Showing top 5 cheapest options with warnings.`);
          const sortedByPrice = [...accommodations].sort((a, b) => (a.price || 0) - (b.price || 0));
          accommodations = sortedByPrice.slice(0, 5).map(acc => ({
            ...acc,
            overBudget: true,
            overBudgetAmount: (acc.price * durationDays) - totalAccommodationBudget,
            overBudgetPercent: Math.round((((acc.price * durationDays) - totalAccommodationBudget) / totalAccommodationBudget) * 100)
          }));
        } else {
          accommodations = sorted;
          const afterFilter = accommodations.length;
          if (beforeFilter !== afterFilter) {
            console.log(`Filtered ${beforeFilter - afterFilter} accommodations (showing ${afterFilter} within 200% of budget, sorted by budget compliance then price)`);
          }
        }
        
        // Log budget compliance
        const withinBudget = accommodations.filter(acc => !acc.overBudget).length;
        const overBudget = accommodations.filter(acc => acc.overBudget).length;
        console.log(`Budget compliance: ${withinBudget} within budget (₹${totalAccommodationBudget}), ${overBudget} over budget`);
        console.log(`Budget details: Total budget ₹${totalAccommodationBudget}, Max displayed ₹${maxAllowedTotal}, Per-night cap ₹${perNightCap}`);
        if (accommodations.length > 0) {
          console.log(`Sample prices: ₹${Math.min(...accommodations.map(a => a.price || 0))} - ₹${Math.max(...accommodations.map(a => a.price || 0))} per night`);
        }
      }
      
      if (accommodations.length > 0) {
        const dataSource = accommodations[0]?.source || response.source || response.meta?.source || 'unknown';
        console.log(`✅ Loaded ${accommodations.length} accommodations from ${dataSource}`);
        console.log('Response metadata:', { source: response.source, meta: response.meta });
        console.log('Sample accommodations:', accommodations.slice(0, 3).map(a => ({ 
          name: a.name, 
          price: a.price, 
          source: a.source,
          image: a.image ? 'has image' : 'no image'
        })));
        setAccommodations(accommodations);
        return;
      }
      
      // Log response structure for debugging if no accommodations found
      if (accommodations.length === 0) {
        console.warn('⚠️ No accommodations found after processing response');
        if (Array.isArray(response)) {
          console.warn(`Response is array with ${response.length} items`);
        } else {
          console.warn('Response structure:', {
            keys: Object.keys(response),
            hasData: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : [],
            hasHotels: !!response.hotels,
            hotelsLength: response.hotels?.length || 0,
            hasAccommodations: !!response.accommodations,
            accommodationsLength: response.accommodations?.length || 0
          });
        }
      }

      // If nothing came back (or mock results), try again without server-side price cap
      const isMockSource = response && response.source === 'mock';
      if (accommodations.length === 0 || isMockSource) {
        try {
          const relaxedResponse = await fetchHotels({
            destination: tripDetails.destination,
            checkin,
            checkout,
            adults: groupSize,
            rooms
          });

          let relaxedList = [];
          if (relaxedResponse?.hotels && Array.isArray(relaxedResponse.hotels)) {
            relaxedList = relaxedResponse.hotels.map(hotel => ({
              id: hotel.id || hotel.hotel_id,
              name: hotel.name || hotel.hotel_name || 'Hotel',
              price: hotel.price || hotel.min_total_price || 0,
              rating: hotel.rating || hotel.review_score || 0,
              image: hotel.image || hotel.imageUrl || hotel.max_photo_url || hotel.main_photo_url || '',
              location: hotel.location || hotel.address || hotel.city_trans || tripDetails.destination,
              amenities: hotel.amenities || [],
              type: hotel.type || 'Hotel',
              description: hotel.description || `${hotel.name || 'Hotel'} in ${tripDetails.destination}`,
              address: hotel.address || hotel.location || tripDetails.destination,
              coordinates: hotel.coordinates || [],
              reviews: hotel.reviews || hotel.review_nr || 0,
              source: 'booking_com'
            }));
          }

          // Apply client-side cap based on budget
          relaxedList = relaxedList.filter(h => !h.price || h.price <= perNightCap * 1.25);

          if (relaxedList.length > 0) {
            accommodations = relaxedList;
          }
        } catch (_) {
          // ignore and fall back to mock only if all APIs fail
        }
      }

      // Do not use mock data - show empty state if no accommodations found
      if (accommodations.length === 0) {
        console.log('No accommodations found from API');
      }

      setAccommodations(accommodations);
    } catch (error) {
      console.error('Error loading accommodations:', error);
      const errorMessage = error.message || 'Failed to load accommodations';
      setError(errorMessage);
      // Do not use mock data - show empty state for any error
      console.log('Error loading accommodations, showing empty state');
      setAccommodations([]);
    } finally {
      setLoading(false);
    }
  };

  // Removed mock generators; real API data is used

  const filteredAccommodations = accommodations.filter(acc => {
    if (filters.type !== 'all' && acc.type.toLowerCase() !== filters.type.toLowerCase()) {
      return false;
    }
    
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      if (acc.price < min || acc.price > max) {
        return false;
      }
    }
    
    if (filters.rating > 0 && acc.rating < filters.rating) {
      return false;
    }
    
    if (filters.amenities.length > 0) {
      const hasAllAmenities = filters.amenities.every(amenity => 
        acc.amenities.some(accAmenity => 
          accAmenity.toLowerCase().includes(amenity.toLowerCase())
        )
      );
      if (!hasAllAmenities) return false;
    }
    
    return true;
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const getAccommodationTypeIcon = (type) => {
    const icons = {
      'Hostel': '🏠',
      'Guest House': '🏡',
      'Hotel': '🏨',
      'Resort': '🏖️',
      'Apartment': '🏢'
    };
    return icons[type] || '🏨';
  };

  const getPriceRangeLabel = (price) => {
    if (price < 1000) return 'Budget';
    if (price < 2500) return 'Mid-range';
    if (price < 5000) return 'Comfort';
    return 'Luxury';
  };

  // Calculate budget values for warning message
  const tripDuration = calculateTripDuration();
  const start = tripDetails.startDate ? new Date(tripDetails.startDate) : null;
  const end = tripDetails.endDate ? new Date(tripDetails.endDate) : null;
  const durationDays = start && end ? Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))) : 1;
  const totalBudget = parseInt(tripDetails.budget || '0', 10);
  const { accommodation: totalAccommodationBudget } = calculateBudgetSplit({
    totalBudget,
    durationDays,
    preferences: tripDetails.preferences
  });
  
  const allOverBudget = accommodations.length > 0 && accommodations.every(acc => acc.overBudget);
  const minPrice = allOverBudget && accommodations.length > 0 ? Math.min(...accommodations.map(a => a.price || 0)) : 0;
  const minTotalCost = allOverBudget ? minPrice * tripDuration : 0;
  const overBudgetPercent = allOverBudget && totalAccommodationBudget > 0 ? Math.round(((minTotalCost - totalAccommodationBudget) / totalAccommodationBudget) * 100) : 0;
  const perNightBudget = tripDuration > 0 && totalAccommodationBudget > 0 ? Math.floor(totalAccommodationBudget / tripDuration) : 0;

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
            Accommodation Recommendations
          </h3>
          <p className="travel-subtle-text text-sm">
            Tailored stays that match your pace, comfort, and budget.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="travel-pill text-sm">
            {filteredAccommodations.length} options
          </span>
          {selectedAccommodations.length > 0 && (
            <span className="travel-pill text-sm bg-sunset-soft text-earth">
              {selectedAccommodations.length} saved
            </span>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="travel-note border border-[hsla(var(--destructive)/0.35)] bg-[hsla(var(--destructive)/0.18)] text-[hsl(var(--earth-brown))]">
          <div className="flex items-start gap-2">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Budget Warning - Show if all accommodations are over budget */}
      {allOverBudget && (
        <div className="travel-note border-2 border-[hsla(var(--destructive)/0.5)] bg-[hsla(var(--destructive)/0.15)] text-[hsl(var(--earth-brown))] p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💰</span>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">All accommodations exceed your budget</h4>
              <p className="text-sm mb-2">
                Your accommodation budget is <strong>₹{totalAccommodationBudget.toLocaleString()}</strong> for {tripDuration} nights 
                (₹{perNightBudget.toLocaleString()}/night).
              </p>
              <p className="text-sm mb-2">
                The available options start from <strong>₹{minPrice.toLocaleString()}/night</strong>, 
                which exceeds your budget by <strong>{overBudgetPercent}%</strong>.
              </p>
              <div className="text-sm space-y-1">
                <p className="font-medium">Suggestions:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Consider increasing your accommodation budget to at least ₹{Math.ceil(minPrice * tripDuration).toLocaleString()}</li>
                  <li>Look for hostels or budget guesthouses (typically ₹500-₹1,500/night)</li>
                  <li>Reduce trip duration to fit within budget</li>
                  <li>Check alternative destinations with lower accommodation costs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div className="space-y-2">
            <label className="travel-label">Accommodation type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="travel-input w-full px-4 py-3"
            >
              <option value="all">All Types</option>
              <option value="hostel">Hostel</option>
              <option value="guest house">Guest House</option>
              <option value="hotel">Hotel</option>
              <option value="resort">Resort</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="travel-label">Price comfort</label>
            <select
              value={filters.priceRange}
              onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              className="travel-input w-full px-4 py-3"
            >
              <option value="all">All budgets</option>
              <option value="0-1000">Under ₹1,000</option>
              <option value="1000-2500">₹1,000 - ₹2,500</option>
              <option value="2500-5000">₹2,500 - ₹5,000</option>
              <option value="5000-9999">Above ₹5,000</option>
            </select>
          </div>

  {/* Rating Filter */}
          <div className="space-y-2">
            <label className="travel-label">Minimum rating</label>
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

        {/* Amenities Filter */}
        <div className="space-y-2">
          <label className="travel-label">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {['Free WiFi', 'Parking', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Breakfast'].map(amenity => (
              <button
                key={amenity}
                onClick={() => handleAmenityToggle(amenity)}
                className={`travel-interest text-sm ${filters.amenities.includes(amenity) ? 'travel-interest-active' : ''}`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accommodations List */}
      <div className="space-y-4">
        {filteredAccommodations.map(accommodation => {
          const isSelected = selectedAccommodations.some(acc => acc.id === accommodation.id);
          const tripDuration = calculateTripDuration() || 1;
          const totalPrice = (accommodation.price || 0) * tripDuration;
          
          return (
          <div 
            key={accommodation.id} 
            className={`glass-card p-4 sm:p-5 transition-transform ${isSelected ? 'soft-shadow ring-2 ring-[hsla(var(--accent)/0.4)]' : 'hover:soft-shadow hover:-translate-y-1'}`}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-28 h-28 flex-shrink-0 overflow-hidden rounded-xl soft-shadow">
                <img
                  src={accommodation.image || 'https://via.placeholder.com/150?text=Hotel'}
                  alt={accommodation.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150?text=Hotel';
                  }}
                />
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-earth flex items-center gap-2">
                      {accommodation.name}
                      <span className="travel-pill text-xs">
                        {getAccommodationTypeIcon(accommodation.type)} {accommodation.type}
                      </span>
                    </h4>
                    <div className="travel-subtle-text text-sm flex flex-wrap gap-2">
                      <span>{accommodation.location}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        {accommodation.rating}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center justify-end gap-2">
                        <div className="text-xl font-semibold text-earth">
                          ₹{(accommodation.price || 0).toLocaleString()}
                        </div>
                        {accommodation.overBudget && (
                          <span 
                            className="travel-pill text-xs bg-[hsla(var(--destructive)/0.2)] text-[hsl(var(--destructive))] border border-[hsla(var(--destructive)/0.3)]" 
                            title={`Exceeds budget by ₹${accommodation.overBudgetAmount?.toLocaleString()} (${accommodation.overBudgetPercent}%)`}
                          >
                            ⚠️ Over Budget
                          </span>
                        )}
                      </div>
                      <div className="travel-subtle-text text-sm">per night</div>
                      {tripDuration > 1 && (
                        <div className="travel-subtle-text text-xs">
                          Total: ₹{totalPrice.toLocaleString()} ({tripDuration} nights)
                        </div>
                      )}
                      {accommodation.overBudget && (
                        <div className="text-xs text-[hsl(var(--destructive))] mt-1 font-medium">
                          Budget: ₹{accommodation.budgetLimit?.toLocaleString()} • Over by ₹{accommodation.overBudgetAmount?.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="travel-body-text text-sm leading-relaxed">
                  {accommodation.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {accommodation.amenities.map(amenity => (
                    <span
                      key={amenity}
                      className="travel-pill text-xs bg-sunset-soft text-earth"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="travel-pill text-xs bg-warm-sky-soft text-earth">
                    {getPriceRangeLabel(accommodation.price)}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedAccommodation(accommodation);
                        setIsModalOpen(true);
                      }}
                      className="travel-pill text-sm bg-misty text-earth hover:opacity-85 transition-opacity duration-200"
                    >
                      View Details
                    </button>
                    {isSelected ? (
                      <button 
                        onClick={() => removeAccommodation(accommodation.id)}
                        className="travel-pill text-sm bg-sunset-soft text-earth hover:opacity-85 transition-opacity duration-200"
                      >
                        ✓ Selected
                      </button>
                    ) : (
                      <button 
                        onClick={() => addAccommodation(accommodation)}
                        className="travel-button px-6 py-2 text-sm font-medium"
                      >
                        Save stay
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

      {filteredAccommodations.length === 0 && (
        <EmptyState
          icon="🏨"
          title="No accommodations found"
          description="Try adjusting your filters to see more welcoming stays."
        />
      )}

      {/* Detail Modal */}
      <AccommodationDetailModal
        accommodation={selectedAccommodation}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={addAccommodation}
        onRemove={removeAccommodation}
        isSelected={selectedAccommodation ? selectedAccommodations.some(acc => acc.id === selectedAccommodation.id) : false}
      />
    </div>
  );
};

export default AccommodationRecommendations;
