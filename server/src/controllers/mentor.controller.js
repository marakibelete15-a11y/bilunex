/**
 * Bilunex - Mentor Controller
 * Handles HTTP requests for mentor authentication, profile self-management,
 * and confidential session support reports.
 * Controllers NEVER construct SQL queries.
 */

const mentorService = require('../services/mentor.service');
const { sendSuccess } = require('../utils/response');

const mentorController = {
  /**
   * Mentor Authentication Login
   * POST /api/v1/mentor/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await mentorService.login({ email, password });
      return sendSuccess(res, result, 'Mentor authenticated successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Retrieve Authenticated Mentor's Profile
   * GET /api/v1/mentor/profile
   */
  async getProfile(req, res, next) {
    try {
      const mentorId = req.user.mentorId || req.user.id;
      const profile = await mentorService.getProfile(mentorId);
      return sendSuccess(res, profile, 'Profile retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update Mentor Profile (availability, phone, subject_specializations)
   * PATCH /api/v1/mentor/profile
   */
  async updateProfile(req, res, next) {
    try {
      const mentorId = req.user.mentorId || req.user.id;
      const updated = await mentorService.updateProfile(mentorId, req.body);
      return sendSuccess(res, updated, 'Profile updated successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Submit a Student Support Report
   * POST /api/v1/mentor/reports
   */
  async submitReport(req, res, next) {
    try {
      const mentorId = req.user.mentorId || req.user.id;
      const report = await mentorService.submitSupportReport(mentorId, req.user.name, req.body);
      return sendSuccess(res, report, 'Student support report filed successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * List Reports Filed by the Authenticated Mentor (Isolated)
   * GET /api/v1/mentor/reports
   */
  async getReports(req, res, next) {
    try {
      const mentorId = req.user.mentorId || req.user.id;
      const reports = await mentorService.getReportsForMentor(mentorId);
      return sendSuccess(res, reports, 'Student support reports retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Legacy intake helper
   */
  async apply(req, res, next) {
    try {
      const application = await mentorService.submitApplication(req.body);
      return sendSuccess(
        res,
        application,
        'Mentor application received successfully! Our team will review your qualifications.',
        201
      );
    } catch (err) {
      next(err);
    }
  },
};

module.exports = mentorController;
