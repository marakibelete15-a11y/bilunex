-- Migration: 007_inquiries
-- Table: inquiries
-- SRS Requirements: FR-1.11, FR-1.12, FR-4.1, FR-5.4, NFR-2, NFR-3

-- migrate:up
CREATE TABLE inquiries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
  email CITEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone VARCHAR(50) CHECK (phone IS NULL OR length(trim(phone)) > 0),
  inquiry_type inquiry_type NOT NULL,
  message TEXT NOT NULL CHECK (length(trim(message)) > 0),
  status inquiry_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiries_inquiry_type ON inquiries (inquiry_type);
CREATE INDEX idx_inquiries_status ON inquiries (status);

CREATE TRIGGER trg_inquiries_updated_at
BEFORE UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- migrate:down
DROP TRIGGER IF EXISTS trg_inquiries_updated_at ON inquiries;
DROP INDEX IF EXISTS idx_inquiries_status;
DROP INDEX IF EXISTS idx_inquiries_inquiry_type;
DROP TABLE IF EXISTS inquiries CASCADE;
