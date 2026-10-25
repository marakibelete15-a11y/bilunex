/**
 * Bilunex - Mentor API Routes (v1)
 * Protected routes for mentor portal, session reports, and profile details.
 * Architecture rule: A mentor can strictly only access their own data.
 */

const express = require('express');
const router = express.Router();
const mentorController = require('../../controllers/mentor.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const requireMentor = require('../../middleware/requireMentor.middleware');
const validate = require('../../middleware/validate.middleware');
const { strictLimiter } = require('../../middleware/rateLimit.middleware');
const {
  mentorLoginSchema,
  updateProfileSchema,
  createSupportReportSchema,
} = require('../../validators/mentor.validator');

// 1. Mentor Login (Public with strict rate limiting)
router.post('/auth/login', strictLimiter, validate(mentorLoginSchema), mentorController.login);

// All subsequent routes require valid JWT with mentor role
router.use(authenticateToken, requireMentor);

// 2. Profile management
router.get('/profile', mentorController.getProfile);
router.patch('/profile', validate(updateProfileSchema), mentorController.updateProfile);

// 3. Student support reports (Strictly isolated to authenticated mentor)
router.post('/reports', validate(createSupportReportSchema), mentorController.submitReport);
router.get('/reports', mentorController.getReports);

module.exports = router;
