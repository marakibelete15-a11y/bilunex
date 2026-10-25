/**
 * Bilunex - Parent Registration Repository
 * ALL SQL queries regarding parent registrations live here.
 */

const db = require('../config/db');

const parentRepository = {
  /**
   * Save a parent registration into the database
   * @param {object} registrationData
   */
  async create({ parent_name, email, phone, student_name, student_grade, support_type, notes }) {
    const text = `
      INSERT INTO parent_registrations (
        parent_name, email, phone, student_name, student_grade, support_type, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const res = await db.query(text, [
      parent_name,
      email,
      phone,
      student_name,
      student_grade,
      support_type,
      notes || null,
    ]);
    return res.rows[0];
  },

  /**
   * Fetch recent parent registrations
   * @param {number} limit
   */
  async findAll(limit = 50) {
    const text = `
      SELECT *
      FROM parent_registrations
      ORDER BY created_at DESC
      LIMIT $1;
    `;
    const res = await db.query(text, [limit]);
    return res.rows;
  },

  /**
   * Count total parent registrations
   */
  async countAll() {
    const text = `SELECT COUNT(*)::int AS count FROM parent_registrations;`;
    const res = await db.query(text);
    return res.rows[0]?.count || 0;
  },
};

module.exports = parentRepository;
