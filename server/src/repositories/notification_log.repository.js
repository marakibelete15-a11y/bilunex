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
    related_entity_type = null,
    related_entity_id = null,
    status = 'success',
    error_message = null,
  }) {
    const text = `
      INSERT INTO notification_log (
        notification_type, recipient, related_entity_type, related_entity_id, status, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const res = await db.query(text, [
      notification_type,
      recipient,
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
};

module.exports = notificationLogRepository;
