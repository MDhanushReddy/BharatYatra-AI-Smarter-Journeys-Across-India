import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripPlanning } from '../../context/TripPlanningContext';
import PremiumLayout from '../premium/PremiumLayout';
import BudgetAllocation from '../budget/BudgetAllocation';
import GroupBudgetSplitter from '../budget/GroupBudgetSplitter';
import TransportationOptions from '../transportation/TransportationOptions';
import LocalAssistance from '../cultural/LocalAssistance';
import AIChatAssistant from '../chat/AIChatAssistant';
import AccommodationRecommendations from '../accommodation/AccommodationRecommendations';
import FoodRecommendations from '../food/FoodRecommendations';
import SightseeingOptimizer from '../sightseeing/SightseeingOptimizer';
import ProgressBar from '../ui/ProgressBar';

const TripPlanningDashboard = () => {
  const navigate = useNavigate();
  const { 
    tripDetails, 
    calculateTripDuration,
    selectedAccommodations,
    selectedRestaurants,
    selectedAttractions,
    generatedItinerary
  } = useTripPlanning();
  // Check if there's a tab stored in sessionStorage (from continue button)
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = sessionStorage.getItem('dashboardActiveTab');
    if (savedTab) {
      sessionStorage.removeItem('dashboardActiveTab');
      return savedTab;
    }
    return 'overview';
  });

  // Calculate trip planning progress
  const calculateProgress = () => {
    let completed = 0;
    const total = 5;

    // Trip details completed
    if (tripDetails?.destination && tripDetails?.startDate && tripDetails?.endDate) {
      completed++;
    }

    // Accommodation selected
    if (selectedAccommodations && selectedAccommodations.length > 0) {
      completed++;
    }

    // Restaurants selected
    if (selectedRestaurants && selectedRestaurants.length > 0) {
      completed++;
    }

    // Attractions selected
    if (selectedAttractions && selectedAttractions.length > 0) {
      completed++;
    }

    // Itinerary generated
    if (generatedItinerary && generatedItinerary.length > 0) {
      completed++;
    }

    return (completed / total) * 100;
  };

  // Redirect to trip planning form if trip details are missing
  useEffect(() => {
    if (!tripDetails || !tripDetails.destination || !tripDetails.startDate || !tripDetails.endDate) {
      navigate('/plan');
    }
  }, [tripDetails, navigate]);

  const tabs = [
    { id: 'overview', label: 'Trip Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'budget', label: 'Budget & Group', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'accommodation', label: 'Accommodation', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
    { id: 'food', label: 'Food & Dining', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'sightseeing', label: 'Sightseeing', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
    { id: 'transport', label: 'Transport', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'cultural', label: 'Local Guide', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'assistance', label: 'AI Assistant', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' }
  ];

  const renderTabContent = () => {
    const duration = calculateTripDuration() || 0;
    const formattedBudget = parseInt(tripDetails.budget || 5000, 10).toLocaleString();

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2>Trip Snapshot</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => navigate('/plan')}
                  className="btn btn-outline btn-sm"
                >
                  Edit Trip Details
                </button>
                <span className="badge badge-primary">
                  Destination • {tripDetails.destination || 'TBD'}
                </span>
              </div>
            </div>

            {/* Trip Planning Progress */}
            <div className="card">
              <h3 className="card-title">Planning Progress</h3>
              <ProgressBar 
                progress={calculateProgress()} 
                label="Trip Planning Completion"
                showPercentage={true}
              />
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div className={`flex items-center gap-2 ${tripDetails?.destination && tripDetails?.startDate && tripDetails?.endDate ? 'text-secondary' : 'text-muted'}`}>
                  <span>{tripDetails?.destination && tripDetails?.startDate && tripDetails?.endDate ? '✓' : '○'}</span>
                  <span>Trip Details</span>
                </div>
                <div className={`flex items-center gap-2 ${selectedAccommodations?.length > 0 ? 'text-secondary' : 'text-muted'}`}>
                  <span>{selectedAccommodations?.length > 0 ? '✓' : '○'}</span>
                  <span>Accommodation</span>
                </div>
                <div className={`flex items-center gap-2 ${selectedRestaurants?.length > 0 ? 'text-secondary' : 'text-muted'}`}>
                  <span>{selectedRestaurants?.length > 0 ? '✓' : '○'}</span>
                  <span>Restaurants</span>
                </div>
                <div className={`flex items-center gap-2 ${selectedAttractions?.length > 0 ? 'text-secondary' : 'text-muted'}`}>
                  <span>{selectedAttractions?.length > 0 ? '✓' : '○'}</span>
                  <span>Attractions</span>
                </div>
                <div className={`flex items-center gap-2 ${generatedItinerary?.length > 0 ? 'text-secondary' : 'text-muted'}`}>
                  <span>{generatedItinerary?.length > 0 ? '✓' : '○'}</span>
                  <span>Itinerary</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="card">
                <h3 className="card-title">Destination</h3>
                <p className="card-body">{tripDetails.destination || 'Not selected yet'}</p>
              </div>
              <div className="card">
                <h3 className="card-title">Duration</h3>
                <p className="card-body">{duration} day{duration === 1 ? '' : 's'}</p>
              </div>
              <div className="card">
                <h3 className="card-title">Travel Mood</h3>
                <p className="card-body">
                  {tripDetails.travelType
                    ? tripDetails.travelType.charAt(0).toUpperCase() + tripDetails.travelType.slice(1)
                    : 'Not specified'}
                </p>
              </div>
              <div className="card">
                <h3 className="card-title">Companions</h3>
                <p className="card-body">
                  {tripDetails.groupType
                    ? tripDetails.groupType.charAt(0).toUpperCase() + tripDetails.groupType.slice(1)
                    : 'Solo'}
                  <span className="text-muted"> • {tripDetails.groupSize || 1} traveler(s)</span>
                </p>
              </div>
              <div className="card">
                <h3 className="card-title">Budget Comfort</h3>
                <p className="card-body">₹{formattedBudget}</p>
              </div>
              <div className="card">
                <h3 className="card-title">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {(tripDetails.interests || []).length > 0 ? (
                    tripDetails.interests.map((interest) => (
                      <span key={interest} className="badge badge-secondary">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted text-sm">No interests selected yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'budget':
        return (
          <div className="space-y-6">
            <div className="card">
              <GroupBudgetSplitter />
            </div>
            <div className="card">
              <BudgetAllocation
                totalBudget={parseInt(tripDetails.budget, 10) || 5000}
                groupType={tripDetails.groupType}
                duration={duration}
                preferences={tripDetails.preferences || {}}
              />
            </div>
          </div>
        );
      case 'accommodation':
        return (
          <div className="card">
            <AccommodationRecommendations />
          </div>
        );
      case 'food':
        return (
          <div className="card">
            <FoodRecommendations />
          </div>
        );
      case 'sightseeing':
        return (
          <div className="card">
            <SightseeingOptimizer />
          </div>
        );
      case 'transport':
        return (
          <div className="card">
            <TransportationOptions
              destination={tripDetails.destination || ''}
              budget={parseInt(tripDetails.budget || 5000, 10)}
              duration={duration || 1}
            />
          </div>
        );
      case 'cultural':
        return (
          <div className="card">
            <LocalAssistance destination={tripDetails.destination || ''} />
          </div>
        );
      case 'assistance':
        return (
          <div className="card">
            <AIChatAssistant />
          </div>
        );
      default:
        return null;
    }
  };

  // Show loading or empty state if trip details are not ready
  if (!tripDetails || !tripDetails.destination || !tripDetails.startDate || !tripDetails.endDate) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-primary">
        <div className="text-center space-y-4">
          <div className="spinner mx-auto"></div>
          <p className="text-secondary">Loading trip details...</p>
        </div>
      </div>
    );
  }

  return (
    <PremiumLayout>
      <div className="min-h-screen pb-16 bg-primary">
        {/* Header */}
        <div className="section">
          <div className="container">
            <div className="gradient-hero">
              <div className="gradient-hero-content">
                <h1>Trip Planning Dashboard</h1>
                <p>
                  Keep every detail close, from budgets to hidden gems, while your AI companion keeps plans flexible and serene.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="container" style={{ marginTop: '-60px', marginBottom: '2rem', position: 'relative', zIndex: 2 }}>
          <div className="tab-bar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="section">
          <div className="container">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
};

export default TripPlanningDashboard; 