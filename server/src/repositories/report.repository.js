/**
 * Bilunex - Student Support Report Repository
 * ALL SQL queries regarding session reports live here.
 */

const db = require('../config/db');

const reportRepository = {
  /**
   * Save a new support report filed by an authenticated mentor
   */
  async create({
    mentor_id,
    student_name,
    session_date,
    duration_minutes,
    session_focus,
    observations,
    action_items,
    progress_rating,
  }) {
    const text = `
      INSERT INTO student_support_reports (
        mentor_id, student_name, session_date, duration_minutes,
        session_focus, observations, action_items, progress_rating
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const res = await db.query(text, [
      mentor_id,
      student_name,
      session_date,
      duration_minutes,
      session_focus,
      observations,
      action_items || null,
      progress_rating,
    ]);
    return res.rows[0];
  },

  /**
   * Fetch all reports filed by a specific mentor (enforces mentor isolation)
   */
  async findByMentorId(mentorId) {
    const text = `
      SELECT *
      FROM student_support_reports
      WHERE mentor_id = $1
      ORDER BY session_date DESC, created_at DESC;
    `;
    const res = await db.query(text, [mentorId]);
    return res.rows;
  },

  /**
   * Fetch all reports across the system (admin view only)
   */
  async findAll(limit = 100) {
    const text = `
      SELECT r.*, u.name AS mentor_name, u.email AS mentor_email
      FROM student_support_reports r
      LEFT JOIN mentors m ON m.id = r.mentor_id
      LEFT JOIN users u ON u.id = m.user_id
      ORDER BY r.session_date DESC, r.created_at DESC
      LIMIT $1;
    `;
    const res = await db.query(text, [limit]);
    return res.rows;
  },

  /**
   * Count total reports filed
   */
  async countAll() {
    const text = `SELECT COUNT(*)::int AS count FROM student_support_reports;`;
    const res = await db.query(text);
    return res.rows[0]?.count || 0;
  },
};

module.exports = reportRepository;
