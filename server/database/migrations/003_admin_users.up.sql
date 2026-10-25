-- ==============================================================================
-- Migration: 003_admin_users.up.sql
-- Table: admin_users
-- ==============================================================================

CREATE TABLE admin_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
  email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password_hash VARCHAR(255) NOT NULL CHECK (length(password_hash) >= 20),
  role admin_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Case-insensitive unique email index
CREATE UNIQUE INDEX uq_admin_users_email ON admin_users (LOWER(email));

-- Auto-update updated_at timestamp trigger
CREATE TRIGGER trg_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
