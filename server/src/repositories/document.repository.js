/**
 * Bilunex - Mentor Document Repository
 * Database access layer for private mentor application documents.
 */

const db = require('../config/db');

const documentRepository = {
  /**
   * Save document metadata linked to mentor application
   */
  async create({
    mentor_application_id,
    document_type,
    original_filename,
    stored_filename,
    file_path,
    mime_type,
    file_size_bytes,
  }) {
    const text = `
      INSERT INTO mentor_documents (
        mentor_application_id, document_type, original_filename,
        stored_filename, file_path, mime_type, file_size_bytes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const res = await db.query(text, [
      mentor_application_id,
      document_type,
      original_filename,
      stored_filename,
      file_path,
      mime_type,
      file_size_bytes,
    ]);
    return res.rows[0];
  },

  /**
   * Find document by primary ID (soft-delete aware)
   */
  async findById(id) {
    const text = `
      SELECT *
      FROM mentor_documents
      WHERE id = $1 AND deleted_at IS NULL
      LIMIT 1;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Find all active documents for a mentor application
   */
  async findByApplicationId(applicationId) {
    const text = `
      SELECT id, mentor_application_id, document_type, original_filename,
             stored_filename, mime_type, file_size_bytes, created_at
      FROM mentor_documents
      WHERE mentor_application_id = $1 AND deleted_at IS NULL
      ORDER BY created_at ASC;
    `;
    const res = await db.query(text, [applicationId]);
    return res.rows;
  },

  /**
   * Soft-delete document metadata
   */
  async softDelete(id) {
    const text = `
      UPDATE mentor_documents
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },
};

module.exports = documentRepository;
