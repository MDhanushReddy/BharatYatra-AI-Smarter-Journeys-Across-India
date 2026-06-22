import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import { useTripPlanning } from '../context/TripPlanningContext';
import { useNotification } from './ui/NotificationSystem';
import DestinationDetails from './DestinationDetails';
import DestinationRecommendations from './DestinationRecommendations';
import { searchDestinations, getPopularDestinations } from '../services/indianLocationsAPI';
import TravelTips from './TravelTips';
import Calendar from './ui/Calendar';

const TripDetailsForm = () => {
  const navigate = useNavigate();
  const { updateTripDetails, clearTripData } = useTripPlanning();
  const { success, error: showError } = useNotification();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const [errors, setErrors] = useState({});

  // Clear old trip data when component mounts (starting a new trip)
  useEffect(() => {
    clearTripData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - clearTripData is stable from context

  const [tripDetails, setTripDetails] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '5000',
    travelType: 'vacation',
    groupType: 'solo',
    groupSize: 1,
    interests: [],
    preferences: {
      accommodation: 'hotel',
      travelStyle: 'relaxed',
      foodPreference: 'all'
    }
  });

  const [suggestions, setSuggestions] = useState(() => {
    try {
      return getPopularDestinations().map(d => ({
        value: d.name,
        label: `${d.name}${d.state ? `, ${d.state}` : ''}`
      }));
    } catch (_) {
      return [];
    }
  });

  const interestOptions = [
    'Culture & History',
    'Nature & Outdoors',
    'Food & Cuisine',
    'Shopping',
    'Adventure Sports',
    'Arts & Museums',
    'Nightlife',
    'Relaxation'
  ];

  // Update suggestions as user types (search across India)
  useEffect(() => {
    const q = searchTerm.trim();
    if (!q) {
      try {
        const popular = getPopularDestinations().map(d => ({
          value: d.name,
          label: `${d.name}${d.state ? `, ${d.state}` : ''}`
        }));
        setSuggestions(popular);
      } catch (_) {
        setSuggestions([]);
      }
      return;
    }
    if (q.length < 2) return; // avoid noisy searches
    try {
      const results = searchDestinations(q).map(r => ({
        value: r.name,
        label: `${r.name}${r.state ? `, ${r.state}` : ''}`
      }));
      setSuggestions(results);
    } catch (_) {
      setSuggestions([]);
    }
  }, [searchTerm]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDestinationInput = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    setTripDetails(prev => ({
      ...prev,
      destination: value
    }));
    // Immediately update shared context so other views react without submit
    updateTripDetails({ destination: value });
  };

  const handleDestinationSelect = (dest) => {
    setTripDetails(prev => ({
      ...prev,
      destination: dest.value
    }));
    // Immediately update shared context on selection
    updateTripDetails({ destination: dest.value });
    setSearchTerm(dest.label);
    setShowDropdown(false);
    setShowDestinationDetails(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTripDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBudgetSliderChange = (e) => {
    const value = e.target.value;
    setTripDetails(prev => ({
      ...prev,
      budget: value
    }));
  };

  const handleInterestToggle = (interest) => {
    setTripDetails(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setTripDetails(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!tripDetails.destination) newErrors.destination = 'Destination is required';
    if (!tripDetails.startDate) newErrors.startDate = 'Start date is required';
    if (!tripDetails.endDate) newErrors.endDate = 'End date is required';
    if (tripDetails.startDate && tripDetails.endDate && new Date(tripDetails.startDate) > new Date(tripDetails.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!tripDetails.budget) newErrors.budget = 'Budget is required';
    if (tripDetails.budget < 5000) newErrors.budget = 'Budget must be at least ₹5,000';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate form completion progress
  const calculateProgress = () => {
    let completed = 0;
    const total = 7; // Total fields to check
    
    if (tripDetails.destination) completed++;
    if (tripDetails.startDate) completed++;
    if (tripDetails.endDate) completed++;
    if (tripDetails.budget && tripDetails.budget >= 5000) completed++;
    if (tripDetails.travelType) completed++;
    if (tripDetails.groupType && tripDetails.groupSize) completed++;
    if (tripDetails.interests && tripDetails.interests.length > 0) completed++;
    
    return (completed / total) * 100;
  };

  const handleSaveDraft = () => {
    try {
      updateTripDetails(tripDetails);
      success('Draft saved successfully!', { title: 'Draft Saved' });
    } catch (err) {
      console.error('Error saving draft:', err);
      showError('Failed to save draft. Please try again.', { title: 'Error' });
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      try {
        console.log('Submitting trip details:', tripDetails);
        updateTripDetails(tripDetails);
        success('Trip details saved successfully!', { title: 'Success' });
        navigate('/dashboard'); // Navigate to dashboard after successful submission
      } catch (err) {
        console.error('Error updating trip details:', err);
        showError('Failed to save trip details. Please try again.', { title: 'Error' });
      }
    } else {
      showError('Please fix the errors in the form before continuing.', { title: 'Validation Error' });
      console.log('Form validation failed');
    }
  };

  // Add new state for showing destination details
  const [showDestinationDetails, setShowDestinationDetails] = useState(false);

  return (
    <div className="min-h-screen pb-20 bg-primary">
      {/* Hero Section */}
      <div className="section" style={{ paddingBottom: 'var(--space-4)' }}>
        <div className="container">
          <div className="gradient-hero">
            <div className="gradient-hero-content">
              <h1>Plan Your Perfect Trip</h1>
              <p>
                Discover welcoming destinations, gentle itineraries, and mindful budgeting all in one warm,
                AI-guided companion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="section" style={{ paddingTop: 'var(--space-4)' }}>
        <div className="container">
          <div className="card card-elevated">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          </div>

          <div className="space-y-10">
            {/* Destination Section */}
            <div className="form-group relative" ref={dropdownRef} style={{ zIndex: showDropdown ? 'var(--z-dropdown)' : 'auto' }}>
              <label className="form-label">Destination</label>
              <div className="relative input-with-icon">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleDestinationInput}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Where do you want to wander next?"
                  className={`form-input form-input-with-icon ${errors.destination ? 'error' : ''}`}
                />
                <div className="input-icon-wrapper">
                  <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              {showDropdown && (
                <div className="absolute w-full mt-2 card shadow-xl max-h-60 overflow-auto" style={{ zIndex: 'var(--z-dropdown)' }}>
                  {(suggestions || []).length === 0 ? (
                    <div className="px-4 py-3 text-secondary">No results</div>
                  ) : (
                    suggestions.map(dest => (
                      <div
                        key={dest.value}
                        onClick={() => handleDestinationSelect(dest)}
                        className="px-4 py-3 hover:bg-secondary cursor-pointer transition-colors flex items-center gap-3 text-primary"
                      >
                        <svg className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{dest.label}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
              {errors.destination && (
                <p className="form-error">{errors.destination}</p>
              )}
            </div>

            {/* Dates Section with Calendar */}
            <div className="form-group">
              <label className="form-label mb-4 block text-lg font-semibold">Travel Dates</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Calendar
                    label="Start Date"
                    value={tripDetails.startDate}
                    onChange={(date) => {
                      setTripDetails(prev => ({ ...prev, startDate: date }));
                      // If end date is before new start date, clear it
                      if (tripDetails.endDate && date && tripDetails.endDate < date) {
                        setTripDetails(prev => ({ ...prev, endDate: '' }));
                      }
                    }}
                    minDate={new Date().toISOString().split('T')[0]}
                    placeholder="Select start date"
                    error={errors.startDate}
                  />
                </div>
                <div>
                  <Calendar
                    label="End Date"
                    value={tripDetails.endDate}
                    onChange={(date) => {
                      setTripDetails(prev => ({ ...prev, endDate: date }));
                    }}
                    minDate={tripDetails.startDate || new Date().toISOString().split('T')[0]}
                    placeholder="Select end date"
                    error={errors.endDate}
                  />
                </div>
              </div>
              
              {/* Date Range Display */}
              {tripDetails.startDate && tripDetails.endDate && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Trip Duration</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {(() => {
                          const start = new Date(tripDetails.startDate);
                          const end = new Date(tripDetails.endDate);
                          const diffTime = Math.abs(end - start);
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                          return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
                        })()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">From</p>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(tripDetails.startDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">To</p>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(tripDetails.endDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {(errors.startDate || errors.endDate) && (
                <div className="mt-2 alert alert-error">
                  <p className="text-sm font-medium">
                    {errors.startDate || errors.endDate}
                  </p>
                </div>
              )}
            </div>

            {/* Budget Section with Slider */}
            <div className="form-group">
              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
                <div className="flex items-center justify-between mb-4">
                  <label className="form-label mb-0">Budget (₹)</label>
                  <span className="badge badge-primary" style={{ fontSize: '1.125rem', padding: '0.5rem 1rem' }}>
                    ₹{parseInt(tripDetails.budget).toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="1000"
                  value={tripDetails.budget}
                  onChange={handleBudgetSliderChange}
                  className="form-range w-full"
                />
                <div className="grid grid-cols-3 text-xs text-muted mt-2">
                  <span>Essentials</span>
                  <span className="text-center">Balanced</span>
                  <span className="text-right">Indulgent</span>
                </div>
              </div>
              {errors.budget && (
                <p className="form-error mt-2">{errors.budget}</p>
              )}
            </div>

            {/* Trip Type and Group Type Section */}
            <div className="grid grid-cols-2 gap-8">
              <div className="form-group">
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <label className="form-label mb-0">Trip Mood</label>
                    <span className="text-xs text-muted uppercase tracking-wider">Choose one</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['vacation', 'business', 'adventure', 'spiritual', 'educational'].map(type => (
                      <button
                        key={type}
                        onClick={() => handleInputChange({ target: { name: 'travelType', value: type } })}
                        className={`form-option ${
                          tripDetails.travelType === type ? 'form-option-active' : ''
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <label className="form-label mb-0">Companions</label>
                    <span className="text-xs text-muted uppercase tracking-wider">Who's going?</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {['solo', 'couple', 'family', 'friends', 'group'].map(type => (
                      <button
                        key={type}
                        onClick={() => handleInputChange({ target: { name: 'groupType', value: type } })}
                        className={`form-option ${
                          tripDetails.groupType === type ? 'form-option-active' : ''
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="form-label">Number of Travelers</label>
                    <input
                      type="number"
                      name="groupSize"
                      min="1"
                      max="20"
                      value={tripDetails.groupSize || 1}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter number of travelers"
                    />
                    <p className="text-xs text-muted">
                      Share how many people you'll be traveling with.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interests Section */}
            <div className="form-group">
              <div className="card">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <label className="form-label mb-0">What interests you?</label>
                  <span className="text-xs text-muted uppercase tracking-wider">
                    Pick everything that sparks joy
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {interestOptions.map(interest => (
                    <button
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`form-option ${
                        tripDetails.interests.includes(interest) ? 'form-option-active' : ''
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Travel Preferences Section */}
            <div className="grid grid-cols-3 gap-8">
              {[
                {
                  label: 'Accommodation',
                  name: 'accommodation',
                  options: ['hotel', 'resort', 'hostel', 'apartment', 'homestay'],
                },
                {
                  label: 'Travel Style',
                  name: 'travelStyle',
                  options: ['relaxed', 'moderate', 'intense', 'luxury', 'budget'],
                },
                {
                  label: 'Food Preference',
                  name: 'foodPreference',
                  options: ['all', 'vegetarian', 'vegan', 'halal', 'local'],
                },
              ].map(({ label, name, options }) => (
                <div key={name} className="form-group">
                  <label className="form-label">{label}</label>
                  <select
                    name={name}
                    value={tripDetails.preferences[name]}
                    onChange={handlePreferenceChange}
                    className="form-select"
                  >
                    {options.map(option => (
                      <option key={option} value={option}>
                        {option === 'all'
                          ? 'All types'
                          : option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={handleSaveDraft}
                className="btn btn-outline"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Draft
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-cta btn-lg"
              >
                Continue to Dashboard
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Destination Details + Attractions */}
      {showDestinationDetails && tripDetails.destination && (
        <div className="section">
          <div className="container space-y-10">
            <DestinationDetails destination={tripDetails.destination} />
            <DestinationRecommendations 
              tripDetails={tripDetails}
              setCurrentStep={() => {}}
            />
            <TravelTips 
              destination={tripDetails.destination}
              tripType={tripDetails.travelType}
              startDate={tripDetails.startDate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetailsForm; 