
import React from 'react';
import { StampConfig, StampShape, BorderStyle, CustomElement } from '../types';
import { COLORS, FONTS } from '../constants';
import { Sliders, Type, Calendar, Layout, Plus, Trash2, Image as ImageIcon, MousePointer, Eye, EyeOff } from 'lucide-react';

interface EditorControlsProps {
  config: StampConfig;
  onChange: (updates: Partial<StampConfig>) => void;
}

const EditorControls: React.FC<EditorControlsProps> = ({ config, onChange }) => {
  const addCustomElement = (type: 'image' | 'text') => {
    const newEl: CustomElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 250,
      y: 250,
      content: type === 'text' ? 'NEW TEXT' : 'https://picsum.photos/seed/stamp/100/100',
      width: type === 'image' ? 100 : undefined,
      height: type === 'image' ? 100 : undefined,
      rotation: 0,
      scale: 1
    };
    onChange({ customElements: [...(config.customElements || []), newEl] });
  };

  const updateCustomElement = (id: string, updates: Partial<CustomElement>) => {
    onChange({
      customElements: config.customElements.map(el => el.id === id ? { ...el, ...updates } : el)
    });
  };

  const removeCustomElement = (id: string) => {
    onChange({
      customElements: config.customElements.filter(el => el.id !== id)
    });
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateCustomElement(id, { content: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-y-auto max-h-[75vh] custom-scrollbar">
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <Layout size={14} /> Typography & Shape
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Font Family</label>
            <select 
              value={config.fontFamily}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Shape</label>
            <select 
              value={config.shape}
              onChange={(e) => onChange({ shape: e.target.value as StampShape })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Stamp Size</label>
              <span className="text-[10px] font-bold text-slate-400">{config.fontSize}px</span>
            </div>
            <input 
              type="range" min="10" max="60" step="1"
              value={config.fontSize}
              onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Letter Stretch</label>
              <span className="text-[10px] font-bold text-slate-400">{Math.round(config.letterStretch * 100)}%</span>
            </div>
            <input 
              type="range" min="0.5" max="2" step="0.05"
              value={config.letterStretch}
              onChange={(e) => onChange({ letterStretch: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Border Thickness</label>
              <span className="text-[10px] font-bold text-slate-400">{config.borderWidth}px</span>
            </div>
            <input 
              type="range" min="1" max="15" step="0.5"
              value={config.borderWidth}
              onChange={(e) => onChange({ borderWidth: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Preview Background</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'default', label: 'Def', color: 'bg-slate-100' },
                { id: 'transparent', label: 'Trp', color: 'bg-transparent border-2 border-dashed border-slate-300' },
                { id: 'white', label: 'Wht', color: 'bg-white' },
                { id: 'paper', label: 'Ppr', color: 'bg-[#fdfbf7]' }
              ].map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => onChange({ previewBg: bg.id as any })}
                  className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all border-2 ${config.previewBg === bg.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
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
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Rustness / Distress</label>
              <span className="text-[10px] font-bold text-slate-400">{Math.round(config.distressLevel * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.05"
              value={config.distressLevel}
              onChange={(e) => onChange({ distressLevel: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
              <input 
                type="checkbox" 
                checked={config.isVintage} 
                onChange={(e) => onChange({ isVintage: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 border-slate-300"
              />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Vintage</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
              <input 
                type="checkbox" 
                checked={config.wetInk} 
                onChange={(e) => onChange({ wetInk: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300"
              />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Wet Ink</span>
            </label>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inner Line</label>
              <input 
                type="checkbox" 
                checked={config.showInnerLine} 
                onChange={(e) => onChange({ showInnerLine: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300"
              />
            </div>
            {config.showInnerLine && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold text-slate-500">Offset</label>
                    <span className="text-[10px] font-bold text-slate-400">{config.innerLineOffset}px</span>
                  </div>
                  <input 
                    type="range" min="5" max="50" step="1"
                    value={config.innerLineOffset}
                    onChange={(e) => onChange({ innerLineOffset: parseInt(e.target.value) })}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold text-slate-500">Thickness</label>
                    <span className="text-[10px] font-bold text-slate-400">{config.innerLineWidth}px</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="10" step="0.5"
                    value={config.innerLineWidth || 2}
                    onChange={(e) => onChange({ innerLineWidth: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Type size={14} /> Text & Date Controls
        </h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Main Header</label>
            <input 
              type="text"
              value={config.primaryText}
              onChange={(e) => onChange({ primaryText: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Center Text</label>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md cursor-pointer relative group">
                <Calendar size={12} className="text-blue-600" />
                <span className="text-[10px] font-black uppercase text-blue-600">Date</span>
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
                      if (config.showDateLine) {
                        onChange({ centerSubText: formatted });
                      } else {
                        onChange({ centerText: formatted });
                      }
                    }
                  }}
                />
              </div>
            </div>
            <input 
              type="text"
              value={config.centerText}
              onChange={(e) => onChange({ centerText: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
              <input 
                type="checkbox" 
                checked={config.showDateLine} 
                onChange={(e) => onChange({ showDateLine: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300"
              />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Date Line</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
              <input 
                type="checkbox" 
                checked={config.showSignatureLine} 
                onChange={(e) => onChange({ showSignatureLine: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300"
              />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Sign Line</span>
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Plus size={14} /> Custom Elements
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => addCustomElement('text')}
              className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-blue-50 text-blue-600 transition-all"
              title="Add Text"
            >
              <Type size={14} />
            </button>
            <button 
              onClick={() => addCustomElement('image')}
              className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-all"
              title="Add Image"
            >
              <ImageIcon size={14} />
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {config.customElements?.map((el) => (
            <div key={el.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {el.type === 'image' ? <ImageIcon size={14} className="text-emerald-600" /> : <Type size={14} className="text-blue-600" />}
                  <span className="text-[10px] font-black uppercase text-slate-400">{el.type}</span>
                </div>
                <button onClick={() => removeCustomElement(el.id)} className="text-red-500 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="space-y-2">
                {el.type === 'text' ? (
                  <input 
                    type="text"
                    value={el.content}
                    onChange={(e) => updateCustomElement(el.id, { content: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <img src={el.content} className="w-8 h-8 rounded-md object-cover border border-slate-200" alt="Preview" />
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(el.id, e)}
                      className="text-[10px] text-slate-500"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Scale</label>
                    <input 
                      type="range" min="0.1" max="3" step="0.1"
                      value={el.scale || 1}
                      onChange={(e) => updateCustomElement(el.id, { scale: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Rotation</label>
                    <input 
                      type="range" min="0" max="360" step="1"
                      value={el.rotation || 0}
                      onChange={(e) => updateCustomElement(el.id, { rotation: parseInt(e.target.value) })}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
                {el.type === 'image' && (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={el.isBlackAndWhite} 
                        onChange={(e) => updateCustomElement(el.id, { isBlackAndWhite: e.target.checked })}
                        className="w-3 h-3 rounded text-blue-600 border-slate-300"
                      />
                      <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600 transition-colors uppercase">Black & White Mode</span>
                    </label>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold text-slate-500">Contrast (BG Removal)</label>
                        <span className="text-[10px] font-bold text-slate-400">{el.contrast || 1}x</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" step="0.5"
                        value={el.contrast || 1}
                        onChange={(e) => updateCustomElement(el.id, { contrast: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">X Position</label>
                    <input 
                      type="range" min="0" max="600" step="1"
                      value={el.x}
                      onChange={(e) => updateCustomElement(el.id, { x: parseInt(e.target.value) })}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Y Position</label>
                    <input 
                      type="range" min="0" max="600" step="1"
                      value={el.y}
                      onChange={(e) => updateCustomElement(el.id, { y: parseInt(e.target.value) })}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {!config.isVintage && (
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Color Themes</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">Main Ink Color</label>
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
          </div>
        </section>
      )}
    </div>
  );
};

export default EditorControls;
