/**
 * Bilunex - Mentor Repository
 * Parameterized queries for mentor_applications and mentor_profiles tables.
 */

const db = require('../config/db');

const mentorRepository = {
  // --- Mentor Applications ---

  async createApplication({
    full_name,
    email,
    phone,
    telegram_handle = null,
    university,
    field_of_study,
    year_of_study,
    subjects,
    availability,
    motivation,
  }) {
    const text = `
      INSERT INTO mentor_applications (
        full_name, email, phone, telegram_handle, university,
        field_of_study, year_of_study, subjects, availability, motivation, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'application_received')
      RETURNING *;
    `;
    const res = await db.query(text, [
      full_name,
      email,
      phone,
      telegram_handle || null,
      university,
      field_of_study,
      year_of_study,
      subjects,
      availability,
      motivation,
    ]);
    return res.rows[0];
  },

  async findApplicationById(id) {
    const text = `
      SELECT a.*, u.name AS reviewer_name, u.email AS reviewer_email
      FROM mentor_applications a
      LEFT JOIN admin_users u ON a.reviewed_by = u.id
      WHERE a.id = $1
      LIMIT 1;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  async findAllApplications({ status = null, limit = 50, offset = 0 } = {}) {
    const text = `
      SELECT a.*, u.name AS reviewer_name
      FROM mentor_applications a
      LEFT JOIN admin_users u ON a.reviewed_by = u.id
      WHERE ($1::application_status IS NULL OR a.status = $1)
      ORDER BY a.created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const res = await db.query(text, [status, limit, offset]);
    return res.rows;
  },

  async countApplications({ status = null } = {}) {
    const text = `
      SELECT COUNT(*)::int AS count
      FROM mentor_applications
      WHERE ($1::application_status IS NULL OR status = $1);
    `;
    const res = await db.query(text, [status]);
    return res.rows[0]?.count || 0;
  },

  async updateApplicationStatus(id, { status, admin_notes = null, reviewed_by = null }) {
    const text = `
      UPDATE mentor_applications
      SET
        status = $1::application_status,
        admin_notes = COALESCE($2, admin_notes),
        reviewed_by = COALESCE($3, reviewed_by),
        updated_at = now()
      WHERE id = $4
      RETURNING *;
    `;
    const res = await db.query(text, [status, admin_notes, reviewed_by, id]);
    return res.rows[0] || null;
  },

  async countApplicationsByStatus() {
    const text = `
      SELECT status, COUNT(*)::int AS count
      FROM mentor_applications
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

  // --- Mentor Profiles & Activation ---

  async findProfileByEmail(email) {
    const text = `
      SELECT id, application_id, full_name, email, password_hash,
             university, field_of_study, subjects, availability,
             account_status, activated_by, activated_at, last_login_at, created_at, updated_at
      FROM mentor_profiles
      WHERE email = $1::citext
      LIMIT 1;
    `;
    const res = await db.query(text, [email]);
    return res.rows[0] || null;
  },

  async findProfileById(id) {
    const text = `
      SELECT id, application_id, full_name, email, password_hash,
             university, field_of_study, subjects, availability,
             account_status, activated_by, activated_at, last_login_at, created_at, updated_at
      FROM mentor_profiles
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  async updateProfile(id, { full_name, university, field_of_study, subjects, availability }) {
    const text = `
      UPDATE mentor_profiles
      SET
        full_name = COALESCE($1, full_name),
        university = COALESCE($2, university),
        field_of_study = COALESCE($3, field_of_study),
        subjects = COALESCE($4, subjects),
        availability = COALESCE($5, availability),
        updated_at = now()
      WHERE id = $6 AND account_status = 'active'
      RETURNING id, application_id, full_name, email,
                university, field_of_study, subjects, availability,
                account_status, created_at, updated_at;
    `;
    const res = await db.query(text, [
      full_name || null,
      university || null,
      field_of_study || null,
      subjects || null,
      availability || null,
      id,
    ]);
    return res.rows[0] || null;
  },

  async updatePassword(id, passwordHash) {
    const text = `
      UPDATE mentor_profiles
      SET password_hash = $1, updated_at = now()
      WHERE id = $2
      RETURNING id;
    `;
    const res = await db.query(text, [passwordHash, id]);
    return res.rows[0] || null;
  },

  async updateLastLogin(id) {
    const text = `
      UPDATE mentor_profiles
      SET last_login_at = now(), updated_at = now()
      WHERE id = $1
      RETURNING id, last_login_at;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  async countActiveMentors() {
    const text = `SELECT COUNT(*)::int AS count FROM mentor_profiles WHERE account_status = 'active';`;
    const res = await db.query(text);
    return res.rows[0]?.count || 0;
  },

  async activateMentorTransaction({ applicationId, adminId, adminUser, passwordHash }) {
    const effectiveAdminId = adminId || adminUser?.id || null;
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Lock and verify application
      const appRes = await client.query(
        `SELECT * FROM mentor_applications WHERE id = $1 FOR UPDATE;`,
        [applicationId]
      );
      if (appRes.rows.length === 0) {
        throw new Error('Mentor application not found');
      }
      const app = appRes.rows[0];

      if (app.status !== 'accepted' && app.status !== 'onboarding') {
        const err = new Error(
          `Cannot activate mentor application with status '${app.status}'. Status must be 'accepted' or 'onboarding'.`
        );
        err.statusCode = 400;
        throw err;
      }

      // 2. Ensure profile does not already exist
      const existing = await client.query(
        `SELECT id FROM mentor_profiles WHERE application_id = $1 LIMIT 1;`,
        [applicationId]
      );
      if (existing.rows.length > 0) {
        const err = new Error('A mentor profile has already been activated for this application.');
        err.statusCode = 409;
        throw err;
      }

      // 3. Insert mentor profile
      const insertProfileText = `
        INSERT INTO mentor_profiles (
          application_id, full_name, email, password_hash,
          university, field_of_study, subjects, availability,
          account_status, activated_by, activated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, now())
        RETURNING id, application_id, full_name, email, university,
                  field_of_study, subjects, availability, account_status, activated_by, activated_at, created_at;
      `;
      const profileRes = await client.query(insertProfileText, [
        app.id,
        app.full_name,
        app.email,
        passwordHash,
        app.university,
        app.field_of_study,
        app.subjects,
        app.availability,
        effectiveAdminId,
      ]);
      const newProfile = profileRes.rows[0];

      // 4. Update application status to onboarding
      await client.query(
        `UPDATE mentor_applications SET status = 'onboarding', updated_at = now() WHERE id = $1;`,
        [applicationId]
      );

      await client.query('COMMIT');
      return newProfile;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = mentorRepository;
