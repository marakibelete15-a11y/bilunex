-- Migration: 001_extensions_and_functions
-- Description: Enable required extensions (citext, pgcrypto) and create shared set_updated_at trigger function
-- SRS Requirements: FR-2.3, NFR-2, NFR-3, NFR-6

-- migrate:up
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- migrate:down
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
DROP EXTENSION IF EXISTS citext CASCADE;
