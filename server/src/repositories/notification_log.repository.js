/**
 * Bilunex - Notification Log Repository
 * ALL SQL queries regarding notification_log live here.
 */

const db = require('../config/db');

const notificationLogRepository = {
  /**
   * Log an email/notification dispatch attempt
   */
  async create({
    notification_type,
    recipient,
    recipient_role = 'unknown',
    related_entity_type = null,
    related_entity_id = null,
    status = 'success',
    error_message = null,
  }) {
    const text = `
      INSERT INTO notification_log (
        notification_type, recipient, recipient_role, related_entity_type, related_entity_id, status, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const res = await db.query(text, [
      notification_type,
      recipient,
      recipient_role,
      related_entity_type,
      related_entity_id ? BigInt(related_entity_id) : null,
      status,
      error_message,
    ]);
    return res.rows[0];
  },

  /**
   * Retrieve recent notification logs
   */
  async findAll(limit = 100) {
    const text = `
      SELECT *
      FROM notification_log
      ORDER BY created_at DESC
      LIMIT $1;
    `;
    const res = await db.query(text, [limit]);
    return res.rows;
  },

  /**
   * Count notification failures from the last 7 days
   */
  async countFailuresLast7Days() {
    const text = `
      SELECT COUNT(*)::int AS count
      FROM notification_log
      WHERE status = 'failure'
        AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days';
    `;
    const res = await db.query(text);
    return res.rows[0]?.count || 0;
  },
};

module.exports = notificationLogRepository;
