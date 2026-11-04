jest.mock('../../src/repositories/report.repository', () => ({
  create: jest.fn(),
  findByMentorId: jest.fn(),
}));
jest.mock('../../src/repositories/mentor.repository', () => ({}));
jest.mock('../../src/services/notification.service', () => ({
  notifySupportReportFiled: jest.fn(),
}));

const reportRepository = require('../../src/repositories/report.repository');
const notificationService = require('../../src/services/notification.service');
const mentorService = require('../../src/services/mentor.service');

describe('Mentor report submission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns the saved report without waiting for notification delivery', async () => {
    const savedReport = { id: 72, mentor_id: 4, student_name: 'Student Example' };
    reportRepository.create.mockResolvedValue(savedReport);
    notificationService.notifySupportReportFiled.mockImplementation(() => new Promise(() => {}));

    const result = await Promise.race([
      mentorService.submitSupportReport(4, 'Mentor Example', { student_name: 'Student Example' }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Report waited for email dispatch')), 100)
      ),
    ]);

    expect(result).toBe(savedReport);
    expect(reportRepository.create).toHaveBeenCalledWith({
      mentor_id: 4,
      student_name: 'Student Example',
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
