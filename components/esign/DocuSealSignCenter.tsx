import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText, Upload, Plus, Send, CheckCircle2, Clock, Trash2, PenTool,
  Calendar, Type, X, Save, Eraser, MousePointer2, Stamp, Image as ImageIcon,
  ChevronLeft, UserPlus, Settings, Search, Filter, MoreVertical, Download,
  Eye, Mail, Shield, Hash, AlignLeft, RotateCcw, ZoomIn, ZoomOut,
  ChevronRight, Check, AlertCircle, Copy, ExternalLink, Users, Layers
} from 'lucide-react';
import { Envelope, SignField, FieldType, BulkDocument, StampConfig, SignerInfo, AuditEntry } from '../../types';

/* ─── TYPES ──────────────────────────────────────────────── */
interface Props {
  stampConfig: StampConfig;
  onOpenStudio?: (fieldId?: string) => void;
  pendingStampFieldId?: string | null;
  onClearPendingField?: () => void;
  isActive?: boolean;
}

type View = 'dashboard' | 'builder' | 'signerView' | 'auditLog';

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'signature', label: 'Signature', icon: <PenTool size={14} />, color: '#134589' },
  { type: 'stamp',     label: 'Stamp',     icon: <Stamp size={14} />,   color: '#7c3aed' },
  { type: 'date',      label: 'Date',      icon: <Calendar size={14} />, color: '#059669' },
  { type: 'text',      label: 'Text',      icon: <Type size={14} />,    color: '#d97706' },
  { type: 'initials',  label: 'Initials',  icon: <Hash size={14} />,    color: '#dc2626' },
];

const STATUS_COLOR: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sent:       'bg-blue-50 text-[#134589] border-blue-200',
  draft:      'bg-slate-100 text-slate-600 border-slate-200',
  voided:     'bg-red-50 text-red-700 border-red-200',
  archived:   'bg-gray-100 text-gray-600 border-gray-200',
};

