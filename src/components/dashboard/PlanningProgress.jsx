import React from 'react';

const PlanningProgress = ({ progress }) => {
  const steps = [
    { key: 'tripDetails', label: 'Trip Details', icon: '📝' },
    { key: 'attractions', label: 'Attractions', icon: '🎯' },
    { key: 'accommodation', label: 'Accommodation', icon: '🏨' },
    { key: 'transportation', label: 'Transportation', icon: '🚗' },
    { key: 'food', label: 'Food & Dining', icon: '🍽️' },
    { key: 'itinerary', label: 'Itinerary', icon: '📅' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-6 text-gray-800">Planning Progress</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className={`relative p-4 rounded-lg ${
              progress[step.key]
                ? 'bg-green-100 border-green-500'
                : 'bg-gray-100 border-gray-300'
            } border-2 transition-all duration-300`}
          >
            <div className="flex flex-col items-center space-y-2">
              <span className="text-2xl" role="img" aria-label={step.label}>
                {step.icon}
              </span>
              <span className="text-sm font-medium text-center">
                {step.label}
              </span>
              {progress[step.key] && (
                <span className="absolute top-2 right-2 text-green-500">
                  ✓
                </span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-4 w-4 h-0.5 bg-gray-300"></div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 rounded-full h-2 transition-all duration-300"
            style={{
              width: `${
                (Object.values(progress).filter(Boolean).length / steps.length) *
                100
              }%`
            }}
          ></div>
        </div>
        <div className="mt-2 text-right text-sm text-gray-600">
          {Object.values(progress).filter(Boolean).length} of {steps.length} completed
        </div>
      </div>
    </div>
  );
};

export default PlanningProgress; 