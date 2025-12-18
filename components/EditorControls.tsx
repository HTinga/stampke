
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

  return (
    <div className="space-y-8 bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm overflow-y-auto max-h-[75vh] lg:max-h-none custom-scrollbar">
      {showSigPad && (
        <SignaturePad 
          onSave={(data) => { onChange({ signatureUrl: data }); setShowSigPad(false); }}
          onClose={() => setShowSigPad(false)}
        />
      )}
      
      {/* 1. Style & Geometry */}
      <section>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
           <Type size={14} /> Typography & Shape
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600">Font Family</label>
            <select 
              value={config.fontFamily}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600">Base Shape</label>
            <select 
              value={config.shape}
              onChange={(e) => onChange({ shape: e.target.value as StampShape })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value={StampShape.ROUND}>Round</option>
              <option value={StampShape.OVAL}>Oval</option>
              <option value={StampShape.RECTANGLE}>Rectangle</option>
              <option value={StampShape.SQUARE}>Square</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Maximize size={12}/> Size</label>
              <span className="text-[10px] font-black text-blue-600">{config.fontSize}px</span>
            </div>
            <input 
              type="range" min="10" max="45" step="1"
              value={config.fontSize}
              onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><RotateCw size={12}/> Rotation</label>
              <span className="text-[10px] font-black text-blue-600">{config.rotation}°</span>
            </div>
            <input 
              type="range" min="0" max="360" step="1"
              value={config.rotation}
              onChange={(e) => onChange({ rotation: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><AlignCenter size={12}/> Spacing</label>
              <span className="text-[10px] font-black text-blue-600">{config.letterSpacing}px</span>
            </div>
            <input 
              type="range" min="0" max="10" step="0.5"
              value={config.letterSpacing}
              onChange={(e) => onChange({ letterSpacing: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Move size={12}/> Border</label>
              <span className="text-[10px] font-black text-blue-600">{config.borderWidth}px</span>
            </div>
            <input 
              type="range" min="1" max="12" step="1"
              value={config.borderWidth}
              onChange={(e) => onChange({ borderWidth: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </section>

      {/* 2. Official Overlays (Locked for Pro) */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
           <PenTool size={14} /> Verified Assets
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="relative">
             <button 
              disabled={!isPro}
              onClick={() => setShowSigPad(true)}
              className={`w-full p-6 rounded-[32px] border-2 transition-all text-left flex flex-col items-start ${!isPro ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-blue-300'}`}
             >
                <div className="flex items-center justify-between w-full mb-3">
                   <MousePointer2 size={18} className={!isPro ? 'text-slate-300' : 'text-blue-600'} />
                   {!isPro ? <Lock size={14} className="text-slate-300" /> : config.signatureUrl && <Check size={16} className="text-emerald-500" />}
                </div>
                <p className={`text-[11px] font-black uppercase tracking-widest ${!isPro ? 'text-slate-300' : 'text-slate-900'}`}>Signature</p>
                <p className="text-[9px] text-slate-400 mt-1 font-bold">Manual drawing overlay</p>
             </button>
             {!isPro && (
               <div className="absolute top-3 right-3">
                  <span onClick={onUpgrade} className="cursor-pointer bg-blue-600 text-white text-[7px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">PRO</span>
               </div>
             )}
           </div>
           
           <div className="relative">
             <button 
              disabled={!isPro}
              onClick={() => onChange({ includeCertificate: !config.includeCertificate })}
              className={`w-full p-6 rounded-[32px] border-2 transition-all text-left flex flex-col items-start ${!isPro ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-emerald-300'}`}
             >
                <div className="flex items-center justify-between w-full mb-3">
                   <ShieldCheck size={18} className={!isPro ? 'text-slate-300' : config.includeCertificate ? 'text-emerald-600' : 'text-slate-400'} />
                   {!isPro ? <Lock size={14} className="text-slate-300" /> : config.includeCertificate && <Check size={16} className="text-emerald-500" />}
                </div>
                <p className={`text-[11px] font-black uppercase tracking-widest ${!isPro ? 'text-slate-300' : 'text-slate-900'}`}>Certificate</p>
                <p className="text-[9px] text-slate-400 mt-1 font-bold">Authenticity ID report</p>
             </button>
             {!isPro && (
               <div className="absolute top-3 right-3">
                  <span onClick={onUpgrade} className="cursor-pointer bg-blue-600 text-white text-[7px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">PRO</span>
               </div>
             )}
           </div>
        </div>
      </section>

      {/* 3. Text Content */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Stamp Metadata</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600">Main Header Text</label>
            <input 
              type="text"
              value={config.primaryText}
              onChange={(e) => onChange({ primaryText: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600">Center Action / Date</label>
            <input 
              type="text"
              value={config.centerText}
              onChange={(e) => onChange({ centerText: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600">Bottom / Footer Text</label>
            <input 
              type="text"
              value={config.secondaryText}
              onChange={(e) => onChange({ secondaryText: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
        </div>
      </section>
      
      {/* 4. Inking Effects */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
           <Sliders size={14} /> Physical Aging
        </h3>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-slate-600">Ink Distress (Wear & Tear)</label>
              <span className="text-[10px] font-black text-blue-600">{Math.round(config.distressLevel * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.05"
              value={config.distressLevel}
              onChange={(e) => onChange({ distressLevel: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <button 
            onClick={() => onChange({ isVintage: !config.isVintage })}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-[0.2em] ${config.isVintage ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
          >
            {config.isVintage ? <Check size={16} /> : null} Vintage Monochrome Mode
          </button>
        </div>
      </section>

      {/* 5. Colors */}
      {!config.isVintage && (
        <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Ink Tones</h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Outer Border</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onChange({ borderColor: c.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${config.borderColor === c.value ? 'ring-2 ring-blue-500 ring-offset-2 scale-110 shadow-lg' : 'border-transparent'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inner Body</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onChange({ secondaryColor: c.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${config.secondaryColor === c.value ? 'ring-2 ring-red-500 ring-offset-2 scale-110 shadow-lg' : 'border-transparent'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default EditorControls;
