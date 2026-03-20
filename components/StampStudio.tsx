import React, { useRef, useState } from 'react';
import { useStampStore } from '../src/store';
import SVGPreview from './SVGPreview';
import { StampConfig, StampShape, BorderStyle } from '../types';
import { COLORS, FONTS } from '../constants';
import {
  X, Download, ChevronDown, ChevronUp, PenTool, Type, Palette,
  Sparkles, Eye, ImageIcon as Img, RotateCcw, Circle, Square,
  RectangleHorizontal, Check, Eraser
} from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';

/* ── Signature Pad ──────────────────────────────── */
const SignaturePad = ({ onSave, onCancel }: { onSave:(u:string)=>void; onCancel:()=>void }) => {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const getPos = (e: any, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  };
  React.useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (ctx) { ctx.strokeStyle = '#041628'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; }
  }, []);
  const start = (e: any) => {
    drawing.current = true;
    const c = ref.current!; const ctx = c.getContext('2d')!;
    const { x, y } = getPos(e, c);
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const move = (e: any) => {
    if (!drawing.current) return;
    const c = ref.current!; const ctx = c.getContext('2d')!;
    const { x, y } = getPos(e, c);
    ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
  };
  const stop = () => { drawing.current = false; };
  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161b22] rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-[#30363d]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-white">Draw your signature</h4>
          <button onClick={onCancel} className="p-1 hover:bg-[#21262d] rounded-full"><X size={16} /></button>
        </div>
        <div className="border-2 border-dashed border-[#aaccf2] rounded-xl overflow-hidden mb-4 bg-[#0d1117] touch-none">
          <canvas ref={ref} width={340} height={160}
            onMouseDown={start} onMouseUp={stop} onMouseMove={move}
            onTouchStart={start} onTouchEnd={stop} onTouchMove={move}
            className="w-full cursor-crosshair" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => { const c = ref.current; c?.getContext('2d')?.clearRect(0,0,c.width,c.height); }}
            className="flex-1 py-2 border border-[#30363d] rounded-xl text-sm font-medium text-[#e6edf3] hover:bg-[#0d1117] flex items-center justify-center gap-1">
            <Eraser size={14} /> Clear
          </button>
          <button onClick={() => { if (ref.current) onSave(ref.current.toDataURL('image/png')); }}
            className="flex-1 py-2 bg-[#1f6feb] text-white rounded-xl text-sm font-medium hover:bg-[#30363d] flex items-center justify-center gap-1">
            <Check size={14} /> Apply
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Accordion Section ──────────────────────────── */
const Section = ({ title, icon, children, defaultOpen = false }: { title:string; icon:React.ReactNode; children:React.ReactNode; defaultOpen?:boolean }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border border-[#30363d] rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1117] hover:bg-[#e1edf9] transition-colors">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <span className="text-[#58a6ff]">{icon}</span>{title}
        </div>
        {open ? <ChevronUp size={16} className="text-[#e6edf3]" /> : <ChevronDown size={16} className="text-[#e6edf3]" />}
      </button>
      {open && <div className="p-4 bg-[#161b22] space-y-4">{children}</div>}
    </div>
  );
};

