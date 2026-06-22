export const calculateBudgetSplit = ({ totalBudget, durationDays, preferences }) => {
  if (!totalBudget || !durationDays) {
    return {
      accommodation: 0,
      food: 0,
      transportation: 0,
      activities: 0,
      miscellaneous: 0
    };
  }

  const style = preferences?.travelStyle || 'relaxed';

  let allocation = {
    accommodation: 0.35,
    food: 0.25,
    transportation: 0.20,
    activities: 0.15,
    miscellaneous: 0.05
  };

  if (style === 'luxury') {
    allocation = { accommodation: 0.45, food: 0.30, transportation: 0.15, activities: 0.08, miscellaneous: 0.02 };
  } else if (style === 'budget') {
    allocation = { accommodation: 0.30, food: 0.20, transportation: 0.25, activities: 0.20, miscellaneous: 0.05 };
  }

  const breakdown = {
    accommodation: Math.round(totalBudget * allocation.accommodation),
    food: Math.round(totalBudget * allocation.food),
    transportation: Math.round(totalBudget * allocation.transportation),
    activities: Math.round(totalBudget * allocation.activities),
    miscellaneous: Math.round(totalBudget * allocation.miscellaneous)
  };

  const nightlyAccommodationCap = Math.floor(breakdown.accommodation / durationDays);

  return { ...breakdown, nightlyAccommodationCap };
};
