-- ==============================================================================
-- Migration: 014_notification_log_fields.down.sql
-- ==============================================================================

DROP INDEX IF EXISTS idx_notification_log_status_created;
DROP INDEX IF EXISTS idx_notification_log_role;
ALTER TABLE notification_log DROP COLUMN IF EXISTS recipient_role;
