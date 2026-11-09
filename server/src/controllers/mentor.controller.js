/**
 * Bilunex - Mentor Controller
 * Handles HTTP requests for mentor authentication, profile self-management,
 * and confidential session support reports.
 * Controllers NEVER construct SQL queries.
 *
 * CRITICAL ARCHITECTURE RULE (SRS FR-7.5, FR-8.3):
 * Mentors have NO endpoint to list or view student support reports.
 *
 * Traces to SRS: FR-7.2, FR-7.3, FR-7.4, FR-7.5, FR-8.1, FR-8.2
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
      res.cookie('bilunex_portal_token', result.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      return sendSuccess(res, result, 'Mentor authenticated successfully', 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Mentor Logout
   * POST /api/v1/mentor/auth/logout
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
   * Retrieve Authenticated Mentor's Profile
   * GET /api/v1/mentor/me or /api/v1/mentor/profile
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
   * Update Mentor Profile
   * PATCH /api/v1/mentor/me or /api/v1/mentor/profile
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
   * Change Mentor Password
   * PATCH /api/v1/mentor/me/password or /api/v1/mentor/profile/password
   */
  async changePassword(req, res, next) {
    try {
      const mentorId = req.user.mentorId || req.user.id;
      const { current_password, new_password } = req.body;
      const result = await mentorService.changePassword({
        mentorId,
        currentPassword: current_password,
        newPassword: new_password,
      });
      return sendSuccess(res, result, 'Password changed successfully', 200);
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
      const mentorName = req.user.name;
      const report = await mentorService.submitSupportReport(mentorId, mentorName, req.body);
      return sendSuccess(res, report, 'Student support report filed successfully', 201);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = mentorController;
