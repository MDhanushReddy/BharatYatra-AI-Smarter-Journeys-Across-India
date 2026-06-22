/**
 * Request Validation Utilities
 * Provides helpers for validating request data
 */

/**
 * Validate request body exists and is not empty
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} True if valid, false otherwise
 */
export const validateRequestBody = (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body is required',
        details: { errors: ['Request body cannot be empty'] }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
    return false;
  }
  return true;
};

/**
 * Validate required fields in request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {boolean} True if all required fields present, false otherwise
 */
export const validateRequiredFields = (req, res, requiredFields) => {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        details: {
          errors: missingFields.map(field => `${field} is required`),
          missingFields: missingFields
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
    return false;
  }
  
  return true;
};

/**
 * Validate required query parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Array<string>} requiredParams - Array of required parameter names
 * @returns {boolean} True if all required params present, false otherwise
 */
export const validateRequiredQueryParams = (req, res, requiredParams) => {
  const missingParams = [];
  
  for (const param of requiredParams) {
    if (req.query[param] === undefined || req.query[param] === null || req.query[param] === '') {
      missingParams.push(param);
    }
  }
  
  if (missingParams.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required query parameters',
        details: {
          errors: missingParams.map(param => `${param} query parameter is required`),
          missingParams: missingParams
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
    return false;
  }
  
  return true;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} True if valid date format
 */
export const isValidDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

/**
 * Validate date range (end date after start date)
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {boolean} True if valid date range
 */
export const isValidDateRange = (startDate, endDate) => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return end >= start;
};

/**
 * Validate numeric value
 * @param {*} value - Value to validate
 * @param {number} min - Minimum value (optional)
 * @param {number} max - Maximum value (optional)
 * @returns {boolean} True if valid number
 */
export const isValidNumber = (value, min = null, max = null) => {
  const num = Number(value);
  if (isNaN(num)) return false;
  
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  
  return true;
};

