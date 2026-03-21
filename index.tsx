import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Polyfill global for libraries that expect it
if (typeof window !== 'undefined' && typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

// ── PostHog analytics (issue: analytics) ─────────────────────────────────────
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
if (POSTHOG_KEY) {
  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(POSTHOG_KEY, {
      api_host:          import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview:  true,
      autocapture:       true,
      persistence:       'localStorage',
    });
    (window as any).__posthog = posthog;
  }).catch(() => {});
}

// ── Sentry error tracking (issues #7, #18) ────────────────────────────────────
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  import('@sentry/react').then(Sentry => {
    Sentry.init({
      dsn:         SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
    });
  }).catch(() => {});
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element to mount to');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/* Issue #7: top-level error boundary — no more white screen of death */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
