/**
 * Bilunex - Inquiry Repository
 * Parameterized queries for the inquiries table.
 */

const db = require('../config/db');

const inquiryRepository = {
  async create({ name, email, phone = null, inquiry_type, message }) {
    const text = `
      INSERT INTO inquiries (name, email, phone, inquiry_type, message, status)
      VALUES ($1, $2, $3, $4::inquiry_type, $5, 'new')
      RETURNING *;
    `;
    const res = await db.query(text, [name, email, phone || null, inquiry_type, message]);
    return res.rows[0];
  },

  async findById(id) {
    const text = `SELECT * FROM inquiries WHERE id = $1 LIMIT 1;`;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  async findAll({ inquiry_type = null, status = null, limit = 50, offset = 0 } = {}) {
    const text = `
      SELECT *
      FROM inquiries
      WHERE ($1::inquiry_type IS NULL OR inquiry_type = $1)
        AND ($2::inquiry_status IS NULL OR status = $2)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4;
    `;
    const res = await db.query(text, [inquiry_type, status, limit, offset]);
    return res.rows;
  },

  async countAll({ inquiry_type = null, status = null } = {}) {
    const text = `
      SELECT COUNT(*)::int AS count
      FROM inquiries
      WHERE ($1::inquiry_type IS NULL OR inquiry_type = $1)
        AND ($2::inquiry_status IS NULL OR status = $2);
    `;
    const res = await db.query(text, [inquiry_type, status]);
    return res.rows[0]?.count || 0;
  },

  async updateStatus(id, status) {
    const text = `
      UPDATE inquiries
      SET status = $1::inquiry_status, updated_at = now()
      WHERE id = $2
      RETURNING *;
    `;
    const res = await db.query(text, [status, id]);
    return res.rows[0] || null;
  },

  async countByStatus() {
    const text = `
      SELECT status, COUNT(*)::int AS count
      FROM inquiries
      GROUP BY status;
    `;
    const res = await db.query(text);
    return res.rows;
  },
};

module.exports = inquiryRepository;
