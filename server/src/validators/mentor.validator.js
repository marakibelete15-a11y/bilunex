/**
 * Bilunex - Mentor Validator Schemas
 * Schemas for mentor authentication, profile updates, and session support reports.
 * Traces to SRS: FR-7.2, FR-7.4, FR-8.1, FR-8.2
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
    full_name: z.string().trim().min(2, 'Full name must be at least 2 characters').optional(),
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    university: z.string().trim().min(2, 'University must be at least 2 characters').optional(),
    field_of_study: z
      .string()
      .trim()
      .min(2, 'Field of study must be at least 2 characters')
      .optional(),
    availability: z.string().trim().min(2, 'Availability must be at least 2 characters').optional(),
    subjects: z
      .array(z.string().trim().min(1, 'Subject cannot be empty'))
      .min(1, 'At least one subject is required')
      .optional(),
    subject_specializations: z
      .array(z.string().trim().min(1, 'Subject cannot be empty'))
      .min(1, 'At least one subject is required')
      .optional(),
  })
  .strict()
  .transform(data => {
    return {
      full_name: data.full_name || data.name,
      university: data.university,
      field_of_study: data.field_of_study,
      subjects: data.subjects || data.subject_specializations,
      availability: data.availability,
    };
  });

const updatePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
  })
  .strict();

const createSupportReportSchema = z
  .object({
    student_name: z.string().trim().min(2, 'Student name must be at least 2 characters'),
    support_need: z.string().trim().min(2, 'Support need is required').optional(),
    support_need_observed: z.string().trim().min(2, 'Support need is required').optional(),
    observations: z.string().trim().min(10, 'Observations must be at least 10 characters'),
    recommended_action: z
      .string()
      .trim()
      .min(2, 'Recommended action must be at least 2 characters'),
  })
  .strict()
  .refine(data => Boolean(data.support_need || data.support_need_observed), {
    message: 'Support need is required',
    path: ['support_need'],
  })
  .transform(data => ({
    student_name: data.student_name,
    support_need: data.support_need || data.support_need_observed,
    observations: data.observations,
    recommended_action: data.recommended_action,
  }));

module.exports = {
  mentorLoginSchema,
  updateProfileSchema,
  updatePasswordSchema,
  createSupportReportSchema,
  supportReportSchema: createSupportReportSchema,
};
