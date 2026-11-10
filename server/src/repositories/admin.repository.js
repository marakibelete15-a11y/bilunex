/**
 * Bilunex - Admin Repository
 * Parameterized queries for the admin_users table.
 */

const db = require('../config/db');

const adminRepository = {
  async findByEmail(email) {
    const text = `
      SELECT id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at
      FROM admin_users
      WHERE email = $1::citext
      LIMIT 1;
    `;
    const res = await db.query(text, [email]);
    return res.rows[0] || null;
  },

  async findById(id) {
    const text = `
      SELECT id, name, email, role, is_active, last_login_at, created_at, updated_at
      FROM admin_users
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  async updateLastLogin(id) {
    const text = `
      UPDATE admin_users
      SET last_login_at = now(), updated_at = now()
      WHERE id = $1
      RETURNING id, last_login_at;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  async create({ name, email, password_hash, role = 'admin' }) {
    const text = `
      INSERT INTO admin_users (name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4::admin_role, true)
      RETURNING id, name, email, role, is_active, created_at;
    `;
    const res = await db.query(text, [name, email, password_hash, role]);
    return res.rows[0];
  },

  async findByIdWithPassword(id) {
    const text = `
      SELECT id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at
      FROM admin_users
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  async updatePassword(id, password_hash) {
    const text = `
      UPDATE admin_users
      SET password_hash = $2, updated_at = now()
      WHERE id = $1
      RETURNING id, name, email, role, is_active, updated_at;
    `;
    const res = await db.query(text, [id, password_hash]);
    return res.rows[0] || null;
  },
};

module.exports = adminRepository;
