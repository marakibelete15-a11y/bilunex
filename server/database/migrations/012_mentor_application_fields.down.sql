-- ==============================================================================
-- Migration: 012_mentor_application_fields.down.sql
-- ==============================================================================

ALTER TABLE mentor_applications
  DROP COLUMN IF EXISTS referral_source,
  DROP COLUMN IF EXISTS commitment_agreement,
  DROP COLUMN IF EXISTS available_hours,
  DROP COLUMN IF EXISTS available_days,
  DROP COLUMN IF EXISTS entrance_exam_result,
  DROP COLUMN IF EXISTS gpa,
  DROP COLUMN IF EXISTS experience_details,
  DROP COLUMN IF EXISTS teaching_experience_duration,
  DROP COLUMN IF EXISTS has_teaching_experience,
  DROP COLUMN IF EXISTS campus;
