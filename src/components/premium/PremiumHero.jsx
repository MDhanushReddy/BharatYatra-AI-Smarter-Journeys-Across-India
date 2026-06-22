import React from 'react';

const PremiumHero = ({ title, subtitle, imageUrl }) => {
  return (
    <section className="premium-hero">
      <div className="premium-hero-content">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </section>
  );
};

export default PremiumHero;

