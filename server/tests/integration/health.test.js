/**
 * Integration Test: Health Check Endpoint
 * Verifies GET /api/v1/health returns 200 OK and health metadata.
 */

const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/v1/health', () => {
  test('should return 200 OK with healthy status and metadata', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('environment', 'test');
  });
});
