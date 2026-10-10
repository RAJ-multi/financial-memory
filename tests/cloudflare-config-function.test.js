import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/config.js';

test('Cloudflare Pages Function: GET /api/config returns Supabase config from env', async () => {
  const mockEnv = {
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key-123'
  };

  const mockContext = {
    request: new Request('http://localhost/api/config', { method: 'GET' }),
    env: mockEnv
  };

  const response = await onRequest(mockContext);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');

  const json = await response.json();
  assert.equal(json.supabaseUrl, 'https://test-project.supabase.co');
  assert.equal(json.supabaseAnonKey, 'test-anon-key-123');
});

test('Cloudflare Pages Function: GET /api/config returns 503 when SUPABASE_URL is missing or empty', async () => {
  const missingContext = {
    request: new Request('http://localhost/api/config', { method: 'GET' }),
    env: { SUPABASE_ANON_KEY: 'test-anon-key-123' }
  };
  const emptyContext = {
    request: new Request('http://localhost/api/config', { method: 'GET' }),
    env: { SUPABASE_URL: '   ', SUPABASE_ANON_KEY: 'test-anon-key-123' }
  };

  for (const ctx of [missingContext, emptyContext]) {
    const response = await onRequest(ctx);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const json = await response.json();
    assert.deepEqual(json, { error: 'Supabase configuration is missing' });
    assert.equal('supabaseUrl' in json, false);
    assert.equal('supabaseAnonKey' in json, false);
  }
});

test('Cloudflare Pages Function: GET /api/config returns 503 when SUPABASE_ANON_KEY is missing or empty', async () => {
  const missingContext = {
    request: new Request('http://localhost/api/config', { method: 'GET' }),
    env: { SUPABASE_URL: 'https://test-project.supabase.co' }
  };
  const emptyContext = {
    request: new Request('http://localhost/api/config', { method: 'GET' }),
    env: { SUPABASE_URL: 'https://test-project.supabase.co', SUPABASE_ANON_KEY: '' }
  };

  for (const ctx of [missingContext, emptyContext]) {
    const response = await onRequest(ctx);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const json = await response.json();
    assert.deepEqual(json, { error: 'Supabase configuration is missing' });
    assert.equal('supabaseUrl' in json, false);
    assert.equal('supabaseAnonKey' in json, false);
  }
});

test('Cloudflare Pages Function: GET /api/config returns 503 when both variables are missing', async () => {
  const response = await onRequest({
    request: new Request('http://localhost/api/config', { method: 'GET' }),
    env: {}
  });

  assert.equal(response.status, 503);
  const json = await response.json();
  assert.deepEqual(json, { error: 'Supabase configuration is missing' });
});

test('Cloudflare Pages Function: rejects non-GET methods with 405 Method Not Allowed', async () => {
  const mockContext = {
    request: new Request('http://localhost/api/config', { method: 'POST' }),
    env: { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'abc' }
  };

  const response = await onRequest(mockContext);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'GET');
});
