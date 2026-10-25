/**
 * Bilunex - Admin User Repository
 * ALL SQL queries regarding admin users live here.
 */

const db = require('../config/db');

const adminRepository = {
  /**
   * Find an admin user by email (for authentication)
   */
  async findByEmail(email) {
    const text = `
      SELECT id, name, email, password_hash, role, created_at, updated_at
      FROM admin_users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const res = await db.query(text, [email]);
    return res.rows[0] || null;
  },

  /**
   * Find an admin user by primary key ID (excluding sensitive password hash)
   */
  async findById(id) {
    const text = `
      SELECT id, name, email, role, created_at, updated_at
      FROM admin_users
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Create a new administrator account
   */
  async create({ name, email, password_hash, role = 'admin' }) {
    const text = `
      INSERT INTO admin_users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at;
    `;
    const res = await db.query(text, [name, email, password_hash, role]);
    return res.rows[0];
  },
};

module.exports = adminRepository;
