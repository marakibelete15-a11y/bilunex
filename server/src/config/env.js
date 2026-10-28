/**
 * Bilunex - Environment Variable Validation
 * Validates process.env at startup using Zod and fails fast with actionable errors if anything is missing.
 */

const dotenv = require('dotenv');
const { z } = require('zod');
const path = require('path');

// Load .env from server root or project root if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform(val => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for database connection'),
  TEST_DATABASE_URL: z.string().min(1, 'TEST_DATABASE_URL is required for test isolation'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters for security'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  EMAIL_HOST: z.string().optional().default(''),
  EMAIL_PORT: z
    .union([z.string(), z.number()])
    .optional()
    .default('587')
    .transform(val => parseInt(String(val), 10) || 587),
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('"Bilunex Support" <no-reply@bilunex.org>'),
  ADMIN_NOTIFICATION_EMAIL: z
    .string()
    .min(1, 'ADMIN_NOTIFICATION_EMAIL is required')
    .default('admin@bilunex.org'),
  CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('\n❌ CRITICAL CONFIGURATION ERROR: Invalid or missing environment variables:\n');
  result.error.issues.forEach(issue => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  console.error('\nPlease copy .env.example to .env and configure all required variables.\n');

  // Fail fast on invalid environment outside test suite
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

// In test environment, if parsing failed, fallback to safe mock values to prevent runner crashes
const env = result.success
  ? result.data
  : {
      PORT: 5000,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://localhost:5432/bilunex_test',
      TEST_DATABASE_URL: 'postgresql://localhost:5432/bilunex_test',
      JWT_SECRET: 'test_secret_key_at_least_16_characters',
      JWT_EXPIRES_IN: '1d',
      EMAIL_HOST: 'localhost',
      EMAIL_PORT: 2525,
      EMAIL_USER: 'test_user',
      EMAIL_PASS: 'test_pass',
      ADMIN_NOTIFICATION_EMAIL: 'admin@bilunex.org',
      CLIENT_URL: 'http://localhost:5000',
    };

module.exports = env;
