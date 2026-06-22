import React from 'react';
import DetailModal from '../ui/DetailModal';

const AccommodationDetailModal = ({ accommodation, isOpen, onClose, onSelect, isSelected, onRemove }) => {
  if (!accommodation) return null;

  const getAccommodationTypeIcon = (type) => {
    const icons = {
      'Hostel': '🏠',
      'Guest House': '🏡',
      'Hotel': '🏨',
      'Resort': '🏖️',
      'Apartment': '🏢'
    };
    return icons[type] || '🏨';
  };

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={accommodation.name}
      footer={
        <div className="flex items-center justify-between gap-4">
          <div className="text-xl font-semibold text-earth">
            ₹{accommodation.price?.toLocaleString() || 'N/A'} <span className="text-sm font-normal text-[hsla(var(--subtle-text)/1)]">per night</span>
          </div>
          <div className="flex items-center gap-3">
            {isSelected ? (
              <button
                onClick={() => {
                  onRemove(accommodation.id);
                  onClose();
                }}
                className="travel-button bg-[hsla(var(--destructive)/0.9)] hover:bg-[hsla(var(--destructive)/1)]"
              >
                Remove from Trip
              </button>
            ) : (
              <button
                onClick={() => {
                  onSelect(accommodation);
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
            src={accommodation.image || 'https://via.placeholder.com/800x400?text=Hotel'}
            alt={accommodation.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/800x400?text=Hotel';
            }}
          />
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-earth flex items-center gap-2">
                {accommodation.name}
                <span className="travel-pill text-sm">
                  {getAccommodationTypeIcon(accommodation.type)} {accommodation.type}
                </span>
              </h3>
              <p className="travel-subtle-text mt-1">{accommodation.location || accommodation.address}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-500">
                <span>★</span>
                <span className="text-earth font-semibold">{accommodation.rating || 'N/A'}</span>
              </div>
              {accommodation.reviews && (
                <p className="travel-subtle-text text-sm mt-1">{accommodation.reviews} reviews</p>
              )}
            </div>
          </div>

          {/* Description */}
          {accommodation.description && (
            <p className="travel-body-text leading-relaxed">{accommodation.description}</p>
          )}

          {/* Amenities */}
          {accommodation.amenities && accommodation.amenities.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-earth mb-3">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {accommodation.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="travel-pill bg-sunset-soft text-earth"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location Details */}
          {accommodation.coordinates && accommodation.coordinates.length === 2 && (
            <div>
              <h4 className="text-lg font-semibold text-earth mb-2">Location</h4>
              <p className="travel-body-text">
                Coordinates: {accommodation.coordinates[0]}, {accommodation.coordinates[1]}
              </p>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[hsla(var(--border)/1)]">
            <div>
              <p className="travel-subtle-text text-sm">Type</p>
              <p className="text-earth font-medium">{accommodation.type || 'Hotel'}</p>
            </div>
            <div>
              <p className="travel-subtle-text text-sm">Price Range</p>
              <p className="text-earth font-medium">
                {accommodation.price < 1000 ? 'Budget' : 
                 accommodation.price < 2500 ? 'Mid-range' : 'Luxury'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DetailModal>
  );
};

export default AccommodationDetailModal;

