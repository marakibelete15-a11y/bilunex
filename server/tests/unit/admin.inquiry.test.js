jest.mock('../../src/repositories/inquiry.repository', () => ({
  findById: jest.fn(),
  updateStatus: jest.fn(),
  findAll: jest.fn(),
  countAll: jest.fn(),
  countByStatus: jest.fn(),
}));

jest.mock('../../src/repositories/audit_log.repository', () => ({
  create: jest.fn(),
}));

jest.mock('../../src/repositories/parent.repository', () => ({}));
jest.mock('../../src/repositories/mentor.repository', () => ({}));
jest.mock('../../src/repositories/story.repository', () => ({}));
jest.mock('../../src/repositories/report.repository', () => ({}));
jest.mock('../../src/repositories/notification_log.repository', () => ({}));
jest.mock('../../src/repositories/admin.repository', () => ({}));
jest.mock('../../src/repositories/document.repository', () => ({}));

const inquiryRepository = require('../../src/repositories/inquiry.repository');
const auditLogRepository = require('../../src/repositories/audit_log.repository');
const adminService = require('../../src/services/admin.service');

describe('Admin Service - updateInquiryStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updates inquiry status and records audit log', async () => {
    const existing = {
      id: 5,
      name: 'Liya Kebede',
      email: 'liya@example.com',
      status: 'new',
    };
    const updated = {
      ...existing,
      status: 'in_progress',
    };

    inquiryRepository.findById.mockResolvedValue(existing);
    inquiryRepository.updateStatus.mockResolvedValue(updated);
    auditLogRepository.create.mockResolvedValue({});

    const result = await adminService.updateInquiryStatus({
      id: 5,
      status: 'in_progress',
      adminUser: { id: 1 },
      ip: '127.0.0.1',
    });

    expect(inquiryRepository.findById).toHaveBeenCalledWith(5);
    expect(inquiryRepository.updateStatus).toHaveBeenCalledWith(5, 'in_progress');
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: 1,
        actor_role: 'admin',
        action: 'UPDATE_INQUIRY_STATUS',
        entity_type: 'inquiries',
        entity_id: 5,
        metadata: {
          previous_status: 'new',
          new_status: 'in_progress',
        },
      })
    );
    expect(result.status).toBe('in_progress');
  });

  test('throws 404 error if inquiry does not exist', async () => {
    inquiryRepository.findById.mockResolvedValue(null);

    await expect(
      adminService.updateInquiryStatus({
        id: 999,
        status: 'resolved',
        adminUser: { id: 1 },
      })
    ).rejects.toThrow('Inquiry not found');

    expect(inquiryRepository.updateStatus).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });
});
