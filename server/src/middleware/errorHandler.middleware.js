/**
 * Bilunex - Central Error Handler & 404 Middleware
 * Catches unhandled errors and ensures consistent JSON responses without leaking internal stack traces in production.
 */

const logger = require('../utils/logger');
const env = require('../config/env');
const { sendError } = require('../utils/response');

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  return sendError(res, `Route not found: [${req.method}] ${req.originalUrl}`, 404);
};

/**
 * Central Error Handler (Express 4-argument signature)
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Unhandled Application Error:', {
    message: err.message,
    statusCode,
    url: req.originalUrl,
    method: req.method,
    stack: env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  const responsePayload = {
    success: false,
    message:
      statusCode === 500 && env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
  };

  // Only expose error details and stack trace in non-production environments
  if (env.NODE_ENV !== 'production' && err.stack) {
    responsePayload.stack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
