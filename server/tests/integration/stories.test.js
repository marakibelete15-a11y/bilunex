const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const db = require('../../src/config/db');
const env = require('../../src/config/env');

describe('Share Your Story moderation workflow', () => {
  let adminToken;
  let adminId;
  let mentorToken;
  beforeAll(async () => {
    const result = await db.query(
      "SELECT id FROM admin_users WHERE email='admin@bilunex.org' LIMIT 1"
    );
    adminId = result.rows[0].id;
    adminToken = jwt.sign(
      { id: adminId, email: 'admin@bilunex.org', role: 'super_admin' },
      env.JWT_SECRET
    );
    mentorToken = jwt.sign(
      { id: 999, email: 'mentor@example.com', role: 'mentor' },
      env.JWT_SECRET
    );
  });
  afterAll(async () => {
    await db.closePool();
  });

  test('pending story stays private until admin approves; public output excludes contact details and strips HTML', async () => {
    const body = 'A genuine story about learning support and steady progress for my child. '.repeat(
      2
    );
    const submitted = await request(app)
      .post('/api/v1/public/stories')
      .send({
        full_name: 'Private Parent Name',
        display_style: 'initials',
        relationship: 'parent_guardian',
        email: 'private.story@example.com',
        phone: '+251911223344',
        title: '<b>Learning progress</b>',
        body: `<script>bad()</script>${body}`,
        consent_genuine: true,
        consent_publish: true,
        consent_child_guardian: true,
      });
    expect(submitted.status).toBe(201);
    const id = submitted.body.data.id;
    let notification;
    for (let attempt = 0; attempt < 40 && !notification; attempt += 1) {
      const result = await db.query(
        "SELECT * FROM notification_log WHERE related_entity_type='stories' AND related_entity_id=$1 AND notification_type='story_submitted_admin_alert'",
        [id]
      );
      notification = result.rows[0];
      if (!notification) await new Promise(resolve => setTimeout(resolve, 50));
    }
    expect(notification).toBeDefined();
    const pending = await db.query('SELECT status FROM stories WHERE id=$1', [id]);
    expect(pending.rows[0].status).toBe('pending');
    let publicResult = await request(app).get('/api/v1/public/stories');
    expect(publicResult.body.data.stories.some(story => story.id === id)).toBe(false);

    const denied = await request(app)
      .patch(`/api/v1/admin/stories/${id}/status`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ status: 'approved' });
    expect(denied.status).toBe(403);
    const approved = await request(app)
      .patch(`/api/v1/admin/stories/${id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(approved.status).toBe(200);
    publicResult = await request(app).get('/api/v1/public/stories');
    const story = publicResult.body.data.stories.find(item => item.id === id);
    expect(story).toBeDefined();
    expect(story.display_name).toBe('P.P.N.');
    expect(story.title).toBe('Learning progress');
    expect(story.body).not.toContain('<script>');
    expect(story).not.toHaveProperty('full_name');
    expect(story).not.toHaveProperty('email');
    expect(story).not.toHaveProperty('phone');

    const adminDetail = await request(app)
      .get(`/api/v1/admin/stories/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDetail.status).toBe(200);
    expect(adminDetail.body.data.email).toBe('private.story@example.com');
    const audit = await db.query(
      "SELECT 1 FROM audit_log WHERE target_table='stories' AND target_id=$1 AND action='update'",
      [id]
    );
    expect(audit.rowCount).toBeGreaterThan(0);
  });
});
