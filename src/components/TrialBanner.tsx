/**
 * PlanBanner — shown when user has no plan or needs to upgrade
 * No trial messaging — all features require payment
 */
import React, { useState } from 'react';
import { Lock, X, Zap } from 'lucide-react';

interface PlanBannerProps {
  featureName?: string;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

export default function TrialBanner({ featureName, onUpgrade, onDismiss }: PlanBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm border-b bg-[#1f6feb]/10 border-[#1f6feb]/20">
      <Lock size={14} className="text-[#58a6ff] flex-shrink-0" />
      <p className="flex-1 text-xs font-semibold text-[#58a6ff]">
        {featureName
          ? `${featureName} requires a paid plan.`
          : 'This feature requires a paid plan.'
        } Plans from KES 650/month · M-Pesa or Card.
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onUpgrade && (
          <button onClick={onUpgrade}
            className="text-[10px] font-bold text-white bg-[#1f6feb] hover:bg-[#388bfd] px-2 py-1 rounded-lg flex items-center gap-1 transition-colors">
            <Zap size={10} /> Upgrade
          </button>
        )}
        <button onClick={() => { setDismissed(true); onDismiss?.(); }}
          className="p-1 text-[#8b949e] hover:text-white transition-colors">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
