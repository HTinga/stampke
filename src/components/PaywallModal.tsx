/**
 * PaywallModal — shown when a user tries to access a locked feature
 * Supports:
 *   - Subscription prompt (all plans)
 *   - One-time KES 650 download/apply for stamp design only
 *   - Expired admin approval notice
 */

import React, { useState } from 'react';
import { Lock, Zap, Crown, X, CreditCard, Smartphone, CheckCircle2, AlertTriangle, Stamp, Download } from 'lucide-react';
import type { AccessStatus, FeatureKey } from '../hooks/useAccessControl';

const FEATURE_LABELS: Record<FeatureKey, string> = {
  stamp_design:       'Stamp Designer',
  stamp_apply:        'Stamp Applier',
  esign:              'Toho eSign',
  pdf_editor:         'PDF Editor',
  ai_summarizer:      'AI Transcriber',
  ai_digitizer:       'AI Stamp Digitizer',
  qr_tracker:         'QR Tracker',
  invoicing:          'Smart Invoice',
  documents:          'Documents Hub',
  templates:          'Template Library',
  virtual_assistants: 'Virtual Assistants',
  social_hub:         'Social Hub',
};

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: 'KES 650', period: '/month',
    color: 'from-blue-600 to-blue-800',
    features: ['eSign — sign documents', 'Stamp Designer & Applier', 'Smart Invoice', 'Find Workers', 'Add Clients'],
  },
  {
    id: 'professional', name: 'Professional', price: 'KES 2,500', period: '/month',
    color: 'from-purple-600 to-indigo-700',
    badge: 'Most Popular',
    features: ['Everything in Starter', 'PDF Editor', 'AI Scanner', 'Client CRM', 'Recruit & Track unlimited', 'Team Members'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 'KES 5,000', period: '/month',
    color: 'from-amber-500 to-orange-600',
    features: ['Everything in Professional', 'Virtual Assistants', 'Admin Sub-accounts', 'API Access', 'White-label'],
  },
];

interface PaywallModalProps {
  feature: FeatureKey;
  status: AccessStatus;
  approvalExpiresAt?: string;
  onClose: () => void;
  onPlanSelected?: (planId: string) => void;
  onOneTimePay?: () => void;   // KES 650 monthly
}

export default function PaywallModal({ feature, status, approvalExpiresAt, onClose, onPlanSelected, onOneTimePay }: PaywallModalProps) {
  const [tab, setTab] = useState<'subscribe' | 'onetime'>('subscribe');
  const featureName = FEATURE_LABELS[feature] || feature;
  const isStampFeature = feature === 'stamp_design' || feature === 'stamp_apply';

  const headerBg = status === 'expired'
    ? 'from-orange-500/20 to-red-500/20'
    : 'from-[#1f6feb]/20 to-purple-500/20';

  const icon = status === 'expired' ? (
    <AlertTriangle size={28} className="text-orange-400" />
  ) : status === 'trial_used' ? (
    <Stamp size={28} className="text-[#58a6ff]" />
  ) : (
    <Lock size={28} className="text-[#58a6ff]" />
  );

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-r ${headerBg} border-b border-[#30363d] p-6 flex items-start justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#0d1117]/60 rounded-2xl flex items-center justify-center border border-[#30363d]">
              {icon}
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                {status === 'expired'
                  ? 'Access Expired'
                  : status === 'trial_used'
                  ? 'Free Trial Used'
                  : `${featureName} is Locked`}
              </h2>
              <p className="text-sm text-[#8b949e] mt-1">
                {status === 'expired'
                  ? `Your admin-approved access to ${featureName} has expired.`
                  : status === 'trial_used'
                  ? `You've used your 1 free trial for ${featureName}. Choose how to continue.`
                  : `Upgrade your plan to unlock ${featureName} and all premium features.`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Tab switcher for stamp features with monthly option */}
          {isStampFeature && (
            <div className="flex gap-2 mb-6 bg-[#0d1117] rounded-xl p-1">
              <button
                onClick={() => setTab('subscribe')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'subscribe' ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-white'}`}
              >
                Subscribe
              </button>
              <button
                onClick={() => setTab('onetime')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'onetime' ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-white'}`}
              >
                One-time Download (KES 650)
              </button>
            </div>
          )}

          {/* One-time pay option */}
          {tab === 'onetime' && isStampFeature ? (
            <div className="space-y-4">
              <div className="bg-[#21262d] border border-[#30363d] rounded-2xl p-6 text-center">
                <Download size={40} className="text-[#58a6ff] mx-auto mb-3" />
                <h3 className="text-2xl font-black text-white mb-1">KES 650</h3>
                <p className="text-sm text-[#8b949e] mb-4">One-time payment — download or apply your stamp once, no subscription needed.</p>
                <ul className="text-left space-y-2 mb-6 text-sm">
                  {['Download your designed stamp (SVG + PNG)', 'Apply stamp to 1 PDF document', 'No recurring charges', 'Instant access'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-[#e6edf3]">
                      <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3">
                  <button
                    onClick={() => onOneTimePay?.()}
                    className="flex-1 bg-[#1f6feb] hover:bg-[#388bfd] text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Smartphone size={16} /> Pay via M-Pesa
                  </button>
                  <button
                    onClick={() => onOneTimePay?.()}
                    className="flex-1 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <CreditCard size={16} /> Pay by Card
                  </button>
                </div>
              </div>
              <p className="text-center text-xs text-[#8b949e]">
                Want unlimited use?{' '}
                <button onClick={() => setTab('subscribe')} className="text-[#58a6ff] underline">See subscription plans →</button>
              </p>
            </div>
          ) : (
            /* Subscription plans */
            <div className="space-y-4">
              <p className="text-sm text-[#8b949e] font-semibold text-center mb-2">Choose a plan to unlock all features</p>
              <div className="grid gap-4 md:grid-cols-3">
                {PLANS.map(plan => (
                  <div
                    key={plan.id}
                    className={`relative bg-[#21262d] border rounded-2xl p-5 flex flex-col ${plan.badge ? 'border-[#1f6feb]' : 'border-[#30363d]'}`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1f6feb] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        {plan.badge}
                      </div>
                    )}
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-3`}>
                      <Crown size={14} className="text-white" />
                    </div>
                    <h3 className="font-black text-white text-sm mb-0.5">{plan.name}</h3>
                    <div className="text-xl font-black text-white mb-3">
                      {plan.price}<span className="text-xs text-[#8b949e] font-normal">{plan.period}</span>
                    </div>
                    <ul className="space-y-1.5 mb-4 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-1.5 text-xs text-[#8b949e]">
                          <CheckCircle2 size={11} className="text-emerald-400 flex-shrink-0 mt-0.5" /> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => onPlanSelected?.(plan.id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${plan.badge ? 'bg-[#1f6feb] hover:bg-[#388bfd] text-white' : 'bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-white'}`}
                    >
                      Get {plan.name}
                    </button>
                  </div>
                ))}
              </div>

              {/* Admin approval note */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <Crown size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200">
                  <span className="font-bold">Organization access?</span> Your super admin can activate your account for 1–12 months without a card. Contact them to request access.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
