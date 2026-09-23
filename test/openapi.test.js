const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

test('OpenAPI document is valid YAML with the expected public contract', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'docs', 'openapi.yaml'), 'utf8');
  const document = YAML.parse(source);

  assert.equal(document.openapi, '3.1.0');
  assert.equal(document.info.title, 'Expense Tracker API');
  assert.ok(document.paths['/auth/login']);
  assert.ok(document.paths['/expenses/{id}']);
  assert.equal(document.components.securitySchemes.bearerAuth.scheme, 'bearer');
});
