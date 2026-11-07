/**
 * Bilunex - Parent Registration Repository
 * Parameterized queries for parent_registrations table.
 */

const db = require('../config/db');

const parentRepository = {
  async create({
    parent_name,
    email,
    phone,
    telegram_handle,
    child_name,
    grade_level,
    subjects,
    notes,
  }) {
    const text = `
      INSERT INTO parent_registrations (
        parent_name, email, phone, telegram_handle, child_name, grade_level, subjects, notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new')
      RETURNING *;
    `;
    const res = await db.query(text, [
      parent_name,
      email,
      phone || null,
      telegram_handle || null,
      child_name,
      grade_level,
      subjects,
      notes || null,
    ]);
    return res.rows[0];
  },

  async findById(id) {
    const text = `SELECT * FROM parent_registrations WHERE id = $1 LIMIT 1;`;
    const res = await db.query(text, [id]);
    return res.rows[0] || null;
  },

  async findAll({ search = null, status = null, grade_level = null, limit = 50, offset = 0 } = {}) {
    const searchPattern = search ? `%${search.trim()}%` : null;
    const text = `
      SELECT *
      FROM parent_registrations
      WHERE ($1::text IS NULL OR parent_name ILIKE $1 OR email::text ILIKE $1 OR child_name ILIKE $1)
        AND ($2::registration_status IS NULL OR status = $2)
        AND ($3::varchar IS NULL OR grade_level = $3)
      ORDER BY created_at DESC
      LIMIT $4 OFFSET $5;
    `;
    const res = await db.query(text, [searchPattern, status, grade_level, limit, offset]);
    return res.rows;
  },

  async countAll({ search = null, status = null, grade_level = null } = {}) {
    const searchPattern = search ? `%${search.trim()}%` : null;
    const text = `
      SELECT COUNT(*)::int AS count
      FROM parent_registrations
      WHERE ($1::text IS NULL OR parent_name ILIKE $1 OR email::text ILIKE $1 OR child_name ILIKE $1)
        AND ($2::registration_status IS NULL OR status = $2)
        AND ($3::varchar IS NULL OR grade_level = $3);
    `;
    const res = await db.query(text, [searchPattern, status, grade_level]);
    return res.rows[0]?.count || 0;
  },

  async updateStatus(id, status) {
    const text = `
      UPDATE parent_registrations
      SET status = $1::registration_status, updated_at = now()
      WHERE id = $2
      RETURNING *;
    `;
    const res = await db.query(text, [status, id]);
    return res.rows[0] || null;
  },

  async countByStatus() {
    const text = `
      SELECT status, COUNT(*)::int AS count
      FROM parent_registrations
      GROUP BY status
      ORDER BY
        CASE status
          WHEN 'new' THEN 1
          WHEN 'contacted' THEN 2
          WHEN 'matched' THEN 3
          WHEN 'closed' THEN 4
        END;
    `;
    const res = await db.query(text);
    return res.rows;
  },

  findWithFilters(args) {
    return this.findAll(args);
  },

  countWithFilters(args) {
    return this.countAll(args);
  },
};

module.exports = parentRepository;
