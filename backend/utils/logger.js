// Enhanced Logging Service - Step 18 Implementation
// Uses Winston-like structured logging for backend and AI services

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    this.errorFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta,
      pid: process.pid,
      env: process.env.NODE_ENV || 'development'
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(filePath, message) {
    try {
      fs.appendFileSync(filePath, message + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  log(level, message, meta = {}) {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex <= currentLevelIndex) {
      const formattedMessage = this.formatMessage(level, message, meta);
      
      // Console output
      if (level === 'error') {
        console.error(`[${level.toUpperCase()}] ${message}`, meta);
      } else if (level === 'warn') {
        console.warn(`[${level.toUpperCase()}] ${message}`, meta);
      } else {
        console.log(`[${level.toUpperCase()}] ${message}`, meta);
      }

      // File output
      this.writeToFile(this.logFile, formattedMessage);
      
      if (level === 'error') {
        this.writeToFile(this.errorFile, formattedMessage);
      }
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // API request logging
  logRequest(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };
    this.info(`${req.method} ${req.url}`, meta);
  }

  // API error logging
  logError(err, req = null) {
    const meta = {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name
      }
    };

    if (req) {
      meta.request = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
      };
    }

    this.error('API Error', meta);
  }

  // Performance logging
  logPerformance(operation, duration, meta = {}) {
    this.info(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...meta
    });
  }

  // Database logging
  logDatabase(operation, collection, duration, meta = {}) {
    this.debug(`Database: ${operation}`, {
      collection,
      duration: `${duration}ms`,
      ...meta
    });
  }

  // AI service logging
  logAI(service, operation, duration, meta = {}) {
    this.info(`AI Service: ${service}.${operation}`, {
      duration: `${duration}ms`,
      ...meta
    });
  }
}

// Create singleton instance
const logger = new Logger();

// Export logger instance
export default logger;

