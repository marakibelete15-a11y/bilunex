-- ==============================================================================
-- Migration: 010_indexes.up.sql
-- High-performance partial indexes for real administrative queries.
-- All operational indexes exclude soft-deleted rows (WHERE deleted_at IS NULL).
-- ==============================================================================

-- 1. Parent Registrations Search & Filter Indexes
CREATE INDEX idx_parent_reg_status_active 
  ON parent_registrations (status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_parent_reg_grade_active 
  ON parent_registrations (grade_level) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_parent_reg_subjects_gin 
  ON parent_registrations USING GIN (subjects) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_parent_reg_created_active 
  ON parent_registrations (created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_parent_reg_email_active 
  ON parent_registrations (LOWER(email)) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_parent_reg_parent_name_trgm 
  ON parent_registrations USING GIN (parent_name gin_trgm_ops) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_parent_reg_child_name_trgm 
  ON parent_registrations USING GIN (child_name gin_trgm_ops) 
  WHERE deleted_at IS NULL;

-- 2. Mentor Applications Filter & Search Indexes
CREATE INDEX idx_mentor_app_status_active 
  ON mentor_applications (status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_mentor_app_created_active 
  ON mentor_applications (created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_mentor_app_subjects_gin 
  ON mentor_applications USING GIN (subjects) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_mentor_app_name_trgm 
  ON mentor_applications USING GIN (full_name gin_trgm_ops) 
  WHERE deleted_at IS NULL;

-- 3. Inquiries Type & Status Filter Indexes
CREATE INDEX idx_inquiries_type_status_active 
  ON inquiries (inquiry_type, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_inquiries_created_active 
  ON inquiries (created_at DESC) 
  WHERE deleted_at IS NULL;

-- 4. Mentor Profiles Roster Indexes
CREATE INDEX idx_mentor_profiles_status 
  ON mentor_profiles (account_status);

CREATE INDEX idx_mentor_profiles_specs_gin 
  ON mentor_profiles USING GIN (subject_specializations);

-- 5. Student Support Reports Chronological Feed Index
CREATE INDEX idx_support_reports_created_active 
  ON student_support_reports (created_at DESC) 
  WHERE deleted_at IS NULL;
