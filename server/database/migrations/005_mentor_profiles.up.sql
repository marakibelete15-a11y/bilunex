-- ==============================================================================
-- Migration: 005_mentor_profiles.up.sql
-- Table: mentor_profiles
-- Created only after an applicant passes screening and an admin activates it.
-- Linked 1:1 to mentor_applications.
-- ==============================================================================

CREATE TABLE mentor_profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id BIGINT UNIQUE NOT NULL REFERENCES mentor_applications(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
  email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password_hash VARCHAR(255) NOT NULL CHECK (length(password_hash) >= 20),
  phone VARCHAR(50),
  university VARCHAR(255) NOT NULL CHECK (length(trim(university)) > 0),
  field_of_study VARCHAR(255) NOT NULL CHECK (length(trim(field_of_study)) > 0),
  subject_specializations TEXT[] NOT NULL CHECK (array_length(subject_specializations, 1) > 0),
  availability TEXT NOT NULL CHECK (length(trim(availability)) > 0),
  account_status mentor_account_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Case-insensitive unique email index
CREATE UNIQUE INDEX uq_mentor_profiles_email ON mentor_profiles (LOWER(email));

-- Auto-update updated_at trigger
CREATE TRIGGER trg_mentor_profiles_updated_at
BEFORE UPDATE ON mentor_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
