-- Migration: 005_mentor_profiles
-- Table: mentor_profiles
-- SRS Requirements: FR-5.6, FR-7.1, FR-7.2, FR-7.3, FR-7.4, FR-7.5, NFR-2, NFR-3

-- migrate:up
CREATE TABLE mentor_profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id BIGINT UNIQUE NOT NULL REFERENCES mentor_applications(id) ON DELETE RESTRICT,
  full_name VARCHAR(255) NOT NULL CHECK (length(trim(full_name)) > 0),
  email CITEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password_hash VARCHAR(255) NOT NULL CHECK (length(password_hash) >= 20),
  university VARCHAR(255) NOT NULL CHECK (length(trim(university)) > 0),
  field_of_study VARCHAR(255) NOT NULL CHECK (length(trim(field_of_study)) > 0),
  subjects TEXT[] NOT NULL CHECK (array_length(subjects, 1) > 0),
  availability TEXT NOT NULL CHECK (length(trim(availability)) > 0),
  account_status mentor_account_status NOT NULL DEFAULT 'active',
  activated_by BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  activated_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_mentor_profiles_updated_at
BEFORE UPDATE ON mentor_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- migrate:down
DROP TRIGGER IF EXISTS trg_mentor_profiles_updated_at ON mentor_profiles;
DROP TABLE IF EXISTS mentor_profiles CASCADE;
