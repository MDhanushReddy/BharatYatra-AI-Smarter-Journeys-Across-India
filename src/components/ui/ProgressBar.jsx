import React from 'react';

const ProgressBar = ({ progress, label, showPercentage = true }) => {
  const percentage = Math.min(100, Math.max(0, progress));
  
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-secondary">{label}</span>
          {showPercentage && (
            <span className="text-sm text-muted">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

