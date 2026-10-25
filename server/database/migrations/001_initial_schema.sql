-- ==============================================================================
-- Bilunex Database Migration: 001_initial_schema.sql
-- Creates core tables: users, mentors, parent_registrations, mentor_applications, student_support_reports
-- ==============================================================================

-- 1. Users Table (Admins and Mentors)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'mentor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Mentors Profile Table (Extends users with role = 'mentor')
CREATE TABLE IF NOT EXISTS mentors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(50),
  expertise TEXT NOT NULL,
  years_experience INTEGER DEFAULT 0,
  bio TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentors_user_id ON mentors(user_id);
CREATE INDEX IF NOT EXISTS idx_mentors_status ON mentors(status);

-- 3. Parent Registrations Table (Public Intake)
CREATE TABLE IF NOT EXISTS parent_registrations (
  id SERIAL PRIMARY KEY,
  parent_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  student_grade VARCHAR(100) NOT NULL,
  support_type VARCHAR(50) NOT NULL CHECK (support_type IN ('tutoring', 'mentoring', 'counseling', 'combined')),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parent_reg_created ON parent_registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_reg_status ON parent_registrations(status);

-- 4. Mentor Applications Table (Public Applications)
CREATE TABLE IF NOT EXISTS mentor_applications (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  expertise TEXT NOT NULL,
  years_experience INTEGER DEFAULT 0,
  bio TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentor_app_status ON mentor_applications(status);

-- 5. Student Support Reports Table (Confidential session summaries filed by mentors)
CREATE TABLE IF NOT EXISTS student_support_reports (
  id SERIAL PRIMARY KEY,
  mentor_id INTEGER NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  session_date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  session_focus VARCHAR(255) NOT NULL,
  observations TEXT NOT NULL,
  action_items TEXT,
  progress_rating INTEGER NOT NULL CHECK (progress_rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_mentor_id ON student_support_reports(mentor_id);
CREATE INDEX IF NOT EXISTS idx_reports_session_date ON student_support_reports(session_date DESC);
