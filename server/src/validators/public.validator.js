/**
 * Bilunex - Public API Validators
 * Strict validation for public intake forms: parent registrations, mentor applications, inquiries.
 */

const { z } = require('zod');

const ETHIOPIAN_PHONE_REGEX = /^(\+2519\d{8}|09\d{8})$/;

const createParentRegistrationSchema = z
  .object({
    preferred_title: z
      .string()
      .trim()
      .max(50, 'Preferred title must be at most 50 characters')
      .optional()
      .nullable()
      .transform(val => (val && val.length > 0 ? val : null)),
    parent_name: z.string().trim().min(2, 'Parent name must be at least 2 characters'),
    email: z.string().trim().email('Please provide a valid email address'),
    phone: z
      .string()
      .trim()
      .regex(
        ETHIOPIAN_PHONE_REGEX,
        'Phone number must follow Ethiopian format (+2519XXXXXXXX or 09XXXXXXXX)'
      ),
    secondary_phone: z
      .string()
      .trim()
      .regex(
        ETHIOPIAN_PHONE_REGEX,
        'Secondary phone must follow Ethiopian format (+2519XXXXXXXX or 09XXXXXXXX)'
      )
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform(val => (val && val.length > 0 ? val : null)),
    preferred_communication_method: z
      .array(z.string().trim())
      .min(1, 'Please select at least one preferred communication method')
      .refine(
        methods =>
          methods.every(m =>
            ['phone_call', 'telegram', 'whatsapp', 'Phone call', 'Telegram', 'WhatsApp'].includes(m)
          ),
        { message: 'Communication method must be Phone call, Telegram, or WhatsApp' }
      )
      .transform(methods => methods.map(m => m.toLowerCase().replace(/\s+/g, '_')))
      .default(['phone_call']),
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
