/**
 * Bilunex - Public API Validators
 * Strict validation for public intake forms: parent registrations, mentor applications, inquiries.
 */

const { z } = require('zod');

const createParentRegistrationSchema = z
  .object({
    parent_name: z.string().trim().min(2, 'Parent name must be at least 2 characters'),
    email: z.string().trim().email('Please provide a valid email address'),
    phone: z.string().trim().min(7, 'Please provide a valid phone number'),
    telegram_handle: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform(val => (val && val.length > 0 ? val : null)),
    child_name: z.string().trim().min(2, 'Child name must be at least 2 characters'),
    grade_level: z.string().trim().min(1, 'Grade level is required'),
    subjects: z
      .array(z.string().trim().min(1, 'Subject name cannot be empty'))
      .min(1, 'At least one subject must be specified'),
    support_category: z
      .enum(['tutoring', 'mentoring', 'counseling', 'combined'], {
        errorMap: () => ({
          message: 'Support category must be tutoring, mentoring, counseling, or combined',
        }),
      })
      .default('combined'),
    notes: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform(val => (val && val.length > 0 ? val : null)),
  })
  .strict();

const createMentorApplicationSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    email: z.string().trim().email('Please provide a valid email address'),
    phone: z.string().trim().min(7, 'Please provide a valid phone number'),
    telegram_handle: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform(val => (val && val.length > 0 ? val : null)),
    university: z.string().trim().min(2, 'University must be at least 2 characters'),
    field_of_study: z.string().trim().min(2, 'Field of study must be at least 2 characters'),
    academic_year: z.string().trim().min(1, 'Academic year is required'),
    subjects: z
      .array(z.string().trim().min(1, 'Subject name cannot be empty'))
      .min(1, 'At least one subject must be specified'),
    availability: z.string().trim().min(2, 'Availability must be at least 2 characters'),
    motivation: z.string().trim().min(10, 'Motivation must be at least 10 characters'),
  })
  .strict();

const createInquirySchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Please provide a valid email address'),
    phone: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform(val => (val && val.length > 0 ? val : null)),
    inquiry_type: z
      .enum(['general', 'parent_support', 'mentor_application', 'counseling'], {
        errorMap: () => ({
          message:
            'Inquiry type must be general, parent_support, mentor_application, or counseling',
        }),
      })
      .default('general'),
    message: z.string().trim().min(5, 'Message must be at least 5 characters'),
  })
  .strict();

module.exports = {
  createParentRegistrationSchema,
  createMentorApplicationSchema,
  createInquirySchema,
};
