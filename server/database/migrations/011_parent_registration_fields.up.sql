-- ==============================================================================
-- Migration: 011_parent_registration_fields.up.sql
-- Add Google Form parent fields: preferred_title, secondary_phone, preferred_communication_method
-- ==============================================================================

ALTER TABLE parent_registrations
  ADD COLUMN IF NOT EXISTS preferred_title VARCHAR(50),
  ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS preferred_communication_method TEXT[] NOT NULL DEFAULT '{"phone_call"}';

ALTER TABLE parent_registrations
  ADD CONSTRAINT chk_parent_secondary_phone
  CHECK (secondary_phone IS NULL OR secondary_phone ~* '^(\+2519\d{8}|09\d{8})$');
