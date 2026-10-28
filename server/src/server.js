/**
 * Bilunex - Server Entry Point
 * Starts the HTTP server, validates environment configuration, and tests database connectivity.
 */

const env = require('./config/env');
const db = require('./config/db');
const logger = require('./utils/logger');
const app = require('./app');

process.on('unhandledRejection', reason => {
  logger.error('Unhandled promise rejection:', reason instanceof Error ? reason.stack : reason);
});
process.on('uncaughtException', error => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

const startServer = async () => {
  try {
    logger.info('🚀 Starting Bilunex Backend Service...');
    logger.info(`Environment: ${env.NODE_ENV}`);

    // Verify database connectivity
    const isDbConnected = await db.testConnection();
    if (!isDbConnected) {
      logger.warn(
        '⚠️  Database connection could not be established. Ensure PostgreSQL is running.'
      );
      logger.warn(`   Target URL: ${env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`✨ Bilunex API listening on http://localhost:${env.PORT}`);
      logger.info(`🏥 Health check: http://localhost:${env.PORT}/api/v1/health`);
      if (env.NODE_ENV !== 'production') {
        logger.info(`🌐 Client website served at: http://localhost:${env.PORT}`);
      }
    });

    server.on('error', error => {
      if (error.code === 'EADDRINUSE') {
        logger.error(
          `Port ${env.PORT} is already in use. Stop the other process or choose another port.`
        );
        return;
      }
      logger.error('HTTP server error:', error);
    });

    // Graceful shutdown handling
    const shutdown = async signal => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await db.pool.end();
        logger.info('Database pool closed.');
        process.exit(0);
      });

      // Force close after 10s if dangling connections remain
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
