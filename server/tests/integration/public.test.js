/**
 * Integration Test: Public API Endpoints
 * Tests:
 * 1. POST /api/v1/public/parent-registrations
 * 2. POST /api/v1/public/mentor-applications
 * 3. POST /api/v1/public/inquiries
 * 4. Strict schema validation (rejecting unknown fields)
 * 5. Safe email dispatch: Email transport failure never blocks HTTP 201 response
 */

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');
const nodemailer = require('nodemailer');
const { _resetTransporter } = require('../../src/services/notification.service');

jest.mock('nodemailer');

describe('Public Endpoints (Intake & Safe Notifications)', () => {
  beforeEach(() => {
    _resetTransporter();
    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-mail-id' }),
    });
  });

  afterAll(async () => {
    await db.closePool();
  });

  describe('POST /api/v1/public/parent-registrations', () => {
    test('should successfully register a parent and child with valid data', async () => {
      const payload = {
        parent_name: 'Abebe Bikila',
        email: `abebe_${Date.now()}@example.com`,
        phone: '+251911223344',
        telegram_handle: '@abebe_test',
        child_name: 'Dawit Abebe',
        grade_level: 'Grade 9',
        subjects: ['Mathematics', 'Physics'],
        support_category: 'tutoring',
        notes: 'Needs help preparing for national exam.',
      };

      const res = await request(app).post('/api/v1/public/parent-registrations').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.parent_name).toBe(payload.parent_name);
      expect(res.body.data.child_name).toBe(payload.child_name);
      expect(res.body.data.status).toBe('new');
    });

    test('should persist registration row to PostgreSQL database and confirm via direct SELECT', async () => {
      const uniqueEmail = `persist_${Date.now()}@example.com`;
      const payload = {
        parent_name: 'Direct DB Verification Parent',
        email: uniqueEmail,
        phone: '+251933445566',
        telegram_handle: '@db_verify',
        child_name: 'Persisted Child',
        grade_level: 'Grade 10',
        subjects: ['Chemistry', 'Biology'],
        support_category: 'combined',
        notes: 'Verifying end-to-end database persistence in parent_registrations table.',
      };

      const res = await request(app).post('/api/v1/public/parent-registrations').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      const createdId = res.body.data.id;

      // Execute direct SELECT query against PostgreSQL to prove row was physically written
      const queryResult = await db.query(
        'SELECT id, parent_name, email, child_name, grade_level, subjects, support_category, status FROM parent_registrations WHERE id = $1',
        [createdId]
      );

      expect(queryResult.rows.length).toBe(1);
      const row = queryResult.rows[0];
      expect(row.id).toBe(createdId);
      expect(row.parent_name).toBe(payload.parent_name);
      expect(row.email).toBe(payload.email);
      expect(row.child_name).toBe(payload.child_name);
      expect(row.grade_level).toBe(payload.grade_level);
      expect(row.subjects).toEqual(payload.subjects);
      expect(row.support_category).toBe(payload.support_category);
      expect(row.status).toBe('new');
    });

    test('should reject payload with unknown extra fields (strict validation)', async () => {
      const payload = {
        parent_name: 'Sara Tesfaye',
        email: 'sara@example.com',
        phone: '+251922334455',
        child_name: 'Helen Dawit',
        grade_level: 'Grade 7',
        subjects: ['English'],
        support_category: 'mentoring',
        unauthorized_field: 'malicious_input', // Strict mode violation
      };

      const res = await request(app).post('/api/v1/public/parent-registrations').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(
        res.body.errors.some(e => e.message.includes('unrecognized_keys') || e.field === '')
      ).toBe(true);
    });

    test('should reject missing required fields with 400 Bad Request', async () => {
      const res = await request(app).post('/api/v1/public/parent-registrations').send({
        parent_name: 'A', // Too short
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    test('should still store registration (HTTP 201) even if email dispatch fails (Safe Dispatch)', async () => {
      // Simulate SMTP network failure
      nodemailer.createTransport.mockReturnValue({
        sendMail: jest.fn().mockRejectedValue(new Error('SMTP Connection Refused: test failure')),
      });

      const uniqueEmail = `safe_email_${Date.now()}@example.com`;
      const payload = {
        parent_name: 'Hanna Kebede',
        email: uniqueEmail,
        phone: '+251933445566',
        child_name: 'Yonas Kebede',
        grade_level: 'Grade 11',
        subjects: ['Chemistry'],
        support_category: 'combined',
      };

      const res = await request(app).post('/api/v1/public/parent-registrations').send(payload);

      // CRITICAL: Must succeed with 201 despite SMTP failure!
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();

      // Verify the failure was logged to notification_log table
      const logRes = await db.query(
        `SELECT * FROM notification_log WHERE recipient = $1 ORDER BY created_at DESC LIMIT 1;`,
        [uniqueEmail]
      );
      expect(logRes.rows.length).toBe(1);
      expect(logRes.rows[0].status).toBe('failure');
      expect(logRes.rows[0].error_message).toContain('SMTP Connection Refused');
    });
  });

  describe('POST /api/v1/public/mentor-applications', () => {
    test('should submit mentor application with status application_received', async () => {
      const payload = {
        full_name: 'Solomon Tadesse',
        email: `solomon_${Date.now()}@example.com`,
        phone: '+251944556677',
        telegram_handle: '@solomon_mentor',
        university: 'Addis Ababa University',
        field_of_study: 'Computer Science',
        academic_year: '4th Year',
        subjects: ['Computer Science', 'Mathematics'],
        availability: 'Weekends 10am-4pm',
        motivation: 'I want to mentor high school students in programming and STEM careers.',
      };

      const res = await request(app).post('/api/v1/public/mentor-applications').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('application_received');
      expect(res.body.data.full_name).toBe(payload.full_name);
    });

    test('should reject application with motivation shorter than 10 characters', async () => {
      const payload = {
        full_name: 'Short Motivation Applicant',
        email: 'short@example.com',
        phone: '+251911000000',
        university: 'AAU',
        field_of_study: 'Physics',
        academic_year: '3rd Year',
        subjects: ['Physics'],
        availability: 'Evenings',
        motivation: 'Short', // Less than 10 chars
      };

      const res = await request(app).post('/api/v1/public/mentor-applications').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field === 'motivation')).toBe(true);
    });
  });

  describe('POST /api/v1/public/inquiries', () => {
    test('should save a public inquiry with status new', async () => {
      const payload = {
        name: 'Bethlehem Girma',
        email: 'bethlehem@example.com',
        phone: '+251911998877',
        inquiry_type: 'counseling',
        message: 'I would like to inquire about counseling services for high school anxiety.',
      };

      const res = await request(app).post('/api/v1/public/inquiries').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('new');
      expect(res.body.data.inquiry_type).toBe('counseling');
    });

    test('should reject inquiry with invalid inquiry_type', async () => {
      const payload = {
        name: 'Invalid Inquiry',
        email: 'invalid@example.com',
        inquiry_type: 'unknown_type',
        message: 'Hello, this is a test inquiry message.',
      };

      const res = await request(app).post('/api/v1/public/inquiries').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
