
import React, { useState } from 'react';
import { StampConfig, StampShape, BorderStyle, SubscriptionTier } from '../types';
import { COLORS, FONTS } from '../constants';
import { 
  X, Star, Trash2, Sliders, Type, PenTool, ShieldCheck, 
  MousePointer2, Check, Lock, Move, Maximize, RotateCw, AlignCenter
} from 'lucide-react';
import SignaturePad from './SignaturePad';

interface EditorControlsProps {
  config: StampConfig;
  onChange: (updates: Partial<StampConfig>) => void;
  userTier: SubscriptionTier;
  onUpgrade: () => void;
}

const EditorControls: React.FC<EditorControlsProps> = ({ config, onChange, userTier, onUpgrade }) => {
  const [showSigPad, setShowSigPad] = useState(false);
  const isPro = userTier === SubscriptionTier.PRO || userTier === SubscriptionTier.BUSINESS;

  const controlBlock = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {icon} {title}
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      {showSigPad && (
        <SignaturePad 
          onSave={(data) => { onChange({ signatureUrl: data }); setShowSigPad(false); }}
          onClose={() => setShowSigPad(false)}
        />
      )}
      
      {controlBlock("Typography", <Type size={14}/>, (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Font</label>
            <select 
              value={config.fontFamily}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold outline-none dark:text-white"
            >
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Shape</label>
            <select 
              value={config.shape}
              onChange={(e) => onChange({ shape: e.target.value as StampShape })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold outline-none dark:text-white"
            >
              <option value={StampShape.ROUND}>Round</option>
              <option value={StampShape.OVAL}>Oval</option>
              <option value={StampShape.RECTANGLE}>Rect</option>
            </select>
          </div>
        </div>
      ))}

      {controlBlock("Sizing & Adjustments", <Maximize size={14}/>, (
        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
              <span>Text Size</span>
              <span>{config.fontSize}px</span>
            </div>
            <input type="range" min="10" max="45" value={config.fontSize} onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
              <span>Rotation</span>
              <span>{config.rotation}°</span>
            </div>
            <input type="range" min="0" max="360" value={config.rotation} onChange={(e) => onChange({ rotation: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
              <span>Letter Spacing</span>
              <span>{config.letterSpacing}px</span>
            </div>
            <input type="range" min="0" max="10" step="0.5" value={config.letterSpacing} onChange={(e) => onChange({ letterSpacing: parseFloat(e.target.value) })} className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
          </div>
        </div>
      ))}

      {controlBlock("Text Content", <Sliders size={14}/>, (
        <div className="space-y-3">
          <input type="text" placeholder="HEADER TEXT" value={config.primaryText} onChange={(e) => onChange({ primaryText: e.target.value.toUpperCase() })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-xs font-bold dark:text-white outline-none focus:ring-1 focus:ring-blue-500" />
          <input type="text" placeholder="CENTER TEXT" value={config.centerText} onChange={(e) => onChange({ centerText: e.target.value.toUpperCase() })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-xs font-bold dark:text-white outline-none focus:ring-1 focus:ring-blue-500" />
          <input type="text" placeholder="FOOTER TEXT" value={config.secondaryText} onChange={(e) => onChange({ secondaryText: e.target.value.toUpperCase() })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-xs font-bold dark:text-white outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      ))}

      {controlBlock("Ink & Effects", <PenTool size={14}/>, (
        <div className="space-y-4">
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button key={c.value} onClick={() => onChange({ borderColor: c.value, secondaryColor: c.value })} className={`w-8 h-8 rounded-full border-2 transition-all ${config.borderColor === c.value ? 'ring-2 ring-blue-500 ring-offset-2 scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c.value }} />
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
              <span>Ink Distress</span>
              <span>{Math.round(config.distressLevel * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.05" value={config.distressLevel} onChange={(e) => onChange({ distressLevel: parseFloat(e.target.value) })} className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
          </div>
        </div>
      ))}
      
      {/* Signature & Certificate Quick Access */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => isPro ? setShowSigPad(true) : onUpgrade()} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2 hover:bg-blue-50 transition-all group">
           <MousePointer2 size={16} className="text-slate-400 group-hover:text-blue-500" />
           <span className="text-[9px] font-black uppercase tracking-widest dark:text-slate-300">Sign Overlay</span>
           {!isPro && <Lock size={10} className="text-amber-500" />}
        </button>
        <button onClick={() => isPro ? onChange({ includeCertificate: !config.includeCertificate }) : onUpgrade()} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${config.includeCertificate ? 'bg-emerald-50 border-emerald-200' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
           <ShieldCheck size={16} className={config.includeCertificate ? 'text-emerald-500' : 'text-slate-400'} />
           <span className="text-[9px] font-black uppercase tracking-widest dark:text-slate-300">Auth Cert</span>
           {!isPro && <Lock size={10} className="text-amber-500" />}
        </button>
      </div>
    </div>
  );
};

export default EditorControls;
