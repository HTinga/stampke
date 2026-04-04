import React, { useRef, useState } from 'react';
import { useStampStore } from '../store';
import SVGPreview from './SVGPreview';
import './StampStudio.css';
import { StampConfig, StampShape, BorderStyle, CustomElement } from '../types';
import { COLORS, FONTS } from '../constants';
import {
  X, Download, ChevronLeft, ChevronRight, Pen, Type, Palette,
  Sparkles, Eye, RotateCcw, RotateCw, Save, Circle, Plus, FileText, Calendar,
  Check, Eraser, Settings, Layers, Star, Grid3X3, Trash2, Zap,
  Bold, Italic, Underline, ChevronDown, Layout, Sliders, Move, Copy, Clock,
  Image as ImageIcon, FileJson, FilePlus, CheckCircle2, Lightbulb, Camera
} from 'lucide-react';
import IntelligentTip from './IntelligentTip';
import { analyzeStampImage } from '../services/geminiService';

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
      <div className="bg-white rounded-lg shadow-2xl p-5 w-full max-w-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-gray-800 text-sm">Draw your signature</h4>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><X size={16} /></button>
        </div>
        <div className="border-2 border-dashed border-blue-300 rounded-lg overflow-hidden mb-3 bg-white touch-none">
          <canvas ref={ref} width={340} height={160}
            onMouseDown={start} onMouseUp={stop} onMouseMove={move}
            onTouchStart={start} onTouchEnd={stop} onTouchMove={move}
            className="w-full cursor-crosshair" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => { const c = ref.current; c?.getContext('2d')?.clearRect(0,0,c.width,c.height); }}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
            <Eraser size={14} /> Clear
          </button>
          <button onClick={() => { if (ref.current) onSave(ref.current.toDataURL('image/png')); }}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1">
            <Check size={14} /> Apply
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Compact Slider ─────────────────────────────── */
const CompactSlider = ({ label, value, min, max, step = 1, unit = '', onChange, onCommit }: { label:string; value:number; min:number; max:number; step?:number; unit?:string; onChange:(v:number)=>void; onCommit?:()=>void }) => (
  <div className="ss-slider-row">
    <div className="flex justify-between items-center mb-1">
      <label className="ss-slider-label">{label}</label>
      <span className="text-[10px] font-mono text-[#58a6ff] bg-[#1f6feb]/10 px-1.5 py-0.5 rounded">{value}{unit}</span>
    </div>
    <div className="ss-slider-track-wrap">
      <button className="ss-slider-btn" onClick={() => { onChange(Math.max(min, value - step)); onCommit?.(); }}>
        <ChevronLeft size={12} />
      </button>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
        onMouseUp={() => onCommit?.()}
        onTouchEnd={() => onCommit?.()}
        className="ss-slider-input" />
      <button className="ss-slider-btn" onClick={() => { onChange(Math.min(max, value + step)); onCommit?.(); }}>
        <ChevronRight size={12} />
      </button>
    </div>
  </div>
);

/* ── Toggle ─────────────────────────────────────── */
const Toggle = ({ label, value, onChange }: { label:string; value:boolean; onChange:(v:boolean)=>void }) => (
  <div className="ss-toggle-row">
    <span className="ss-toggle-label">{label}</span>
    <button onClick={() => onChange(!value)}
      className={`ss-toggle-track ${value ? 'active' : ''}`}>
      <span className="ss-toggle-thumb" />
    </button>
  </div>
);

/* ── Color Dot ──────────────────────────────────── */
const ColorDot = ({ color, active, onClick }: { color:string; active:boolean; onClick:()=>void }) => (
  <button onClick={onClick}
    className={`ss-color-dot ${active ? 'active' : ''}`}
    style={{ backgroundColor: color }} />
);

/* ── StampStudio ────────────────────────────────── */
interface Props {
  onClose: () => void;
  onApply?: (s: string) => void;
  accessStatus?: 'granted' | 'trial_available' | 'trial_used' | 'locked';
  onPaywallTrigger?: () => void;
  autoDigitize?: boolean;
}

type RightTab = 'text' | 'shape' | 'border' | 'effects' | 'logo' | 'signature' | 'preview' | 'elements' | 'advanced';
type LayerFilter = 'all' | 'text' | 'figure';

