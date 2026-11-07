/**
 * Bilunex - Mentor API Routes
 * Endpoints for mentor authentication, profile self-management,
 * and confidential student support reports.
 *
 * CRITICAL ARCHITECTURE RULE (SRS FR-7.5, FR-8.3):
 * Mentors have NO endpoint to list or view student support reports.
 *
 * Traces to SRS: FR-7.2, FR-7.3, FR-7.4, FR-7.5, FR-8.1, FR-8.2
 */

const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentor.controller');
const authenticateToken = require('../middleware/auth.middleware');
const requireMentor = require('../middleware/requireMentor.middleware');
const validate = require('../middleware/validate.middleware');
const { strictLimiter } = require('../middleware/rateLimit.middleware');
const {
  mentorLoginSchema,
  updateProfileSchema,
  updatePasswordSchema,
  createSupportReportSchema,
} = require('../validators/mentor.validator');

// Mentor Authentication (Public Login)
router.post('/auth/login', strictLimiter, validate(mentorLoginSchema), mentorController.login);

// All subsequent routes require authentication and mentor role (FR-7.2, FR-7.5)
router.use(authenticateToken, requireMentor);

// Mentor Profile Self-Management (FR-7.3, FR-7.4)
router.get('/me', mentorController.getProfile);
router.get('/profile', mentorController.getProfile);

router.patch('/me', validate(updateProfileSchema), mentorController.updateProfile);
router.patch('/profile', validate(updateProfileSchema), mentorController.updateProfile);

// Password Change
router.patch('/me/password', validate(updatePasswordSchema), mentorController.changePassword);
router.patch('/profile/password', validate(updatePasswordSchema), mentorController.changePassword);

// Student Support Report Submission (FR-8.1, FR-8.2)
// NOTE: Mentors only submit reports. There is NO GET /reports for mentors.
router.post('/reports', validate(createSupportReportSchema), mentorController.submitReport);

module.exports = router;
