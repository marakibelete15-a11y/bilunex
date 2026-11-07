/**
 * Unit Test: Mentor Service
 * Tests report submission, profile access, and non-blocking notification handling.
 */

jest.mock('../../src/repositories/report.repository', () => ({
  create: jest.fn(),
}));
jest.mock('../../src/repositories/mentor.repository', () => ({
  findProfileByEmail: jest.fn(),
  findProfileById: jest.fn(),
  updateProfile: jest.fn(),
  updatePassword: jest.fn(),
  updateLastLogin: jest.fn(),
}));
jest.mock('../../src/services/notification.service', () => ({
  notifySupportReportFiled: jest.fn(),
}));

const reportRepository = require('../../src/repositories/report.repository');
const mentorRepository = require('../../src/repositories/mentor.repository');
const notificationService = require('../../src/services/notification.service');
const mentorService = require('../../src/services/mentor.service');

describe('Mentor Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Report Submission', () => {
    test('returns the saved report without waiting for notification delivery', async () => {
      const savedReport = {
        id: 72,
        mentor_id: 4,
        student_name: 'Student Example',
        support_need: 'Need help',
        observations: 'Observations here',
        recommended_action: 'Action here',
      };
      reportRepository.create.mockResolvedValue(savedReport);
      notificationService.notifySupportReportFiled.mockImplementation(() => new Promise(() => {}));

      const result = await Promise.race([
        mentorService.submitSupportReport(4, 'Mentor Example', {
          student_name: 'Student Example',
          support_need: 'Need help',
          observations: 'Observations here',
          recommended_action: 'Action here',
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Report waited for email dispatch')), 100)
        ),
      ]);

      expect(result).toBe(savedReport);
      expect(reportRepository.create).toHaveBeenCalledWith({
        mentor_id: 4,
        student_name: 'Student Example',
        support_need: 'Need help',
        observations: 'Observations here',
        recommended_action: 'Action here',
      });
      await Promise.resolve();
      expect(notificationService.notifySupportReportFiled).toHaveBeenCalledWith(
        savedReport,
        'Mentor Example'
      );
    });

    test('does not send a notification when saving the report fails', async () => {
      const databaseError = new Error('database unavailable');
      reportRepository.create.mockRejectedValue(databaseError);

      await expect(
        mentorService.submitSupportReport(4, 'Mentor Example', { student_name: 'Student Example' })
      ).rejects.toBe(databaseError);
      expect(notificationService.notifySupportReportFiled).not.toHaveBeenCalled();
    });

    test('absorbs notification rejection after saving the report', async () => {
      const savedReport = { id: 73, mentor_id: 4 };
      reportRepository.create.mockResolvedValue(savedReport);
      notificationService.notifySupportReportFiled.mockRejectedValue(new Error('SMTP failure'));

      await expect(
        mentorService.submitSupportReport(4, 'Mentor Example', { student_name: 'Student Example' })
      ).resolves.toBe(savedReport);
      await new Promise(resolve => global.setImmediate(resolve));
    });
  });

  describe('Mentor Authentication & Account Status', () => {
    test('rejects login if account_status is not active', async () => {
      mentorRepository.findProfileByEmail.mockResolvedValue({
        id: 10,
        email: 'suspended@bilunex.org',
        password_hash: 'hashed',
        account_status: 'suspended',
      });

      await expect(
        mentorService.login({ email: 'suspended@bilunex.org', password: 'password' })
      ).rejects.toThrow('Account is inactive or suspended');
    });
  });
});
