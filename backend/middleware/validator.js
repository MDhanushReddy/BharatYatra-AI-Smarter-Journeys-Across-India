/**
 * Input Validation and Sanitization Middleware
 */

/**
 * Validates email format
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }

  return { valid: true, message: 'Password is valid' };
};

/**
 * Sanitizes string input
 */
export const sanitizeString = (str, maxLength = 1000) => {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

/**
 * Validates date format (YYYY-MM-DD)
 */
export const validateDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validates that end date is after start date
 */
export const validateDateRange = (startDate, endDate) => {
  if (!validateDate(startDate) || !validateDate(endDate)) {
    return { valid: false, message: 'Invalid date format' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (start < now) {
    return { valid: false, message: 'Start date cannot be in the past' };
  }

  if (end <= start) {
    return { valid: false, message: 'End date must be after start date' };
  }

  // Limit to 1 year in the future
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  if (end > maxDate) {
    return { valid: false, message: 'Trip cannot be more than 1 year in the future' };
  }

  return { valid: true };
};

/**
 * Validates budget amount
 */
export const validateBudget = (budget) => {
  const num = Number(budget);
  if (isNaN(num) || num < 1000 || num > 10000000) {
    return { valid: false, message: 'Budget must be between ₹1,000 and ₹10,000,000' };
  }
  return { valid: true };
};

/**
 * Validates group size
 */
export const validateGroupSize = (size) => {
  const num = Number(size);
  if (isNaN(num) || num < 1 || num > 50) {
    return { valid: false, message: 'Group size must be between 1 and 50' };
  }
  return { valid: true };
};

/**
 * Middleware to validate registration input
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Validate email
  if (!validateEmail(email)) {
    errors.push('Invalid email format');
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.push(passwordValidation.message);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      messages: errors
    });
  }

  // Sanitize inputs
  req.body.name = sanitizeString(name, 100);
  req.body.email = email.trim().toLowerCase();

  next();
};

/**
 * Middleware to validate login input
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !validateEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password || typeof password !== 'string' || password.length < 1) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      messages: errors
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Middleware to validate trip details
 */
export const validateTripDetails = (req, res, next) => {
  const { destination, startDate, endDate, budget, groupSize } = req.body;
  const errors = [];

  if (!destination || typeof destination !== 'string' || destination.trim().length < 2) {
    errors.push('Destination is required and must be at least 2 characters');
  }

  const dateRangeValidation = validateDateRange(startDate, endDate);
  if (!dateRangeValidation.valid) {
    errors.push(dateRangeValidation.message);
  }

  const budgetValidation = validateBudget(budget);
  if (!budgetValidation.valid) {
    errors.push(budgetValidation.message);
  }

  const groupSizeValidation = validateGroupSize(groupSize);
  if (!groupSizeValidation.valid) {
    errors.push(groupSizeValidation.message);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      messages: errors
    });
  }

  // Sanitize inputs
  req.body.destination = sanitizeString(destination, 200);
  req.body.startDate = startDate.trim();
  req.body.endDate = endDate.trim();

  next();
};

