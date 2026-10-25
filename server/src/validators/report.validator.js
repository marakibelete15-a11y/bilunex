/**
 * Bilunex - Student Support Report Validator Schema
 */

const { z } = require('zod');

const supportReportSchema = z.object({
  student_name: z.string().min(2, 'Student name is required'),
  session_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Session date must be in YYYY-MM-DD format'),
  duration_minutes: z
    .number()
    .int()
    .min(15, 'Duration must be at least 15 minutes')
    .max(360, 'Duration cannot exceed 360 minutes'),
  session_focus: z.string().min(3, 'Session focus topics are required'),
  observations: z.string().min(10, 'Session observations must be at least 10 characters'),
  action_items: z.string().optional().default(''),
  progress_rating: z.number().int().min(1).max(5, 'Progress rating must be between 1 and 5'),
});

module.exports = {
  supportReportSchema,
};
