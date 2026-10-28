/**
 * Bilunex - Public Intake Controller
 * Handles incoming public requests for parent registrations, mentor applications, and inquiries.
 * Controllers NEVER write SQL directly; all database interaction goes through the service layer.
 */

const publicService = require('../services/public.service');
const { sendSuccess } = require('../utils/response');

const publicController = {
  /**
   * Handle parent/student registration intake
   * POST /api/v1/public/parent-registrations
   */
  async registerParent(req, res, next) {
    try {
      const registration = await publicService.registerParent(req.body);
      sendSuccess(
        res,
        registration,
        'Parent registration received successfully. Our team will contact you soon.',
        201
      );
      res.once('finish', () => publicService.dispatchParentNotifications(registration));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handle candidate mentor application intake
   * POST /api/v1/public/mentor-applications
   */
  async applyMentor(req, res, next) {
    try {
      const application = await publicService.applyMentor(req.body, req.files);
      sendSuccess(
        res,
        application,
        'Mentor application submitted successfully. We will review your application soon.',
        201
      );
      res.once('finish', () => publicService.dispatchMentorNotifications(application));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handle public contact inquiries
   * POST /api/v1/public/inquiries
   */
  async submitInquiry(req, res, next) {
    try {
      const inquiry = await publicService.submitInquiry(req.body);
      sendSuccess(res, inquiry, 'Contact message received. Our support team will reply soon.', 201);
      res.once('finish', () => publicService.dispatchInquiryNotification(inquiry));
    } catch (error) {
      next(error);
    }
  },
};

module.exports = publicController;
