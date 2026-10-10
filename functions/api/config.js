// Cloudflare Pages Function: GET /api/config
// Securely exposes Supabase public frontend configuration from Cloudflare environment variables

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Allow': 'GET'
      }
    });
  }

  const supabaseUrl = env?.SUPABASE_URL ? String(env.SUPABASE_URL).trim() : '';
  const supabaseAnonKey = env?.SUPABASE_ANON_KEY ? String(env.SUPABASE_ANON_KEY).trim() : '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Supabase configuration is missing' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }

  const payload = {
    supabaseUrl,
    supabaseAnonKey
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
