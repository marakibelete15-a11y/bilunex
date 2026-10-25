-- ==============================================================================
-- Migration: 009_logs.up.sql
-- Tables: notification_log, audit_log
-- ==============================================================================

-- 1. Notification Dispatch Log
CREATE TABLE notification_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notification_type VARCHAR(100) NOT NULL CHECK (length(trim(notification_type)) > 0),
  recipient VARCHAR(255) NOT NULL CHECK (length(trim(recipient)) > 0),
  related_entity_type VARCHAR(100),
  related_entity_id BIGINT,
  status notification_status NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_log_created_at ON notification_log (created_at DESC);
CREATE INDEX idx_notification_log_status ON notification_log (status);
CREATE INDEX idx_notification_log_related ON notification_log (related_entity_type, related_entity_id);

-- 2. Audit Log for Sensitive Access & Mutations
CREATE TABLE audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_type VARCHAR(50) NOT NULL CHECK (actor_type IN ('admin', 'mentor', 'system')),
  actor_id BIGINT,
  actor_email VARCHAR(255),
  action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete', 'activate', 'login', 'export')),
  target_table VARCHAR(100) NOT NULL CHECK (length(trim(target_table)) > 0),
  target_id BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_created_at ON audit_log (created_at DESC);
CREATE INDEX idx_audit_log_actor ON audit_log (actor_type, actor_id);
CREATE INDEX idx_audit_log_target ON audit_log (target_table, target_id);
