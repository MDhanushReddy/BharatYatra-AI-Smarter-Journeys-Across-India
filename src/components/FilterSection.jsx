import React from 'react';

const FilterSection = ({ filters, onFilterChange, totalBudget }) => {
  const categories = [
    'Culture & History',
    'Nature & Outdoors',
    'Food & Cuisine',
    'Shopping',
    'Adventure Sports',
    'Arts & Museums',
    'Nightlife',
    'Relaxation'
  ];

  const durations = [
    { label: 'Any duration', value: null },
    { label: '1-2 hours', value: 2 },
    { label: '2-4 hours', value: 4 },
    { label: '4-6 hours', value: 6 },
    { label: '6+ hours', value: 8 }
  ];

  const handlePriceChange = (e) => {
    const value = parseInt(e.target.value);
    onFilterChange({ maxPrice: value });
  };

  const handleCategoryChange = (category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFilterChange({ categories: newCategories });
  };

  const handleDurationChange = (e) => {
    const value = e.target.value === 'null' ? null : parseInt(e.target.value);
    onFilterChange({ maxDuration: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        
        {/* Price Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Price (₹)
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={totalBudget * 0.4}
              step={100}
              value={filters.maxPrice}
              onChange={handlePriceChange}
              className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>₹0</span>
              <span>₹{filters.maxPrice}</span>
              <span>₹{Math.round(totalBudget * 0.4)}</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.categories.includes(category)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <select
            value={filters.maxDuration || 'null'}
            onChange={handleDurationChange}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {durations.map(({ label, value }) => (
              <option key={label} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reset Filters */}
      <button
        onClick={() => onFilterChange({
          maxPrice: totalBudget * 0.4,
          categories: [],
          maxDuration: null
        })}
        className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default FilterSection; 