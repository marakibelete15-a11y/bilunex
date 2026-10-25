/**
 * Bilunex - Authentication Controller
 * Handles HTTP requests for admin and mentor authentication.
 * Controllers delegate business logic to services and return standardized responses.
 */

const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

const authController = {
  /**
   * Admin login handler
   * POST /api/v1/admin/auth/login
   */
  async loginAdmin(req, res, next) {
    try {
      const result = await authService.loginAdmin(req.body);
      return sendSuccess(res, result, 'Admin authenticated successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Mentor login handler
   * POST /api/v1/mentor/auth/login
   */
  async loginMentor(req, res, next) {
    try {
      const result = await authService.loginMentor(req.body);
      return sendSuccess(res, result, 'Mentor authenticated successfully');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
