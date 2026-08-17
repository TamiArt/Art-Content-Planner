import { hashPassword, verifyPassword, normalizeEmail, validEmail, validPassword, createSession, sessionUser, tokenHash } from './auth.mjs';

const COOKIE = 'acp_session';
const attempts = new Map();
const json = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
};
const cookies = (req) => Object.fromEntries((req.headers.cookie ?? '').split(';').filter(Boolean).map((part) => {
  const [key, ...value] = part.trim().split('=');
  return [key, decodeURIComponent(value.join('='))];
}));
const readBody = async (req) => {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 5_000_000) throw Object.assign(new Error('Payload too large'), { status: 413 });
  }
  return raw ? JSON.parse(raw) : {};
};
const rateLimited = (ip) => {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((time) => now - time < 600_000);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > 20;
};

export function createHandler(db, { production = false } = {}) {
  const cookieOptions = `HttpOnly; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}${production ? '; Secure' : ''}`;
  return async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const route = `${req.method} ${url.pathname}`;
      const token = cookies(req)[COOKIE];
      const user = sessionUser(db, token);
      let body;

      if (route === 'POST /api/auth/register' || route === 'POST /api/auth/login') {
        if (rateLimited(req.socket.remoteAddress)) return json(res, 429, { error: 'Слишком много попыток. Попробуйте позже.' });
        body = await readBody(req);
      }
      if (route === 'POST /api/auth/register') {
        const email = normalizeEmail(body.email);
        if (!validEmail(email)) return json(res, 400, { error: 'Введите корректный адрес почты' });
        if (!validPassword(body.password)) return json(res, 400, { error: 'Пароль должен содержать от 8 до 128 символов' });
        try {
          const result = db.prepare('INSERT INTO users(email, password_hash, created_at) VALUES (?, ?, ?)')
            .run(email, hashPassword(body.password), new Date().toISOString());
          const session = createSession(db, Number(result.lastInsertRowid));
          return json(res, 201, { user: { id: Number(result.lastInsertRowid), email } }, { 'set-cookie': `${COOKIE}=${session.token}; ${cookieOptions}` });
        } catch (error) {
          if (String(error).includes('UNIQUE')) return json(res, 409, { error: 'Аккаунт с этой почтой уже существует' });
          throw error;
        }
      }
      if (route === 'POST /api/auth/login') {
        const email = normalizeEmail(body.email);
        const found = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email);
        if (!found || !validPassword(body.password) || !verifyPassword(body.password, found.password_hash)) {
          return json(res, 401, { error: 'Неверная почта или пароль' });
        }
        const session = createSession(db, found.id);
        return json(res, 200, { user: { id: found.id, email: found.email } }, { 'set-cookie': `${COOKIE}=${session.token}; ${cookieOptions}` });
      }
      if (route === 'POST /api/auth/logout') {
        if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(token));
        return json(res, 204, undefined, { 'set-cookie': `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${production ? '; Secure' : ''}` });
      }
      if (url.pathname.startsWith('/api/') && !user) return json(res, 401, { error: 'Требуется вход в аккаунт' });
      if (route === 'GET /api/auth/me') return json(res, 200, { user });
      if (route === 'GET /api/sync') {
        const row = db.prepare('SELECT payload, revision, updated_at FROM user_data WHERE user_id = ?').get(user.id);
        return json(res, 200, row ? { data: JSON.parse(row.payload), revision: row.revision, updatedAt: row.updated_at } : { data: null, revision: 0, updatedAt: null });
      }
      if (route === 'PUT /api/sync') {
        body = await readBody(req);
        if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) return json(res, 400, { error: 'Некорректные данные' });
        const current = db.prepare('SELECT revision FROM user_data WHERE user_id = ?').get(user.id);
        if (current && Number(body.revision) !== current.revision) return json(res, 409, { error: 'Данные изменились на другом устройстве', revision: current.revision });
        const revision = (current?.revision ?? 0) + 1;
        const updatedAt = new Date().toISOString();
        db.prepare(`INSERT INTO user_data(user_id, payload, revision, updated_at) VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload, revision=excluded.revision, updated_at=excluded.updated_at`)
          .run(user.id, JSON.stringify(body.data), revision, updatedAt);
        return json(res, 200, { revision, updatedAt });
      }
      if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'Маршрут не найден' });
      return false;
    } catch (error) {
      console.error(error);
      return json(res, error.status ?? 500, { error: error.status === 413 ? 'Данные слишком велики' : 'Внутренняя ошибка сервера' });
    }
  };
}
