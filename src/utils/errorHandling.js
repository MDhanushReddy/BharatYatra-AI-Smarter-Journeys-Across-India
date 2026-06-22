// Type checking utilities
export const isValidString = (value) => typeof value === 'string' && value.trim().length > 0;
export const isValidNumber = (value) => !isNaN(value) && isFinite(value);
export const isValidDate = (value) => value instanceof Date && !isNaN(value);
export const isValidArray = (value) => Array.isArray(value);
export const isValidObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

// Data validation
export const validateTripDetails = (tripDetails) => {
  const errors = {};

  if (!isValidString(tripDetails.destination)) {
    errors.destination = 'Please select a valid destination';
  }

  if (!tripDetails.startDate) {
    errors.startDate = 'Please select a start date';
  }

  if (!tripDetails.endDate) {
    errors.endDate = 'Please select an end date';
  }

  if (tripDetails.startDate && tripDetails.endDate) {
    const start = new Date(tripDetails.startDate);
    const end = new Date(tripDetails.endDate);
    if (end < start) {
      errors.endDate = 'End date must be after start date';
    }
  }

  if (!isValidNumber(tripDetails.budget) || parseInt(tripDetails.budget) < 5000) {
    errors.budget = 'Budget must be at least ₹5,000';
  }

  if (!isValidString(tripDetails.travelType)) {
    errors.travelType = 'Please select a travel type';
  }

  if (!isValidString(tripDetails.groupType)) {
    errors.groupType = 'Please select a group type';
  }

  // Enhanced group size validation
  if (tripDetails.travelGroup === 'group') {
    const groupSize = parseInt(tripDetails.groupSize);
    if (!isValidNumber(groupSize)) {
      errors.groupSize = 'Please enter a valid group size';
    } else if (groupSize < 2) {
      errors.groupSize = 'Group size must be at least 2 people';
    } else if (groupSize > 20) {
      errors.groupSize = 'Group size cannot exceed 20 people';
    }

    // Validate minimum per-person budget
    const perPersonBudget = parseInt(tripDetails.budget) / groupSize;
    if (perPersonBudget < 5000) {
      errors.budget = `Total budget must be at least ₹${(5000 * groupSize).toLocaleString()} for ${groupSize} people (₹5,000 per person minimum)`;
    }
  }

  if (!isValidArray(tripDetails.interests) || tripDetails.interests.length === 0) {
    errors.interests = 'Please select at least one interest';
  }

  if (!isValidObject(tripDetails.preferences)) {
    errors.preferences = 'Invalid preferences format';
  } else {
    if (!isValidString(tripDetails.preferences.accommodation)) {
      errors.preferences = { ...errors.preferences, accommodation: 'Please select accommodation type' };
    }
    if (!isValidString(tripDetails.preferences.travelStyle)) {
      errors.preferences = { ...errors.preferences, travelStyle: 'Please select travel style' };
    }
    if (!isValidString(tripDetails.preferences.foodPreference)) {
      errors.preferences = { ...errors.preferences, foodPreference: 'Please select food preference' };
    }
  }

  return errors;
};

// Error handling for async operations
export const handleAsyncError = async (asyncFn) => {
  try {
    return await asyncFn();
  } catch (error) {
    console.error('Error in async operation:', error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
};

// Data sanitization
export const sanitizeTripDetails = (tripDetails) => {
  return {
    ...tripDetails,
    destination: tripDetails.destination?.trim().toLowerCase(),
    budget: parseInt(tripDetails.budget),
    groupSize: parseInt(tripDetails.groupSize),
    interests: tripDetails.interests?.filter(interest => isValidString(interest)) || [],
    preferences: {
      accommodation: tripDetails.preferences?.accommodation?.trim().toLowerCase(),
      travelStyle: tripDetails.preferences?.travelStyle?.trim().toLowerCase(),
      foodPreference: tripDetails.preferences?.foodPreference?.trim().toLowerCase()
    }
  };
};

// Safe data access
export const safelyAccessNestedObject = (obj, path, defaultValue = null) => {
  try {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) ?? defaultValue;
  } catch (error) {
    console.error('Error accessing nested object:', error);
    return defaultValue;
  }
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_INPUT: 'Please check your input and try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please fix the validation errors and try again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.'
}; 