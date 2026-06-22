import React from 'react';

const SelectedAttractionsPanel = ({ selectedAttractions, onAttractionRemove }) => {
  const totalBudget = selectedAttractions.reduce((sum, attraction) => sum + attraction.price, 0);

  return (
    <div className="bg-gray-50 rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Selected Attractions</h3>
        <span className="text-sm text-gray-500">
          {selectedAttractions.length} selected
        </span>
      </div>

      {selectedAttractions.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No attractions selected yet. Start by adding some attractions to your plan!
        </p>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {selectedAttractions.map((attraction) => (
              <div
                key={attraction.id}
                className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={attraction.imageUrl}
                    alt={attraction.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{attraction.name}</h4>
                    <p className="text-sm text-gray-500">₹{attraction.price.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <button
                  onClick={() => onAttractionRemove(attraction)}
                  className="text-red-600 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Budget</span>
              <span>₹{totalBudget.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SelectedAttractionsPanel; 