-- ==============================================================================
-- Migration: 002_enums.down.sql
-- ==============================================================================

DROP TYPE IF EXISTS notification_status CASCADE;
DROP TYPE IF EXISTS inquiry_status CASCADE;
DROP TYPE IF EXISTS inquiry_type CASCADE;
DROP TYPE IF EXISTS parent_registration_status CASCADE;
DROP TYPE IF EXISTS mentor_account_status CASCADE;
DROP TYPE IF EXISTS mentor_application_status CASCADE;
DROP TYPE IF EXISTS admin_role CASCADE;
