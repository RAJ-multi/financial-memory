import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    configureServer(server) {
      server.middlewares.use('/api/config', (req, res) => {
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
        res.end(JSON.stringify({
          supabaseUrl,
          supabaseAnonKey
        }));
      });
    }
  }
});
