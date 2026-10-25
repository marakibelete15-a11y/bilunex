/**
 * Bilunex - Admin Controller
 * Handles HTTP requests for administrative dashboard statistics, applications, and mentor rosters.
 */

const mentorService = require('../services/mentor.service');
const parentRepository = require('../repositories/parent.repository');
const mentorRepository = require('../repositories/mentor.repository');
const reportRepository = require('../repositories/report.repository');
const { sendSuccess } = require('../utils/response');

const adminController = {
  /**
   * Get administrative overview metrics
   * GET /api/v1/admin/overview
   */
  async getOverview(req, res, next) {
    try {
      const [parentsCount, applicationsCount, mentorsCount, reportsCount] = await Promise.all([
        parentRepository.countAll().catch(() => 0),
        mentorRepository.countPendingApplications().catch(() => 0),
        mentorRepository.countActiveMentors().catch(() => 0),
        reportRepository.countAll().catch(() => 0),
      ]);

      return sendSuccess(res, {
        parentsCount,
        applicationsCount,
        mentorsCount,
        reportsCount,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get all mentor applications
   * GET /api/v1/admin/applications
   */
  async getApplications(req, res, next) {
    try {
      const applications = await mentorService.getApplications();
      return sendSuccess(res, applications, 'Mentor applications retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update mentor application status (approve / reject)
   * PATCH /api/v1/admin/applications/:id
   */
  async updateApplicationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await mentorService.updateApplicationStatus(id, status);
      return sendSuccess(res, updated, `Application status updated to ${status}`);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get all active mentors
   * GET /api/v1/admin/mentors
   */
  async getMentors(req, res, next) {
    try {
      const mentors = await mentorService.getActiveMentors();
      return sendSuccess(res, mentors, 'Active mentors retrieved');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
