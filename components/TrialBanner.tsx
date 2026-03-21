import React, { useState } from 'react';
import { Clock, X, Zap, Lock } from 'lucide-react';

interface TrialBannerProps {
  daysLeft: number;
  onDismiss?: () => void;
}

export default function TrialBanner({ daysLeft, onDismiss }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const urgent = daysLeft <= 2;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 text-sm border-b ${urgent ? 'bg-red-500/10 border-red-500/20' : 'bg-[#1f6feb]/10 border-[#1f6feb]/20'}`}>
      <Clock size={14} className={urgent ? 'text-red-400 flex-shrink-0' : 'text-[#58a6ff] flex-shrink-0'} />
      <p className={`flex-1 text-xs font-semibold ${urgent ? 'text-red-300' : 'text-[#58a6ff]'}`}>
        {daysLeft === 0
          ? 'Your free trial has ended. eSign & Stamps are still available. Upgrade to unlock all tools.'
          : `Free trial: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left. eSign & Stamps are always free. Upgrade to unlock all premium tools.`}
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] text-[#8b949e] flex items-center gap-1">
          <Lock size={10} /> Contact admin to upgrade
        </span>
        <button onClick={() => { setDismissed(true); onDismiss?.(); }} className="p-1 text-[#8b949e] hover:text-white transition-colors">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
