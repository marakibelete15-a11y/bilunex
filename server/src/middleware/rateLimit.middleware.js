/**
 * Bilunex - Rate Limiting Middleware
 * Protects endpoints against brute force, denial of service, and spam submissions.
 */

const rateLimit = require('express-rate-limit');

// General rate limiter across all API routes (100 requests per 15 minutes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// Stricter rate limiter for authentication & registration forms (15 requests per 15 minutes)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts from this IP, please try again after 15 minutes.',
  },
});

module.exports = {
  generalLimiter,
  strictLimiter,
};
