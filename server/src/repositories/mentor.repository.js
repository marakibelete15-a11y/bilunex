/**
 * Bilunex - Mentor Repository
 * ALL SQL queries regarding mentors and applications live here.
 */

const db = require('../config/db');

const mentorRepository = {
  /**
   * Save a new mentor application
   */
  async createApplication({ full_name, email, phone, expertise, years_experience, bio }) {
    const text = `
      INSERT INTO mentor_applications (
        full_name, email, phone, expertise, years_experience, bio, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *;
    `;
    const res = await db.query(text, [full_name, email, phone, expertise, years_experience, bio]);
    return res.rows[0];
  },

  /**
   * Retrieve all mentor applications
   */
  async findAllApplications() {
    const text = `
      SELECT *
      FROM mentor_applications
      ORDER BY created_at DESC;
    `;
    const res = await db.query(text);
    return res.rows;
  },

  /**
   * Count pending applications
   */
  async countPendingApplications() {
    const text = `SELECT COUNT(*)::int AS count FROM mentor_applications WHERE status = 'pending';`;
    const res = await db.query(text);
    return res.rows[0]?.count || 0;
  },

  /**
   * Update status of an application
   */
  async updateApplicationStatus(id, status) {
    const text = `
      UPDATE mentor_applications
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const res = await db.query(text, [status, id]);
    return res.rows[0] || null;
  },

  /**
   * Find mentor profile by associated user ID
   */
  async findByUserId(userId) {
    const text = `
      SELECT m.*, u.email, u.name
      FROM mentors m
      JOIN users u ON u.id = m.user_id
      WHERE m.user_id = $1
      LIMIT 1;
    `;
    const res = await db.query(text, [userId]);
    return res.rows[0] || null;
  },

  /**
   * Retrieve all active mentors
   */
  async findAllActiveMentors() {
    const text = `
      SELECT m.id, u.name AS full_name, u.email, m.phone, m.expertise, m.status, m.created_at
      FROM mentors m
      JOIN users u ON u.id = m.user_id
      WHERE m.status = 'active'
      ORDER BY u.name ASC;
    `;
    const res = await db.query(text);
    return res.rows;
  },

  /**
   * Count active mentors
   */
  async countActiveMentors() {
    const text = `SELECT COUNT(*)::int AS count FROM mentors WHERE status = 'active';`;
    const res = await db.query(text);
    return res.rows[0]?.count || 0;
  },
};

module.exports = mentorRepository;
