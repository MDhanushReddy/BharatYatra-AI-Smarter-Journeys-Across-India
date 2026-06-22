/**
 * Standardized API Response Helper
 * Ensures consistent response format across all endpoints
 */

/**
 * Send success response with standardized format
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {Object} meta - Metadata (source, count, timestamp, etc.)
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, data, meta = {}, statusCode = 200) => {
  const response = {
    success: true,
    data: data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
  
  res.status(statusCode).json(response);
};

/**
 * Send error response with standardized format
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {*} details - Additional error details
 * @param {number} statusCode - HTTP status code (default: 500)
 */
export const sendError = (res, message, code = 'UNKNOWN_ERROR', details = null, statusCode = 500) => {
  const response = {
    success: false,
    error: {
      code: code,
      message: message,
      ...(details && { details: details })
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };
  
  res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array|string} errors - Validation errors
 * @param {number} statusCode - HTTP status code (default: 400)
 */
export const sendValidationError = (res, errors, statusCode = 400) => {
  const errorArray = Array.isArray(errors) ? errors : [errors];
  return sendError(res, 'Validation failed', 'VALIDATION_ERROR', { errors: errorArray }, statusCode);
};

/**
 * Send not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name (e.g., 'User', 'Itinerary')
 */
export const sendNotFound = (res, resource = 'Resource') => {
  sendError(
    res,
    `${resource} not found`,
    'NOT_FOUND',
    null,
    404
  );
};

/**
 * Send unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message (optional)
 */
export const sendUnauthorized = (res, message = 'Unauthorized access') => {
  sendError(
    res,
    message,
    'UNAUTHORIZED',
    null,
    401
  );
};

/**
 * Format response data with metadata
 * @param {*} data - Response data
 * @param {string} source - Data source (e.g., 'google_places', 'rapidapi')
 * @param {number} count - Number of items
 * @returns {Object} Formatted response
 */
export const formatResponse = (data, source = 'api', count = null) => {
  return {
    data: data,
    source: source,
    count: count !== null ? count : (Array.isArray(data) ? data.length : 1),
    timestamp: new Date().toISOString()
  };
};

