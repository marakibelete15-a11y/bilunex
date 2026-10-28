-- ==============================================================================
-- Migration: 014_notification_log_fields.up.sql
-- Add recipient_role and failure query indexes to notification_log
-- ==============================================================================

ALTER TABLE notification_log
  ADD COLUMN IF NOT EXISTS recipient_role VARCHAR(50) DEFAULT 'unknown';

CREATE INDEX IF NOT EXISTS idx_notification_log_role ON notification_log (recipient_role);
CREATE INDEX IF NOT EXISTS idx_notification_log_status_created ON notification_log (status, created_at);
