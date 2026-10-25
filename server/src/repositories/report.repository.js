/**
 * Bilunex - Student Support Report Repository
 * ALL SQL queries regarding session support reports live here.
 * Aligned strictly to SRS entities (support_need_observed, observations, recommended_action).
 * Enforces mentor query isolation and soft deletes.
 */

const db = require('../config/db');

const reportRepository = {
  /**
   * Save a new support report filed by an authenticated mentor
   */
  async create({
    mentor_id,
    student_name,
    support_need_observed,
    session_focus, // Fallback for initial controller payload
    observations,
    recommended_action,
    action_items, // Fallback for initial controller payload
  }) {
    const finalSupportNeed =
      support_need_observed || session_focus || 'General academic and emotional support';
    const finalAction = recommended_action || action_items || 'Continue standard support plan';

    const text = `
      INSERT INTO student_support_reports (
        mentor_id, student_name, support_need_observed, observations, recommended_action
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const res = await db.query(text, [
      mentor_id,
      student_name,
      finalSupportNeed,
      observations,
      finalAction,
    ]);
    return res.rows[0];
  },

  /**
   * Fetch all active reports filed by a specific mentor (enforces mentor isolation)
   */
  async findByMentorId(mentorId) {
    const text = `
      SELECT *
      FROM student_support_reports
      WHERE mentor_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC;
    `;
    const res = await db.query(text, [mentorId]);
    return res.rows;
  },

  /**
   * Fetch all reports across the system with mentor details (admin view only)
   */
  async findAll(limit = 100) {
    const text = `
      SELECT r.*, m.name AS mentor_name, m.email AS mentor_email
      FROM student_support_reports r
      JOIN mentor_profiles m ON m.id = r.mentor_id
      WHERE r.deleted_at IS NULL
      ORDER BY r.created_at DESC
      LIMIT $1;
    `;
    const res = await db.query(text, [limit]);
    return res.rows;
  },

  /**
   * Count total active reports filed
   */
  async countAll() {
    const text = `SELECT COUNT(*)::int AS count FROM student_support_reports WHERE deleted_at IS NULL;`;
    const res = await db.query(text);
    return res.rows[0]?.count || 0;
  },
};

module.exports = reportRepository;
