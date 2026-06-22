import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function Home() {
  const [imageErrors, setImageErrors] = useState({
    itinerary: false,
    weather: false
  });

  const handleImageError = (imageType) => {
    setImageErrors(prev => ({
      ...prev,
      [imageType]: true
    }));
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="text-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-xl mb-16">
        <h1 className="text-5xl font-extrabold mb-6">
          Plan Your Dream Vacation with AI
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
          Experience the future of travel planning with our AI-powered itinerary creator.
          Personalized recommendations, smart budgeting, and real-time weather integration.
        </p>
        <Link
          to="/plan"
          className="inline-flex items-center px-8 py-4 border-2 border-white text-lg font-medium rounded-full text-white hover:bg-white hover:text-indigo-600 transition-all duration-200"
        >
          Start Your Journey
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-16">
        <div className="bg-white p-8 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-200">
          <div className="text-indigo-600 mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Recommendations</h3>
          <p className="text-gray-600">
            Our AI analyzes your preferences, budget, and travel style to suggest the perfect activities and attractions.
            Get personalized recommendations that match your interests.
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-200">
          <div className="text-indigo-600 mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Weather Integration</h3>
          <p className="text-gray-600">
            Plan your activities with confidence using real-time weather forecasts. Our system automatically adjusts recommendations based on weather conditions.
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-200">
          <div className="text-indigo-600 mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Budgeting</h3>
          <p className="text-gray-600">
            Optimize your travel budget with intelligent cost allocation. Get the most value from your trip with balanced spending across activities and accommodations.
          </p>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Experience Smarter Travel Planning</h2>
        <p className="text-xl text-gray-600 text-center mb-8 max-w-3xl mx-auto">
          Our AI-powered platform makes trip planning effortless with intelligent features designed for modern travelers.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="bg-indigo-50 p-6">
              {!imageErrors.itinerary ? (
                <img 
                  src="screenshots/itinerary-view.svg"
                  alt="AI-Generated Itinerary"
                  className="rounded-lg shadow-md w-full h-48 object-contain"
                  onError={() => handleImageError('itinerary')}
                />
              ) : (
                <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Intelligent Itinerary Generation</h3>
              <p className="text-gray-600 mb-4">
                Experience AI-powered trip planning that creates the perfect schedule based on your preferences,
                considering opening hours and travel times.
              </p>
              <div className="flex flex-wrap gap-4">
                <span className="inline-flex items-center text-sm text-indigo-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Time-optimized scheduling
                </span>
                <span className="inline-flex items-center text-sm text-indigo-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Easy customization
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="bg-indigo-50 p-6">
              {!imageErrors.weather ? (
                <img 
                  src="screenshots/weather-view.svg"
                  alt="Weather Integration"
                  className="rounded-lg shadow-md w-full h-48 object-contain"
                  onError={() => handleImageError('weather')}
                />
              ) : (
                <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Weather Integration</h3>
              <p className="text-gray-600 mb-4">
                Never let weather surprise you. Our system automatically adjusts your itinerary based on
                real-time forecasts.
              </p>
              <div className="flex flex-wrap gap-4">
                <span className="inline-flex items-center text-sm text-indigo-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Real-time updates
                </span>
                <span className="inline-flex items-center text-sm text-indigo-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Smart rescheduling
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-indigo-600 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Weather Integration</h3>
            <p className="text-gray-600">
              Real-time weather forecasts and smart rescheduling of outdoor activities based on weather conditions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-indigo-600 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Insights</h3>
            <p className="text-gray-600">
              Get recommendations for hidden gems, local favorites, and authentic experiences in your destination.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-indigo-600 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Customization</h3>
            <p className="text-gray-600">
              Fine-tune your itinerary with easy drag-and-drop reordering and personalized activity preferences.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 rounded-lg p-8 mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600">1</span>
            </div>
            <h3 className="font-semibold mb-2">Enter Your Preferences</h3>
            <p className="text-gray-600">Tell us about your destination, dates, budget, and interests.</p>
          </div>
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600">2</span>
            </div>
            <h3 className="font-semibold mb-2">AI Generation</h3>
            <p className="text-gray-600">Our AI creates a personalized itinerary based on your inputs.</p>
          </div>
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600">3</span>
            </div>
            <h3 className="font-semibold mb-2">Customize & Go</h3>
            <p className="text-gray-600">Review, adjust, and finalize your perfect trip plan.</p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What Travelers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xl font-bold text-indigo-600">S</span>
              </div>
              <div className="ml-4">
                <h4 className="font-semibold">Sarah M.</h4>
                <p className="text-gray-500 text-sm">Adventure Traveler</p>
              </div>
            </div>
            <p className="text-gray-600">
              "The AI suggestions were spot-on! Saved me hours of planning and discovered hidden gems 
              I wouldn't have found otherwise."
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xl font-bold text-indigo-600">R</span>
              </div>
              <div className="ml-4">
                <h4 className="font-semibold">Raj P.</h4>
                <p className="text-gray-500 text-sm">Family Traveler</p>
              </div>
            </div>
            <p className="text-gray-600">
              "Perfect for family trips! The budget allocation feature helped us plan activities 
              for everyone while staying within our budget."
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xl font-bold text-indigo-600">E</span>
              </div>
              <div className="ml-4">
                <h4 className="font-semibold">Emma L.</h4>
                <p className="text-gray-500 text-sm">Solo Traveler</p>
              </div>
            </div>
            <p className="text-gray-600">
              "The weather integration is fantastic! My activities were automatically adjusted when 
              rain was forecasted, saving my trip."
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-indigo-50 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Planning?</h2>
        <p className="text-xl text-gray-600 mb-8">
          Create your personalized travel itinerary in minutes.
        </p>
        <Link
          to="/plan"
          className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Plan Your Trip Now
        </Link>
      </div>
    </div>
  )
}

export default Home 