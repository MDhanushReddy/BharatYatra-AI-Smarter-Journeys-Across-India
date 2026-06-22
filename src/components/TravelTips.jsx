import React from 'react';

const packingListByTripType = {
  vacation: [
    'Casual clothes',
    'Comfortable walking shoes',
    'Camera',
    'Sunscreen',
    'Swimming gear',
    'Basic first-aid kit'
  ],
  business: [
    'Formal attire',
    'Business cards',
    'Laptop and charger',
    'Documents folder',
    'Power bank',
    'Formal shoes'
  ],
  adventure: [
    'Hiking boots',
    'Weather-appropriate gear',
    'First-aid kit',
    'Backpack',
    'Water bottle',
    'Energy snacks'
  ],
  spiritual: [
    'Modest clothing',
    'Prayer materials',
    'Comfortable footwear',
    'Head covering',
    'Traditional attire',
    'Religious texts'
  ],
  educational: [
    'Notebook and pens',
    'Laptop',
    'Camera',
    'Study materials',
    'Dictionary',
    'Power adapters'
  ]
};

const seasonalTips = {
  summer: [
    'Pack light, breathable clothes',
    'Carry sunscreen and sunglasses',
    'Stay hydrated',
    'Plan indoor activities during peak heat'
  ],
  monsoon: [
    'Pack umbrella or raincoat',
    'Waterproof bags for electronics',
    'Quick-dry clothes',
    'Water-resistant footwear'
  ],
  winter: [
    'Pack warm layers',
    'Thermal wear for cold nights',
    'Moisturizer for dry weather',
    'Check heating in accommodation'
  ]
};

const TravelTips = ({ destination, tripType, startDate }) => {
  const getSeason = (date) => {
    const month = new Date(date).getMonth();
    if (month >= 3 && month <= 5) return 'summer';
    if (month >= 6 && month <= 9) return 'monsoon';
    return 'winter';
  };

  const season = getSeason(startDate);

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 mt-8">
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-gray-800">Travel Tips & Packing Guide</h2>
        
        {/* Season-specific Tips */}
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-blue-800 mb-4">
            Seasonal Tips for {season.charAt(0).toUpperCase() + season.slice(1)}
          </h3>
          <ul className="space-y-2">
            {seasonalTips[season].map((tip, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span className="text-blue-700">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Packing List */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Essential Packing List for {tripType.charAt(0).toUpperCase() + tripType.slice(1)} Trip
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-700 mb-3">Must-Pack Items</h4>
              <ul className="space-y-2">
                {packingListByTripType[tripType].map((item, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-700 mb-3">General Essentials</h4>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Valid ID proof</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Travel insurance documents</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Emergency contacts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Basic medications</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Phone and charger</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Travel Tips */}
        <div className="bg-green-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-green-800 mb-4">General Travel Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-green-500">•</span>
                <span className="text-green-700">Keep digital copies of important documents</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500">•</span>
                <span className="text-green-700">Inform your bank about travel plans</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500">•</span>
                <span className="text-green-700">Download offline maps</span>
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-green-500">•</span>
                <span className="text-green-700">Check weather forecast before packing</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500">•</span>
                <span className="text-green-700">Book accommodations in advance</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500">•</span>
                <span className="text-green-700">Research local customs and etiquette</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelTips; 