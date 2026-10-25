-- ==============================================================================
-- Migration: 001_extensions_and_helpers.down.sql
-- ==============================================================================

DROP FUNCTION IF EXISTS set_updated_at CASCADE;
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
