/**
 * Bilunex - Admin API Routes
 * Endpoints for administrative functions: intake management, candidate screening,
 * mentor activation, inquiry resolution, and session report audits.
 * Traces to SRS: FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5, FR-5.6, FR-5.7
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticateToken = require('../middleware/auth.middleware');
const requireAdmin = require('../middleware/requireAdmin.middleware');
const validate = require('../middleware/validate.middleware');
const { strictLimiter } = require('../middleware/rateLimit.middleware');
const {
  adminLoginSchema,
  parentRegistrationFilterSchema,
  updateParentRegistrationStatusSchema,
  mentorApplicationFilterSchema,
  updateApplicationStatusSchema,
  activateMentorSchema,
  inquiryFilterSchema,
  updateInquiryStatusSchema,
  supportReportFilterSchema,
  idParamSchema,
  mentorIdParamSchema,
  resetMentorPasswordSchema,
  adminChangePasswordSchema,
} = require('../validators/admin.validator');

// Admin Authentication (Public Login & Logout)
router.post('/auth/login', strictLimiter, validate(adminLoginSchema), adminController.login);
router.post('/auth/logout', adminController.logout);

// All subsequent routes require authentication and admin role (FR-5.1)
router.use(authenticateToken, requireAdmin);

// Admin Profile & Self-Management
router.get('/auth/me', adminController.getMe);
router.patch(
  '/me/password',
  strictLimiter,
  validate(adminChangePasswordSchema),
  adminController.changePassword
);

// Admin Reset Mentor Password
router.post(
  '/mentors/:mentorId/reset-password',
  strictLimiter,
  validate({ params: mentorIdParamSchema, body: resetMentorPasswordSchema }),
  adminController.resetMentorPassword
);

// Parent Registrations (FR-5.2)
router.get(
  '/parents',
  validate({ query: parentRegistrationFilterSchema }),
  adminController.getParentRegistrations
);

router.get(
  '/parents/:id',
  validate({ params: idParamSchema }),
  adminController.getParentRegistrationById
);

router.patch(
  '/parents/:id/status',
  validate({ params: idParamSchema, body: updateParentRegistrationStatusSchema }),
  adminController.updateParentRegistrationStatus
);

// Mentor Applications (FR-5.3, FR-5.6)
router.get(
  '/mentor-applications',
  validate({ query: mentorApplicationFilterSchema }),
  adminController.getMentorApplications
);

router.get(
  '/mentor-applications/:id',
  validate({ params: idParamSchema }),
  adminController.getMentorApplicationById
);

router.patch(
  '/mentor-applications/:id/status',
  validate({ params: idParamSchema, body: updateApplicationStatusSchema }),
  adminController.updateMentorApplicationStatus
);

router.post(
  '/mentor-applications/:id/activate',
  validate({ params: idParamSchema, body: activateMentorSchema }),
  adminController.activateMentor
);

// Inquiries (FR-5.4)
router.get('/inquiries', validate({ query: inquiryFilterSchema }), adminController.getInquiries);

router.get('/inquiries/:id', validate({ params: idParamSchema }), adminController.getInquiryById);

router.patch(
  '/inquiries/:id/status',
  validate({ params: idParamSchema, body: updateInquiryStatusSchema }),
  adminController.updateInquiryStatus
);

// Student Support Reports (FR-5.7, FR-8.3)
router.get(
  '/support-reports',
  validate({ query: supportReportFilterSchema }),
  adminController.getStudentSupportReports
);
router.get(
  '/student-support-reports',
  validate({ query: supportReportFilterSchema }),
  adminController.getStudentSupportReports
);

router.get(
  '/support-reports/:id',
  validate({ params: idParamSchema }),
  adminController.getStudentSupportReportById
);
router.get(
  '/student-support-reports/:id',
  validate({ params: idParamSchema }),
  adminController.getStudentSupportReportById
);

// Stats & Reporting Summary (FR-5.5)
router.get('/stats', adminController.getReportsSummary);
router.get('/reports/summary', adminController.getReportsSummary);
router.get('/overview', adminController.getReportsSummary);

module.exports = router;
