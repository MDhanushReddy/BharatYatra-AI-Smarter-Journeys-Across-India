import React from 'react';

const BudgetAllocation = ({ budget, totalBudget }) => {
  const getColorForCategory = (category) => {
    const colors = {
      accommodation: 'bg-blue-500',
      transportation: 'bg-green-500',
      food: 'bg-yellow-500',
      activities: 'bg-purple-500',
      shopping: 'bg-pink-500',
      miscellaneous: 'bg-gray-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-6 text-gray-800">Budget Allocation</h3>
      <div className="space-y-4">
        {Object.entries(budget).map(([category, amount]) => (
          <div key={category} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getColorForCategory(category)}`}></div>
                <span className="capitalize text-gray-700">{category}</span>
              </div>
              <span className="font-semibold text-gray-800">{formatCurrency(amount)}</span>
            </div>
            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full ${getColorForCategory(category)} transition-all duration-300`}
                style={{ width: `${(amount / totalBudget) * 100}%` }}
              ></div>
            </div>
            <div className="text-right text-sm text-gray-500">
              {Math.round((amount / totalBudget) * 100)}% of total
            </div>
          </div>
        ))}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-700">Total Budget</span>
            <span className="font-bold text-gray-800">{formatCurrency(totalBudget)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetAllocation; 