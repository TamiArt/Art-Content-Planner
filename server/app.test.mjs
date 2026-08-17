import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createDatabase } from './database.mjs';
import { createHandler } from './app.mjs';

async function withServer(run) {
  const db = createDatabase(':memory:');
  const server = createServer(createHandler(db));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); db.close(); }
}

test('registration, session and cross-device sync flow', () => withServer(async (base) => {
  const register = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'Artist@Example.com', password: 'strong-pass' }) });
  assert.equal(register.status, 201);
  const cookie = register.headers.get('set-cookie').split(';')[0];
  assert.equal((await register.json()).user.email, 'artist@example.com');

  const initial = await fetch(`${base}/api/sync`, { headers: { cookie } });
  assert.deepEqual(await initial.json(), { data: null, revision: 0, updatedAt: null });
  const saved = await fetch(`${base}/api/sync`, { method: 'PUT', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ data: { version: '1', posts: [{ id: 'post-1' }] }, revision: 0 }) });
  assert.equal((await saved.json()).revision, 1);

  const login = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'artist@example.com', password: 'strong-pass' }) });
  const secondCookie = login.headers.get('set-cookie').split(';')[0];
  const remote = await fetch(`${base}/api/sync`, { headers: { cookie: secondCookie } });
  assert.equal((await remote.json()).data.posts[0].id, 'post-1');
}));

test('rejects invalid credentials and stale sync revisions', () => withServer(async (base) => {
  await fetch(`${base}/api/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'a@b.com', password: '12345678' }) });
  const badLogin = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'a@b.com', password: 'wrong-password' }) });
  assert.equal(badLogin.status, 401);
  const login = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'a@b.com', password: '12345678' }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  await fetch(`${base}/api/sync`, { method: 'PUT', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ data: { ok: true }, revision: 0 }) });
  const conflict = await fetch(`${base}/api/sync`, { method: 'PUT', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ data: { stale: true }, revision: 0 }) });
  assert.equal(conflict.status, 409);
}));
