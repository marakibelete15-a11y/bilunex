/**
 * Bilunex - Mentor Repository
 * ALL SQL queries regarding mentor applications and profiles live here.
 * Aligned with SRS entities and soft-delete conventions.
 */

const db = require('../config/db');

const mentorRepository = {
  /**
   * Save a new mentor application
   */
  async createApplication({
    full_name,
    email,
    phone,
    telegram_handle = null,
    university = 'Not specified',
    field_of_study = 'Not specified',
    academic_year = 'Not specified',
    subjects,
    availability = 'Flexible',
    motivation,
    expertise, // Fallback for initial controller payload
    bio, // Fallback for initial controller payload
  }) {
    const subjectsArray = Array.isArray(subjects)
      ? subjects
      : typeof expertise === 'string'
        ? expertise.split(',').map(s => s.trim())
        : ['General Mentorship'];

    const motivationText = motivation || bio || 'Passionate about mentorship';

    const text = `
      INSERT INTO mentor_applications (
        full_name, email, phone, telegram_handle, university,
        field_of_study, academic_year, subjects, availability, motivation, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'application_received')
      RETURNING *;
    `;
    const res = await db.query(text, [
      full_name,
      email,
      phone,
      telegram_handle,
      university,
      field_of_study,
      academic_year,
      subjectsArray,
      availability,
      motivationText,
    ]);
    return res.rows[0];
  },

  /**
   * Retrieve all active mentor applications (excluding soft-deleted)
   */
  async findAllApplications() {
    const text = `
      SELECT *
      FROM mentor_applications
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC;
    `;
    const res = await db.query(text);
    return res.rows;
  },

  /**
   * Count new/unreviewed mentor applications
   */
  async countPendingApplications() {
    const text = `
      SELECT COUNT(*)::int AS count
      FROM mentor_applications
      WHERE status IN ('application_received', 'under_review') AND deleted_at IS NULL;
    `;
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
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *;
    `;
    const res = await db.query(text, [status, id]);
    return res.rows[0] || null;
  },

  /**
   * Find mentor profile by ID
   */
  async findByUserId(id) {
    const text = `
      SELECT id, application_id, name, email, phone, university,
             field_of_study, subject_specializations, availability, account_status, created_at
      FROM mentor_profiles
      WHERE id = $1 AND account_status = 'active'
      LIMIT 1;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Retrieve all active mentors
   */
  async findAllActiveMentors() {
    const text = `
      SELECT id, name AS full_name, email, phone, university,
             field_of_study, subject_specializations AS expertise, account_status AS status, created_at
      FROM mentor_profiles
      WHERE account_status = 'active'
      ORDER BY name ASC;
    `;
    const res = await db.query(text);
    return res.rows;
  },

  /**
   * Count active mentors
   */
  async countActiveMentors() {
    const text = `SELECT COUNT(*)::int AS count FROM mentor_profiles WHERE account_status = 'active';`;
    const res = await db.query(text);
    return res.rows[0]?.count || 0;
  },
};

module.exports = mentorRepository;
