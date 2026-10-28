-- ==============================================================================
-- Migration: 012_mentor_application_fields.up.sql
-- Expand mentor_applications table with academic, experience, and commitment details
-- ==============================================================================

ALTER TABLE mentor_applications
  ADD COLUMN IF NOT EXISTS campus VARCHAR(255),
  ADD COLUMN IF NOT EXISTS has_teaching_experience BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS teaching_experience_duration VARCHAR(100),
  ADD COLUMN IF NOT EXISTS experience_details TEXT,
  ADD COLUMN IF NOT EXISTS gpa NUMERIC(3,2) CHECK (gpa IS NULL OR (gpa >= 0.00 AND gpa <= 4.00)),
  ADD COLUMN IF NOT EXISTS entrance_exam_result NUMERIC(5,1) CHECK (entrance_exam_result IS NULL OR (entrance_exam_result >= 0.0 AND entrance_exam_result <= 700.0)),
  ADD COLUMN IF NOT EXISTS available_days TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_hours VARCHAR(255),
  ADD COLUMN IF NOT EXISTS commitment_agreement BOOLEAN NOT NULL DEFAULT TRUE CHECK (commitment_agreement = TRUE),
  ADD COLUMN IF NOT EXISTS referral_source VARCHAR(255);
