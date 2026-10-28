/**
 * Bilunex - Admin Controller
 * Handles HTTP requests for admin authentication, intake management, candidate screening,
 * mentor activation, inquiry resolution, and session report audits.
 * Controllers NEVER write SQL directly.
 */

const fs = require('fs');
const adminService = require('../services/admin.service');
const { sendSuccess } = require('../utils/response');
const logger = require('../utils/logger');

const adminController = {
  /**
   * Admin Login
   * POST /api/v1/admin/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await adminService.login({
        email,
        password,
        ip: req.ip,
      });
      return sendSuccess(res, result, 'Admin authenticated successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Current Admin Profile
   * GET /api/v1/admin/auth/me
   */
  async getMe(req, res, next) {
    try {
      const admin = await adminService.getMe(req.user.id);
      return sendSuccess(res, admin, 'Admin profile retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * List Parent Registrations with search, filters, pagination
   * GET /api/v1/admin/parent-registrations
   */
  async getParentRegistrations(req, res, next) {
    try {
      const result = await adminService.getParentRegistrations({
        filters: req.query,
        adminUser: req.user,
        ip: req.ip,
      });
      return sendSuccess(res, result, 'Parent registrations retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * List Mentor Applications with status filter & pagination
   * GET /api/v1/admin/mentor-applications
   */
  async getMentorApplications(req, res, next) {
    try {
      const result = await adminService.getMentorApplications({
        filters: req.query,
      });
      return sendSuccess(res, result, 'Mentor applications retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update Mentor Application Status
   * PATCH /api/v1/admin/mentor-applications/:id/status
   */
  async updateMentorApplicationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await adminService.updateMentorApplicationStatus({
        id,
        status,
        adminUser: req.user,
        ip: req.ip,
      });
      return sendSuccess(res, updated, `Mentor application status updated to ${status}`, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Activate Accepted Mentor (ACID transaction)
   * POST /api/v1/admin/mentor-applications/:id/activate
   */
  async activateMentor(req, res, next) {
    try {
      const { id } = req.params;
      const { initial_password } = req.body || {};
      const mentorProfile = await adminService.activateMentor({
        applicationId: id,
        initialPassword: initial_password,
        adminUser: req.user,
      });
      return sendSuccess(
        res,
        mentorProfile,
        'Mentor profile created and activated successfully',
        201
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * List Contact & Counseling Inquiries
   * GET /api/v1/admin/inquiries
   */
  async getInquiries(req, res, next) {
    try {
      const result = await adminService.getInquiries({
        filters: req.query,
      });
      return sendSuccess(res, result, 'Inquiries retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Summary Counts Across Intakes & Applications
   * GET /api/v1/admin/reports/summary
   */
  async getReportsSummary(req, res, next) {
    try {
      const summary = await adminService.getReportsSummary();
      return sendSuccess(res, summary, 'Operational summary metrics retrieved', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * List Student Support Reports with Mentor Names
   * GET /api/v1/admin/student-support-reports
   */
  async getStudentSupportReports(req, res, next) {
    try {
      const result = await adminService.getStudentSupportReports({
        filters: req.query,
        adminUser: req.user,
        ip: req.ip,
      });
      return sendSuccess(res, result, 'Student support reports retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Backward-compatible overview helper
   * GET /api/v1/admin/overview
   */
  /**
   * Securely stream mentor document (transcript or ID photo) to authenticated administrator
   * GET /api/v1/admin/documents/:id/download
   */
  async downloadMentorDocument(req, res, next) {
    try {
      const document = await adminService.getMentorDocumentForDownload(
        req.params.id,
        req.user,
        req.ip
      );

      res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(document.original_filename)}"`
      );
      res.setHeader('Content-Length', document.file_size_bytes);

      const fileStream = fs.createReadStream(document.file_path);
      fileStream.on('error', streamErr => {
        logger.error('Stream error while sending document:', streamErr.message);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Failed to read document stream' });
        }
      });
      return fileStream.pipe(res);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
