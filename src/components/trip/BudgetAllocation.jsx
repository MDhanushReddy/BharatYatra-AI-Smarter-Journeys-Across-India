import React, { useState } from 'react';

const BudgetAllocation = ({ formData = {}, onUpdate }) => {
  // Predefined budget options for better UX
  const budgetOptions = [
    { value: 5000, label: '₹5k' },
    { value: 10000, label: '₹10k' },
    { value: 15000, label: '₹15k' },
    { value: 20000, label: '₹20k' },
    { value: 25000, label: '₹25k' },
    { value: 30000, label: '₹30k' },
    { value: 50000, label: '₹50k' },
    { value: 75000, label: '₹75k' },
    { value: 100000, label: '₹1L' }
  ];

  const [budget, setBudget] = useState({
    value: formData.budget || 15000,
    min: 5000,
    max: 100000,
    step: 5000
  });

  const [useCustomAllocation, setUseCustomAllocation] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState('');

  // Default category allocations
  const defaultAllocations = {
    accommodation: 35,
    food: 25,
    transportation: 15,
    activities: 15,
    shopping: 5,
    emergency: 5
  };

  const [allocations, setAllocations] = useState(defaultAllocations);
  const [customAllocations, setCustomAllocations] = useState(defaultAllocations);

  const formatCurrency = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
    return `₹${amount}`;
  };

  const handleBudgetChange = (newValue, event) => {
    if (event) {
      event.preventDefault();
    }

    try {
      const numericValue = typeof newValue === 'string' 
        ? (parseInt(newValue) || budget.min)
        : Number(newValue);
        
      const boundedValue = Math.min(Math.max(numericValue, budget.min), budget.max);
      
      setBudget(prev => ({
        ...prev,
        value: boundedValue
      }));

      if (onUpdate) {
        onUpdate({
          target: {
            name: 'budget',
            value: boundedValue
          },
          preventDefault: () => {}
        });
      }
    } catch (error) {
      setBudgetWarning('⚠️ Please enter a valid budget amount');
    }
  };

  const handleCustomAllocationChange = (category, value) => {
    const newValue = Math.min(Math.max(0, parseInt(value) || 0), 100);
    
    const currentTotal = Object.entries(customAllocations)
      .reduce((sum, [cat, val]) => cat === category ? sum : sum + val, 0);
    
    if (currentTotal + newValue > 100) {
      setBudgetWarning('⚠️ Total allocation cannot exceed 100%');
      return;
    }

    setCustomAllocations(prev => ({
      ...prev,
      [category]: newValue
    }));

    const newTotal = currentTotal + newValue;
    if (newTotal === 100) {
      setBudgetWarning('✅ Perfect! Your allocations total 100%');
    } else {
      setBudgetWarning(`ℹ️ Remaining to allocate: ${100 - newTotal}%`);
    }
  };

  const resetAllocations = () => {
    setCustomAllocations(defaultAllocations);
    setBudgetWarning('');
  };

  const getActiveAllocations = () => {
    return useCustomAllocation ? customAllocations : allocations;
  };

  const getBudgetSummary = () => {
    const isGroup = formData.travelGroup === 'group';
    const groupSize = parseInt(formData.groupSize) || 1;
    const totalBudget = budget.value;
    const perPersonBudget = isGroup ? Math.round(totalBudget / groupSize) : totalBudget;
    
    return {
      total: totalBudget,
      perPerson: perPersonBudget,
      isGroup,
      groupSize
    };
  };

  const summary = getBudgetSummary();

  return (
    <div className="space-y-6">
      {/* Budget Selection Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {summary.isGroup ? 'Group Budget Setup' : 'Travel Budget Setup'}
        </h3>
        
        <div className="space-y-6">
          {/* Quick Budget Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Total {summary.isGroup ? 'Group ' : ''}Budget
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {budgetOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => handleBudgetChange(option.value, e)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${budget.value === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Budget Input */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Or Enter Custom Amount:
            </label>
            <input
              type="number"
              value={budget.value}
              onChange={(e) => handleBudgetChange(e.target.value, e)}
              onSubmit={(e) => e.preventDefault()}
              className="w-32 p-2 text-right text-lg font-bold text-blue-600 border rounded-md"
              min={budget.min}
              max={budget.max}
              step={budget.step}
            />
            <span className="text-lg font-bold text-blue-600">
              {formatCurrency(budget.value)}
            </span>
          </div>

          {/* Budget Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-blue-50 rounded-lg p-4">
              <span className="text-sm text-gray-600">
                {summary.isGroup ? 'Total Group Budget' : 'Total Budget'}
              </span>
              <div className="text-xl font-bold text-blue-700">
                {formatCurrency(summary.total)}
              </div>
            </div>

            {summary.isGroup && (
              <div className="bg-green-50 rounded-lg p-4">
                <span className="text-sm text-gray-600">
                  Per Person ({summary.groupSize} travelers)
                </span>
                <div className="text-xl font-bold text-green-700">
                  {formatCurrency(summary.perPerson)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Breakdown Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {summary.isGroup ? 'Budget Breakdown (Per Person)' : 'Budget Breakdown'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              How your budget will be distributed across different categories
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useCustomAllocation}
                onChange={(e) => {
                  setUseCustomAllocation(e.target.checked);
                  if (!e.target.checked) resetAllocations();
                }}
                className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-300 focus:ring-blue-200"
              />
              <span className="text-sm text-gray-600">Customize</span>
            </label>
            {useCustomAllocation && (
              <button
                onClick={resetAllocations}
                className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
                type="button"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {budgetWarning && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            budgetWarning.startsWith('✅')
              ? 'bg-green-50 text-green-600'
              : budgetWarning.startsWith('⚠️')
                ? 'bg-red-50 text-red-600'
                : 'bg-blue-50 text-blue-600'
          }`}>
            {budgetWarning}
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(getActiveAllocations()).map(([category, percentage]) => {
            const categoryAmount = Math.round(summary.perPerson * (percentage / 100));
            
            return (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {category}
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(categoryAmount)}
                    </div>
                    {useCustomAllocation && (
                      <input
                        type="number"
                        value={percentage}
                        onChange={(e) => handleCustomAllocationChange(category, e.target.value)}
                        className="w-16 p-1 text-sm border rounded-md"
                        min="0"
                        max="100"
                      />
                    )}
                    <span className="w-12 text-sm text-gray-600">{percentage}%</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-grow bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        useCustomAllocation 
                          ? 'bg-blue-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetAllocation; 