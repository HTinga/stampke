import React, { useState, useEffect } from 'react';
import { Lightbulb, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IntelligentTipProps {
  tipKey: string;
  title?: string;
  message: string;
  icon?: React.ComponentType<any>;
  color?: string;
  delay?: number;
}

const IntelligentTip: React.FC<IntelligentTipProps> = ({ 
  tipKey, 
  title = 'Pro Tip', 
  message, 
  icon: Icon = Lightbulb, 
  color = '#58a6ff',
  delay = 500
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const fullKey = `stampke_tip_${tipKey}`;

  useEffect(() => {
    const isDismissed = localStorage.getItem(fullKey) === 'dismissed';
    if (!isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [fullKey, delay]);

  const dismiss = () => {
    localStorage.setItem(fullKey, 'dismissed');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#161b22] border border-[#30363d] p-4 rounded-2xl shadow-2xl max-w-xs relative group"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div className="flex-1 pr-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">{title}</h4>
              <p className="text-xs text-[#8b949e] leading-relaxed">{message}</p>
            </div>
          </div>
          
          <div className="mt-3 flex justify-end">
            <button 
              onClick={dismiss}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] rounded-lg text-[10px] font-bold transition-colors"
            >
              <Check size={10} /> Got it
            </button>
          </div>

          <button 
            onClick={dismiss}
            className="absolute top-2 right-2 p-1 text-[#8b949e] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntelligentTip;
