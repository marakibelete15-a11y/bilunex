/**
 * Bilunex - Parent Registration Repository
 * ALL SQL queries regarding parent registrations live here.
 * Aligned with SRS entities (child_name, grade_level, subjects) and soft deletes.
 */

const db = require('../config/db');

const parentRepository = {
  /**
   * Save a parent registration into the database
   */
  async create({
    parent_name,
    email,
    phone,
    telegram_handle = null,
    child_name,
    student_name, // Fallback for initial controller payload
    grade_level,
    student_grade, // Fallback for initial controller payload
    subjects = [],
    support_category,
    support_type, // Fallback for initial controller payload
    notes,
  }) {
    const finalChildName = child_name || student_name;
    const finalGradeLevel = grade_level || student_grade;
    const finalSupportCategory = support_category || support_type || 'combined';
    const subjectsArray = Array.isArray(subjects) ? subjects : [];

    const text = `
      INSERT INTO parent_registrations (
        parent_name, email, phone, telegram_handle, child_name,
        grade_level, subjects, support_category, notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new')
      RETURNING *;
    `;
    const res = await db.query(text, [
      parent_name,
      email,
      phone,
      telegram_handle,
      finalChildName,
      finalGradeLevel,
      subjectsArray,
      finalSupportCategory,
      notes || null,
    ]);
    return res.rows[0];
  },

  /**
   * Fetch active parent registrations (excluding soft-deleted)
   */
  async findAll(limit = 50) {
    const text = `
      SELECT *
      FROM parent_registrations
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $1;
    `;
    const res = await db.query(text, [limit]);
    return res.rows;
  },

  /**
   * Count total active parent registrations
   */
  async countAll() {
    const text = `SELECT COUNT(*)::int AS count FROM parent_registrations WHERE deleted_at IS NULL;`;
    const res = await db.query(text);
    return res.rows[0]?.count || 0;
  },
};

module.exports = parentRepository;
