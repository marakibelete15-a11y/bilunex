/**
 * Integration Test: Routes & Middleware
 * Tests 404 handler, route versioning, request validation, and auth protection.
 */

const request = require('supertest');
const app = require('../../src/app');

describe('API Route Middleware & Error Handling', () => {
  test('should return 404 JSON for non-existent route', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('Route not found');
  });

  test('should return 400 when parent registration payload fails validation', async () => {
    const res = await request(app).post('/api/v1/public/parents/register').send({
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
    const res = await request(app).get('/api/v1/mentor/profile');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access denied');
  });
});
