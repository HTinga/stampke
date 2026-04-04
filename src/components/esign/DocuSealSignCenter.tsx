import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText, Upload, Plus, Send, CheckCircle2, Clock, Trash2, Pen,
  Calendar, Type, X, Save, Eraser, MousePointer2, Stamp, Image as ImageIcon,
  ChevronLeft, UserPlus, Settings, Search, Download, Eye, Shield, Hash, Share2,
  ChevronRight, Check, Users, Layers, ZoomIn, ZoomOut, Move, GripHorizontal
} from 'lucide-react';
import { Envelope, SignField, FieldType, BulkDocument, StampConfig, SignerInfo, AuditEntry, StampTemplate } from '../../types';
import * as pdfjs from 'pdfjs-dist';
import { envelopeAPI, auditAPI } from '../../api';
import { useStampStore } from '../../store';
import { renderStampToPng } from '../../utils/stampRenderer';


pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/* ─── CONSTANTS ──────────────────────────────────────────── */
interface Props {
  stampConfig: StampConfig;
  onOpenStudio?: (fieldId?: string) => void;
  pendingStampFieldId?: string | null;
  onClearPendingField?: () => void;
  isActive?: boolean;
  isPaid?: boolean;        // if false, show paywall overlay
  onUpgrade?: () => void;  // called when user taps Upgrade
}

type View = 'dashboard' | 'builder' | 'signerView';

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'signature', label: 'Signature', icon: <Pen size={14} />,      color: '#1f6feb' },
  { type: 'stamp',     label: 'Stamp',     icon: <Stamp size={14} />,        color: '#7c3aed' },
  { type: 'date',      label: 'Date',      icon: <Calendar size={14} />,     color: '#059669' },
  { type: 'text',      label: 'Text',      icon: <Type size={14} />,         color: '#d97706' },
  { type: 'initials',  label: 'Initials',  icon: <Hash size={14} />,         color: '#dc2626' },
];

const SIGNER_COLORS = ['#1f6feb','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-900/40 text-emerald-400 border-emerald-700',
  sent:       'bg-blue-900/40 text-blue-400 border-blue-700',
  draft:      'bg-[#21262d] text-[#8b949e] border-[#30363d]',
  voided:     'bg-red-900/40 text-red-400 border-red-700',
};

/* ─── SIGNATURE PAD ──────────────────────────────────────── */
const SignaturePad: React.FC<{ onSave:(d:string)=>void; onCancel:()=>void; label?:string }> = ({ onSave, onCancel, label='Draw your signature' }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (ctx) { ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
  }, []);
  const getPos = (e: any, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    return { x: (s.clientX - r.left) * (c.width / r.width), y: (s.clientY - r.top) * (c.height / r.height) };
  };
  const start = (e: any) => { e.preventDefault(); drawing.current = true; const c = ref.current!; const { x, y } = getPos(e, c); c.getContext('2d')!.beginPath(); c.getContext('2d')!.moveTo(x, y); };
  const move = (e: any) => { e.preventDefault(); if (!drawing.current) return; const c = ref.current!; const ctx = c.getContext('2d')!; const { x, y } = getPos(e, c); ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); };
  const stop = () => { drawing.current = false; };
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161b22] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[#30363d]">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-bold text-white">{label}</h3><p className="text-xs text-[#8b949e]">Sign in the box below</p></div>
          <button onClick={onCancel} className="p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] hover:text-white"><X size={16} /></button>
        </div>
        <div className="border border-[#30363d] rounded-xl overflow-hidden mb-4 bg-[#0d1117] touch-none" style={{height:160}}>
          <canvas ref={ref} width={560} height={160} onMouseDown={start} onMouseUp={stop} onMouseLeave={stop} onMouseMove={move} onTouchStart={start} onTouchEnd={stop} onTouchMove={move} className="w-full h-full cursor-crosshair" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => { const c = ref.current!; c.getContext('2d')!.clearRect(0,0,c.width,c.height); }} className="flex-1 py-2.5 border border-[#30363d] rounded-xl text-sm font-medium text-[#8b949e] hover:bg-[#21262d] flex items-center justify-center gap-2 transition-colors"><Eraser size={14} /> Clear</button>
          <button onClick={() => { if (ref.current) onSave(ref.current.toDataURL()); }} className="flex-1 py-2.5 bg-[#1f6feb] text-white rounded-xl text-sm font-semibold hover:bg-[#388bfd] flex items-center justify-center gap-2 transition-colors"><Check size={14} /> Apply</button>
        </div>
      </div>
    </div>
  );
};

