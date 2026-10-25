/**
 * Bilunex - Database Migration Runner
 * Usage: node database/migrate.js up | down
 */

const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const logger = require('../src/utils/logger');

const direction = process.argv[2] || 'up';

async function run() {
  try {
    if (direction === 'up') {
      logger.info('Running database migrations (UP)...');
      const migrationFile = path.join(__dirname, 'migrations/001_initial_schema.sql');
      const sql = fs.readFileSync(migrationFile, 'utf8');
      await db.query(sql);
      logger.info('✅ Database migrations executed successfully.');
    } else if (direction === 'down') {
      logger.info('Rolling back database migrations (DOWN)...');
      const dropSql = `
        DROP TABLE IF EXISTS student_support_reports CASCADE;
        DROP TABLE IF EXISTS mentor_applications CASCADE;
        DROP TABLE IF EXISTS parent_registrations CASCADE;
        DROP TABLE IF EXISTS mentors CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `;
      await db.query(dropSql);
      logger.info('✅ Tables dropped successfully.');
    }
  } catch (err) {
    logger.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

run();
