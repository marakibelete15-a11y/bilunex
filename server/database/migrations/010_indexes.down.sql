-- ==============================================================================
-- Migration: 010_indexes.down.sql
-- ==============================================================================

DROP INDEX IF EXISTS idx_support_reports_created_active;
DROP INDEX IF EXISTS idx_mentor_profiles_specs_gin;
DROP INDEX IF EXISTS idx_mentor_profiles_status;
DROP INDEX IF EXISTS idx_inquiries_created_active;
DROP INDEX IF EXISTS idx_inquiries_type_status_active;
DROP INDEX IF EXISTS idx_mentor_app_name_trgm;
DROP INDEX IF EXISTS idx_mentor_app_subjects_gin;
DROP INDEX IF EXISTS idx_mentor_app_created_active;
DROP INDEX IF EXISTS idx_mentor_app_status_active;
DROP INDEX IF EXISTS idx_parent_reg_child_name_trgm;
DROP INDEX IF EXISTS idx_parent_reg_parent_name_trgm;
DROP INDEX IF EXISTS idx_parent_reg_email_active;
DROP INDEX IF EXISTS idx_parent_reg_created_active;
DROP INDEX IF EXISTS idx_parent_reg_subjects_gin;
DROP INDEX IF EXISTS idx_parent_reg_grade_active;
DROP INDEX IF EXISTS idx_parent_reg_status_active;
