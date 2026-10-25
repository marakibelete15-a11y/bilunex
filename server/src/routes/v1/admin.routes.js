/**
 * Bilunex - Admin API Routes (v1)
 * Protected routes for administrator authentication, dashboard metrics,
 * candidate screening, mentor activation, inquiry resolution, and session report audits.
 */

const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin.middleware');
const validate = require('../../middleware/validate.middleware');
const { strictLimiter } = require('../../middleware/rateLimit.middleware');
const {
  adminLoginSchema,
  parentRegistrationFilterSchema,
  mentorApplicationFilterSchema,
  updateApplicationStatusSchema,
  activateMentorSchema,
  inquiryFilterSchema,
  supportReportFilterSchema,
  idParamSchema,
} = require('../../validators/admin.validator');

// 1. Admin Login (Public endpoint with strict rate limiting)
router.post('/auth/login', strictLimiter, validate(adminLoginSchema), adminController.login);

// All subsequent routes require valid JWT and administrator role
router.use(authenticateToken, requireAdmin);

// 2. Current admin profile
router.get('/auth/me', adminController.getMe);

// 3. Parent registrations with filtering & search
router.get(
  '/parent-registrations',
  validate({ query: parentRegistrationFilterSchema }),
  adminController.getParentRegistrations
);

// 4. Candidate mentor applications list
router.get(
  '/mentor-applications',
  validate({ query: mentorApplicationFilterSchema }),
  adminController.getMentorApplications
);

// 5. Update mentor application status
router.patch(
  '/mentor-applications/:id/status',
  validate({ params: idParamSchema, body: updateApplicationStatusSchema }),
  adminController.updateMentorApplicationStatus
);

// 6. Activate accepted mentor application (ACID transaction)
router.post(
  '/mentor-applications/:id/activate',
  validate({ params: idParamSchema, body: activateMentorSchema }),
  adminController.activateMentor
);

// 7. Contact and counseling inquiries
router.get('/inquiries', validate({ query: inquiryFilterSchema }), adminController.getInquiries);

// 8. Operational summary reports
router.get('/reports/summary', adminController.getReportsSummary);

// 9. Student support reports list
router.get(
  '/student-support-reports',
  validate({ query: supportReportFilterSchema }),
  adminController.getStudentSupportReports
);

// Backward-compatible endpoints
router.get('/overview', adminController.getOverview);

module.exports = router;
