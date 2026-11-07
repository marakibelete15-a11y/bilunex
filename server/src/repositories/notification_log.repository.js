/**
 * Bilunex - Notification Log Repository
 * Parameterized queries for the notification_log table (FR-9.5).
 */

const db = require('../config/db');

const normalizeNotificationType = type => {
  if (
    ['parent_confirmation', 'mentor_confirmation', 'admin_new_parent', 'admin_new_mentor'].includes(
      type
    )
  ) {
    return type;
  }
  if (type === 'parent_registration_ack') return 'parent_confirmation';
  if (type === 'parent_registration_admin_alert') return 'admin_new_parent';
  if (type === 'mentor_application_ack') return 'mentor_confirmation';
  if (type === 'mentor_application_admin_alert') return 'admin_new_mentor';
  // fallback for other admin alerts
  return 'admin_new_parent';
};

const normalizeNotificationStatus = status => {
  if (status === 'sent' || status === 'success') return 'sent';
  return 'failed';
};

const notificationLogRepository = {
  async log({
    notification_type,
    recipient_email,
    recipient,
    related_table = null,
    related_entity_type = null,
    related_id = null,
    related_entity_id = null,
    status,
    error_message = null,
  }) {
    const normType = normalizeNotificationType(notification_type);
    const normStatus = normalizeNotificationStatus(status);
    const email = recipient_email || recipient;
    const table = related_table || related_entity_type || null;
    const refId = related_id || related_entity_id || null;

    const text = `
      INSERT INTO notification_log (
        notification_type, recipient_email, related_table, related_id, status, error_message
      )
      VALUES ($1::notification_type, $2, $3, $4, $5::notification_status, $6)
      RETURNING *;
    `;
    const res = await db.query(text, [
      normType,
      email,
      table,
      refId,
      normStatus,
      error_message || null,
    ]);
    return res.rows[0];
  },

  async create(data) {
    return this.log(data);
  },

  async findRecent(limit = 50) {
    const text = `
      SELECT *
      FROM notification_log
      ORDER BY created_at DESC
      LIMIT $1;
    `;
    const res = await db.query(text, [limit]);
    return res.rows;
  },

  async countFailuresLast7Days() {
    const text = `
      SELECT COUNT(*)::int AS count
      FROM notification_log
      WHERE status = 'failed' AND created_at >= now() - interval '7 days';
    `;
    const res = await db.query(text);
    return res.rows[0]?.count || 0;
  },
};

module.exports = notificationLogRepository;
