import React, { useState } from 'react';

const PremiumSearchBar = ({ onSearch, aiSuggestions = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="premium-search-container">
      <div className="premium-search-bar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="premium-search-input"
          placeholder="Search destinations, attractions, or ask AI..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSearch(searchQuery)}
        />
        <button className="micro-btn" onClick={() => onSearch(searchQuery)}>
          Search
        </button>
      </div>
      {aiSuggestions.length > 0 && (
        <div className="premium-ai-suggestions">
          {aiSuggestions.map((suggestion, index) => (
            <button
              key={index}
              className="ai-chip"
              onClick={() => {
                setSearchQuery(suggestion);
                onSearch(suggestion);
              }}
            >
              <span>✨</span>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PremiumSearchBar;

