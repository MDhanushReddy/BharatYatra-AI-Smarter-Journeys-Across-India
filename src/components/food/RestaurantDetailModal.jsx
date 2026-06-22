import React from 'react';
import DetailModal from '../ui/DetailModal';

const RestaurantDetailModal = ({ restaurant, isOpen, onClose, onSelect, isSelected, onRemove }) => {
  if (!restaurant) return null;

  const getCuisineIcon = (cuisine) => {
    const icons = {
      'Indian': '🍛',
      'Chinese': '🥢',
      'Italian': '🍝',
      'Mexican': '🌮',
      'Thai': '🍜',
      'Continental': '🍽️',
      'South Indian': '🍛',
      'North Indian': '🍛',
      'Street Food': '🌭'
    };
    return icons[cuisine] || '🍽️';
  };

  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian', icon: '🌱' },
    { value: 'nonVegetarian', label: 'Non-Vegetarian', icon: '🍖' },
    { value: 'vegan', label: 'Vegan', icon: '🌿' },
    { value: 'jain', label: 'Jain', icon: '🕉️' },
    { value: 'halal', label: 'Halal', icon: '🕌' }
  ];

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={restaurant.name}
      footer={
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-earth">
              {restaurant.priceRange || '₹₹'}
            </div>
            <div className="travel-subtle-text text-sm">
              Avg: ₹{restaurant.avgCost || 'N/A'} per person
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isSelected ? (
              <button
                onClick={() => {
                  onRemove(restaurant.id);
                  onClose();
                }}
                className="travel-button bg-[hsla(var(--destructive)/0.9)] hover:bg-[hsla(var(--destructive)/1)]"
              >
                Remove from Trip
              </button>
            ) : (
              <button
                onClick={() => {
                  onSelect(restaurant);
                  onClose();
                }}
                className="travel-button"
              >
                Add to Trip
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Image */}
        <div className="w-full h-64 rounded-xl overflow-hidden soft-shadow">
          <img
            src={restaurant.image || 'https://via.placeholder.com/800x400?text=Restaurant'}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/800x400?text=Restaurant';
            }}
          />
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-earth flex items-center gap-2">
                {restaurant.name}
                <span className="travel-pill text-sm">
                  {getCuisineIcon(restaurant.cuisine)} {restaurant.cuisine}
                </span>
              </h3>
              <p className="travel-subtle-text mt-1">{restaurant.location}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-500">
                <span>★</span>
                <span className="text-earth font-semibold">{restaurant.rating || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {restaurant.description && (
            <p className="travel-body-text leading-relaxed">{restaurant.description}</p>
          )}

          {/* Specialties */}
          {restaurant.specialties && restaurant.specialties.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-earth mb-3">Specialties</h4>
              <div className="flex flex-wrap gap-2">
                {restaurant.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="travel-pill bg-sunset-soft text-earth"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dietary Options */}
          {restaurant.dietaryOptions && restaurant.dietaryOptions.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-earth mb-3">Dietary Options</h4>
              <div className="flex flex-wrap gap-2">
                {restaurant.dietaryOptions.map((option) => {
                  const dietaryOption = dietaryOptions.find(d => d.value === option);
                  return (
                    <span
                      key={option}
                      className="travel-pill bg-warm-sky-soft text-earth flex items-center gap-1"
                    >
                      <span>{dietaryOption?.icon}</span>
                      <span>{dietaryOption?.label || option}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Meal Types */}
          {restaurant.mealTypes && restaurant.mealTypes.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-earth mb-3">Available For</h4>
              <div className="flex flex-wrap gap-2">
                {restaurant.mealTypes.map((meal, index) => (
                  <span
                    key={index}
                    className="travel-pill bg-misty text-earth"
                  >
                    {meal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[hsla(var(--border)/1)]">
            <div>
              <p className="travel-subtle-text text-sm">Cuisine</p>
              <p className="text-earth font-medium">{restaurant.cuisine || 'Multi-Cuisine'}</p>
            </div>
            <div>
              <p className="travel-subtle-text text-sm">Price Range</p>
              <p className="text-earth font-medium">{restaurant.priceRange || '₹₹'}</p>
            </div>
          </div>
        </div>
      </div>
    </DetailModal>
  );
};

export default RestaurantDetailModal;