const StampStudio: React.FC<Props> = ({ onClose, onApply, accessStatus = 'granted', onPaywallTrigger, autoDigitize }) => {
  const { 
    config, setConfig, undo, redo, history, redoStack, 
    fetchTemplates, saveTemplateRemote, logAudit, resetConfig, recordHistory 
  } = useStampStore();
  const upd = (u: Partial<StampConfig>, skipHist = false) => setConfig(u, skipHist);
  const svgRef = useRef<SVGSVGElement>(null);
  const [showSignPad, setShowSignPad] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<'completed'|'sample'>('sample');
  const [isSaving, setIsSaving] = useState(false);
  const [showDateConfirm, setShowDateConfirm] = useState(false);
  const [textTab, setTextTab] = useState<'primary'|'secondary'|'inner'|'center'>('primary');
  const [rightTab, setRightTab] = useState<RightTab>('elements');
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all');
  const [selectedLayer, setSelectedLayer] = useState<string>('primary');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [timerInSeconds, setTimerInSeconds] = useState(0);
  const [isDigitizing, setIsDigitizing] = useState(false);
  const digitizerInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (autoDigitize && digitizerInputRef.current) {
      digitizerInputRef.current.click();
    }
  }, [autoDigitize]);

  React.useEffect(() => {
    const itv = setInterval(() => setTimerInSeconds(s => s + 1), 1000);
    return () => clearInterval(itv);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getSvgString = () => svgRef.current ? new XMLSerializer().serializeToString(svgRef.current) : '';


  // Paywall guard — used before any export or apply action
  const canAct = accessStatus === 'granted' || accessStatus === 'trial_available';
  const withPaywallGuard = (fn: () => void) => {
    if (!canAct) { onPaywallTrigger?.(); return; }
    fn();
  };
  const exportPNG = () => {
    const svg = getSvgString(); if (!svg) return;
    const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, 600, 600); const a = document.createElement('a'); a.download='stamp.png'; a.href=canvas.toDataURL('image/png'); a.click(); };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  };

  const exportSVG = () => {
    const svg = getSvgString(); if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a'); a.download = 'stamp.svg'; a.href = URL.createObjectURL(blob); a.click();
  };

  const exportPDF = () => {
    const svg = getSvgString(); if (!svg) return;
    const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 600, 600);
      const imgData = canvas.toDataURL('image/png');
      const w = window.open(''); if (!w) return;
      w.document.write(`<html><head><title>Stamp PDF</title><style>@media print{@page{size:auto;margin:0}body{margin:1cm}}</style></head><body><img src="${imgData}" style="max-width:100%;height:auto"/><script>setTimeout(()=>{window.print();},300)<\/script></body></html>`);
      w.document.close();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  };

  const exportJPEG = () => {
    const svg = getSvgString(); if (!svg) return;
    const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    // Fill white background for JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 600);
    const img = new Image();
    img.onload = () => { 
        ctx.drawImage(img, 0, 0, 600, 600); 
        const a = document.createElement('a'); a.download='stamp.jpg'; a.href=canvas.toDataURL('image/jpeg', 0.9); a.click(); 
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  };

  const addCustomElement = (type: 'image' | 'text') => {
    const newEl: CustomElement = { 
      id: Math.random().toString(36).substr(2, 9), 
      type, x: 300, y: 300, 
      content: type === 'text' ? 'NEW TEXT' : '', 
      width: type === 'image' ? 100 : undefined, 
      height: type === 'image' ? 100 : undefined, 
      rotation: 0, scale: 1, opacity: 1, 
      isCurved: false, curveRadius: 100,
      color: config.borderColor,
      fontSize: 40,
      isBold: true
    };
    upd({ customElements: [...(config.customElements || []), newEl] });
  };

  const updateCustomElement = (id: string, updates: Partial<CustomElement>) => {
    upd({ customElements: config.customElements.map(el => el.id === id ? { ...el, ...updates } : el) });
  };

  const removeCustomElement = (id: string) => {
    upd({ customElements: config.customElements.filter(el => el.id !== id) });
  };

  const handleDigitize = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsDigitizing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const result = await analyzeStampImage(base64);
        if (result.success) {
           upd({
             shape: result.shape as StampShape,
             primaryText: result.primaryText,
             secondaryText: result.secondaryText,
             centerText: result.centerText,
             borderColor: result.color || config.borderColor,
             primaryColor: result.color || config.primaryColor,
           });
           alert('Stamp digitized successfully! 🎨');
        } else {
           alert('Digitization failed: ' + result.message);
        }
      } catch (err) {
        alert('Digitalization error. Please try again.');
      } finally {
        setIsDigitizing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateApplyWithDate = (newDate?: string) => {
    if (newDate) upd({ selectedDate: newDate });
    setShowDateConfirm(false);
    
    // Proceed with apply
    if (onApply && svgRef.current) {
      const svg = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600;
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, 600, 600); onApply(canvas.toDataURL('image/png')); };
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    } else onClose();
  };

  const apply = () => {
    const hasDatePossible = config.showDateLine || config.centerSubText.toLowerCase().includes('20') || config.centerText.toLowerCase().includes('20');
    if (hasDatePossible && !showDateConfirm) {
      setShowDateConfirm(true);
      return;
    }
    updateApplyWithDate();
  };

  /* ── Layer definitions ── */
  const layers = [
    { id: 'frame', type: 'figure', label: 'Frame', sublabel: config.shape },
    { id: 'primary', type: 'text', label: 'Primary Text', sublabel: config.primaryText || '—' },
    { id: 'secondary', type: 'text', label: 'Secondary Text', sublabel: config.secondaryText || '—' },
    { id: 'innerTop', type: 'text', label: 'Inner Top Text', sublabel: config.innerTopText || '—' },
    { id: 'innerBottom', type: 'text', label: 'Inner Bottom Text', sublabel: config.innerBottomText || '—' },
    { id: 'center', type: 'text', label: 'Center Text', sublabel: config.centerText || '—' },
    { id: 'centerSub', type: 'text', label: 'Center Sub Text', sublabel: config.centerSubText || '—' },
    ...(config.logoUrl ? [{ id: 'logo', type: 'figure', label: 'Logo', sublabel: 'Uploaded' }] : []),
    ...(config.showEmbeddedSignature && config.embeddedSignatureUrl ? [{ id: 'signature', type: 'figure', label: 'Signature', sublabel: 'Embedded' }] : []),
    ...config.customElements.map(el => ({ id: `custom-${el.id}`, type: el.type === 'text' ? 'text' : 'figure', label: el.type === 'text' ? 'Text Element' : 'Image Element', sublabel: el.type === 'text' ? el.content : 'Custom' })),
  ];

  const filteredLayers = layers.filter(l => {
    if (layerFilter === 'all') return true;
    if (layerFilter === 'text') return l.type === 'text';
    return l.type === 'figure';
  });

  const handleLayerClick = (id: string) => {
    setSelectedLayer(id);
    if (['primary'].includes(id)) { setRightTab('text'); setTextTab('primary'); }
    else if (id === 'secondary') { setRightTab('text'); setTextTab('secondary'); }
    else if (id === 'innerTop' || id === 'innerBottom') { setRightTab('text'); setTextTab('inner'); }
    else if (id === 'center' || id === 'centerSub') { setRightTab('text'); setTextTab('center'); }
    else if (id === 'frame') { setRightTab('shape'); }
    else if (id === 'logo') { setRightTab('logo'); }
    else if (id === 'signature') { setRightTab('signature'); }
    else if (id.startsWith('custom-')) { setRightTab('elements'); }
  };

  /* ── Top toolbar icons ── */
  const toolIcons = React.useMemo(() => [
    { icon: <RotateCcw size={18} />, label: 'Undo', action: undo, disabled: history.length === 0 },
    { icon: <RotateCw size={18} />, label: 'Redo', action: redo, disabled: redoStack.length === 0 },
    { icon: <Eraser size={18} />, label: 'Reset Canvas', action: () => { if(confirm('Reset all changes?')) resetConfig(); } },
    { icon: isSaving ? <span className="animate-spin text-[10px]">⏳</span> : <Save size={18} />, 
      label: 'Save to Library', 
      action: () => {
        if (!templateName) setShowSaveModal(true);
        else handleRemoteSave(templateName);
      },
      disabled: isSaving
    },
    { icon: <Copy size={18} />, label: 'Save as New Template', action: () => setShowSaveModal(true) },
  ], [undo, redo, history.length, redoStack.length, config, templateName, isSaving, resetConfig]);

  const handleRemoteSave = async (name: string, type: 'completed' | 'sample' = 'sample') => {
    setIsSaving(true);
    try {
      const svg = getSvgString();
      const preview = svg ? `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}` : undefined;
      // Use the getState() trick or update the call if the store is directly available
      await (saveTemplateRemote as any)(name, config, preview, type);
      setTemplateName(name);
      alert('Template saved successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to save to cloud.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="ss-container">

        {/* ─── ACCESS BANNER ─── */}
        {(accessStatus === 'trial_available') && (
          <div style={{ background: '#1a73e8', color: 'white', padding: '6px 16px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>⭐ You have 1 free trial — design and download/apply your stamp once at no cost.</span>
            <button onClick={onPaywallTrigger} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Upgrade →</button>
          </div>
        )}
        {(accessStatus === 'trial_used' || accessStatus === 'locked') && (
          <div style={{ background: '#ea4335', color: 'white', padding: '6px 16px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{accessStatus === 'trial_used' ? '🔒 Trial used — subscribe or pay KES 650 to download/apply.' : '🔒 Subscribe to unlock this feature.'}</span>
            <button onClick={onPaywallTrigger} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Unlock Now →</button>
          </div>
        )}

        {/* ─── TOP HEADER BAR ─── */}
        <div className="ss-header">
          <div className="ss-header-left">
            <span className="ss-header-title">Create your own stamp &copy; StampKE</span>
          </div>
          <div className="ss-header-center">
            {toolIcons.map((t, i) => (
              <button key={i} onClick={t.action} disabled={!!(t as any).disabled} 
                className={`ss-tool-icon ${(t as any).disabled ? 'disabled' : ''}`} title={t.label}>
                {t.icon}
              </button>
            ))}
          </div>
          <div className="ss-header-right">
            <div className="ss-timer-display">
                <Clock size={14} className="mr-1" />
                <span>{formatTime(timerInSeconds)}</span>
            </div>
            <button onClick={() => {
                if (onClose) onClose();
                else window.location.hash = '#/sign-docs/sign-esign';
            }} className="ss-tool-icon ml-2 bg-red-600/80 hover:bg-red-700 transition" title="Exit">
                <X size={16} />
            </button>
          </div>
        </div>

        {/* ─── ELEMENT TABS BAR (Categories) ─── */}
        <div className="ss-element-tabs ss-element-tabs-spread">
          {[
            { id: 'elements', label: 'Insert', icon: <Plus size={14} />, type: 'tab' },
            { id: 'wetInk', label: 'Wet Ink', icon: <Zap size={14} />, type: 'toggle' },
            { id: 'isVintage', label: 'Vintage', icon: <Sparkles size={14} />, type: 'toggle' },
            { id: 'showInnerLine', label: 'Inner Line', icon: <Layers size={14} />, type: 'toggle' },
            { id: 'showStars', label: 'Show Stars', icon: <Star size={14} />, type: 'toggle' },
            { id: 'showDateLine', label: 'Date Line', icon: <Calendar size={14} />, type: 'toggle' },
            { id: 'effects', label: 'Aging & Effects', icon: <Sliders size={14} />, type: 'tab' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                if (cat.type === 'toggle') {
                  const key = cat.id;
                  const newVal = !(config as any)[key];
                  upd({ [key]: newVal } as any);
                  if (key === 'showInnerLine' && newVal) {
                    setRightTab('text');
                    setTextTab('inner');
                  }
                  if (key === 'showStars' && newVal) {
                    setRightTab('effects');
                  }
                  if (key === 'showDateLine' && newVal) {
                    setRightTab('text');
                    setTextTab('center');
                  }
                } else {
                  setRightTab(cat.id as any);
                }
              }}
              className={`ss-element-tab ${rightTab === cat.id || (cat.type === 'toggle' && (config as any)[cat.id]) ? 'active' : ''}`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* ─── MAIN 3-COLUMN BODY ─── */}
        <div className="ss-body">

          {/* ── LEFT: Layer List Panel ── */}
          <div className="ss-panel-left">
            <div className="ss-layer-filter-bar">
              {(['all','text','figure'] as const).map(f => (
                <button key={f} onClick={() => setLayerFilter(f)}
                  className={`ss-layer-filter-btn ${layerFilter === f ? 'active' : ''}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="ss-layer-list">
              {filteredLayers.map((l, i) => (
                <button key={l.id}
                  className={`ss-layer-item ${selectedLayer === l.id ? 'active' : ''}`}
                  onClick={() => handleLayerClick(l.id)}>
                  <span className="ss-layer-idx">{i}#</span>
                  <span className="ss-layer-name">{l.label}</span>
                  <span className="ss-layer-dots">⋮</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── CENTER: Stamp Canvas ── */}
          <div className="ss-canvas-area">
            <div className="ss-canvas-grid">
              <div className="ss-canvas-stamp">
                <SVGPreview config={config} ref={svgRef} />
              </div>
            </div>
          </div>

          {/* ── RIGHT: Properties Panel ── */}
          <div className="ss-panel-right">
            {/* Right-panel tab buttons */}
            <div className="ss-right-tabs">
              {([
                { id: 'text' as RightTab, icon: <Type size={13} />, label: 'Text' },
                { id: 'shape' as RightTab, icon: <Circle size={13} />, label: 'Shape' },
                { id: 'border' as RightTab, icon: <Grid3X3 size={13} />, label: 'Border' },
                { id: 'effects' as RightTab, icon: <Sparkles size={13} />, label: 'Effects' },
                { id: 'logo' as RightTab, icon: <ImageIcon size={13} />, label: 'Logo' },
                { id: 'signature' as RightTab, icon: <Pen size={13} />, label: 'Sign' },
                { id: 'elements' as RightTab, icon: <Plus size={13} />, label: 'Elements' },
                { id: 'advanced' as RightTab, icon: <Sliders size={13} />, label: 'More' },
              ]).map(t => (
                <button key={t.id}
                  className={`ss-right-tab-btn ${rightTab === t.id ? 'active' : ''}`}
                  onClick={() => setRightTab(t.id)}>
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
            
            <div className="px-3 pt-3">
              <IntelligentTip 
                tipKey="stamp_studio_serial"
                title="Serial Numbers"
                message="Use [SN] in any text field to add sequential numbering (e.g. 001, 002) when applying to multiple pages."
                icon={Lightbulb}
                color="#58a6ff"
                delay={2000}
              />
            </div>

            <div className="ss-right-content">

              {/* ── TEXT TAB ── */}
              {rightTab === 'text' && (
                <div className="ss-props-section">
                  {/* Font row */}
                  <div className="ss-font-row">
                    <select
                      value={
                        textTab === 'primary' ? (config.primaryFontFamily || config.fontFamily) :
                        textTab === 'secondary' ? (config.secondaryFontFamily || config.fontFamily) :
                        textTab === 'inner' ? (config.innerTopFontFamily || config.fontFamily) :
                        (config.centerFontFamily || config.fontFamily)
                      }
                      onChange={e => {
                        const v = e.target.value;
                        if (textTab === 'primary') upd({ primaryFontFamily: v });
                        else if (textTab === 'secondary') upd({ secondaryFontFamily: v });
                        else if (textTab === 'inner') upd({ innerTopFontFamily: v, innerBottomFontFamily: v });
                        else upd({ centerFontFamily: v, centerSubFontFamily: v });
                      }}
                      className="ss-font-select">
                      {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                    </select>
                    <input type="number" className="ss-font-size-input"
                      value={
                        textTab === 'primary' ? (config.primaryFontSize || 16) :
                        textTab === 'secondary' ? (config.secondaryFontSize || 12) :
                        textTab === 'inner' ? (config.innerTopFontSize || 14) :
                        (config.centerFontSize || 14)
                      }
                      onChange={e => {
                        const v = parseInt(e.target.value) || 12;
                        if (textTab === 'primary') upd({ primaryFontSize: v });
                        else if (textTab === 'secondary') upd({ secondaryFontSize: v });
                        else if (textTab === 'inner') upd({ innerTopFontSize: v });
                        else upd({ centerFontSize: v });
                      }}
                      min={6} max={72}
                    />
                    <div className="ss-font-size-dropdown"><ChevronDown size={10} /></div>
                  </div>
                  {/* Style buttons */}
                  <div className="ss-style-row">
                    <button
                      className={`ss-style-btn ${
                        (textTab === 'primary' && config.primaryBold) ||
                        (textTab === 'secondary' && config.secondaryBold) ||
                        (textTab === 'inner' && config.innerTopBold) ||
                        (textTab === 'center' && config.centerBold) ? 'active' : ''
                      }`}
                      onClick={() => {
                        if (textTab === 'primary') upd({ primaryBold: !config.primaryBold });
                        else if (textTab === 'secondary') upd({ secondaryBold: !config.secondaryBold });
                        else if (textTab === 'inner') upd({ innerTopBold: !config.innerTopBold, innerBottomBold: !config.innerBottomBold });
                        else upd({ centerBold: !config.centerBold, centerSubBold: !config.centerSubBold });
                      }}>
                      <Bold size={14} />
                    </button>
                    <button className="ss-style-btn"><Italic size={14} /></button>
                    <button className="ss-style-btn"><Underline size={14} /></button>
                    <button className="ss-style-btn"><Star size={14} /></button>
                  </div>
                  {/* Text subtabs */}
                  <div className="ss-text-subtabs">
                    {(['primary','secondary','inner','center'] as const).map(t => (
                      <button key={t} onClick={() => setTextTab(t)}
                        className={`ss-text-subtab ${textTab === t ? 'active' : ''}`}>
                        {t === 'primary' ? 'Primary' : t === 'secondary' ? 'Secondary' : t === 'inner' ? 'Inner' : 'Center'}
                      </button>
                    ))}
                  </div>

                  {textTab === 'primary' && (
                    <div className="ss-field-group">
                      <input value={config.primaryText} onChange={e => upd({ primaryText: e.target.value })}
                        placeholder="Primary text" className="ss-text-input" />
                      <CompactSlider label="Radius text" value={config.primaryFontSize || 16} min={8} max={48} onChange={v => upd({ primaryFontSize: v })} />
                      <CompactSlider label="Spacing" value={config.letterSpacing || 0} min={-5} max={20} onChange={v => upd({ letterSpacing: v })} />
                      <div className="ss-field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <CompactSlider label="X Offset" value={config.primaryXOffset || 0} min={-100} max={100} onChange={v => upd({ primaryXOffset: v })} />
                        <CompactSlider label="Y Offset" value={config.primaryYOffset || 0} min={-100} max={100} onChange={v => upd({ primaryYOffset: v })} />
                      </div>
                      <div className="ss-color-row">
                        <span className="ss-color-label">Color</span>
                        <div className="ss-color-dots">
                          {COLORS.map(c => <ColorDot key={c.value} color={c.value} active={config.primaryColor === c.value} onClick={() => upd({ primaryColor: c.value })} />)}
                          <label className="ss-color-custom">
                            <span>+</span>
                            <input type="color" value={config.primaryColor} onChange={e => upd({ primaryColor: e.target.value })} className="sr-only" />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                  {textTab === 'secondary' && (
                    <div className="ss-field-group">
                      <input value={config.secondaryText} onChange={e => upd({ secondaryText: e.target.value })}
                        placeholder="Secondary text" className="ss-text-input" />
                      <CompactSlider label="Font Size" value={config.secondaryFontSize || 12} min={6} max={36} onChange={v => upd({ secondaryFontSize: v })} />
                      <Toggle label="Bold" value={!!config.secondaryBold} onChange={v => upd({ secondaryBold: v })} />
                      <div className="ss-field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <CompactSlider label="X Offset" value={config.secondaryXOffset || 0} min={-100} max={100} onChange={v => upd({ secondaryXOffset: v })} />
                        <CompactSlider label="Y Offset" value={config.secondaryYOffset || 0} min={-100} max={100} onChange={v => upd({ secondaryYOffset: v })} />
                      </div>
                      <div className="ss-color-row">
                        <span className="ss-color-label">Color</span>
                        <div className="ss-color-dots">
                          {COLORS.map(c => <ColorDot key={c.value} color={c.value} active={config.secondaryColor === c.value} onClick={() => upd({ secondaryColor: c.value })} />)}
                        </div>
                      </div>
                    </div>
                  )}
                  {textTab === 'inner' && (
                    <div className="ss-field-group">
                      <label className="ss-field-label">Inner Top</label>
                      <input value={config.innerTopText} onChange={e => upd({ innerTopText: e.target.value })}
                        placeholder="Inner top text" className="ss-text-input" />
                      <label className="ss-field-label">Inner Bottom</label>
                      <input value={config.innerBottomText} onChange={e => upd({ innerBottomText: e.target.value })}
                        placeholder="Inner bottom text" className="ss-text-input" />
                      <div className="ss-field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <CompactSlider label="Top X" value={config.innerTopXOffset || 0} min={-100} max={100} onChange={v => upd({ innerTopXOffset: v })} />
                        <CompactSlider label="Top Y" value={config.innerTopYOffset || 0} min={-100} max={100} onChange={v => upd({ innerTopYOffset: v })} />
                      </div>
                      <div className="ss-field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <CompactSlider label="Bottom X" value={config.innerBottomXOffset || 0} min={-100} max={100} onChange={v => upd({ innerBottomXOffset: v })} />
                        <CompactSlider label="Bottom Y" value={config.innerBottomYOffset || 0} min={-100} max={100} onChange={v => upd({ innerBottomYOffset: v })} />
                      </div>
                      <Toggle label="Show Inner Line" value={!!config.showInnerLine} onChange={v => upd({ showInnerLine: v })} />
                      {config.showInnerLine && <CompactSlider label="Line Offset" value={config.innerLineOffset} min={4} max={40} onChange={v => upd({ innerLineOffset: v })} />}
                    </div>
                  )}
                  {textTab === 'center' && (
                    <div className="ss-field-group">
                      <input value={config.centerText} onChange={e => upd({ centerText: e.target.value })}
                        placeholder="Center text" className="ss-text-input" />
                      <input value={config.centerSubText} onChange={e => upd({ centerSubText: e.target.value })}
                        placeholder="Center sub text" className="ss-text-input" />
                      <CompactSlider label="Center Size" value={config.centerFontSize || 14} min={8} max={48} onChange={v => upd({ centerFontSize: v })} />
                      <CompactSlider label="Sub Size" value={config.centerSubFontSize || 18} min={8} max={36} onChange={v => upd({ centerSubFontSize: v })} />
                      <div className="ss-field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <CompactSlider label="Center X" value={config.centerXOffset || 0} min={-100} max={100} onChange={v => upd({ centerXOffset: v })} />
                        <CompactSlider label="Center Y" value={config.centerYOffset || 0} min={-100} max={100} onChange={v => upd({ centerYOffset: v })} />
                      </div>
                      <div className="ss-field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <CompactSlider label="Sub X" value={config.centerSubXOffset || 0} min={-100} max={100} onChange={v => upd({ centerSubXOffset: v })} />
                        <CompactSlider label="Sub Y" value={config.centerSubYOffset || 0} min={-100} max={100} onChange={v => upd({ centerSubYOffset: v })} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── SHAPE TAB ── */}
              {rightTab === 'shape' && (
                <div className="ss-props-section">
                  <label className="ss-field-label">Stamp Shape</label>
                  <div className="ss-shape-grid">
                    {[
                      { v: StampShape.ROUND, label: 'Round' },
                      { v: StampShape.OVAL, label: 'Oval' },
                      { v: StampShape.RECTANGLE, label: 'Rect' },
                      { v: StampShape.SQUARE, label: 'Square' },
                    ].map(s => (
                      <button key={s.v} onClick={() => upd({ shape: s.v })}
                        className={`ss-shape-btn ${config.shape === s.v ? 'active' : ''}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <CompactSlider label="Width" value={config.width} min={150} max={600} onChange={v => upd({ width: v })} unit="px" />
                  <CompactSlider label="Height" value={config.height} min={100} max={600} onChange={v => upd({ height: v })} unit="px" />
                  <CompactSlider 
                    label="Uniform Scale" 
                    value={Math.max(config.width, config.height)} 
                    min={150} max={600} 
                    onChange={v => {
                      const ratio = config.width / config.height;
                      if (ratio >= 1) {
                         upd({ width: v, height: Math.round(v / ratio) });
                      } else {
                         upd({ height: v, width: Math.round(v * ratio) });
                      }
                    }} 
                    unit="px" 
                  />
                  <CompactSlider label="Rotation" value={config.rotation} min={0} max={360} onChange={v => upd({ rotation: v })} unit="°" />
                </div>
              )}

              {/* ── BORDER TAB ── */}
              {rightTab === 'border' && (
                <div className="ss-props-section">
                  <label className="ss-field-label">Ink Color</label>
                  <div className="ss-color-dots" style={{ marginBottom: 10 }}>
                    {COLORS.map(c => <ColorDot key={c.value} color={c.value} active={config.borderColor === c.value} onClick={() => upd({ borderColor: c.value })} />)}
                    <label className="ss-color-custom">
                      <span>+</span>
                      <input type="color" value={config.borderColor} onChange={e => upd({ borderColor: e.target.value })} className="sr-only" />
                    </label>
                  </div>
                  <CompactSlider label="Width" value={config.borderWidth} min={1} max={10} onChange={v => upd({ borderWidth: v })} unit="px" />
                  <CompactSlider label="Offset" value={config.borderOffset} min={0} max={30} onChange={v => upd({ borderOffset: v })} unit="px" />
                  <label className="ss-field-label">Border Style</label>
                  <div className="ss-border-style-row">
                    {[BorderStyle.SINGLE, BorderStyle.DOUBLE, BorderStyle.DOTTED, BorderStyle.DASHED].map(bs => (
                      <button key={bs} onClick={() => upd({ borderStyle: bs })}
                        className={`ss-border-btn ${config.borderStyle === bs ? 'active' : ''}`}>
                        {bs.charAt(0) + bs.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                  <Toggle label="Double Border" value={!!config.doubleBorder} onChange={v => upd({ doubleBorder: v })} />
                  {config.doubleBorder && (
                    <>
                      <Toggle label="Outer Border" value={!!config.doubleBorderIsOuter} onChange={v => upd({ doubleBorderIsOuter: v })} />
                      <CompactSlider label="Double Offset" value={config.doubleBorderOffset} min={1} max={20} onChange={v => upd({ doubleBorderOffset: v })} unit="px" />
                      <CompactSlider label="Double Thickness" value={config.doubleBorderThickness} min={1} max={10} onChange={v => upd({ doubleBorderThickness: v })} unit="px" />
                      <label className="ss-field-label">Double Border Color</label>
                      <div className="ss-color-dots">
                        {COLORS.map(c => <ColorDot key={c.value} color={c.value} active={config.doubleBorderColor === c.value} onClick={() => upd({ doubleBorderColor: c.value })} />)}
                      </div>
                      <label className="ss-field-label">Double Border Style</label>
                      <div className="ss-border-style-row">
                        {[BorderStyle.SINGLE, BorderStyle.DASHED].map(bs => (
                          <button key={bs} onClick={() => upd({ doubleBorderStyle: bs })}
                            className={`ss-border-btn ${config.doubleBorderStyle === bs ? 'active' : ''}`}>
                            {bs === BorderStyle.SINGLE ? 'Solid' : 'Dashed'}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <Toggle label="Inner Line" value={!!config.showInnerLine} onChange={v => upd({ showInnerLine: v })} />
                  {config.showInnerLine && (
                    <>
                      <CompactSlider label="Inner Offset" value={config.innerLineOffset} min={5} max={100} onChange={v => upd({ innerLineOffset: v })} unit="px" />
                      <CompactSlider label="Inner Thickness" value={config.innerLineWidth || 2} min={1} max={10} onChange={v => upd({ innerLineWidth: v })} unit="px" />
                    </>
                  )}
                </div>
              )}

              {/* ── EFFECTS TAB ── */}
              {rightTab === 'effects' && (
                <div className="ss-props-section">
                  <CompactSlider label="Distress / Age" value={Math.round(config.distressLevel * 100)} min={0} max={100} step={5} onChange={v => upd({ distressLevel: v / 100 })} unit="%" />
                  <CompactSlider label="Letter Spacing" value={config.letterSpacing || 0} min={-5} max={20} onChange={v => upd({ letterSpacing: v })} unit="px" />
                  <div className="ss-effects-grid">
                    {([['Wet Ink','wetInk'],['Vintage','isVintage'],['Show Stars','showStars'],['Date Line','showDateLine']] as const).map(([label, key]) => (
                      <label key={key} className={`ss-effect-chip ${(config as any)[key] ? 'active' : ''}`}>
                        <span className="ss-effect-chip-label">{label}</span>
                        <input type="checkbox" checked={!!(config as any)[key]} onChange={e => upd({ [key]: e.target.checked } as any)} className="sr-only" />
                        <div className={`ss-effect-check ${(config as any)[key] ? 'active' : ''}`}>
                          {(config as any)[key] && <Check size={10} />}
                        </div>
                      </label>
                    ))}
                  </div>
                  {config.showStars && (
                    <>
                      <CompactSlider label="Star Count" value={config.starCount} min={1} max={12} onChange={v => upd({ starCount: v })} />
                      <CompactSlider label="Star Size" value={config.starSize || 20} min={5} max={50} onChange={v => upd({ starSize: v })} unit="px" />
                      <CompactSlider label="Star Offset" value={config.starOffset || 0} min={-50} max={50} onChange={v => upd({ starOffset: v })} unit="px" />
                    </>
                  )}
                  <Toggle label="Shadow" value={!!config.showShadow} onChange={v => upd({ showShadow: v })} />
                  {config.showShadow && (
                    <>
                      <CompactSlider label="Shadow Blur" value={config.shadowBlur || 5} min={0} max={20} onChange={v => upd({ shadowBlur: v })} unit="px" />
                      <CompactSlider label="Shadow X" value={config.shadowOffsetX || 2} min={-20} max={20} onChange={v => upd({ shadowOffsetX: v })} unit="px" />
                      <CompactSlider label="Shadow Y" value={config.shadowOffsetY || 2} min={-20} max={20} onChange={v => upd({ shadowOffsetY: v })} unit="px" />
                    </>
                  )}
                </div>
              )}

              {/* ── LOGO TAB ── */}
              {rightTab === 'logo' && (
                <div className="ss-props-section">
                  <label className="ss-field-label">Logo / Image</label>
                  {config.logoUrl ? (
                    <div className="ss-logo-preview">
                      <img src={config.logoUrl} alt="Logo" />
                      <button onClick={() => upd({ logoUrl: null })} className="ss-logo-remove"><X size={12} /></button>
                    </div>
                  ) : (
                    <label className="ss-upload-area">
                      <ImageIcon size={22} className="ss-upload-icon" />
                      <span>Upload logo or image</span>
                      <input type="file" accept="image/*" className="sr-only" onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) { const r = new FileReader(); r.onloadend = () => upd({ logoUrl: r.result as string }); r.readAsDataURL(f); }
                      }} />
                    </label>
                  )}
                </div>
              )}

              {/* ── SIGNATURE TAB ── */}
              {rightTab === 'signature' && (
                <div className="ss-props-section">
                  <Toggle label="Show Signature Line" value={!!config.showSignatureLine} onChange={v => upd({ showSignatureLine: v })} />
                  {config.showSignatureLine && (
                    <>
                      <Toggle label="Embed Signature" value={!!config.showEmbeddedSignature} onChange={v => upd({ showEmbeddedSignature: v })} />
                      {config.showEmbeddedSignature && (
                        <div className="ss-sig-buttons">
                          <button onClick={() => setShowSignPad(true)} className="ss-sig-btn">
                            <Pen size={12} /> Draw
                          </button>
                          <label className="ss-sig-btn">
                            <ImageIcon size={12} /> Upload
                            <input type="file" accept="image/*" className="sr-only" onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) { const r = new FileReader(); r.onloadend = () => upd({ embeddedSignatureUrl: r.result as string }); r.readAsDataURL(f); }
                            }} />
                          </label>
                        </div>
                      )}
                      {config.showEmbeddedSignature && config.embeddedSignatureUrl && (
                        <>
                          <div className="ss-logo-preview" style={{ height: 48 }}>
                            <img src={config.embeddedSignatureUrl} alt="Signature" />
                            <button onClick={() => upd({ embeddedSignatureUrl: null })} className="ss-logo-remove"><X size={10} /></button>
                          </div>
                          <CompactSlider label="Sig X Offset" value={config.signatureX || 0} min={-100} max={100} onChange={v => upd({ signatureX: v })} unit="px" />
                          <CompactSlider label="Sig Y Offset" value={config.signatureY || 0} min={-100} max={100} onChange={v => upd({ signatureY: v })} unit="px" />
                          <CompactSlider label="Sig Scale" value={Math.round((config.signatureScale || 1) * 100)} min={10} max={300} onChange={v => upd({ signatureScale: v / 100 })} unit="%" />
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── INSERT / ELEMENTS TAB ── */}
              {rightTab === 'elements' && (
                <div className="ss-props-section">
                  <label className="ss-field-label">Insert Element</label>
                  <div className="ss-sig-buttons" style={{ marginBottom: 16 }}>
                    <button onClick={() => addCustomElement('text')} className="ss-sig-btn" style={{ flex: 1 }}>
                      <Type size={14} /> Add Text Box
                    </button>
                    <button onClick={() => addCustomElement('image')} className="ss-sig-btn" style={{ flex: 1 }}>
                      <ImageIcon size={14} /> Add Image
                    </button>
                  </div>

                  <label className="ss-field-label">Layer Manager</label>
                  <div className="ss-layers-list" style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {config.customElements.map((el, idx) => (
                      <div key={el.id} className="ss-element-card">
                        <div className="ss-element-header">
                          <div className="flex items-center gap-2">
                            <div className="ss-element-number">{idx + 1}</div>
                            <span className="text-xs font-black uppercase tracking-widest text-white">
                              {el.type === 'text' ? 'Text Layer' : 'Image Layer'}
                            </span>
                          </div>
                          <button onClick={() => removeCustomElement(el.id)} className="ss-element-delete">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {el.type === 'text' && (
                          <div className="space-y-4 mb-4">
                            <div className="ss-input-group">
                              <label className="ss-field-label">Content</label>
                              <input 
                                value={el.content} 
                                onChange={e => updateCustomElement(el.id, { content: e.target.value })} 
                                className="ss-text-input-premium" 
                                placeholder="Enter text..."
                              />
                            </div>
                            
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <label className="ss-field-label">Font Family</label>
                                <select 
                                  value={el.fontFamily || config.fontFamily} 
                                  onChange={e => updateCustomElement(el.id, { fontFamily: e.target.value })} 
                                  className="ss-select-premium"
                                >
                                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                                </select>
                              </div>
                              <div className="w-20">
                                <label className="ss-field-label">Size</label>
                                <input 
                                  type="number" 
                                  className="ss-input-number-premium" 
                                  value={el.fontSize || 40}
                                  onChange={e => updateCustomElement(el.id, { fontSize: parseInt(e.target.value) || 40 })} 
                                  min={10} max={120} 
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                               <Toggle label="Bold Text" value={!!el.isBold} onChange={v => updateCustomElement(el.id, { isBold: v })} />
                               <div className="ss-color-dots-compact">
                                 {COLORS.slice(0, 5).map(c => (
                                    <ColorDot key={c.value} color={c.value} active={el.color === c.value} onClick={() => updateCustomElement(el.id, { color: c.value })} />
                                 ))}
                               </div>
                            </div>
                          </div>
                        )}

                        {el.type === 'image' && (
                           <div className="mb-4">
                             <label className="ss-upload-area-premium">
                               <ImageIcon size={18} />
                               <span className="text-xs font-bold">Replace Source Image</span>
                               <input type="file" accept="image/*" className="sr-only" onChange={e => {
                                 const f = e.target.files?.[0];
                                 if (f) { const r = new FileReader(); r.onloadend = () => updateCustomElement(el.id, { content: r.result as string }); r.readAsDataURL(f); }
                               }} />
                             </label>
                           </div>
                        )}

                        <div className="space-y-3 pt-2 border-t border-white/5">
                          <div className="grid grid-cols-2 gap-4">
                            <CompactSlider label="Scale" value={Math.round((el.scale || 1) * 100)} min={10} max={400} onChange={v => updateCustomElement(el.id, { scale: v / 100 })} unit="%" />
                            <CompactSlider label="Rotate" value={el.rotation || 0} min={-180} max={180} step={5} onChange={v => updateCustomElement(el.id, { rotation: v })} unit="°" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <CompactSlider label="Offset X" value={el.offsetX || 0} min={-300} max={300} onChange={v => updateCustomElement(el.id, { offsetX: v })} unit="px" />
                            <CompactSlider label="Offset Y" value={el.offsetY || 0} min={-300} max={300} onChange={v => updateCustomElement(el.id, { offsetY: v })} unit="px" />
                          </div>
                        </div>
                      </div>
                    ))}
                    {config.customElements.length === 0 && (
                      <div className="ss-empty-elements">
                        <div className="ss-empty-icon"><Layers size={24} /></div>
                        <p>No layers added yet</p>
                        <span className="text-[10px] opacity-50">Click "Add Text" or "Add Image" to start designing</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── EFFECTS TAB ── */}
              {rightTab === 'effects' && (
                <div className="ss-props-section">
                  <label className="ss-field-label">Aging & Effects</label>
                  <label className="ss-field-label">Main Color</label>
                  <div className="ss-color-dots">
                    {COLORS.map(c => <ColorDot key={c.value} color={c.value} active={config.borderColor === c.value} onClick={() => upd({ 
                      borderColor: c.value, 
                      secondaryColor: c.value, 
                      innerTextColor: c.value, 
                      primaryColor: c.value, 
                      innerTopColor: c.value, 
                      innerBottomColor: c.value, 
                      centerColor: c.value, 
                      centerSubColor: c.value
                    })} />)}
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <Toggle label="Vintage Mode" value={!!config.isVintage} onChange={v => upd({ isVintage: v })} />
                    <Toggle label="Wet Ink Effect" value={!!config.wetInk} onChange={v => upd({ wetInk: v })} />
                  </div>
                  <CompactSlider label="Distress Level" value={Math.round(config.distressLevel * 100)} min={0} max={100} onChange={v => upd({ distressLevel: v / 100 })} unit="%" />
                </div>
              )}

              {/* ── ADVANCED TAB ── */}
              {(rightTab === 'advanced' || rightTab === 'preview') && (
                <div className="ss-props-section">
                  <label className="ss-field-label">Typography</label>
                  <CompactSlider label="Base Font Size" value={config.fontSize} min={10} max={60} onChange={v => upd({ fontSize: v })} unit="px" />
                  <CompactSlider label="Letter Stretch" value={Math.round(config.letterStretch * 100)} min={50} max={200} onChange={v => upd({ letterStretch: v / 100 })} unit="%" />
                  <CompactSlider label="Stretch X" value={Math.round((config.stretchX || 1) * 100)} min={50} max={200} onChange={v => upd({ stretchX: v / 100 })} unit="%" />
                  <CompactSlider label="Stretch Y" value={Math.round((config.stretchY || 1) * 100)} min={50} max={200} onChange={v => upd({ stretchY: v / 100 })} unit="%" />

                  <label className="ss-field-label">Inner Text</label>
                  <CompactSlider label="Inner Text Size" value={config.innerTextSize || 14} min={8} max={40} onChange={v => upd({ innerTextSize: v })} unit="px" />
                  <CompactSlider label="Inner Intensity" value={Math.round((config.innerTextIntensity || 1) * 100)} min={10} max={100} onChange={v => upd({ innerTextIntensity: v / 100 })} unit="%" />

                  <label className="ss-field-label">Drag Axis Lock</label>
                  <div className="ss-border-style-row">
                    {(['none','horizontal','vertical'] as const).map(ax => (
                      <button key={ax} onClick={() => upd({ lockDragAxis: ax })}
                        className={`ss-border-btn ${config.lockDragAxis === ax ? 'active' : ''}`}>
                        {ax === 'none' ? 'Free' : ax.charAt(0).toUpperCase() + ax.slice(1)}
                      </button>
                    ))}
                  </div>
                  <label className="ss-field-label">Quick Actions</label>
                  <div className="ss-sig-buttons mb-4">
                    <button onClick={() => upd({ centerSubText: new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }).toUpperCase(), showDateLine: true })} 
                      className="ss-sig-btn"><Calendar size={12} /> Add Date</button>
                    {!isDigitizing ? (
                      <label className="ss-sig-btn cursor-pointer bg-blue-600/20 border-blue-500/50 hover:bg-blue-600/30 text-white font-bold animate-pulse shadow-[0_0_15px_rgba(31,111,235,0.3)]">
                        <Camera size={12} /> Digitize Stamp
                        <input ref={digitizerInputRef} type="file" accept="image/*" className="sr-only" onChange={handleDigitize} />
                      </label>
                    ) : (
                      <button className="ss-sig-btn opacity-50 cursor-not-allowed">
                        <span className="animate-spin text-[10px]">🌀</span> Digitizing...
                      </button>
                    )}
                  </div>

                  <div className="ss-divider my-4" />

                  <label className="ss-field-label">Custom Elements</label>
                  <div className="ss-sig-buttons">
                    <button onClick={() => addCustomElement('text')} className="ss-sig-btn"><Type size={12} /> Add Text</button>
                    <button onClick={() => addCustomElement('image')} className="ss-sig-btn"><ImageIcon size={12} /> Add Image</button>
                  </div>
                  {config.customElements.map(el => (
                    <div key={el.id} style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6, background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span className="ss-field-label" style={{ margin: 0 }}>{el.type === 'text' ? 'Text' : 'Image'} Element</span>
                        <button onClick={() => removeCustomElement(el.id)} style={{ color: '#e53e3e', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                      {el.type === 'text' && (
                        <input value={el.content} onChange={e => updateCustomElement(el.id, { content: e.target.value })} className="ss-text-input" />
                      )}
                      {el.type === 'image' && (
                        <label className="ss-upload-area" style={{ padding: 10 }}>
                          <ImageIcon size={16} /> Replace Image
                          <input type="file" accept="image/*" className="sr-only" onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) { const r = new FileReader(); r.onloadend = () => updateCustomElement(el.id, { content: r.result as string }); r.readAsDataURL(f); }
                          }} />
                        </label>
                      )}
                      <CompactSlider label="Scale" value={Math.round((el.scale || 1) * 100)} min={10} max={300} onChange={v => updateCustomElement(el.id, { scale: v / 100 })} unit="%" />
                      <CompactSlider label="Rotation" value={el.rotation || 0} min={-180} max={180} step={5} onChange={v => updateCustomElement(el.id, { rotation: v })} unit="°" />
                    </div>
                  ))}

                  <select value={config.fontFamily} onChange={e => upd({ fontFamily: e.target.value })} className="ss-font-select" style={{ width: '100%' }}>
                    {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                  </select>

                  <div className="pt-4 mt-4 border-t border-white/10">
                    <label className="ss-field-label">Serial Numbering</label>
                    <Toggle label="Enable Serialization" value={!!config.serialConfig?.enabled} 
                      onChange={v => upd({ serialConfig: { ...config.serialConfig, enabled: v, targetField: config.serialConfig?.targetField || 'center' } })} />
                    
                    {config.serialConfig?.enabled && (
                      <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] block mb-1.5">Format</label>
                          <input 
                            value={config.serialConfig?.format || 'STP-{YYYY}-{NNNN}'} 
                            onChange={e => upd({ serialConfig: { ...config.serialConfig, format: e.target.value, enabled: true, targetField: config.serialConfig?.targetField || 'center' } })}
                            placeholder="STP-{YYYY}-{NNNN}"
                            className="ss-text-input w-full"
                          />
                          <p className="text-[9px] text-[#8b949e] mt-1">Use [SN] as placeholder in text field. Format: {`{YYYY}, {MM}, {DD}, {NNNN}`}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] block mb-1.5">Target Field</label>
                          <select 
                            value={config.serialConfig?.targetField || 'center'} 
                            onChange={e => upd({ serialConfig: { ...config.serialConfig, targetField: e.target.value as any, enabled: true, format: config.serialConfig?.format || 'STP-{YYYY}-{NNNN}' } })}
                            className="ss-font-select w-full"
                          >
                            <option value="primary">Primary (Top)</option>
                            <option value="secondary">Secondary (Bottom)</option>
                            <option value="center">Center (Main)</option>
                            <option value="centerSub">Center Sub (Date)</option>
                            <option value="innerTop">Inner Top</option>
                            <option value="innerBottom">Inner Bottom</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── PREVIEW BG TAB ── */}
              {rightTab === 'preview' && (
                <div className="ss-props-section">
                  <label className="ss-field-label">Preview Background</label>
                  <div className="ss-shape-grid">
                    {[{id:'default',label:'Blue'},{id:'white',label:'White'},{id:'paper',label:'Paper'},{id:'transparent',label:'Clear'}].map(bg => (
                      <button key={bg.id} onClick={() => upd({ previewBg: bg.id as any })}
                        className={`ss-shape-btn ${config.previewBg === bg.id ? 'active' : ''}`}>
                        {bg.label}
                      </button>
                    ))}
                  </div>
                  <label className="ss-field-label">Export Format</label>
                  <div className="ss-border-style-row">
                    <button onClick={() => withPaywallGuard(exportPNG)} className="ss-border-btn active">PNG</button>
                    <button onClick={() => withPaywallGuard(exportSVG)} className="ss-border-btn">SVG</button>
                    <button onClick={() => withPaywallGuard(exportPDF)} className="ss-border-btn">PDF</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── BOTTOM TOOLBAR ─── */}
        <div className="ss-footer">
          <div className="ss-footer-icons">
            <button className="ss-footer-icon-btn" onClick={() => setRightTab('preview')} title="Preview"><Eye size={16} /></button>
            <button className="ss-footer-icon-btn" onClick={() => setRightTab('effects')} title="Effects"><Sparkles size={16} /></button>
            <button className="ss-footer-icon-btn" onClick={() => upd({ rotation: 0 })} title="Reset Rotation"><RotateCcw size={16} /></button>
            <button className="ss-footer-icon-btn" onClick={() => setShowSettingsMenu(!showSettingsMenu)} title="Settings"><Settings size={16} /></button>
            <button className="ss-footer-icon-btn" onClick={() => withPaywallGuard(apply)} title="Apply"><Check size={16} /></button>
          </div>
          <div className="ss-footer-center">
            <span className="ss-plate-label">Plate size:</span>
            <input type="number" value={Math.round(config.width / 15.75)}
              onChange={e => { const mm = parseInt(e.target.value) || 38; upd({ width: Math.round(mm * 15.75), height: Math.round(mm * 15.75) }); }}
              className="ss-plate-input" />
            <span className="ss-plate-unit">/mm</span>
          </div>
          <div className="ss-footer-right">
            <div className="ss-download-icons">
                <button onClick={() => withPaywallGuard(exportSVG)} className="ss-format-btn" title="Download SVG">SVG</button>
                <button onClick={() => withPaywallGuard(exportPNG)} className="ss-format-btn" title="Download PNG">PNG</button>
                <button onClick={() => withPaywallGuard(exportJPEG)} className="ss-format-btn" title="Download JPEG">JPG</button>
                <button onClick={() => withPaywallGuard(exportPDF)} className="ss-format-btn" title="Download PDF">PDF</button>
            </div>
          </div>
        </div>
      </div>

      {showSignPad && <SignaturePad onSave={url => { upd({ embeddedSignatureUrl: url }); setShowSignPad(false); }} onCancel={() => setShowSignPad(false)} />}

      {/* ── Save Template Modal ── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1c2128] rounded-3xl border border-[#30363d] p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Save Template</h3>
            <p className="text-sm text-[#8b949e] mb-6">Enter a name to save this design to your cloud template library.</p>
            <input 
              type="text" 
              value={templateName} 
              onChange={e => setTemplateName(e.target.value)}
              placeholder="e.g., Official Company Seal" 
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white outline-none focus:border-[#58a6ff] mb-6"
              autoFocus
            />
            
            <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-3 block">Template Category</label>
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button 
                onClick={() => setTemplateType('sample')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${templateType === 'sample' ? 'bg-[#1f6feb]/20 border-[#1f6feb] text-white shadow-[0_0_15px_rgba(31,111,235,0.2)]' : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#1f6feb]'}`}
              >
                <Pen size={18} />
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase">Sample</p>
                  <p className="text-[9px] opacity-60">Design base</p>
                </div>
              </button>
              <button 
                onClick={() => setTemplateType('completed')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${templateType === 'completed' ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#emerald-500]'}`}
              >
                <CheckCircle2 size={18} />
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase">Completed</p>
                  <p className="text-[9px] opacity-60">Ready to use</p>
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-3 text-[#8b949e] font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (templateName.trim()) {
                    handleRemoteSave(templateName.trim(), templateType);
                    setShowSaveModal(false);
                  }
                }}
                disabled={!templateName.trim() || isSaving}
                className="flex-1 py-3 bg-[#1f6feb] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#388bfd] rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <span className="animate-spin text-[10px]">⏳</span> : null}
                {isSaving ? 'Saving...' : 'Save Design'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DATE CONFIRMATION MODAL ─── */}
      {showDateConfirm && (
        <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a1b1e] rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-gray-200 dark:border-[#373a40] transform animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 dark:text-white">Verify Date</h3>
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
              This design contains a date field. Would you like to use today's date or keep the current one?
            </p>
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="date" 
                  id="date-prompt-input"
                  defaultValue={new Date().toISOString().split('T')[0]} 
                  className="w-full p-3 bg-gray-50 dark:bg-[#25262b] border border-gray-200 dark:border-[#373a40] rounded-xl text-sm dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => {
                    const d = document.getElementById('date-prompt-input') as HTMLInputElement;
                    const val = d?.value ? new Date(d.value).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }).toUpperCase() : '';
                    updateApplyWithDate(val);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Update & Apply
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => updateApplyWithDate()}
                    className="py-2.5 bg-gray-100 dark:bg-[#2c2e33] hover:bg-gray-200 dark:hover:bg-[#373a40] text-gray-700 dark:text-gray-300 rounded-xl font-medium text-xs transition-colors"
                  >
                    Keep Existing
                  </button>
                  <button 
                    onClick={() => setShowDateConfirm(false)}
                    className="py-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-medium text-xs underline underline-offset-4"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StampStudio;
