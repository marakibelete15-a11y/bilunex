-- ==============================================================================
-- Bilunex PostgreSQL Schema - Stage 1
-- Tables: admin_users, parent_registrations, mentor_applications,
--         inquiries, mentor_profiles, student_support_reports
-- ==============================================================================

-- 1. Administrative Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
  email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password_hash VARCHAR(255) NOT NULL CHECK (length(password_hash) >= 20),
  role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Parent Registrations Table
CREATE TABLE IF NOT EXISTS parent_registrations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_name VARCHAR(255) NOT NULL CHECK (length(trim(parent_name)) > 0),
  phone_or_telegram VARCHAR(100) NOT NULL CHECK (length(trim(phone_or_telegram)) > 0),
  email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  child_name VARCHAR(255) NOT NULL CHECK (length(trim(child_name)) > 0),
  grade_level VARCHAR(50) NOT NULL CHECK (length(trim(grade_level)) > 0),
  subjects TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Registered', 'Closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Mentor Applications Table
CREATE TABLE IF NOT EXISTS mentor_applications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL CHECK (length(trim(full_name)) > 0),
  contact VARCHAR(255) NOT NULL CHECK (length(trim(contact)) > 0),
  university VARCHAR(255) NOT NULL CHECK (length(trim(university)) > 0),
  field_of_study VARCHAR(255) NOT NULL CHECK (length(trim(field_of_study)) > 0),
  year VARCHAR(50) NOT NULL CHECK (length(trim(year)) > 0),
  subjects TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT NOT NULL CHECK (length(trim(availability)) > 0),
  motivation TEXT NOT NULL CHECK (length(trim(motivation)) > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'Application received' CHECK (
    status IN (
      'Application received',
      'Under review',
      'Interview stage',
      'Accepted',
      'Rejected',
      'Onboarding'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Inquiries & Contact Table
CREATE TABLE IF NOT EXISTS inquiries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
  contact VARCHAR(255) NOT NULL CHECK (length(trim(contact)) > 0),
  inquiry_type VARCHAR(50) NOT NULL CHECK (
    inquiry_type IN ('General', 'Parent support', 'Mentor application', 'Counseling request')
  ),
  message TEXT NOT NULL CHECK (length(trim(message)) > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In progress', 'Closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Active Mentor Profiles Table
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id BIGINT REFERENCES mentor_applications(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
  email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password_hash VARCHAR(255) NOT NULL CHECK (length(password_hash) >= 20),
  university VARCHAR(255) NOT NULL CHECK (length(trim(university)) > 0),
  field_of_study VARCHAR(255) NOT NULL CHECK (length(trim(field_of_study)) > 0),
  subject_specializations TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT NOT NULL CHECK (length(trim(availability)) > 0),
  account_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Student Support Reports Table (Confidential Mentor Reports)
CREATE TABLE IF NOT EXISTS student_support_reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mentor_id BIGINT NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL CHECK (length(trim(student_name)) > 0),
  support_need_observed VARCHAR(255) NOT NULL CHECK (length(trim(support_need_observed)) > 0),
  observations TEXT NOT NULL CHECK (length(trim(observations)) > 0),
  recommended_action TEXT NOT NULL CHECK (length(trim(recommended_action)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes for search and filter queries
CREATE INDEX IF NOT EXISTS idx_parent_status ON parent_registrations (status);
CREATE INDEX IF NOT EXISTS idx_parent_created_at ON parent_registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_app_status ON mentor_applications (status);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status);
CREATE INDEX IF NOT EXISTS idx_support_reports_mentor ON student_support_reports (mentor_id);
