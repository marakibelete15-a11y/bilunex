-- ==============================================================================
-- Migration: 011_parent_registration_fields.down.sql
-- ==============================================================================

ALTER TABLE parent_registrations
  DROP CONSTRAINT IF EXISTS chk_parent_secondary_phone,
  DROP COLUMN IF EXISTS preferred_communication_method,
  DROP COLUMN IF EXISTS secondary_phone,
  DROP COLUMN IF EXISTS preferred_title;
