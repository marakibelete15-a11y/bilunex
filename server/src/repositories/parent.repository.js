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
    student_name, // Fallback
    grade_level,
    student_grade, // Fallback
    subjects = [],
    support_category,
    support_type, // Fallback
    notes = null,
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
   * Find a parent registration by ID
   */
  async findById(id) {
    const text = `
      SELECT *
      FROM parent_registrations
      WHERE id = $1 AND deleted_at IS NULL
      LIMIT 1;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Fetch active parent registrations with flexible filtering, search, and pagination
   */
  async findWithFilters({
    status = null,
    grade_level = null,
    subject = null,
    from_date = null,
    to_date = null,
    search = null,
    limit = 50,
    offset = 0,
  } = {}) {
    const text = `
      SELECT
        id, parent_name, email, phone, telegram_handle, child_name,
        grade_level, subjects, support_category, notes, status, created_at, updated_at
      FROM parent_registrations
      WHERE deleted_at IS NULL
        AND ($1::parent_registration_status IS NULL OR status = $1)
        AND ($2::varchar IS NULL OR grade_level = $2)
        AND ($3::varchar IS NULL OR $3 = ANY(subjects))
        AND ($4::timestamptz IS NULL OR created_at >= $4)
        AND ($5::timestamptz IS NULL OR created_at <= $5)
        AND ($6::varchar IS NULL OR (
            parent_name ILIKE '%' || $6 || '%'
            OR child_name ILIKE '%' || $6 || '%'
            OR email ILIKE '%' || $6 || '%'
        ))
      ORDER BY created_at DESC
      LIMIT $7 OFFSET $8;
    `;
    const res = await db.query(text, [
      status,
      grade_level,
      subject,
      from_date,
      to_date,
      search,
      limit,
      offset,
    ]);
    return res.rows;
  },

  /**
   * Count total registrations matching filter criteria
   */
  async countWithFilters({
    status = null,
    grade_level = null,
    subject = null,
    from_date = null,
    to_date = null,
    search = null,
  } = {}) {
    const text = `
      SELECT COUNT(*)::int AS count
      FROM parent_registrations
      WHERE deleted_at IS NULL
        AND ($1::parent_registration_status IS NULL OR status = $1)
        AND ($2::varchar IS NULL OR grade_level = $2)
        AND ($3::varchar IS NULL OR $3 = ANY(subjects))
        AND ($4::timestamptz IS NULL OR created_at >= $4)
        AND ($5::timestamptz IS NULL OR created_at <= $5)
        AND ($6::varchar IS NULL OR (
            parent_name ILIKE '%' || $6 || '%'
            OR child_name ILIKE '%' || $6 || '%'
            OR email ILIKE '%' || $6 || '%'
        ));
    `;
    const res = await db.query(text, [status, grade_level, subject, from_date, to_date, search]);
    return res.rows[0]?.count || 0;
  },

  /**
   * Count parent registrations grouped by status
   */
  async countByStatus() {
    const text = `
      SELECT status, COUNT(*)::int AS count
      FROM parent_registrations
      WHERE deleted_at IS NULL
      GROUP BY status;
    `;
    const res = await db.query(text);
    return res.rows;
  },

  /**
   * Fetch active parent registrations (legacy helper)
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
   * Update status of parent registration
   */
  async updateStatus(id, status) {
    const text = `
      UPDATE parent_registrations
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *;
    `;
    const res = await db.query(text, [status, id]);
    return res.rows[0] || null;
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