/* ── Slider ─────────────────────────────────────── */
const Slider = ({ label, value, min, max, step = 1, unit = '', onChange }: { label:string; value:number; min:number; max:number; step?:number; unit?:string; onChange:(v:number)=>void }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-xs text-[#8b949e] font-medium">{label}</span>
      <span className="text-xs font-semibold text-[#58a6ff]">{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#134589' }} />
  </div>
);

/* ── Toggle ─────────────────────────────────────── */
const Toggle = ({ label, value, onChange }: { label:string; value:boolean; onChange:(v:boolean)=>void }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-[#8b949e] font-medium">{label}</span>
    <button onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-all ${value ? 'bg-[#1f6feb]' : 'bg-[#30363d]'}`}>
      <span className={`block w-4 h-4 bg-[#161b22] rounded-full shadow transition-transform mx-0.5 ${value ? 'translate-x-5' : ''}`} />
    </button>
  </div>
);

/* ── Color Dot ──────────────────────────────────── */
const ColorDot = ({ color, active, onClick }: { color:string; active:boolean; onClick:()=>void }) => (
  <button onClick={onClick}
    className={`w-7 h-7 rounded-full border-2 transition-all ${active ? 'ring-2 ring-[#1f6feb] ring-offset-2 scale-110' : 'border-transparent hover:scale-105'}`}
    style={{ backgroundColor: color }} />
);

/* ── StampStudio ────────────────────────────────── */
interface Props { onClose:()=>void; onApply?:(s:string)=>void; }

const StampStudio: React.FC<Props> = ({ onClose, onApply }) => {
  const { config, setConfig } = useStampStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [showSignPad, setShowSignPad] = useState(false);
  const [textTab, setTextTab] = useState<'primary'|'secondary'|'inner'|'center'>('primary');
  const upd = (u: Partial<StampConfig>) => setConfig(u);

  const exportPNG = () => {
    if (!svgRef.current) return;
    const svg = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, 600, 600); const a = document.createElement('a'); a.download='tomo-stamp.png'; a.href=canvas.toDataURL('image/png'); a.click(); };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  };

  const apply = () => {
    if (onApply && svgRef.current) {
      const svg = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600;
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, 600, 600); onApply(canvas.toDataURL('image/png')); onClose(); };
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    } else onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-[#0d1117] rounded-3xl shadow-2xl w-full max-w-6xl h-[94vh] flex flex-col overflow-hidden border border-[#30363d]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#161b22] text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1f6feb] flex items-center justify-center"><PenTool size={18} /></div>
            <div>
              <h2 className="font-bold text-base leading-tight">Stamp Designer</h2>
              <p className="text-xs text-[#8b949e]">Design your professional stamp</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportPNG} className="flex items-center gap-2 px-4 py-2 bg-[#30363d] hover:bg-[#1f6feb] rounded-xl text-sm font-medium transition-colors">
              <Download size={15} /> Export PNG
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#30363d] hover:bg-[#1f6feb] transition-colors"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Controls */}
          <div className="w-80 flex-shrink-0 overflow-y-auto bg-[#21262d] border-r border-[#30363d] p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>

            {/* Shape */}
            <Section title="Shape & Size" icon={<Circle size={15} />} defaultOpen>
              <div>
                <p className="text-xs text-[#8b949e] font-medium mb-2">Stamp Shape</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { v: StampShape.ROUND, label: 'Round' },
                    { v: StampShape.OVAL, label: 'Oval' },
                    { v: StampShape.RECTANGLE, label: 'Rect' },
                    { v: StampShape.SQUARE, label: 'Square' },
                  ].map(s => (
                    <button key={s.v} onClick={() => upd({ shape: s.v })}
                      className={`py-2 rounded-xl border text-xs font-medium transition-all ${config.shape === s.v ? 'bg-[#1f6feb] text-white border-[#58a6ff]' : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-[#58a6ff]'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <Slider label="Width" value={config.width} min={150} max={600} onChange={v => upd({ width: v })} unit="px" />
              <Slider label="Height" value={config.height} min={100} max={600} onChange={v => upd({ height: v })} unit="px" />
              <Slider label="Rotation" value={config.rotation} min={0} max={360} onChange={v => upd({ rotation: v })} unit="°" />
            </Section>

            {/* Text */}
            <Section title="Text Content" icon={<Type size={15} />} defaultOpen>
              <div className="flex gap-1 bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
                {(['primary','secondary','inner','center'] as const).map(t => (
                  <button key={t} onClick={() => setTextTab(t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${textTab === t ? 'bg-[#1f6feb] text-white shadow-sm' : 'text-[#8b949e] hover:text-white'}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {textTab === 'primary' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#8b949e] font-medium block mb-1">Primary Text</label>
                    <input value={config.primaryText} onChange={e => upd({ primaryText: e.target.value })}
                      className="w-full border border-[#30363d] rounded-xl px-3 py-2 text-sm bg-[#161b22] text-white focus:outline-none focus:ring-2 focus:ring-[#1f6feb]" />
                  </div>
                  <Slider label="Font Size" value={config.primaryFontSize || 16} min={8} max={48} onChange={v => upd({ primaryFontSize: v })} unit="px" />
                  <Toggle label="Bold" value={!!config.primaryBold} onChange={v => upd({ primaryBold: v })} />
                  <div>
                    <label className="text-xs text-[#8b949e] font-medium block mb-1">Font</label>
                    <select value={config.primaryFontFamily || config.fontFamily} onChange={e => upd({ primaryFontFamily: e.target.value })}
                      className="w-full border border-[#30363d] rounded-xl px-3 py-2 text-sm bg-[#161b22] text-white focus:outline-none focus:ring-2 focus:ring-[#1f6feb]">
                      {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#8b949e] font-medium block mb-1.5">Color</label>
                    <div className="flex gap-1.5 flex-wrap">{COLORS.map(c => <ColorDot key={c.value} color={c.value} active={config.primaryColor === c.value} onClick={() => upd({ primaryColor: c.value })} />)}</div>
                  </div>
                </div>
              )}
              {textTab === 'secondary' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#8b949e] font-medium block mb-1">Secondary Text</label>
                    <input value={config.secondaryText} onChange={e => upd({ secondaryText: e.target.value })}
                      className="w-full border border-[#30363d] rounded-xl px-3 py-2 text-sm bg-[#161b22] text-white focus:outline-none focus:ring-2 focus:ring-[#1f6feb]" />
                  </div>
                  <Slider label="Font Size" value={config.secondaryFontSize || 12} min={6} max={36} onChange={v => upd({ secondaryFontSize: v })} unit="px" />
                  <Toggle label="Bold" value={!!config.secondaryBold} onChange={v => upd({ secondaryBold: v })} />
                </div>
              )}
              {textTab === 'inner' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#8b949e] font-medium block mb-1">Inner Top</label>
                    <input value={config.innerTopText} onChange={e => upd({ innerTopText: e.target.value })}
                      className="w-full border border-[#30363d] rounded-xl px-3 py-2 text-sm bg-[#161b22] text-white focus:outline-none focus:ring-2 focus:ring-[#1f6feb]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b949e] font-medium block mb-1">Inner Bottom</label>
                    <input value={config.innerBottomText} onChange={e => upd({ innerBottomText: e.target.value })}
                      className="w-full border border-[#30363d] rounded-xl px-3 py-2 text-sm bg-[#161b22] text-white focus:outline-none focus:ring-2 focus:ring-[#1f6feb]" />
                  </div>
                  <Toggle label="Show Inner Line" value={!!config.showInnerLine} onChange={v => upd({ showInnerLine: v })} />
                  {config.showInnerLine && <Slider label="Inner Line Offset" value={config.innerLineOffset} min={4} max={40} onChange={v => upd({ innerLineOffset: v })} unit="px" />}
                </div>
              )}
              {textTab === 'center' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#8b949e] font-medium block mb-1">Center Text</label>
                    <input value={config.centerText} onChange={e => upd({ centerText: e.target.value })}
                      className="w-full border border-[#30363d] rounded-xl px-3 py-2 text-sm bg-[#161b22] text-white focus:outline-none focus:ring-2 focus:ring-[#1f6feb]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b949e] font-medium block mb-1">Center Sub Text</label>
                    <input value={config.centerSubText} onChange={e => upd({ centerSubText: e.target.value })}
                      className="w-full border border-[#30363d] rounded-xl px-3 py-2 text-sm bg-[#161b22] text-white focus:outline-none focus:ring-2 focus:ring-[#1f6feb]" />
                  </div>
                  <Slider label="Center Font Size" value={config.centerFontSize || 14} min={8} max={48} onChange={v => upd({ centerFontSize: v })} unit="px" />
                </div>
              )}
            </Section>

            {/* Border */}
            <Section title="Border & Colors" icon={<Palette size={15} />}>
              <div>
                <label className="text-xs text-[#8b949e] font-medium block mb-2">Ink Color</label>
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map(c => <ColorDot key={c.value} color={c.value} active={config.borderColor === c.value} onClick={() => upd({ borderColor: c.value })} />)}
                  <label className="w-7 h-7 rounded-full border-2 border-dashed border-[#30363d] flex items-center justify-center cursor-pointer hover:border-[#58a6ff] transition-colors" title="Custom color">
                    <span className="text-[9px] text-[#8b949e]">+</span>
                    <input type="color" value={config.borderColor} onChange={e => upd({ borderColor: e.target.value })} className="sr-only" />
                  </label>
                </div>
              </div>
              <Slider label="Border Width" value={config.borderWidth} min={1} max={10} onChange={v => upd({ borderWidth: v })} unit="px" />
              <Slider label="Border Offset" value={config.borderOffset} min={0} max={30} onChange={v => upd({ borderOffset: v })} unit="px" />
              <div>
                <label className="text-xs text-[#8b949e] font-medium block mb-2">Border Style</label>
                <div className="flex gap-2 flex-wrap">
                  {[BorderStyle.SINGLE, BorderStyle.DOUBLE, BorderStyle.DOTTED, BorderStyle.DASHED].map(bs => (
                    <button key={bs} onClick={() => upd({ borderStyle: bs })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${config.borderStyle === bs ? 'bg-[#1f6feb] text-white border-[#58a6ff]' : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-[#58a6ff]'}`}>
                      {bs.charAt(0) + bs.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              <Toggle label="Double Border" value={!!config.doubleBorder} onChange={v => upd({ doubleBorder: v })} />
            </Section>

            {/* Effects */}
            <Section title="Stamp Effects" icon={<Sparkles size={15} />}>
              <Slider label="Distress / Age" value={Math.round(config.distressLevel * 100)} min={0} max={100} step={5} onChange={v => upd({ distressLevel: v / 100 })} unit="%" />
              <Slider label="Letter Spacing" value={config.letterSpacing || 0} min={-5} max={20} onChange={v => upd({ letterSpacing: v })} unit="px" />
              <div className="grid grid-cols-2 gap-2 pt-1">
                {([['Wet Ink','wetInk'],['Vintage','isVintage'],['Show Stars','showStars'],['Date Line','showDateLine']] as const).map(([label, key]) => (
                  <label key={key} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${(config as any)[key] ? 'bg-[#21262d] border-[#58a6ff]' : 'bg-[#161b22] border-[#30363d] hover:border-[#58a6ff]'}`}>
                    <span className="text-xs font-medium text-[#e6edf3]">{label}</span>
                    <input type="checkbox" checked={!!(config as any)[key]} onChange={e => upd({ [key]: e.target.checked } as any)} className="sr-only" />
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${(config as any)[key] ? 'bg-[#1f6feb]' : 'bg-[#30363d]'}`}>
                      {(config as any)[key] && <Check size={10} className="text-white" />}
                    </div>
                  </label>
                ))}
              </div>
              {config.showStars && <Slider label="Star Count" value={config.starCount} min={1} max={12} onChange={v => upd({ starCount: v })} />}
            </Section>

            {/* Logo */}
            <Section title="Logo / Image" icon={<ImageIcon size={15} />}>
              {config.logoUrl ? (
                <div className="relative group">
                  <img src={config.logoUrl} alt="Logo" className="w-full h-20 object-contain bg-[#161b22] rounded-xl border border-[#30363d]" />
                  <button onClick={() => upd({ logoUrl: null })}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full py-6 border-2 border-dashed border-[#30363d] rounded-xl cursor-pointer hover:border-[#58a6ff] hover:bg-[#21262d] transition-all">
                  <ImageIcon size={24} className="text-[#8b949e] mb-2" />
                  <span className="text-xs text-[#8b949e] font-medium">Upload logo or image</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { const r = new FileReader(); r.onloadend = () => upd({ logoUrl: r.result as string }); r.readAsDataURL(f); }
                  }} />
                </label>
              )}
            </Section>

            {/* Signature */}
            <Section title="Embedded Signature" icon={<PenTool size={15} />}>
              <Toggle label="Show Signature Line" value={!!config.showSignatureLine} onChange={v => upd({ showSignatureLine: v })} />
              {config.showSignatureLine && (
                <div className="space-y-3 pt-1">
                  <Toggle label="Embed Signature" value={!!config.showEmbeddedSignature} onChange={v => upd({ showEmbeddedSignature: v })} />
                  {config.showEmbeddedSignature && (
                    <div className="flex gap-2">
                      <button onClick={() => setShowSignPad(true)}
                        className="flex-1 py-2 border border-[#30363d] rounded-xl text-xs font-semibold text-[#58a6ff] hover:bg-[#21262d] flex items-center justify-center gap-1 transition-colors">
                        <PenTool size={12} /> Draw
                      </button>
                      <label className="flex-1 py-2 border border-[#30363d] rounded-xl text-xs font-semibold text-[#58a6ff] hover:bg-[#21262d] flex items-center justify-center gap-1 transition-colors cursor-pointer">
                        <ImageIcon size={12} /> Upload
                        <input type="file" accept="image/*" className="sr-only" onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) { const r = new FileReader(); r.onloadend = () => upd({ embeddedSignatureUrl: r.result as string }); r.readAsDataURL(f); }
                        }} />
                      </label>
                    </div>
                  )}
                  {config.showEmbeddedSignature && config.embeddedSignatureUrl && (
                    <div className="relative group">
                      <img src={config.embeddedSignatureUrl} alt="Signature" className="w-full h-12 object-contain bg-[#161b22] rounded-xl border border-[#30363d]" />
                      <button onClick={() => upd({ embeddedSignatureUrl: null })}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* Preview BG */}
            <Section title="Preview Background" icon={<Eye size={15} />}>
              <div className="grid grid-cols-4 gap-2">
                {[{id:'default',label:'Blue'},{id:'white',label:'White'},{id:'paper',label:'Paper'},{id:'transparent',label:'Clear'}].map(bg => (
                  <button key={bg.id} onClick={() => upd({ previewBg: bg.id as any })}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${config.previewBg === bg.id ? 'bg-[#1f6feb] text-white border-[#58a6ff]' : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-[#58a6ff]'}`}>
                    {bg.label}
                  </button>
                ))}
              </div>
            </Section>
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] p-8 relative">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage:'radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)', backgroundSize:'32px 32px' }} />
            <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-lg">
              <div className="text-center">
                <p className="text-[#58a6ff] text-xs font-semibold uppercase tracking-widest mb-1">Live Preview</p>
                <p className="text-[#8b949e] text-xs">Changes apply instantly</p>
              </div>
              <SVGPreview config={config} ref={svgRef} />
              <div className="flex gap-3">
                <button onClick={() => upd({ rotation: 0 })} className="flex items-center gap-1.5 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] rounded-xl text-xs font-medium transition-colors border border-[#58a6ff]">
                  <RotateCcw size={13} /> Reset Rotation
                </button>
                <button onClick={exportPNG} className="flex items-center gap-1.5 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] rounded-xl text-xs font-medium transition-colors border border-[#58a6ff]">
                  <Download size={13} /> Export PNG
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#161b22] border-t border-[#30363d] flex-shrink-0">
          <p className="text-xs text-[#8b949e] hidden sm:block">Tip: Use <span className="font-semibold text-[#58a6ff]">Wet Ink</span> + <span className="font-semibold text-[#58a6ff]">Distress</span> for a realistic rubber stamp look.</p>
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-[#30363d] text-[#8b949e] text-sm font-medium hover:bg-[#0d1117] transition-colors">Cancel</button>
            <button onClick={apply} className="px-6 py-2.5 rounded-xl bg-[#1f6feb] hover:bg-[#30363d] text-white text-sm font-semibold shadow-lg shadow-[#1f6feb]/30 transition-all">Apply to Document</button>
          </div>
        </div>
      </div>
      {showSignPad && <SignaturePad onSave={url => { upd({ embeddedSignatureUrl: url }); setShowSignPad(false); }} onCancel={() => setShowSignPad(false)} />}
    </div>
  );
};

export default StampStudio;