/* ─── STAMP PICKER ───────────────────────────────────────── */
const StampPicker: React.FC<{ onSelect:(url:string)=>void; onCancel:()=>void }> = ({ onSelect, onCancel }) => {
  const { customTemplates, fetchTemplates } = useStampStore();
  const [lastUsed, setLastUsed] = useState<string | null>(localStorage.getItem('last_used_stamp'));

  useEffect(() => { fetchTemplates(); }, []);

  const handleSelect = (url: string) => {
    localStorage.setItem('last_used_stamp', url);
    onSelect(url);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161b22] rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-[#30363d] flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-6">
          <div><h3 className="font-bold text-white">Pick a Stamp</h3><p className="text-xs text-[#8b949e]">Select from your templates or last used</p></div>
          <button onClick={onCancel} className="p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] hover:text-white"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {lastUsed && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#1f6feb] mb-3">Last Used</p>
              <button onClick={()=>handleSelect(lastUsed)} className="w-32 aspect-square bg-white border-2 border-transparent hover:border-[#1f6feb] rounded-2xl p-4 transition-all overflow-hidden group">
                <img src={lastUsed} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-3">My Templates</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {customTemplates.map(tpl => (
                <button key={tpl.id} onClick={async () => { const url = await renderStampToPng(tpl.config); handleSelect(url); }} 
                  className="bg-white border-2 border-transparent hover:border-[#1f6feb] rounded-2xl p-4 transition-all overflow-hidden group flex flex-col items-center gap-2">
                  <div className="flex-1 w-full flex items-center justify-center min-h-[100px]">
                    <img src={tpl.config.logoUrl || 'https://cdn-icons-png.flaticon.com/512/3513/3513473.png'} className="max-w-[80px] h-auto object-contain opacity-40 group-hover:opacity-100" 
                      onError={(e)=>e.currentTarget.src='https://cdn-icons-png.flaticon.com/512/3513/3513473.png'}/>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase truncate w-full">{tpl.name}</span>
                </button>
              ))}
              {customTemplates.length === 0 && <p className="text-xs text-[#8b949e] py-4 text-center w-full">No templates found. Create one in the Stamp Studio first.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── TEXT INPUT PROMPT ──────────────────────────────────── */
const TextInputPrompt: React.FC<{ type:string; onSave:(v:string)=>void; onCancel:()=>void }> = ({ type, onSave, onCancel }) => {
  const [val, setVal] = useState(type === 'date' ? new Date().toLocaleDateString() : '');
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161b22] rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-[#30363d]">
        <h3 className="font-bold text-white mb-4 capitalize">Enter {type}</h3>
        <input autoFocus value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onSave(val)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white mb-4 focus:ring-1 focus:ring-[#1f6feb] outline-none" placeholder={`Type ${type} here...`}/>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 border border-[#30363d] rounded-xl text-xs font-semibold text-[#8b949e] hover:bg-[#21262d]">Cancel</button>
          <button onClick={()=>onSave(val)} className="flex-1 py-2 bg-[#1f6feb] text-white rounded-xl text-xs font-semibold">Apply</button>
        </div>
      </div>
    </div>
  );
};

/* ─── DASHBOARD ──────────────────────────────────────────── */
const Dashboard: React.FC<{ envelopes:Envelope[]; onSelect:(e:Envelope)=>void; onCreate:()=>void; onDelete:(id:string)=>void }> = ({ envelopes, onSelect, onCreate, onDelete }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const downloadEnvelope = (e: React.MouseEvent, env: Envelope) => {
    e.stopPropagation();
    const doc = env.documents[0];
    if (!doc?.dataUrl) return;
    const a = document.createElement('a');
    a.href = doc.dataUrl;
    a.download = `${env.title}.pdf`;
    a.click();
  };

  const shareEnvelope = (e: React.MouseEvent, env: Envelope) => {
    e.stopPropagation();
    const text = `Please sign: ${env.title} — ${window.location.origin}/?esign=${(env as any)._id || env.id}`;
    if (navigator.share) {
      navigator.share({ title: env.title, text, url: `${window.location.origin}/?esign=${(env as any)._id || env.id}` }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Link copied to clipboard!'));
    }
  };
  const filtered = envelopes.filter(e => (filter === 'all' || e.status === filter) && e.title.toLowerCase().includes(search.toLowerCase()));
  const stats = { total: envelopes.length, completed: envelopes.filter(e=>e.status==='completed').length, pending: envelopes.filter(e=>e.status==='sent').length, drafts: envelopes.filter(e=>e.status==='draft').length };
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Documents</h1><p className="text-sm text-[#8b949e]">Manage and track all your signing requests</p></div>
        <button onClick={onCreate} className="flex items-center gap-2 px-5 py-2.5 bg-[#1f6feb] text-white rounded-xl font-semibold text-sm hover:bg-[#388bfd] transition-colors self-start sm:self-auto"><Plus size={18} /> New Document</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{label:'Total',value:stats.total,color:'text-white'},{label:'Completed',value:stats.completed,color:'text-emerald-400'},{label:'Awaiting',value:stats.pending,color:'text-blue-400'},{label:'Drafts',value:stats.drafts,color:'text-yellow-400'}].map((s,i)=>(
          <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5"><p className="text-xs text-[#8b949e] font-medium mb-1">{s.label}</p><p className={`text-3xl font-bold ${s.color}`}>{s.value}</p></div>
        ))}
      </div>
      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] overflow-hidden">
        <div className="p-4 border-b border-[#21262d] flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex bg-[#0d1117] p-1 rounded-xl gap-1">
            {['all','draft','sent','completed'].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter===f?'bg-[#21262d] text-white':'text-[#8b949e] hover:text-white'}`}>{f}</button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents..." className="w-full pl-9 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#1f6feb] text-white placeholder:text-[#8b949e]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-[#0d1117] border-b border-[#21262d]">
              {['Document','Signers','Status','Created',''].map((h,i)=><th key={i} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-[#21262d]">
              {filtered.length===0?(
                <tr><td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-[#21262d] rounded-2xl flex items-center justify-center"><FileText size={24} className="text-[#8b949e]" /></div>
                    <div><p className="font-semibold text-white">No documents found</p><p className="text-xs text-[#8b949e] mt-1">Create your first document</p></div>
                    <button onClick={onCreate} className="mt-2 px-4 py-2 bg-[#1f6feb] text-white rounded-xl text-sm font-medium hover:bg-[#388bfd] transition-colors">Create Document</button>
                  </div>
                </td></tr>
              ):filtered.map(env=>(
                <tr key={env.id} onClick={()=>onSelect(env)} className="hover:bg-[#21262d]/50 cursor-pointer transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#21262d] rounded-xl flex items-center justify-center flex-shrink-0"><FileText size={16} className="text-[#1f6feb]" /></div>
                      <div><p className="font-semibold text-white text-sm">{env.title}</p><p className="text-xs text-[#8b949e]">{env.documents.length} doc · {env.fields.length} fields</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">{env.signers.slice(0,4).map((s,idx)=>(
                      <div key={s.id} title={s.name||s.email} className="w-7 h-7 rounded-full border-2 border-[#161b22] flex items-center justify-center text-[9px] font-bold text-white" style={{backgroundColor:SIGNER_COLORS[idx%SIGNER_COLORS.length]}}>{(s.name||s.email).charAt(0).toUpperCase()}</div>
                    ))}</div>
                  </td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${STATUS_STYLES[env.status]||STATUS_STYLES.draft}`}>{env.status}</span></td>
                  <td className="px-6 py-4"><p className="text-sm text-[#8b949e]">{new Date(env.createdAt).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}</p></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e=>{e.stopPropagation();onSelect(env);}} className="p-1.5 hover:bg-[#21262d] rounded-lg transition-colors" title="Open"><Eye size={15} className="text-[#1f6feb]" /></button>
                      <button onClick={e=>downloadEnvelope(e,env)} className="p-1.5 hover:bg-[#21262d] rounded-lg transition-colors" title="Download"><Download size={15} className="text-emerald-400" /></button>
                      <button onClick={e=>shareEnvelope(e,env)} className="p-1.5 hover:bg-[#21262d] rounded-lg transition-colors" title="Share / Copy link"><Share2 size={15} className="text-yellow-400" /></button>
                      <button onClick={e=>{e.stopPropagation();onDelete(env.id);}} className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors" title="Delete"><Trash2 size={15} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ─── BUILDER ────────────────────────────────────────────── */
