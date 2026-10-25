/**
 * Bilunex - Audit Log Repository
 * ALL SQL queries regarding audit logging live here.
 * Tracks access and mutations to sensitive parent, student, and mentor records.
 */

const db = require('../config/db');

const auditLogRepository = {
  /**
   * Insert a new audit log record
   */
  async create({
    actor_type = 'system',
    actor_id = null,
    actor_email = null,
    action,
    target_table,
    target_id = null,
    metadata = {},
  }) {
    const text = `
      INSERT INTO audit_log (
        actor_type, actor_id, actor_email, action, target_table, target_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      RETURNING id, actor_type, actor_email, action, target_table, target_id, metadata, created_at;
    `;
    const res = await db.query(text, [
      actor_type,
      actor_id,
      actor_email,
      action,
      target_table,
      target_id,
      JSON.stringify(metadata || {}),
    ]);
    return res.rows[0];
  },

  /**
   * Retrieve recent audit logs (admin only)
   */
  async findRecent(limit = 100) {
    const text = `
      SELECT *
      FROM audit_log
      ORDER BY created_at DESC
      LIMIT $1;
    `;
    const res = await db.query(text, [limit]);
    return res.rows;
  },
};

module.exports = auditLogRepository;
