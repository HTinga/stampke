// src/clerkConfig.ts
// Clerk replaces ALL custom auth — no more JWT, bcrypt, sessions
// Sign up, sign in, email verify, Google OAuth, password reset — all handled by Clerk

export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

// Role metadata shape stored in Clerk publicMetadata
export interface TomoUserMeta {
  role: 'superadmin' | 'admin' | 'business' | 'worker';
  plan: 'trial' | 'free' | 'pro' | 'enterprise';
  trialStartedAt?: string;
  trialEndsAt?: string;
  adminPermissions?: string[];
}

// Helper: derive trial info from metadata
export function getTrialInfo(meta: Partial<TomoUserMeta>) {
  const now = Date.now();
  const trialEndsAt = meta.trialEndsAt ? new Date(meta.trialEndsAt).getTime() : 0;
  const trialActive = meta.plan === 'trial' && trialEndsAt > now;
  const trialDaysLeft = trialActive
    ? Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)))
    : 0;
  return { trialActive, trialDaysLeft };
}

// Features always free for business users
export const FREE_FEATURES = [
  'documents-esign',
  'documents-stamps',
  'documents-templates',
  'documents-stamp-applier',
];

export const OWNER_EMAIL = 'hempstonetinga@gmail.com';
