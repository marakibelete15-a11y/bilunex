/**
 * Bilunex - Database Reset Script
 * Reverts all migrations, re-applies all migrations, and populates development seeds.
 * Usage: npm run db:reset
 */

const { execSync } = require('child_process');
const path = require('path');
const logger = require('../src/utils/logger');

try {
  logger.info('🔄 Resetting Bilunex local database (DOWN -> UP -> SEED)...');
  const serverDir = path.resolve(__dirname, '..');

  execSync('node database/migrate.js down', { cwd: serverDir, stdio: 'inherit' });
  execSync('node database/migrate.js up', { cwd: serverDir, stdio: 'inherit' });
  execSync('node database/seed.js', { cwd: serverDir, stdio: 'inherit' });

  logger.info('✅ Bilunex database reset and seeded successfully!');
} catch (err) {
  logger.error('❌ Database reset failed:', err.message);
  process.exit(1);
}
