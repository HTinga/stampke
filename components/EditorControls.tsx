
import React from 'react';
import { StampConfig, StampShape, BorderStyle, CustomElement } from '../types';
import { COLORS, FONTS } from '../constants';
import { Sliders, Type, Calendar, Layout, Plus, Trash2, Image as ImageIcon, MousePointer, Eye, EyeOff, PenTool, Star, Eraser, Save, X, Download, FileText, Image, Zap } from 'lucide-react';

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
    <div className="bg-[#161b22] dark:bg-[#161b22] p-6 rounded-3xl shadow-2xl border border-[#30363d] dark:border-[#30363d] w-full max-w-sm animate-in zoom-in duration-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-black tracking-tight dark:text-white">Draw Signature</h4>
        <button onClick={onCancel} className="p-1 hover:bg-[#21262d] dark:hover:bg-[#21262d] rounded-full transition-all dark:text-[#8b949e]"><X size={18} /></button>
      </div>
      <div className="bg-[#0d1117] dark:bg-[#0d1117] border-2 border-dashed border-[#30363d] dark:border-[#30363d] rounded-2xl overflow-hidden mb-4 touch-none">
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
        }} className="bg-[#21262d] dark:bg-[#21262d] text-[#e6edf3] dark:text-[#8b949e] py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#30363d] dark:hover:bg-[#30363d] transition-all text-xs">
          <Eraser size={14} /> Clear
        </button>
        <button onClick={() => {
          const canvas = canvasRef.current;
          if (canvas) onSave(canvas.toDataURL('image/png'));
        }} className="bg-[#1f6feb] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#30363d] shadow-lg shadow-[#c5d8ef] dark:shadow-none transition-all text-xs">
          <Save size={14} /> Apply
        </button>
      </div>
    </div>
  );
};

interface EditorControlsProps {
  config: StampConfig;
  onChange: (updates: Partial<StampConfig>) => void;
  onBulkRun?: () => void;
  onSaveTemplate?: () => void;
  isLoggedIn?: boolean;
}

