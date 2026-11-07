/**
 * Bilunex - Admin Validators
 * Request schemas for admin authentication, intake record filtering, and status updates.
 * Traces to SRS: FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5, FR-5.6, FR-5.7
 */

const { z } = require('zod');

const adminLoginSchema = z
  .object({
    email: z.string().trim().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password is required'),
  })
  .strict();

const parentRegistrationFilterSchema = z.object({
  status: z.enum(['new', 'contacted', 'matched', 'closed']).optional(),
  grade_level: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const updateParentRegistrationStatusSchema = z
  .object({
    status: z.enum(['new', 'contacted', 'matched', 'closed'], {
      errorMap: () => ({
        message: 'Status must be one of: new, contacted, matched, closed',
      }),
    }),
  })
  .strict();

const mentorApplicationFilterSchema = z.object({
  status: z
    .enum([
      'application_received',
      'under_review',
      'interview_stage',
      'accepted',
      'rejected',
      'onboarding',
    ])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const updateApplicationStatusSchema = z
  .object({
    status: z.enum(
      [
        'application_received',
        'under_review',
        'interview_stage',
        'accepted',
        'rejected',
        'onboarding',
      ],
      {
        errorMap: () => ({
          message:
            'Status must be one of: application_received, under_review, interview_stage, accepted, rejected, onboarding',
        }),
      }
    ),
    admin_notes: z.string().trim().optional().nullable(),
  })
  .strict();

const activateMentorSchema = z
  .object({
    initial_password: z
      .string()
      .min(8, 'Initial password must be at least 8 characters')
      .optional(),
  })
  .strict();

const inquiryFilterSchema = z.object({
  inquiry_type: z
    .enum(['general', 'parent_support', 'mentor_application', 'counseling'])
    .optional(),
  status: z.enum(['new', 'in_progress', 'resolved']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const updateInquiryStatusSchema = z
  .object({
    status: z.enum(['new', 'in_progress', 'resolved'], {
      errorMap: () => ({
        message: 'Status must be one of: new, in_progress, resolved',
      }),
    }),
  })
  .strict();

const supportReportFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

module.exports = {
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
};
