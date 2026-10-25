/**
 * Bilunex - Mentor Controller
 * Handles HTTP requests for mentor applications, profile, and student support reports.
 */

const mentorService = require('../services/mentor.service');
const { sendSuccess, sendError } = require('../utils/response');

const mentorController = {
  /**
   * Submit mentor candidate application
   * POST /api/v1/public/mentors/apply
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

  /**
   * Get authenticated mentor profile
   * GET /api/v1/mentor/profile
   */
  async getProfile(req, res, next) {
    try {
      const profile = await mentorService.getProfileByUserId(req.user.id);
      return sendSuccess(res, profile, 'Profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * File a student support report
   * POST /api/v1/mentor/reports
   */
  async submitReport(req, res, next) {
    try {
      const mentorId = req.user.mentorId;
      if (!mentorId) {
        return sendError(res, 'Mentor profile not found for this user', 400);
      }
      const report = await mentorService.submitSupportReport(mentorId, req.user.name, req.body);
      return sendSuccess(res, report, 'Student support report filed successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get support reports filed by the authenticated mentor
   * GET /api/v1/mentor/reports
   * Architecture rule: A mentor can only access their own data.
   */
  async getReports(req, res, next) {
    try {
      const mentorId = req.user.mentorId;
      if (!mentorId) {
        return sendSuccess(res, [], 'No mentor profile associated with this account');
      }
      const reports = await mentorService.getReportsForMentor(mentorId);
      return sendSuccess(res, reports, 'Reports retrieved successfully');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = mentorController;
