/// <reference types="vite/client" />

interface ImportMetaEnv {
  // ── Core API ──────────────────────────────────────────────────────────────
  readonly VITE_API_URL:             string;  // leave empty = relative /api on Vercel

  // ── Google OAuth ──────────────────────────────────────────────────────────
  // console.cloud.google.com → Credentials → OAuth 2.0 → Web Client
  // Authorised origins: https://your-app.vercel.app
  // Authorised redirect URIs: https://your-app.vercel.app
  readonly VITE_GOOGLE_CLIENT_ID:    string;

  // ── Analytics & Monitoring (all optional — features degrade gracefully) ───
  readonly VITE_POSTHOG_KEY:         string;  // posthog.com free account
  readonly VITE_POSTHOG_HOST:        string;  // default: https://app.posthog.com
  readonly VITE_SENTRY_DSN:          string;  // sentry.io free account

  // ── Supabase (optional — currently using MongoDB) ─────────────────────────
  readonly VITE_SUPABASE_URL:        string;
  readonly VITE_SUPABASE_ANON_KEY:   string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*?url'    { const c: string;             export default c; }
declare module '*?raw'    { const c: string;             export default c; }
declare module '*?worker' { const c: new () => Worker;   export default c; }
