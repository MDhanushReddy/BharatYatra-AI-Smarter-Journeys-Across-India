import React from 'react';

const LoadingState = ({ message = 'Loading...', fullScreen = false }) => {
  const containerClass = fullScreen 
    ? 'min-h-screen flex items-center justify-center p-4'
    : 'py-12 flex items-center justify-center p-4';

  return (
    <div className={containerClass}>
      <div className="text-center space-y-4">
        <div className="spinner soft-shadow mx-auto"></div>
        {message && (
          <p className="travel-body-text text-earth">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingState;

