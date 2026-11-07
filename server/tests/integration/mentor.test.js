/**
 * Integration Test: Mentor Portal Endpoints
 * Tests:
 * 1. Mentor login (only active accounts allowed, 403 on suspended/inactive)
 * 2. GET /mentor/me (own profile)
 * 3. PATCH /mentor/me (update availability, university, subjects)
 * 4. PATCH /mentor/me/password (update password with verification)
 * 5. POST /mentor/reports (file session support report)
 * 6. Mentors CANNOT list reports (GET /mentor/reports returns 404)
 * 7. Role enforcement (mentor blocked with 403 from admin routes)
 *
 * Traces to SRS: FR-7.2, FR-7.3, FR-7.4, FR-7.5, FR-8.1, FR-8.2, FR-8.3
 */

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const db = require('../../src/config/db');

describe('Mentor Portal Endpoints (V1)', () => {
  let mentorToken = '';
  let mentorId = null;
  let mentor2Token = '';
  let mentor2Id = null;
  const mentorEmail = `mentor_test_${Date.now()}@bilunex.org`;
  const mentor2Email = `mentor2_test_${Date.now()}@bilunex.org`;
  const suspendedEmail = `suspended_mentor_${Date.now()}@bilunex.org`;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('MentorPass2026!', 12);

    // 1. Create active mentor application & profile (Mentor 1)
    const appRes = await db.query(
      `
      INSERT INTO mentor_applications (
        full_name, email, phone, university, field_of_study, year_of_study, subjects, availability, motivation, status
      )
      VALUES ('Active Mentor User', $1, '+251911776655', 'AAU', 'Mathematics', '4th', '{"Calculus"}', 'Evenings', 'Passionate about mentoring.', 'onboarding')
      RETURNING id;
    `,
      [mentorEmail]
    );

    const profileRes = await db.query(
      `
      INSERT INTO mentor_profiles (
        application_id, full_name, email, password_hash, university, field_of_study, subjects, availability, account_status
      )
      VALUES ($1, 'Active Mentor User', $2, $3, 'AAU', 'Mathematics', '{"Calculus"}', 'Evenings', 'active')
      RETURNING id;
    `,
      [appRes.rows[0].id, mentorEmail, passwordHash]
    );
    mentorId = profileRes.rows[0].id;

    // 2. Create second active mentor (Mentor 2)
    const app2Res = await db.query(
      `
      INSERT INTO mentor_applications (
        full_name, email, phone, university, field_of_study, year_of_study, subjects, availability, motivation, status
      )
      VALUES ('Second Active Mentor', $1, '+251911332211', 'ASTU', 'Electrical Engineering', '4th', '{"Physics"}', 'Morning Only', 'Mentoring passion.', 'onboarding')
      RETURNING id;
    `,
      [mentor2Email]
    );

    const profile2Res = await db.query(
      `
      INSERT INTO mentor_profiles (
        application_id, full_name, email, password_hash, university, field_of_study, subjects, availability, account_status
      )
      VALUES ($1, 'Second Active Mentor', $2, $3, 'ASTU', 'Electrical Engineering', '{"Physics"}', 'Morning Only', 'active')
      RETURNING id;
    `,
      [app2Res.rows[0].id, mentor2Email, passwordHash]
    );
    mentor2Id = profile2Res.rows[0].id;

    // 3. Create suspended mentor application & profile
    const suspAppRes = await db.query(
      `
      INSERT INTO mentor_applications (
        full_name, email, phone, university, field_of_study, year_of_study, subjects, availability, motivation, status
      )
      VALUES ('Suspended Mentor', $1, '+251911998877', 'AAU', 'Physics', '3rd', '{"Physics"}', 'Weekends', 'I want to mentor.', 'onboarding')
      RETURNING id;
    `,
      [suspendedEmail]
    );

    await db.query(
      `
      INSERT INTO mentor_profiles (
        application_id, full_name, email, password_hash, university, field_of_study, subjects, availability, account_status
      )
      VALUES ($1, 'Suspended Mentor', $2, $3, 'AAU', 'Physics', '{"Physics"}', 'Weekends', 'suspended');
    `,
      [suspAppRes.rows[0].id, suspendedEmail, passwordHash]
    );
  });

  afterAll(async () => {
    await db.closePool();
  });

  describe('POST /api/v1/mentor/auth/login', () => {
    test('should authenticate active mentor and return JWT', async () => {
      const res = await request(app).post('/api/v1/mentor/auth/login').send({
        email: mentorEmail,
        password: 'MentorPass2026!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(mentorEmail);
      expect(res.body.data.user.role).toBe('mentor');
      expect(res.body.data.user).not.toHaveProperty('password_hash');

      mentorToken = res.body.data.token;
    });

    test('should authenticate mentor 2 and return JWT', async () => {
      const res = await request(app).post('/api/v1/mentor/auth/login').send({
        email: mentor2Email,
        password: 'MentorPass2026!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      mentor2Token = res.body.data.token;
    });

    test('should clear bilunex_portal_token cookie on logout', async () => {
      const res = await request(app).post('/api/v1/mentor/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('bilunex_portal_token=;'))).toBe(true);
    });

    test('should reject invalid password with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/v1/mentor/auth/login').send({
        email: mentorEmail,
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should reject suspended mentor with 403 Forbidden', async () => {
      const res = await request(app).post('/api/v1/mentor/auth/login').send({
        email: suspendedEmail,
        password: 'MentorPass2026!',
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Account is inactive or suspended');
    });
  });

  describe('GET /api/v1/mentor/me', () => {
    test('should retrieve own profile for authenticated mentor', async () => {
      const res = await request(app)
        .get('/api/v1/mentor/me')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(mentorId);
      expect(res.body.data.email).toBe(mentorEmail);
      expect(res.body.data).not.toHaveProperty('password_hash');
    });

    test('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/mentor/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/mentor/me', () => {
    test('should update profile fields (availability, subjects)', async () => {
      const res = await request(app)
        .patch('/api/v1/mentor/me')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          availability: 'Weekdays after 5pm and Saturday mornings',
          subjects: ['Calculus', 'Linear Algebra'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.availability).toBe('Weekdays after 5pm and Saturday mornings');
      expect(res.body.data.subjects).toEqual(['Calculus', 'Linear Algebra']);
    });

    test('should reject modification of email or account_status', async () => {
      const res = await request(app)
        .patch('/api/v1/mentor/me')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          email: 'hacked@bilunex.org',
          account_status: 'suspended',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/mentor/me/password', () => {
    test('should reject incorrect current password', async () => {
      const res = await request(app)
        .patch('/api/v1/mentor/me/password')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          current_password: 'IncorrectCurrentPassword!',
          new_password: 'BrandNewPassword2026!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should successfully change password with valid credentials', async () => {
      const res = await request(app)
        .patch('/api/v1/mentor/me/password')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          current_password: 'MentorPass2026!',
          new_password: 'BrandNewPassword2026!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify that new password works on login
      const loginRes = await request(app).post('/api/v1/mentor/auth/login').send({
        email: mentorEmail,
        password: 'BrandNewPassword2026!',
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/mentor/reports (FR-8.1, FR-8.2)', () => {
    test('should submit a student support report locked to mentor ID', async () => {
      const payload = {
        student_name: 'Yonas Tsegaye',
        support_need: 'Autism Spectrum - Sensory Sensitivity',
        observations:
          'Student performs very well in algebra but experiences sensory overload in loud environments.',
        recommended_action: 'Hold mentoring sessions in quiet rooms with minimal distraction.',
      };

      const res = await request(app)
        .post('/api/v1/mentor/reports')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.student_name).toBe(payload.student_name);
      expect(res.body.data.mentor_id).toBe(mentorId);

      // Verify persistence in DB
      const dbCheck = await db.query('SELECT * FROM student_support_reports WHERE id = $1', [
        res.body.data.id,
      ]);
      expect(dbCheck.rows.length).toBe(1);
      expect(dbCheck.rows[0].mentor_id).toBe(mentorId);
    });

    test('should reject report submission with observations shorter than 10 characters', async () => {
      const res = await request(app)
        .post('/api/v1/mentor/reports')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          student_name: 'Yonas Tsegaye',
          support_need: 'Speech difficulty',
          observations: 'Short',
          recommended_action: 'Action',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Mentors CANNOT list reports (FR-7.5, FR-8.3)', () => {
    test('GET /api/v1/mentor/reports must return 404 Not Found', async () => {
      const res = await request(app)
        .get('/api/v1/mentor/reports')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Role Enforcement', () => {
    test('mentor token is rejected with 403 on admin routes', async () => {
      const res = await request(app)
        .get('/api/v1/admin/parents')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Mentor Data Isolation (FR-7.3, FR-7.5, FR-8.3)', () => {
    test("two mentors cannot read or edit each other's profile or data", async () => {
      // 1. Mentor 1 updates profile with specific schedule and subjects
      const updateRes = await request(app)
        .patch('/api/v1/mentor/me')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          availability: 'Mentor 1 Exclusive Hours',
          subjects: ['Calculus', 'Advanced Physics'],
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.availability).toBe('Mentor 1 Exclusive Hours');

      // 2. Mentor 2 reads own profile - verify it is completely isolated from Mentor 1
      const m2ProfileRes = await request(app)
        .get('/api/v1/mentor/me')
        .set('Authorization', `Bearer ${mentor2Token}`);
      expect(m2ProfileRes.status).toBe(200);
      expect(m2ProfileRes.body.data.id).toBe(mentor2Id);
      expect(m2ProfileRes.body.data.email).toBe(mentor2Email);
      expect(m2ProfileRes.body.data.availability).toBe('Morning Only');
      expect(m2ProfileRes.body.data.subjects).toEqual(['Physics']);

      // 3. Mentors have no endpoint to target another mentor's ID (e.g. GET /mentor/me/:id or /mentor/profile/:id)
      const targetByIdRes = await request(app)
        .get(`/api/v1/mentor/profile/${mentorId}`)
        .set('Authorization', `Bearer ${mentor2Token}`);
      expect(targetByIdRes.status).toBe(404);

      // 4. Report isolation: Mentor 2 cannot read any support reports
      const reportsRes = await request(app)
        .get('/api/v1/mentor/reports')
        .set('Authorization', `Bearer ${mentor2Token}`);
      expect(reportsRes.status).toBe(404);
    });
  });
});
