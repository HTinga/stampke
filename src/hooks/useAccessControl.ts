/**
 * useAccessControl — StampKE feature gating
 *
 * Rules (as instructed):
 * - NO trial, NO free tier for any feature
 * - Only superadmin gets free access to everything
 * - All business users must have a paid plan (starter/professional/enterprise)
 * - Plans: KES 650 starter | KES 2,500 professional | KES 5,000 enterprise
 */

import { useCallback } from 'react';

export type FeatureKey =
  | 'stamp_design' | 'stamp_apply' | 'esign'
  | 'pdf_editor' | 'ai_summarizer' | 'ai_digitizer'
  | 'invoicing' | 'documents' | 'templates'
  | 'virtual_assistants' | 'recruit' | 'clients';

export type PlanTier = 'none' | 'starter' | 'professional' | 'enterprise';

export interface UserAccess {
  role?: string;
  plan?: PlanTier | string;
}

export interface AccessResult {
  canUse: boolean;
  reason: 'granted' | 'no_plan' | 'upgrade_required';
  requiredPlan?: PlanTier;
}

// Feature → minimum plan required
const FEATURE_PLAN_MAP: Record<FeatureKey, PlanTier> = {
  // Starter (KES 650)
  esign:              'starter',
  stamp_design:       'starter',
  stamp_apply:        'starter',
  invoicing:          'starter',
  recruit:            'starter',
  clients:            'starter',
  // Professional (KES 2,500)
  pdf_editor:         'professional',
  ai_summarizer:      'professional',
  ai_digitizer:       'professional',
  documents:          'professional',
  templates:          'professional',
  // Enterprise (KES 5,000)
  virtual_assistants: 'enterprise',
};

const PLAN_RANK: Record<PlanTier, number> = {
  none: 0, starter: 1, professional: 2, enterprise: 3,
};

function meetsRequirement(userPlan: string | undefined, required: PlanTier): boolean {
  const userRank = PLAN_RANK[(userPlan as PlanTier) || 'none'] ?? 0;
  const reqRank  = PLAN_RANK[required] ?? 1;
  return userRank >= reqRank;
}

export function checkFeatureAccess(feature: FeatureKey, userAccess: UserAccess): AccessResult {
  // Superadmin — always granted, no payment needed
  if (userAccess.role === 'superadmin') {
    return { canUse: true, reason: 'granted' };
  }

  const required = FEATURE_PLAN_MAP[feature] || 'starter';
  const hasPlan  = meetsRequirement(userAccess.plan, required);

  if (hasPlan) return { canUse: true, reason: 'granted' };

  const hasAnyPlan = userAccess.plan && userAccess.plan !== 'none';
  return {
    canUse: false,
    reason: hasAnyPlan ? 'upgrade_required' : 'no_plan',
    requiredPlan: required,
  };
}

export function useAccessControl(userAccess: UserAccess) {
  const check = useCallback(
    (feature: FeatureKey): AccessResult => checkFeatureAccess(feature, userAccess),
    [userAccess.role, userAccess.plan]
  );
  return { check };
}
