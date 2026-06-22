import React, { useState, useEffect } from 'react';
import { useTripPlanning } from '../../context/TripPlanningContext';

const GroupBudgetSplitter = () => {
  const { tripDetails, setTripDetails } = useTripPlanning();
  const [groupType, setGroupType] = useState(tripDetails.groupType || 'couple');
  const [groupSize, setGroupSize] = useState(tripDetails.groupSize || 2);
  const [totalBudget, setTotalBudget] = useState(parseInt(tripDetails.budget) || 10000);
  const [budgetBreakdown, setBudgetBreakdown] = useState(null);

  useEffect(() => {
    if (groupSize > 1 && totalBudget > 0) {
      calculateBudgetSplit();
    }
  }, [groupSize, totalBudget, groupType]);

  const calculateBudgetSplit = () => {
    const perPersonBudget = totalBudget / groupSize;
    
    // Different allocation strategies based on group type
    let allocation = {};
    
    if (groupType === 'couple') {
      // Couples might share accommodation and some activities
      allocation = {
        accommodation: Math.round(perPersonBudget * 0.35), // Shared room
        food: Math.round(perPersonBudget * 0.3),
        transport: Math.round(perPersonBudget * 0.2),
        activities: Math.round(perPersonBudget * 0.1),
        miscellaneous: Math.round(perPersonBudget * 0.05)
      };
    } else if (groupType === 'family') {
      // Families might have different needs (kids activities, family rooms)
      allocation = {
        accommodation: Math.round(perPersonBudget * 0.4), // Family rooms
        food: Math.round(perPersonBudget * 0.25), // Kids eat less
        transport: Math.round(perPersonBudget * 0.2),
        activities: Math.round(perPersonBudget * 0.1), // Family-friendly activities
        miscellaneous: Math.round(perPersonBudget * 0.05)
      };
    } else if (groupType === 'friends') {
      // Friends might want to split everything equally
      allocation = {
        accommodation: Math.round(perPersonBudget * 0.4),
        food: Math.round(perPersonBudget * 0.3),
        transport: Math.round(perPersonBudget * 0.15),
        activities: Math.round(perPersonBudget * 0.1),
        miscellaneous: Math.round(perPersonBudget * 0.05)
      };
    } else {
      // Solo traveler
      allocation = {
        accommodation: Math.round(perPersonBudget * 0.45),
        food: Math.round(perPersonBudget * 0.25),
        transport: Math.round(perPersonBudget * 0.2),
        activities: Math.round(perPersonBudget * 0.05),
        miscellaneous: Math.round(perPersonBudget * 0.05)
      };
    }

    setBudgetBreakdown({
      perPerson: perPersonBudget,
      total: totalBudget,
      allocation,
      groupType,
      groupSize
    });

    // Update context
    setTripDetails(prev => ({
      ...prev,
      groupType,
      groupSize,
      budget: totalBudget,
      budgetBreakdown: allocation
    }));
  };

  const handleGroupTypeChange = (type) => {
    setGroupType(type);
    if (type === 'solo') {
      setGroupSize(1);
    } else if (type === 'couple') {
      setGroupSize(2);
    }
  };

  const handleGroupSizeChange = (size) => {
    const newSize = Math.max(1, parseInt(size) || 1);
    setGroupSize(newSize);
    
    // Auto-adjust group type based on size
    if (newSize === 1) {
      setGroupType('solo');
    } else if (newSize === 2) {
      setGroupType('couple');
    } else if (newSize >= 3) {
      setGroupType('friends');
    }
  };

  const getGroupTypeDescription = (type) => {
    const descriptions = {
      solo: "Traveling alone - full budget for personal use",
      couple: "Couple traveling - shared accommodation and some activities",
      family: "Family trip - family rooms and kid-friendly activities",
      friends: "Friends group - equal budget split for all members"
    };
    return descriptions[type] || descriptions.solo;
  };

  const getGroupTypeIcon = (type) => {
    const icons = {
      solo: "🧳",
      couple: "👫",
      family: "👨‍👩‍👧‍👦",
      friends: "👥"
    };
    return icons[type] || icons.solo;
  };

  return (
    <div className="travel-section space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-xl font-semibold text-earth">
          Group & Budget Configuration
        </h3>
        <span className="travel-pill text-sm">
          Current Budget • ₹{totalBudget.toLocaleString()}
        </span>
      </div>

      {/* Group Type Selection */}
      <div className="space-y-3">
        <label className="travel-label">Travel Group Type</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['solo', 'couple', 'family', 'friends'].map((type) => (
            <button
              key={type}
              onClick={() => handleGroupTypeChange(type)}
              className={`travel-option ${groupType === type ? 'travel-option-active' : ''}`}
            >
              <div className="text-2xl mb-1">{getGroupTypeIcon(type)}</div>
              <div className="text-sm font-medium capitalize">{type}</div>
            </button>
          ))}
        </div>
        <p className="text-xs travel-subtle-text">
          {getGroupTypeDescription(groupType)}
        </p>
      </div>

      {/* Group Size Input */}
      {groupType !== 'solo' && (
        <div className="space-y-3">
          <label className="travel-label">Number of people</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleGroupSizeChange(groupSize - 1)}
              disabled={groupSize <= 1}
              className="travel-pill w-10 h-10 flex items-center justify-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              −
            </button>
            <input
              type="number"
              value={groupSize}
              onChange={(e) => handleGroupSizeChange(e.target.value)}
              min="1"
              max="20"
              className="travel-input w-24 text-center py-3"
            />
            <button
              onClick={() => handleGroupSizeChange(groupSize + 1)}
              disabled={groupSize >= 20}
              className="travel-pill w-10 h-10 flex items-center justify-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Total Budget Input */}
      <div className="space-y-3">
        <label className="travel-label">Total Trip Budget (₹)</label>
        <input
          type="number"
          value={totalBudget}
          onChange={(e) => setTotalBudget(parseInt(e.target.value, 10) || 0)}
          min="1000"
          step="500"
          className="travel-input w-full px-4 py-3"
        />
      </div>

      {/* Budget Breakdown Display */}
      {budgetBreakdown && groupSize > 1 && (
        <div className="glass-card p-6 space-y-5">
          <h4 className="text-lg font-semibold text-earth">
            Budget split for {groupSize} companions
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="travel-section py-4">
              <div className="text-sm travel-subtle-text">Total budget</div>
              <div className="text-xl font-semibold text-earth">₹{budgetBreakdown.total.toLocaleString()}</div>
            </div>
            <div className="travel-section py-4">
              <div className="text-sm travel-subtle-text">Per traveler</div>
              <div className="text-xl font-semibold text-earth">₹{budgetBreakdown.perPerson.toLocaleString()}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-earth">Per traveler allocation</h5>
            {Object.entries(budgetBreakdown.allocation).map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center travel-body-text py-2 border-b border-[hsla(var(--border)/0.6)] last:border-b-0">
                <span className="capitalize">{category}</span>
                <span className="font-semibold text-earth">₹{amount.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="travel-note">
            <strong>Note:</strong> Treat this as a friendly guide. Adjust any slice to match your travel personality or on-the-go discoveries.
          </div>
        </div>
      )}

      {/* Solo Traveler Info */}
      {groupType === 'solo' && (
        <div className="travel-note flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧳</span>
            <h4 className="text-lg font-semibold text-earth">Solo Traveler Bliss</h4>
          </div>
          <p className="travel-body-text">
            You have the full budget of ₹{totalBudget.toLocaleString()} to craft a trip that feels
            entirely yours—splurge on a boutique stay or add an extra experience that caught your eye.
          </p>
        </div>
      )}
    </div>
  );
};

export default GroupBudgetSplitter;
