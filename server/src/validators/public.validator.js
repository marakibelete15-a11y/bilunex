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
      .transform(val => (val && val.length > 0 ? val : null)),
    telegram_handle: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform(val => (val && val.length > 0 ? val : null)),
    university: z.string().trim().min(2, 'University must be at least 2 characters').optional(),
    university_name: z
      .string()
      .trim()
      .min(2, 'University name must be at least 2 characters')
      .optional(),
    campus: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform(val => (val && val.length > 0 ? val : null)),
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
        .transform(subjects =>
          subjects.map(subject => subject.replace(/<[^>]*>/g, '').trim()).filter(Boolean)
        )
    ),
    has_teaching_experience: z
      .preprocess(val => {
        if (typeof val === 'string') return val === 'true' || val === '1' || val === 'yes';
        return Boolean(val);
      }, z.boolean())
      .default(false),
    teaching_experience: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform(val => (val && val.length > 0 ? val : null)),
    teaching_experience_duration: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform(val => (val && val.length > 0 ? val : null)),
    experience_details: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform(val => (val && val.length > 0 ? val : null)),
    cgpa: z.preprocess(
      val => {
        if (val === '' || val === null || val === undefined) return null;
        return typeof val === 'string' ? parseFloat(val) : val;
      },
      z
        .number({ invalid_type_error: 'CGPA must be numeric' })
        .min(0, 'CGPA cannot be less than 0.00')
        .max(4.0, 'CGPA cannot exceed 4.00')
        .optional()
        .nullable()
    ),
    entrance_exam_stream: z.enum(['natural_science', 'social_science']),
    entrance_exam_result: z.preprocess(
      val => {
        if (val === '' || val === null || val === undefined) return null;
        return typeof val === 'string' ? parseFloat(val) : val;
      },
      z
        .number({ invalid_type_error: 'Entrance exam result must be a number' })
        .min(0, 'Entrance exam result cannot be less than 0')
        .max(700, 'Entrance exam result cannot exceed 700')
        .optional()
        .nullable()
    ),
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
        return val || [];
      }, z.array(z.string().trim()))
      .default([]),
    available_hours: z.preprocess(
      val =>
        typeof val === 'string'
          ? val
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          : val,
      z.array(z.enum(['Morning', 'Afternoon', 'Evening'])).min(1, 'Select available hours')
    ),
    availability: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform(val => (val && val.length > 0 ? val : null)),
    motivation: z.string().trim().min(10, 'Motivation must be at least 10 characters'),
    commitment_agreement: z.preprocess(
      val => {
        if (typeof val === 'string') return val === 'true' || val === '1' || val === 'yes';
        return Boolean(val);
      },
      z.literal(true, {
        errorMap: () => ({ message: 'Commitment agreement must be accepted to apply' }),
      })
    ),
    referral_source: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform(val => (val && val.length > 0 ? val : null)),
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
  .refine(
    data =>
      data.entrance_exam_result == null ||
      data.entrance_exam_result <= (data.entrance_exam_stream === 'social_science' ? 600 : 700),
    {
      message: 'Entrance exam result exceeds the maximum for the selected stream',
      path: ['entrance_exam_result'],
    }
  )
  .refine(data => data.academic_year || data.year_of_study, {
    message: 'Academic year / year of study is required',
    path: ['academic_year'],
  })
  .refine(
    data =>
      data.availability ||
      data.available_hours ||
      (data.available_days && data.available_days.length > 0),
    {
      message: 'Availability details or available days must be specified',
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
