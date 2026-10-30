const db = require('../config/db');

const storyRepository = {
  async create(data) {
    const result = await db.query(
      `INSERT INTO stories (full_name, display_style, relationship, email, phone, title, body,
       consent_genuine, consent_publish, consent_child_guardian, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,TRUE,TRUE,'pending') RETURNING *`,
      [
        data.full_name,
        data.display_style,
        data.relationship,
        data.email || null,
        data.phone || null,
        data.title,
        data.body,
      ]
    );
    return result.rows[0];
  },
  async findPublic({ limit, offset }) {
    const result = await db.query(
      `SELECT id,
       CASE display_style WHEN 'anonymous' THEN 'Anonymous'
         WHEN 'initials' THEN (SELECT string_agg(left(part, 1), '.') || '.' FROM unnest(string_to_array(trim(full_name), ' ')) AS names(part))
         ELSE split_part(trim(full_name), ' ', 1) END AS display_name,
       CASE relationship WHEN 'parent_guardian' THEN 'Parent or guardian'
         WHEN 'student' THEN 'Student' WHEN 'mentor' THEN 'Mentor' ELSE 'Other' END AS relationship,
       title, body, published_at AS date
       FROM stories WHERE status='approved' AND deleted_at IS NULL
       ORDER BY published_at DESC, id DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },
  async countPublic() {
    const result = await db.query(
      "SELECT COUNT(*)::int AS count FROM stories WHERE status='approved' AND deleted_at IS NULL"
    );
    return result.rows[0].count;
  },
  async findAll({ status, limit, offset }) {
    const result = await db.query(
      `SELECT * FROM stories WHERE deleted_at IS NULL AND ($1::varchar IS NULL OR status=$1)
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [status || null, limit, offset]
    );
    return result.rows;
  },
  async countAll(status) {
    const result = await db.query(
      'SELECT COUNT(*)::int AS count FROM stories WHERE deleted_at IS NULL AND ($1::varchar IS NULL OR status=$1)',
      [status || null]
    );
    return result.rows[0].count;
  },
  async findById(id) {
    const result = await db.query('SELECT * FROM stories WHERE id=$1 AND deleted_at IS NULL', [id]);
    return result.rows[0] || null;
  },
  async updateStatus(id, status, adminId) {
    const result = await db.query(
      `UPDATE stories SET status=$1, reviewed_by=$3, reviewed_at=CURRENT_TIMESTAMP,
       published_at=CASE WHEN $1::varchar='approved' THEN CURRENT_TIMESTAMP ELSE NULL END,
       updated_at=CURRENT_TIMESTAMP WHERE id=$2 AND deleted_at IS NULL RETURNING *`,
      [status, id, adminId]
    );
    return result.rows[0] || null;
  },
  async countPending() {
    const result = await db.query(
      "SELECT COUNT(*)::int AS count FROM stories WHERE status='pending' AND deleted_at IS NULL"
    );
    return result.rows[0].count;
  },
};
module.exports = storyRepository;
