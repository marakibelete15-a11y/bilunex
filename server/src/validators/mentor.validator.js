/**
 * Bilunex - Mentor Validator Schemas
 * Schemas for mentor authentication, profile updates, and session support reports.
 */

const { z } = require('zod');

const mentorLoginSchema = z
  .object({
    email: z.string().trim().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password is required'),
  })
  .strict();

const updateProfileSchema = z
  .object({
    availability: z.string().trim().min(2, 'Availability must be at least 2 characters').optional(),
    phone: z
      .string()
      .trim()
      .min(7, 'Phone number must be at least 7 characters')
      .optional()
      .nullable(),
    subject_specializations: z
      .array(z.string().trim().min(1, 'Subject cannot be empty'))
      .min(1, 'At least one subject specialization is required')
      .optional(),
  })
  .strict();

const createSupportReportSchema = z
  .object({
    student_name: z.string().trim().min(2, 'Student name must be at least 2 characters'),
    support_need_observed: z.string().trim().min(2, 'Support need observed is required'),
    observations: z.string().trim().min(10, 'Observations must be at least 10 characters'),
    recommended_action: z
      .string()
      .trim()
      .min(2, 'Recommended action must be at least 2 characters'),
  })
  .strict();

module.exports = {
  mentorLoginSchema,
  updateProfileSchema,
  createSupportReportSchema,
  supportReportSchema: createSupportReportSchema,
};
