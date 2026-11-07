-- Migration: 009_notification_log
-- Table: notification_log
-- SRS Requirements: FR-9.1, FR-9.2, FR-9.3, FR-9.4, FR-9.5, NFR-4

-- migrate:up
CREATE TABLE notification_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notification_type notification_type NOT NULL,
  recipient_email CITEXT NOT NULL CHECK (recipient_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  related_table VARCHAR(50) CHECK (related_table IS NULL OR length(trim(related_table)) > 0),
  related_id BIGINT,
  status notification_status NOT NULL,
  error_message TEXT CHECK (error_message IS NULL OR length(trim(error_message)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_log_status ON notification_log (status);
CREATE INDEX idx_notification_log_created_at ON notification_log (created_at DESC);

-- migrate:down
DROP INDEX IF EXISTS idx_notification_log_created_at;
DROP INDEX IF EXISTS idx_notification_log_status;
DROP TABLE IF EXISTS notification_log CASCADE;
