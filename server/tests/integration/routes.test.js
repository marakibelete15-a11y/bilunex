/**
 * Integration Test: Routes & Middleware
 * Tests 404 handler, route versioning, request validation, and auth protection.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');

describe('API Route Middleware & Error Handling', () => {
  test('should return 404 JSON for non-existent route', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('Route not found');
  });

  test('should return 400 when parent registration payload fails validation', async () => {
    const res = await request(app).post('/api/v1/parents/register').send({
      parent_name: 'J', // Invalid: too short
      email: 'invalid-email-address',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('errors');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  test('should return 401 when accessing protected admin endpoint without token', async () => {
    const res = await request(app).get('/api/v1/admin/overview');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access denied');
  });

  test('should return 401 when accessing protected mentor endpoint without token', async () => {
    const res = await request(app).get('/api/v1/mentor/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access denied');
  });

  test('rejects admin and mentor login credentials in query strings', async () => {
    const adminResponse = await request(app).post(
      '/api/v1/admin/auth/login?email=admin%40example.com&password=not-a-real-password'
    );
    const mentorResponse = await request(app).get(
      '/api/v1/mentor/auth/login?email=mentor%40example.com&password=not-a-real-password'
    );

    expect(adminResponse.status).toBe(400);
    expect(mentorResponse.status).toBe(400);
    expect(adminResponse.body.message).toContain('request body');
    expect(mentorResponse.body.message).toContain('request body');
    expect(JSON.stringify(adminResponse.body)).not.toContain('not-a-real-password');
    expect(JSON.stringify(mentorResponse.body)).not.toContain('not-a-real-password');
  });

  test('should return 401 for an expired API token and 403 for a valid wrong-role token', async () => {
    const expiredToken = jwt.sign(
      { id: 1, email: 'admin@example.com', role: 'admin' },
      env.JWT_SECRET,
      { expiresIn: '-1h' }
    );
    const expiredResponse = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(expiredResponse.status).toBe(401);

    const mentorToken = jwt.sign(
      { id: 1, email: 'mentor@example.com', role: 'mentor' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const wrongRoleResponse = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Authorization', `Bearer ${mentorToken}`);
    expect(wrongRoleResponse.status).toBe(403);
  });

  test('protects portal pages with role-specific session cookies', async () => {
    const unauthenticated = await request(app).get('/admin/index.html');
    expect(unauthenticated.status).toBe(302);
    expect(unauthenticated.headers.location).toBe('/admin/login.html');
    const directoryIndex = await request(app).get('/admin/');
    expect(directoryIndex.status).toBe(302);
    expect(directoryIndex.headers.location).toBe('/admin/login.html');

    const mentorCookie = jwt.sign(
      { id: 1, email: 'mentor@example.com', role: 'mentor' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const wrongRole = await request(app)
      .get('/admin/index.html')
      .set('Cookie', `bilunex_portal_token=${mentorCookie}`);
    expect(wrongRole.status).toBe(302);
    expect(wrongRole.headers.location).toBe('/admin/login.html');

    const expiredCookie = jwt.sign(
      { id: 1, email: 'admin@example.com', role: 'admin' },
      env.JWT_SECRET,
      { expiresIn: '-1h' }
    );
    const expired = await request(app)
      .get('/admin/index.html')
      .set('Cookie', `bilunex_portal_token=${expiredCookie}`);
    expect(expired.status).toBe(302);
    expect(expired.headers.location).toBe('/admin/login.html');

    const adminCookie = jwt.sign(
      { id: 1, email: 'admin@example.com', role: 'admin' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const authorized = await request(app)
      .get('/admin/index.html')
      .set('Cookie', `bilunex_portal_token=${adminCookie}`);
    expect(authorized.status).toBe(200);
  });
});
