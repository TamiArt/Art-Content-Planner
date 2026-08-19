interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1Statement;
}

interface Env {
  DB: D1Database;
  APP_ENV: string;
  APP_ORIGIN: string;
  AUTH_SECRET: string;
}

type UserRow = { id: number; email: string };
type SessionRow = UserRow & { token_hash: string };
type SyncRow = { payload: string; revision: number; updated_at: string };

const COOKIE_NAME = 'acp_session';
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const MAX_BODY_CHARS = 5_000_000;
const PBKDF2_ITERATIONS = 100_000;
const encoder = new TextEncoder();

const json = (data: unknown, status = 200, headers?: HeadersInit): Response => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
  responseHeaders.set('Cache-Control', 'no-store');
  return new Response(status === 204 ? null : JSON.stringify(data), { status, headers: responseHeaders });
};

const parseCookies = (request: Request): Record<string, string> => {
  const raw = request.headers.get('Cookie') ?? '';
  return Object.fromEntries(
    raw.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
      const index = part.indexOf('=');
      if (index < 0) return [part, ''];
      return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
    }),
  );
};

const normalizeEmail = (value: unknown): string => String(value ?? '').trim().toLowerCase();
const validEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
const validPassword = (value: unknown): value is string => typeof value === 'string' && value.length >= 8 && value.length <= 128;

const bytesToHex = (bytes: Uint8Array): string => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
const hexToBytes = (value: string): Uint8Array => {
  const pairs = value.match(/.{1,2}/g) ?? [];
  return Uint8Array.from(pairs.map((pair) => Number.parseInt(pair, 16)));
};

const randomToken = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const hmacHex = async (secret: string, value: string): Promise<string> => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToHex(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
};

const derivePassword = async (password: string, salt: Uint8Array, secret: string): Promise<string> => {
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(`${password}:${secret}`), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
};

const hashPassword = async (password: string, secret: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, secret);
  return `${bytesToHex(salt)}:${hash}`;
};

const verifyPassword = async (password: string, stored: string, secret: string): Promise<boolean> => {
  const [saltHex, expected] = stored.split(':');
  if (!saltHex || !expected || saltHex.length !== 32) return false;
  const actual = await derivePassword(password, hexToBytes(saltHex), secret);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let index = 0; index < actual.length; index += 1) diff |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  return diff === 0;
};

const readJson = async (request: Request): Promise<Record<string, unknown>> => {
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) throw Object.assign(new Error('Payload too large'), { status: 413 });
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Object expected');
    return parsed as Record<string, unknown>;
  } catch {
    throw Object.assign(new Error('Invalid JSON'), { status: 400 });
  }
};

const cookieHeader = (token: string, env: Env): string => {
  const secure = env.APP_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}${secure}`;
};

const clearCookieHeader = (env: Env): string => {
  const secure = env.APP_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`;
};