const SIGNER_COLORS = ['#134589','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];

/* ─── SIGNATURE PAD ──────────────────────────────────────── */
const SignaturePad: React.FC<{ onSave:(d:string)=>void; onCancel:()=>void; label?:string }> = ({ onSave, onCancel, label='Draw your signature' }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (ctx) { ctx.strokeStyle = '#041628'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
  }, []);

  const getPos = (e: any, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    const scaleX = c.width / r.width;
    const scaleY = c.height / r.height;
    return { x: (s.clientX - r.left) * scaleX, y: (s.clientY - r.top) * scaleY };
  };

  const start = (e: any) => {
    e.preventDefault(); drawing.current = true;
    const c = ref.current!; const { x, y } = getPos(e, c);
    const ctx = c.getContext('2d')!; ctx.beginPath(); ctx.moveTo(x, y);
  };
  const move = (e: any) => {
    e.preventDefault(); if (!drawing.current) return;
    const c = ref.current!; const { x, y } = getPos(e, c);
    const ctx = c.getContext('2d')!; ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
  };
  const stop = () => { drawing.current = false; };
  const clear = () => { const c = ref.current!; c.getContext('2d')!.clearRect(0,0,c.width,c.height); };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[#c5d8ef]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[#041628]">{label}</h3>
            <p className="text-xs text-[#4d7291]">Sign in the box below</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl"><X size={16} /></button>
        </div>
        <div className="border-2 border-dashed border-[#c5d8ef] rounded-xl overflow-hidden mb-4 bg-[#f8fafc] touch-none relative">
          <canvas ref={ref} width={560} height={200}
            onMouseDown={start} onMouseUp={stop} onMouseLeave={stop} onMouseMove={move}
            onTouchStart={start} onTouchEnd={stop} onTouchMove={move}
            className="w-full cursor-crosshair" />
          <p className="absolute inset-0 flex items-center justify-center text-[#c5d8ef] text-sm pointer-events-none select-none font-medium">Sign here</p>
        </div>
        <div className="flex gap-2">
          <button onClick={clear} className="flex-1 py-2.5 border border-[#c5d8ef] rounded-xl text-sm font-medium text-[#365874] hover:bg-[#f0f6ff] flex items-center justify-center gap-2 transition-colors">
            <Eraser size={14} /> Clear
          </button>
          <button onClick={() => { if (ref.current) onSave(ref.current.toDataURL()); }}
            className="flex-1 py-2.5 bg-[#134589] text-white rounded-xl text-sm font-semibold hover:bg-[#0e3a72] flex items-center justify-center gap-2 transition-colors">
            <Check size={14} /> Apply Signature
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── DASHBOARD ──────────────────────────────────────────── */
const Dashboard: React.FC<{ envelopes: Envelope[]; onSelect:(e:Envelope)=>void; onCreate:()=>void; onDelete:(id:string)=>void }> = ({ envelopes, onSelect, onCreate, onDelete }) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = envelopes.filter(e => {
    const matchFilter = filter === 'all' || e.status === filter;
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: envelopes.length,
    completed: envelopes.filter(e => e.status === 'completed').length,
    pending: envelopes.filter(e => e.status === 'sent').length,
    drafts: envelopes.filter(e => e.status === 'draft').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#041628]">Documents</h1>
          <p className="text-sm text-[#4d7291]">Manage and track all your signing requests</p>
        </div>
        <button onClick={onCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#134589] text-white rounded-xl font-semibold text-sm hover:bg-[#0e3a72] transition-colors shadow-lg shadow-[#134589]/20 self-start sm:self-auto">
          <Plus size={18} /> New Document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: stats.total, color: 'text-[#041628]', bg: 'bg-white' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Awaiting Sign', value: stats.pending, color: 'text-[#134589]', bg: 'bg-[#f0f6ff] border-[#c5d8ef]' },
          { label: 'Drafts', value: stats.drafts, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border rounded-2xl p-5`}>
            <p className="text-xs text-[#4d7291] font-medium mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-2xl border border-[#c5d8ef] overflow-hidden">
        <div className="p-4 border-b border-[#f0f6ff] flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex bg-[#f0f6ff] p-1 rounded-xl gap-1">
            {['all','draft','sent','completed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-white shadow-sm text-[#134589]' : 'text-[#4d7291] hover:text-[#224260]'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4d7291]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..."
              className="w-full pl-9 pr-4 py-2 bg-[#f0f6ff] border border-[#c5d8ef] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#134589] text-[#041628]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#f0f6ff]">
                {['Document', 'Signers', 'Status', 'Created', ''].map((h, i) => (
                  <th key={i} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#4d7291]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f6ff]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-[#f0f6ff] rounded-2xl flex items-center justify-center">
                        <FileText size={24} className="text-[#4d7291]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#224260]">No documents found</p>
                        <p className="text-xs text-[#4d7291] mt-1">Create your first document or adjust filters</p>
                      </div>
                      <button onClick={onCreate} className="mt-2 px-4 py-2 bg-[#134589] text-white rounded-xl text-sm font-medium hover:bg-[#0e3a72] transition-colors">
                        Create Document
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(env => (
                <tr key={env.id} onClick={() => onSelect(env)} className="hover:bg-[#f8fafc] cursor-pointer transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#eaf2fc] rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-[#134589]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#041628] text-sm">{env.title}</p>
                        <p className="text-xs text-[#4d7291]">{env.documents.length} doc{env.documents.length !== 1 ? 's' : ''} · {env.fields.length} field{env.fields.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {env.signers.slice(0, 4).map((s, idx) => (
                        <div key={s.id} title={s.name || s.email}
                          className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: SIGNER_COLORS[idx % SIGNER_COLORS.length] }}>
                          {(s.name || s.email).charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {env.signers.length > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-[#c5d8ef] flex items-center justify-center text-xs font-bold text-[#365874]">
                          +{env.signers.length - 4}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${STATUS_COLOR[env.status] || STATUS_COLOR.draft}`}>
                      {env.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#4d7291]">{new Date(env.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); onSelect(env); }}
                        className="p-1.5 hover:bg-[#eaf2fc] rounded-lg transition-colors" title="Open">
                        <Eye size={15} className="text-[#134589]" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); onDelete(env.id); }}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={15} className="text-red-500" />
                      </button>
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
const Builder: React.FC<{
  envelope: Envelope;
  onUpdate: (e: Envelope) => void;
  onSend: (e: Envelope) => void;
  onBack: () => void;
  stampConfig: StampConfig;
  onOpenStudio?: (fieldId?: string) => void;
}> = ({ envelope, onUpdate, onSend, onBack, stampConfig, onOpenStudio }) => {
  const [env, setEnv] = useState<Envelope>(envelope);
  const [step, setStep] = useState<'upload' | 'signers' | 'fields' | 'review'>(envelope.documents.length > 0 ? (envelope.signers.length > 0 ? 'fields' : 'signers') : 'upload');
  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [newSignerRole, setNewSignerRole] = useState<'signer'|'approver'|'viewer'>('signer');
  const [activeField, setActiveField] = useState<SignField | null>(null);
  const [activeTool, setActiveTool] = useState<FieldType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [activeSigner, setActiveSigner] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upd = (updates: Partial<Envelope>) => {
    const updated = { ...env, ...updates, updatedAt: new Date().toISOString() };
    setEnv(updated);
    onUpdate(updated);
  };

  const addSigner = () => {
    if (!newSignerEmail.trim()) return;
    const signer: SignerInfo = {
      id: Math.random().toString(36).slice(2),
      name: newSignerName,
      email: newSignerEmail,
      role: newSignerRole,
      order: env.signers.length + 1,
      status: 'pending',
    };
    upd({ signers: [...env.signers, signer] });
    setNewSignerName(''); setNewSignerEmail('');
    if (!activeSigner) setActiveSigner(signer.id);
  };

  const removeSigner = (id: string) => {
    upd({
      signers: env.signers.filter(s => s.id !== id),
      fields: env.fields.filter(f => f.signerId !== id),
    });
    if (activeSigner === id) setActiveSigner(env.signers.find(s => s.id !== id)?.id || null);
  };

  const handleFileUpload = (file: File) => {
    const doc: BulkDocument = {
      id: Math.random().toString(36).slice(2),
      name: file.name,
      type: file.type,
      size: file.size,
      pages: 1,
    };

    // For PDFs, generate placeholder pages; for images, use as-is
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (file.type === 'application/pdf') {
        setPdfPages([dataUrl]);
        doc.pages = 1;
        doc.previewUrl = dataUrl;
      } else {
        setPdfPages([dataUrl]);
        doc.pages = 1;
        doc.previewUrl = dataUrl;
      }
      upd({ documents: [doc], title: env.title === 'New Document Package' ? file.name.replace(/\.[^/.]+$/, '') : env.title });
    };
    reader.readAsDataURL(file);
  };

  const placeField = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeTool || !activeSigner) return;
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const field: SignField = {
      id: Math.random().toString(36).slice(2),
      type: activeTool,
      x: Math.max(0, Math.min(x, 85)),
      y: Math.max(0, Math.min(y, 90)),
      width: activeTool === 'signature' ? 25 : activeTool === 'stamp' ? 20 : 15,
      height: activeTool === 'signature' ? 8 : 6,
      page: currentPage,
      signerId: activeSigner,
    };
    upd({ fields: [...env.fields, field] });
    setActiveTool(null);
  };

  const removeField = (id: string) => upd({ fields: env.fields.filter(f => f.id !== id) });

  const sendEnvelope = () => {
    const audit: AuditEntry = {
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      action: 'Document Sent',
      user: 'You',
      ip: '—',
      details: `Sent to ${env.signers.map(s => s.email).join(', ')}`,
    };
    const updated = { ...env, status: 'sent' as const, auditLog: [...env.auditLog, audit], updatedAt: new Date().toISOString() };
    setEnv(updated);
    onSend(updated);
  };

  const steps = ['upload','signers','fields','review'] as const;
  const stepLabels = ['Upload', 'Signers', 'Fields', 'Send'];

  return (
    <div className="flex flex-col h-full">
      {/* Builder Top Bar */}
      <div className="bg-white border-b border-[#c5d8ef] px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[#4d7291] hover:text-[#134589] text-sm font-medium transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="h-4 w-px bg-[#c5d8ef]" />
        <input value={env.title} onChange={e => upd({ title: e.target.value })}
          className="flex-1 text-sm font-semibold text-[#041628] bg-transparent border-none focus:outline-none max-w-sm" />
        <div className="ml-auto flex items-center gap-1">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <button onClick={() => setStep(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${step === s ? 'bg-[#134589] text-white' : i < steps.indexOf(step) ? 'bg-[#eaf2fc] text-[#134589]' : 'text-[#4d7291] hover:text-[#224260]'}`}>
                {stepLabels[i]}
              </button>
              {i < steps.length - 1 && <ChevronRight size={14} className="text-[#c5d8ef]" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#041628] mb-1">Upload Document</h2>
              <p className="text-sm text-[#4d7291]">Upload a PDF, Word doc, or image to prepare for signing</p>
            </div>
            {env.documents.length > 0 ? (
              <div className="bg-white border-2 border-[#c5d8ef] rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#eaf2fc] rounded-xl flex items-center justify-center">
                    <FileText size={20} className="text-[#134589]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#041628] text-sm truncate">{env.documents[0].name}</p>
                    <p className="text-xs text-[#4d7291]">{(env.documents[0].size / 1024).toFixed(1)} KB · {env.documents[0].pages} page(s)</p>
                  </div>
                  <button onClick={() => upd({ documents: [] })} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                    <X size={15} className="text-red-500" />
                  </button>
                </div>
                {pdfPages[0] && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-[#c5d8ef]">
                    <img src={pdfPages[0]} alt="Preview" className="w-full h-48 object-cover" />
                  </div>
                )}
                <button onClick={() => setStep('signers')} className="mt-4 w-full py-2.5 bg-[#134589] text-white rounded-xl text-sm font-semibold hover:bg-[#0e3a72] transition-colors">
                  Continue to Signers →
                </button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-[#c5d8ef] rounded-2xl p-12 text-center cursor-pointer hover:border-[#134589] hover:bg-[#f8fafc] transition-all group">
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="sr-only"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                <div className="w-16 h-16 bg-[#eaf2fc] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#daeaf8] transition-colors">
                  <Upload size={28} className="text-[#134589]" />
                </div>
                <p className="font-bold text-[#041628] text-lg mb-1">Drop file or click to browse</p>
                <p className="text-sm text-[#4d7291]">Supports PDF, Word (.docx), PNG, JPG</p>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Step: Signers */}
      {step === 'signers' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-lg mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#041628] mb-1">Add Signers</h2>
              <p className="text-sm text-[#4d7291]">Add people who need to sign this document</p>
            </div>

            {/* Existing signers */}
            <div className="space-y-2">
              {env.signers.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3 bg-white border border-[#c5d8ef] rounded-xl p-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: SIGNER_COLORS[idx % SIGNER_COLORS.length] }}>
                    {(s.name || s.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#041628] text-sm truncate">{s.name || '(No name)'}</p>
                    <p className="text-xs text-[#4d7291] truncate">{s.email} · {s.role}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLOR[s.status] || STATUS_COLOR.draft} border`}>{s.status}</span>
                  <button onClick={() => removeSigner(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                    <Trash2 size={13} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add signer form */}
            <div className="bg-white border border-[#c5d8ef] rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold text-[#224260]">Add a signer</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#4d7291] font-medium block mb-1">Full Name</label>
                  <input value={newSignerName} onChange={e => setNewSignerName(e.target.value)} placeholder="Jane Doe"
                    className="w-full border border-[#c5d8ef] rounded-xl px-3 py-2 text-sm bg-[#f8fafc] text-[#041628] focus:outline-none focus:ring-2 focus:ring-[#134589]" />
                </div>
                <div>
                  <label className="text-xs text-[#4d7291] font-medium block mb-1">Email Address</label>
                  <input value={newSignerEmail} onChange={e => setNewSignerEmail(e.target.value)} placeholder="jane@example.com" type="email"
                    onKeyDown={e => e.key === 'Enter' && addSigner()}
                    className="w-full border border-[#c5d8ef] rounded-xl px-3 py-2 text-sm bg-[#f8fafc] text-[#041628] focus:outline-none focus:ring-2 focus:ring-[#134589]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#4d7291] font-medium block mb-1">Role</label>
                <div className="flex gap-2">
                  {(['signer','approver','viewer'] as const).map(r => (
                    <button key={r} onClick={() => setNewSignerRole(r)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${newSignerRole === r ? 'bg-[#134589] text-white border-[#134589]' : 'bg-white text-[#365874] border-[#c5d8ef] hover:border-[#134589]'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={addSigner} disabled={!newSignerEmail}
                className="w-full py-2.5 bg-[#134589] text-white rounded-xl text-sm font-semibold hover:bg-[#0e3a72] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <UserPlus size={16} /> Add Signer
              </button>
            </div>

            {env.signers.length > 0 && (
              <button onClick={() => setStep('fields')} className="w-full py-3 bg-[#134589] text-white rounded-xl font-semibold hover:bg-[#0e3a72] transition-colors">
                Continue to Place Fields →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step: Fields */}
      {step === 'fields' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Field Toolbar */}
          <div className="w-56 flex-shrink-0 bg-white border-r border-[#c5d8ef] p-4 space-y-4 overflow-y-auto">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#4d7291] mb-3">Field Types</p>
              <div className="space-y-1.5">
                {FIELD_TYPES.map(ft => (
                  <button key={ft.type} onClick={() => setActiveTool(ft.type === activeTool ? null : ft.type)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTool === ft.type ? 'text-white shadow-md' : 'bg-[#f0f6ff] text-[#224260] hover:bg-[#eaf2fc]'}`}
                    style={{ backgroundColor: activeTool === ft.type ? ft.color : undefined }}>
                    <span style={{ color: activeTool === ft.type ? '#fff' : ft.color }}>{ft.icon}</span>
                    {ft.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#4d7291] mb-3">Assign to Signer</p>
              <div className="space-y-1.5">
                {env.signers.map((s, idx) => (
                  <button key={s.id} onClick={() => setActiveSigner(s.id === activeSigner ? null : s.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${activeSigner === s.id ? 'text-white' : 'bg-[#f0f6ff] text-[#224260] hover:bg-[#eaf2fc]'}`}
                    style={{ backgroundColor: activeSigner === s.id ? SIGNER_COLORS[idx % SIGNER_COLORS.length] : undefined }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: SIGNER_COLORS[idx % SIGNER_COLORS.length] }}>
                      {(s.name || s.email).charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{s.name || s.email}</span>
                  </button>
                ))}
              </div>
            </div>

            {activeTool && activeSigner && (
              <div className="bg-[#eaf2fc] rounded-xl p-3 border border-[#c5d8ef]">
                <p className="text-xs text-[#134589] font-semibold mb-1">Ready to place</p>
                <p className="text-xs text-[#4d7291]">Click on the document to place a <span className="font-semibold">{activeTool}</span> field</p>
              </div>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#4d7291] mb-2">Placed Fields ({env.fields.filter(f => f.page === currentPage).length})</p>
              <div className="space-y-1">
                {env.fields.filter(f => f.page === currentPage).map(field => {
                  const ft = FIELD_TYPES.find(f => f.type === field.type)!;
                  const signer = env.signers.find(s => s.id === field.signerId);
                  const sidx = env.signers.findIndex(s => s.id === field.signerId);
                  return (
                    <div key={field.id} className="flex items-center gap-2 px-2 py-1.5 bg-[#f0f6ff] rounded-lg">
                      <span style={{ color: ft.color }}>{ft.icon}</span>
                      <span className="text-xs text-[#224260] flex-1 truncate">{signer?.name || signer?.email || 'Unknown'}</span>
                      <button onClick={() => removeField(field.id)} className="p-0.5 hover:bg-red-50 rounded transition-colors">
                        <X size={11} className="text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Document Canvas */}
          <div className="flex-1 bg-[#f0f6ff] overflow-auto flex items-start justify-center p-8">
            <div className="w-full max-w-2xl">
              {env.documents.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-[#c5d8ef] flex items-center justify-center" style={{ minHeight: '800px' }}>
                  <div className="text-center p-8">
                    <FileText size={40} className="text-[#c5d8ef] mx-auto mb-4" />
                    <p className="text-[#4d7291] font-medium">No document uploaded</p>
                    <button onClick={() => setStep('upload')} className="mt-3 px-4 py-2 bg-[#134589] text-white rounded-xl text-sm font-medium hover:bg-[#0e3a72] transition-colors">
                      Upload Document
                    </button>
                  </div>
                </div>
              ) : (
                <div ref={pageRef} onClick={placeField}
                  className={`relative bg-white rounded-xl shadow-2xl overflow-hidden border border-[#c5d8ef] ${activeTool && activeSigner ? 'cursor-crosshair' : 'cursor-default'}`}
                  style={{ minHeight: '1100px' }}>

                  {/* Document background */}
                  {pdfPages[currentPage - 1] ? (
                    <img src={pdfPages[currentPage - 1]} alt={`Page ${currentPage}`} className="w-full h-auto pointer-events-none select-none" />
                  ) : (
                    <div className="w-full flex items-center justify-center" style={{ minHeight: '1100px' }}>
                      <div className="text-center p-8 space-y-3">
                        <FileText size={48} className="text-[#c5d8ef] mx-auto" />
                        <p className="text-[#4d7291] font-medium text-sm">{env.documents[0]?.name}</p>
                        <p className="text-xs text-[#4d7291]">Click to place signature fields</p>
                      </div>
                    </div>
                  )}

                  {/* Placed Fields */}
                  {env.fields.filter(f => f.page === currentPage).map(field => {
                    const ft = FIELD_TYPES.find(f => f.type === field.type)!;
                    const signer = env.signers.find(s => s.id === field.signerId);
                    const sidx = env.signers.findIndex(s => s.id === field.signerId);
                    return (
                      <div key={field.id}
                        className="absolute border-2 rounded-lg flex items-center justify-center group cursor-move select-none"
                        style={{
                          left: `${field.x}%`,
                          top: `${field.y}%`,
                          width: `${field.width || 20}%`,
                          height: `${field.height || 6}%`,
                          borderColor: SIGNER_COLORS[sidx % SIGNER_COLORS.length],
                          backgroundColor: `${SIGNER_COLORS[sidx % SIGNER_COLORS.length]}15`,
                          minHeight: '32px',
                        }}
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 px-2">
                          <span style={{ color: SIGNER_COLORS[sidx % SIGNER_COLORS.length] }}>{ft.icon}</span>
                          <span className="text-[10px] font-bold truncate" style={{ color: SIGNER_COLORS[sidx % SIGNER_COLORS.length] }}>
                            {field.type} – {(signer?.name || signer?.email || '').split(' ')[0]}
                          </span>
                        </div>
                        <button onClick={e => { e.stopPropagation(); removeField(field.id); }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10">
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Review + Send */}
          <div className="w-48 flex-shrink-0 bg-white border-l border-[#c5d8ef] p-4 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#4d7291] mb-3">Summary</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#4d7291]">Documents</span>
                  <span className="font-semibold text-[#041628]">{env.documents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4d7291]">Signers</span>
                  <span className="font-semibold text-[#041628]">{env.signers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4d7291]">Fields</span>
                  <span className="font-semibold text-[#041628]">{env.fields.length}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#4d7291] mb-2">Checklist</p>
              <div className="space-y-1.5">
                {[
                  { ok: env.documents.length > 0, label: 'Document uploaded' },
                  { ok: env.signers.length > 0, label: 'Signer(s) added' },
                  { ok: env.fields.length > 0, label: 'Fields placed' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.ok ? 'bg-emerald-500' : 'bg-[#c5d8ef]'}`}>
                      {item.ok && <Check size={10} className="text-white" />}
                    </div>
                    <span className={`text-xs ${item.ok ? 'text-[#224260]' : 'text-[#4d7291]'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={sendEnvelope}
              disabled={env.documents.length === 0 || env.signers.length === 0 || env.fields.length === 0}
              className="w-full py-3 bg-[#134589] text-white rounded-xl text-xs font-bold hover:bg-[#0e3a72] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#134589]/20">
              <Send size={14} /> Send for Signing
            </button>
            <button onClick={() => onUpdate(env)} className="w-full py-2 border border-[#c5d8ef] text-[#365874] rounded-xl text-xs font-medium hover:bg-[#f0f6ff] transition-colors flex items-center justify-center gap-2">
              <Save size={13} /> Save Draft
            </button>
          </div>
        </div>
      )}

      {/* Step: Review / Signer View */}
      {step === 'review' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#041628] mb-1">Review & Send</h2>
              <p className="text-sm text-[#4d7291]">Review all details before sending to signers</p>
            </div>

            <div className="bg-white border border-[#c5d8ef] rounded-2xl divide-y divide-[#f0f6ff]">
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#4d7291] mb-3">Document</p>
                {env.documents.map(d => (
                  <div key={d.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#eaf2fc] rounded-xl flex items-center justify-center">
                      <FileText size={16} className="text-[#134589]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#041628] text-sm">{d.name}</p>
                      <p className="text-xs text-[#4d7291]">{d.pages} page(s)</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#4d7291] mb-3">Signers ({env.signers.length})</p>
                <div className="space-y-2">
                  {env.signers.map((s, idx) => (
                    <div key={s.id} className="flex items-center gap-3 py-1">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: SIGNER_COLORS[idx % SIGNER_COLORS.length] }}>
                        {(s.name || s.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#041628] text-sm">{s.name}</p>
                        <p className="text-xs text-[#4d7291]">{s.email}</p>
                      </div>
                      <span className="ml-auto text-xs text-[#4d7291] capitalize">{s.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#4d7291] mb-3">Fields ({env.fields.length})</p>
                <div className="flex flex-wrap gap-2">
                  {FIELD_TYPES.map(ft => {
                    const count = env.fields.filter(f => f.type === ft.type).length;
                    if (!count) return null;
                    return (
                      <div key={ft.type} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f6ff] rounded-xl text-xs">
                        <span style={{ color: ft.color }}>{ft.icon}</span>
                        <span className="text-[#224260] font-medium capitalize">{ft.label}: {count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button onClick={sendEnvelope}
              disabled={env.documents.length === 0 || env.signers.length === 0 || env.fields.length === 0}
              className="w-full py-3.5 bg-[#134589] text-white rounded-xl font-bold hover:bg-[#0e3a72] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-[#134589]/20">
              <Send size={18} /> Send to {env.signers.length} Signer{env.signers.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── SIGNER VIEW ────────────────────────────────────────── */
const SignerView: React.FC<{ envelope: Envelope; onComplete: (e: Envelope) => void; onBack: () => void; stampConfig: StampConfig }> =
  ({ envelope, onComplete, onBack, stampConfig }) => {
  const [env, setEnv] = useState<Envelope>(envelope);
  const [activeField, setActiveField] = useState<SignField | null>(null);
  const [showSignPad, setShowSignPad] = useState(false);
  const [signPadField, setSignPadField] = useState<SignField | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const completeField = (field: SignField, value: string) => {
    const updated = env.fields.map(f => f.id === field.id ? { ...f, value, isCompleted: true } : f);
    setEnv(e => ({ ...e, fields: updated }));
  };

  const allComplete = env.fields.every(f => f.isCompleted);

  const finishSigning = () => {
    const audit: AuditEntry = {
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      action: 'Document Signed',
      user: env.signers[0]?.name || 'Signer',
      ip: '—',
      details: `All ${env.fields.length} field(s) completed`,
    };
    const done = { ...env, status: 'completed' as const, auditLog: [...env.auditLog, audit] };
    onComplete(done);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-[#c5d8ef] px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[#4d7291] hover:text-[#134589] text-sm font-medium transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="h-4 w-px bg-[#c5d8ef]" />
        <p className="font-semibold text-[#041628] text-sm flex-1">{env.title}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#4d7291]">{env.fields.filter(f => f.isCompleted).length}/{env.fields.length} signed</span>
          {allComplete && (
            <button onClick={finishSigning} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
              <Check size={15} /> Finish Signing
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#f0f6ff] flex items-start justify-center p-8">
        <div className="w-full max-w-2xl">
          <div className="relative bg-white rounded-xl shadow-2xl border border-[#c5d8ef]" style={{ minHeight: '1100px' }}>
            {/* Document */}
            {env.documents[0]?.previewUrl ? (
              <img src={env.documents[0].previewUrl} alt="Document" className="w-full h-auto rounded-t-xl" />
            ) : (
              <div className="w-full flex items-center justify-center" style={{ minHeight: '1100px' }}>
                <div className="text-center">
                  <FileText size={48} className="text-[#c5d8ef] mx-auto mb-3" />
                  <p className="text-[#4d7291] text-sm">{env.documents[0]?.name || 'Document'}</p>
                </div>
              </div>
            )}

            {/* Fields overlay */}
            {env.fields.filter(f => f.page === currentPage).map(field => {
              const ft = FIELD_TYPES.find(f => f.type === field.type)!;
              return (
                <div key={field.id}
                  className={`absolute border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${field.isCompleted ? 'border-emerald-400 bg-emerald-50' : 'border-[#134589] bg-[#eaf2fc] hover:bg-[#daeaf8] animate-pulse'}`}
                  style={{ left:`${field.x}%`, top:`${field.y}%`, width:`${field.width||20}%`, height:`${field.height||6}%`, minHeight:'32px', animationIterationCount: field.isCompleted ? 0 : undefined }}
                  onClick={() => { if (!field.isCompleted) { setSignPadField(field); if (field.type === 'signature' || field.type === 'initials') setShowSignPad(true); else { completeField(field, field.type === 'date' ? new Date().toLocaleDateString() : 'TEXT'); } } }}>
                  {field.isCompleted ? (
                    field.value?.startsWith('data:') ? (
                      <img src={field.value} alt="signed" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 px-2">{field.value}</span>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 px-2">
                      <span style={{ color: '#134589' }}>{ft.icon}</span>
                      <span className="text-[10px] font-bold text-[#134589] capitalize">Click to {field.type}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showSignPad && signPadField && (
        <SignaturePad
          label={`Sign: ${signPadField.type}`}
          onSave={url => { completeField(signPadField, url); setShowSignPad(false); setSignPadField(null); }}
          onCancel={() => { setShowSignPad(false); setSignPadField(null); }}
        />
      )}
    </div>
  );
};

/* ─── AUDIT LOG ──────────────────────────────────────────── */
const AuditLog: React.FC<{ envelope: Envelope; onBack: () => void }> = ({ envelope, onBack }) => (
  <div className="p-8 max-w-3xl mx-auto space-y-6">
    <div className="flex items-center gap-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[#4d7291] hover:text-[#134589] text-sm font-medium transition-colors">
        <ChevronLeft size={16} /> Back
      </button>
      <div>
        <h2 className="text-xl font-bold text-[#041628]">Audit Trail</h2>
        <p className="text-sm text-[#4d7291]">{envelope.title}</p>
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-[#c5d8ef] overflow-hidden">
      <div className="px-5 py-3 border-b border-[#f0f6ff] bg-[#f8fafc] flex items-center gap-2">
        <Shield size={16} className="text-[#134589]" />
        <span className="text-sm font-semibold text-[#224260]">Tamper-evident record — {envelope.auditLog.length} events</span>
      </div>
      <div className="p-5 space-y-3">
        {envelope.auditLog.length === 0 ? (
          <p className="text-sm text-[#4d7291] text-center py-8">No events yet</p>
        ) : envelope.auditLog.map(entry => (
          <div key={entry.id} className="flex items-start gap-4 p-3 bg-[#f8fafc] rounded-xl border border-[#f0f6ff]">
            <div className="w-8 h-8 bg-[#eaf2fc] rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={15} className="text-[#134589]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="font-semibold text-[#041628] text-sm">{entry.action}</p>
                <span className="text-xs text-[#4d7291] flex-shrink-0">{new Date(entry.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-xs text-[#4d7291]">{entry.user} · {entry.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─── MAIN COMPONENT ─────────────────────────────────────── */
export default function TohoSignCenter({ stampConfig, onOpenStudio, pendingStampFieldId, onClearPendingField, isActive }: Props) {
  const [view, setView] = useState<View>('dashboard');
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [active, setActive] = useState<Envelope | null>(null);

  const saveEnvelope = (env: Envelope) => {
    setEnvelopes(es => {
      const idx = es.findIndex(e => e.id === env.id);
      if (idx >= 0) { const copy = [...es]; copy[idx] = env; return copy; }
      return [env, ...es];
    });
  };

  const createNew = () => {
    const env: Envelope = {
      id: Math.random().toString(36).slice(2,11),
      title: 'Untitled Document',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [],
      signers: [],
      fields: [],
      auditLog: [{
        id: Math.random().toString(36).slice(2),
        timestamp: new Date().toISOString(),
        action: 'Document Created',
        user: 'You',
        ip: '—',
        details: 'New document package created',
      }],
    };
    setActive(env);
    setView('builder');
  };

  const selectEnvelope = (env: Envelope) => {
    setActive(env);
    setView(env.status === 'sent' || env.status === 'completed' ? 'signerView' : 'builder');
  };

  const handleSend = (env: Envelope) => {
    saveEnvelope(env);
    setActive(env);
    setView('dashboard');
  };

  const handleComplete = (env: Envelope) => {
    saveEnvelope(env);
    setActive(null);
    setView('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f6ff]">
      {/* Toho Sign Header */}
      <nav className="h-16 bg-[#041628] text-white px-6 flex items-center justify-between flex-shrink-0 shadow-xl">
        <div className="flex items-center gap-6">
          <button onClick={() => setView('dashboard')} className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-[#134589] rounded-xl flex items-center justify-center group-hover:bg-[#1a5cad] transition-colors">
              <CheckCircle2 size={18} />
            </div>
            <span className="font-bold text-base tracking-tight">Toho Sign</span>
          </button>
          <div className="hidden md:flex items-center gap-1">
            {(['Dashboard'] as const).map(item => (
              <button key={item}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${view === 'dashboard' ? 'bg-[#0e3a72] text-white' : 'text-[#7ab3e8] hover:text-white hover:bg-[#0e3a72]'}`}
                onClick={() => setView('dashboard')}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0e3a72] rounded-xl border border-[#134589]">
            <div className="w-6 h-6 rounded-lg bg-[#134589] flex items-center justify-center text-[10px] font-bold">T</div>
            <span className="text-xs font-semibold hidden sm:block">Tomo Workspace</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {view === 'dashboard' && (
          <div className="flex-1 overflow-y-auto">
            <Dashboard
              envelopes={envelopes}
              onSelect={selectEnvelope}
              onCreate={createNew}
              onDelete={id => setEnvelopes(es => es.filter(e => e.id !== id))}
            />
          </div>
        )}

        {view === 'builder' && active && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <Builder
              envelope={active}
              onUpdate={saveEnvelope}
              onSend={handleSend}
              onBack={() => setView('dashboard')}
              stampConfig={stampConfig}
              onOpenStudio={onOpenStudio}
            />
          </div>
        )}

        {view === 'signerView' && active && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <SignerView
              envelope={active}
              onComplete={handleComplete}
              onBack={() => setView('dashboard')}
              stampConfig={stampConfig}
            />
          </div>
        )}

        {view === 'auditLog' && active && (
          <div className="flex-1 overflow-y-auto">
            <AuditLog envelope={active} onBack={() => setView('dashboard')} />
          </div>
        )}
      </main>
    </div>
  );
}
