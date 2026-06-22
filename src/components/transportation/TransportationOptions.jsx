import React, { useState, useEffect } from 'react';
import { getDestinationDetails } from '../../services/indianLocationsAPI';

const TransportationOptions = ({ destination, budget, duration }) => {
  const [selectedMode, setSelectedMode] = useState('public');
  const [showRentalOptions, setShowRentalOptions] = useState(false);
  const [transportOptions, setTransportOptions] = useState(null);

  useEffect(() => {
    if (destination) {
      const destInfo = getDestinationDetails(destination);
      const localTransport = destInfo?.localTransport || [];
      
      // Destination-specific transport pricing
      const destinationPricing = {
        'mumbai': { metro: 50, bus: 20, auto: 120, car: 1800, bike: 600, scooter: 400 },
        'delhi': { metro: 60, bus: 25, auto: 150, car: 2000, bike: 700, scooter: 500 },
        'bangalore': { metro: 55, bus: 22, auto: 100, car: 1700, bike: 550, scooter: 350 },
        'chennai': { metro: 45, bus: 18, auto: 80, car: 1600, bike: 500, scooter: 300 },
        'kolkata': { metro: 40, bus: 15, auto: 100, car: 1500, bike: 450, scooter: 280 },
        'hyderabad': { metro: 50, bus: 20, auto: 90, car: 1650, bike: 520, scooter: 320 },
        'pune': { metro: 0, bus: 25, auto: 100, car: 1600, bike: 500, scooter: 300 },
        'goa': { metro: 0, bus: 30, auto: 150, car: 2000, bike: 800, scooter: 500 }
      };
      
      const pricing = destinationPricing[destination.toLowerCase()] || destinationPricing['delhi'];
      
      const options = {
        public: {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
            </svg>
          ),
          title: 'Public Transport',
          description: 'Buses, metros, and local transport',
          options: [
            ...(localTransport.includes('Metro') ? [{ name: 'Metro', cost: `₹${pricing.metro} per trip` }] : []),
            ...(localTransport.includes('Bus') || localTransport.includes('Local Bus') ? [{ name: 'Local Bus', cost: `₹${pricing.bus} per trip` }] : []),
            { name: 'Auto Rickshaw', cost: `₹${pricing.auto}-${pricing.auto + 50} per trip` },
            ...(localTransport.includes('Train') || localTransport.includes('Local Train') ? [{ name: 'Local Train', cost: '₹10-50 per trip' }] : [])
          ]
        },
        rental: {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
          title: 'Rental Vehicles',
          description: 'Cars, bikes, and scooters',
          options: [
            { name: 'Economy Car', cost: `₹${pricing.car} per day` },
            { name: 'SUV', cost: `₹${pricing.car + 800} per day` },
            { name: 'Bike', cost: `₹${pricing.bike} per day` },
            { name: 'Scooter', cost: `₹${pricing.scooter} per day` }
          ]
        },
        self: {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          ),
          title: 'Self Drive',
          description: 'Use your own vehicle',
          options: [
            { name: 'Fuel Stations', info: 'View nearby stations' },
            { name: 'Parking', info: 'Find parking spots' },
            { name: 'Service Centers', info: 'Emergency services' }
          ]
        }
      };
      
      setTransportOptions(options);
    }
  }, [destination]);

  const transportModes = transportOptions || {
    public: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
        </svg>
      ),
      title: 'Public Transport',
      description: 'Buses, metros, and local trains',
      options: [
        { name: 'Metro', cost: '₹50 per trip' },
        { name: 'Local Bus', cost: '₹20 per trip' },
        { name: 'Auto Rickshaw', cost: '₹100-200 per trip' }
      ]
    },
    rental: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Rental Vehicles',
      description: 'Cars, bikes, and scooters',
      options: [
        { name: 'Economy Car', cost: '₹1500 per day' },
        { name: 'Bike', cost: '₹500 per day' },
        { name: 'Scooter', cost: '₹300 per day' }
      ]
    },
    self: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
      title: 'Self Drive',
      description: 'Use your own vehicle',
      options: [
        { name: 'Fuel Stations', info: 'View nearby stations' },
        { name: 'Parking', info: 'Find parking spots' },
        { name: 'Service Centers', info: 'Emergency services' }
      ]
    }
  };

  return (
    <div className="travel-section space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-earth">Transportation Options</h2>
        <span className="travel-pill text-sm">
          {destination ? `Planning for ${destination}` : 'Pick your mode'}
        </span>
      </div>

      {/* Transport Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(transportModes).map(([mode, data]) => (
          <button
            key={mode}
            onClick={() => {
              setSelectedMode(mode);
              setShowRentalOptions(mode === 'rental');
            }}
            className={`travel-option flex flex-col items-center gap-2 py-6 ${
              selectedMode === mode ? 'travel-option-active' : ''
            }`}
          >
            <span className="text-earth">{data.icon}</span>
            <span className="font-semibold">{data.title}</span>
            <span className="travel-subtle-text text-sm text-center">{data.description}</span>
          </button>
        ))}
      </div>

      {/* Options Display */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-earth">
          {transportModes[selectedMode].title} Options
        </h3>
        <div className="space-y-3">
          {transportModes[selectedMode].options.map((option, index) => (
            <div
              key={index}
              className="travel-section py-3 px-4 flex flex-wrap justify-between items-center gap-3"
            >
              <span className="font-medium text-earth">{option.name}</span>
              <span className="travel-subtle-text">{option.cost || option.info}</span>
            </div>
          ))}
        </div>
        {selectedMode === 'rental' && showRentalOptions && (
          <div className="travel-note text-sm">
            Compare daily caps with your budget of ₹{budget?.toLocaleString() || 0} to pick the most comfortable ride.
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-earth">Travel Tips</h3>
        <div className="space-y-3">
          {[
            'Book in advance during peak season for better rates.',
            'Blend public transport with quick ride-hails to stay flexible.',
            'Download local transport apps for live schedules and alerts.'
          ].map((tip) => (
            <div key={tip} className="travel-tip-card">
              <span className="travel-tip-icon">ℹ️</span>
              <p className="travel-body-text">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransportationOptions; 