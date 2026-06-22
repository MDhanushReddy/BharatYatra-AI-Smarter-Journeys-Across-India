/**
 * Rate Limiting Middleware
 * Prevents API abuse by limiting requests per IP address
 */

// Simple in-memory rate limiter (for production, consider Redis)
const requestCounts = new Map();

// Clean up old entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now - value.resetTime > 0) {
      requestCounts.delete(key);
    }
  }
}, 15 * 60 * 1000);

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = (req, res, next) => {
  const ip = req.clientIP || req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  const key = `api:${ip}`;
  const record = requestCounts.get(key);

  if (!record || now - record.resetTime > windowMs) {
    // New window
    const newRecord = {
      count: 1,
      resetTime: now + windowMs
    };
    requestCounts.set(key, newRecord);
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
    res.setHeader('X-RateLimit-Reset', new Date(newRecord.resetTime).toISOString());
    return next();
  }

  if (record.count >= maxRequests) {
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please try again later.',
        details: {
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  record.count++;
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);
  res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
  next();
};

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = (req, res, next) => {
  const ip = req.clientIP || req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;

  const key = `auth:${ip}`;
  const record = requestCounts.get(key);

  if (!record || now - record.resetTime > windowMs) {
    const newRecord = {
      count: 1,
      resetTime: now + windowMs
    };
    requestCounts.set(key, newRecord);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
    res.setHeader('X-RateLimit-Reset', new Date(newRecord.resetTime).toISOString());
    return next();
  }

  if (record.count >= maxRequests) {
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please try again later.',
        details: {
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  record.count++;
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);
  res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
  next();
};

/**
 * Search/API endpoint limiter
 * 50 requests per minute per IP
 */
export const searchLimiter = (req, res, next) => {
  const ip = req.clientIP || req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 50;

  const key = `search:${ip}`;
  const record = requestCounts.get(key);

  if (!record || now - record.resetTime > windowMs) {
    const newRecord = {
      count: 1,
      resetTime: now + windowMs
    };
    requestCounts.set(key, newRecord);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
    res.setHeader('X-RateLimit-Reset', new Date(newRecord.resetTime).toISOString());
    return next();
  }

  if (record.count >= maxRequests) {
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Search rate limit exceeded. Please slow down.',
        details: {
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  record.count++;
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);
  res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
  next();
};

