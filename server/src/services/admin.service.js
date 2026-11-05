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
const notificationLogRepository = require('../repositories/notification_log.repository');
const storyRepository = require('../repositories/story.repository');
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
   * Update status of parent registration with audit logging
   */
  async updateParentRegistrationStatus({ id, status, adminUser, ip = null }) {
    const existing = await parentRepository.findById(id);
    if (!existing) {
      const error = new Error(`Parent registration with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    const updated = await parentRepository.updateStatus(id, status);

    try {
      await auditLogRepository.create({
        actor_type: 'admin',
        actor_id: adminUser ? parseInt(adminUser.id, 10) : null,
        actor_email: adminUser ? adminUser.email : null,
        action: 'update',
        target_table: 'parent_registrations',
        target_id: id,
        metadata: {
          previous_status: existing.status,
          new_status: status,
          ip,
        },
      });
    } catch (auditErr) {
      logger.error(
        'Failed to create audit log for parent registration status update:',
        auditErr.message
      );
    }

    return updated;
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

    const applicationsWithDocuments = await Promise.all(
      applications.map(async application => ({
        ...application,
        documents: await documentRepository.findByApplicationId(application.id),
      }))
    );

    return {
      applications: applicationsWithDocuments,
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
   * Update inquiry status with audit logging
   */
  async updateInquiryStatus({ id, status, adminUser, ip = null }) {
    const existing = await inquiryRepository.findById(id);
    if (!existing) {
      const err = new Error('Inquiry not found');
      err.status = 404;
      throw err;
    }

    const updated = await inquiryRepository.updateStatus(id, status);

    await auditLogRepository.create({
      actor_id: adminUser?.id || null,
      actor_role: 'admin',
      action: 'UPDATE_INQUIRY_STATUS',
      entity_type: 'inquiries',
      entity_id: id,
      metadata: {
        previous_status: existing.status,
        new_status: status,
      },
      ip_address: ip,
    });

    return updated;
  },

  /**
   * Aggregate operational summary metrics across registrations, applications, inquiries, stories, reports
   */
  async getReportsSummary() {
    const [
      parentCounts,
      mentorCounts,
      activeMentorsCount,
      inquiryCounts,
      storyCounts,
      supportReportsCount,
      failedNotificationsCount,
      pendingStories,
    ] = await Promise.all([
      parentRepository.countByStatus().catch(() => []),
      mentorRepository.countApplicationsByStatus().catch(() => []),
      mentorRepository.countActiveMentors().catch(() => 0),
      inquiryRepository.countByStatus().catch(() => []),
      storyRepository.countByStatus().catch(() => []),
      reportRepository.countAll().catch(() => 0),
      notificationLogRepository.countFailuresLast7Days().catch(() => 0),
      storyRepository.countPending().catch(() => 0),
    ]);

    return {
      parent_registrations: parentCounts,
      mentor_applications: mentorCounts,
      active_mentors: activeMentorsCount,
      inquiries: inquiryCounts,
      stories: storyCounts,
      support_reports_count: supportReportsCount,
      failed_notifications_last_7_days: failedNotificationsCount,
      pending_stories: pendingStories,
    };
  },

  /**
   * Consolidated All-Events Activity Feed across all intake channels and system operations
   */
  async getAllEvents({ event_type = null, search = null, page = 1, limit = 50 } = {}) {
    const fetchLimit = 100;
    const [parents, mentors, inquiries, stories, reports, notifications] = await Promise.all([
      parentRepository.findWithFilters({ limit: fetchLimit }).catch(() => []),
      mentorRepository.findAllApplications({ limit: fetchLimit }).catch(() => []),
      inquiryRepository.findWithFilters({ limit: fetchLimit }).catch(() => []),
      storyRepository.findAll({ limit: fetchLimit }).catch(() => []),
      reportRepository.findAll({ limit: fetchLimit }).catch(() => []),
      notificationLogRepository.findAll(fetchLimit).catch(() => []),
    ]);

    const events = [];

    (parents || []).forEach(p => {
      events.push({
        id: `parent_${p.id}`,
        event_type: 'parent_registration',
        type_label: 'Parent Registration',
        title: `Parent Registration: ${p.parent_name}`,
        description: `Student: ${p.child_name || 'N/A'} (Grade ${p.grade_level || 'N/A'}) - Subjects: ${(p.subjects || []).join(', ') || 'General'}`,
        actor: p.parent_name,
        contact: p.email || p.phone,
        status: p.status,
        created_at: p.created_at,
        link: '/admin/registrations.html',
      });
    });

    (mentors || []).forEach(m => {
      events.push({
        id: `mentor_${m.id}`,
        event_type: 'mentor_application',
        type_label: 'Mentor Application',
        title: `Mentor Application: ${m.full_name}`,
        description: `${m.university || 'University'} (${m.field_of_study || 'General'}) - Year ${m.academic_year || 'N/A'}`,
        actor: m.full_name,
        contact: m.email || m.phone,
        status: m.status,
        created_at: m.created_at,
        link: '/admin/applications.html',
      });
    });

    (inquiries || []).forEach(i => {
      events.push({
        id: `inquiry_${i.id}`,
        event_type: 'inquiry',
        type_label: 'Inquiry',
        title: `${(i.inquiry_type || 'General').replace(/_/g, ' ')} Inquiry: ${i.name}`,
        description: i.message
          ? i.message.length > 120
            ? `${i.message.slice(0, 120)}…`
            : i.message
          : 'No message body',
        actor: i.name,
        contact: i.email || i.phone,
        status: i.status,
        created_at: i.created_at,
        link: '/admin/inquiries.html',
      });
    });

    (stories || []).forEach(s => {
      events.push({
        id: `story_${s.id}`,
        event_type: 'story',
        type_label: 'Story Submission',
        title: `Story: ${s.title}`,
        description: s.body
          ? s.body.length > 120
            ? `${s.body.slice(0, 120)}…`
            : s.body
          : 'No body',
        actor: s.full_name,
        contact: s.email || s.phone,
        status: s.status,
        created_at: s.created_at,
        link: '/admin/stories.html',
      });
    });

    (reports || []).forEach(r => {
      events.push({
        id: `report_${r.id || r.report_id}`,
        event_type: 'student_support',
        type_label: 'Student Support Report',
        title: `Student Support: ${r.student_name}`,
        description: `Need: ${r.support_need_observed} | Observations: ${r.observations ? r.observations.slice(0, 80) : ''}…`,
        actor: r.mentor_name || 'Mentor',
        contact: r.mentor_email,
        status: 'submitted',
        created_at: r.created_at,
        link: '/admin/reports.html',
      });
    });

    (notifications || []).forEach(n => {
      events.push({
        id: `notif_${n.id}`,
        event_type: 'notification',
        type_label: 'Notification',
        title: `Notification: ${n.notification_type}`,
        description: `Recipient: ${n.recipient} ${n.error_message ? `| Error: ${n.error_message}` : ''}`,
        actor: n.recipient,
        contact: n.recipient,
        status: n.status,
        created_at: n.created_at,
        link: '/admin/index.html',
      });
    });

    events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    let filtered = events;
    if (event_type && event_type !== 'all') {
      filtered = filtered.filter(e => e.event_type === event_type);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        e =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.actor && e.actor.toLowerCase().includes(q)) ||
          (e.contact && e.contact.toLowerCase().includes(q)) ||
          (e.status && e.status.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const offset = (pageNum - 1) * limitNum;
    const paginatedEvents = filtered.slice(offset, offset + limitNum);

    return {
      events: paginatedEvents,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
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
