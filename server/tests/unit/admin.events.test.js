jest.mock('../../src/repositories/parent.repository', () => ({
  findWithFilters: jest.fn(),
  countByStatus: jest.fn(),
}));
jest.mock('../../src/repositories/mentor.repository', () => ({
  findAllApplications: jest.fn(),
  countApplicationsByStatus: jest.fn(),
}));
jest.mock('../../src/repositories/inquiry.repository', () => ({
  findWithFilters: jest.fn(),
  countByStatus: jest.fn(),
}));
jest.mock('../../src/repositories/story.repository', () => ({
  findAll: jest.fn(),
  countPending: jest.fn(),
}));
jest.mock('../../src/repositories/report.repository', () => ({
  findAll: jest.fn(),
}));
jest.mock('../../src/repositories/notification_log.repository', () => ({
  findAll: jest.fn(),
  countFailuresLast7Days: jest.fn(),
}));
jest.mock('../../src/repositories/admin.repository', () => ({}));
jest.mock('../../src/repositories/audit_log.repository', () => ({}));
jest.mock('../../src/repositories/document.repository', () => ({}));

const parentRepository = require('../../src/repositories/parent.repository');
const mentorRepository = require('../../src/repositories/mentor.repository');
const inquiryRepository = require('../../src/repositories/inquiry.repository');
const storyRepository = require('../../src/repositories/story.repository');
const reportRepository = require('../../src/repositories/report.repository');
const notificationLogRepository = require('../../src/repositories/notification_log.repository');
const adminService = require('../../src/services/admin.service');

describe('Admin Service - getAllEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('aggregates and sorts events from all sources chronologically descending', async () => {
    parentRepository.findWithFilters.mockResolvedValue([
      {
        id: 1,
        parent_name: 'Parent Alex',
        child_name: 'Child Jordan',
        grade_level: 'Grade 8',
        subjects: ['Math'],
        email: 'alex@example.com',
        status: 'new',
        created_at: '2026-11-05T08:00:00Z',
      },
    ]);
    mentorRepository.findAllApplications.mockResolvedValue([
      {
        id: 2,
        full_name: 'Mentor Taylor',
        university: 'Addis Ababa University',
        field_of_study: 'Engineering',
        academic_year: '3rd Year',
        email: 'taylor@example.com',
        status: 'application_received',
        created_at: '2026-11-05T09:00:00Z',
      },
    ]);
    inquiryRepository.findWithFilters.mockResolvedValue([
      {
        id: 3,
        name: 'Inquirer Sam',
        inquiry_type: 'counseling',
        message: 'Looking for counseling guidance',
        email: 'sam@example.com',
        status: 'new',
        created_at: '2026-11-05T07:30:00Z',
      },
    ]);
    storyRepository.findAll.mockResolvedValue([]);
    reportRepository.findAll.mockResolvedValue([
      {
        id: 4,
        student_name: 'Child Chris',
        mentor_name: 'Dr. Mentor',
        mentor_email: 'mentor@example.com',
        support_need_observed: 'Autism learning support',
        observations: 'Needs quiet environment',
        recommended_action: 'One-on-one sessions',
        created_at: '2026-11-05T09:30:00Z',
      },
    ]);
    notificationLogRepository.findAll.mockResolvedValue([]);

    const result = await adminService.getAllEvents();

    expect(result.events.length).toBe(4);
    expect(result.total).toBe(4);
    expect(result.events[0].id).toBe('report_4');
    expect(result.events[1].id).toBe('mentor_2');
    expect(result.events[2].id).toBe('parent_1');
    expect(result.events[3].id).toBe('inquiry_3');
  });

  test('filters events by event_type correctly', async () => {
    parentRepository.findWithFilters.mockResolvedValue([
      {
        id: 1,
        parent_name: 'Parent Alex',
        child_name: 'Child Jordan',
        grade_level: 'Grade 8',
        subjects: ['Math'],
        email: 'alex@example.com',
        status: 'new',
        created_at: '2026-11-05T08:00:00Z',
      },
    ]);
    mentorRepository.findAllApplications.mockResolvedValue([
      {
        id: 2,
        full_name: 'Mentor Taylor',
        university: 'Addis Ababa University',
        field_of_study: 'Engineering',
        status: 'application_received',
        created_at: '2026-11-05T09:00:00Z',
      },
    ]);
    inquiryRepository.findWithFilters.mockResolvedValue([]);
    storyRepository.findAll.mockResolvedValue([]);
    reportRepository.findAll.mockResolvedValue([]);
    notificationLogRepository.findAll.mockResolvedValue([]);

    const result = await adminService.getAllEvents({ event_type: 'parent_registration' });

    expect(result.events.length).toBe(1);
    expect(result.events[0].event_type).toBe('parent_registration');
    expect(result.events[0].actor).toBe('Parent Alex');
  });

  test('filters events by search query', async () => {
    parentRepository.findWithFilters.mockResolvedValue([
      {
        id: 1,
        parent_name: 'Abebe Bikila',
        child_name: 'Kidane',
        grade_level: 'Grade 10',
        subjects: ['Physics'],
        status: 'new',
        created_at: '2026-11-05T08:00:00Z',
      },
    ]);
    mentorRepository.findAllApplications.mockResolvedValue([
      {
        id: 2,
        full_name: 'Sara Tesfaye',
        university: 'Hawassa University',
        field_of_study: 'Medicine',
        status: 'application_received',
        created_at: '2026-11-05T09:00:00Z',
      },
    ]);
    inquiryRepository.findWithFilters.mockResolvedValue([]);
    storyRepository.findAll.mockResolvedValue([]);
    reportRepository.findAll.mockResolvedValue([]);
    notificationLogRepository.findAll.mockResolvedValue([]);

    const result = await adminService.getAllEvents({ search: 'Abebe' });

    expect(result.events.length).toBe(1);
    expect(result.events[0].actor).toBe('Abebe Bikila');
  });
});
