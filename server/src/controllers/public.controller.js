/**
 * Bilunex - Public Intake Controller
 * Handles incoming public requests for parent registrations, mentor applications, and inquiries.
 * Controllers NEVER write SQL directly; all database interaction goes through the service layer.
 * Traces to SRS: FR-2.1, FR-3.1, FR-4.1
 */

const publicService = require('../services/public.service');
const { sendSuccess } = require('../utils/response');

const publicController = {
  /**
   * Handle parent/student registration intake
   * POST /api/v1/parents/register (alias POST /api/v1/parent-registrations)
   */
  async registerParent(req, res, next) {
    try {
      const registration = await publicService.registerParent(req.body);
      publicService.dispatchParentNotifications(registration);
      return sendSuccess(
        res,
        registration,
        'Parent registration received successfully. Our team will contact you soon.',
        201
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handle candidate mentor application intake
   * POST /api/v1/mentors/apply (alias POST /api/v1/mentor-applications)
   */
  async applyMentor(req, res, next) {
    try {
      const application = await publicService.applyMentor(req.body);
      publicService.dispatchMentorNotifications(application);
      return sendSuccess(
        res,
        application,
        'Mentor application submitted successfully. We will review your application soon.',
        201
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handle public contact inquiries
   * POST /api/v1/inquiries
   */
  async submitInquiry(req, res, next) {
    try {
      const inquiry = await publicService.submitInquiry(req.body);
      publicService.dispatchInquiryNotification(inquiry);
      return sendSuccess(
        res,
        inquiry,
        'Contact message received. Our support team will reply soon.',
        201
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = publicController;
