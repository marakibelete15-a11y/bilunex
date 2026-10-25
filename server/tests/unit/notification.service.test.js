/**
 * Unit Tests: Notification Service
 * Validates that email failures NEVER throw unhandled errors into the caller.
 */

const {
  safeSendNotification,
  _resetTransporter,
} = require('../../src/services/notification.service');
const nodemailer = require('nodemailer');

// Mock nodemailer transport to simulate failures
jest.mock('nodemailer');

describe('Notification Service (Safe Dispatch)', () => {
  beforeEach(() => {
    _resetTransporter();
  });

  afterEach(() => {
    _resetTransporter();
    jest.clearAllMocks();
  });

  test('should return success: true when email transport succeeds', async () => {
    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'msg-12345' }),
    });

    const result = await safeSendNotification({
      to: 'parent@example.com',
      subject: 'Test Subject',
      text: 'Test message body',
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  test('should catch SMTP transport failure, log error, and NEVER throw an exception', async () => {
    // Simulate SMTP network disconnect or credential failure
    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockRejectedValue(new Error('Connection timed out: SMTP unreachable')),
    });

    let thrownError = null;
    let result = null;

    try {
      result = await safeSendNotification({
        to: 'student@example.com',
        subject: 'Urgent Notification',
        text: 'System message',
      });
    } catch (err) {
      thrownError = err;
    }

    // Critical Requirement 13 Verification: Must never throw!
    expect(thrownError).toBeNull();
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toContain('SMTP unreachable');
  });
});