const EditorControls: React.FC<EditorControlsProps> = ({ config, onChange, onBulkRun, onSaveTemplate, isLoggedIn }) => {
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
      scale: 1,
      opacity: 1,
      isCurved: false,
      curveRadius: 100
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
    <div className="space-y-6 bg-[#161b22] dark:bg-[#161b22] p-6 rounded-2xl border border-[#30363d] dark:border-[#30363d] shadow-sm overflow-y-auto max-h-[75vh] custom-scrollbar">
      {onBulkRun && (
        <button 
          onClick={onBulkRun}
          className="w-full bg-[#1f6feb] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#30363d] transition-all shadow-xl shadow-[#c5d8ef] dark:shadow-none flex items-center justify-center gap-2 mb-2"
        >
          <Zap size={16} /> Start Bulk Processing
        </button>
      )}
      
      <section className="bg-[#0d1117] dark:bg-[#21262d]/50 p-4 rounded-2xl border border-[#21262d] dark:border-[#30363d]">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
           <Layout size={14} /> Typography & Shape
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-white">Font Family</label>
            <select 
              value={config.fontFamily}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-[#1f6feb]"
            >
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-white">Shape</label>
            <select 
              value={config.shape}
              onChange={(e) => onChange({ shape: e.target.value as StampShape })}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-[#1f6feb]"
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
              <label className="text-xs font-bold text-white">Base Font Size</label>
              <span className="text-[10px] font-bold text-white">{config.fontSize}px</span>
            </div>
            <input 
              type="range" min="10" max="60" step="1"
              value={config.fontSize}
              onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-white">Letter Spacing</label>
              <span className="text-[10px] font-bold text-white">{config.letterSpacing || 0}px</span>
            </div>
            <input 
              type="range" min="-5" max="20" step="0.5"
              value={config.letterSpacing || 0}
              onChange={(e) => onChange({ letterSpacing: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-white">Letter Stretch</label>
              <span className="text-[10px] font-bold text-white">{Math.round(config.letterStretch * 100)}%</span>
            </div>
            <input 
              type="range" min="0.5" max="2" step="0.05"
              value={config.letterStretch}
              onChange={(e) => onChange({ letterStretch: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold text-white">Stretch X</label>
                <span className="text-[10px] font-bold text-white">{Math.round((config.stretchX || 1) * 100)}%</span>
              </div>
              <input 
                type="range" min="0.5" max="2" step="0.05"
                value={config.stretchX || 1}
                onChange={(e) => onChange({ stretchX: parseFloat(e.target.value) })}
                className="w-full h-1 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold text-white">Stretch Y</label>
                <span className="text-[10px] font-bold text-white">{Math.round((config.stretchY || 1) * 100)}%</span>
              </div>
              <input 
                type="range" min="0.5" max="2" step="0.05"
                value={config.stretchY || 1}
                onChange={(e) => onChange({ stretchY: parseFloat(e.target.value) })}
                className="w-full h-1 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0d1117] dark:bg-[#21262d]/50 p-4 rounded-2xl border border-[#21262d] dark:border-[#30363d]">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
           <Sliders size={14} /> Border & Layout
        </h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-white">Border Thickness</label>
              <span className="text-[10px] font-bold text-white">{config.borderWidth}px</span>
            </div>
            <input 
              type="range" min="1" max="15" step="0.5"
              value={config.borderWidth}
              onChange={(e) => onChange({ borderWidth: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-white">Border Style</label>
            <div className="flex bg-[#21262d] dark:bg-[#21262d] p-1 rounded-lg">
              <button
                onClick={() => onChange({ borderStyle: BorderStyle.SINGLE })}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${config.borderStyle === BorderStyle.SINGLE || !config.borderStyle ? 'bg-[#161b22] dark:bg-[#30363d] text-[#58a6ff] shadow-sm' : 'text-[#8b949e]'}`}
              >
                Solid
              </button>
              <button
                onClick={() => onChange({ borderStyle: BorderStyle.DASHED })}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${config.borderStyle === BorderStyle.DASHED ? 'bg-[#161b22] dark:bg-[#30363d] text-[#58a6ff] shadow-sm' : 'text-[#8b949e]'}`}
              >
                Dashed
              </button>
              <button
                onClick={() => onChange({ borderStyle: BorderStyle.DOTTED })}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${config.borderStyle === BorderStyle.DOTTED ? 'bg-[#161b22] dark:bg-[#30363d] text-[#58a6ff] shadow-sm' : 'text-[#8b949e]'}`}
              >
                Dotted
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-white">Border Offset</label>
              <span className="text-[10px] font-bold text-white">{config.borderOffset}px</span>
            </div>
            <input 
              type="range" min="-20" max="50" step="1"
              value={config.borderOffset}
              onChange={(e) => onChange({ borderOffset: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
            />
          </div>

          {/* Double Border Controls */}
          <div className="p-4 bg-[#161b22] dark:bg-[#161b22] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-white uppercase tracking-widest">Double Border</label>
              <input 
                type="checkbox" 
                checked={config.doubleBorder} 
                onChange={(e) => onChange({ doubleBorder: e.target.checked })}
                className="w-4 h-4 rounded text-[#58a6ff] border-[#aaccf2]"
              />
            </div>
            {config.doubleBorder && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-white uppercase">Outer Border</label>
                  <input 
                    type="checkbox" 
                    checked={config.doubleBorderIsOuter} 
                    onChange={(e) => onChange({ doubleBorderIsOuter: e.target.checked })}
                    className="w-3 h-3 rounded text-[#58a6ff] border-[#aaccf2]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <label className="text-[10px] font-bold text-white">Offset</label>
                      <span className="text-[10px] font-bold text-white">{config.doubleBorderOffset}px</span>
                    </div>
                    <input 
                      type="range" min="2" max="20" step="1"
                      value={config.doubleBorderOffset}
                      onChange={(e) => onChange({ doubleBorderOffset: parseInt(e.target.value) })}
                      className="w-full h-1 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <label className="text-[10px] font-bold text-white">Thickness</label>
                      <span className="text-[10px] font-bold text-white">{config.doubleBorderThickness}px</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="10" step="0.5"
                      value={config.doubleBorderThickness}
                      onChange={(e) => onChange({ doubleBorderThickness: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white">Color</label>
                    <div className="flex gap-1 flex-wrap">
                      {COLORS.map(color => (
                        <button
                          key={color.value}
                          onClick={() => onChange({ doubleBorderColor: color.value })}
                          className={`w-4 h-4 rounded-full border transition-all ${config.doubleBorderColor === color.value ? 'border-[#58a6ff] scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color.value }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white">Style</label>
                    <div className="flex bg-[#21262d] dark:bg-[#21262d] p-0.5 rounded-md">
                      <button
                        onClick={() => onChange({ doubleBorderStyle: BorderStyle.SINGLE })}
                        className={`flex-1 py-0.5 text-[9px] font-bold rounded transition-all ${config.doubleBorderStyle === BorderStyle.SINGLE ? 'bg-[#161b22] dark:bg-[#30363d] text-[#58a6ff] shadow-sm' : 'text-[#8b949e]'}`}
                      >
                        Solid
                      </button>
                      <button
                        onClick={() => onChange({ doubleBorderStyle: BorderStyle.DASHED })}
                        className={`flex-1 py-0.5 text-[9px] font-bold rounded transition-all ${config.doubleBorderStyle === BorderStyle.DASHED ? 'bg-[#161b22] dark:bg-[#30363d] text-[#58a6ff] shadow-sm' : 'text-[#8b949e]'}`}
                      >
                        Dash
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#161b22] dark:bg-[#161b22] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-white uppercase tracking-widest">Inner Line</label>
              <input 
                type="checkbox" 
                checked={config.showInnerLine} 
                onChange={(e) => onChange({ showInnerLine: e.target.checked })}
                className="w-4 h-4 rounded text-[#58a6ff] border-[#aaccf2]"
              />
            </div>
            {config.showInnerLine && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold text-white">Offset</label>
                    <span className="text-[10px] font-bold text-white">{config.innerLineOffset}px</span>
                  </div>
                  <input 
                    type="range" min="5" max="50" step="1"
                    value={config.innerLineOffset}
                    onChange={(e) => onChange({ innerLineOffset: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold text-white">Thickness</label>
                    <span className="text-[10px] font-bold text-white">{config.innerLineWidth}px</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="10" step="0.5"
                    value={config.innerLineWidth || 2}
                    onChange={(e) => onChange({ innerLineWidth: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#0d1117] dark:bg-[#21262d]/50 p-4 rounded-2xl border border-[#21262d] dark:border-[#30363d]">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
           <PenTool size={14} /> Status Text (Overlay)
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {['APPROVED', 'RECEIVED', 'PAID', 'URGENT', 'COPY', 'VOID'].map(status => (
              <button
                key={status}
                onClick={() => onChange({ statusText: status })}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${
                  config.statusText === status 
                    ? 'bg-[#1f6feb] text-white border-[#58a6ff]' 
                    : 'bg-[#161b22] dark:bg-[#161b22] text-[#e6edf3] dark:text-[#8b949e] border-[#30363d] dark:border-[#58a6ff] hover:border-[#1a5cad]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={config.statusText}
                onChange={(e) => onChange({ statusText: e.target.value.toUpperCase() })}
                placeholder="CUSTOM STATUS"
                className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-[#1f6feb] font-black italic"
              />
              <input 
                type="color" 
                value={config.statusColor || config.borderColor}
                onChange={(e) => onChange({ statusColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-[#30363d]"
                title="Status Color"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white uppercase">Font</label>
                <select 
                  value={config.statusFontFamily || config.fontFamily}
                  onChange={(e) => onChange({ statusFontFamily: e.target.value })}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-2 py-1 text-[10px] text-white font-bold outline-none"
                >
                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white uppercase">Size</label>
                <div className="flex items-center gap-1">
                  <input 
                    type="number"
                    value={config.statusFontSize || 40}
                    onChange={(e) => onChange({ statusFontSize: parseInt(e.target.value) })}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-2 py-1 text-[10px] text-white font-bold outline-none"
                  />
                  <button
                    onClick={() => onChange({ statusBold: !config.statusBold })}
                    className={`p-1 rounded ${config.statusBold ? 'bg-[#d4e6f9] text-[#58a6ff] dark:bg-blue-900/50 dark:text-blue-400' : 'bg-[#21262d] text-[#8b949e] dark:bg-[#21262d] dark:text-[#8b949e]'}`}
                    title="Bold"
                  >
                    <b className="text-[10px] font-serif">B</b>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0d1117] dark:bg-[#21262d]/50 p-4 rounded-2xl border border-[#21262d] dark:border-[#30363d]">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
           <Type size={14} /> Text Content & Styling
        </h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-white">Main Header</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={config.primaryColor || config.borderColor}
                  onChange={(e) => onChange({ primaryColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-[#30363d]"
                  title="Text Color"
                />
                <div className="flex items-center gap-1 bg-[#21262d] dark:bg-[#21262d] px-1.5 py-0.5 rounded">
                  <span className="text-[8px] font-bold text-white uppercase">Size</span>
                  <input 
                    type="number"
                    value={config.primaryFontSize || config.fontSize}
                    onChange={(e) => onChange({ primaryFontSize: parseInt(e.target.value) })}
                    className="w-8 bg-transparent text-[10px] font-bold outline-none"
                  />
                </div>
                <button
                  onClick={() => onChange({ primaryBold: !config.primaryBold })}
                  className={`p-1 rounded ${config.primaryBold ? 'bg-[#d4e6f9] text-[#58a6ff] dark:bg-blue-900/50 dark:text-blue-400' : 'bg-[#21262d] text-[#8b949e] dark:bg-[#21262d] dark:text-[#8b949e]'}`}
                  title="Bold"
                >
                  <b className="text-[10px] font-serif">B</b>
                </button>
                <select 
                  value={config.primaryFontFamily || config.fontFamily}
                  onChange={(e) => onChange({ primaryFontFamily: e.target.value })}
                  className="text-[10px] bg-[#161b22] border border-[#30363d] rounded px-1 py-0.5 text-white font-bold outline-none"
                >
                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <input 
              type="text"
              value={config.primaryText}
              onChange={(e) => onChange({ primaryText: e.target.value.toUpperCase() })}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-[#1f6feb] font-medium"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-white">Sub Header (Bottom)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={config.secondaryColor || config.borderColor}
                  onChange={(e) => onChange({ secondaryColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-[#30363d]"
                  title="Text Color"
                />
                <div className="flex items-center gap-1 bg-[#21262d] dark:bg-[#21262d] px-1.5 py-0.5 rounded">
                  <span className="text-[8px] font-bold text-white uppercase">Size</span>
                  <input 
                    type="number"
                    value={config.secondaryFontSize || Math.round(config.fontSize * 0.75)}
                    onChange={(e) => onChange({ secondaryFontSize: parseInt(e.target.value) })}
                    className="w-8 bg-transparent text-[10px] font-bold outline-none"
                  />
                </div>
                <button
                  onClick={() => onChange({ secondaryBold: !config.secondaryBold })}
                  className={`p-1 rounded ${config.secondaryBold ? 'bg-[#d4e6f9] text-[#58a6ff] dark:bg-blue-900/50 dark:text-blue-400' : 'bg-[#21262d] text-[#8b949e] dark:bg-[#21262d] dark:text-[#8b949e]'}`}
                  title="Bold"
                >
                  <b className="text-[10px] font-serif">B</b>
                </button>
                <select 
                  value={config.secondaryFontFamily || config.fontFamily}
                  onChange={(e) => onChange({ secondaryFontFamily: e.target.value })}
                  className="text-[10px] bg-[#161b22] border border-[#30363d] rounded px-1 py-0.5 text-white font-bold outline-none"
                >
                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <input 
              type="text"
              value={config.secondaryText}
              onChange={(e) => onChange({ secondaryText: e.target.value.toUpperCase() })}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-[#1f6feb] font-medium"
            />
          </div>

          <div className="p-4 bg-[#161b22] dark:bg-[#161b22] rounded-2xl space-y-4">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Inner Text Customization</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-white uppercase">Inner Top</label>
                  <div className="flex items-center gap-1">
                    <input 
                      type="color" 
                      value={config.innerTopColor || config.innerTextColor || config.borderColor}
                      onChange={(e) => onChange({ innerTopColor: e.target.value })}
                      className="w-4 h-4 rounded cursor-pointer border border-[#30363d]"
                      title="Text Color"
                    />
                    <input 
                      type="number"
                      value={config.innerTopFontSize || config.innerTextSize || Math.round(config.fontSize * 0.55)}
                      onChange={(e) => onChange({ innerTopFontSize: parseInt(e.target.value) })}
                      className="w-6 bg-transparent text-[8px] font-bold outline-none border-b border-[#30363d]"
                    />
                    <button
                      onClick={() => onChange({ innerTopBold: !config.innerTopBold })}
                      className={`p-0.5 rounded ${config.innerTopBold ? 'bg-[#d4e6f9] text-[#58a6ff] dark:bg-blue-900/50 dark:text-blue-400' : 'bg-[#21262d] text-[#8b949e] dark:bg-[#21262d] dark:text-[#8b949e]'}`}
                      title="Bold"
                    >
                      <b className="text-[8px] font-serif">B</b>
                    </button>
                    <select 
                      value={config.innerTopFontFamily || config.fontFamily}
                      onChange={(e) => onChange({ innerTopFontFamily: e.target.value })}
                      className="text-[8px] bg-[#161b22] border border-[#30363d] rounded px-1 py-0.5 text-white font-bold outline-none"
                    >
                      {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                    </select>
                  </div>
                </div>
                <input 
                  type="text"
                  value={config.innerTopText}
                  onChange={(e) => onChange({ innerTopText: e.target.value.toUpperCase() })}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white font-bold outline-none focus:ring-2 focus:ring-[#1f6feb]"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-white uppercase">Inner Bottom</label>
                  <div className="flex items-center gap-1">
                    <input 
                      type="color" 
                      value={config.innerBottomColor || config.innerTextColor || config.borderColor}
                      onChange={(e) => onChange({ innerBottomColor: e.target.value })}
                      className="w-4 h-4 rounded cursor-pointer border border-[#30363d]"
                      title="Text Color"
                    />
                    <input 
                      type="number"
                      value={config.innerBottomFontSize || config.innerTextSize || Math.round(config.fontSize * 0.55)}
                      onChange={(e) => onChange({ innerBottomFontSize: parseInt(e.target.value) })}
                      className="w-6 bg-transparent text-[8px] font-bold outline-none border-b border-[#30363d]"
                    />
                    <button
                      onClick={() => onChange({ innerBottomBold: !config.innerBottomBold })}
                      className={`p-0.5 rounded ${config.innerBottomBold ? 'bg-[#d4e6f9] text-[#58a6ff] dark:bg-blue-900/50 dark:text-blue-400' : 'bg-[#21262d] text-[#8b949e] dark:bg-[#21262d] dark:text-[#8b949e]'}`}
                      title="Bold"
                    >
                      <b className="text-[8px] font-serif">B</b>
                    </button>
                    <select 
                      value={config.innerBottomFontFamily || config.fontFamily}
                      onChange={(e) => onChange({ innerBottomFontFamily: e.target.value })}
                      className="text-[8px] bg-[#161b22] border border-[#30363d] rounded px-1 py-0.5 text-white font-bold outline-none"
                    >
                      {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                    </select>
                  </div>
                </div>
                <input 
                  type="text"
                  value={config.innerBottomText}
                  onChange={(e) => onChange({ innerBottomText: e.target.value.toUpperCase() })}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white font-bold outline-none focus:ring-2 focus:ring-[#1f6feb]"
                />
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">Inner Text Color</label>
                <input 
                  type="color" 
                  value={config.innerTextColor || config.borderColor}
                  onChange={(e) => onChange({ innerTextColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-white">Inner Text Size</label>
                  <span className="text-[10px] font-bold text-white">{config.innerTextSize}px</span>
                </div>
                <input 
                  type="range" min="8" max="40" step="1"
                  value={config.innerTextSize || 14}
                  onChange={(e) => onChange({ innerTextSize: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-white">Inner Text Intensity</label>
                  <span className="text-[10px] font-bold text-white">{Math.round((config.innerTextIntensity || 1) * 100)}%</span>
                </div>
                <input 
                  type="range" min="0.1" max="1" step="0.05"
                  value={config.innerTextIntensity || 1}
                  onChange={(e) => onChange({ innerTextIntensity: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-white">Center Text (Primary)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={config.centerColor || config.secondaryColor || config.borderColor}
                  onChange={(e) => onChange({ centerColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-[#30363d]"
                  title="Text Color"
                />
                <div className="flex items-center gap-1 bg-[#21262d] dark:bg-[#21262d] px-1.5 py-0.5 rounded">
                  <span className="text-[8px] font-bold text-white uppercase">Size</span>
                  <input 
                    type="number"
                    value={config.centerFontSize || Math.round(config.fontSize * 1.1)}
                    onChange={(e) => onChange({ centerFontSize: parseInt(e.target.value) })}
                    className="w-8 bg-transparent text-[10px] font-bold outline-none"
                  />
                </div>
                <button
                  onClick={() => onChange({ centerBold: !config.centerBold })}
                  className={`p-1 rounded ${config.centerBold ? 'bg-[#d4e6f9] text-[#58a6ff] dark:bg-blue-900/50 dark:text-blue-400' : 'bg-[#21262d] text-[#8b949e] dark:bg-[#21262d] dark:text-[#8b949e]'}`}
                  title="Bold"
                >
                  <b className="text-[10px] font-serif">B</b>
                </button>
                <select 
                  value={config.centerFontFamily || config.fontFamily}
                  onChange={(e) => onChange({ centerFontFamily: e.target.value })}
                  className="text-[10px] bg-[#161b22] border border-[#30363d] rounded px-1 py-0.5 text-white font-bold outline-none"
                >
                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                </select>
                <div className="flex items-center gap-1 bg-[#21262d] dark:bg-blue-900/30 px-3 py-1.5 rounded-xl cursor-pointer relative group border border-[#d4e6f9] dark:border-blue-800 hover:bg-[#d4e6f9] transition-all">
                  <Calendar size={14} className="text-[#58a6ff]" />
                  <span className="text-[10px] font-black uppercase text-[#58a6ff]">Pick Date</span>
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
              placeholder="CENTER TEXT"
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-[#1f6feb] font-bold"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-white uppercase">Center Sub-Text (Date Line)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={config.centerSubColor || config.secondaryColor || config.borderColor}
                  onChange={(e) => onChange({ centerSubColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-[#30363d]"
                  title="Text Color"
                />
                <div className="flex items-center gap-1 bg-[#21262d] dark:bg-[#21262d] px-1.5 py-0.5 rounded">
                  <span className="text-[8px] font-bold text-white uppercase">Size</span>
                  <input 
                    type="number"
                    value={config.centerSubFontSize || Math.round(config.fontSize * 0.8)}
                    onChange={(e) => onChange({ centerSubFontSize: parseInt(e.target.value) })}
                    className="w-8 bg-transparent text-[10px] font-bold outline-none"
                  />
                </div>
                <button
                  onClick={() => onChange({ centerSubBold: !config.centerSubBold })}
                  className={`p-1 rounded ${config.centerSubBold ? 'bg-[#d4e6f9] text-[#58a6ff] dark:bg-blue-900/50 dark:text-blue-400' : 'bg-[#21262d] text-[#8b949e] dark:bg-[#21262d] dark:text-[#8b949e]'}`}
                  title="Bold"
                >
                  <b className="text-[10px] font-serif">B</b>
                </button>
                <select 
                  value={config.centerSubFontFamily || config.fontFamily}
                  onChange={(e) => onChange({ centerSubFontFamily: e.target.value })}
                  className="text-[10px] bg-[#161b22] border border-[#30363d] rounded px-1 py-0.5 text-white font-bold outline-none"
                >
                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <input 
              type="text"
              value={config.centerSubText}
              onChange={(e) => onChange({ centerSubText: e.target.value.toUpperCase() })}
              placeholder="DATE LINE TEXT"
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-[#1f6feb] font-bold"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#0d1117] dark:bg-[#21262d]/50 p-4 rounded-2xl border border-[#21262d] dark:border-[#30363d]">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
           <Star size={14} /> Embellishments & Stars
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#161b22] dark:bg-[#161b22] rounded-2xl border border-[#21262d] dark:border-[#30363d]">
            <div className="flex items-center gap-3">
              <Star size={18} className="text-yellow-500" />
              <span className="text-sm font-bold">Show Stars</span>
            </div>
            <input 
              type="checkbox" 
              checked={config.showStars} 
              onChange={(e) => onChange({ showStars: e.target.checked })}
              className="w-5 h-5 rounded text-yellow-500 border-[#aaccf2]"
            />
          </div>

          {config.showStars && (
            <div className="p-4 bg-[#161b22] dark:bg-[#161b22] rounded-2xl space-y-4 border border-[#21262d] dark:border-[#30363d]">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-white">Star Count</label>
                  <span className="text-[10px] font-bold text-white">{config.starCount || 2}</span>
                </div>
                <input 
                  type="range" min="1" max="10" step="1"
                  value={config.starCount || 2}
                  onChange={(e) => onChange({ starCount: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-white">Star Size</label>
                  <span className="text-[10px] font-bold text-white">{config.starSize || 20}px</span>
                </div>
                <input 
                  type="range" min="5" max="50" step="1"
                  value={config.starSize || 20}
                  onChange={(e) => onChange({ starSize: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-white">Star Offset (Alignment)</label>
                  <span className="text-[10px] font-bold text-white">{config.starOffset || 0}px</span>
                </div>
                <input 
                  type="range" min="-50" max="50" step="1"
                  value={config.starOffset || 0}
                  onChange={(e) => onChange({ starOffset: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#0d1117] dark:bg-[#21262d]/50 p-4 rounded-2xl border border-[#21262d] dark:border-[#30363d]">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
           <Zap size={14} /> Shadow & Depth
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-[#161b22] dark:bg-[#161b22] rounded-xl border border-[#21262d] dark:border-[#30363d]">
            <span className="text-xs font-bold">Enable Shadow</span>
            <input 
              type="checkbox" 
              checked={config.showShadow || false} 
              onChange={(e) => onChange({ showShadow: e.target.checked })}
              className="w-4 h-4 rounded text-[#58a6ff] border-[#aaccf2]"
            />
          </div>
          {config.showShadow && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white uppercase">Color</label>
                  <input 
                    type="color" 
                    value={config.shadowColor || '#000000'}
                    onChange={(e) => onChange({ shadowColor: e.target.value })}
                    className="w-full h-8 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white uppercase">Blur</label>
                  <input 
                    type="range" min="0" max="20" step="1"
                    value={config.shadowBlur || 5}
                    onChange={(e) => onChange({ shadowBlur: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white uppercase">Offset X</label>
                  <input 
                    type="range" min="-20" max="20" step="1"
                    value={config.shadowOffsetX || 2}
                    onChange={(e) => onChange({ shadowOffsetX: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white uppercase">Offset Y</label>
                  <input 
                    type="range" min="-20" max="20" step="1"
                    value={config.shadowOffsetY || 2}
                    onChange={(e) => onChange({ shadowOffsetY: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#0d1117] dark:bg-[#21262d]/50 p-4 rounded-2xl border border-[#21262d] dark:border-[#30363d]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
             <Plus size={14} /> Custom Elements
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => addCustomElement('text')}
              className="p-1.5 bg-[#21262d] dark:bg-blue-900/30 text-[#58a6ff] rounded-lg hover:bg-[#d4e6f9] transition-all"
              title="Add Text"
            >
              <Type size={14} />
            </button>
            <button 
              onClick={() => addCustomElement('image')}
              className="p-1.5 bg-[#21262d] dark:bg-blue-900/30 text-[#58a6ff] rounded-lg hover:bg-[#d4e6f9] transition-all"
              title="Add Image"
            >
              <ImageIcon size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {config.customElements.map((el) => (
            <div key={el.id} className="p-3 bg-[#161b22] dark:bg-[#161b22] rounded-xl border border-[#21262d] dark:border-[#30363d] space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {el.type === 'text' ? <Type size={12} className="text-[#8b949e]" /> : <ImageIcon size={12} className="text-[#8b949e]" />}
                  <span className="text-[10px] font-bold text-white uppercase">{el.type} Element</span>
                </div>
                <button 
                  onClick={() => removeCustomElement(el.id)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {el.type === 'text' ? (
                <div className="space-y-2">
                  <input 
                    type="text"
                    value={el.content}
                    onChange={(e) => updateCustomElement(el.id, { content: e.target.value })}
                    className="w-full bg-[#0d1117] dark:bg-[#21262d] border border-[#21262d] dark:border-[#58a6ff] rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#1f6feb]"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select 
                      value={el.fontFamily || config.fontFamily}
                      onChange={(e) => updateCustomElement(el.id, { fontFamily: e.target.value })}
                      className="text-[10px] bg-[#0d1117] dark:bg-[#21262d] border border-[#21262d] dark:border-[#58a6ff] rounded px-1 py-1 outline-none"
                    >
                      {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                    </select>
                    <div className="flex items-center gap-1 bg-[#0d1117] dark:bg-[#21262d] px-2 py-1 rounded border border-[#21262d] dark:border-[#58a6ff]">
                      <span className="text-[8px] font-bold text-white uppercase">Scale</span>
                      <input 
                        type="number" step="0.1"
                        value={el.scale || 1}
                        onChange={(e) => updateCustomElement(el.id, { scale: parseFloat(e.target.value) })}
                        className="w-8 bg-transparent text-[10px] font-bold outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 pt-1 border-t border-[#21262d] dark:border-[#30363d]">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={el.isCurved || false} 
                        onChange={(e) => updateCustomElement(el.id, { isCurved: e.target.checked })}
                        className="w-3 h-3 rounded text-[#58a6ff] border-[#aaccf2]"
                      />
                      <span className="text-[9px] font-bold text-[#8b949e] group-hover:text-[#58a6ff] transition-colors uppercase">Curved Text</span>
                    </label>
                    {el.isCurved && (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-[9px] font-bold text-white uppercase">Curve Radius</label>
                          <span className="text-[9px] font-bold text-white">{el.curveRadius || 100}px</span>
                        </div>
                        <input 
                          type="range" min="20" max="300" step="1"
                          value={el.curveRadius || 100}
                          onChange={(e) => updateCustomElement(el.id, { curveRadius: parseInt(e.target.value) })}
                          className="w-full h-1 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input 
                        type="file" accept="image/*"
                        onChange={(e) => handleImageUpload(el.id, e)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="bg-[#0d1117] dark:bg-[#21262d] border border-dashed border-[#30363d] dark:border-[#58a6ff] rounded-lg py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-white">
                        <ImageIcon size={12} /> Replace Image
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-[#0d1117] dark:bg-[#21262d] px-2 py-1 rounded border border-[#21262d] dark:border-[#58a6ff]">
                      <span className="text-[8px] font-bold text-white uppercase">Scale</span>
                      <input 
                        type="number" step="0.1"
                        value={el.scale || 1}
                        onChange={(e) => updateCustomElement(el.id, { scale: parseFloat(e.target.value) })}
                        className="w-8 bg-transparent text-[10px] font-bold outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[9px] font-bold text-white uppercase">B&W Filter</label>
                    <input 
                      type="checkbox" 
                      checked={el.isBlackAndWhite || false}
                      onChange={(e) => updateCustomElement(el.id, { isBlackAndWhite: e.target.checked })}
                      className="w-3 h-3 rounded text-[#58a6ff]"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[9px] font-bold text-white uppercase">Rotation</label>
                    <span className="text-[9px] font-bold text-white">{el.rotation || 0}°</span>
                  </div>
                  <input 
                    type="range" min="0" max="360" step="1"
                    value={el.rotation || 0}
                    onChange={(e) => updateCustomElement(el.id, { rotation: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[9px] font-bold text-white uppercase">Opacity</label>
                    <span className="text-[9px] font-bold text-white">{Math.round((el.opacity || 1) * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="1" step="0.05"
                    value={el.opacity || 1}
                    onChange={(e) => updateCustomElement(el.id, { opacity: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
                  />
                </div>
              </div>
              <div className="space-y-1 pt-1 border-t border-[#21262d] dark:border-[#30363d]">
                <label className="text-[9px] font-bold text-white uppercase">Custom Color</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={el.color || config.borderColor}
                    onChange={(e) => updateCustomElement(el.id, { color: e.target.value })}
                    className="w-6 h-6 rounded-md cursor-pointer border-none p-0"
                  />
                  <button 
                    onClick={() => updateCustomElement(el.id, { color: undefined })}
                    className="text-[8px] font-bold text-[#58a6ff] uppercase hover:underline"
                  >
                    Reset to Stamp Color
                  </button>
                </div>
              </div>
            </div>
          ))}
          {config.customElements.length === 0 && (
            <div className="text-center py-6 border-2 border-dashed border-[#21262d] dark:border-[#30363d] rounded-2xl">
              <p className="text-[10px] font-bold text-white uppercase">No custom elements added</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#0d1117] dark:bg-[#21262d]/50 p-4 rounded-2xl border border-[#21262d] dark:border-[#30363d]">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
           <Sliders size={14} /> Rubber Stamp Effects
        </h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-white">Rustness / Distress</label>
              <span className="text-[10px] font-bold text-white">{Math.round(config.distressLevel * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.05"
              value={config.distressLevel}
              onChange={(e) => onChange({ distressLevel: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 bg-[#161b22] dark:bg-[#161b22] rounded-xl cursor-pointer hover:bg-[#0d1117] dark:hover:bg-[#21262d] transition-all border border-[#30363d] dark:border-[#58a6ff]">
              <input 
                type="checkbox" 
                checked={config.isVintage} 
                onChange={(e) => onChange({ isVintage: e.target.checked })}
                className="w-4 h-4 rounded text-white border-[#aaccf2]"
              />
              <span className="text-[10px] font-bold text-white uppercase">Vintage</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-[#161b22] dark:bg-[#161b22] rounded-xl cursor-pointer hover:bg-[#0d1117] dark:hover:bg-[#21262d] transition-all border border-[#30363d] dark:border-[#58a6ff]">
              <input 
                type="checkbox" 
                checked={config.wetInk} 
                onChange={(e) => onChange({ wetInk: e.target.checked })}
                className="w-4 h-4 rounded text-[#58a6ff] border-[#aaccf2]"
              />
              <span className="text-[10px] font-bold text-white uppercase">Wet Ink</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 bg-[#161b22] dark:bg-[#161b22] rounded-xl cursor-pointer hover:bg-[#0d1117] dark:hover:bg-[#21262d] transition-all border border-[#30363d] dark:border-[#58a6ff]">
              <input 
                type="checkbox" 
                checked={config.showDateLine} 
                onChange={(e) => onChange({ showDateLine: e.target.checked })}
                className="w-4 h-4 rounded text-[#58a6ff] border-[#aaccf2]"
              />
              <span className="text-[10px] font-bold text-white uppercase">Date Line</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-[#161b22] dark:bg-[#161b22] rounded-xl cursor-pointer hover:bg-[#0d1117] dark:hover:bg-[#21262d] transition-all border border-[#30363d] dark:border-[#58a6ff]">
              <input 
                type="checkbox" 
                checked={config.showSignatureLine} 
                onChange={(e) => onChange({ showSignatureLine: e.target.checked })}
                className="w-4 h-4 rounded text-[#58a6ff] border-[#aaccf2]"
              />
              <span className="text-[10px] font-bold text-white uppercase">Sign Line</span>
            </label>
          </div>

          {config.showSignatureLine && (
            <div className="p-4 bg-[#21262d] dark:bg-[#21262d] rounded-2xl border border-[#d4e6f9] dark:border-blue-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-[#58a6ff] dark:text-blue-400 uppercase tracking-widest">Embed Signature</label>
                <input 
                  type="checkbox" 
                  checked={config.showEmbeddedSignature} 
                  onChange={(e) => onChange({ showEmbeddedSignature: e.target.checked })}
                  className="w-4 h-4 rounded text-[#58a6ff] border-[#aaccf2]"
                />
              </div>
              {config.showEmbeddedSignature && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowSignPad(true)}
                    className="flex-1 bg-[#161b22] dark:bg-[#21262d] border border-[#aaccf2] dark:border-blue-800 text-[#58a6ff] dark:text-blue-400 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-[#21262d] dark:hover:bg-blue-900/30 transition-all"
                  >
                    <PenTool size={12} /> Draw
                  </button>
                  <div className="flex-1 relative">
                    <button className="w-full bg-[#161b22] dark:bg-[#21262d] border border-[#aaccf2] dark:border-blue-800 text-[#58a6ff] dark:text-blue-400 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-[#21262d] dark:hover:bg-blue-900/30 transition-all">
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
                <div className="space-y-3">
                  <div className="relative group">
                    <img src={config.embeddedSignatureUrl} className="w-full h-16 object-contain bg-[#161b22] dark:bg-[#161b22] rounded-xl border border-[#d4e6f9] dark:border-blue-800 p-2" alt="Signature" />
                    <button 
                      onClick={() => onChange({ embeddedSignatureUrl: null })}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-white uppercase">X Off</label>
                      <input 
                        type="number"
                        value={config.signatureX}
                        onChange={(e) => onChange({ signatureX: parseInt(e.target.value) })}
                        className="w-full bg-[#161b22] border border-[#30363d] rounded px-1 py-0.5 text-[10px] text-white font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-white uppercase">Y Off</label>
                      <input 
                        type="number"
                        value={config.signatureY}
                        onChange={(e) => onChange({ signatureY: parseInt(e.target.value) })}
                        className="w-full bg-[#161b22] border border-[#30363d] rounded px-1 py-0.5 text-[10px] text-white font-bold outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <label className="text-[8px] font-bold text-white uppercase">Scale</label>
                      <span className="text-[8px] font-bold text-[#8b949e]">{config.signatureScale.toFixed(2)}x</span>
                    </div>
                    <input 
                      type="range" min="0.1" max="3" step="0.05"
                      value={config.signatureScale}
                      onChange={(e) => onChange({ signatureScale: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-[#30363d] dark:bg-[#30363d] rounded-lg appearance-none cursor-pointer accent-[#1f6feb]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>



      {!config.isVintage && (
        <section className="bg-[#0d1117] dark:bg-[#21262d]/50 p-4 rounded-2xl border border-[#21262d] dark:border-[#30363d]">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
             <Eye size={14} /> Preview Background
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'default', label: 'Default', icon: MousePointer },
              { id: 'white', label: 'White', icon: ImageIcon },
              { id: 'paper', label: 'Paper', icon: FileText },
              { id: 'transparent', label: 'Transp', icon: EyeOff }
            ].map((bg) => (
              <button
                key={bg.id}
                onClick={() => onChange({ previewBg: bg.id as any })}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                  config.previewBg === bg.id 
                    ? 'bg-[#1f6feb] text-white border-[#58a6ff] shadow-lg shadow-[#c5d8ef]' 
                    : 'bg-[#161b22] dark:bg-[#161b22] text-[#8b949e] border-[#21262d] dark:border-[#30363d] hover:border-[#aaccf2]'
                }`}
              >
                <bg.icon size={14} />
                <span className="text-[8px] font-black uppercase">{bg.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {!config.isVintage && (
        <section>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Color Themes</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">Main Ink Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onChange({ borderColor: c.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${config.borderColor === c.value ? 'ring-2 ring-[#1f6feb] ring-offset-2 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {showSignPad && (
        <div className="fixed inset-0 bg-[#161b22]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <SignaturePad 
            onSave={(url) => {
              onChange({ embeddedSignatureUrl: url });
              setShowSignPad(false);
            }}
            onCancel={() => setShowSignPad(false)}
          />
        </div>
      )}

      <div className="p-4 bg-[#161b22] dark:bg-[#161b22] rounded-2xl space-y-3">
        <label className="text-[10px] font-black text-white uppercase tracking-widest">Drag Axis Lock</label>
        <div className="flex bg-[#21262d] dark:bg-[#21262d] p-1 rounded-lg">
          <button
            onClick={() => onChange({ lockDragAxis: 'none' })}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${config.lockDragAxis === 'none' ? 'bg-[#161b22] dark:bg-[#30363d] text-[#58a6ff] shadow-sm' : 'text-[#8b949e]'}`}
          >
            Free
          </button>
          <button
            onClick={() => onChange({ lockDragAxis: 'horizontal' })}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${config.lockDragAxis === 'horizontal' ? 'bg-[#161b22] dark:bg-[#30363d] text-[#58a6ff] shadow-sm' : 'text-[#8b949e]'}`}
          >
            Horizontal
          </button>
          <button
            onClick={() => onChange({ lockDragAxis: 'vertical' })}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${config.lockDragAxis === 'vertical' ? 'bg-[#161b22] dark:bg-[#30363d] text-[#58a6ff] shadow-sm' : 'text-[#8b949e]'}`}
          >
            Vertical
          </button>
        </div>
      </div>

      {onSaveTemplate && (
        <button 
          onClick={onSaveTemplate}
          disabled={!isLoggedIn}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs ${
            isLoggedIn 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-none' 
              : 'bg-[#30363d] text-[#8b949e] cursor-not-allowed'
          }`}
        >
          <Save size={14} /> {isLoggedIn ? 'Save as Template' : 'Login to Save Template'}
        </button>
      )}
    </div>
  );
};

export default EditorControls;
