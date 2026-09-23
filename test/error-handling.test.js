const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = 'https://client.example.com';

const app = require('../app');

test('unknown routes return a traceable JSON error', async () => {
  const response = await request(app).get('/missing-route').expect(404);

  assert.equal(response.body.message, 'Route not found');
  assert.equal(response.body.requestId, response.headers['x-request-id']);
});

test('configured browser origins receive CORS permission', async () => {
  const response = await request(app)
    .get('/health')
    .set('Origin', 'https://client.example.com')
    .expect(200);

  assert.equal(response.headers['access-control-allow-origin'], 'https://client.example.com');
});

test('unconfigured browser origins are rejected', async () => {
  const response = await request(app)
    .get('/health')
    .set('Origin', 'https://untrusted.example.com')
    .expect(403);

  assert.equal(response.body.message, 'Origin is not allowed by CORS');
});

test('signup rejects an incomplete request before database access', async () => {
  const response = await request(app).post('/auth/signup').send({}).expect(400);

  assert.equal(response.body.message, 'Name, email, and password are required');
});

test('invalid JSON receives a client-safe error', async () => {
  const response = await request(app)
    .post('/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email":')
    .expect(400);

  assert.equal(response.body.message, 'Request body contains invalid JSON');
});
