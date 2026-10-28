/**
 * Bilunex - Public API Routes (v1)
 * Public endpoints for parent registration, mentor applications, and inquiries.
 * Strict rate-limiting enforced on all intake endpoints.
 */

const express = require('express');
const router = express.Router();
const publicController = require('../../controllers/public.controller');
const validate = require('../../middleware/validate.middleware');
const { strictLimiter } = require('../../middleware/rateLimit.middleware');
const { handleMentorDocumentUpload } = require('../../middleware/upload.middleware');
const {
  createParentRegistrationSchema,
  createMentorApplicationSchema,
  createInquirySchema,
} = require('../../validators/public.validator');

// 1. Parent/Student registration
router.post(
  '/parent-registrations',
  strictLimiter,
  validate(createParentRegistrationSchema),
  publicController.registerParent
);

// Backward-compatible alias for existing tests / client routes
router.post(
  '/parents/register',
  strictLimiter,
  validate(createParentRegistrationSchema),
  publicController.registerParent
);

// 2. Candidate mentor application
router.post(
  '/mentor-applications',
  strictLimiter,
  handleMentorDocumentUpload,
  validate(createMentorApplicationSchema),
  publicController.applyMentor
);

// Backward-compatible alias
router.post(
  '/mentors/apply',
  strictLimiter,
  handleMentorDocumentUpload,
  validate(createMentorApplicationSchema),
  publicController.applyMentor
);

// 3. Contact & counseling inquiries
router.post(
  '/inquiries',
  strictLimiter,
  validate(createInquirySchema),
  publicController.submitInquiry
);

// Backward-compatible alias
router.post(
  '/contact',
  strictLimiter,
  validate(createInquirySchema),
  publicController.submitInquiry
);

module.exports = router;
