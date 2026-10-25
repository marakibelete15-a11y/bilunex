-- ==============================================================================
-- Migration: 004_mentor_applications.up.sql
-- Table: mentor_applications
-- ==============================================================================

CREATE TABLE mentor_applications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL CHECK (length(trim(full_name)) > 0),
  email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone VARCHAR(50) NOT NULL CHECK (length(trim(phone)) > 0),
  telegram_handle VARCHAR(100),
  university VARCHAR(255) NOT NULL CHECK (length(trim(university)) > 0),
  field_of_study VARCHAR(255) NOT NULL CHECK (length(trim(field_of_study)) > 0),
  academic_year VARCHAR(100) NOT NULL CHECK (length(trim(academic_year)) > 0),
  subjects TEXT[] NOT NULL CHECK (array_length(subjects, 1) > 0),
  availability TEXT NOT NULL CHECK (length(trim(availability)) > 0),
  motivation TEXT NOT NULL CHECK (length(trim(motivation)) > 0),
  status mentor_application_status NOT NULL DEFAULT 'application_received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Case-insensitive unique index for active applications
CREATE UNIQUE INDEX uq_mentor_applications_email ON mentor_applications (LOWER(email))
WHERE deleted_at IS NULL;

-- Auto-update updated_at trigger
CREATE TRIGGER trg_mentor_applications_updated_at
BEFORE UPDATE ON mentor_applications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
