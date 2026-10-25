/**
 * Bilunex - User Repository
 * Queries admin_users and active mentor_profiles.
 * Adapted for separate admin_users and mentor_profiles schema.
 */

const db = require('../config/db');

const userRepository = {
  /**
   * Find an admin or mentor by email address
   * @param {string} email
   */
  async findByEmail(email) {
    // 1. Check admin_users table
    const adminText = `
      SELECT id, name, email, password_hash, 'admin'::varchar AS role, created_at, updated_at
      FROM admin_users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const adminRes = await db.query(adminText, [email]);
    if (adminRes.rows[0]) {
      return adminRes.rows[0];
    }

    // 2. Check mentor_profiles table
    const mentorText = `
      SELECT id, name, email, password_hash, 'mentor'::varchar AS role, created_at, updated_at
      FROM mentor_profiles
      WHERE LOWER(email) = LOWER($1) AND account_status = 'active'
      LIMIT 1;
    `;
    const mentorRes = await db.query(mentorText, [email]);
    return mentorRes.rows[0] || null;
  },

  /**
   * Find an admin or mentor by primary key ID
   * @param {number|string} id
   */
  async findById(id) {
    const adminRes = await db.query(
      `SELECT id, name, email, 'admin'::varchar AS role, created_at, updated_at FROM admin_users WHERE id = $1 LIMIT 1;`,
      [id]
    );
    if (adminRes.rows[0]) return adminRes.rows[0];

    const mentorRes = await db.query(
      `SELECT id, name, email, 'mentor'::varchar AS role, created_at, updated_at FROM mentor_profiles WHERE id = $1 LIMIT 1;`,
      [id]
    );
    return mentorRes.rows[0] || null;
  },

  /**
   * Create an admin user record
   */
  async create({ name, email, password_hash, role = 'admin' }) {
    const text = `
      INSERT INTO admin_users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at;
    `;
    const res = await db.query(text, [
      name,
      email,
      password_hash,
      role === 'super_admin' ? 'super_admin' : 'admin',
    ]);
    return res.rows[0];
  },
};

module.exports = userRepository;
