-- ==============================================================================
-- Bilunex Initial Seed Data
-- ==============================================================================

-- 1. Default Admin User (Password: Admin123!)
-- Hash generated via bcrypt (cost factor 10): $2b$10$qR6iVzT3Rfx.z44vQ0H2vOsQj6v8k6mI5mQo5v3C3L2B0Z9Qy6tSa
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'System Administrator',
  'admin@bilunex.org',
  '$2b$10$qR6iVzT3Rfx.z44vQ0H2vOsQj6v8k6mI5mQo5v3C3L2B0Z9Qy6tSa',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- 2. Sample Mentor User (Password: Mentor123!)
-- Hash generated via bcrypt (cost factor 10): $2b$10$7ZqZgG2H9lP0oJ3uY5tReO7gP9hF3vC1bN5mK2jH8gF4dS6aQ8wE2
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Dr. Sarah Johnson',
  'mentor@bilunex.org',
  '$2b$10$7ZqZgG2H9lP0oJ3uY5tReO7gP9hF3vC1bN5mK2jH8gF4dS6aQ8wE2',
  'mentor'
)
ON CONFLICT (email) DO NOTHING;

-- 3. Mentor Profile for Dr. Sarah Johnson
INSERT INTO mentors (user_id, phone, expertise, years_experience, bio, status)
SELECT id, '+1 (555) 234-5678', 'Mathematics, Physics, College Prep', 6, 'Passionate STEM educator with a PhD in Physics. Dedicated to helping high school students build analytical thinking and confidence.', 'active'
FROM users
WHERE email = 'mentor@bilunex.org'
ON CONFLICT (user_id) DO NOTHING;

-- 4. Sample Parent Registration
INSERT INTO parent_registrations (parent_name, email, phone, student_name, student_grade, support_type, notes, status)
VALUES (
  'David Miller',
  'david.miller@example.com',
  '+1 (555) 345-6789',
  'Leo Miller',
  'High School (9-12)',
  'combined',
  'Looking for algebra tutoring and weekly mentoring to improve study habits.',
  'new'
);

-- 5. Sample Mentor Application
INSERT INTO mentor_applications (full_name, email, phone, expertise, years_experience, bio, status)
VALUES (
  'Maya Rodriguez',
  'maya.rodriguez@example.com',
  '+1 (555) 456-7890',
  'English Literature, Creative Writing, Youth Counseling',
  4,
  'High school humanities teacher passionate about student mental wellness and creative expression.',
  'pending'
);
