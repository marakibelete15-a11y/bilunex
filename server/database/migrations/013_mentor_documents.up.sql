-- ==============================================================================
-- Migration: 013_mentor_documents.up.sql
-- Create mentor_documents table for secure file metadata storage
-- ==============================================================================

CREATE TABLE mentor_documents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mentor_application_id BIGINT NOT NULL REFERENCES mentor_applications(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('transcript', 'id_photo')),
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL UNIQUE,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_mentor_documents_app_id ON mentor_documents (mentor_application_id);
CREATE INDEX idx_mentor_documents_type ON mentor_documents (document_type);