const currentUser = async (request: Request, env: Env): Promise<UserRow | null> => {
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return null;
  const tokenHash = await hmacHex(env.AUTH_SECRET, token);
  return env.DB.prepare(`
    SELECT users.id, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).bind(tokenHash, Date.now()).first<UserRow>();
};

const createSession = async (userId: number, env: Env): Promise<string> => {
  const token = randomToken();
  const tokenHash = await hmacHex(env.AUTH_SECRET, token);
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(Date.now()).run();
  await env.DB.prepare('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(tokenHash, userId, Date.now() + SESSION_SECONDS * 1000).run();
  return token;
};

const ensureOrigin = (request: Request, env: Env): Response | null => {
  const origin = request.headers.get('Origin');
  if (!origin || origin === env.APP_ORIGIN || origin === 'http://localhost:5173') return null;
  return json({ error: 'Недопустимый источник запроса' }, 403);
};

async function handleApi(request: Request, env: Env): Promise<Response> {
  const originError = ensureOrigin(request, env);
  if (originError) return originError;

  const url = new URL(request.url);
  const route = `${request.method} ${url.pathname}`;

  if (route === 'GET /api/auth/me') {
    const user = await currentUser(request, env);
    return user ? json({ user }) : json({ error: 'Требуется вход в аккаунт' }, 401);
  }

  if (route === 'POST /api/auth/register') {
    const body = await readJson(request);
    const email = normalizeEmail(body.email);
    const password = body.password;
    if (!validEmail(email)) return json({ error: 'Введите корректный адрес почты' }, 400);
    if (!validPassword(password)) return json({ error: 'Пароль должен содержать от 8 до 128 символов' }, 400);

    const exists = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: number }>();
    if (exists) return json({ error: 'Аккаунт с этой почтой уже существует' }, 409);

    const passwordHash = await hashPassword(password, env.AUTH_SECRET);
    await env.DB.prepare('INSERT INTO users(email, password_hash, created_at) VALUES (?, ?, ?)')
      .bind(email, passwordHash, new Date().toISOString()).run();
    const user = await env.DB.prepare('SELECT id, email FROM users WHERE email = ?').bind(email).first<UserRow>();
    if (!user) throw new Error('User creation failed');
    const token = await createSession(user.id, env);
    return json({ user }, 201, { 'Set-Cookie': cookieHeader(token, env) });
  }

  if (route === 'POST /api/auth/login') {
    const body = await readJson(request);
    const email = normalizeEmail(body.email);
    const password = body.password;
    const found = await env.DB.prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
      .bind(email).first<UserRow & { password_hash: string }>();
    if (!found || !validPassword(password) || !(await verifyPassword(password, found.password_hash, env.AUTH_SECRET))) {
      return json({ error: 'Неверная почта или пароль' }, 401);
    }
    const token = await createSession(found.id, env);
    return json({ user: { id: found.id, email: found.email } }, 200, { 'Set-Cookie': cookieHeader(token, env) });
  }

  if (route === 'POST /api/auth/logout') {
    const token = parseCookies(request)[COOKIE_NAME];
    if (token) {
      const tokenHash = await hmacHex(env.AUTH_SECRET, token);
      await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
    }
    return new Response(null, { status: 204, headers: { 'Set-Cookie': clearCookieHeader(env), 'Cache-Control': 'no-store' } });
  }

  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Требуется вход в аккаунт' }, 401);

  if (route === 'GET /api/sync') {
    const row = await env.DB.prepare('SELECT payload, revision, updated_at FROM user_data WHERE user_id = ?')
      .bind(user.id).first<SyncRow>();
    if (!row) return json({ data: null, revision: 0, updatedAt: null });
    return json({ data: JSON.parse(row.payload), revision: row.revision, updatedAt: row.updated_at });
  }

  if (route === 'PUT /api/sync') {
    const body = await readJson(request);
    const data = body.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ error: 'Некорректные данные' }, 400);
    const current = await env.DB.prepare('SELECT revision FROM user_data WHERE user_id = ?')
      .bind(user.id).first<{ revision: number }>();
    const incomingRevision = Number(body.revision);
    if (current && incomingRevision !== current.revision) {
      return json({ error: 'Данные изменились на другом устройстве', revision: current.revision }, 409);
    }
    if (!current && incomingRevision !== 0) return json({ error: 'Некорректная ревизия', revision: 0 }, 409);

    const revision = (current?.revision ?? 0) + 1;
    const updatedAt = new Date().toISOString();
    const payload = JSON.stringify(data);
    if (payload.length > MAX_BODY_CHARS) return json({ error: 'Данные слишком велики' }, 413);

    await env.DB.prepare(`
      INSERT INTO user_data(user_id, payload, revision, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, revision = excluded.revision, updated_at = excluded.updated_at
    `).bind(user.id, payload, revision, updatedAt).run();
    return json({ revision, updatedAt });
  }

  return json({ error: 'Маршрут не найден' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/') {
      return json({ name: 'Art Content Planner API', status: 'ok', environment: env.APP_ENV });
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      try {
        const row = await env.DB.prepare('SELECT COUNT(*) AS count FROM users').first<{ count: number }>();
        return json({ ok: true, database: true, users: row?.count ?? 0, timestamp: new Date().toISOString() });
      } catch (error) {
        console.error('Health check failed', error);
        return json({ ok: false, database: false }, 500);
      }
    }
    if (!url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);
    try {
      return await handleApi(request, env);
    } catch (error) {
      console.error('API request failed', error);
      const status = typeof error === 'object' && error !== null && 'status' in error ? Number((error as { status?: unknown }).status) : 500;
      if (status === 400) return json({ error: 'Некорректный JSON' }, 400);
      if (status === 413) return json({ error: 'Данные слишком велики' }, 413);
      return json({ error: 'Внутренняя ошибка сервера' }, 500);
    }
  },
};
