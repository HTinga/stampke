
import React from 'react';
import { StampConfig, StampShape, BorderStyle } from '../types';
import { COLORS, FONTS } from '../constants';
import { Upload, X, Star, Trash2, Sliders, Type } from 'lucide-react';

interface EditorControlsProps {
  config: StampConfig;
  onChange: (updates: Partial<StampConfig>) => void;
}

const EditorControls: React.FC<EditorControlsProps> = ({ config, onChange }) => {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ logoUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-y-auto max-h-[75vh] custom-scrollbar">
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <Type size={14} /> Typography & Shape
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Font Family</label>
            <select 
              value={config.fontFamily}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Shape</label>
            <select 
              value={config.shape}
              onChange={(e) => onChange({ shape: e.target.value as StampShape })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={StampShape.ROUND}>Round</option>
              <option value={StampShape.OVAL}>Oval</option>
              <option value={StampShape.RECTANGLE}>Rectangle</option>
              <option value={StampShape.SQUARE}>Square</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-medium text-slate-600">Font Scale</label>
              <span className="text-[10px] font-bold text-slate-400">{config.fontSize}px</span>
            </div>
            <input 
              type="range" min="10" max="40" step="1"
              value={config.fontSize}
              onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <Sliders size={14} /> Rubber Stamp Effects
        </h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-medium text-slate-600">Rustness / Distress</label>
              <span className="text-[10px] font-bold text-slate-400">{Math.round(config.distressLevel * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.05"
              value={config.distressLevel}
              onChange={(e) => onChange({ distressLevel: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
              <input 
                type="checkbox" 
                checked={config.isVintage} 
                onChange={(e) => onChange({ isVintage: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-700 uppercase">Vintage Mode</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
              <input 
                type="checkbox" 
                checked={config.showStars} 
                onChange={(e) => onChange({ showStars: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-700 uppercase">Side Stars</span>
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Text Content</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Main Header</label>
            <input 
              type="text"
              value={config.primaryText}
              onChange={(e) => onChange({ primaryText: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
          {(config.shape === StampShape.ROUND || config.shape === StampShape.OVAL) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Inner Top</label>
                <input 
                  type="text"
                  value={config.innerTopText}
                  onChange={(e) => onChange({ innerTopText: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
                  placeholder="Subheading..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Inner Bottom</label>
                <input 
                  type="text"
                  value={config.innerBottomText}
                  onChange={(e) => onChange({ innerBottomText: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
                  placeholder="Tel/Email..."
                />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Center Text (Date/Action)</label>
            <input 
              type="text"
              value={config.centerText}
              onChange={(e) => onChange({ centerText: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Footer Text</label>
            <input 
              type="text"
              value={config.secondaryText}
              onChange={(e) => onChange({ secondaryText: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
        </div>
      </section>

      {!config.isVintage && (
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Color Themes</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 block">Border Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onChange({ borderColor: c.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${config.borderColor === c.value ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 block">Center Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onChange({ secondaryColor: c.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${config.secondaryColor === c.value ? 'ring-2 ring-red-500 ring-offset-2 scale-110' : 'border-transparent'}`}
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
