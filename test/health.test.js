const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = 'https://client.example.com';

const app = require('../app');

test('GET /api exposes service metadata', async () => {
  const response = await request(app).get('/api').expect(200);

  assert.equal(response.body.name, 'Expense Tracker API');
  assert.equal(response.body.version, '1.0.0');
  assert.equal(response.body.status, 'available');
});

test('GET /health reports a live API process', async () => {
  const response = await request(app).get('/health').expect(200);

  assert.equal(response.body.status, 'ok');
  assert.match(response.headers['x-request-id'], /^[a-f0-9-]{36}$/);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-powered-by'], undefined);
});

test('GET /ready reports a disconnected database during isolated tests', async () => {
  const response = await request(app).get('/ready').expect(503);

  assert.equal(response.body.status, 'not_ready');
  assert.equal(response.body.database, 'disconnected');
});
