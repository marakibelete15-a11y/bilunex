/**
 * Bilunex - Application Logger
 * Winston logger configured for console output and rotating logs.
 */

const winston = require('winston');
const env = require('../config/env');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `[${timestamp}] ${level}: ${stack || message}`;
  })
);

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'bilunex-api' },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      silent: env.NODE_ENV === 'test', // Mute regular logs during automated test runs
    }),
  ],
});

// Stream adapter for morgan HTTP request logger
logger.stream = {
  write: message => {
    logger.info(message.trim());
  },
};

module.exports = logger;
