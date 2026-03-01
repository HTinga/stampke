
import React from 'react';
import { StampConfig, StampShape, BorderStyle, CustomElement } from '../types';
import { COLORS, FONTS } from '../constants';
import { Sliders, Type, Calendar, Layout, Plus, Trash2, Image as ImageIcon, MousePointer, Eye, EyeOff, PenTool, Star, Eraser, Save, X, Download, FileText, Image } from 'lucide-react';

const SignaturePad: React.FC<{ onSave: (url: string) => void, onCancel: () => void }> = ({ onSave, onCancel }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm animate-in zoom-in duration-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-black tracking-tight dark:text-white">Draw Signature</h4>
        <button onClick={onCancel} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all dark:text-slate-400"><X size={18} /></button>
      </div>
      <div className="bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-4 touch-none">
        <canvas 
          ref={canvasRef}
          width={350}
          height={180}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="w-full h-auto cursor-crosshair"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs">
          <Eraser size={14} /> Clear
        </button>
        <button onClick={() => {
          const canvas = canvasRef.current;
          if (canvas) onSave(canvas.toDataURL('image/png'));
        }} className="bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none transition-all text-xs">
          <Save size={14} /> Apply
        </button>
      </div>
    </div>
  );
};

interface EditorControlsProps {
  config: StampConfig;
  onChange: (updates: Partial<StampConfig>) => void;
}

const EditorControls: React.FC<EditorControlsProps> = ({ config, onChange }) => {
  const [showSignPad, setShowSignPad] = React.useState(false);

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
      <section className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <Layout size={14} /> Typography & Shape
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Font Family</label>
            <select 
              value={config.fontFamily}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Shape</label>
            <select 
              value={config.shape}
              onChange={(e) => onChange({ shape: e.target.value as StampShape })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>
      </section>

      <section className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <Sliders size={14} /> Border & Layout
        </h3>
        <div className="space-y-4">
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
            <div className="flex justify-between">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Border Offset</label>
              <span className="text-[10px] font-bold text-slate-400">{config.borderOffset}px</span>
            </div>
            <input 
              type="range" min="-20" max="50" step="1"
              value={config.borderOffset}
              onChange={(e) => onChange({ borderOffset: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3">
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

      <section className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <Type size={14} /> Text Content & Styling
        </h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Main Header</label>
            <input 
              type="text"
              value={config.primaryText}
              onChange={(e) => onChange({ primaryText: e.target.value.toUpperCase() })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Sub Header (Bottom)</label>
            <input 
              type="text"
              value={config.secondaryText}
              onChange={(e) => onChange({ secondaryText: e.target.value.toUpperCase() })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inner Text Customization</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Inner Top</label>
                <input 
                  type="text"
                  value={config.innerTopText}
                  onChange={(e) => onChange({ innerTopText: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Inner Bottom</label>
                <input 
                  type="text"
                  value={config.innerBottomText}
                  onChange={(e) => onChange({ innerBottomText: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Inner Text Color</label>
                <input 
                  type="color" 
                  value={config.innerTextColor || config.borderColor}
                  onChange={(e) => onChange({ innerTextColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Inner Text Size</label>
                  <span className="text-[10px] font-bold text-slate-400">{config.innerTextSize}px</span>
                </div>
                <input 
                  type="range" min="8" max="40" step="1"
                  value={config.innerTextSize || 14}
                  onChange={(e) => onChange({ innerTextSize: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Inner Text Intensity</label>
                  <span className="text-[10px] font-bold text-slate-400">{Math.round((config.innerTextIntensity || 1) * 100)}%</span>
                </div>
                <input 
                  type="range" min="0.1" max="1" step="0.05"
                  value={config.innerTextIntensity || 1}
                  onChange={(e) => onChange({ innerTextIntensity: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Center Text</label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl cursor-pointer relative group border border-blue-100 dark:border-blue-800">
                  <Calendar size={14} className="text-blue-600" />
                  <span className="text-[10px] font-black uppercase text-blue-600">Pick Date</span>
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
            </div>
            <input 
              type="text"
              value={config.centerText}
              onChange={(e) => onChange({ centerText: e.target.value.toUpperCase() })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <Star size={14} /> Embellishments & Stars
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Star size={18} className="text-yellow-500" />
              <span className="text-sm font-bold">Show Stars</span>
            </div>
            <input 
              type="checkbox" 
              checked={config.showStars} 
              onChange={(e) => onChange({ showStars: e.target.checked })}
              className="w-5 h-5 rounded text-yellow-500 border-slate-300"
            />
          </div>

          {config.showStars && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Star Count</label>
                  <span className="text-[10px] font-bold text-slate-400">{config.starCount || 2}</span>
                </div>
                <input 
                  type="range" min="1" max="10" step="1"
                  value={config.starCount || 2}
                  onChange={(e) => onChange({ starCount: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Star Size</label>
                  <span className="text-[10px] font-bold text-slate-400">{config.starSize || 20}px</span>
                </div>
                <input 
                  type="range" min="5" max="50" step="1"
                  value={config.starSize || 20}
                  onChange={(e) => onChange({ starSize: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Star Offset (Alignment)</label>
                  <span className="text-[10px] font-bold text-slate-400">{config.starOffset || 0}px</span>
                </div>
                <input 
                  type="range" min="-50" max="50" step="1"
                  value={config.starOffset || 0}
                  onChange={(e) => onChange({ starOffset: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <Sliders size={14} /> Rubber Stamp Effects
        </h3>
        <div className="space-y-4">
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
            <label className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
              <input 
                type="checkbox" 
                checked={config.isVintage} 
                onChange={(e) => onChange({ isVintage: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 border-slate-300"
              />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Vintage</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
              <input 
                type="checkbox" 
                checked={config.wetInk} 
                onChange={(e) => onChange({ wetInk: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300"
              />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Wet Ink</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
              <input 
                type="checkbox" 
                checked={config.showDateLine} 
                onChange={(e) => onChange({ showDateLine: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300"
              />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Date Line</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
              <input 
                type="checkbox" 
                checked={config.showSignatureLine} 
                onChange={(e) => onChange({ showSignatureLine: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300"
              />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Sign Line</span>
            </label>
          </div>

          {config.showSignatureLine && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Embed Signature</label>
                <input 
                  type="checkbox" 
                  checked={config.showEmbeddedSignature} 
                  onChange={(e) => onChange({ showEmbeddedSignature: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300"
                />
              </div>
              {config.showEmbeddedSignature && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowSignPad(true)}
                    className="flex-1 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                  >
                    <PenTool size={12} /> Draw
                  </button>
                  <div className="flex-1 relative">
                    <button className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
                      <ImageIcon size={12} /> Upload
                    </button>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => onChange({ embeddedSignatureUrl: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              {config.showEmbeddedSignature && config.embeddedSignatureUrl && (
                <div className="relative group">
                  <img src={config.embeddedSignatureUrl} className="w-full h-16 object-contain bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-blue-800 p-2" alt="Signature" />
                  <button 
                    onClick={() => onChange({ embeddedSignatureUrl: null })}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>
          )}
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

      {showSignPad && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <SignaturePad 
            onSave={(url) => {
              onChange({ embeddedSignatureUrl: url });
              setShowSignPad(false);
            }}
            onCancel={() => setShowSignPad(false)}
          />
        </div>
      )}
    </div>
  );
};

export default EditorControls;
