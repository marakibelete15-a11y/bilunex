/**
 * Bilunex - Public API Routes (v1)
 * Public endpoints for parent registration, mentor applications, and inquiries.
 */

const express = require('express');
const router = express.Router();
const parentController = require('../../controllers/parent.controller');
const mentorController = require('../../controllers/mentor.controller');
const validate = require('../../middleware/validate.middleware');
const { strictLimiter } = require('../../middleware/rateLimit.middleware');
const { parentRegistrationSchema } = require('../../validators/parent.validator');
const { mentorApplicationSchema } = require('../../validators/mentor.validator');
const { sendSuccess } = require('../../utils/response');

// Parent/Student registration route (rate-limited)
router.post(
  '/parents/register',
  strictLimiter,
  validate(parentRegistrationSchema),
  parentController.register
);

// Mentor application route (rate-limited)
router.post(
  '/mentors/apply',
  strictLimiter,
  validate(mentorApplicationSchema),
  mentorController.apply
);

// General contact inquiries
router.post('/contact', strictLimiter, (req, res) => {
  return sendSuccess(res, null, 'Contact message received. Our support team will reply soon.');
});

module.exports = router;
