import logger from './logger.js';

/**
 * Validates API keys on server startup
 * Logs warnings for missing optional keys, errors for required keys
 */
export const validateAPIKeys = () => {
  const warnings = [];
  const errors = [];

  // Required API keys
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_super_secret_jwt_key_here_change_this_in_production') {
    errors.push('JWT_SECRET is required and must be changed from default value');
  }

  // Optional but recommended API keys
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!googleKey || googleKey.includes('your_google')) {
    warnings.push('GOOGLE_MAPS_API_KEY not configured - Maps, Places, Geocoding, Directions, and Route services will use fallback data');
  }

  // Log errors
  if (errors.length > 0) {
    logger.error('API Key Validation Failed', { errors });
    console.error('\n❌ CRITICAL: Missing required API keys:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\n⚠️  Server will start but authentication may not work properly.\n');
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('API Key Validation Warnings', { warnings });
    console.warn('\n⚠️  API Key Warnings (application will work with fallback data):');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
    console.warn('');
  }

  // Success message if all required keys are present
  if (errors.length === 0 && warnings.length === 0) {
    logger.info('All API keys validated successfully');
    console.log('✅ All API keys are properly configured\n');
  } else if (errors.length === 0) {
    logger.info('Required API keys validated, some optional keys missing');
    console.log('✅ Required API keys are configured (some optional keys missing)\n');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates a specific API key
 */
export const validateSpecificKey = (keyName, keyValue, isRequired = false) => {
  const isPlaceholder = keyValue && (
    keyValue.includes('your_') ||
    keyValue.includes('change_this') ||
    keyValue.trim() === ''
  );

  if (!keyValue || isPlaceholder) {
    if (isRequired) {
      return { valid: false, message: `${keyName} is required` };
    }
    return { valid: true, message: `${keyName} is optional (using fallback)` };
  }

  return { valid: true, message: `${keyName} is configured` };
};

