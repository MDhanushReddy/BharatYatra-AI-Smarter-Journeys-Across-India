import React from 'react';

const PremiumDestinationCard = ({ destination, onClick }) => {
  return (
    <article className="premium-destination-card elevate stagger-item" onClick={onClick}>
      <img
        src={destination.imageUrl || `https://via.placeholder.com/400x240/0F4C4C/F4E8D6?text=${encodeURIComponent(destination.name)}`}
        alt={destination.name}
        className="destination-image"
        loading="lazy"
      />
      <div className="destination-content">
        <h3 className="destination-title">{destination.name}</h3>
        <div className="destination-location">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{destination.location}</span>
        </div>
        <div className="destination-meta">
          <div className="destination-rating">
            <span>⭐</span>
            <span>{destination.rating || '4.5'}</span>
          </div>
          <div className="destination-price">
            {destination.price ? `₹${destination.price}` : 'Free'}
          </div>
        </div>
      </div>
    </article>
  );
};

export default PremiumDestinationCard;

