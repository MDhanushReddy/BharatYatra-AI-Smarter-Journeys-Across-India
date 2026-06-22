import React from 'react';

const EmptyState = ({ 
  icon = '📋', 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = '' 
}) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="text-6xl mb-4">{icon}</div>
      {title && (
        <h3 className="text-xl font-semibold text-earth mb-2">{title}</h3>
      )}
      {description && (
        <p className="travel-subtle-text max-w-md mx-auto mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="travel-button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

