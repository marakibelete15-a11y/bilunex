-- ==============================================================================
-- Migration: 008_inquiries.up.sql
-- Table: inquiries
-- General, parent support, counseling, and mentor inquiries submitted from public forms.
-- ==============================================================================

CREATE TABLE inquiries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
  email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone VARCHAR(50),
  inquiry_type inquiry_type NOT NULL DEFAULT 'general',
  message TEXT NOT NULL CHECK (length(trim(message)) > 0),
  status inquiry_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Auto-update updated_at trigger
CREATE TRIGGER trg_inquiries_updated_at
BEFORE UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
