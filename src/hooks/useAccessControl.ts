/**
 * useAccessControl — StampKE feature gating
 * 
 * Rules:
 * - Trial users get 5 free uses per feature (persisted in localStorage for anonymity/speed)
 * - VA (Virtual Assistants) is UNLIMITED.
 * - Superadmin gets free access to everything
 * - Pricing: KES 1,500 Starter | KES 3,000 Professional | KES 10,000 Enterprise
 */

import { useCallback } from 'react';

export type FeatureKey =
  | 'stamp_design' | 'stamp_apply' | 'esign'
  | 'pdf_editor' | 'ai_summarizer' | 'ai_digitizer'
  | 'invoicing' | 'documents' | 'templates'
  | 'virtual_assistants' | 'recruit' | 'clients';

export type PlanTier = 'none' | 'trial' | 'starter' | 'professional' | 'enterprise';

export interface UserAccess {
  role?: string;
  plan?: PlanTier | string;
  email?: string;
}

export type AccessStatus = 'granted' | 'trial_available' | 'trial_used' | 'locked' | 'expired';

export interface AccessResult {
  canUse: boolean;
  reason: 'granted' | 'trial' | 'no_plan' | 'upgrade_required';
  requiredPlan?: PlanTier;
  status: AccessStatus;
  usageLeft?: number;
}

// Feature → minimum plan required
const FEATURE_PLAN_MAP: Record<FeatureKey, PlanTier> = {
  esign:              'starter',
  stamp_design:       'starter',
  stamp_apply:        'starter',
  invoicing:          'starter',
  recruit:            'starter',
  clients:            'starter',
  pdf_editor:         'professional',
  ai_summarizer:      'professional',
  ai_digitizer:       'professional',
  documents:          'professional',
  templates:          'professional',
  virtual_assistants: 'enterprise',
};

const PLAN_RANK: Record<PlanTier, number> = {
  none: 0, trial: 0, starter: 1, professional: 2, enterprise: 3,
};

const TRIAL_LIMITS: Record<string, number> = {
  esign: 5, stamp_design: 5, stamp_apply: 5, invoicing: 5,
  pdf_editor: 5, ai_summarizer: 5, ai_digitizer: 5,
  virtual_assistants: 999, // Unlimited
};

function getLocalUsage(email?: string): Record<string, number> {
  const key = email ? `usage_${email}` : 'usage_guest';
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}

export function markTrialUsed(feature: string, email?: string): void {
  const usage = getLocalUsage(email);
  usage[feature] = (usage[feature] || 0) + 1;
  const key = email ? `usage_${email}` : 'usage_guest';
  localStorage.setItem(key, JSON.stringify(usage));
}

export function checkFeatureAccess(feature: FeatureKey, userAccess: UserAccess): AccessResult {
  if (userAccess.role === 'superadmin') return { canUse: true, reason: 'granted', status: 'granted' };

  // VA is always unlimited anyway, but let's check plan for others
  const required = FEATURE_PLAN_MAP[feature] || 'starter';
  const userRank = PLAN_RANK[(userAccess.plan as PlanTier) || 'none'] ?? 0;
  const reqRank  = PLAN_RANK[required] ?? 1;

  if (userRank >= reqRank) return { canUse: true, reason: 'granted', status: 'granted' };

  // If not on a paid plan, check trial
  if (feature === 'virtual_assistants') return { canUse: true, reason: 'trial', status: 'granted' };

  const usage = getLocalUsage(userAccess.email);
  const used = usage[feature] || 0;
  const limit = TRIAL_LIMITS[feature] || 5;

  if (used < limit) {
    return { 
      canUse: true, 
      reason: 'trial', 
      status: 'trial_available',
      usageLeft: limit - used 
    };
  }

  return {
    canUse: false,
    reason: userAccess.plan && userAccess.plan !== 'none' ? 'upgrade_required' : 'no_plan',
    requiredPlan: required,
    status: 'locked',
  };
}

export function useAccessControl(userAccess: UserAccess) {
  const check = useCallback(
    (feature: FeatureKey): AccessResult => checkFeatureAccess(feature, userAccess),
    [userAccess.role, userAccess.plan, userAccess.email]
  );
  return { check };
}
