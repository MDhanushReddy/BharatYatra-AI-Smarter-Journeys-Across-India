import logger from './logger.js';
import crypto from 'crypto';

/**
 * Environment Variable Validation
 * Validates required and optional environment variables on startup
 */

const requiredVars = [
  {
    name: 'JWT_SECRET',
    description: 'JWT secret for token signing',
    validate: (value) => {
      // In development, allow a default value but warn
      if (!value || value === 'your_super_secret_jwt_key_here_change_this_in_production') {
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
          // Generate a default dev secret if not set
          const defaultSecret = crypto.randomBytes(32).toString('hex');
          process.env.JWT_SECRET = defaultSecret;
          return { valid: true, message: 'Using auto-generated JWT_SECRET for development' };
        }
        return { valid: false, message: 'JWT_SECRET must be changed from default value' };
      }
      if (value.length < 32) {
        return { valid: false, message: 'JWT_SECRET should be at least 32 characters long' };
      }
      return { valid: true };
    }
  }
];

const optionalVars = [
  {
    name: 'MONGO_URI',
    description: 'MongoDB connection string',
    validate: (value) => {
      if (!value) {
        return { valid: true, message: 'Using in-memory database (not recommended for production)' };
      }
      if (!value.startsWith('mongodb://') && !value.startsWith('mongodb+srv://')) {
        return { valid: false, message: 'Invalid MongoDB URI format' };
      }
      return { valid: true };
    }
  },
  {
    name: 'PORT',
    description: 'Server port',
    validate: (value) => {
      const port = parseInt(value);
      if (isNaN(port) || port < 1 || port > 65535) {
        return { valid: false, message: 'PORT must be a number between 1 and 65535' };
      }
      return { valid: true };
    },
    default: '5000'
  },
  {
    name: 'NODE_ENV',
    description: 'Node environment',
    validate: (value) => {
      const validEnvs = ['development', 'production', 'test'];
      if (value && !validEnvs.includes(value)) {
        return { valid: false, message: `NODE_ENV must be one of: ${validEnvs.join(', ')}` };
      }
      return { valid: true };
    },
    default: 'development'
  },
  {
    name: 'FRONTEND_URL',
    description: 'Frontend URL for CORS',
    validate: (value) => {
      if (!value && process.env.NODE_ENV === 'production') {
        return { valid: false, message: 'FRONTEND_URL is required in production' };
      }
      if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
        return { valid: false, message: 'FRONTEND_URL must be a valid URL' };
      }
      return { valid: true };
    }
  },
  {
    name: 'LOG_LEVEL',
    description: 'Logging level',
    validate: (value) => {
      const validLevels = ['error', 'warn', 'info', 'debug'];
      if (value && !validLevels.includes(value)) {
        return { valid: false, message: `LOG_LEVEL must be one of: ${validLevels.join(', ')}` };
      }
      return { valid: true };
    },
    default: 'info'
  }
];

/**
 * Validates all environment variables
 */
export const validateEnvironment = () => {
  const errors = [];
  const warnings = [];

  // Validate required variables
  requiredVars.forEach(({ name, description, validate }) => {
    const value = process.env[name];
    const result = validate(value);
    
    if (!result.valid) {
      errors.push({
        variable: name,
        description,
        message: result.message
      });
    }
  });

  // Validate optional variables
  optionalVars.forEach(({ name, description, validate, default: defaultValue }) => {
    const value = process.env[name] || defaultValue;
    const result = validate(value);
    
    if (!result.valid) {
      warnings.push({
        variable: name,
        description,
        message: result.message
      });
    } else if (result.message && !value && defaultValue) {
      // Set default value if not provided
      process.env[name] = defaultValue;
      logger.info(`Using default value for ${name}: ${defaultValue}`);
    }
  });

  // Log results
  if (errors.length > 0) {
    logger.error('Environment validation failed', { errors });
    console.error('\n❌ Environment Validation Errors:');
    errors.forEach(({ variable, message }) => {
      console.error(`   ${variable}: ${message}`);
    });
    console.error('');
  }

  if (warnings.length > 0) {
    logger.warn('Environment validation warnings', { warnings });
    console.warn('\n⚠️  Environment Validation Warnings:');
    warnings.forEach(({ variable, message }) => {
      console.warn(`   ${variable}: ${message}`);
    });
    console.warn('');
  }

  if (errors.length === 0 && warnings.length === 0) {
    logger.info('Environment validation passed');
    console.log('✅ Environment variables validated successfully\n');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates a specific environment variable
 */
export const validateEnvVar = (name, value, rules) => {
  if (rules.required && !value) {
    return { valid: false, message: `${name} is required` };
  }

  if (rules.type === 'number') {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, message: `${name} must be a number` };
    }
    if (rules.min !== undefined && num < rules.min) {
      return { valid: false, message: `${name} must be at least ${rules.min}` };
    }
    if (rules.max !== undefined && num > rules.max) {
      return { valid: false, message: `${name} must be at most ${rules.max}` };
    }
  }

  if (rules.type === 'url' && value) {
    try {
      new URL(value);
    } catch {
      return { valid: false, message: `${name} must be a valid URL` };
    }
  }

  if (rules.enum && !rules.enum.includes(value)) {
    return { valid: false, message: `${name} must be one of: ${rules.enum.join(', ')}` };
  }

  return { valid: true };
};

