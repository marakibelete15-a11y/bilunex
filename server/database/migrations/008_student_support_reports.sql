-- Migration: 008_student_support_reports
-- Table: student_support_reports
-- SRS Requirements: FR-5.7, FR-6.1, FR-6.3, FR-8.1, FR-8.2, FR-8.3, NFR-2, NFR-3

-- migrate:up
CREATE TABLE student_support_reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mentor_id BIGINT NOT NULL REFERENCES mentor_profiles(id) ON DELETE RESTRICT,
  student_name VARCHAR(255) NOT NULL CHECK (length(trim(student_name)) > 0),
  support_need TEXT NOT NULL CHECK (length(trim(support_need)) > 0),
  observations TEXT NOT NULL CHECK (length(trim(observations)) > 0),
  recommended_action TEXT NOT NULL CHECK (length(trim(recommended_action)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_support_reports_mentor_created ON student_support_reports (mentor_id, created_at DESC);

CREATE TRIGGER trg_student_support_reports_updated_at
BEFORE UPDATE ON student_support_reports
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- migrate:down
DROP TRIGGER IF EXISTS trg_student_support_reports_updated_at ON student_support_reports;
DROP INDEX IF EXISTS idx_student_support_reports_mentor_created;
DROP TABLE IF EXISTS student_support_reports CASCADE;
