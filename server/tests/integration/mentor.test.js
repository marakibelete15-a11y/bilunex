/**
 * Integration Test: Mentor Portal Endpoints
 * Tests:
 * 1. Mentor login (only active accounts allowed)
 * 2. GET /mentor/profile (own profile)
 * 3. PATCH /mentor/profile (update availability, phone, subject_specializations)
 * 4. POST /mentor/reports (file session support report)
 * 5. GET /mentor/reports (strict query isolation across different mentors)
 * 6. Role enforcement (admin blocked from mentor-only routes)
 */

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const db = require('../../src/config/db');

describe('Mentor Portal Endpoints (V1)', () => {
  let mentorAToken = '';
  let mentorBToken = '';
  let mentorAId = null;
  let mentorBId = null;
  let adminToken = '';

  beforeAll(async () => {
    // 1. Obtain admin token for role rejection test
    const adminRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@bilunex.org', password: 'Admin123!' });
    adminToken = adminRes.body.data.token;

    // 2. Fetch seeded Mentor A (Dr. Sarah Johnson)
    const mentorARes = await db.query(
      `SELECT id, email FROM mentor_profiles WHERE email = 'mentor@bilunex.org' LIMIT 1;`
    );
    mentorAId = mentorARes.rows[0].id;

    // 3. Create a second mentor (Mentor B) for isolation testing
    const passwordHash = await bcrypt.hash('MentorPass2026!', 10);
    const appBRes = await db.query(
      `INSERT INTO mentor_applications (
         full_name, email, phone, university, field_of_study, academic_year, subjects, availability, motivation, status
       )
       VALUES ('Mentor B User', 'mentor_b@bilunex.org', '+251911776655', 'AAU', 'Math', '4th', '{"Math"}', 'Evenings', 'Long motivation for mentor b', 'accepted')
       ON CONFLICT (LOWER(email)) WHERE deleted_at IS NULL DO UPDATE SET status = 'accepted'
       RETURNING id;`
    );

    const profileBRes = await db.query(
      `INSERT INTO mentor_profiles (
         application_id, name, email, password_hash, phone, university, field_of_study,
         subject_specializations, availability, account_status
       )
       VALUES ($1, 'Mentor B User', 'mentor_b@bilunex.org', $2, '+251911776655', 'AAU', 'Math', '{"Calculus"}', 'Evenings', 'active')
       ON CONFLICT (application_id) DO UPDATE SET account_status = 'active', password_hash = $2
       RETURNING id;`,
      [appBRes.rows[0].id, passwordHash]
    );
    mentorBId = profileBRes.rows[0].id;

    // 4. Create an inactive mentor to test login restriction
    const appInactive = await db.query(
      `INSERT INTO mentor_applications (
         full_name, email, phone, university, field_of_study, academic_year, subjects, availability, motivation, status
       )
       VALUES ('Inactive Mentor', 'inactive_mentor@bilunex.org', '+251911000999', 'AAU', 'Biology', '2nd', '{"Biology"}', 'Weekends', 'Motivation here for inactive', 'accepted')
       ON CONFLICT (LOWER(email)) WHERE deleted_at IS NULL DO UPDATE SET status = 'accepted'
       RETURNING id;`
    );

    await db.query(
      `INSERT INTO mentor_profiles (
         application_id, name, email, password_hash, phone, university, field_of_study,
         subject_specializations, availability, account_status
       )
       VALUES ($1, 'Inactive Mentor', 'inactive_mentor@bilunex.org', $2, '+251911000999', 'AAU', 'Bio', '{"Bio"}', 'Weekends', 'inactive')
       ON CONFLICT (application_id) DO UPDATE SET account_status = 'inactive', password_hash = $2;`,
      [appInactive.rows[0].id, passwordHash]
    );
  });

  afterAll(async () => {
    await db.closePool();
  });

  describe('POST /api/v1/mentor/auth/login', () => {
    test('should authenticate active mentor and return JWT', async () => {
      const res = await request(app).post('/api/v1/mentor/auth/login').send({
        email: 'mentor@bilunex.org',
        password: 'Mentor123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('mentor@bilunex.org');
      expect(res.body.data.user.role).toBe('mentor');
      expect(res.body.data.user).not.toHaveProperty('password_hash');

      mentorAToken = res.body.data.token;
    });

    test('should authenticate Mentor B and store token', async () => {
      const res = await request(app).post('/api/v1/mentor/auth/login').send({
        email: 'mentor_b@bilunex.org',
        password: 'MentorPass2026!',
      });

      expect(res.status).toBe(200);
      mentorBToken = res.body.data.token;
    });

    test('should reject login for inactive mentor account with 401', async () => {
      const res = await request(app).post('/api/v1/mentor/auth/login').send({
        email: 'inactive_mentor@bilunex.org',
        password: 'MentorPass2026!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('inactive or suspended');
    });

    test('should reject incorrect password with 401', async () => {
      const res = await request(app).post('/api/v1/mentor/auth/login').send({
        email: 'mentor@bilunex.org',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/mentor/profile', () => {
    test('should return own mentor profile for authenticated mentor', async () => {
      const res = await request(app)
        .get('/api/v1/mentor/profile')
        .set('Authorization', `Bearer ${mentorAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(mentorAId);
      expect(res.body.data.email).toBe('mentor@bilunex.org');
      expect(res.body.data).not.toHaveProperty('password_hash');
    });

    test('should reject admin token with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/mentor/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('restricted to Bilunex mentors');
    });
  });

  describe('PATCH /api/v1/mentor/profile', () => {
    test('should update phone, availability, and subject specializations', async () => {
      const updates = {
        phone: '+251911998877',
        availability: 'Weekdays after 6 PM',
        subject_specializations: ['Advanced Physics', 'Calculus BC'],
      };

      const res = await request(app)
        .patch('/api/v1/mentor/profile')
        .set('Authorization', `Bearer ${mentorAToken}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe(updates.phone);
      expect(res.body.data.availability).toBe(updates.availability);
      expect(res.body.data.subject_specializations).toEqual(updates.subject_specializations);
    });

    test('should reject unknown extra fields with 400 (strict validation)', async () => {
      const res = await request(app)
        .patch('/api/v1/mentor/profile')
        .set('Authorization', `Bearer ${mentorAToken}`)
        .send({
          account_status: 'super_admin', // Unauthorized field
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST & GET /api/v1/mentor/reports (Strict Cross-Mentor Isolation)', () => {
    let reportAId = null;
    let reportBId = null;

    test('Mentor A should submit a student support report', async () => {
      const payload = {
        student_name: 'Student Alpha',
        support_need_observed: 'Difficulty understanding kinematic equations',
        observations:
          'Student engaged well with graphical velocity-time analysis and completed 4 problem sets.',
        recommended_action:
          'Assign practice sheet 4.2; revisit acceleration vectors in next session.',
      };

      const res = await request(app)
        .post('/api/v1/mentor/reports')
        .set('Authorization', `Bearer ${mentorAToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student_name).toBe(payload.student_name);
      expect(res.body.data.mentor_id).toBe(mentorAId);
      reportAId = res.body.data.id;
    });

    test('Mentor B should submit a student support report', async () => {
      const payload = {
        student_name: 'Student Beta',
        support_need_observed: 'Algebraic manipulation with fractions',
        observations:
          'Student struggles with common denominators; made good progress with visual pie charts.',
        recommended_action: 'Work on worksheet 2B; check in next Tuesday.',
      };

      const res = await request(app)
        .post('/api/v1/mentor/reports')
        .set('Authorization', `Bearer ${mentorBToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student_name).toBe(payload.student_name);
      expect(res.body.data.mentor_id).toBe(mentorBId);
      reportBId = res.body.data.id;
    });

    test('Mentor A should ONLY see their own reports and NOT Mentor B reports (Isolation)', async () => {
      const res = await request(app)
        .get('/api/v1/mentor/reports')
        .set('Authorization', `Bearer ${mentorAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const reports = res.body.data;

      // Mentor A should see Report A
      expect(reports.some(r => r.id === reportAId)).toBe(true);

      // Mentor A MUST NOT see Report B!
      expect(reports.some(r => r.id === reportBId)).toBe(false);

      // Every report returned must belong to Mentor A
      expect(reports.every(r => r.mentor_id === mentorAId)).toBe(true);
    });

    test('Mentor B should ONLY see their own reports and NOT Mentor A reports (Isolation)', async () => {
      const res = await request(app)
        .get('/api/v1/mentor/reports')
        .set('Authorization', `Bearer ${mentorBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const reports = res.body.data;

      // Mentor B should see Report B
      expect(reports.some(r => r.id === reportBId)).toBe(true);

      // Mentor B MUST NOT see Report A!
      expect(reports.some(r => r.id === reportAId)).toBe(false);

      // Every report returned must belong to Mentor B
      expect(reports.every(r => r.mentor_id === mentorBId)).toBe(true);
    });

    test('should reject report with short observations (<10 chars) with 400', async () => {
      const res = await request(app)
        .post('/api/v1/mentor/reports')
        .set('Authorization', `Bearer ${mentorAToken}`)
        .send({
          student_name: 'Test Student',
          support_need_observed: 'Math difficulty',
          observations: 'Short', // Less than 10 characters
          recommended_action: 'Practice more',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
