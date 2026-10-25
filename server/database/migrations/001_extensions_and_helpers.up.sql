-- ==============================================================================
-- Migration: 001_extensions_and_helpers.up.sql
-- Installs extensions and shared trigger function for updated_at timestamps.
-- ==============================================================================

-- Trigram extension for fast similarity / wildcard text indexing
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Shared function automatically updating updated_at column on row modification
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
