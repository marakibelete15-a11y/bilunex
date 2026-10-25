/**
 * Bilunex - Inquiry Repository
 * ALL SQL queries regarding contact and counseling inquiries live here.
 */

const db = require('../config/db');

const inquiryRepository = {
  /**
   * Save a new inquiry submission
   */
  async create({ name, email, phone = null, inquiry_type = 'general', message }) {
    const text = `
      INSERT INTO inquiries (name, email, phone, inquiry_type, message, status)
      VALUES ($1, $2, $3, $4, $5, 'new')
      RETURNING *;
    `;
    const res = await db.query(text, [name, email, phone, inquiry_type, message]);
    return res.rows[0];
  },

  /**
   * Find inquiry by ID
   */
  async findById(id) {
    const text = `
      SELECT *
      FROM inquiries
      WHERE id = $1 AND deleted_at IS NULL
      LIMIT 1;
    `;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Retrieve inquiries with optional filters and pagination
   */
  async findAll({ type = null, status = null, limit = 50, offset = 0 } = {}) {
    const text = `
      SELECT *
      FROM inquiries
      WHERE deleted_at IS NULL
        AND ($1::inquiry_type IS NULL OR inquiry_type = $1)
        AND ($2::inquiry_status IS NULL OR status = $2)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4;
    `;
    const res = await db.query(text, [type, status, limit, offset]);
    return res.rows;
  },

  /**
   * Count inquiries matching filters
   */
  async countAll({ type = null, status = null } = {}) {
    const text = `
      SELECT COUNT(*)::int AS count
      FROM inquiries
      WHERE deleted_at IS NULL
        AND ($1::inquiry_type IS NULL OR inquiry_type = $1)
        AND ($2::inquiry_status IS NULL OR status = $2);
    `;
    const res = await db.query(text, [type, status]);
    return res.rows[0]?.count || 0;
  },

  /**
   * Group count of inquiries by status
   */
  async countByStatus() {
    const text = `
      SELECT status, COUNT(*)::int AS count
      FROM inquiries
      WHERE deleted_at IS NULL
      GROUP BY status;
    `;
    const res = await db.query(text);
    return res.rows;
  },

  /**
   * Update inquiry status
   */
  async updateStatus(id, status) {
    const text = `
      UPDATE inquiries
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *;
    `;
    const res = await db.query(text, [status, id]);
    return res.rows[0] || null;
  },
};

module.exports = inquiryRepository;
