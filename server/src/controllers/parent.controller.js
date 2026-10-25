/**
 * Bilunex - Parent Controller
 * Handles HTTP requests for student/parent intake registration.
 */

const parentService = require('../services/parent.service');
const { sendSuccess } = require('../utils/response');

const parentController = {
  /**
   * Register a new student for tutoring/mentoring/counseling
   * POST /api/v1/public/parents/register
   */
  async register(req, res, next) {
    try {
      const registration = await parentService.registerParent(req.body);
      return sendSuccess(
        res,
        registration,
        'Student registration submitted successfully! A coordinator will follow up.',
        201
      );
    } catch (err) {
      next(err);
    }
  },
};

module.exports = parentController;
