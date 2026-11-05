/**
 * Bilunex - Express Application Configuration
 * Separated from server.js so that the app is completely exportable and testable.
 */

const express = require('express');
const path = require('path');
const { URL } = require('url');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./utils/logger');
const routes = require('./routes');
const { generalLimiter } = require('./middleware/rateLimit.middleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler.middleware');
const portalPageAuth = require('./middleware/portalPageAuth.middleware');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for simple vanilla script serving in local dev
  })
);

// CORS restricted to configured CLIENT_URL
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
      if (!origin || origin === env.CLIENT_URL) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Request body size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP Request logging with Morgan (piped to Winston)
if (env.NODE_ENV !== 'test') {
  const redactCredentialQuery = value => {
    if (!value || value === '-') return value;
    try {
      const requestUrl = new URL(value, 'http://localhost');
      for (const key of requestUrl.searchParams.keys()) {
        if (['email', 'password'].includes(key.toLowerCase())) {
          requestUrl.searchParams.set(key, '[REDACTED]');
        }
      }
      return `${requestUrl.pathname}${requestUrl.search}`;
    } catch {
      return '[invalid-url]';
    }
  };
  morgan.token('url', req => redactCredentialQuery(req.originalUrl));
  morgan.token('referrer', req => redactCredentialQuery(req.headers.referer));
  app.use(morgan('combined', { stream: logger.stream }));
}

// Global API rate limiting
app.use('/api', generalLimiter);

// Health Check Endpoint (Version 1)
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// Mount Versioned API Routes (/api/v1/...)
app.use('/api', routes);

// Static Client Serving in Development & Testing
if (env.NODE_ENV !== 'production') {
  const clientPath = path.join(__dirname, '../../client');
  app.use('/admin', portalPageAuth('admin'));
  app.use('/mentor', portalPageAuth('mentor'));
  app.use(express.static(clientPath));

  // Convenience root redirect to public landing page
  app.get('/', (req, res) => {
    res.sendFile(path.join(clientPath, 'public/index.html'));
  });
}

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Central Error Handler (Suppresses internal stack traces in production)
app.use(errorHandler);

module.exports = app;
