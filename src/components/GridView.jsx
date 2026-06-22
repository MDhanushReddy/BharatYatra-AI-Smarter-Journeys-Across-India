import React from 'react';

const GridView = ({ attractions, onAttractionSelect, selectedAttractions, onAttractionHover }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {attractions.map((attraction) => {
        const isSelected = selectedAttractions.some(a => a.id === attraction.id);
        return (
          <div
            key={attraction.id}
            className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            }`}
            onMouseEnter={() => onAttractionHover(attraction)}
            onMouseLeave={() => onAttractionHover(null)}
          >
            <img
              src={attraction.imageUrl}
              alt={attraction.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{attraction.name}</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                  {attraction.rating} ★
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4">{attraction.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">
                  ₹{attraction.price.toLocaleString('en-IN')}
                </span>
                <button
                  onClick={() => onAttractionSelect(attraction)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {isSelected ? 'Remove' : 'Add to Plan'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GridView; 