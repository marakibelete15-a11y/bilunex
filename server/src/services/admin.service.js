/**
 * Bilunex - Admin Service
 * Business logic for administrative functions, candidate screening, mentor activation,
 * reports summarization, and immutable audit logging.
 */

const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const adminRepository = require('../repositories/admin.repository');
const parentRepository = require('../repositories/parent.repository');
const mentorRepository = require('../repositories/mentor.repository');
const inquiryRepository = require('../repositories/inquiry.repository');
const reportRepository = require('../repositories/report.repository');
const auditLogRepository = require('../repositories/audit_log.repository');
const documentRepository = require('../repositories/document.repository');
const logger = require('../utils/logger');

const adminService = {
  /**
   * Authenticate admin staff member and issue JWT
   */
  async login({ email, password, ip = null }) {
    const admin = await adminRepository.findByEmail(email);
    if (!admin) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        name: admin.name,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // Record login audit log
    try {
      await auditLogRepository.create({
        actor_type: 'admin',
        actor_id: parseInt(admin.id, 10),
        actor_email: admin.email,
        action: 'login',
        target_table: 'admin_users',
        target_id: parseInt(admin.id, 10),
        metadata: { ip },
      });
    } catch (err) {
      logger.error('Failed to log admin login audit event:', err.message);
    }

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
   * Get current authenticated admin profile
   */
  async getMe(adminId) {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      const error = new Error('Admin profile not found');
      error.statusCode = 404;
      throw error;
    }
    return admin;
  },

  /**
   * List parent registrations with search, filters, pagination, and audit logging
   */
  async getParentRegistrations({ filters, adminUser, ip = null }) {
    const {
      status,
      grade_level,
      subject,
      from_date,
      to_date,
      search,
      page = 1,
      limit = 50,
    } = filters;
    const offset = (page - 1) * limit;

    const [registrations, total] = await Promise.all([
      parentRepository.findWithFilters({
        status,
        grade_level,
        subject,
        from_date,
        to_date,
        search,
        limit,
        offset,
      }),
      parentRepository.countWithFilters({
        status,
        grade_level,
        subject,
        from_date,
        to_date,
        search,
      }),
    ]);

    // Mandatory audit log on viewing sensitive child and parent data
    try {
      await auditLogRepository.create({
        actor_type: 'admin',
        actor_id: adminUser ? parseInt(adminUser.id, 10) : null,
        actor_email: adminUser ? adminUser.email : null,
        action: 'view',
        target_table: 'parent_registrations',
        metadata: { filters, count: total, ip },
      });
    } catch (err) {
      logger.error('Failed to log parent registration view audit:', err.message);
    }

    return {
      registrations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * List candidate mentor applications with filtering and pagination
   */
  async getMentorApplications({ filters }) {
    const { status, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      mentorRepository.findAllApplications({ status, limit, offset }),
      mentorRepository.countApplications({ status }),
    ]);

    return {
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Update mentor application screening status (one of 6 allowed)
   */
  async updateMentorApplicationStatus({ id, status, adminUser, ip = null }) {
    const updated = await mentorRepository.updateApplicationStatus(id, status);
    if (!updated) {
      const error = new Error('Mentor application not found');
      error.statusCode = 404;
      throw error;
    }

    // Write audit log for status mutation
    try {
      await auditLogRepository.create({
        actor_type: 'admin',
        actor_id: adminUser ? parseInt(adminUser.id, 10) : null,
        actor_email: adminUser ? adminUser.email : null,
        action: 'update',
        target_table: 'mentor_applications',
        target_id: parseInt(id, 10),
        metadata: { new_status: status, ip },
      });
    } catch (err) {
      logger.error('Failed to record mentor status update audit:', err.message);
    }

    return updated;
  },

  /**
   * Activate an accepted candidate into a verified mentor profile with credentials (ACID transaction)
   */
  async activateMentor({ applicationId, initialPassword, adminUser }) {
    const rawPassword = initialPassword || 'BilunexPass2026!';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const mentorProfile = await mentorRepository.activateMentorTransaction({
      applicationId,
      adminUser,
      passwordHash,
    });

    return mentorProfile;
  },

  /**
   * List contact and counseling inquiries with filters
   */
  async getInquiries({ filters }) {
    const { inquiry_type, status, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    const [inquiries, total] = await Promise.all([
      inquiryRepository.findAll({ type: inquiry_type, status, limit, offset }),
      inquiryRepository.countAll({ type: inquiry_type, status }),
    ]);

    return {
      inquiries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Aggregate operational summary metrics across registrations, applications, inquiries
   */
  async getReportsSummary() {
    const [parentCounts, mentorCounts, inquiryCounts] = await Promise.all([
      parentRepository.countByStatus(),
      mentorRepository.countApplicationsByStatus(),
      inquiryRepository.countByStatus(),
    ]);

    return {
      parent_registrations: parentCounts,
      mentor_applications: mentorCounts,
      inquiries: inquiryCounts,
    };
  },

  /**
   * Retrieve all student support reports with mentor details and audit log
   */
  async getStudentSupportReports({ filters, adminUser, ip = null }) {
    const { page = 1, limit = 100 } = filters;
    const offset = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      reportRepository.findAll({ limit, offset }),
      reportRepository.countAll(),
    ]);

    // Mandatory audit log for viewing confidential student support reports
    try {
      await auditLogRepository.create({
        actor_type: 'admin',
        actor_id: adminUser ? parseInt(adminUser.id, 10) : null,
        actor_email: adminUser ? adminUser.email : null,
        action: 'view',
        target_table: 'student_support_reports',
        metadata: { count: total, ip },
      });
    } catch (err) {
      logger.error('Failed to record student support reports audit:', err.message);
    }

    return {
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Retrieve confidential mentor document for secure admin streaming with mandatory audit logging
   */
  async getMentorDocumentForDownload(documentId, adminUser, ip = null) {
    const document = await documentRepository.findById(documentId);
    if (!document) {
      const err = new Error('Document not found or has been removed');
      err.status = 404;
      throw err;
    }

    if (!fs.existsSync(document.file_path)) {
      const err = new Error('Document file is missing from secure storage');
      err.status = 404;
      throw err;
    }

    // Write audit log entry for downloading sensitive document
    try {
      await auditLogRepository.create({
        actor_type: 'admin',
        actor_id: adminUser ? parseInt(adminUser.id, 10) : null,
        actor_email: adminUser ? adminUser.email : null,
        action: 'view',
        target_table: 'mentor_documents',
        target_id: document.id,
        metadata: {
          document_type: document.document_type,
          original_filename: document.original_filename,
          stored_filename: document.stored_filename,
          file_size_bytes: document.file_size_bytes,
          ip,
        },
      });
    } catch (auditErr) {
      logger.error('Failed to record document download audit log:', auditErr.message);
    }

    return document;
  },
};

module.exports = adminService;
