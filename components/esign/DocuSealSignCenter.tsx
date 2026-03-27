import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText, Upload, Plus, Send, CheckCircle2, Trash2, PenTool,
  Calendar, Type, X, Save, Eraser, Stamp, Image as ImageIcon,
  ChevronLeft, UserPlus, Hash, ChevronRight, Check, ZoomIn, ZoomOut,
  GripHorizontal, Edit3, RotateCcw, Download, Eye, Settings
} from 'lucide-react';
import { Envelope, SignField, FieldType, BulkDocument, StampConfig, SignerInfo, AuditEntry } from '../../types';
import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/* ─── TYPES ──────────────────────────────────────────────── */
interface Props {
  stampConfig: StampConfig;
  onOpenStudio?: (fieldId?: string) => void;
  pendingStampFieldId?: string | null;
  onClearPendingField?: () => void;
  isActive?: boolean;
}
type View = 'dashboard' | 'editor';

const FIELD_TYPES = [
  { type: 'signature' as FieldType, label: 'Signature', icon: <PenTool size={13}/>,   color: '#1f6feb', bg: 'rgba(31,111,235,0.08)' },
  { type: 'initials'  as FieldType, label: 'Initials',  icon: <Hash size={13}/>,       color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  { type: 'date'      as FieldType, label: 'Date',       icon: <Calendar size={13}/>,   color: '#059669', bg: 'rgba(5,150,105,0.08)'  },
  { type: 'text'      as FieldType, label: 'Text',       icon: <Type size={13}/>,        color: '#d97706', bg: 'rgba(217,119,6,0.08)'  },
  { type: 'stamp'     as FieldType, label: 'Stamp',      icon: <Stamp size={13}/>,       color: '#dc2626', bg: 'rgba(220,38,38,0.08)'  },
];
const SIGNER_COLORS = ['#1f6feb','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];

/* ─── SIGNATURE PAD MODAL ────────────────────────────────── */
function SigModal({ label='Signature', onSave, onCancel, stampConfig }: {
  label?: string; onSave: (v:string) => void; onCancel: () => void; stampConfig?: StampConfig;
}) {
  const isStamp = label.toLowerCase().includes('stamp');
  const [tab, setTab] = useState<'draw'|'type'|'upload'|'stamp'>(isStamp ? 'stamp' : 'draw');
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [typed, setTyped] = useState('');
  const [strokeColor, setStrokeColor] = useState('#1a237e');
  const [strokeWidth, setStrokeWidth] = useState(2.5);
  const FONTS = [
    { name:'Script',  family:"'Dancing Script', cursive" },
    { name:'Elegant', family:"'Great Vibes', cursive" },
    { name:'Bold',    family:"Georgia, serif" },
    { name:'Print',   family:"Arial, sans-serif" },
  ];
  const [font, setFont] = useState(FONTS[0].family);
  // Custom stamp text for the stamp editor
  const [stampLine1, setStampLine1] = useState(stampConfig?.primaryText || 'OFFICIAL STAMP');
  const [stampLine2, setStampLine2] = useState(stampConfig?.centerText  || '');
  const [stampLine3, setStampLine3] = useState('');
  const [stampShape, setStampShape] = useState<'circle'|'rect'|'rounded'>('circle');
  const [stampColor, setStampColor] = useState('#1f6feb');

  useEffect(() => {
    if (tab !== 'draw') return;
    const ctx = ref.current?.getContext('2d');
    if (ctx) { ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeWidth; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
  }, [tab, strokeColor, strokeWidth]);

  const getPos = (e: any, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    return { x:(s.clientX-r.left)*(c.width/r.width), y:(s.clientY-r.top)*(c.height/r.height) };
  };
  const startDraw = (e:any) => { e.preventDefault(); drawing.current=true; const c=ref.current!; const p=getPos(e,c); const ctx=c.getContext('2d')!; ctx.strokeStyle=strokeColor; ctx.lineWidth=strokeWidth; ctx.beginPath(); ctx.moveTo(p.x,p.y); };
  const onDraw    = (e:any) => { e.preventDefault(); if(!drawing.current) return; const c=ref.current!; const ctx=c.getContext('2d')!; const p=getPos(e,c); ctx.lineTo(p.x,p.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x,p.y); };
  const stopDraw  = () => { drawing.current=false; };
  const clearDraw = () => { const c=ref.current!; c.getContext('2d')!.clearRect(0,0,c.width,c.height); };

  const applyTyped = () => {
    if (!typed.trim()) return;
    const c=document.createElement('canvas'); c.width=600; c.height=180;
    const ctx=c.getContext('2d')!;
    ctx.clearRect(0,0,600,180);
    ctx.font=`bold 64px ${font}`; ctx.fillStyle=strokeColor;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(typed,300,90);
    onSave(c.toDataURL('image/png'));
  };

  const applyStamp = () => {
    const c=document.createElement('canvas'); c.width=300; c.height=300;
    const ctx=c.getContext('2d')!;
    ctx.clearRect(0,0,300,300);
    ctx.strokeStyle=stampColor; ctx.fillStyle='transparent';
    ctx.lineWidth=4;
    if(stampShape==='circle'){
      ctx.beginPath(); ctx.arc(150,150,130,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(150,150,112,0,Math.PI*2); ctx.stroke();
    } else if(stampShape==='rect'){
      ctx.strokeRect(20,60,260,180);
      ctx.strokeRect(26,66,248,168);
    } else {
      const r=16;
      ctx.beginPath(); ctx.roundRect(20,60,260,180,r); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(26,66,248,168,r-4); ctx.stroke();
    }
    ctx.fillStyle=stampColor; ctx.textAlign='center'; ctx.textBaseline='middle';
    if(stampLine1){ ctx.font=`bold 28px Arial`; ctx.fillText(stampLine1.toUpperCase(),150,120); }
    if(stampLine2){ ctx.font=`20px Arial`; ctx.fillText(stampLine2,150,155); }
    if(stampLine3){ ctx.font=`16px Arial`; ctx.fillText(stampLine3,150,185); }
    onSave(c.toDataURL('image/png'));
  };

  const handleUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const f=e.target.files?.[0]; if(!f) return;
    const r=new FileReader(); r.onload=ev=>onSave(ev.target?.result as string); r.readAsDataURL(f);
  };

  const tabs = isStamp
    ? [['stamp','🖋 Design Stamp'],['upload','Upload Image']]
    : [['draw','Draw'],['type','Type'],['upload','Upload']];

  return (
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-900 text-base">{isStamp ? '🖋 Design Your Stamp' : `✍️ ${label}`}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{isStamp ? 'Create or customize your official stamp' : 'Draw, type, or upload'}</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-xl text-gray-500"><X size={18}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map(([t,l]) => (
            <button key={t} onClick={()=>setTab(t as any)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-all border-b-2 ${tab===t?'border-[#1f6feb] text-[#1f6feb]':'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* DRAW */}
          {tab==='draw' && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1.5">
                  {['#1a237e','#000000','#1b5e20','#7b0000'].map(c=>(
                    <button key={c} onClick={()=>setStrokeColor(c)} className={`w-6 h-6 rounded-full border-2 transition-all ${strokeColor===c?'border-gray-400 scale-110':'border-transparent'}`} style={{background:c}}/>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-xs text-gray-400">Thickness</span>
                  <input type="range" min="1" max="6" step="0.5" value={strokeWidth} onChange={e=>setStrokeWidth(+e.target.value)} className="w-20 accent-[#1f6feb]"/>
                </div>
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50 touch-none" style={{height:160}}>
                <canvas ref={ref} width={580} height={160}
                  onMouseDown={startDraw} onMouseUp={stopDraw} onMouseLeave={stopDraw} onMouseMove={onDraw}
                  onTouchStart={startDraw} onTouchEnd={stopDraw} onTouchMove={onDraw}
                  className="w-full h-full cursor-crosshair"/>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={clearDraw} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5"><Eraser size={14}/>Clear</button>
                <button onClick={()=>ref.current&&onSave(ref.current.toDataURL('image/png'))} className="flex-1 py-2.5 bg-[#1f6feb] text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-1.5"><Check size={14}/>Apply Signature</button>
              </div>
            </div>
          )}

          {/* TYPE */}
          {tab==='type' && (
            <div>
              <input autoFocus type="text" value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Type your full name…"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-[#1f6feb] mb-3"
                style={{fontFamily:font, fontSize:28}}/>
              <div className="flex gap-2 mb-3 flex-wrap">
                {FONTS.map(f=>(
                  <button key={f.name} onClick={()=>setFont(f.family)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${font===f.family?'border-[#1f6feb] bg-blue-50 text-[#1f6feb]':'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    style={{fontFamily:f.family}}>{f.name}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-3">
                {['#1a237e','#000000','#1b5e20'].map(c=>(
                  <button key={c} onClick={()=>setStrokeColor(c)} className={`w-6 h-6 rounded-full border-2 ${strokeColor===c?'border-gray-400 scale-110':'border-transparent'}`} style={{background:c}}/>
                ))}
              </div>
              <button onClick={applyTyped} disabled={!typed.trim()} className="w-full py-2.5 bg-[#1f6feb] text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-30 flex items-center justify-center gap-1.5"><Check size={14}/>Apply Signature</button>
            </div>
          )}

          {/* UPLOAD */}
          {tab==='upload' && (
            <label className="block border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-[#1f6feb] hover:bg-blue-50 transition-all">
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden"/>
              <ImageIcon size={36} className="text-gray-300 mx-auto mb-3"/>
              <p className="text-sm font-semibold text-gray-600">Click to upload image</p>
              <p className="text-xs text-gray-400 mt-1">PNG with transparent background recommended</p>
            </label>
          )}

          {/* STAMP DESIGNER */}
          {tab==='stamp' && (
            <div className="space-y-4">
              {/* Live preview */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center border border-gray-100" style={{height:140}}>
                <svg viewBox="0 0 300 300" width="120" height="120">
                  {stampShape==='circle' && <>
                    <circle cx="150" cy="150" r="130" fill="none" stroke={stampColor} strokeWidth="5"/>
                    <circle cx="150" cy="150" r="112" fill="none" stroke={stampColor} strokeWidth="2"/>
                  </>}
                  {stampShape==='rect' && <>
                    <rect x="15" y="55" width="270" height="190" fill="none" stroke={stampColor} strokeWidth="5"/>
                    <rect x="22" y="62" width="256" height="176" fill="none" stroke={stampColor} strokeWidth="2"/>
                  </>}
                  {stampShape==='rounded' && <>
                    <rect x="15" y="55" width="270" height="190" rx="18" fill="none" stroke={stampColor} strokeWidth="5"/>
                    <rect x="22" y="62" width="256" height="176" rx="14" fill="none" stroke={stampColor} strokeWidth="2"/>
                  </>}
                  {stampLine1 && <text x="150" y="125" textAnchor="middle" fontSize="26" fontWeight="bold" fill={stampColor} fontFamily="Arial">{stampLine1.toUpperCase()}</text>}
                  {stampLine2 && <text x="150" y="158" textAnchor="middle" fontSize="19" fill={stampColor} fontFamily="Arial">{stampLine2}</text>}
                  {stampLine3 && <text x="150" y="186" textAnchor="middle" fontSize="15" fill={stampColor} fontFamily="Arial">{stampLine3}</text>}
                </svg>
              </div>
              {/* Shape */}
              <div className="flex gap-2">
                {(['circle','rect','rounded'] as const).map(s=>(
                  <button key={s} onClick={()=>setStampShape(s)} className={`flex-1 py-2 rounded-lg border text-xs font-semibold capitalize transition-all ${stampShape===s?'border-[#1f6feb] bg-blue-50 text-[#1f6feb]':'border-gray-200 text-gray-500'}`}>{s}</button>
                ))}
              </div>
              {/* Color */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-10">Color</span>
                {['#1f6feb','#dc2626','#059669','#7c3aed','#000000'].map(c=>(
                  <button key={c} onClick={()=>setStampColor(c)} className={`w-7 h-7 rounded-full border-2 transition-all ${stampColor===c?'border-gray-400 scale-110':'border-white'}`} style={{background:c}}/>
                ))}
              </div>
              {/* Text lines */}
              <input value={stampLine1} onChange={e=>setStampLine1(e.target.value)} placeholder="Line 1 (main text)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1f6feb]"/>
              <input value={stampLine2} onChange={e=>setStampLine2(e.target.value)} placeholder="Line 2 (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1f6feb]"/>
              <input value={stampLine3} onChange={e=>setStampLine3(e.target.value)} placeholder="Line 3 (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1f6feb]"/>
              <button onClick={applyStamp} className="w-full py-2.5 bg-[#1f6feb] text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-1.5"><Check size={14}/>Apply Stamp</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── TEXT INPUT MODAL ───────────────────────────────────── */
function TextModal({ onSave, onCancel }: { onSave:(v:string)=>void; onCancel:()=>void }) {
  const [val, setVal] = useState('');
  return (
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Enter Text</h3>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16}/></button>
        </div>
        <textarea autoFocus rows={3} value={val} onChange={e=>setVal(e.target.value)} placeholder="Type here…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm resize-none outline-none focus:ring-2 focus:ring-[#1f6feb] mb-4"/>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
          <button onClick={()=>val.trim()&&onSave(val.trim())} disabled={!val.trim()}
            className="flex-1 py-2.5 bg-[#1f6feb] text-white rounded-xl text-sm font-semibold disabled:opacity-30 flex items-center justify-center gap-1.5"><Check size={14}/>Apply</button>
        </div>
      </div>
    </div>
  );
}

/* ─── DATE MODAL ─────────────────────────────────────────── */
function DateModal({ onSave, onCancel }: { onSave:(v:string)=>void; onCancel:()=>void }) {
  const [val, setVal] = useState(new Date().toISOString().split('T')[0]);
  const fmt = (iso:string) => { const d=new Date(iso); return isNaN(d.getTime())?iso:d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); };
  return (
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Select Date</h3>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16}/></button>
        </div>
        <input type="date" value={val} onChange={e=>setVal(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm outline-none focus:ring-2 focus:ring-[#1f6feb] mb-2"/>
        {val && <p className="text-center text-lg font-bold text-green-600 mb-4">{fmt(val)}</p>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
          <button onClick={()=>onSave(fmt(val))} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"><Check size={14}/>Apply</button>
        </div>
      </div>
    </div>
  );
}

/* ─── DOCUMENT EDITOR (main workspace) ───────────────────── */
function DocEditor({
  envelope, stampConfig, onUpdate, onBack, onOpenStudio
}: {
  envelope: Envelope; stampConfig: StampConfig;
  onUpdate:(e:Envelope)=>void; onBack:()=>void; onOpenStudio?:(id?:string)=>void;
}) {
  const [env, setEnv] = useState<Envelope>(envelope);
  const [activeTool, setActiveTool] = useState<FieldType|null>(null);
  const [activeSigner, setActiveSigner] = useState<string>(envelope.signers[0]?.id || 'self');
  const [zoom, setZoom] = useState(1.0);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy|null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedField, setSelectedField] = useState<string|null>(null);
  const [dragging, setDragging] = useState<{id:string;ox:number;oy:number}|null>(null);
  const [resizing, setResizing] = useState<{id:string;startX:number;startY:number;startW:number;startH:number}|null>(null);
  // Modal state
  const [modal, setModal] = useState<{fieldId:string;type:FieldType}|null>(null);
  // Signer panel
  const [showSigners, setShowSigners] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const pageRef = useRef<HTMLDivElement>(null);

  // Ensure "Me" signer always exists
  useEffect(() => {
    if (!env.signers.find(s=>s.id==='self')) {
      const me: SignerInfo = {id:'self',name:'Me (Self)',email:'',role:'signer',order:1,status:'pending'};
      const updated = {...env, signers:[me,...env.signers]};
      setEnv(updated); onUpdate(updated);
    }
    if (!activeSigner) setActiveSigner('self');
  }, []);

  const upd = (patch: Partial<Envelope>) => {
    const updated = {...env,...patch,updatedAt:new Date().toISOString()};
    setEnv(updated); onUpdate(updated);
  };

  const renderPage = useCallback(async (doc: pdfjs.PDFDocumentProxy, pageNum:number, z=zoom) => {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({scale:1.5*z});
    const canvas = document.createElement('canvas');
    canvas.width=viewport.width; canvas.height=viewport.height;
    await page.render({canvasContext:canvas.getContext('2d')!,viewport}).promise;
    return canvas.toDataURL();
  },[zoom]);

  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc,currentPage,zoom).then(url=>setPdfPages([url]));
  },[pdfDoc,currentPage,zoom]);

  const handleFile = async (file: File) => {
    const doc: BulkDocument = {id:Math.random().toString(36).slice(2),name:file.name,type:file.type,size:file.size,pages:1};
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      if (file.type==='application/pdf') {
        try {
          const ab = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument(ab).promise;
          setPdfDoc(pdf); doc.pages=pdf.numPages;
          const url = await renderPage(pdf,1,zoom);
          setPdfPages([url]); doc.previewUrl=url;
        } catch { setPdfPages([dataUrl]); doc.previewUrl=dataUrl; }
      } else { setPdfPages([dataUrl]); doc.previewUrl=dataUrl; }
      const title = env.title==='Untitled Document'?file.name.replace(/\.[^/.]+$/,''):env.title;
      upd({documents:[doc],title});
    };
    reader.readAsDataURL(file);
  };

  // Place field on click
  const placeField = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeTool || !pageRef.current || dragging || resizing) return;
    const rect = pageRef.current.getBoundingClientRect();
    const x = ((e.clientX-rect.left)/rect.width)*100;
    const y = ((e.clientY-rect.top)/rect.height)*100;
    const w = activeTool==='signature'?22:activeTool==='stamp'?16:12;
    const h = activeTool==='signature'?7:activeTool==='stamp'?16:5;
    const field: SignField = {
      id: Math.random().toString(36).slice(2),
      type: activeTool, x:Math.max(0,Math.min(x,100-w)),
      y: Math.max(0,Math.min(y,100-h)), width:w, height:h,
      page: currentPage, signerId: activeSigner
    };
    upd({fields:[...env.fields,field]});
    setSelectedField(field.id);
    setActiveTool(null);
    // Immediately open the modal so user can sign right away
    setModal({fieldId:field.id, type:activeTool});
  };

  // Drag
  const onFieldDown = (e:React.MouseEvent, id:string) => {
    e.stopPropagation();
    setSelectedField(id);
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const field = env.fields.find(f=>f.id===id)!;
    setDragging({id, ox:e.clientX-(field.x/100)*rect.width, oy:e.clientY-(field.y/100)*rect.height});
  };
  const onResizeDown = (e:React.MouseEvent, id:string) => {
    e.stopPropagation();
    const f = env.fields.find(f=>f.id===id)!;
    setResizing({id,startX:e.clientX,startY:e.clientY,startW:f.width||20,startH:f.height||6});
  };
  const onMouseMove = (e:React.MouseEvent) => {
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    if (dragging) {
      const f = env.fields.find(f=>f.id===dragging.id)!;
      const nx = ((e.clientX-dragging.ox)/rect.width)*100;
      const ny = ((e.clientY-dragging.oy)/rect.height)*100;
      const w=f.width||20; const h=f.height||6;
      upd({fields:env.fields.map(f=>f.id===dragging.id?{...f,x:Math.max(0,Math.min(nx,100-w)),y:Math.max(0,Math.min(ny,100-h))}:f)});
    }
    if (resizing) {
      const dx=e.clientX-resizing.startX; const dy=e.clientY-resizing.startY;
      const nw=Math.max(6,resizing.startW+(dx/rect.width)*100);
      const nh=Math.max(3,resizing.startH+(dy/rect.height)*100);
      upd({fields:env.fields.map(f=>f.id===resizing.id?{...f,width:Math.min(nw,80),height:Math.min(nh,40)}:f)});
    }
  };
  const onMouseUp = () => { setDragging(null); setResizing(null); };

  // Apply a value to a field
  const applyFieldValue = (fieldId:string, value:string) => {
    upd({fields:env.fields.map(f=>f.id===fieldId?{...f,value,isCompleted:true}:f)});
    setModal(null);
  };

  // Click on an existing completed/uncompleted field — open pad
  const onFieldClick = (e:React.MouseEvent, field:SignField) => {
    e.stopPropagation();
    if (dragging || resizing) return;
    setSelectedField(field.id);
    setModal({fieldId:field.id, type:field.type});
  };

  const addSigner = () => {
    if (!newEmail.trim()) return;
    const s:SignerInfo={id:Math.random().toString(36).slice(2),name:newName,email:newEmail,role:'signer',order:env.signers.length+1,status:'pending'};
    upd({signers:[...env.signers,s]});
    setNewName(''); setNewEmail(''); setActiveSigner(s.id);
  };

  const removeField = (id:string) => { upd({fields:env.fields.filter(f=>f.id!==id)}); setSelectedField(null); };

  const downloadDoc = async () => {
    const { PDFDocument, rgb } = await import('pdf-lib');
    const doc = env.documents[0]; if (!doc?.previewUrl) return;
    const pdfDoc2 = await PDFDocument.create();
    const page = pdfDoc2.addPage([595,842]);
    // Embed page image
    try {
      const imgBytes = await fetch(doc.previewUrl).then(r=>r.arrayBuffer());
      const img = doc.previewUrl.includes('jpeg')||doc.previewUrl.includes('jpg')
        ? await pdfDoc2.embedJpg(imgBytes) : await pdfDoc2.embedPng(imgBytes);
      page.drawImage(img,{x:0,y:0,width:595,height:842});
    } catch {}
    // Embed fields
    for (const field of env.fields) {
      if (!field.isCompleted || !field.value) continue;
      const x = (field.x/100)*595; const y = 842-(field.y/100)*842;
      if (field.value.startsWith('data:image')) {
        try {
          const base64 = field.value.split(',')[1];
          const bytes = Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
          const img = field.value.includes('png')?await pdfDoc2.embedPng(bytes.buffer):await pdfDoc2.embedJpg(bytes.buffer);
          const w=(field.width||20)/100*595; const h=(field.height||8)/100*842;
          page.drawImage(img,{x,y:y-h,width:w,height:h});
        } catch {}
      } else {
        page.drawText(field.value,{x,y:y-12,size:11,color:rgb(0,0,0.5)});
      }
    }
    const bytes = await pdfDoc2.save();
    const blob = new Blob([bytes],{type:'application/pdf'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${env.title}_signed.pdf`; a.click();
  };

  const myFields = env.fields.filter(f=>f.page===currentPage);
  const allSigned = env.fields.length>0 && env.fields.every(f=>f.isCompleted);
  const mySigner = env.signers.find(s=>s.id===activeSigner);

  return (
    <div className="flex flex-col h-full bg-[#0d1117]" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      {/* Top toolbar — DocuSign style */}
      <div className="h-14 bg-[#161b22] border-b border-[#30363d] flex items-center px-4 gap-3 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[#8b949e] hover:text-white text-sm transition-colors">
          <ChevronLeft size={16}/> Back
        </button>
        <div className="h-5 w-px bg-[#30363d]"/>
        <input value={env.title} onChange={e=>upd({title:e.target.value})}
          className="text-sm font-semibold text-white bg-transparent border-none focus:outline-none max-w-[200px]"/>
        <div className="ml-auto flex items-center gap-2">
          {allSigned && (
            <button onClick={downloadDoc} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors">
              <Download size={13}/> Download Signed
            </button>
          )}
          <button onClick={()=>setShowSigners(!showSigners)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${showSigners?'bg-[#1f6feb] text-white border-[#1f6feb]':'border-[#30363d] text-[#8b949e] hover:text-white'}`}>
            <Settings size={13}/> Signers ({env.signers.length})
          </button>
          <button onClick={()=>upd({})} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f6feb] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">
            <Save size={13}/> Save
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Field tool palette */}
        <div className="w-48 bg-[#161b22] border-r border-[#30363d] flex flex-col gap-1 p-3 flex-shrink-0 overflow-y-auto">
          <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-2 px-1">Add Fields</p>

          {/* Signer selector */}
          <div className="mb-2">
            <p className="text-[9px] font-bold text-[#8b949e] uppercase tracking-widest mb-1 px-1">Signer</p>
            <select value={activeSigner} onChange={e=>setActiveSigner(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs font-semibold text-white outline-none focus:ring-1 focus:ring-[#1f6feb]">
              {env.signers.map((s,i)=>(
                <option key={s.id} value={s.id} className="bg-[#161b22]">{s.name||s.email||`Signer ${i+1}`}</option>
              ))}
            </select>
          </div>

          {/* Field type buttons */}
          {FIELD_TYPES.map(ft => (
            <button key={ft.type} onClick={()=>setActiveTool(activeTool===ft.type?null:ft.type)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                activeTool===ft.type
                  ? 'border-[#1f6feb] bg-[#1f6feb]/10 text-[#58a6ff]'
                  : 'border-transparent text-[#8b949e] hover:bg-[#21262d] hover:text-white'
              }`}>
              <span style={{color:activeTool===ft.type?ft.color:undefined}}>{ft.icon}</span>
              {ft.label}
            </button>
          ))}

          {activeTool && (
            <div className="mt-2 px-2 py-2 bg-[#1f6feb]/10 rounded-lg border border-[#1f6feb]/30">
              <p className="text-[9px] font-bold text-[#58a6ff] uppercase tracking-widest">Click document to place</p>
            </div>
          )}

          <div className="border-t border-[#30363d] mt-3 pt-3">
            <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-2 px-1">Zoom</p>
            <div className="flex items-center gap-1">
              <button onClick={()=>setZoom(z=>Math.max(0.5,z-0.25))} className="p-1.5 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-lg transition-colors"><ZoomOut size={13}/></button>
              <span className="flex-1 text-center text-xs font-bold text-white">{Math.round(zoom*100)}%</span>
              <button onClick={()=>setZoom(z=>Math.min(2.5,z+0.25))} className="p-1.5 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-lg transition-colors"><ZoomIn size={13}/></button>
            </div>
          </div>

          {/* Page nav */}
          {pdfDoc && pdfDoc.numPages > 1 && (
            <div className="border-t border-[#30363d] mt-3 pt-3">
              <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-2 px-1">Page {currentPage}/{pdfDoc.numPages}</p>
              <div className="flex gap-1">
                <button disabled={currentPage<=1} onClick={()=>setCurrentPage(p=>p-1)} className="flex-1 py-1.5 text-xs text-[#8b949e] hover:text-white border border-[#30363d] rounded-lg disabled:opacity-30 transition-colors">← Prev</button>
                <button disabled={currentPage>=pdfDoc.numPages} onClick={()=>setCurrentPage(p=>p+1)} className="flex-1 py-1.5 text-xs text-[#8b949e] hover:text-white border border-[#30363d] rounded-lg disabled:opacity-30 transition-colors">Next →</button>
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Document canvas */}
        <div className="flex-1 overflow-auto bg-[#21262d] flex items-start justify-center p-6"
          style={{cursor:activeTool?'crosshair':'default'}}>
          {env.documents.length===0 ? (
            <label className="bg-[#161b22] rounded-2xl border-2 border-dashed border-[#30363d] flex flex-col items-center justify-center w-full max-w-2xl cursor-pointer hover:border-[#1f6feb] transition-colors" style={{minHeight:700}}>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.docx" onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])} className="hidden"/>
              <Upload size={40} className="text-[#30363d] mb-4"/>
              <p className="text-[#8b949e] font-semibold text-lg">Drop or click to upload document</p>
              <p className="text-[#484f58] text-sm mt-2">PDF, PNG, JPG supported</p>
            </label>
          ) : (
            <div ref={pageRef} onClick={placeField} className="relative bg-white shadow-2xl flex-shrink-0"
              style={{width:`${800*zoom}px`,minHeight:`${1100*zoom}px`,cursor:activeTool?'crosshair':'default'}}>

              {/* Document image */}
              {pdfPages[0] ? (
                <img src={pdfPages[0]} alt="Document" className="w-full h-auto pointer-events-none select-none block"/>
              ) : (
                <div className="w-full flex flex-col items-center justify-center py-40">
                  <FileText size={64} className="text-gray-200 mb-4"/>
                  <p className="text-gray-500">{env.documents[0]?.name}</p>
                </div>
              )}

              {/* Field overlays */}
              {myFields.map(field => {
                const ft = FIELD_TYPES.find(f=>f.type===field.type)!;
                const signerIdx = env.signers.findIndex(s=>s.id===field.signerId);
                const color = SIGNER_COLORS[signerIdx % SIGNER_COLORS.length] || ft.color;
                const isSelected = selectedField===field.id;

                return (
                  <div key={field.id}
                    className="absolute select-none group"
                    style={{
                      left:`${field.x}%`, top:`${field.y}%`,
                      width:`${field.width||20}%`, height:`${field.height||6}%`,
                      minHeight:32, minWidth:60,
                      zIndex:isSelected?30:20,
                      cursor: dragging?.id===field.id?'grabbing':'grab'
                    }}
                    onMouseDown={e=>onFieldDown(e,field.id)}
                    onClick={e=>onFieldClick(e,field)}>

                    {field.isCompleted ? (
                      // COMPLETED — show value with NO background box, clean look
                      <div className="w-full h-full flex items-center justify-center relative">
                        {field.value?.startsWith('data:image') ? (
                          <img src={field.value} alt="signed"
                            className="max-w-full max-h-full object-contain"
                            style={{mixBlendMode:'multiply'}}/>
                        ) : (
                          <span className="text-sm font-semibold px-1"
                            style={{color:'#1a237e',fontFamily:field.type==='text'?'inherit':"'Dancing Script',cursive"}}>
                            {field.value}
                          </span>
                        )}
                        {/* Subtle edit hint on hover */}
                        <div className="absolute inset-0 border border-transparent group-hover:border-blue-300 group-hover:border-dashed rounded transition-all pointer-events-none"/>
                        {/* Edit button on hover */}
                        <button
                          onClick={e=>{e.stopPropagation();setModal({fieldId:field.id,type:field.type});}}
                          className="absolute -top-3 -right-3 w-5 h-5 bg-blue-500 text-white rounded-full items-center justify-center shadow z-30 hidden group-hover:flex">
                          <Edit3 size={9}/>
                        </button>
                        <button
                          onMouseDown={e=>e.stopPropagation()}
                          onClick={e=>{e.stopPropagation();removeField(field.id);}}
                          className="absolute -top-3 -left-3 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center shadow z-30 hidden group-hover:flex">
                          <X size={9}/>
                        </button>
                      </div>
                    ) : (
                      // EMPTY — show clickable placeholder
                      <div className="w-full h-full rounded-md border-2 border-dashed flex items-center justify-center transition-all hover:opacity-90"
                        style={{borderColor:color, backgroundColor:`${color}12`}}>
                        <div className="flex items-center gap-1.5 px-2">
                          <span style={{color}}>{ft.icon}</span>
                          <span className="text-[10px] font-bold whitespace-nowrap" style={{color}}>
                            {field.type==='signature'?'Click to sign':
                             field.type==='initials'?'Click to initial':
                             field.type==='stamp'?'Click to stamp':
                             field.type==='date'?'Click to date':
                             'Click to type'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Resize handle — always visible on selected */}
                    {(isSelected || !field.isCompleted) && (
                      <div onMouseDown={e=>{e.stopPropagation();onResizeDown(e,field.id);}}
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 rounded-sm cursor-se-resize z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{borderColor:color}}>
                        <GripHorizontal size={8} style={{color}}/>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Placement hint */}
              {activeTool && (
                <div className="absolute top-3 right-3 px-3 py-1.5 bg-gray-900/80 rounded-lg pointer-events-none">
                  <p className="text-xs font-semibold text-white">Click to place {activeTool} field</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Signers panel (collapsible) */}
        {showSigners && (
          <div className="w-64 bg-[#161b22] border-l border-[#30363d] flex flex-col p-4 gap-3 flex-shrink-0 overflow-y-auto">
            <p className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Signers</p>
            {env.signers.map((s,i)=>(
              <div key={s.id} onClick={()=>setActiveSigner(s.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${activeSigner===s.id?'border-[#1f6feb] bg-[#1f6feb]/10':'border-[#30363d] hover:border-[#58a6ff]/50'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{background:SIGNER_COLORS[i%SIGNER_COLORS.length]}}>
                    {(s.name||s.email||'?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{s.name||'Unnamed'}</p>
                    <p className="text-[10px] text-[#8b949e] truncate">{s.email||'No email'}</p>
                  </div>
                  {s.id!=='self' && (
                    <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();upd({signers:env.signers.filter(x=>x.id!==s.id),fields:env.fields.filter(f=>f.signerId!==s.id)});}}
                      className="ml-auto p-1 hover:text-red-400 text-[#8b949e]"><X size={12}/></button>
                  )}
                </div>
              </div>
            ))}
            {/* Add signer */}
            <div className="border-t border-[#30363d] pt-3 space-y-2">
              <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">Add Signer</p>
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Full name"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-[#1f6feb]"/>
              <input value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="Email address"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-[#1f6feb]"/>
              <button onClick={addSigner} disabled={!newEmail.trim()}
                className="w-full py-2 bg-[#1f6feb] text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-30 flex items-center justify-center gap-1.5 transition-colors">
                <UserPlus size={12}/> Add Signer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && modal.type==='signature' && (
        <SigModal label="Signature" stampConfig={stampConfig} onSave={v=>applyFieldValue(modal.fieldId,v)} onCancel={()=>setModal(null)}/>
      )}
      {modal && modal.type==='initials' && (
        <SigModal label="Initials" stampConfig={stampConfig} onSave={v=>applyFieldValue(modal.fieldId,v)} onCancel={()=>setModal(null)}/>
      )}
      {modal && modal.type==='stamp' && (
        <SigModal label="Stamp" stampConfig={stampConfig} onSave={v=>applyFieldValue(modal.fieldId,v)} onCancel={()=>setModal(null)}/>
      )}
      {modal && modal.type==='text' && (
        <TextModal onSave={v=>applyFieldValue(modal.fieldId,v)} onCancel={()=>setModal(null)}/>
      )}
      {modal && modal.type==='date' && (
        <DateModal onSave={v=>applyFieldValue(modal.fieldId,v)} onCancel={()=>setModal(null)}/>
      )}
    </div>
  );
}

/* ─── DASHBOARD ──────────────────────────────────────────── */
function Dashboard({ envelopes, onSelect, onCreate, onDelete }: {
  envelopes:Envelope[]; onSelect:(e:Envelope)=>void; onCreate:()=>void; onDelete:(id:string)=>void;
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const filtered = envelopes.filter(e=>(filter==='all'||e.status===filter)&&e.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Toho Sign</h1>
          <p className="text-sm text-[#8b949e] mt-1">Legally-binding electronic signatures</p>
        </div>
        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#1f6feb] text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus size={16}/> New Document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          {label:'Total',val:envelopes.length,color:'text-white'},
          {label:'Completed',val:envelopes.filter(e=>e.status==='completed').length,color:'text-emerald-400'},
          {label:'In Progress',val:envelopes.filter(e=>e.status==='draft').length,color:'text-blue-400'},
          {label:'Signed',val:envelopes.filter(e=>e.fields?.every(f=>f.isCompleted)).length,color:'text-purple-400'},
        ].map(s=>(
          <div key={s.label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-[10px] text-[#8b949e] uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents…"
          className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#1f6feb]"/>
        <div className="flex items-center gap-1 bg-[#161b22] border border-[#30363d] rounded-xl p-1">
          {['all','draft','completed'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter===f?'bg-[#21262d] text-white':'text-[#8b949e] hover:text-white'}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
        {filtered.length===0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <FileText size={48} className="text-[#30363d] mb-4"/>
            <p className="text-[#8b949e] font-medium">No documents yet</p>
            <button onClick={onCreate} className="mt-4 px-4 py-2 bg-[#1f6feb] text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">Create your first document</button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363d] bg-[#0d1117]">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">Document</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">Progress</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">Date</th>
                <th className="px-5 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d]">
              {filtered.map(env=>{
                const done = env.fields?.filter(f=>f.isCompleted).length||0;
                const total = env.fields?.length||0;
                return (
                  <tr key={env.id} onClick={()=>onSelect(env)} className="hover:bg-[#21262d]/50 cursor-pointer transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#21262d] rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-[#1f6feb]"/>
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{env.title}</p>
                          <p className="text-[10px] text-[#8b949e]">{env.signers.length} signer{env.signers.length!==1?'s':''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        env.status==='completed'?'bg-emerald-900/30 text-emerald-400 border-emerald-800':
                        env.status==='draft'?'bg-[#21262d] text-[#8b949e] border-[#30363d]':
                        'bg-blue-900/30 text-blue-400 border-blue-800'
                      }`}>{env.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      {total>0?(
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                            <div className="h-full bg-[#1f6feb] rounded-full transition-all" style={{width:`${(done/total)*100}%`}}/>
                          </div>
                          <span className="text-[10px] text-[#8b949e]">{done}/{total}</span>
                        </div>
                      ):<span className="text-[10px] text-[#8b949e]">No fields</span>}
                    </td>
                    <td className="px-5 py-4 text-xs text-[#8b949e]">
                      {new Date(env.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4" onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>onDelete(env.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={14} className="text-red-400"/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────── */
export default function TohoSignCenter({stampConfig,onOpenStudio}:Props) {
  const [view, setView] = useState<View>('dashboard');
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [active, setActive] = useState<Envelope|null>(null);

  const save = (env:Envelope) => setEnvelopes(es=>{const i=es.findIndex(e=>e.id===env.id);if(i>=0){const c=[...es];c[i]=env;return c;}return[env,...es];});

  const createNew = () => {
    const me:SignerInfo = {id:'self',name:'Me (Self)',email:'',role:'signer',order:1,status:'pending'};
    const env:Envelope = {
      id:Math.random().toString(36).slice(2,11), title:'Untitled Document', status:'draft',
      createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(),
      documents:[], signers:[me], fields:[],
      auditLog:[{id:Math.random().toString(36).slice(2),timestamp:new Date().toISOString(),action:'Document Created',user:'You',ip:'—',details:'New document created'}]
    };
    setActive(env); save(env); setView('editor');
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117] -m-5 md:-m-8" style={{minHeight:'calc(100vh - 56px)'}}>
      <nav className="h-14 bg-[#161b22] border-b border-[#30363d] px-5 flex items-center justify-between flex-shrink-0">
        <button onClick={()=>setView('dashboard')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 bg-[#1f6feb] rounded-lg flex items-center justify-center"><CheckCircle2 size={15} className="text-white"/></div>
          <span className="font-bold text-white text-sm">Toho Sign</span>
        </button>
        {view==='editor'&&active&&(
          <span className="text-xs text-[#8b949e] hidden sm:block">
            {active.fields.filter(f=>f.isCompleted).length}/{active.fields.length} fields completed
          </span>
        )}
      </nav>
      <main className="flex-1 overflow-hidden flex flex-col">
        {view==='dashboard' && (
          <div className="flex-1 overflow-y-auto">
            <Dashboard envelopes={envelopes} onSelect={env=>{setActive(env);setView('editor');}} onCreate={createNew} onDelete={id=>setEnvelopes(es=>es.filter(e=>e.id!==id))}/>
          </div>
        )}
        {view==='editor' && active && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <DocEditor envelope={active} stampConfig={stampConfig} onUpdate={env=>{setActive(env);save(env);}} onBack={()=>setView('dashboard')} onOpenStudio={onOpenStudio}/>
          </div>
        )}
      </main>
    </div>
  );
}
