/**
 * Bilunex - Database Migration Runner
 * Supports ordered execution of *.up.sql (ascending) and *.down.sql (descending) migrations.
 * Usage: node database/migrate.js [up|down]
 */

const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const logger = require('../src/utils/logger');

const direction = (process.argv[2] || 'up').toLowerCase();

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    logger.error(`Migrations directory not found at: ${migrationsDir}`);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(migrationsDir);

  if (direction === 'up') {
    const upFiles = allFiles
      .filter(f => f.endsWith('.up.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    logger.info(`🚀 Running ${upFiles.length} database migrations (UP)...`);

    for (const file of upFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      logger.info(`  Applying migration: ${file}`);
      const client = await db.getClient();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        logger.info(`  ✅ Applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`  ❌ Failed applying ${file}: ${err.message}`);
        throw err;
      } finally {
        client.release();
      }
    }

    logger.info('🎉 All migrations applied successfully (UP).');
  } else if (direction === 'down') {
    const downFiles = allFiles
      .filter(f => f.endsWith('.down.sql'))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));

    logger.info(`🔄 Reverting ${downFiles.length} database migrations (DOWN)...`);

    for (const file of downFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      logger.info(`  Reverting migration: ${file}`);
      const client = await db.getClient();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        logger.info(`  ✅ Reverted: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`  ❌ Failed reverting ${file}: ${err.message}`);
        throw err;
      } finally {
        client.release();
      }
    }

    logger.info('🎉 All migrations reverted successfully (DOWN).');
  } else {
    logger.error(`Unknown migration direction: "${direction}". Use "up" or "down".`);
    process.exit(1);
  }
}

runMigrations()
  .catch(err => {
    logger.error('Migration process aborted with error:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
