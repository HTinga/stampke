/**
 * useAccessControl — Central feature-gate for StampKE
 *
 * Rules:
 * - Only 1 free trial, valid for Stamp Designer AND Stamp Applier only
 * - All other features are locked behind a paid plan OR super-admin approval
 * - Super admin can approve access for 1–12 months
 * - If not approved/paid → hard paywall, no use at all
 * - Stamp Designer: after trial, user can pay KES 650 for one-time download/apply
 *   OR subscribe
 */

import { useCallback } from 'react';

export type FeatureKey =
  | 'stamp_design'
  | 'stamp_apply'
  | 'esign'
  | 'pdf_editor'
  | 'ai_summarizer'
  | 'ai_digitizer'
  | 'qr_tracker'
  | 'invoicing'
  | 'documents'
  | 'templates'
  | 'virtual_assistants'
  | 'social_hub';

// Features that get exactly 1 free trial (and nothing else)
export const TRIAL_FEATURES: FeatureKey[] = ['stamp_design', 'stamp_apply'];

// Features that are fully locked (no trial at all)
export const LOCKED_FEATURES: FeatureKey[] = [
  'esign',
  'pdf_editor',
  'ai_summarizer',
  'ai_digitizer',
  'qr_tracker',
  'invoicing',
  'documents',
  'templates',
  'virtual_assistants',
  'social_hub',
];

export type AccessStatus =
  | 'granted'          // paid or admin-approved
  | 'trial_available'  // 1 free trial not yet used
  | 'trial_used'       // trial exhausted, must pay
  | 'locked'           // no trial at all, must pay
  | 'expired';         // admin approval expired

export interface AccessResult {
  status: AccessStatus;
  canUse: boolean;
  trialRemaining: number;
  approvalExpiresAt?: string;
  daysLeft?: number;
}

export interface UserAccess {
  plan?: string;               // 'trial' | 'starter' | 'pro' | 'business' | null
  adminApproved?: boolean;
  approvalExpiresAt?: string;  // ISO date string
  trialUsed?: boolean;         // whether the single free trial was used
}

function getStoredTrialUsed(): boolean {
  try {
    return localStorage.getItem('stampke_trial_used') === 'true';
  } catch {
    return false;
  }
}

export function markTrialUsed(): void {
  try {
    localStorage.setItem('stampke_trial_used', 'true');
  } catch {}
}

function isPaidPlan(plan?: string): boolean {
  return plan === 'starter' || plan === 'pro' || plan === 'business';
}

function isApprovalActive(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
}

function daysUntilExpiry(expiresAt?: string): number {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function checkFeatureAccess(feature: FeatureKey, userAccess: UserAccess): AccessResult {
  const paid = isPaidPlan(userAccess.plan);
  const adminActive = userAccess.adminApproved && isApprovalActive(userAccess.approvalExpiresAt);

  // Fully paid or admin-approved → always granted
  if (paid || adminActive) {
    return {
      status: 'granted',
      canUse: true,
      trialRemaining: 0,
      approvalExpiresAt: userAccess.approvalExpiresAt,
      daysLeft: daysUntilExpiry(userAccess.approvalExpiresAt),
    };
  }

  // Check if admin approval was given but has expired
  if (userAccess.adminApproved && !adminActive) {
    return { status: 'expired', canUse: false, trialRemaining: 0, approvalExpiresAt: userAccess.approvalExpiresAt };
  }

  // Trial-eligible features
  if (TRIAL_FEATURES.includes(feature)) {
    const trialUsed = getStoredTrialUsed();
    if (!trialUsed) {
      return { status: 'trial_available', canUse: true, trialRemaining: 1 };
    }
    return { status: 'trial_used', canUse: false, trialRemaining: 0 };
  }

  // Everything else: fully locked
  return { status: 'locked', canUse: false, trialRemaining: 0 };
}

export function useAccessControl(userAccess: UserAccess) {
  const check = useCallback(
    (feature: FeatureKey): AccessResult => checkFeatureAccess(feature, userAccess),
    [userAccess.plan, userAccess.adminApproved, userAccess.approvalExpiresAt]
  );

  return { check, markTrialUsed };
}
