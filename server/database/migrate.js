/**
 * Bilunex - Database Migration Runner
 * Supports ordered execution of migrations using unified .sql files
 * with '-- migrate:up' and '-- migrate:down' markers.
 * Usage: node database/migrate.js [up|down]
 */

const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const logger = require('../src/utils/logger');

const direction = (process.argv[2] || 'up').toLowerCase();

/**
 * Extract UP and DOWN SQL blocks from unified migration files
 */
function parseMigrationFile(content, filename) {
  const upMatch = content.match(/--\s*migrate:up([\s\S]*?)(?:--\s*migrate:down|$)/i);
  const downMatch = content.match(/--\s*migrate:down([\s\S]*)$/i);

  if (!upMatch || !downMatch) {
    throw new Error(
      `Migration ${filename} must contain both '-- migrate:up' and '-- migrate:down' markers`
    );
  }

  return {
    up: upMatch[1].trim(),
    down: downMatch[1].trim(),
  };
}

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    logger.error(`Migrations directory not found at: ${migrationsDir}`);
    process.exit(1);
  }

  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  const allFiles = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  if (direction === 'up') {
    logger.info(`🚀 Checking ${allFiles.length} database migrations (UP)...`);

    for (const file of allFiles) {
      const recorded = await db.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [
        file,
      ]);
      if (recorded.rowCount > 0) continue;

      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      const { up: upSql } = parseMigrationFile(sqlContent, file);

      if (!upSql) {
        logger.warn(`  ⚠️ Migration ${file} has empty UP block. Skipping.`);
        continue;
      }

      logger.info(`  Applying migration: ${file}`);
      const client = await db.getClient();
      try {
        await client.query('BEGIN');
        await client.query(upSql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
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
    const applied = await db.query(
      'SELECT filename FROM schema_migrations ORDER BY applied_at DESC, filename DESC'
    );
    const appliedFiles = applied.rows.map(row => row.filename);

    const pendingDown = appliedFiles
      .filter(f => fs.existsSync(path.join(migrationsDir, f)))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));

    logger.info(`🔄 Reverting ${pendingDown.length} database migrations (DOWN)...`);

    for (const file of pendingDown) {
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      const { down: downSql } = parseMigrationFile(sqlContent, file);

      logger.info(`  Reverting migration: ${file}`);
      const client = await db.getClient();
      try {
        await client.query('BEGIN');
        if (downSql) {
          await client.query(downSql);
        }
        await client.query('DELETE FROM schema_migrations WHERE filename = $1', [file]);
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
    await db.closePool();
  });
