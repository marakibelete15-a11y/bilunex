/**
 * Unit Tests: Notification Service
 * Validates that email failures NEVER throw unhandled errors into the caller,
 * and ensures proper roles, templates, and multiple recipients are handled.
 */

const {
  safeSendNotification,
  notifyParentRegistration,
  notifyMentorApplication,
  _resetTransporter,
} = require('../../src/services/notification.service');
const nodemailer = require('nodemailer');
const notificationLogRepository = require('../../src/repositories/notification_log.repository');
const env = require('../../src/config/env');

// Mock nodemailer and repository
jest.mock('nodemailer');
jest.mock('../../src/repositories/notification_log.repository');

describe('Notification Service (Safe Dispatch)', () => {
  let sendMailMock;

  beforeEach(() => {
    _resetTransporter();
    sendMailMock = jest.fn().mockResolvedValue({ messageId: 'msg-12345' });
    nodemailer.createTransport.mockReturnValue({
      sendMail: sendMailMock,
    });
    nodemailer.getTestMessageUrl = jest
      .fn()
      .mockReturnValue('https://ethereal.email/message/test-id');
    notificationLogRepository.create = jest.fn().mockResolvedValue({ id: 1 });
  });

  afterEach(() => {
    _resetTransporter();
    jest.clearAllMocks();
  });

  test('should return success: true when email transport succeeds', async () => {
    const result = await safeSendNotification({
      to: 'parent@example.com',
      recipient_role: 'parent',
      subject: 'Test Subject',
      text: 'Test message body',
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.previewUrl).toBe('https://ethereal.email/message/test-id');
    expect(notificationLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'parent@example.com',
        recipient_role: 'parent',
        status: 'success',
      })
    );
  });

  test('should catch SMTP transport failure, log error, and NEVER throw an exception', async () => {
    sendMailMock.mockRejectedValue(new Error('Connection timed out: SMTP unreachable'));

    let thrownError = null;
    let result = null;

    try {
      result = await safeSendNotification({
        to: 'student@example.com',
        recipient_role: 'student',
        subject: 'Urgent Notification',
        text: 'System message',
      });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeNull();
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toContain('SMTP unreachable');
    expect(notificationLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'student@example.com',
        recipient_role: 'student',
        status: 'timeout',
      })
    );
  });

  test('falls back to logged_not_sent when development Ethereal delivery is unavailable', async () => {
    const original = {
      node: env.NODE_ENV,
      host: env.EMAIL_HOST,
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    };
    env.NODE_ENV = 'development';
    env.EMAIL_HOST = '';
    env.EMAIL_USER = '';
    env.EMAIL_PASS = '';
    nodemailer.createTestAccount.mockResolvedValue({ user: 'offline-user', pass: 'offline-pass' });
    sendMailMock.mockRejectedValue(new Error('SMTP timed out'));
    const result = await safeSendNotification({
      to: 'parent@example.com',
      recipient_role: 'parent',
      subject: 'Offline check',
      text: 'Body text',
    });
    expect(result.loggedNotSent).toBe(true);
    expect(notificationLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'logged_not_sent', recipient_role: 'parent' })
    );
    Object.assign(env, {
      NODE_ENV: original.node,
      EMAIL_HOST: original.host,
      EMAIL_USER: original.user,
      EMAIL_PASS: original.pass,
    });
  });

  test('includes Reply-To only when EMAIL_REPLY_TO is configured', async () => {
    const previous = env.EMAIL_REPLY_TO;
    delete env.EMAIL_REPLY_TO;
    await safeSendNotification({ to: 'one@example.com', subject: 'No reply-to', text: 'Body' });
    expect(sendMailMock.mock.calls[0][0]).not.toHaveProperty('replyTo');
    env.EMAIL_REPLY_TO = 'Bilunexmedia@gmail.com';
    await safeSendNotification({ to: 'two@example.com', subject: 'Reply-to', text: 'Body' });
    expect(sendMailMock.mock.calls[1][0].replyTo).toBe('Bilunexmedia@gmail.com');
    if (previous === undefined) delete env.EMAIL_REPLY_TO;
    else env.EMAIL_REPLY_TO = previous;
  });

  test('notifyParentRegistration should send parent confirmation and admin alert without personal data', async () => {
    const reg = {
      id: 42,
      parent_name: 'Abebe Bikila',
      email: 'abebe@example.com',
      student_name: 'Dawit Abebe',
    };

    await notifyParentRegistration(reg);

    // Expect at least 2 emails sent: 1 admin alert, 1 parent confirmation
    expect(sendMailMock).toHaveBeenCalledTimes(2);

    // Verify parent confirmation contains required note and role
    const parentCall = sendMailMock.mock.calls.find(call => call[0].to === 'abebe@example.com');
    expect(parentCall).toBeDefined();
    expect(parentCall[0].subject).toContain('Student Registration Received');
    expect(parentCall[0].text).toContain('our team will review your requirements');
    expect(parentCall[0].text).toContain('#42');

    // Verify admin alert contains summary link and NO sensitive details
    const adminCall = sendMailMock.mock.calls.find(
      call => call[0].to === env.ADMIN_NOTIFICATION_EMAIL
    );
    expect(adminCall).toBeDefined();
    expect(adminCall[0].subject).toContain('[Bilunex Alert]');
    expect(adminCall[0].text).toContain('Reference ID: #42');
    expect(adminCall[0].text).toContain('/admin/index.html');
    expect(adminCall[0].text).not.toContain('Dawit Abebe');
  });

  test('notifyMentorApplication should send mentor confirmation and admin alert without personal data', async () => {
    const app = {
      id: 99,
      full_name: 'Tigist Assefa',
      email: 'tigist@example.com',
    };

    await notifyMentorApplication(app);

    expect(sendMailMock).toHaveBeenCalledTimes(2);

    const mentorCall = sendMailMock.mock.calls.find(call => call[0].to === 'tigist@example.com');
    expect(mentorCall).toBeDefined();
    expect(mentorCall[0].subject).toContain('Mentor Application Received');
    expect(mentorCall[0].text).toContain('#99');

    const adminCall = sendMailMock.mock.calls.find(
      call => call[0].to === env.ADMIN_NOTIFICATION_EMAIL
    );
    expect(adminCall).toBeDefined();
    expect(adminCall[0].subject).toContain('[Bilunex Alert] New Mentor Application #99');
    expect(adminCall[0].text).toContain('/admin/index.html');
    expect(adminCall[0].text).not.toContain('tigist@example.com');
  });
});
