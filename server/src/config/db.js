/**
 * Bilunex - Database Configuration
 * PostgreSQL connection pool using 'pg'. All queries are executed through this pool.
 */

const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

const connectionString = env.NODE_ENV === 'test' ? env.TEST_DATABASE_URL : env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

pool.on('error', err => {
  logger.error('Unexpected error on idle database client', err);
});

/**
 * Execute a parameterized query against the pool
 * @param {string} text - SQL statement
 * @param {Array<any>} [params] - Query parameters
 */
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

/**
 * Acquire a dedicated client from the pool (for transactions)
 */
const getClient = async () => {
  return await pool.connect();
};

/**
 * Verify database connectivity at startup
 */
const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW() AS current_time');
    logger.info(`✅ Connected to PostgreSQL database at ${res.rows[0].current_time}`);
    return true;
  } catch (err) {
    logger.error('❌ Failed to connect to PostgreSQL database:', err.message);
    return false;
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};
