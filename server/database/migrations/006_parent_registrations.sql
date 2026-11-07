-- Migration: 006_parent_registrations
-- Table: parent_registrations
-- SRS Requirements: FR-2.1, FR-2.2, FR-2.3, FR-5.2, NFR-2, NFR-3

-- migrate:up
CREATE TABLE parent_registrations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_name VARCHAR(255) NOT NULL CHECK (length(trim(parent_name)) > 0),
  email CITEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone VARCHAR(50),
  telegram_handle VARCHAR(100),
  child_name VARCHAR(255) NOT NULL CHECK (length(trim(child_name)) > 0),
  grade_level VARCHAR(50) NOT NULL CHECK (length(trim(grade_level)) > 0),
  subjects TEXT[] NOT NULL CHECK (array_length(subjects, 1) > 0),
  notes TEXT CHECK (notes IS NULL OR length(trim(notes)) > 0),
  status registration_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_parent_contact CHECK (
    (phone IS NOT NULL AND length(trim(phone)) > 0) OR
    (telegram_handle IS NOT NULL AND length(trim(telegram_handle)) > 0)
  )
);

CREATE INDEX idx_parent_registrations_status ON parent_registrations (status);
CREATE INDEX idx_parent_registrations_created_at ON parent_registrations (created_at DESC);
CREATE INDEX idx_parent_registrations_email ON parent_registrations (email);

CREATE TRIGGER trg_parent_registrations_updated_at
BEFORE UPDATE ON parent_registrations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- migrate:down
DROP TRIGGER IF EXISTS trg_parent_registrations_updated_at ON parent_registrations;
DROP INDEX IF EXISTS idx_parent_registrations_email;
DROP INDEX IF EXISTS idx_parent_registrations_created_at;
DROP INDEX IF EXISTS idx_parent_registrations_status;
DROP TABLE IF EXISTS parent_registrations CASCADE;
