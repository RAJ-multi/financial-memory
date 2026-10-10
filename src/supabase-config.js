// Public frontend Supabase configuration
// NOTE: Use ONLY the Supabase Project URL and Public Anon / Publishable Key.
// NEVER embed the service_role key, database password, or secret tokens here.

export const SUPABASE_CONFIG = {
  // Configured with placeholders, window.__ENV__, or runtime fetched /api/config
  url: (typeof window !== 'undefined' && window.__ENV__?.SUPABASE_URL) || '',
  anonKey: (typeof window !== 'undefined' && window.__ENV__?.SUPABASE_ANON_KEY) || '',
  
  /**
   * Attempts to fetch runtime configuration from /api/config if not already populated.
   */
  async loadRuntimeConfig() {
    if (this.url && this.anonKey) return;
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data.supabaseUrl) this.url = data.supabaseUrl;
          if (data.supabaseAnonKey) this.anonKey = data.supabaseAnonKey;
        }
      }
    } catch {
      // Gracefully continue with guest mode if backend config endpoint is unreachable
    }
  },

  // Default redirect URL for OAuth: defaults to window.location.origin
  // In Netlify or custom deployment, ensure this URL is added in Supabase Auth -> URL Configuration -> Redirect URLs
  getRedirectUrl() {
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}${window.location.pathname}`;
    }
    return '';
  }
};
