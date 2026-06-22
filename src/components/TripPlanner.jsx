import React, { useState } from 'react';
import { 
  getAccommodationsByBudget, 
  generateOptimalItinerary,
  getLocalExperiences,
  calculateTripBudget,
  getAttractionsBySeason
} from '../data/attractionsData';

const TripPlanner = () => {
  const [step, setStep] = useState(1);
  const [tripDetails, setTripDetails] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1,
    budgetType: 'midRange',
    interests: [],
    travelStyle: 'moderate',
    accommodation: 'hotel'
  });

  const [recommendations, setRecommendations] = useState({
    attractions: [],
    accommodations: [],
    experiences: [],
    budget: null,
    itinerary: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate trip duration
  const calculateDuration = () => {
    if (!tripDetails.startDate || !tripDetails.endDate) return 0;
    const start = new Date(tripDetails.startDate);
    const end = new Date(tripDetails.endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Generate recommendations based on trip details
  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const duration = calculateDuration();
      
      // Get season-appropriate attractions
      const season = getSeason(new Date(tripDetails.startDate));
      const seasonalAttractions = getAttractionsBySeason(season);

      // Get accommodations within budget
      const budget = calculateTripBudget(
        tripDetails.destination,
        duration,
        { budgetType: tripDetails.budgetType }
      );
      const accommodations = getAccommodationsByBudget(
        tripDetails.destination,
        budget.breakdown.accommodation / duration
      );

      // Generate optimal itinerary
      const itinerary = generateOptimalItinerary(
        tripDetails.destination,
        duration,
        tripDetails.interests
      );

      // Get local experiences
      const experiences = tripDetails.interests.flatMap(interest =>
        getLocalExperiences(tripDetails.destination, interest)
      );

      setRecommendations({
        attractions: seasonalAttractions,
        accommodations,
        experiences,
        budget,
        itinerary
      });
    } catch (err) {
      setError('Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine season
  const getSeason = (date) => {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'summer';
    if (month >= 5 && month <= 8) return 'monsoon';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    generateRecommendations();
    setStep(2);
  };

  // Render different steps of the trip planner
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Plan Your Trip</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Destination Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Where would you like to go?
                </label>
                <input
                  type="text"
                  value={tripDetails.destination}
                  onChange={(e) => setTripDetails(prev => ({
                    ...prev,
                    destination: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tripDetails.startDate}
                    onChange={(e) => setTripDetails(prev => ({
                      ...prev,
                      startDate: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tripDetails.endDate}
                    onChange={(e) => setTripDetails(prev => ({
                      ...prev,
                      endDate: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>
              </div>

              {/* Travelers */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Number of Travelers
                </label>
                <input
                  type="number"
                  min="1"
                  value={tripDetails.travelers}
                  onChange={(e) => setTripDetails(prev => ({
                    ...prev,
                    travelers: parseInt(e.target.value)
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>

              {/* Budget Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Budget Type
                </label>
                <select
                  value={tripDetails.budgetType}
                  onChange={(e) => setTripDetails(prev => ({
                    ...prev,
                    budgetType: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="budget">Budget</option>
                  <option value="midRange">Mid Range</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interests
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {['Culture', 'Nature', 'Adventure', 'Food', 'Shopping', 'Relaxation'].map(interest => (
                    <label key={interest} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={tripDetails.interests.includes(interest)}
                        onChange={(e) => {
                          const newInterests = e.target.checked
                            ? [...tripDetails.interests, interest]
                            : tripDetails.interests.filter(i => i !== interest);
                          setTripDetails(prev => ({
                            ...prev,
                            interests: newInterests
                          }));
                        }}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="ml-2">{interest}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Generate Recommendations
              </button>
            </form>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4">Generating your perfect trip...</p>
              </div>
            ) : error ? (
              <div className="text-red-600 text-center">
                <p>{error}</p>
                <button
                  onClick={() => setStep(1)}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6">Your Trip Summary</h2>
                
                {/* Budget Breakdown */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4">Budget Breakdown</h3>
                  <div className="space-y-2">
                    {recommendations.budget && Object.entries(recommendations.budget.breakdown).map(([category, amount]) => (
                      <div key={category} className="flex justify-between">
                        <span className="capitalize">{category}</span>
                        <span>₹{amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 font-bold">
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span>₹{recommendations.budget?.totalCost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommended Itinerary */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4">Recommended Itinerary</h3>
                  {recommendations.itinerary?.map((day, index) => (
                    <div key={index} className="mb-4">
                      <h4 className="font-medium">Day {day.day}</h4>
                      <div className="ml-4 space-y-2">
                        {day.morning && (
                          <p>Morning: {day.morning.name}</p>
                        )}
                        {day.afternoon && (
                          <p>Afternoon: {day.afternoon.name}</p>
                        )}
                        {day.evening && (
                          <p>Evening: {day.evening.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommended Accommodations */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4">Recommended Accommodations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.accommodations.map((hotel, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-medium">{hotel.name}</h4>
                        <p className="text-sm text-gray-600">{hotel.type}</p>
                        <p className="text-sm">Price Range: ₹{hotel.priceRange}</p>
                        <div className="mt-2">
                          <span className="text-sm text-blue-600">
                            {hotel.amenities.join(' • ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Local Experiences */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-4">Recommended Experiences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.experiences.map((exp, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-medium">{exp.name}</h4>
                        <p className="text-sm text-gray-600">{exp.duration}</p>
                        <p className="text-sm">₹{exp.price}</p>
                        <div className="mt-2">
                          <span className="text-sm text-blue-600">
                            {exp.highlights.join(' • ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                  >
                    Modify Plan
                  </button>
                  <button
                    onClick={() => {/* Handle booking */}}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {renderStep()}
    </div>
  );
};

export default TripPlanner; 