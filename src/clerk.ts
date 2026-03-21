// ── Clerk Authentication ──────────────────────────────────────────────────────
// Clerk handles: signup, login, email verify, Google OAuth, session management
// Free tier: unlimited users, email verify built-in, social logins included
// Docs: https://clerk.com/docs

export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

if (!CLERK_PUBLISHABLE_KEY && import.meta.env.MODE === 'production') {
  console.warn('[Clerk] VITE_CLERK_PUBLISHABLE_KEY not set — auth will not work');
}

// Role metadata stored in Clerk's publicMetadata
// Set via Clerk Dashboard or our backend webhook
export type UserRole = 'superadmin' | 'admin' | 'business' | 'worker';

export interface TomoUserMeta {
  role:             UserRole;
  plan:             'trial' | 'free' | 'pro' | 'enterprise';
  trialEndsAt?:     string;   // ISO date
  adminPermissions?: string[];
}

// Extract Tomo metadata from a Clerk user object
export function getTomoMeta(user: any): TomoUserMeta {
  const meta = user?.publicMetadata || {};
  return {
    role:             (meta.role             as UserRole) || 'business',
    plan:             (meta.plan             as any)      || 'trial',
    trialEndsAt:      meta.trialEndsAt       as string | undefined,
    adminPermissions: meta.adminPermissions  as string[] | undefined,
  };
}

export function isTrialActive(meta: TomoUserMeta): boolean {
  if (meta.plan !== 'trial' || !meta.trialEndsAt) return false;
  return new Date() < new Date(meta.trialEndsAt);
}

export function trialDaysLeft(meta: TomoUserMeta): number {
  if (!isTrialActive(meta)) return 0;
  return Math.max(0, Math.ceil((new Date(meta.trialEndsAt!).getTime() - Date.now()) / 86400000));
}
