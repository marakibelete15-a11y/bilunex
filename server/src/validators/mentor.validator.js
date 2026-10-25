/**
 * Bilunex - Mentor Validator Schemas
 */

const { z } = require('zod');

const mentorApplicationSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  phone: z.string().min(7, 'Please provide a valid phone number'),
  expertise: z.string().min(2, 'Areas of expertise are required'),
  years_experience: z.number().int().nonnegative('Years of experience must be non-negative'),
  bio: z.string().min(20, 'Background statement must be at least 20 characters'),
});

const applicationStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be pending, approved, or rejected' }),
  }),
});

module.exports = {
  mentorApplicationSchema,
  applicationStatusSchema,
};
