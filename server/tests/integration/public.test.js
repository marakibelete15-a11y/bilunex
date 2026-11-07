/**
 * Integration Test: Public API Endpoints
 * Tests:
 * 1. POST /api/v1/parents/register & /api/v1/parent-registrations
 * 2. POST /api/v1/mentors/apply & /api/v1/mentor-applications
 * 3. POST /api/v1/inquiries
 * 4. Strict schema validation (rejecting unknown fields)
 * 5. Safe email dispatch: Email transport failure never blocks HTTP 201 response (FR-9.5, NFR-4)
 *
 * Traces to SRS: FR-2.1, FR-2.2, FR-2.3, FR-2.4, FR-3.1, FR-3.2, FR-3.3, FR-3.5, FR-4.1, FR-9.1, FR-9.2, FR-9.5
 */

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');
const nodemailer = require('nodemailer');
const { _resetTransporter } = require('../../src/services/notification.service');

jest.mock('nodemailer');

const waitForNotification = async (relatedTable, relatedId, type, timeoutMs = 5000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = await db.query(
      'SELECT * FROM notification_log WHERE related_table=$1 AND related_id=$2 AND notification_type=$3 ORDER BY id DESC LIMIT 1',
      [relatedTable, relatedId, type]
    );
    if (result.rows[0]) return result.rows[0];
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`Notification log missing for ${relatedTable} ${relatedId} (${type})`);
};

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

  describe('POST /api/v1/parents/register (FR-2.1)', () => {
    test('should successfully register a parent and child with valid data', async () => {
      const payload = {
        parent_name: 'Abebe Bikila',
        email: `abebe_${Date.now()}@example.com`,
        phone: '+251911223344',
        telegram_handle: '@abebe_test',
        child_name: 'Dawit Abebe',
        grade_level: 'Grade 9',
        subjects: ['Mathematics', 'Physics'],
        notes: 'Needs help preparing for national exam.',
      };

      const res = await request(app).post('/api/v1/parents/register').send(payload);

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
        notes: 'Verifying end-to-end database persistence in parent_registrations table.',
      };

      const res = await request(app).post('/api/v1/parents/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      const createdId = res.body.data.id;

      const queryResult = await db.query(
        'SELECT id, parent_name, email, child_name, grade_level, subjects, status FROM parent_registrations WHERE id = $1',
        [createdId]
      );

      expect(queryResult.rows.length).toBe(1);
      const row = queryResult.rows[0];
      expect(row.id).toBe(createdId);
      expect(row.parent_name).toBe(payload.parent_name);
      expect(row.email.toLowerCase()).toBe(payload.email.toLowerCase());
      expect(row.child_name).toBe(payload.child_name);
      expect(row.grade_level).toBe(payload.grade_level);
      expect(row.subjects).toEqual(payload.subjects);
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
        unauthorized_field: 'malicious_input',
      };

      const res = await request(app).post('/api/v1/parents/register').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    test('should reject missing required fields with 400 Bad Request', async () => {
      const res = await request(app).post('/api/v1/parents/register').send({
        parent_name: 'A', // Too short
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    test('should accept valid international phone numbers with spaces and dashes', async () => {
      const payload = {
        parent_name: 'International Parent',
        email: `intl_phone_${Date.now()}@example.com`,
        phone: '+1 (555) 123-4567',
        child_name: 'Global Child',
        grade_level: 'Grade 8',
        subjects: ['English'],
      };

      const res = await request(app).post('/api/v1/parents/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('should accept parent registration with only telegram_handle when phone is not provided', async () => {
      const payload = {
        parent_name: 'Telegram Only Parent',
        email: `tg_only_${Date.now()}@example.com`,
        telegram_handle: '@tg_parent_contact',
        child_name: 'Telegram Child',
        grade_level: 'Grade 9',
        subjects: ['Physics'],
      };

      const res = await request(app).post('/api/v1/parents/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('should reject invalid phone format with 400 Bad Request', async () => {
      const payload = {
        parent_name: 'Invalid Phone Parent',
        email: `invalid_phone_${Date.now()}@example.com`,
        phone: '12345',
        child_name: 'Test Child',
        grade_level: 'Grade 8',
        subjects: ['English'],
      };

      const res = await request(app).post('/api/v1/parents/register').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field === 'phone')).toBe(true);
    });

    test('should return 404 for removed alias route /api/v1/parent-registrations', async () => {
      const res = await request(app).post('/api/v1/parent-registrations').send({});
      expect(res.status).toBe(404);
    });

    test('should still store registration (HTTP 201) even if email dispatch fails (Safe Dispatch)', async () => {
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
      };

      const res = await request(app).post('/api/v1/parents/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();

      const log = await waitForNotification(
        'parent_registrations',
        res.body.data.id,
        'parent_confirmation'
      );
      expect(log.status).toBe('failed');
      expect(log.error_message).toContain('SMTP Connection Refused');
    });

    test('logs both parent and admin notification attempts after successful registration', async () => {
      nodemailer.createTransport.mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'ok' }),
      });
      const res = await request(app)
        .post('/api/v1/parents/register')
        .send({
          parent_name: 'Success Verification',
          email: `success_${Date.now()}@example.com`,
          phone: '+251933445566',
          child_name: 'Success Student',
          grade_level: 'Grade 10',
          subjects: ['Physics'],
        });
      expect(res.status).toBe(201);
      const adminLog = await waitForNotification(
        'parent_registrations',
        res.body.data.id,
        'admin_new_parent'
      );
      const parentLog = await waitForNotification(
        'parent_registrations',
        res.body.data.id,
        'parent_confirmation'
      );
      expect(adminLog.status).toBe('sent');
      expect(parentLog.status).toBe('sent');
    });
  });

  describe('POST /api/v1/mentors/apply (FR-3.1)', () => {
    test('should submit mentor application with status application_received', async () => {
      const payload = {
        full_name: 'Solomon Tadesse',
        email: `solomon_${Date.now()}@example.com`,
        phone: '+251944556677',
        telegram_handle: '@solomon_mentor',
        university: 'Addis Ababa University',
        field_of_study: 'Computer Science',
        year_of_study: '4th Year',
        subjects: ['Computer Science', 'Mathematics'],
        availability: 'Weekends 10am-4pm',
        motivation: 'I want to mentor high school students in programming and STEM careers.',
      };

      const res = await request(app).post('/api/v1/mentors/apply').send(payload);

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
        year_of_study: '3rd Year',
        subjects: ['Physics'],
        availability: 'Evenings',
        motivation: 'Short',
      };

      const res = await request(app).post('/api/v1/mentors/apply').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field === 'motivation')).toBe(true);
    });

    test('should return 404 for removed alias route /api/v1/mentor-applications', async () => {
      const res = await request(app).post('/api/v1/mentor-applications').send({});
      expect(res.status).toBe(404);
    });

    test('logs admin and mentor notification attempts after successful application', async () => {
      nodemailer.createTransport.mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'ok' }),
      });
      const res = await request(app)
        .post('/api/v1/mentors/apply')
        .send({
          full_name: 'Mentor Notification Check',
          email: `mentor_${Date.now()}@example.com`,
          phone: '+251944556677',
          university: 'Addis Ababa University',
          field_of_study: 'Mathematics',
          year_of_study: '3rd Year',
          subjects: ['Mathematics'],
          availability: 'Weekends',
          motivation: 'I enjoy supporting young learners through structured mentorship.',
        });
      expect(res.status).toBe(201);
      const adminLog = await waitForNotification(
        'mentor_applications',
        res.body.data.id,
        'admin_new_mentor'
      );
      const mentorLog = await waitForNotification(
        'mentor_applications',
        res.body.data.id,
        'mentor_confirmation'
      );
      expect(adminLog.status).toBe('sent');
      expect(mentorLog.status).toBe('sent');
    });
  });

  describe('POST /api/v1/inquiries', () => {
    test('should save a public inquiry with status new', async () => {
      const payload = {
        name: 'Bethlehem Girma',
        email: 'bethlehem@example.com',
        phone: '+251911998877',
        inquiry_type: 'counseling',
        message: 'I would like to inquire about counseling services for high school anxiety.',
      };

      const res = await request(app).post('/api/v1/inquiries').send(payload);

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

      const res = await request(app).post('/api/v1/inquiries').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
