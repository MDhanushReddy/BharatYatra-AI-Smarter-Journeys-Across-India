import React from 'react';
import TripDetailsForm from '../components/TripDetailsForm';

const CreateTrip = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Perfect Trip</h1>
          <p className="mt-2 text-gray-600">Fill in your preferences and let AI plan your dream vacation</p>
        </div>
        <TripDetailsForm />
      </div>
    </div>
  );
};

export default CreateTrip; 