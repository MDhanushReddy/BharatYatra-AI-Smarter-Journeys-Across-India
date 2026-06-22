import React, { useState, useEffect } from 'react';

const BudgetAllocation = ({ totalBudget, groupType, duration, preferences }) => {
  const [budgetBreakdown, setBudgetBreakdown] = useState({
    accommodation: 0,
    food: 0,
    transportation: 0,
    activities: 0,
    miscellaneous: 0
  });

  useEffect(() => {
    calculateBudgetBreakdown();
  }, [totalBudget, groupType, duration, preferences]);

  const calculateBudgetBreakdown = () => {
    if (!totalBudget || !duration) return;
    
    let perPersonBudget = totalBudget;
    
    // Adjust budget based on group type - this should be handled by groupSize if available
    if (groupType === 'group' || groupType === 'family') {
      // Assuming average group size of 4 if not specified
      perPersonBudget = totalBudget / 4;
    } else if (groupType === 'couple') {
      perPersonBudget = totalBudget / 2;
    }

    // Calculate daily budget
    const dailyBudget = perPersonBudget / duration;

    // Default allocation percentages
    let allocation = {
      accommodation: 0.35, // 35% for accommodation
      food: 0.25,         // 25% for food
      transportation: 0.20, // 20% for transportation
      activities: 0.15,    // 15% for activities
      miscellaneous: 0.05  // 5% for miscellaneous
    };

    // Adjust allocation based on preferences
    if (preferences.travelStyle === 'luxury') {
      allocation.accommodation = 0.45;
      allocation.food = 0.30;
      allocation.transportation = 0.15;
      allocation.activities = 0.08;
      allocation.miscellaneous = 0.02;
    } else if (preferences.travelStyle === 'budget') {
      allocation.accommodation = 0.30;
      allocation.food = 0.20;
      allocation.transportation = 0.25;
      allocation.activities = 0.20;
      allocation.miscellaneous = 0.05;
    }

    setBudgetBreakdown({
      accommodation: Math.round(totalBudget * allocation.accommodation),
      food: Math.round(totalBudget * allocation.food),
      transportation: Math.round(totalBudget * allocation.transportation),
      activities: Math.round(totalBudget * allocation.activities),
      miscellaneous: Math.round(totalBudget * allocation.miscellaneous)
    });
  };

  const palette = {
    accommodation: 'rgb(27, 58, 87)',        // Deep Ocean Blue - Primary
    food: 'rgb(255, 107, 107)',               // Soft Coral - Accent
    transportation: 'rgb(16, 185, 129)',     // Emerald - Success
    activities: 'rgb(59, 130, 246)',          // Bright Blue
    miscellaneous: 'rgb(107, 114, 128)',      // Medium Gray
  };

  const tips = [
    'Consider booking accommodations in advance for better rates.',
    'Look for local food experiences to savor authentic cuisine and manage costs.',
    'Use public transportation or shared rides whenever possible.',
  ];

  return (
    <div className="travel-section space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-semibold text-primary">Budget Breakdown</h2>
        <span className="travel-pill text-sm">
          Total Budget • ₹{totalBudget?.toLocaleString() || 0}
        </span>
      </div>

      <div className="space-y-5">
        {Object.entries(budgetBreakdown).map(([category, amount]) => {
          const width = totalBudget ? (amount / totalBudget) * 100 : 0;
          return (
            <div key={category} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="travel-body-text capitalize">{category}</span>
                <span className="text-primary font-semibold">₹{amount.toLocaleString()}</span>
              </div>
              <div className="travel-progress-track">
                <div
                  className="travel-progress-fill"
                  style={{
                    width: `${Math.min(width, 100)}%`,
                    background: palette[category] || palette.miscellaneous,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-earth">Budget Tips</h3>
        <div className="space-y-3">
          {tips.map((tip, index) => (
            <div key={tip} className="travel-tip-card">
              <span className="travel-tip-icon">{index + 1}</span>
              <p className="travel-body-text">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BudgetAllocation; 