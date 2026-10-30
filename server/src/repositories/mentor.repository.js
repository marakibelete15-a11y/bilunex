/**
 * Bilunex - Mentor Repository
 * ALL SQL queries regarding mentor applications and mentor profiles live here.
 * Aligned with SRS entities, 6-stage candidate screening, and mentor portal.
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
    telegram_username = null,
    university,
    university_name,
    campus = null,
    field_of_study,
    department,
    academic_year,
    year_of_study,
    subjects = [],
    has_teaching_experience = false,
    teaching_experience = null,
    teaching_experience_duration = null,
    experience_details = null,
    cgpa = null,
    entrance_exam_stream = 'natural_science',
    entrance_exam_result = null,
    available_days = [],
    available_hours = null,
    availability = null,
    motivation,
    commitment_agreement = true,
    referral_source = null,
    expertise, // Fallback
    bio, // Fallback
  }) {
    const finalUniversity = university || university_name || 'Not specified';
    const finalFieldOfStudy = field_of_study || department || 'Not specified';
    const finalAcademicYear = academic_year || year_of_study || 'Not specified';
    const finalTelegram = telegram_handle || telegram_username || null;
    const finalAvailability =
      availability ||
      (Array.isArray(available_hours) ? available_hours.join(', ') : available_hours) ||
      'Flexible';
    const finalExperienceDuration = teaching_experience_duration || teaching_experience || null;

    const subjectsArray = Array.isArray(subjects)
      ? subjects
      : typeof expertise === 'string'
        ? expertise.split(',').map(s => s.trim())
        : ['General Mentorship'];

    const availableDaysArray = Array.isArray(available_days) ? available_days : [];
    const motivationText = motivation || bio || 'Passionate about mentorship';

    const text = `
      INSERT INTO mentor_applications (
        full_name, email, phone, telegram_handle, university, campus,
        field_of_study, academic_year, subjects, has_teaching_experience,
        teaching_experience_duration, experience_details, cgpa, entrance_exam_stream, entrance_exam_result,
        available_days, available_hours, availability, motivation,
        commitment_agreement, referral_source, status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'application_received'
      )
      RETURNING *;
    `;
    const res = await db.query(text, [
      full_name,
      email,
      phone,
      finalTelegram,
      finalUniversity,
      campus || null,
      finalFieldOfStudy,
      finalAcademicYear,
      subjectsArray,
      Boolean(has_teaching_experience),
      finalExperienceDuration,
      experience_details || null,
      cgpa !== null && cgpa !== undefined && cgpa !== '' ? Number(cgpa) : null,
      entrance_exam_stream,
      entrance_exam_result !== null &&
      entrance_exam_result !== undefined &&
      entrance_exam_result !== ''
        ? Number(entrance_exam_result)
        : null,
      availableDaysArray,
      Array.isArray(available_hours) ? available_hours : ['Morning'],
      finalAvailability,
      motivationText,
      commitment_agreement === true || commitment_agreement === 'true',
      referral_source || null,
    ]);
    return res.rows[0];
  },

  /**
   * Find mentor application by ID
   */
  async findApplicationById(id) {
    const text = `
      SELECT *
      FROM mentor_applications
      WHERE id = $1 AND deleted_at IS NULL
      LIMIT 1;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Retrieve active mentor applications with optional status filter and pagination
   */
  async findAllApplications({ status = null, limit = 50, offset = 0 } = {}) {
    const text = `
      SELECT *
      FROM mentor_applications
      WHERE deleted_at IS NULL
        AND ($1::mentor_application_status IS NULL OR status = $1)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const res = await db.query(text, [status, limit, offset]);
    return res.rows;
  },

  /**
   * Count mentor applications matching status filter
   */
  async countApplications({ status = null } = {}) {
    const text = `
      SELECT COUNT(*)::int AS count
      FROM mentor_applications
      WHERE deleted_at IS NULL
        AND ($1::mentor_application_status IS NULL OR status = $1);
    `;
    const res = await db.query(text, [status]);
    return res.rows[0]?.count || 0;
  },

  /**
   * Aggregate candidate volume across each stage of screening pipeline
   */
  async countApplicationsByStatus() {
    const text = `
      SELECT
        status,
        COUNT(*)::int AS count
      FROM mentor_applications
      WHERE deleted_at IS NULL
      GROUP BY status
      ORDER BY
        CASE status
          WHEN 'application_received' THEN 1
          WHEN 'under_review'        THEN 2
          WHEN 'interview_stage'     THEN 3
          WHEN 'accepted'            THEN 4
          WHEN 'onboarding'          THEN 5
          WHEN 'rejected'            THEN 6
        END;
    `;
    const res = await db.query(text);
    return res.rows;
  },

  /**
   * Update status of an application (Query 3 from SRS)
   */
  async updateApplicationStatus(id, status) {
    const text = `
      UPDATE mentor_applications
      SET status = $1::mentor_application_status, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id, full_name, email, status, updated_at;
    `;
    const res = await db.query(text, [status, id]);
    return res.rows[0] || null;
  },

  /**
   * Activate an accepted mentor in a single ACID transaction (Query 4 from SRS)
   * Creates mentor_profiles row, updates application to 'onboarding', writes audit_log.
   */
  async activateMentorTransaction({ applicationId, adminUser, passwordHash }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Verify application exists and is accepted
      const checkRes = await client.query(
        `SELECT * FROM mentor_applications WHERE id = $1 AND deleted_at IS NULL FOR UPDATE;`,
        [applicationId]
      );
      if (checkRes.rows.length === 0) {
        throw new Error('Mentor application not found');
      }
      const app = checkRes.rows[0];
      if (app.status !== 'accepted') {
        throw new Error(
          `Cannot activate mentor application with status '${app.status}'. Status must be 'accepted'.`
        );
      }

      // Check if mentor profile already exists
      const existingProfile = await client.query(
        `SELECT id FROM mentor_profiles WHERE application_id = $1 LIMIT 1;`,
        [applicationId]
      );
      if (existingProfile.rows.length > 0) {
        throw new Error('A mentor profile has already been activated for this application.');
      }

      // 2. Insert mentor profile
      const insertProfileText = `
        INSERT INTO mentor_profiles (
          application_id, name, email, password_hash, phone,
          university, field_of_study, subject_specializations, availability, account_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
        RETURNING id, application_id, name, email, phone, university, field_of_study,
                  subject_specializations, availability, account_status, created_at;
      `;
      const profileRes = await client.query(insertProfileText, [
        app.id,
        app.full_name,
        app.email,
        passwordHash,
        app.phone,
        app.university,
        app.field_of_study,
        app.subjects,
        app.availability,
      ]);
      const newProfile = profileRes.rows[0];

      // 3. Update application status to onboarding
      await client.query(
        `UPDATE mentor_applications SET status = 'onboarding', updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
        [applicationId]
      );

      // 4. Record audit_log entry
      const insertAuditText = `
        INSERT INTO audit_log (
          actor_type, actor_id, actor_email, action, target_table, target_id, metadata
        )
        VALUES ('admin', $1, $2, 'activate', 'mentor_profiles', $3, $4);
      `;
      const metadata = JSON.stringify({
        application_id: applicationId,
        mentor_email: app.email,
        activated_at: new Date().toISOString(),
      });
      await client.query(insertAuditText, [adminUser.id, adminUser.email, newProfile.id, metadata]);

      await client.query('COMMIT');
      return newProfile;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Find mentor profile by ID
   */
  async findProfileById(id) {
    const text = `
      SELECT id, application_id, name, email, phone, university,
             field_of_study, subject_specializations, availability, account_status, created_at, updated_at
      FROM mentor_profiles
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Find active mentor profile by email (for mentor login)
   */
  async findProfileByEmail(email) {
    const text = `
      SELECT id, application_id, name, email, password_hash, phone, university,
             field_of_study, subject_specializations, availability, account_status, created_at
      FROM mentor_profiles
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const res = await db.query(text, [email]);
    return res.rows[0] || null;
  },

  /**
   * Update mentor profile (availability, phone, subject_specializations)
   */
  async updateProfile(id, { availability, phone, subject_specializations }) {
    const text = `
      UPDATE mentor_profiles
      SET
        availability = COALESCE($1, availability),
        phone = COALESCE($2, phone),
        subject_specializations = COALESCE($3, subject_specializations),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND account_status = 'active'
      RETURNING id, application_id, name, email, phone, university,
                field_of_study, subject_specializations, availability, account_status, updated_at;
    `;
    const res = await db.query(text, [availability, phone, subject_specializations, id]);
    return res.rows[0] || null;
  },

  /**
   * Legacy helpers for existing tests / controllers
   */
  async findByUserId(id) {
    return this.findProfileById(id);
  },

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

  async countActiveMentors() {
    const text = `SELECT COUNT(*)::int AS count FROM mentor_profiles WHERE account_status = 'active';`;
    const res = await db.query(text);
    return res.rows[0]?.count || 0;
  },

  async countPendingApplications() {
    const text = `
      SELECT COUNT(*)::int AS count
      FROM mentor_applications
      WHERE status IN ('application_received', 'under_review') AND deleted_at IS NULL;
    `;
    const res = await db.query(text);
    return res.rows[0]?.count || 0;
  },
};

module.exports = mentorRepository;
