/**
 * Integration Test: Admin Management Endpoints
 * Tests:
 * 1. Admin login & current profile (/auth/login, /auth/me)
 * 2. Parent registrations with search, filter, pagination
 * 3. Mentor applications list & status update
 * 4. Mentor activation transaction (/mentor-applications/:id/activate)
 * 5. Inquiries list & status update with filters
 * 6. Reports summary (counts grouped by status)
 * 7. Student support reports list with mentor names
 * 8. Role-based security: mentor token rejected with 403
 *
 * Traces to SRS: FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5, FR-5.6, FR-5.7
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const db = require('../../src/config/db');
const env = require('../../src/config/env');

describe('Admin Management Endpoints (V1)', () => {
  let adminToken = '';
  let mentorToken = '';
  let adminUser = null;
  let testParentId = null;
  let testApplicationId = null;
  let testInquiryId = null;
  let testReportId = null;
  let testApplicantEmail = '';

  beforeAll(async () => {
    // Ensure admin user exists with known test password
    const adminHash = await bcrypt.hash('Admin123!', 12);
    await db.query(
      `
      INSERT INTO admin_users (name, email, password_hash, role, is_active)
      VALUES ('System Administrator', 'admin@bilunex.org', $1, 'super_admin', true)
      ON CONFLICT (email) DO UPDATE
      SET password_hash = $1, is_active = true;
    `,
      [adminHash]
    );

    // Generate valid mentor token for role rejection testing
    mentorToken = jwt.sign(
      { id: 999, email: 'mentor.test@bilunex.org', role: 'mentor', name: 'Test Mentor' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create test records for admin tests
    const parentRes = await db.query(`
      INSERT INTO parent_registrations (parent_name, email, phone, child_name, grade_level, subjects, status)
      VALUES ('Admin Test Parent', 'admin.parent.test@example.com', '+251911223344', 'Child Test', 'Grade 8', '{"Math"}', 'new')
      RETURNING id;
    `);
    testParentId = parentRes.rows[0].id;

    const applicantEmail = `admin.applicant.${Date.now()}@example.com`;
    const appRes = await db.query(
      `
      INSERT INTO mentor_applications (full_name, email, phone, university, field_of_study, year_of_study, subjects, availability, motivation, status)
      VALUES ('Admin Test Applicant', $1, '+251922334455', 'AAU', 'Engineering', '3rd', '{"Physics"}', 'Weekends', 'I want to mentor high school students.', 'accepted')
      RETURNING id;
    `,
      [applicantEmail]
    );
    testApplicationId = appRes.rows[0].id;
    testApplicantEmail = applicantEmail;

    const inqRes = await db.query(
      `
      INSERT INTO inquiries (name, email, inquiry_type, message, status)
      VALUES ('Admin Test Inquirer', $1, 'general', 'Hello from test', 'new')
      RETURNING id;
    `,
      [`inq.${Date.now()}@example.com`]
    );
    testInquiryId = inqRes.rows[0].id;

    // Seed mentor profile and support report for support report tests
    const seedAppRes = await db.query(
      `
      INSERT INTO mentor_applications (full_name, email, phone, university, field_of_study, year_of_study, subjects, availability, motivation, status)
      VALUES ('Report Seed Mentor', $1, '+251911887766', 'AAU', 'Math', '4th', '{"Math"}', 'Weekends', 'Mentoring motivation.', 'onboarding')
      RETURNING id;
    `,
      [`seed.mentor.${Date.now()}@example.com`]
    );

    const seedProfileRes = await db.query(
      `
      INSERT INTO mentor_profiles (application_id, full_name, email, password_hash, university, field_of_study, subjects, availability, account_status)
      VALUES ($1, 'Report Seed Mentor', $2, 'hash12345678901234567890', 'AAU', 'Math', '{"Math"}', 'Weekends', 'active')
      RETURNING id;
    `,
      [seedAppRes.rows[0].id, `seed.mentor.${Date.now()}@example.com`]
    );

    const reportRes = await db.query(
      `
      INSERT INTO student_support_reports (mentor_id, student_name, support_need, observations, recommended_action)
      VALUES ($1, 'Reported Student', 'Attention deficit', 'Student struggles with focus on geometry.', 'Break lessons into 20-min chunks.')
      RETURNING id;
    `,
      [seedProfileRes.rows[0].id]
    );
    testReportId = reportRes.rows[0].id;
  });

  afterAll(async () => {
    await db.closePool();
  });

  describe('POST /api/v1/admin/auth/login', () => {
    test('should authenticate admin and return JWT with user profile', async () => {
      const res = await request(app).post('/api/v1/admin/auth/login').send({
        email: 'admin@bilunex.org',
        password: 'Admin123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@bilunex.org');
      expect(res.body.data.user).not.toHaveProperty('password_hash');

      adminToken = res.body.data.token;
      adminUser = res.body.data.user;
      expect(['admin', 'super_admin']).toContain(adminUser.role);
    });

    test('should reject invalid password with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/v1/admin/auth/login').send({
        email: 'admin@bilunex.org',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    test('should reject non-admin email with 401', async () => {
      const res = await request(app).post('/api/v1/admin/auth/login').send({
        email: 'nonexistent@bilunex.org',
        password: 'Admin123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admin/auth/me', () => {
    test('should return current admin profile for authenticated admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('admin@bilunex.org');
      expect(res.body.data).not.toHaveProperty('password_hash');
    });

    test('should reject request without token with 401', async () => {
      const res = await request(app).get('/api/v1/admin/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should reject mentor token with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/auth/me')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Parent Registrations (Admin View & Status)', () => {
    test('should retrieve parent registrations list with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/parents')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.registrations)).toBe(true);
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
    });

    test('should retrieve a single parent registration by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/parents/${testParentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testParentId);
    });

    test('should update status of parent registration to contacted', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/parents/${testParentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'contacted' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('contacted');
    });

    test('should reject invalid status with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/parents/${testParentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status_value' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Mentor Applications (Admin Review & Activation)', () => {
    test('should retrieve mentor applications list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/mentor-applications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.applications)).toBe(true);
    });

    test('should retrieve single mentor application by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/mentor-applications/${testApplicationId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testApplicationId);
    });

    test('should activate accepted mentor into mentor_profiles via ACID transaction', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/mentor-applications/${testApplicationId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ initial_password: 'InitialPassword123!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe(testApplicantEmail);
      expect(res.body.data.account_status).toBe('active');

      // Verify in DB that application status is now onboarding
      const appCheck = await db.query('SELECT status FROM mentor_applications WHERE id = $1', [
        testApplicationId,
      ]);
      expect(appCheck.rows[0].status).toBe('onboarding');

      // Create a support report by this newly activated mentor for subsequent report tests
      const reportRes = await db.query(
        `
        INSERT INTO student_support_reports (mentor_id, student_name, support_need, observations, recommended_action)
        VALUES ($1, 'Reported Student', 'Attention deficit', 'Student struggles with focus on geometry.', 'Break lessons into 20-min chunks.')
        RETURNING id;
      `,
        [res.body.data.id]
      );
      testReportId = reportRes.rows[0].id;
    });
  });

  describe('Inquiries (Admin Management)', () => {
    test('should retrieve inquiries list with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/inquiries')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.inquiries)).toBe(true);
    });

    test('should update inquiry status to in_progress', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/inquiries/${testInquiryId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inquiry.status).toBe('in_progress');
    });
  });

  describe('Student Support Reports (Admin View)', () => {
    test('should retrieve student support reports list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/support-reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.reports)).toBe(true);
      expect(res.body.data.reports.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.reports[0]).toHaveProperty('mentor_name');
    });

    test('should retrieve single student support report by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/support-reports/${testReportId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testReportId);
      expect(res.body.data.student_name).toBe('Reported Student');
    });
  });

  describe('Reporting Summary & Stats', () => {
    test('should retrieve operational stats grouped by status', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('parent_registrations');
      expect(res.body.data).toHaveProperty('mentor_applications');
      expect(res.body.data).toHaveProperty('inquiries');
      expect(res.body.data).toHaveProperty('active_mentors');
      expect(res.body.data).toHaveProperty('support_reports_count');
    });
  });
});
