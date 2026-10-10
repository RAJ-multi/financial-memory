# financial-memory
A local-first student expense tracker with deterministic spending insights.

## Deployment to Cloudflare Pages

### Configuration Settings
- **Framework preset**: None
- **Build command**: `npm run build` (or leave empty)
- **Build output directory**: `/` (root directory)
- **Root directory**: `/` (root directory)

### Environment Variables
In your Cloudflare Pages project settings (**Settings** > **Environment variables**), add:
- `SUPABASE_URL`: Your Supabase Project URL (e.g. `https://your-project-id.supabase.co`)
- `SUPABASE_ANON_KEY`: Your Supabase public publishable/anon key

The application automatically resolves runtime configuration through `functions/api/config.js` (`GET /api/config`) on Cloudflare Pages without bundling secrets into static client assets.
