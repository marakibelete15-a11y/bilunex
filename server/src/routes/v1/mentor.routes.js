/**
 * Bilunex - Mentor API Routes (v1)
 * Protected routes for mentor portal, session reports, and profile details.
 * Architecture rule: A mentor can only access their own data.
 */

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const mentorController = require('../../controllers/mentor.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const requireMentor = require('../../middleware/requireMentor.middleware');
const validate = require('../../middleware/validate.middleware');
const { strictLimiter } = require('../../middleware/rateLimit.middleware');
const { loginSchema } = require('../../validators/auth.validator');
const { supportReportSchema } = require('../../validators/report.validator');

// Mentor Login Route (Stricter rate-limiting)
router.post('/auth/login', strictLimiter, validate(loginSchema), authController.loginMentor);

// Protected Mentor Endpoints (Require valid JWT with mentor role)
router.use(authenticateToken, requireMentor);

router.get('/profile', mentorController.getProfile);
router.post('/reports', validate(supportReportSchema), mentorController.submitReport);
router.get('/reports', mentorController.getReports);

module.exports = router;
