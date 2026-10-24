import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const directory = path.resolve(process.argv[2]);
const port = Number(process.argv[3]);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.txt': 'text/plain' };
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const requested = decodeURIComponent(url.pathname);
  const base = path.resolve(directory, `.${requested}`);
  if (base !== directory && !base.startsWith(directory + path.sep)) { res.writeHead(403).end(); return; }
  const candidates = requested.endsWith('/') ? [path.join(base, 'index.html')] : [base, base + '.html', path.join(base, 'index.html')];
  for (const file of candidates) {
    try {
      const stat = await fs.stat(file);
      if (!stat.isFile()) continue;
      const content = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(content); return;
    } catch {}
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Static file not found');
}).listen(port, '127.0.0.1', () => console.log(`Static files only: ${directory} -> http://127.0.0.1:${port}`));
