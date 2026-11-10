/**
 * Bilunex - Admin Service
 * Business logic for administrative functions, candidate screening, mentor activation,
 * and reporting metrics strictly conforming to SRS v1.0.
 *
 * Traces to SRS: FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5, FR-5.6, FR-5.7
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const adminRepository = require('../repositories/admin.repository');
const parentRepository = require('../repositories/parent.repository');
const mentorRepository = require('../repositories/mentor.repository');
const inquiryRepository = require('../repositories/inquiry.repository');
const reportRepository = require('../repositories/report.repository');
const notificationLogRepository = require('../repositories/notification_log.repository');

const adminService = {
  /**
   * Authenticate admin staff member and issue JWT (FR-5.1)
   */
  async login({ email, password }) {
    const admin = await adminRepository.findByEmail(email);
    if (!admin) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (!admin.is_active) {
      const error = new Error('Admin account is deactivated.');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    await adminRepository.updateLastLogin(admin.id);

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        name: admin.name,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN || '24h' }
    );

    return {
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  },

  /**
   * Get current authenticated admin profile (FR-5.1)
   */
  async getMe(adminId) {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      const error = new Error('Admin profile not found');
      error.statusCode = 404;
      throw error;
    }
    const { password_hash, ...profile } = admin;
    return profile;
  },

  /**
   * List parent registrations with search, filters, pagination (FR-5.2)
   */
  async getParentRegistrations({ filters = {} }) {
    const { status, grade_level, search, page = 1, limit = 50 } = filters;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const [registrations, total] = await Promise.all([
      parentRepository.findAll({
        status,
        grade_level,
        search,
        limit,
        offset,
      }),
      parentRepository.countAll({
        status,
        grade_level,
        search,
      }),
    ]);

    return {
      registrations,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Get single parent registration by ID (FR-5.2)
   */
  async getParentRegistrationById(id) {
    const registration = await parentRepository.findById(id);
    if (!registration) {
      const error = new Error(`Parent registration with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return registration;
  },

  /**
   * Update status of parent registration (FR-5.2)
   */
  async updateParentRegistrationStatus({ id, status }) {
    const existing = await parentRepository.findById(id);
    if (!existing) {
      const error = new Error(`Parent registration with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    const updated = await parentRepository.updateStatus(id, status);
    return updated;
  },

  /**
   * List candidate mentor applications with filtering and pagination (FR-5.3)
   */
  async getMentorApplications({ filters = {} }) {
    const { status, page = 1, limit = 50 } = filters;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const [applications, total] = await Promise.all([
      mentorRepository.findAllApplications({ status, limit, offset }),
      mentorRepository.countApplications({ status }),
    ]);

    return {
      applications,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Get single mentor application by ID (FR-5.3)
   */
  async getMentorApplicationById(id) {
    const application = await mentorRepository.findApplicationById(id);
    if (!application) {
      const error = new Error(`Mentor application with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return application;
  },

  /**
   * Update mentor application screening status (FR-5.3)
   */
  async updateMentorApplicationStatus({ id, status, admin_notes = null, adminUser }) {
    const updated = await mentorRepository.updateApplicationStatus(id, {
      status,
      admin_notes,
      reviewed_by: adminUser?.id || null,
    });

    if (!updated) {
      const error = new Error(`Mentor application with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    return updated;
  },

  /**
   * Activate an accepted candidate into a verified mentor profile with credentials (FR-5.6, FR-7.1)
   */
  async activateMentor({ applicationId, initialPassword, adminUser }) {
    const rawPassword = initialPassword || 'BilunexPass2026!';
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const mentorProfile = await mentorRepository.activateMentorTransaction({
      applicationId,
      adminUser,
      adminId: adminUser?.id || null,
      passwordHash,
    });

    return {
      ...mentorProfile,
      initial_password: rawPassword,
    };
  },

  /**
   * List contact and counseling inquiries with filters (FR-5.4)
   */
  async getInquiries({ filters = {} }) {
    const { inquiry_type, status, page = 1, limit = 50 } = filters;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const [inquiries, total] = await Promise.all([
      inquiryRepository.findAll({ inquiry_type, status, limit, offset }),
      inquiryRepository.countAll({ inquiry_type, status }),
    ]);

    return {
      inquiries,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Get single inquiry by ID (FR-5.4)
   */
  async getInquiryById(id) {
    const inquiry = await inquiryRepository.findById(id);
    if (!inquiry) {
      const error = new Error(`Inquiry with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return inquiry;
  },

  /**
   * Update inquiry status (FR-5.4)
   */
  async updateInquiryStatus({ id, status }) {
    const existing = await inquiryRepository.findById(id);
    if (!existing) {
      const error = new Error(`Inquiry with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    const updated = await inquiryRepository.updateStatus(id, status);
    return updated;
  },

  /**
   * Retrieve all student support reports with mentor details (FR-5.7, FR-8.3)
   */
  async getStudentSupportReports({ filters = {} }) {
    const { page = 1, limit = 50 } = filters;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const [reports, total] = await Promise.all([
      reportRepository.findAll({ limit, offset }),
      reportRepository.countAll(),
    ]);

    return {
      reports,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Get single student support report by ID (FR-5.7, FR-8.3)
   */
  async getStudentSupportReportById(id) {
    const report = await reportRepository.findById(id);
    if (!report) {
      const error = new Error(`Student support report with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return report;
  },

  /**
   * Aggregate operational summary metrics (FR-5.5)
   */
  async getReportsSummary() {
    const [
      parentCounts,
      mentorCounts,
      activeMentorsCount,
      inquiryCounts,
      supportReportsCount,
      failedNotificationsCount,
    ] = await Promise.all([
      parentRepository.countByStatus().catch(() => []),
      mentorRepository.countApplicationsByStatus().catch(() => []),
      mentorRepository.countActiveMentors().catch(() => 0),
      inquiryRepository.countByStatus().catch(() => []),
      reportRepository.countAll().catch(() => 0),
      notificationLogRepository.countFailuresLast7Days().catch(() => 0),
    ]);

    return {
      parent_registrations: parentCounts,
      mentor_applications: mentorCounts,
      active_mentors: activeMentorsCount,
      inquiries: inquiryCounts,
      support_reports_count: supportReportsCount,
      failed_notifications_last_7_days: failedNotificationsCount,
    };
  },

  /**
   * Reset a mentor's password (Admin only)
   * Updates mentor_profiles.password_hash only.
   * NEVER returns or logs the password or hash.
   */
  async resetMentorPassword({ mentorId, newPassword }) {
    const mentor = await mentorRepository.findProfileById(mentorId);
    if (!mentor) {
      const error = new Error('Mentor profile not found');
      error.statusCode = 404;
      throw error;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await mentorRepository.updatePassword(mentorId, passwordHash);

    return { message: 'Mentor password has been successfully reset.' };
  },

  /**
   * Admin change own password
   * Verifies current password, rejects if new equals current, updates hash.
   * NEVER returns or logs the password or hash.
   */
  async changeAdminPassword({ adminId, currentPassword, newPassword }) {
    const admin = await adminRepository.findByIdWithPassword(adminId);
    if (!admin) {
      const error = new Error('Admin not found');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) {
      const error = new Error('Current password does not match');
      error.statusCode = 400;
      throw error;
    }

    if (currentPassword === newPassword) {
      const error = new Error('New password cannot be the same as the current password');
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await adminRepository.updatePassword(adminId, passwordHash);

    return { message: 'Password updated successfully' };
  },
};

module.exports = adminService;
