-- ==============================================================================
-- Migration: 007_student_support_reports.up.sql
-- Table: student_support_reports
-- Confidential session and support observations filed by mentors.
-- Visible to administrators and the reporting mentor only.
-- ==============================================================================

CREATE TABLE student_support_reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mentor_id BIGINT NOT NULL REFERENCES mentor_profiles(id) ON DELETE RESTRICT,
  student_name VARCHAR(255) NOT NULL CHECK (length(trim(student_name)) > 0),
  support_need_observed TEXT NOT NULL CHECK (length(trim(support_need_observed)) > 0),
  observations TEXT NOT NULL CHECK (length(trim(observations)) > 0),
  recommended_action TEXT NOT NULL CHECK (length(trim(recommended_action)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Index for mentor isolation queries (mentor accessing their own reports)
CREATE INDEX idx_student_reports_mentor_id ON student_support_reports (mentor_id)
WHERE deleted_at IS NULL;

-- Auto-update updated_at trigger
CREATE TRIGGER trg_student_support_reports_updated_at
BEFORE UPDATE ON student_support_reports
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
