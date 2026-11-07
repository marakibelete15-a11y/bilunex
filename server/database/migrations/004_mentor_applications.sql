-- Migration: 004_mentor_applications
-- Table: mentor_applications
-- SRS Requirements: FR-3.1, FR-3.2, FR-3.4, FR-3.5, FR-5.3, NFR-2, NFR-3

-- migrate:up
CREATE TABLE mentor_applications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL CHECK (length(trim(full_name)) > 0),
  email CITEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone VARCHAR(50) NOT NULL CHECK (length(trim(phone)) > 0),
  telegram_handle VARCHAR(100) CHECK (telegram_handle IS NULL OR length(trim(telegram_handle)) > 0),
  university VARCHAR(255) NOT NULL CHECK (length(trim(university)) > 0),
  field_of_study VARCHAR(255) NOT NULL CHECK (length(trim(field_of_study)) > 0),
  year_of_study VARCHAR(50) NOT NULL CHECK (length(trim(year_of_study)) > 0),
  subjects TEXT[] NOT NULL CHECK (array_length(subjects, 1) > 0),
  availability TEXT NOT NULL CHECK (length(trim(availability)) > 0),
  motivation TEXT NOT NULL CHECK (length(trim(motivation)) > 0),
  status application_status NOT NULL DEFAULT 'application_received',
  admin_notes TEXT CHECK (admin_notes IS NULL OR length(trim(admin_notes)) > 0),
  reviewed_by BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mentor_applications_status ON mentor_applications (status);
CREATE INDEX idx_mentor_applications_email ON mentor_applications (email);

CREATE TRIGGER trg_mentor_applications_updated_at
BEFORE UPDATE ON mentor_applications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- migrate:down
DROP TRIGGER IF EXISTS trg_mentor_applications_updated_at ON mentor_applications;
DROP INDEX IF EXISTS idx_mentor_applications_email;
DROP INDEX IF EXISTS idx_mentor_applications_status;
DROP TABLE IF EXISTS mentor_applications CASCADE;
