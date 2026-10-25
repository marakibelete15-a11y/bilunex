/**
 * Bilunex - Database Configuration & Connection Pool
 * PostgreSQL connection pool using 'pg'.
 * Uses TEST_DATABASE_URL when NODE_ENV === 'test'.
 * Includes error handling and graceful shutdown.
 */

const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

// Select database URL based on environment
const connectionString = env.NODE_ENV === 'test' ? env.TEST_DATABASE_URL : env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  max: env.NODE_ENV === 'test' ? 5 : 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Pool error handling for idle clients
pool.on('error', (err, _client) => {
  logger.error('Unexpected error on idle PostgreSQL client in pool:', {
    message: err.message,
    stack: err.stack,
  });
});

/**
 * Execute a parameterized query against the connection pool
 * @param {string} text - SQL statement with $1, $2 placeholders
 * @param {Array<any>} [params] - Query parameters
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed SQL query', { text, duration, rowCount: res.rowCount });
    return res;
  } catch (error) {
    logger.error('SQL Execution Error:', {
      text,
      message: error.message,
      detail: error.detail,
    });
    throw error;
  }
};

/**
 * Acquire a dedicated client from the pool (e.g. for multi-statement transactions)
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Verify database connectivity at server startup
 */
const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW() AS server_time, current_database() AS db_name');
    logger.info(
      `✅ Connected to PostgreSQL [${res.rows[0].db_name}] at ${res.rows[0].server_time}`
    );
    return true;
  } catch (err) {
    logger.error('❌ Failed to connect to PostgreSQL database:', err.message);
    return false;
  }
};

// Graceful pool shutdown handlers
const closePool = async () => {
  logger.info('Closing PostgreSQL connection pool...');
  try {
    await pool.end();
    logger.info('PostgreSQL connection pool closed.');
  } catch (err) {
    logger.error('Error while closing database pool:', err.message);
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  closePool,
};
