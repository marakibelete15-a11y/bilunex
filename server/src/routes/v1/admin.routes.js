/**
 * Bilunex - Admin API Routes (v1)
 * Protected routes for administrator authentication, dashboard metrics, and application reviews.
 */

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const adminController = require('../../controllers/admin.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin.middleware');
const validate = require('../../middleware/validate.middleware');
const { strictLimiter } = require('../../middleware/rateLimit.middleware');
const { loginSchema } = require('../../validators/auth.validator');
const { applicationStatusSchema } = require('../../validators/mentor.validator');

// Admin Login Route (Stricter rate-limiting)
router.post('/auth/login', strictLimiter, validate(loginSchema), authController.loginAdmin);

// Protected Admin Endpoints (Require valid JWT with admin role)
router.use(authenticateToken, requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/applications', adminController.getApplications);
router.patch(
  '/applications/:id',
  validate(applicationStatusSchema),
  adminController.updateApplicationStatus
);
router.get('/mentors', adminController.getMentors);

module.exports = router;
