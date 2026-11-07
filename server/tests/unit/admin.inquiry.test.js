/**
 * Unit Test: Admin Service Inquiry Status Management
 * Tests updating inquiry status and proper error handling.
 */

jest.mock('../../src/repositories/inquiry.repository', () => ({
  findById: jest.fn(),
  updateStatus: jest.fn(),
  findAll: jest.fn(),
  countAll: jest.fn(),
  countByStatus: jest.fn(),
}));

jest.mock('../../src/repositories/parent.repository', () => ({}));
jest.mock('../../src/repositories/mentor.repository', () => ({}));
jest.mock('../../src/repositories/report.repository', () => ({}));
jest.mock('../../src/repositories/notification_log.repository', () => ({}));
jest.mock('../../src/repositories/admin.repository', () => ({}));

const inquiryRepository = require('../../src/repositories/inquiry.repository');
const adminService = require('../../src/services/admin.service');

describe('Admin Service - updateInquiryStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updates inquiry status successfully', async () => {
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

    const result = await adminService.updateInquiryStatus({
      id: 5,
      status: 'in_progress',
    });

    expect(inquiryRepository.findById).toHaveBeenCalledWith(5);
    expect(inquiryRepository.updateStatus).toHaveBeenCalledWith(5, 'in_progress');
    expect(result.status).toBe('in_progress');
  });

  test('throws 404 error if inquiry does not exist', async () => {
    inquiryRepository.findById.mockResolvedValue(null);

    await expect(
      adminService.updateInquiryStatus({
        id: 999,
        status: 'resolved',
      })
    ).rejects.toThrow('Inquiry with ID 999 not found');

    expect(inquiryRepository.updateStatus).not.toHaveBeenCalled();
  });
});
