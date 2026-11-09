/**
 * Bilunex - Admin Controller
 * Handles HTTP requests for admin authentication, intake management, candidate screening,
 * mentor activation, inquiry resolution, and session report audits.
 * Controllers NEVER write SQL directly.
 * Traces to SRS: FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5, FR-5.6, FR-5.7
 */

const adminService = require('../services/admin.service');
const { sendSuccess } = require('../utils/response');

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
      });
      res.cookie('bilunex_portal_token', result.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      return sendSuccess(res, result, 'Admin authenticated successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin Logout
   * POST /api/v1/admin/auth/logout
   */
  async logout(req, res, next) {
    try {
      res.clearCookie('bilunex_portal_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      return sendSuccess(res, null, 'Logged out successfully', 200);
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
   * GET /api/v1/admin/parents or /api/v1/admin/parent-registrations
   */
  async getParentRegistrations(req, res, next) {
    try {
      const result = await adminService.getParentRegistrations({
        filters: req.query,
      });
      return sendSuccess(res, result, 'Parent registrations retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Single Parent Registration
   * GET /api/v1/admin/parents/:id or /api/v1/admin/parent-registrations/:id
   */
  async getParentRegistrationById(req, res, next) {
    try {
      const registration = await adminService.getParentRegistrationById(req.params.id);
      return sendSuccess(res, registration, 'Parent registration retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update Parent Registration Status
   * PATCH /api/v1/admin/parents/:id/status or /api/v1/admin/parent-registrations/:id/status
   */
  async updateParentRegistrationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await adminService.updateParentRegistrationStatus({
        id,
        status,
      });
      return sendSuccess(res, updated, `Parent registration status updated to ${status}`, 200);
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
   * Get Single Mentor Application
   * GET /api/v1/admin/mentor-applications/:id
   */
  async getMentorApplicationById(req, res, next) {
    try {
      const application = await adminService.getMentorApplicationById(req.params.id);
      return sendSuccess(res, application, 'Mentor application retrieved successfully', 200);
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
      const { status, admin_notes } = req.body;
      const updated = await adminService.updateMentorApplicationStatus({
        id,
        status,
        admin_notes,
        adminUser: req.user,
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
   * Get Single Inquiry
   * GET /api/v1/admin/inquiries/:id
   */
  async getInquiryById(req, res, next) {
    try {
      const inquiry = await adminService.getInquiryById(req.params.id);
      return sendSuccess(res, inquiry, 'Inquiry retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update Inquiry Status
   * PATCH /api/v1/admin/inquiries/:id/status
   */
  async updateInquiryStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await adminService.updateInquiryStatus({
        id,
        status,
      });
      return sendSuccess(res, { inquiry: updated }, 'Inquiry status updated successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Summary Counts Across Intakes & Applications
   * GET /api/v1/admin/stats or /api/v1/admin/reports/summary or /api/v1/admin/overview
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
   * GET /api/v1/admin/support-reports or /api/v1/admin/student-support-reports
   */
  async getStudentSupportReports(req, res, next) {
    try {
      const result = await adminService.getStudentSupportReports({
        filters: req.query,
      });
      return sendSuccess(res, result, 'Student support reports retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Single Student Support Report
   * GET /api/v1/admin/support-reports/:id or /api/v1/admin/student-support-reports/:id
   */
  async getStudentSupportReportById(req, res, next) {
    try {
      const report = await adminService.getStudentSupportReportById(req.params.id);
      return sendSuccess(res, report, 'Student support report retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
