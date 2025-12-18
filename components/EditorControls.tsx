
import React from 'react';
import { StampConfig, StampShape, BorderStyle } from '../types';
import { COLORS, FONTS } from '../constants';
import { Sliders, Type, Calendar, Layout } from 'lucide-react';

interface EditorControlsProps {
  config: StampConfig;
  onChange: (updates: Partial<StampConfig>) => void;
}

const EditorControls: React.FC<EditorControlsProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-y-auto max-h-[75vh] custom-scrollbar">
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <Layout size={14} /> Typography & Shape
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

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-medium text-slate-600">Stamp Size</label>
              <span className="text-[10px] font-bold text-slate-400">{config.fontSize}px</span>
            </div>
            <input 
              type="range" min="10" max="60" step="1"
              value={config.fontSize}
              onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-medium text-slate-600">Border Thickness</label>
              <span className="text-[10px] font-bold text-slate-400">{config.borderWidth}px</span>
            </div>
            <input 
              type="range" min="1" max="15" step="0.5"
              value={config.borderWidth}
              onChange={(e) => onChange({ borderWidth: parseFloat(e.target.value) })}
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
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Type size={14} /> Text & Date Controls
        </h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Main Header (Top Arc/Header)</label>
            <input 
              type="text"
              value={config.primaryText}
              onChange={(e) => onChange({ primaryText: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-slate-600">Center Text (Date/Status)</label>
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md cursor-pointer relative group">
                <Calendar size={12} className="text-blue-600" />
                <span className="text-[10px] font-black uppercase text-blue-600">Date Picker</span>
                <input 
                  type="date" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    if (!isNaN(date.getTime())) {
                      const formatted = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }).toUpperCase();
                      onChange({ centerText: formatted });
                    }
                  }}
                />
              </div>
            </div>
            <input 
              type="text"
              value={config.centerText}
              onChange={(e) => onChange({ centerText: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Sub-Center Text (Secondary Date/Info)</label>
            <input 
              type="text"
              value={config.centerSubText}
              onChange={(e) => onChange({ centerSubText: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., RECEIVED"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
              <input 
                type="checkbox" 
                checked={config.showDateLine} 
                onChange={(e) => onChange({ showDateLine: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-700 uppercase">Date Line</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
              <input 
                type="checkbox" 
                checked={config.showSignatureLine} 
                onChange={(e) => onChange({ showSignatureLine: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-700 uppercase">Sign Line</span>
            </label>
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
            <label className="text-xs font-medium text-slate-600">Footer/Secondary Text</label>
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
              <label className="text-xs font-medium text-slate-600 block">Main Ink Color</label>
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
              <label className="text-xs font-medium text-slate-600 block">Secondary Ink Color</label>
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
