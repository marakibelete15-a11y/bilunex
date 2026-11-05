/**
 * Bilunex - Admin Validators
 * Request schemas for admin authentication, intake record filtering, and status updates.
 */

const { z } = require('zod');

const adminLoginSchema = z
  .object({
    email: z.string().trim().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password is required'),
  })
  .strict();

const parentRegistrationFilterSchema = z.object({
  status: z.enum(['new', 'contacted', 'enrolled', 'archived']).optional(),
  grade_level: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  from_date: z.string().trim().optional(),
  to_date: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const updateParentRegistrationStatusSchema = z
  .object({
    status: z.enum(['new', 'contacted', 'enrolled', 'archived'], {
      errorMap: () => ({
        message: 'Status must be one of: new, contacted, enrolled, archived',
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
  status: z.enum(['new', 'in_progress', 'resolved', 'archived']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const updateInquiryStatusSchema = z
  .object({
    status: z.enum(['new', 'in_progress', 'resolved', 'archived'], {
      errorMap: () => ({
        message: 'Status must be one of: new, in_progress, resolved, archived',
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

const eventFilterSchema = z.object({
  event_type: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
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
  eventFilterSchema,
};
