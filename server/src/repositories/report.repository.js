/**
 * Bilunex - Student Support Report Repository
 * Parameterized queries for student_support_reports table.
 * Admin-only reads; mentors submit reports but cannot read any report.
 */

const db = require('../config/db');

const reportRepository = {
  async create({ mentor_id, student_name, support_need, observations, recommended_action }) {
    const text = `
      INSERT INTO student_support_reports (
        mentor_id, student_name, support_need, observations, recommended_action
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const res = await db.query(text, [
      mentor_id,
      student_name,
      support_need,
      observations,
      recommended_action,
    ]);
    return res.rows[0];
  },

  async findAll({ limit = 50, offset = 0 } = {}) {
    const text = `
      SELECT r.*, m.full_name AS mentor_name, m.email AS mentor_email
      FROM student_support_reports r
      JOIN mentor_profiles m ON r.mentor_id = m.id
      ORDER BY r.created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const res = await db.query(text, [limit, offset]);
    return res.rows;
  },

  async countAll() {
    const text = `SELECT COUNT(*)::int AS count FROM student_support_reports;`;
    const res = await db.query(text);
    return res.rows[0]?.count || 0;
  },

  async findById(id) {
    const text = `
      SELECT r.*, m.full_name AS mentor_name, m.email AS mentor_email
      FROM student_support_reports r
      JOIN mentor_profiles m ON r.mentor_id = m.id
      WHERE r.id = $1
      LIMIT 1;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },
};

module.exports = reportRepository;
