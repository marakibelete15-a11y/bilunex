/**
 * Bilunex - Public API Validators
 * Strict validation for public intake forms: parent registrations, mentor applications, inquiries.
 * Traces to SRS: FR-2.1, FR-2.2, FR-3.1, FR-3.2, FR-4.1
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
      )
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform(val => (val && val.length > 0 ? val : null)),
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
      .max(100, 'Telegram handle must be at most 100 characters')
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform(val => (val && val.length > 0 ? val : null)),
    child_name: z.string().trim().min(2, 'Child name must be at least 2 characters'),
    grade_level: z.string().trim().min(1, 'Grade level is required'),
    subjects: z.preprocess(
      val => {
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
          return val
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        }
        return val;
      },
      z
        .array(z.string().trim().min(1, 'Subject name cannot be empty'))
        .min(1, 'At least one subject must be specified')
    ),
    notes: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform(val => (val && val.length > 0 ? val : null)),
  })
  .strict()
  .refine(data => Boolean(data.phone || data.telegram_handle), {
    message: 'At least one contact method (phone or telegram handle) is required',
    path: ['phone'],
  });

const createMentorApplicationSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    email: z.string().trim().email('Please provide a valid email address'),
    phone: z
      .string()
      .trim()
      .regex(
        ETHIOPIAN_PHONE_REGEX,
        'Phone number must follow Ethiopian format (+2519XXXXXXXX or 09XXXXXXXX)'
      ),
    telegram_username: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform(val => (val && val.length > 0 ? val : null)),
    telegram_handle: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform(val => (val && val.length > 0 ? val : null)),
    university: z.string().trim().min(2, 'University must be at least 2 characters').optional(),
    university_name: z
      .string()
      .trim()
      .min(2, 'University name must be at least 2 characters')
      .optional(),
    field_of_study: z.string().trim().min(2, 'Field of study / department is required').optional(),
    department: z.string().trim().min(2, 'Field of study / department is required').optional(),
    academic_year: z.string().trim().min(1, 'Academic year / year of study is required').optional(),
    year_of_study: z.string().trim().min(1, 'Academic year / year of study is required').optional(),
    subjects: z.preprocess(
      val => {
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
          return val
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        }
        return val;
      },
      z
        .array(
          z
            .string()
            .trim()
            .min(1, 'Subject name cannot be empty')
            .max(50, 'Each subject must be at most 50 characters')
        )
        .min(1, 'At least one subject must be specified')
        .max(17, 'Select no more than 17 subjects')
    ),
    availability: z.string().trim().min(2, 'Availability must be specified').optional(),
    available_hours: z
      .preprocess(val => {
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
          return val
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        }
        return val;
      }, z.array(z.string().trim()))
      .optional(),
    available_days: z
      .preprocess(val => {
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
          return val
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        }
        return val;
      }, z.array(z.string().trim()))
      .optional(),
    motivation: z.string().trim().min(10, 'Motivation must be at least 10 characters'),
  })
  .strict()
  .refine(data => data.university || data.university_name, {
    message: 'University name is required',
    path: ['university'],
  })
  .refine(data => data.field_of_study || data.department, {
    message: 'Field of study / department is required',
    path: ['field_of_study'],
  })
  .refine(data => data.academic_year || data.year_of_study, {
    message: 'Academic year / year of study is required',
    path: ['year_of_study'],
  })
  .refine(
    data =>
      Boolean(
        data.availability ||
        (data.available_hours && data.available_hours.length > 0) ||
        (data.available_days && data.available_days.length > 0)
      ),
    {
      message: 'Availability details must be specified',
      path: ['availability'],
    }
  );

const createInquirySchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Please provide a valid email address'),
    phone: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal(''))
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
