/**
 * Bilunex - Public API Routes
 * Endpoints for public intake: parent registrations, mentor applications, inquiries.
 * Traces to SRS: FR-2.1, FR-3.1, FR-4.1
 */

const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');
const validate = require('../middleware/validate.middleware');
const { strictLimiter } = require('../middleware/rateLimit.middleware');
const {
  createParentRegistrationSchema,
  createMentorApplicationSchema,
  createInquirySchema,
} = require('../validators/public.validator');

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Parent Registration (FR-2.1)
router.post(
  '/parents/register',
  strictLimiter,
  validate(createParentRegistrationSchema),
  publicController.registerParent
);

// Mentor Application (FR-3.1)
router.post(
  '/mentors/apply',
  strictLimiter,
  validate(createMentorApplicationSchema),
  publicController.applyMentor
);

// Public Inquiries
router.post(
  '/inquiries',
  strictLimiter,
  validate(createInquirySchema),
  publicController.submitInquiry
);

module.exports = router;
