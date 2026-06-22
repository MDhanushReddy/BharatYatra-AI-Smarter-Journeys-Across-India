import React from 'react'

export default function Transportation({ formData = {}, onUpdate }) {
  const transportationOptions = [
    {
      type: 'flight',
      icon: '✈️',
      name: 'Air Travel',
      description: 'Quick and convenient for longer distances',
      recommended: formData.tripType === 'business'
    },
    {
      type: 'train',
      icon: '🚂',
      name: 'Train',
      description: 'Scenic routes and comfortable travel',
      recommended: formData.preferences?.includes('nature')
    },
    {
      type: 'bus',
      icon: '🚌',
      name: 'Bus',
      description: 'Budget-friendly and flexible',
      recommended: formData.travelGroup === 'group'
    },
    {
      type: 'car',
      icon: '🚗',
      name: 'Rental Car',
      description: 'Freedom to explore at your own pace',
      recommended: formData.preferences?.includes('adventure')
    },
    {
      type: 'bike',
      icon: '🚲',
      name: 'Bicycle',
      description: 'Eco-friendly and great for local exploration',
      recommended: formData.preferences?.includes('nature')
    }
  ]

  const handleTransportationSelect = (type) => {
    const currentTransportation = formData.transportation || [];
    const newTransportation = currentTransportation.includes(type)
      ? currentTransportation.filter(t => t !== type)
      : [...currentTransportation, type];

    if (onUpdate) {
      onUpdate({
        target: {
          name: 'transportation',
          value: newTransportation
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Transportation Options</h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        {transportationOptions.map(option => (
          <div 
            key={option.type}
            onClick={() => handleTransportationSelect(option.type)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 ${
              (formData.transportation || []).includes(option.type)
                ? 'border-blue-500 bg-blue-50'
                : option.recommended 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{option.icon}</span>
              <div>
                <h4 className="font-semibold">{option.name}</h4>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
            </div>
            {option.recommended && (
              <div className="mt-2 text-sm text-green-600 font-medium">
                ✓ Recommended for your trip
              </div>
            )}
            {(formData.transportation || []).includes(option.type) && (
              <div className="mt-2 text-sm text-blue-600 font-medium">
                ✓ Selected
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mt-6">
        <h4 className="font-semibold mb-2">Travel Tips</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Book transportation in advance for better rates</li>
          <li>Consider multi-modal transportation for flexibility</li>
          <li>Check local transportation passes and deals</li>
          <li>Verify travel insurance coverage for your chosen mode</li>
        </ul>
      </div>
    </div>
  )
} 