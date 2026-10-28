/**
 * Integration Test: Public API Endpoints
 * Tests:
 * 1. POST /api/v1/public/parent-registrations
 * 2. POST /api/v1/public/mentor-applications
 * 3. POST /api/v1/public/inquiries
 * 4. Strict schema validation (rejecting unknown fields)
 * 5. Safe email dispatch: Email transport failure never blocks HTTP 201 response
 */

const { Buffer } = require('buffer');
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');
const nodemailer = require('nodemailer');
const { _resetTransporter } = require('../../src/services/notification.service');

jest.mock('nodemailer');

const waitForNotification = async (relatedType, relatedId, role, timeoutMs = 12000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = await db.query(
      'SELECT * FROM notification_log WHERE related_entity_type=$1 AND related_entity_id=$2 AND recipient_role=$3 ORDER BY id DESC LIMIT 1',
      [relatedType, relatedId, role]
    );
    if (result.rows[0]) return result.rows[0];
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`Notification log missing for ${relatedType} ${relatedId} (${role})`);
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

    test('should reject non-Ethiopian phone number with 400 Bad Request', async () => {
      const payload = {
        parent_name: 'Invalid Phone Parent',
        email: `invalid_phone_${Date.now()}@example.com`,
        phone: '+15551234567', // Not Ethiopian format
        child_name: 'Test Child',
        grade_level: 'Grade 8',
        subjects: ['English'],
        support_category: 'tutoring',
      };

      const res = await request(app).post('/api/v1/public/parent-registrations').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field === 'phone')).toBe(true);
    });

    test('should accept 09XXXXXXXX format, preferred title, secondary phone, and communication methods', async () => {
      const payload = {
        preferred_title: 'Dr.',
        parent_name: 'Dr. Almaz Bekele',
        email: `almaz_${Date.now()}@example.com`,
        phone: '0911223344', // 09 format
        secondary_phone: '+251988776655', // +2519 format
        preferred_communication_method: ['Telegram', 'Phone call'],
        telegram_handle: '@dralmaz',
        child_name: 'Kalkidan Bekele',
        grade_level: 'Grade 12',
        subjects: ['Biology', 'Chemistry'],
        support_category: 'combined',
        notes: 'Preparing for national university entrance exam.',
      };

      const res = await request(app).post('/api/v1/public/parent-registrations').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preferred_title).toBe('Dr.');
      expect(res.body.data.phone).toBe('0911223344');
      expect(res.body.data.secondary_phone).toBe('+251988776655');
      expect(res.body.data.preferred_communication_method).toEqual(['telegram', 'phone_call']);
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
      const log = await waitForNotification('parent_registrations', res.body.data.id, 'parent');
      expect(log.status).toBe('failure');
      expect(log.error_message).toContain('SMTP Connection Refused');
    });

    test('returns immediately while a transport hangs and eventually logs its timeout', async () => {
      nodemailer.createTransport.mockReturnValue({
        sendMail: jest.fn(() => new Promise(() => {})),
      });
      const start = Date.now();
      const res = await request(app)
        .post('/api/v1/public/parent-registrations')
        .send({
          parent_name: 'Timeout Verification',
          email: `timeout_${Date.now()}@example.com`,
          phone: '+251933445566',
          child_name: 'Timeout Student',
          grade_level: 'Grade 11',
          subjects: ['Mathematics'],
          support_category: 'tutoring',
        });
      expect(res.status).toBe(201);
      expect(Date.now() - start).toBeLessThan(2000);
      const log = await waitForNotification('parent_registrations', res.body.data.id, 'admin');
      expect(log.status).toBe('timeout');
      expect(log.error_message).toMatch(/timed out/i);
    }, 15000);

    test('logs both parent and admin notification attempts after successful registration', async () => {
      nodemailer.createTransport.mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'ok' }),
      });
      const res = await request(app)
        .post('/api/v1/public/parent-registrations')
        .send({
          parent_name: 'Success Verification',
          email: `success_${Date.now()}@example.com`,
          phone: '+251933445566',
          child_name: 'Success Student',
          grade_level: 'Grade 10',
          subjects: ['Physics'],
          support_category: 'mentoring',
        });
      expect(res.status).toBe(201);
      const adminLog = await waitForNotification('parent_registrations', res.body.data.id, 'admin');
      const parentLog = await waitForNotification(
        'parent_registrations',
        res.body.data.id,
        'parent'
      );
      expect(adminLog.status).toBe('success');
      expect(parentLog.status).toBe('success');
    });
  });

  describe('POST /api/v1/public/mentor-applications', () => {
    test('logs admin and mentor notification attempts after successful application', async () => {
      nodemailer.createTransport.mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'ok' }),
      });
      const res = await request(app)
        .post('/api/v1/public/mentor-applications')
        .send({
          full_name: 'Mentor Notification Check',
          email: `mentor_${Date.now()}@example.com`,
          phone: '+251944556677',
          university_name: 'Test University',
          department: 'Math',
          year_of_study: '3rd Year',
          subjects: ['Mathematics'],
          available_days: ['Saturday'],
          available_hours: 'Morning',
          motivation: 'I enjoy supporting young learners.',
          commitment_agreement: true,
        });
      expect(res.status).toBe(201);
      const adminLog = await waitForNotification('mentor_applications', res.body.data.id, 'admin');
      const mentorLog = await waitForNotification(
        'mentor_applications',
        res.body.data.id,
        'mentor'
      );
      expect(adminLog.status).toBe('success');
      expect(mentorLog.status).toBe('success');
    });
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
        commitment_agreement: true,
      };

      const res = await request(app).post('/api/v1/public/mentor-applications').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('application_received');
      expect(res.body.data.full_name).toBe(payload.full_name);
    });

    test('should accept full mentor application with GPA, entrance exam, campus, and availability', async () => {
      const payload = {
        full_name: 'Tigist Hailu',
        email: `tigist_${Date.now()}@example.com`,
        phone: '0912345678',
        telegram_username: '@tigist_h',
        university_name: 'Addis Ababa University',
        campus: 'Arat Kilo',
        department: 'Software Engineering',
        year_of_study: '3rd Year',
        subjects: ['Algorithms', 'Python'],
        has_teaching_experience: true,
        teaching_experience_duration: '2 years',
        experience_details: 'Private coding tutor for preparatory students',
        gpa: 3.85,
        entrance_exam_result: 615.5,
        available_days: ['Monday', 'Thursday', 'Saturday'],
        available_hours: '5 PM - 8 PM',
        motivation: 'Passionate about guiding the next generation of engineers in Ethiopia.',
        commitment_agreement: true,
        referral_source: 'University Club',
      };

      const res = await request(app).post('/api/v1/public/mentor-applications').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.campus).toBe('Arat Kilo');
      expect(Number(res.body.data.gpa)).toBe(3.85);
      expect(Number(res.body.data.entrance_exam_result)).toBe(615.5);
      expect(res.body.data.commitment_agreement).toBe(true);
      expect(res.body.data.referral_source).toBe('University Club');
    });

    test('should reject application without commitment agreement', async () => {
      const payload = {
        full_name: 'No Agreement Applicant',
        email: `noagree_${Date.now()}@example.com`,
        phone: '+251911223344',
        university: 'AAU',
        field_of_study: 'Math',
        academic_year: '2nd Year',
        subjects: ['Algebra'],
        availability: 'Weekends',
        motivation: 'I love teaching young students very much.',
        commitment_agreement: false, // Rejected!
      };

      const res = await request(app).post('/api/v1/public/mentor-applications').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field === 'commitment_agreement')).toBe(true);
    });

    test('should reject invalid GPA (> 4.0)', async () => {
      const payload = {
        full_name: 'Invalid GPA Applicant',
        email: `badgpa_${Date.now()}@example.com`,
        phone: '+251911223344',
        university: 'AAU',
        field_of_study: 'Math',
        academic_year: '2nd Year',
        subjects: ['Algebra'],
        availability: 'Weekends',
        motivation: 'I love teaching young students very much.',
        commitment_agreement: true,
        gpa: 4.5, // Invalid GPA
      };

      const res = await request(app).post('/api/v1/public/mentor-applications').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field === 'gpa')).toBe(true);
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
        commitment_agreement: true,
      };

      const res = await request(app).post('/api/v1/public/mentor-applications').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field === 'motivation')).toBe(true);
    });

    test('should accept multipart/form-data mentor application with valid PDF transcript and PNG ID photo', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 Mock PDF content for test transcript');
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);

      const res = await request(app)
        .post('/api/v1/public/mentor-applications')
        .field('full_name', 'Multipart Applicant')
        .field('email', `multipart_${Date.now()}@example.com`)
        .field('phone', '+251911335577')
        .field('university', 'Addis Ababa University')
        .field('field_of_study', 'Electrical Engineering')
        .field('academic_year', '5th Year')
        .field('subjects', JSON.stringify(['Circuits', 'Physics']))
        .field('availability', 'Weekends')
        .field('motivation', 'Passionate about engineering mentorship and helping high schoolers.')
        .field('commitment_agreement', 'true')
        .attach('transcript', pdfBuffer, 'transcript.pdf')
        .attach('id_photo', pngBuffer, 'id_photo.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();

      // Verify documents were recorded in mentor_documents table
      const docRes = await db.query(
        'SELECT * FROM mentor_documents WHERE mentor_application_id = $1 ORDER BY document_type',
        [res.body.data.id]
      );
      expect(docRes.rows.length).toBe(2);
      expect(docRes.rows[0].document_type).toBe('id_photo');
      expect(docRes.rows[0].mime_type).toBe('image/png');
      expect(docRes.rows[1].document_type).toBe('transcript');
      expect(docRes.rows[1].mime_type).toBe('application/pdf');
    });

    test('should reject upload with fake PDF (invalid magic bytes) with 400 Bad Request', async () => {
      const fakePdfBuffer = Buffer.from('NOT A REAL PDF FILE CONTENT');

      const res = await request(app)
        .post('/api/v1/public/mentor-applications')
        .field('full_name', 'Fake File Applicant')
        .field('email', `fakefile_${Date.now()}@example.com`)
        .field('phone', '+251911335577')
        .field('university', 'AAU')
        .field('field_of_study', 'CS')
        .field('academic_year', '4th')
        .field('subjects', JSON.stringify(['Math']))
        .field('availability', 'Weekends')
        .field('motivation', 'Valid motivation length for test')
        .field('commitment_agreement', 'true')
        .attach('transcript', fakePdfBuffer, 'fake.pdf');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid file type for transcript');
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
