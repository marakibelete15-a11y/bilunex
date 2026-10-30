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

  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    baseline BOOLEAN NOT NULL DEFAULT FALSE
  )`);

  if (direction === 'up') {
    const upFiles = allFiles
      .filter(f => f.endsWith('.up.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    // Existing installs predate migration tracking. Baseline only when their
    // schema proves the complete 014 shape; then 015+ run normally.
    const history = await db.query('SELECT COUNT(*)::int AS count FROM schema_migrations');
    if (history.rows[0].count === 0) {
      const legacy = await db.query(`SELECT
        to_regclass('public.admin_users') IS NOT NULL
        AND to_regclass('public.mentor_documents') IS NOT NULL
        AND to_regclass('public.parent_registrations') IS NOT NULL
        AND to_regclass('public.mentor_applications') IS NOT NULL
        AND to_regclass('public.notification_log') IS NOT NULL
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notification_log' AND column_name='recipient_role')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='parent_registrations' AND column_name='preferred_title') AS ready`);
      if (legacy.rows[0].ready) {
        const prior = upFiles.filter(file => Number(file.slice(0, 3)) <= 14);
        for (const file of prior)
          await db.query('INSERT INTO schema_migrations(filename, baseline) VALUES ($1, TRUE)', [
            file,
          ]);
        logger.info(
          `Recognized existing schema; recorded ${prior.length} pre-tracking migrations as baseline.`
        );
      } else {
        const anyCore = await db.query(
          "SELECT to_regclass('public.admin_users') IS NOT NULL AS exists"
        );
        if (anyCore.rows[0].exists) {
          throw new Error(
            'Existing database schema is incomplete or unrecognized; refusing to replay migrations. Review schema before continuing.'
          );
        }
      }
    }

    logger.info(`🚀 Checking ${upFiles.length} database migrations (UP)...`);

    for (const file of upFiles) {
      const recorded = await db.query('SELECT 1 FROM schema_migrations WHERE filename=$1', [file]);
      if (recorded.rowCount) continue;
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      logger.info(`  Applying migration: ${file}`);
      const client = await db.getClient();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [file]);
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

    const applied = await db.query('SELECT filename FROM schema_migrations WHERE baseline=FALSE');
    const appliedUp = new Set(applied.rows.map(row => row.filename));
    const pendingDown = downFiles.filter(file =>
      appliedUp.has(file.replace('.down.sql', '.up.sql'))
    );

    logger.info(`🔄 Reverting ${pendingDown.length} tracked database migrations (DOWN)...`);

    for (const file of pendingDown) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      logger.info(`  Reverting migration: ${file}`);
      const client = await db.getClient();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('DELETE FROM schema_migrations WHERE filename=$1', [
          file.replace('.down.sql', '.up.sql'),
        ]);
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
