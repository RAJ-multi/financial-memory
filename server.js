import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve('.');
const distDir = resolve('dist');
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

let vite = null;
if (!isProduction) {
  try {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
  } catch (err) {
    console.warn('Vite middleware not initialized, using static fallback:', err.message);
  }
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);

    // Public frontend config endpoint for runtime Supabase configuration
    if (pathname === '/api/config') {
      if (req.method !== 'GET') {
        res.writeHead(405, {
          'Content-Type': 'application/json; charset=utf-8',
          'Allow': 'GET'
        });
        return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      }

      const supabaseUrl = process.env.SUPABASE_URL ? String(process.env.SUPABASE_URL).trim() : '';
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ? String(process.env.SUPABASE_ANON_KEY).trim() : '';

      if (!supabaseUrl || !supabaseAnonKey) {
        res.writeHead(503, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        });
        return res.end(JSON.stringify({ error: 'Supabase configuration is missing' }));
      }

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      return res.end(JSON.stringify({
        supabaseUrl,
        supabaseAnonKey
      }));
    }

    // In development mode with Vite, Vite middleware handles transforms and module imports
    if (vite) {
      vite.middlewares(req, res, () => {
        serveStatic(req, res, pathname);
      });
      return;
    }

    serveStatic(req, res, pathname);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error');
  }
});

async function serveStatic(req, res, pathname) {
  try {
    const staticBase = (isProduction && existsSync(resolve(distDir, 'index.html')))
      ? distDir
      : (existsSync(resolve(distDir, 'index.html')) ? distDir : root);

    const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
    const filePath = resolve(staticBase, relativePath);

    if (filePath !== staticBase && !filePath.startsWith(staticBase + sep)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    let fileToRead = filePath;
    try {
      const info = await stat(fileToRead);
      if (!info.isFile()) throw new Error('Not a file');
    } catch {
      const indexPath = resolve(staticBase, 'index.html');
      if (existsSync(indexPath)) {
        fileToRead = indexPath;
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Not found');
      }
    }

    res.writeHead(200, {
      'Content-Type': mimeTypes[extname(fileToRead)] || 'application/octet-stream'
    });
    createReadStream(fileToRead).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

server.listen(port, '0.0.0.0', () => {
  console.log(`Financial Memory running at http://0.0.0.0:${port}`);
});

export { server };
