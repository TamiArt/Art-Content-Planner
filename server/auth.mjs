import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

const SESSION_DAYS = 30;

export const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();
export const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
export const validPassword = (password) => typeof password === 'string' && password.length >= 8 && password.length <= 128;

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

export const tokenHash = (token) => createHash('sha256').update(token).digest('hex');

export function createSession(db, userId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  db.prepare('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(tokenHash(token), userId, expiresAt);
  return { token, expiresAt };
}

export function sessionUser(db, token) {
  if (!token) return null;
  return db.prepare(`
    SELECT users.id, users.email FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(tokenHash(token), Date.now()) ?? null;
}
