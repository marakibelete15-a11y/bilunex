-- ==============================================================================
-- Migration: 009_logs.down.sql
-- ==============================================================================

DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS notification_log CASCADE;
