import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { createDatabase } from './database.mjs';
import { createHandler } from './app.mjs';

const port = Number(process.env.PORT || 3000);
const production = process.env.NODE_ENV === 'production';
const db = createDatabase(process.env.DATABASE_PATH || resolve('data/art-content-planner.sqlite'));
const api = createHandler(db, { production });
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

createServer(async (req, res) => {
  const handled = await api(req, res);
  if (handled !== false) return;
  if (!production) {
    res.writeHead(404);
    return res.end('Run the Vite development server on port 5173');
  }
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const candidate = resolve('dist', `.${pathname}`);
    const file = pathname !== '/' && candidate.startsWith(resolve('dist')) ? candidate : resolve('dist/index.html');
    const content = await readFile(file).catch(() => readFile(resolve('dist/index.html')));
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'text/html; charset=utf-8' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, () => console.log(`Art Content Planner: http://localhost:${port}`));
