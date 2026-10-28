/**
 * Integration Test: Admin Management Endpoints
 * Tests:
 * 1. Admin login & current profile (/auth/login, /auth/me)
 * 2. Parent registrations with search, filter, pagination & audit log
 * 3. Mentor applications list & status update (with 6 allowed statuses)
 * 4. Mentor activation transaction (/mentor-applications/:id/activate)
 * 5. Inquiries list with filters
 * 6. Reports summary (counts grouped by status)
 * 7. Student support reports list with mentor names
 * 8. Role-based security: mentor token rejected with 403
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const db = require('../../src/config/db');
const env = require('../../src/config/env');

describe('Admin Management Endpoints (V1)', () => {
  let adminToken = '';
  let mentorToken = '';
  let adminUser = null;

  beforeAll(async () => {
    // Generate valid mentor token for role rejection testing
    mentorToken = jwt.sign(
      { id: 999, email: 'mentor.test@bilunex.org', role: 'mentor', name: 'Test Mentor' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
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
      expect(adminUser.role).toBe('super_admin');
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
      expect(res.body.message).toContain('restricted to Bilunex administrators');
    });
  });

  describe('GET /api/v1/admin/parent-registrations', () => {
    test('should return paginated list and log access to audit_log', async () => {
      const res = await request(app)
        .get('/api/v1/admin/parent-registrations?limit=10&page=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.registrations)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();

      // Verify audit_log entry was recorded
      const auditRes = await db.query(
        `SELECT * FROM audit_log WHERE target_table = 'parent_registrations' AND action = 'view' ORDER BY created_at DESC LIMIT 1;`
      );
      expect(auditRes.rows.length).toBe(1);
      expect(auditRes.rows[0].actor_type).toBe('admin');
    });

    test('should filter registrations by status', async () => {
      const res = await request(app)
        .get('/api/v1/admin/parent-registrations?status=new')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.registrations.every(r => r.status === 'new')).toBe(true);
    });

    test('should search registrations by keyword', async () => {
      const res = await request(app)
        .get('/api/v1/admin/parent-registrations?search=Miller')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.registrations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/admin/mentor-applications & PATCH status', () => {
    let testAppId = null;

    beforeAll(async () => {
      // Find or insert a test application
      const checkRes = await db.query(
        `SELECT id FROM mentor_applications WHERE status = 'under_review' LIMIT 1;`
      );
      if (checkRes.rows.length > 0) {
        testAppId = checkRes.rows[0].id;
      } else {
        const ins = await db.query(
          `INSERT INTO mentor_applications (full_name, email, phone, university, field_of_study, academic_year, subjects, availability, motivation, status)
           VALUES ('Test Applicant', 'applicant.test@bilunex.org', '+251911999999', 'AAU', 'CS', '3rd', '{"CS"}', 'Weekends', 'Motivation statement here', 'under_review')
           RETURNING id;`
        );
        testAppId = ins.rows[0].id;
      }
    });

    test('should list mentor applications with status filter', async () => {
      const res = await request(app)
        .get('/api/v1/admin/mentor-applications?status=under_review')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.applications)).toBe(true);
      expect(res.body.data.applications.every(a => a.status === 'under_review')).toBe(true);
    });

    test('should update application status to interview_stage and record audit_log', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/mentor-applications/${testAppId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'interview_stage' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('interview_stage');

      // Check audit_log
      const auditRes = await db.query(
        `SELECT * FROM audit_log WHERE target_table = 'mentor_applications' AND target_id = $1 ORDER BY created_at DESC LIMIT 1;`,
        [testAppId]
      );
      expect(auditRes.rows.length).toBe(1);
      expect(auditRes.rows[0].action).toBe('update');
      expect(auditRes.rows[0].metadata.new_status).toBe('interview_stage');
    });

    test('should reject invalid status with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/mentor-applications/${testAppId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completely_invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admin/mentor-applications/:id/activate (Transaction)', () => {
    let acceptedAppId = null;

    beforeAll(async () => {
      // Create a fresh accepted application that has not yet been activated
      const email = `activate_test_${Date.now()}@example.com`;
      const res = await db.query(
        `INSERT INTO mentor_applications (
           full_name, email, phone, university, field_of_study, academic_year, subjects, availability, motivation, status
         )
         VALUES ('Activation Candidate', $1, '+251911888777', 'AAU', 'Engineering', '4th', '{"Math"}', 'Evenings', 'Long motivation for activation testing', 'accepted')
         RETURNING id;`,
        [email]
      );
      acceptedAppId = res.rows[0].id;
    });

    test('should activate accepted applicant into mentor_profiles, set application to onboarding, and log audit', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/mentor-applications/${acceptedAppId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ initial_password: 'InitialMentor2026!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.account_status).toBe('active');
      expect(res.body.data.name).toBe('Activation Candidate');

      // Verify application was moved to 'onboarding'
      const appCheck = await db.query(`SELECT status FROM mentor_applications WHERE id = $1;`, [
        acceptedAppId,
      ]);
      expect(appCheck.rows[0].status).toBe('onboarding');

      // Verify audit_log entry
      const auditRes = await db.query(
        `SELECT * FROM audit_log WHERE target_table = 'mentor_profiles' AND action = 'activate' ORDER BY created_at DESC LIMIT 1;`
      );
      expect(auditRes.rows.length).toBe(1);
    });

    test('should fail to activate if application status is not accepted', async () => {
      // Create an application with status 'under_review'
      const unacceptedRes = await db.query(
        `INSERT INTO mentor_applications (
           full_name, email, phone, university, field_of_study, academic_year, subjects, availability, motivation, status
         )
         VALUES ('Not Accepted Candidate', 'not_accepted_${Date.now()}@example.com', '+251911000111', 'AAU', 'Physics', '1st', '{"Physics"}', 'Evenings', 'Valid motivation length here', 'under_review')
         RETURNING id;`
      );
      const unacceptedId = unacceptedRes.rows[0].id;

      const res = await request(app)
        .post(`/api/v1/admin/mentor-applications/${unacceptedId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(500); // Transaction rolled back with domain error
      expect(res.body.message).toContain("Status must be 'accepted'");
    });
  });

  describe('GET /api/v1/admin/inquiries', () => {
    test('should list inquiries with optional type filter', async () => {
      const res = await request(app)
        .get('/api/v1/admin/inquiries?inquiry_type=parent_support')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.inquiries)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe('GET /api/v1/admin/reports/summary', () => {
    test('should aggregate status counts for parent registrations, mentor applications, inquiries', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('parent_registrations');
      expect(res.body.data).toHaveProperty('mentor_applications');
      expect(res.body.data).toHaveProperty('inquiries');
      expect(Array.isArray(res.body.data.parent_registrations)).toBe(true);
      expect(Array.isArray(res.body.data.mentor_applications)).toBe(true);
      expect(Array.isArray(res.body.data.inquiries)).toBe(true);
    });
  });

  describe('GET /api/v1/admin/student-support-reports', () => {
    test('should list student support reports with mentor details and record audit_log', async () => {
      const res = await request(app)
        .get('/api/v1/admin/student-support-reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.reports)).toBe(true);
      expect(res.body.data.reports.length).toBeGreaterThanOrEqual(1);

      // Verify joined mentor info
      const report = res.body.data.reports[0];
      expect(report).toHaveProperty('student_name');
      expect(report).toHaveProperty('mentor_name');
      expect(report).toHaveProperty('mentor_email');

      // Verify audit_log was recorded
      const auditRes = await db.query(
        `SELECT * FROM audit_log WHERE target_table = 'student_support_reports' AND action = 'view' ORDER BY created_at DESC LIMIT 1;`
      );
      expect(auditRes.rows.length).toBe(1);
    });
  });

  describe('GET /api/v1/admin/documents/:id/download (Secure & Audited)', () => {
    let testDocId = null;
    let testFilePath = null;

    beforeAll(async () => {
      // 1. Create a dummy file on disk in secure storage
      const { ensureStorageDirectory } = require('../../src/utils/fileSecurity');
      const fs = require('fs');
      const path = require('path');
      const dir = ensureStorageDirectory();
      testFilePath = path.join(dir, `test_download_${Date.now()}.pdf`);
      await fs.promises.writeFile(testFilePath, '%PDF-1.4 Mock document for admin download test');

      // 2. Insert document record in mentor_documents
      const docRes = await db.query(
        `INSERT INTO mentor_documents (
           mentor_application_id, document_type, original_filename,
           stored_filename, file_path, mime_type, file_size_bytes
         )
         VALUES (1, 'transcript', 'test_transcript.pdf', $1, $2, 'application/pdf', 45)
         RETURNING id;`,
        [path.basename(testFilePath), testFilePath]
      );
      testDocId = docRes.rows[0].id;
    });

    afterAll(async () => {
      const fs = require('fs');
      if (testFilePath && fs.existsSync(testFilePath)) {
        await fs.promises.unlink(testFilePath).catch(() => {});
      }
    });

    test('should allow authenticated admin to download document and record audit_log', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/documents/${testDocId}/download`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('test_transcript.pdf');
      expect(res.text).toContain('%PDF-1.4');

      // Verify audit_log entry was created
      const auditRes = await db.query(
        `SELECT * FROM audit_log WHERE target_table = 'mentor_documents' AND target_id = $1 ORDER BY created_at DESC LIMIT 1;`,
        [testDocId]
      );
      expect(auditRes.rows.length).toBe(1);
      expect(auditRes.rows[0].action).toBe('view');
      expect(auditRes.rows[0].actor_type).toBe('admin');
    });

    test('should reject unauthenticated request to download document with 401', async () => {
      const res = await request(app).get(`/api/v1/admin/documents/${testDocId}/download`);
      expect(res.status).toBe(401);
    });

    test('should return 404 for non-existent document ID', async () => {
      const res = await request(app)
        .get('/api/v1/admin/documents/999999/download')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
