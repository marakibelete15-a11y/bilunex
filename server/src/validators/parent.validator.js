/**
 * Bilunex - Parent Registration Validator Schema
 */

const { z } = require('zod');

const parentRegistrationSchema = z.object({
  parent_name: z.string().min(2, 'Parent name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  phone: z.string().min(7, 'Please provide a valid contact phone number'),
  student_name: z.string().min(2, 'Student name must be at least 2 characters'),
  student_grade: z.string().min(1, 'Student grade level is required'),
  support_type: z.enum(['tutoring', 'mentoring', 'counseling', 'combined'], {
    errorMap: () => ({
      message: 'Support type must be tutoring, mentoring, counseling, or combined',
    }),
  }),
  notes: z.string().optional().default(''),
});

module.exports = {
  parentRegistrationSchema,
};
