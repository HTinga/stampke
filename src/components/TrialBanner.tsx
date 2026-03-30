import React, { useState } from 'react';
import { Sparkles, X, Zap } from 'lucide-react';

interface TrialBannerProps {
  featureName?: string;
  trialUsed?: boolean;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

export default function TrialBanner({ featureName, trialUsed = false, onUpgrade, onDismiss }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 text-sm border-b ${trialUsed ? 'bg-red-500/10 border-red-500/20' : 'bg-[#1f6feb]/10 border-[#1f6feb]/20'}`}>
      <Sparkles size={14} className={trialUsed ? 'text-red-400 flex-shrink-0' : 'text-[#58a6ff] flex-shrink-0'} />
      <p className={`flex-1 text-xs font-semibold ${trialUsed ? 'text-red-300' : 'text-[#58a6ff]'}`}>
        {trialUsed
          ? `Your free trial for ${featureName || 'this feature'} has been used. Upgrade to continue.`
          : `You have 1 free trial${featureName ? ` for ${featureName}` : ' per feature'}. Upgrade anytime from KES 1,000/mo.`}
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onUpgrade && (
          <button onClick={onUpgrade} className="text-[10px] font-bold text-[#58a6ff] hover:underline flex items-center gap-1">
            <Zap size={10} /> Upgrade
          </button>
        )}
        <button onClick={() => { setDismissed(true); onDismiss?.(); }} className="p-1 text-[#8b949e] hover:text-white transition-colors">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
