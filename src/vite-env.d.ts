/// <reference types="vite/client" />

interface ImportMetaEnv {
  // ── Core API ──────────────────────────────────────────────────────────────
  readonly VITE_API_URL:            string;   // backend URL (empty = relative /api)

  // ── Clerk Auth ────────────────────────────────────────────────────────────
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;

  // ── Supabase ──────────────────────────────────────────────────────────────
  readonly VITE_SUPABASE_URL:       string;
  readonly VITE_SUPABASE_ANON_KEY:  string;

  // ── Stripe ────────────────────────────────────────────────────────────────
  readonly VITE_STRIPE_PUBLISHABLE_KEY:     string;
  readonly VITE_STRIPE_PRO_PRICE_ID:        string;
  readonly VITE_STRIPE_ENTERPRISE_PRICE_ID: string;

  // ── Analytics & Monitoring ────────────────────────────────────────────────
  readonly VITE_POSTHOG_KEY:    string;
  readonly VITE_POSTHOG_HOST:   string;
  readonly VITE_SENTRY_DSN:     string;

  // ── Legacy (Google OAuth fallback) ────────────────────────────────────────
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*?url'    { const content: string;             export default content; }
declare module '*?raw'    { const content: string;             export default content; }
declare module '*?worker' { const content: new () => Worker;   export default content; }
