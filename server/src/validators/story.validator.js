const { z } = require('zod');
const createStorySchema = z
  .object({
    full_name: z.string().trim().min(2).max(255),
    display_style: z.enum(['first_name', 'initials', 'anonymous']),
    relationship: z.enum(['parent_guardian', 'student', 'mentor', 'other']),
    email: z.string().trim().email().optional().or(z.literal('')),
    phone: z.string().trim().max(50).optional().or(z.literal('')),
    title: z.string().trim().min(2).max(160),
    body: z.string().trim().min(50).max(2000),
    consent_genuine: z.literal(true),
    consent_publish: z.literal(true),
    consent_child_guardian: z.literal(true),
    website: z.string().max(255).optional(),
  })
  .strict();
const publicStoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
const adminStoryQuerySchema = publicStoryQuerySchema.extend({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});
const storyStatusSchema = z
  .object({ status: z.enum(['pending', 'approved', 'rejected']) })
  .strict();
const storyIdSchema = z.object({ id: z.coerce.number().int().positive() });
module.exports = {
  createStorySchema,
  publicStoryQuerySchema,
  adminStoryQuerySchema,
  storyStatusSchema,
  storyIdSchema,
};
