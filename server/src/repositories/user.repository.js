/**
 * Bilunex - User Repository
 * ALL SQL queries regarding users live here. Repositories never contain business logic.
 */

const db = require('../config/db');

const userRepository = {
  /**
   * Find a user record by email
   * @param {string} email
   */
  async findByEmail(email) {
    const text = `
      SELECT id, name, email, password_hash, role, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const res = await db.query(text, [email]);
    return res.rows[0] || null;
  },

  /**
   * Find a user by primary key ID
   * @param {number|string} id
   */
  async findById(id) {
    const text = `
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Create a new user record
   * @param {object} user
   */
  async create({ name, email, password_hash, role = 'mentor' }) {
    const text = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at;
    `;
    const res = await db.query(text, [name, email, password_hash, role]);
    return res.rows[0];
  },
};

module.exports = userRepository;
