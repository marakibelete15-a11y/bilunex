/**
 * Bilunex - Initial Administrator Seeder
 * Creates initial super_admin account using credentials provided in environment variables.
 * Usage: node database/seeds/create-admin.js
 */

const bcrypt = require('bcrypt');
const db = require('../../src/config/db');
const logger = require('../../src/utils/logger');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function createAdmin() {
  const adminName = process.env.ADMIN_NAME || 'System Administrator';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bilunex.org';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin12345678!';

  if (!adminEmail || !adminPassword) {
    logger.error('ADMIN_EMAIL and ADMIN_PASSWORD must be specified in .env');
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    logger.error('ADMIN_PASSWORD must be at least 8 characters long');
    process.exit(1);
  }

  try {
    logger.info(`🔐 Seeding initial administrator: ${adminEmail}...`);
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const query = `
      INSERT INTO admin_users (name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, 'super_admin', true)
      ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          password_hash = EXCLUDED.password_hash,
          role = 'super_admin',
          is_active = true,
          updated_at = now()
      RETURNING id, name, email, role, is_active, created_at;
    `;

    const res = await db.query(query, [adminName, adminEmail, passwordHash]);
    const admin = res.rows[0];
    logger.info(`✅ Super admin ready: ${admin.email} (ID: ${admin.id}, Role: ${admin.role})`);
  } catch (err) {
    logger.error('❌ Failed to seed administrator:', err.message);
    process.exit(1);
  } finally {
    await db.closePool();
  }
}

createAdmin();
