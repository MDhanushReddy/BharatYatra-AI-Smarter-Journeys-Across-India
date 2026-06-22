import React, { useState, useEffect } from 'react';

const PremiumPricePill = ({ price, currency = '₹', isUpdating = false }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isUpdating) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isUpdating, price]);

  return (
    <div className={`price-pill ${isAnimating ? 'updating' : ''}`}>
      <span className="price-currency">{currency}</span>
      <span className="price-value">{price?.toLocaleString() || '0'}</span>
    </div>
  );
};

export default PremiumPricePill;

