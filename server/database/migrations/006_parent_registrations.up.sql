-- ==============================================================================
-- Migration: 006_parent_registrations.up.sql
-- Table: parent_registrations
-- ==============================================================================

CREATE TABLE parent_registrations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_name VARCHAR(255) NOT NULL CHECK (length(trim(parent_name)) > 0),
  email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone VARCHAR(50) NOT NULL CHECK (length(trim(phone)) > 0),
  telegram_handle VARCHAR(100),
  child_name VARCHAR(255) NOT NULL CHECK (length(trim(child_name)) > 0),
  grade_level VARCHAR(100) NOT NULL CHECK (length(trim(grade_level)) > 0),
  subjects TEXT[] NOT NULL DEFAULT '{}',
  support_category VARCHAR(50) NOT NULL DEFAULT 'combined',
  notes TEXT,
  status parent_registration_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Auto-update updated_at trigger
CREATE TRIGGER trg_parent_registrations_updated_at
BEFORE UPDATE ON parent_registrations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