const Builder: React.FC<{envelope:Envelope; onUpdate:(e:Envelope)=>void; onSend:(e:Envelope)=>Promise<Envelope>; onBack:()=>void; stampConfig:StampConfig}> = ({ envelope, onUpdate, onSend, onBack, stampConfig }) => {
  const [env, setEnv] = useState<Envelope>(envelope);
  const [step, setStep] = useState<'upload'|'signers'|'fields'|'review'>(
    (envelope.documents?.length || 0) > 0 ? ((envelope.signers?.length || 0) > 0 ? 'fields' : 'signers') : 'upload'
  );
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'signer'|'approver'|'viewer'>('signer');
  const [activeTool, setActiveTool] = useState<FieldType|null>(null);
  const [activeSigner, setActiveSigner] = useState<string|null>(null);
  const [draggingField, setDraggingField] = useState<{id:string;ox:number;oy:number}|null>(null);
  const [resizingField, setResizingField] = useState<{id:string;startX:number;startY:number;startW:number;startH:number}|null>(null);
  const [selectedField, setSelectedField] = useState<string|null>(null);
  const [pdfCanvas, setPdfCanvas] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy|null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [numPages, setNumPages] = useState(1);
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Modal states for builder signing
  const [showSignPad, setShowSignPad] = useState(false);
  const [signPadField, setSignPadField] = useState<SignField | null>(null);
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [showTextPrompt, setShowTextPrompt] = useState(false);
  const [activePromptType, setActivePromptType] = useState<string>('text');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const handleFieldClick = (field: SignField) => {
    // Always allow signing preview/pre-fill on click
    setSignPadField(field);
    if (field.type === 'signature') {
      setShowSignPad(true);
    } else if (field.type === 'initials') {
      // ── INITALS MAKER ──────────────────
      const signer = env.signers.find(s => s.id === field.signerId);
      const name = (signer?.name || signer?.email || 'Signer');
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3);
      completeField(field, initials);
    } else if (field.type === 'stamp') {
      setShowStampPicker(true);
    } else if (field.type === 'text' || field.type === 'date') {
      // ── DIRECT TEXT ENTRY ──────────────
      setEditingFieldId(field.id);
    } else {
      setActivePromptType(field.type);
      setShowTextPrompt(true);
    }
  };

  const completeField = (field: SignField, value: string) => {
    // Force black ink for signatures/initials by processing if needed? 
    // For now, we'll ensure CSS handles the black rendering.
    upd({ fields: env.fields.map(f => f.id === field.id ? { ...f, value, isCompleted: true } : f) });
  };

  const upd = (updates: Partial<Envelope>) => {
    const updated = { ...env, ...updates, updatedAt: new Date().toISOString() };
    setEnv(updated); onUpdate(updated);
  };

  // Render PDF page with pdfjs
  const renderPdfPage = useCallback(async (doc: pdfjs.PDFDocumentProxy, pageNum: number, z=zoom) => {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 * z });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
    return canvas.toDataURL();
  }, [zoom]);

  useEffect(() => {
    if (pdfDoc) {
      renderPdfPage(pdfDoc, currentPage, zoom).then(url => setPdfCanvas([url]));
    } else if (env.documents[0]?.dataUrl && env.documents[0].type === 'application/pdf') {
       // Load existing PDF if not already loaded
       const ab = Uint8Array.from(atob(env.documents[0].dataUrl.split(',')[1]), c => c.charCodeAt(0)).buffer;
       pdfjs.getDocument(ab).promise.then(async (pdf) => {
         setPdfDoc(pdf);
         setNumPages(pdf.numPages);
         const thumbs: string[] = [];
         for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
           const p = await pdf.getPage(i);
           const vp = p.getViewport({ scale: 0.2 });
           const tc = document.createElement('canvas');
           tc.width = vp.width; tc.height = vp.height;
           await p.render({ canvasContext: tc.getContext('2d')!, viewport: vp }).promise;
           thumbs.push(tc.toDataURL());
         }
         setThumbnails(thumbs);
       });
    }
  }, [pdfDoc, currentPage, zoom, env.documents]);

  const handleFileUpload = async (file: File) => {
    const doc: BulkDocument = { id: Math.random().toString(36).slice(2), name: file.name, type: file.type, size: file.size, pages: 1 };
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      doc.dataUrl = dataUrl; // Store the full file content
      if (file.type === 'application/pdf') {
        try {
          const ab = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument(ab).promise;
          setPdfDoc(pdf);
          doc.pages = pdf.numPages;
          setNumPages(pdf.numPages);
          const firstPage = await renderPdfPage(pdf, 1, zoom);
          setPdfCanvas([firstPage]);
          doc.previewUrl = firstPage;
          // Generate thumbnails
          const thumbs: string[] = [];
          for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
            const p = await pdf.getPage(i);
            const vp = p.getViewport({ scale: 0.2 });
            const tc = document.createElement('canvas');
            tc.width = vp.width; tc.height = vp.height;
            await p.render({ canvasContext: tc.getContext('2d')!, viewport: vp }).promise;
            thumbs.push(tc.toDataURL());
          }
          setThumbnails(thumbs);
        } catch {
          setPdfCanvas([dataUrl]);
          doc.previewUrl = dataUrl;
        }
      } else {
        // images, docx etc — show as image/placeholder
        setPdfCanvas([dataUrl]);
        doc.previewUrl = dataUrl;
      }
      upd({ documents: [doc], title: env.title === 'Untitled Document' ? file.name.replace(/\.[^/.]+$/, '') : env.title });
    };
    reader.readAsDataURL(file);
  };

  const addSigner = () => {
    if (!newEmail.trim()) return;
    const s: SignerInfo = { id: Math.random().toString(36).slice(2), name: newName, email: newEmail, role: newRole, order: env.signers.length+1, status: 'pending' };
    upd({ signers: [...env.signers, s] });
    setNewName(''); setNewEmail('');
    if (!activeSigner) setActiveSigner(s.id);
  };

  const placeField = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeTool || !activeSigner || !pageRef.current) return;
    if (draggingField || resizingField) return;
    const rect = pageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const w = activeTool === 'signature' ? 24 : activeTool === 'stamp' ? 18 : 14;
    const h = activeTool === 'signature' ? 8 : 6;
    const field: SignField = { id: Math.random().toString(36).slice(2), type: activeTool, x: Math.max(0, Math.min(x, 100-w)), y: Math.max(0, Math.min(y, 100-h)), width: w, height: h, page: currentPage, signerId: activeSigner };
    upd({ fields: [...env.fields, field] });
    setSelectedField(field.id);
  };

  // Drag field
  const onFieldMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedField(id);
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const field = env.fields.find(f => f.id === id)!;
    const cx = (field.x / 100) * rect.width + rect.left;
    const cy = (field.y / 100) * rect.height + rect.top;
    setDraggingField({ id, ox: e.clientX - cx, oy: e.clientY - cy });
  };

  const onResizeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const field = env.fields.find(f => f.id === id)!;
    setResizingField({ id, startX: e.clientX, startY: e.clientY, startW: field.width||20, startH: field.height||6 });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    if (draggingField) {
      const field = env.fields.find(f => f.id === draggingField.id)!;
      const newX = ((e.clientX - draggingField.ox - rect.left) / rect.width) * 100;
      const newY = ((e.clientY - draggingField.oy - rect.top) / rect.height) * 100;
      const w = field.width||20; const h = field.height||6;
      upd({ fields: env.fields.map(f => f.id === draggingField.id ? {...f, x: Math.max(0, Math.min(newX, 100-w)), y: Math.max(0, Math.min(newY, 100-h))} : f) });
    }
    if (resizingField) {
      const dx = e.clientX - resizingField.startX;
      const dy = e.clientY - resizingField.startY;
      const newW = Math.max(8, resizingField.startW + (dx / rect.width) * 100);
      const newH = Math.max(4, resizingField.startH + (dy / rect.height) * 100);
      upd({ fields: env.fields.map(f => f.id === resizingField.id ? {...f, width: Math.min(newW, 90), height: Math.min(newH, 40)} : f) });
    }
  };

  const onMouseUp = () => { setDraggingField(null); setResizingField(null); };

  const removeField = (id: string) => upd({ fields: env.fields.filter(f => f.id !== id) });

  const sendEnvelope = async () => {
    const audit: AuditEntry = { id: Math.random().toString(36).slice(2), timestamp: new Date().toISOString(), action: 'Document Sent', user: 'You', ip: '—', details: `Sent to ${env.signers.map(s=>s.email).join(', ')}` };
    const toSave = { ...env, status: 'sent' as const, auditLog: [...env.auditLog, audit], updatedAt: new Date().toISOString() };

    // ── Save to DB FIRST and get back the real MongoDB _id ──────────────────
    let saved = toSave;
    try {
      saved = await onSend(toSave); // onSend now returns the persisted envelope
      setEnv(saved);
    } catch (err) {
      console.error('[eSign] Failed to save envelope:', err);
      setEnv(toSave);
      saved = toSave;
    }

    // ── Now send emails with the real envelope id ────────────────────────────
    const envelopeId = (saved as any)._id || saved.id || 'unknown';
    const token = localStorage.getItem('tomo_token');
    const origin = window.location.origin;
    try {
      for (const signer of saved.signers) {
        if (!signer.email) continue;
        // Unique link per signer using real envelope id
        const signLink = `${origin}/?esign=${envelopeId}&signer=${signer.id}`;
        const res = await fetch('/api/notify/sign-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            toEmail:       signer.email,
            toName:        signer.name,
            documentTitle: saved.title,
            signerRole:    signer.role || 'signer',
            signLink,
          }),
        });
        const data = await res.json().catch(() => ({}));
        console.log('[eSign] Email to', signer.email, '→', data?.result?.sent ? 'sent ✅' : 'failed ❌', data?.result);
      }
    } catch (err) {
      console.error('[eSign] Email notification error:', err);
    }
  };

  const steps = ['upload','signers','fields','review'] as const;
  const stepLabels = ['Upload','Signers','Fields','Send'];

  return (
    <div className="flex flex-col h-full">
      {/* Builder topbar */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex items-center gap-3 flex-shrink-0 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[#8b949e] hover:text-white text-sm font-medium transition-colors"><ChevronLeft size={16}/> Back</button>
        <div className="h-4 w-px bg-[#30363d]" />
        <input value={env.title} onChange={e=>upd({title:e.target.value})} className="flex-1 text-sm font-semibold text-white bg-transparent border-none focus:outline-none max-w-sm" />
        <div className="ml-auto flex items-center gap-1">
          {steps.map((s,i) => (
            <React.Fragment key={s}>
              <button onClick={()=>setStep(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${step===s?'bg-[#1f6feb] text-white':i<steps.indexOf(step)?'bg-[#21262d] text-[#1f6feb]':'text-[#8b949e] hover:text-white'}`}>{stepLabels[i]}</button>
              {i<steps.length-1&&<ChevronRight size={12} className="text-[#30363d]"/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Upload */}
      {step==='upload'&&(
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center"><h2 className="text-xl font-bold text-white mb-1">Upload Document</h2><p className="text-sm text-[#8b949e]">PDF, Word, Excel, Images — all supported</p></div>
            {env.documents.length>0?(
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#21262d] rounded-xl flex items-center justify-center"><FileText size={20} className="text-[#1f6feb]"/></div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm truncate">{env.documents[0].name}</p><p className="text-xs text-[#8b949e]">{(env.documents[0].size/1024).toFixed(1)} KB · {env.documents[0].pages} page(s)</p></div>
                  <button onClick={()=>{upd({documents:[]});setPdfCanvas([]);setPdfDoc(null);}} className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors"><X size={15} className="text-red-400"/></button>
                </div>
                {pdfCanvas[0]&&<div className="rounded-xl overflow-hidden border border-[#30363d]"><img src={pdfCanvas[0]} alt="Preview" className="w-full h-52 object-contain bg-[#0d1117]"/></div>}
                <button onClick={()=>setStep('signers')} className="w-full py-2.5 bg-[#1f6feb] text-white rounded-xl text-sm font-semibold hover:bg-[#388bfd] transition-colors">Continue to Signers →</button>
              </div>
            ):(
              <label className="block border-2 border-dashed border-[#30363d] rounded-2xl p-12 text-center cursor-pointer hover:border-[#1f6feb] hover:bg-[#161b22] transition-all group">
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.webp,.txt,.csv" className="sr-only" onChange={e=>{const f=e.target.files?.[0];if(f)handleFileUpload(f);}}/>
                <div className="w-16 h-16 bg-[#21262d] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#30363d] transition-colors"><Upload size={28} className="text-[#1f6feb]"/></div>
                <p className="font-bold text-white text-lg mb-1">Drop file or click to browse</p>
                <p className="text-sm text-[#8b949e]">PDF, Word, Excel, PowerPoint, Images, Text</p>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Signers */}
      {step==='signers'&&(
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-lg mx-auto space-y-6">
            <div><h2 className="text-xl font-bold text-white mb-1">Add Signers</h2><p className="text-sm text-[#8b949e]">Add people who need to sign this document</p></div>
            <div className="space-y-2">
              {env.signers.map((s,idx)=>(
                <div key={s.id} className="flex items-center gap-3 bg-[#161b22] border border-[#30363d] rounded-xl p-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{backgroundColor:SIGNER_COLORS[idx%SIGNER_COLORS.length]}}>{(s.name||s.email).charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm truncate">{s.name||'(No name)'}</p><p className="text-xs text-[#8b949e] truncate">{s.email} · {s.role}</p></div>
                  <button onClick={()=>upd({signers:env.signers.filter(x=>x.id!==s.id),fields:env.fields.filter(f=>f.signerId!==s.id)})} className="p-1.5 hover:bg-red-900/30 rounded-lg"><Trash2 size={13} className="text-red-400"/></button>
                </div>
              ))}
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold text-white">Add a signer</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-[#8b949e] font-medium block mb-1">Full Name</label><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Jane Doe" className="w-full border border-[#30363d] rounded-xl px-3 py-2 text-sm bg-[#0d1117] text-white placeholder:text-[#8b949e] focus:outline-none focus:ring-1 focus:ring-[#1f6feb]"/></div>
                <div><label className="text-xs text-[#8b949e] font-medium block mb-1">Email</label><input value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="jane@example.com" type="email" onKeyDown={e=>e.key==='Enter'&&addSigner()} className="w-full border border-[#30363d] rounded-xl px-3 py-2 text-sm bg-[#0d1117] text-white placeholder:text-[#8b949e] focus:outline-none focus:ring-1 focus:ring-[#1f6feb]"/></div>
              </div>
              <div className="flex gap-2">
                {(['signer','approver','viewer'] as const).map(r=>(
                  <button key={r} onClick={()=>setNewRole(r)} className={`flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${newRole===r?'bg-[#1f6feb] text-white border-[#1f6feb]':'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-[#1f6feb]'}`}>{r}</button>
                ))}
              </div>
              <button onClick={addSigner} disabled={!newEmail} className="w-full py-2.5 bg-[#1f6feb] text-white rounded-xl text-sm font-semibold hover:bg-[#388bfd] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"><UserPlus size={16}/> Add Signer</button>
            </div>
            {env.signers.length>0&&<button onClick={()=>setStep('fields')} className="w-full py-3 bg-[#1f6feb] text-white rounded-xl font-semibold hover:bg-[#388bfd] transition-colors">Continue to Place Fields →</button>}
          </div>
        </div>
      )}

      {/* Fields */}
      {step==='fields'&&(
        <div className="flex-1 flex overflow-hidden" onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

          {/* ── Page Thumbnails Sidebar ── */}
          {thumbnails.length > 0 && (
            <div className="w-20 md:w-28 flex-shrink-0 border-r border-[#30363d] bg-[#0d1117] flex flex-col overflow-y-auto">
              <div className="p-2 border-b border-[#30363d] sticky top-0 bg-[#0d1117] z-10">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#8b949e] text-center">Pages</p>
              </div>
              <div className="flex flex-col gap-2 p-2">
                {thumbnails.map((thumb, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                      currentPage === idx + 1
                        ? 'border-[#1f6feb] shadow-[0_0_12px_rgba(31,111,235,0.4)]'
                        : 'border-[#30363d] hover:border-[#8b949e]'
                    }`}
                  >
                    <img src={thumb} alt={`Page ${idx + 1}`} className="w-full aspect-[3/4] object-cover" />
                    {/* Field count badge */}
                    {env.fields.filter(f => f.page === idx + 1).length > 0 && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-[#1f6feb] rounded-full flex items-center justify-center">
                        <span className="text-[8px] font-black text-white">{env.fields.filter(f => f.page === idx + 1).length}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-white py-0.5 text-center font-bold">
                      {idx + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Field toolbar */}
          <div className="w-64 flex-shrink-0 bg-[#161b22] border-r border-[#30363d] p-6 space-y-6 overflow-y-auto">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-3">Field Types</p>
              <div className="space-y-1.5">
                {FIELD_TYPES.map(ft=>(
                  <button key={ft.type} onClick={()=>setActiveTool(ft.type===activeTool?null:ft.type)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTool===ft.type?'text-white':'bg-[#21262d] text-[#e6edf3] hover:bg-[#30363d]'}`}
                    style={{backgroundColor:activeTool===ft.type?ft.color:undefined}}>
                    <span style={{color:activeTool===ft.type?'#fff':ft.color}}>{ft.icon}</span>{ft.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-3">Assign To</p>
              <div className="space-y-1.5">
                {env.signers.map((s,idx)=>(
                  <button key={s.id} onClick={()=>setActiveSigner(s.id===activeSigner?null:s.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${activeSigner===s.id?'text-white':'bg-[#21262d] text-[#e6edf3] hover:bg-[#30363d]'}`}
                    style={{backgroundColor:activeSigner===s.id?SIGNER_COLORS[idx%SIGNER_COLORS.length]:undefined}}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{backgroundColor:SIGNER_COLORS[idx%SIGNER_COLORS.length]}}>{(s.name||s.email).charAt(0).toUpperCase()}</div>
                    <span className="truncate">{s.name||s.email}</span>
                  </button>
                ))}
              </div>
            </div>
            {activeTool&&activeSigner&&(
              <div className="bg-[#1f6feb]/10 rounded-xl p-3 border border-[#1f6feb]/30">
                <p className="text-xs text-[#1f6feb] font-semibold mb-1">Ready to place</p>
                <p className="text-xs text-[#8b949e]">Click on the document to place a <span className="font-semibold text-white">{activeTool}</span> field. Drag to move, resize handle to resize.</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-2">Fields ({env.fields.filter(f=>f.page===currentPage).length})</p>
              <div className="space-y-1">
                {env.fields.filter(f=>f.page===currentPage).map(field=>{
                  const ft=FIELD_TYPES.find(f=>f.type===field.type)!;
                  const signer=env.signers.find(s=>s.id===field.signerId);
                  return (
                    <div key={field.id} onClick={()=>setSelectedField(field.id)} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${selectedField===field.id?'bg-[#21262d]':'hover:bg-[#21262d]/50'}`}>
                      <span style={{color:ft.color}}>{ft.icon}</span>
                      <span className="text-xs text-[#e6edf3] flex-1 truncate">{signer?.name||signer?.email||'?'}</span>
                      <button onClick={e=>{e.stopPropagation();removeField(field.id);}} className="p-0.5 hover:text-red-400 text-[#8b949e]"><X size={11}/></button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              {/* Page navigation */}
              {numPages > 1 && (
                <div className="flex items-center gap-1 bg-[#21262d] rounded-xl p-1">
                  <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage<=1} className="p-1.5 text-[#8b949e] hover:text-white disabled:opacity-30"><ChevronLeft size={13}/></button>
                  <span className="flex-1 text-center text-xs font-bold text-white">{currentPage} / {numPages}</span>
                  <button onClick={()=>setCurrentPage(p=>Math.min(numPages,p+1))} disabled={currentPage>=numPages} className="p-1.5 text-[#8b949e] hover:text-white disabled:opacity-30"><ChevronRight size={13}/></button>
                </div>
              )}
              {/* Zoom */}
              <div className="flex items-center gap-1 bg-[#21262d] rounded-xl p-1">
                <button onClick={()=>setZoom(z=>Math.max(0.5,z-0.25))} className="p-1.5 text-[#8b949e] hover:text-white"><ZoomOut size={13}/></button>
                <span className="flex-1 text-center text-xs font-bold text-white">{Math.round(zoom*100)}%</span>
                <button onClick={()=>setZoom(z=>Math.min(2.5,z+0.25))} className="p-1.5 text-[#8b949e] hover:text-white"><ZoomIn size={13}/></button>
              </div>
              <button onClick={sendEnvelope} disabled={env.documents.length===0||env.signers.length===0||env.fields.length===0}
                className="w-full py-2.5 bg-[#1f6feb] text-white rounded-xl text-xs font-bold hover:bg-[#388bfd] disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
                <Send size={13}/> Send for Signing
              </button>
              <button onClick={()=>onUpdate(env)} className="w-full py-2 border border-[#30363d] text-[#8b949e] hover:text-white rounded-xl text-xs font-medium hover:bg-[#21262d] flex items-center justify-center gap-2 transition-colors">
                <Save size={12}/> Save Draft
              </button>
            </div>
          </div>

          {/* Document canvas */}
          <div className="flex-1 bg-[#0d1117] overflow-auto flex items-start justify-center p-8"
            style={{cursor:activeTool&&activeSigner?'crosshair':'default'}}>
            {env.documents.length===0?(
              <div className="bg-[#161b22] rounded-2xl border-2 border-dashed border-[#30363d] flex items-center justify-center w-full max-w-2xl" style={{minHeight:800}}>
                <div className="text-center p-8">
                  <FileText size={40} className="text-[#30363d] mx-auto mb-4"/>
                  <p className="text-[#8b949e] font-medium">No document uploaded</p>
                  <button onClick={()=>setStep('upload')} className="mt-3 px-4 py-2 bg-[#1f6feb] text-white rounded-xl text-sm font-medium hover:bg-[#388bfd] transition-colors">Upload Document</button>
                </div>
              </div>
            ):(
              <div ref={pageRef} onClick={placeField}
                className="relative bg-white shadow-2xl overflow-hidden flex-shrink-0"
                style={{width:`${850*zoom}px`,minHeight:`${1100*zoom}px`,cursor:activeTool&&activeSigner?'crosshair':'default'}}>

                {/* Page image */}
                {pdfCanvas[0]?(
                  <img src={pdfCanvas[0]} alt="Page" className="w-full h-auto pointer-events-none select-none" style={{display:'block'}}/>
                ):(
                  <div className="w-full flex flex-col items-center justify-center p-16 bg-white" style={{minHeight:`${1100*zoom}px`}}>
                    <FileText size={64} className="text-gray-300 mb-4"/>
                    <p className="text-gray-600 font-medium text-lg">{env.documents[0]?.name}</p>
                    <p className="text-gray-400 text-sm mt-2">Click to place fields anywhere on this document</p>
                  </div>
                )}

                {/* Field overlays */}
                {env.fields.filter(f=>f.page===currentPage).map(field=>{
                  const ft=FIELD_TYPES.find(f=>f.type===field.type)!;
                  const signer=env.signers.find(s=>s.id===field.signerId);
                  const sidx=env.signers.findIndex(s=>s.id===field.signerId);
                  const isSelected=selectedField===field.id;
                  return (
                    <div key={field.id}
                      className="absolute select-none"
                      style={{left:`${field.x}%`,top:`${field.y}%`,width:`${field.width||20}%`,height:`${field.height||6}%`,minHeight:32,zIndex:isSelected?20:10,cursor:activeTool?'crosshair':'pointer'}}
                      onMouseDown={e=>onFieldMouseDown(e,field.id)}
                      onClick={e=>{e.stopPropagation(); handleFieldClick(field);}}>
                      <div className="w-full h-full rounded-lg border-2 flex items-center justify-center relative transition-all"
                        style={{borderColor:SIGNER_COLORS[sidx%SIGNER_COLORS.length], backgroundColor: field.isCompleted ? `${SIGNER_COLORS[sidx%SIGNER_COLORS.length]}10` : 'transparent'}}>
                        
                        {editingFieldId === field.id ? (
                          <input
                            autoFocus
                            defaultValue={field.value || ''}
                            onBlur={(e) => { completeField(field, e.target.value); setEditingFieldId(null); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { completeField(field, e.currentTarget.value); setEditingFieldId(null); } }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full h-full bg-transparent px-2 text-sm font-bold outline-none text-black text-center"
                            placeholder={field.type === 'date' ? 'YYYY-MM-DD' : 'Type here...'}
                          />
                        ) : field.isCompleted ? (
                          field.value?.startsWith('data:') ? (
                            <img src={field.value} alt="signed" className="w-full h-full object-contain p-1 brightness-0" />
                          ) : (
                            <span className="text-sm font-bold truncate px-2 text-black">{field.value}</span>
                          )
                        ) : (
                          <div className={`flex items-center gap-1.5 px-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                            <span style={{color:SIGNER_COLORS[sidx%SIGNER_COLORS.length]}}>{ft.icon}</span>
                            <span className="text-[10px] font-bold truncate uppercase tracking-tight" style={{color:SIGNER_COLORS[sidx%SIGNER_COLORS.length]}}>{field.type}</span>
                          </div>
                        )}
                        {/* Selection outline */}
                        {isSelected&&<div className="absolute inset-0 rounded-lg border-2 border-white/50 pointer-events-none"/>}
                        {/* Delete */}
                        <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();removeField(field.id);}}
                          className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md z-30 opacity-0 hover:opacity-100 transition-opacity" style={{opacity:isSelected?1:undefined}}>
                          <X size={10}/>
                        </button>
                        {/* Resize handle */}
                        {isSelected&&(
                          <div onMouseDown={e=>onResizeMouseDown(e,field.id)}
                            className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 rounded-sm cursor-se-resize z-30 flex items-center justify-center"
                            style={{borderColor:SIGNER_COLORS[sidx%SIGNER_COLORS.length]}}>
                            <GripHorizontal size={8} style={{color:SIGNER_COLORS[sidx%SIGNER_COLORS.length]}}/>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Mode hint */}
                <div className="absolute top-3 right-3 pointer-events-none">
                  {activeTool&&activeSigner&&(
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-xl border border-white/10">
                      <MousePointer2 size={12} className="text-[#1f6feb]"/>
                      <span className="text-[10px] font-bold text-white">Click to place {activeTool}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review */}
      {step==='review'&&(
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div><h2 className="text-xl font-bold text-white mb-1">Review & Send</h2><p className="text-sm text-[#8b949e]">Review all details before sending</p></div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl divide-y divide-[#21262d]">
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-3">Document</p>
                {env.documents.map(d=>(
                  <div key={d.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#21262d] rounded-xl flex items-center justify-center"><FileText size={16} className="text-[#1f6feb]"/></div>
                    <div><p className="font-semibold text-white text-sm">{d.name}</p><p className="text-xs text-[#8b949e]">{d.pages} page(s)</p></div>
                  </div>
                ))}
              </div>
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-3">Signers ({env.signers.length})</p>
                <div className="space-y-2">{env.signers.map((s,idx)=>(
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{backgroundColor:SIGNER_COLORS[idx%SIGNER_COLORS.length]}}>{(s.name||s.email).charAt(0).toUpperCase()}</div>
                    <div><p className="font-medium text-white text-sm">{s.name}</p><p className="text-xs text-[#8b949e]">{s.email}</p></div>
                    <span className="ml-auto text-xs text-[#8b949e] capitalize">{s.role}</span>
                  </div>
                ))}</div>
              </div>
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-3">Fields ({env.fields.length})</p>
                <div className="flex flex-wrap gap-2">{FIELD_TYPES.map(ft=>{const count=env.fields.filter(f=>f.type===ft.type).length;if(!count)return null;return(
                  <div key={ft.type} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] rounded-xl text-xs">
                    <span style={{color:ft.color}}>{ft.icon}</span><span className="text-[#e6edf3] font-medium capitalize">{ft.label}: {count}</span>
                  </div>
                );})}</div>
              </div>
            </div>
            <button onClick={sendEnvelope} disabled={env.documents.length===0||env.signers.length===0||env.fields.length===0}
              className="w-full py-3.5 bg-[#1f6feb] text-white rounded-xl font-bold hover:bg-[#388bfd] disabled:opacity-40 flex items-center justify-center gap-3 transition-colors">
              <Send size={18}/> Send to {env.signers.length} Signer{env.signers.length!==1?'s':''}
            </button>
          </div>
        </div>
      )}

      {/* Signing modals in builder */}
      {showSignPad&&signPadField&&<SignaturePad label={`Sign: ${signPadField.type}`} onSave={url=>{completeField(signPadField,url);setShowSignPad(false);setSignPadField(null);}} onCancel={()=>{setShowSignPad(false);setSignPadField(null);}}/>}
      {showStampPicker&&signPadField&&<StampPicker onSelect={url=>{completeField(signPadField,url);setShowStampPicker(false);setSignPadField(null);}} onCancel={()=>{setShowStampPicker(false);setSignPadField(null);}}/>}
      {showTextPrompt&&signPadField&&<TextInputPrompt type={activePromptType} onSave={val=>{completeField(signPadField,val);setShowTextPrompt(false);setSignPadField(null);}} onCancel={()=>{setShowTextPrompt(false);setSignPadField(null);}}/>}
    </div>
  );
};

/* ─── SIGNER VIEW ────────────────────────────────────────── */
const SignerView: React.FC<{envelope:Envelope; onComplete:(e:Envelope)=>void; onBack:()=>void}> = ({envelope,onComplete,onBack}) => {
  const [env,setEnv]=useState<Envelope>(envelope);
  const [showSignPad,setShowSignPad]=useState(false);
  const [signPadField,setSignPadField]=useState<SignField|null>(null);
  const [showStampPicker,setShowStampPicker]=useState(false);
  const [showTextPrompt,setShowTextPrompt]=useState(false);
  const [activePromptType,setActivePromptType]=useState<string>('text');
  const [pageCanvases,setPageCanvases]=useState<string[]>([]);
  const [loading,setLoading]=useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const handleFieldClick = (field: SignField) => {
    if (field.isCompleted) return;
    
    // ── PERMISSIONS WIRING: Viewer Role ──
    const signer = env.signers.find(s => s.id === field.signerId);
    if (signer?.role === 'viewer') {
      console.log('[eSign Permissions] Viewers cannot sign document.');
      return;
    }

    setSignPadField(field);
    if (field.type === 'signature') {
      setShowSignPad(true);
    } else if (field.type === 'initials') {
      // ── INITALS MAKER ──────────────────
      const signer = env.signers.find(s => s.id === field.signerId);
      const name = (signer?.name || signer?.email || 'Signer');
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3);
      completeField(field, initials);
    } else if (field.type === 'stamp') {
      setShowStampPicker(true);
    } else if (field.type === 'text' || field.type === 'date') {
      // ── DIRECT TEXT ENTRY ──────────────
      setEditingFieldId(field.id);
    } else {
      setActivePromptType(field.type);
      setShowTextPrompt(true);
    }
  };

  useEffect(() => {
    const doc = envelope.documents[0];
    if (!doc?.dataUrl) return;

    if (doc.type === 'application/pdf' || doc.dataUrl.startsWith('data:application/pdf')) {
      const loadAllPages = async () => {
        setLoading(true);
        try {
          const ab = Uint8Array.from(atob(doc.dataUrl!.split(',')[1]), c => c.charCodeAt(0)).buffer;
          const pdf = await pdfjs.getDocument(ab).promise;
          const canvases: string[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width; canvas.height = viewport.height;
            await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
            canvases.push(canvas.toDataURL());
          }
          setPageCanvases(canvases);
        } catch (err) {
          console.error("Failed to render PDF pages:", err);
          if (doc.previewUrl) setPageCanvases([doc.previewUrl]);
        } finally {
          setLoading(false);
        }
      };
      loadAllPages();
    } else {
      setPageCanvases([doc.dataUrl || doc.previewUrl || '']);
    }
  }, [envelope.documents]);

  const completeField=(field:SignField,value:string)=>{
    setEnv(e=>({...e,fields:e.fields.map(f=>f.id===field.id?{...f,value,isCompleted:true}:f)}));
  };

  const allComplete=env.fields.length>0&&env.fields.every(f=>f.isCompleted);

  const finish=()=>{
    const audit:AuditEntry={id:Math.random().toString(36).slice(2),timestamp:new Date().toISOString(),action:'Document Signed',user:env.signers[0]?.name||'Signer',ip:'—',details:`All ${env.fields.length} field(s) completed`};
    onComplete({...env,status:'completed',auditLog:[...env.auditLog,audit]});
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex items-center gap-4 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[#8b949e] hover:text-white text-sm font-medium"><ChevronLeft size={16}/> Back</button>
        <div className="h-4 w-px bg-[#30363d]"/>
        <p className="font-semibold text-white text-sm flex-1">{env.title}</p>
        <span className="text-xs text-[#8b949e]">{env.fields.filter(f=>f.isCompleted).length}/{env.fields.length} signed</span>
        
        <button 
          onClick={() => {
            const doc = env.documents[0];
            if (doc?.dataUrl) {
              const a = document.createElement('a');
              a.href = doc.dataUrl;
              a.download = doc.name || 'document.pdf';
              a.click();
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#21262d] text-[#c9d1d9] rounded-xl text-xs font-semibold hover:bg-[#30363d] transition-colors">
          <Download size={14}/> Download
        </button>

        {allComplete&&<button onClick={finish} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"><Check size={15}/> Finish Signing</button>}
      </div>
      <div className="flex-1 overflow-auto bg-[#0d1117] flex items-start justify-center p-8">
        <div className="w-full max-w-2xl space-y-8">
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 bg-[#161b22] rounded-2xl border border-[#30363d] animate-pulse">
               <FileText size={48} className="text-[#1f6feb] mb-4"/>
               <p className="text-[#e6edf3] font-medium">Rendering document pages...</p>
            </div>
          )}
          {pageCanvases.map((canvas, pIdx) => (
             <div key={pIdx} className="relative bg-white rounded-xl shadow-2xl overflow-hidden" style={{ minHeight: 1100 }}>
                <img src={canvas} alt={`Page ${pIdx+1}`} className="w-full h-auto"/>
                {env.fields.filter(f => f.page === (pIdx + 1)).map(field => {
                  const ft = FIELD_TYPES.find(f => f.type === field.type)!;
                  return (
                    <div key={field.id}
                      className={`absolute border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${field.isCompleted ? 'border-emerald-500' : 'border-[#1f6feb]'} hover:shadow-lg`}
                      style={{ backgroundColor: field.isCompleted ? '#10b98110' : 'transparent', left: `${field.x}%`, top: `${field.y}%`, width: `${field.width || 20}%`, height: `${field.height || 6}%`, minHeight: 40 }}
                      onClick={() => handleFieldClick(field)}>
                      {editingFieldId === field.id ? (
                        <input
                          autoFocus
                          defaultValue={field.value || ''}
                          onBlur={(e) => { completeField(field, e.target.value); setEditingFieldId(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { completeField(field, e.currentTarget.value); setEditingFieldId(null); } }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-full bg-transparent px-2 text-sm font-semibold outline-none text-[#1f6feb] text-center"
                          placeholder={field.type === 'date' ? 'YYYY-MM-DD' : 'Type here...'}
                        />
                      ) : field.isCompleted ? (
                        field.value?.startsWith('data:') ? <img src={field.value} alt="signed" className="w-full h-full object-contain p-1" /> : <span className="text-sm font-bold text-emerald-700 px-2">{field.value}</span>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2">
                          <span style={{ color: '#1f6feb', opacity: 0.6 }}>{ft.icon}</span>
                          <span className="text-[10px] font-bold text-[#1f6feb] opacity-60 uppercase truncate">Click to {field.type}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
             </div>
          ))}
          {!loading && pageCanvases.length === 0 && (
            <div className="w-full flex items-center justify-center bg-white rounded-xl shadow-2xl" style={{ minHeight: 1100 }}>
              <div className="text-center"><FileText size={48} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">{env.documents[0]?.name || 'Document'}</p></div>
            </div>
          )}
        </div>
      </div>
      {showSignPad&&signPadField&&<SignaturePad label={`Sign: ${signPadField.type}`} onSave={url=>{completeField(signPadField,url);setShowSignPad(false);setSignPadField(null);}} onCancel={()=>{setShowSignPad(false);setSignPadField(null);}}/>}
      {showStampPicker&&signPadField&&<StampPicker onSelect={url=>{completeField(signPadField,url);setShowStampPicker(false);setSignPadField(null);}} onCancel={()=>{setShowStampPicker(false);setSignPadField(null);}}/>}
      {showTextPrompt&&signPadField&&<TextInputPrompt type={activePromptType} onSave={val=>{completeField(signPadField,val);setShowTextPrompt(false);setSignPadField(null);}} onCancel={()=>{setShowTextPrompt(false);setSignPadField(null);}}/>}
    </div>
  );
};

/* ─── MAIN ───────────────────────────────────────────────── */
export default function TohoSignCenter({stampConfig,onOpenStudio,pendingStampFieldId,onClearPendingField,isActive,isPaid=true,onUpgrade}:Props) {
  const [view,setView]=useState<View>('dashboard');
  const [envelopes,setEnvelopes]=useState<Envelope[]>([]);
  const [active,setActive]=useState<Envelope|null>(null);
  const [loading,setLoading]=useState(false);

  useEffect(() => {
    if (isActive) {
      loadEnvelopes();
    }
  }, [isActive]);

  const loadEnvelopes = async () => {
    setLoading(true);
    try {
      const res = await envelopeAPI.list();
      if (res.success) {
        // Map _id from backend to id for frontend compatibility
        const mapped = res.data.result.map((e: any) => ({ 
          ...e, 
          id: e._id, 
          documents: e.documents || [], 
          signers: e.signers || [], 
          fields: e.fields || [],
          auditLog: e.auditLog || []
        }));
        setEnvelopes(mapped);
      }
    } catch (err) {
      console.error("Failed to load envelopes:", err);
    } finally {
      setLoading(false);
    }
  };

  const save = async (env: Envelope): Promise<Envelope> => {
    try {
      let savedEnv: Envelope;
      if (env.id && env.id.length > 20) { // Likely a MongoDB ObjectID
        const res = await envelopeAPI.update(env.id, env);
        savedEnv = { ...res.data.result, id: res.data.result._id };
      } else {
        const res = await envelopeAPI.create(env);
        savedEnv = { ...res.data.result, id: res.data.result._id };
      }
      setEnvelopes(es => {
        const i = es.findIndex(e => e.id === savedEnv.id);
        if (i >= 0) { const c = [...es]; c[i] = savedEnv; return c; }
        return [savedEnv, ...es];
      });
      setActive(savedEnv);
      return savedEnv;
    } catch (err) {
      console.error('Failed to save envelope:', err);
      return env;
    }
  };

  const createNew=()=>{
    const env:Envelope={id:'',title:'Untitled Document',status:'draft',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),documents:[],signers:[],fields:[],auditLog:[{id:Math.random().toString(36).slice(2),timestamp:new Date().toISOString(),action:'Document Created',user:'You',ip:'—',details:'New document package created'}]};
    setActive(env);setView('builder');
  };

  const selectEnvelope=(env:Envelope)=>{setActive(env);setView(env.status==='sent'||env.status==='completed'?'signerView':'builder');};

  const deleteEnvelope = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await envelopeAPI.remove(id);
      if (res.success) {
        setEnvelopes(es => es.filter(e => e.id !== id));
        auditAPI.create('Document Deleted', `Deleted document: ${id}`);
      }
    } catch (err) {
      console.error("Failed to delete envelope:", err);
    }
  };

  return (
    <div className="flex flex-col bg-[#0d1117] relative">
      {/* Paywall overlay — shown when user has no paid plan */}
      {!isPaid && (
        <div className="absolute inset-0 z-50 bg-[#0d1117]/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6 text-center px-8">
          <div className="w-16 h-16 bg-[#161b22] border border-[#30363d] rounded-2xl flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-white mb-2">eSign requires a paid plan</h3>
            <p className="text-sm text-[#8b949e] max-w-sm leading-relaxed">Send documents for signature, collect legally-binding eSignatures, and manage your signing workflow. Starting from KES 650/month.</p>
          </div>
          <button onClick={onUpgrade} className="px-8 py-3.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-black transition-colors">
            ⚡ Upgrade via M-Pesa or Card
          </button>
          <p className="text-xs text-[#8b949e]">Plans: KES 650 · KES 2,500 · KES 5,000 /month</p>
        </div>
      )}
      {/* Toho Sign header */}
      <nav className="h-14 bg-[#161b22] border-b border-[#30363d] px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={()=>setView('dashboard')} className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-[#1f6feb] rounded-lg flex items-center justify-center group-hover:bg-[#388bfd] transition-colors"><CheckCircle2 size={15}/></div>
            <span className="font-bold text-white text-sm">Toho Sign</span>
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#21262d] rounded-xl border border-[#30363d]">
          <div className="w-5 h-5 rounded bg-[#1f6feb] flex items-center justify-center text-[9px] font-bold text-white">T</div>
          <span className="text-xs font-semibold text-white hidden sm:block">Tomo Workspace</span>
        </div>
      </nav>
      <main className="flex-1 flex flex-col">
        {view==='dashboard'&&<div className="flex-1 overflow-y-auto"><Dashboard envelopes={envelopes} onSelect={selectEnvelope} onCreate={createNew} onDelete={deleteEnvelope}/></div>}
        {view==='builder'&&active&&<div className="flex-1 flex flex-col"><Builder envelope={active} onUpdate={save} onSend={async (e)=>{ const saved = await save(e); setView('dashboard'); auditAPI.create('Document Sent', `Sent document: ${e.title}`); return saved as any; }} onBack={()=>setView('dashboard')} stampConfig={stampConfig}/></div>}
        {view==='signerView'&&active&&<div className="flex-1 flex flex-col"><SignerView envelope={active} onComplete={async (e)=>{await save(e);setView('dashboard'); auditAPI.create('Document Completed', `Signed document: ${e.title}`);}} onBack={()=>setView('dashboard')}/></div>}
      </main>
    </div>
  );
}
