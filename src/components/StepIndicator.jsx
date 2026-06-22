import React from 'react';

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { step: 0, title: 'Start' },
    { step: 1, title: 'Basic Details' },
    { step: 2, title: 'Destination' },
    { step: 3, title: 'Travel Dates' },
    { step: 4, title: 'Budget' },
    { step: 5, title: 'Trip Type' },
    { step: 6, title: 'Group Size' },
    { step: 7, title: 'Interests' },
    { step: 8, title: 'Preferences' },
    { step: 9, title: 'Attractions' },
    { step: 10, title: 'Itinerary' },
    { step: 11, title: 'Confirmation' }
  ];

  return (
    <div className="w-full py-4 bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.step}>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= step.step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.step}
                  </div>
                  <span className={`ml-2 text-sm hidden md:block ${
                    currentStep >= step.step
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep > step.step
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator; 