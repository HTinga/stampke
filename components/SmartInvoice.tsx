import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Download, Send, Eye, Edit3, X, Check, Search,
  ChevronDown, AlertCircle, CheckCircle2, Clock, DollarSign,
  FileText, Receipt, Package, RefreshCw, Upload, Building2,
  Phone, Mail, MapPin, Calendar, Hash, Printer, ArrowLeft,
  MoreVertical, Copy, Star, Zap, TrendingUp
} from 'lucide-react';
import { jsPDF } from 'jspdf';

/* ── Types ── */
type DocType   = 'invoice' | 'quotation' | 'receipt';
type DocStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

interface LineItem { id: string; description: string; qty: number; unitPrice: number; unit: string; }
interface Document {
  id: string; type: DocType; number: string;
  clientName: string; clientEmail: string; clientPhone: string; clientAddress: string;
  businessName: string; businessEmail: string; businessPhone: string; businessAddress: string;
  businessLogo?: string; pin?: string; // KRA PIN
  lineItems: LineItem[];
  subtotal: number; taxRate: number; taxAmount: number; discount: number; total: number;
  currency: string; notes: string; terms: string;
  issuedDate: string; dueDate: string;
  status: DocStatus; paidAt?: string;
  createdAt: string; updatedAt: string;
}

/* ── Constants ── */
const CURRENCIES = ['KES','USD','EUR','GBP','UGX','TZS','ZAR'];
const TAX_RATES  = [0, 8, 16]; // KRA VAT rates
const INDUSTRIES = ['General','Real Estate','Construction','Retail','Hospitality','Healthcare','Education','Legal','Consulting','Transport','Agriculture','Technology','Media','Events','Import/Export'];
const TEMPLATES  = [
  { id: 'clean',   label: 'Clean',      bg: '#fff',    accent: '#1f6feb' },
  { id: 'modern',  label: 'Modern',     bg: '#0d1117', accent: '#4285F4' },
  { id: 'classic', label: 'Classic',    bg: '#fff',    accent: '#000' },
];
const KEY = 'stampke_docs_v2';
const BIZ_KEY = 'stampke_biz_v1';

/* ── Helpers ── */
const uid = () => Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().slice(0,10);
const addDays = (d: string, n: number) => { const dt = new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10); };
const fmt = (n: number, c='KES') => `${c} ${Number(n||0).toLocaleString('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const loadDocs = (): Document[] => { try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } };
const saveDocs = (d: Document[]) => localStorage.setItem(KEY, JSON.stringify(d));
const loadBiz  = () => { try { return JSON.parse(localStorage.getItem(BIZ_KEY)||'{}'); } catch { return {}; } };
const saveBiz  = (b: any) => localStorage.setItem(BIZ_KEY, JSON.stringify(b));

const newLine = (): LineItem => ({ id: uid(), description: '', qty: 1, unitPrice: 0, unit: 'pcs' });
const calcDoc = (doc: Partial<Document>): Partial<Document> => {
  const sub = (doc.lineItems||[]).reduce((s,i) => s + i.qty*i.unitPrice, 0);
  const tax = sub * ((doc.taxRate||0)/100);
  const disc = doc.discount || 0;
  return { ...doc, subtotal: sub, taxAmount: tax, total: sub + tax - disc };
};

const STATUS_MAP: Record<DocStatus, { label: string; cls: string }> = {
  draft:     { label: 'Draft',     cls: 'bg-[#30363d] text-[#8b949e]' },
  sent:      { label: 'Sent',      cls: 'bg-blue-500/20 text-blue-400' },
  paid:      { label: 'Paid',      cls: 'bg-emerald-500/20 text-emerald-400' },
  overdue:   { label: 'Overdue',   cls: 'bg-red-500/20 text-red-400' },
  cancelled: { label: 'Cancelled', cls: 'bg-[#30363d] text-[#8b949e]' },
};
const DOC_ICON: Record<DocType, React.ReactNode> = {
  invoice:   <Receipt size={14} />,
  quotation: <Package size={14} />,
  receipt:   <CheckCircle2 size={14} />,
};

const inputCls  = 'w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]';
const labelCls  = 'block text-[11px] font-bold text-[#8b949e] uppercase tracking-wide mb-1';

/* ════════════════════════════════════════════════════════════════ */
export default function SmartInvoice() {
  const [docs, setDocs]         = useState<Document[]>(loadDocs);
  const [view, setView]         = useState<'list' | 'create' | 'preview'>('list');
  const [editing, setEditing]   = useState<Partial<Document> | null>(null);
  const [previewing, setPrev]   = useState<Document | null>(null);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<DocType | 'all'>('all');
  const [biz, setBiz]           = useState(loadBiz);
  const [showBizSetup, setShowBizSetup] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const persist = (d: Document[]) => { setDocs(d); saveDocs(d); };

  /* ── Auto-mark overdue ── */
  useEffect(() => {
    const updated = docs.map(d => {
      if (d.status === 'sent' && new Date(d.dueDate) < new Date()) return { ...d, status: 'overdue' as DocStatus };
      return d;
    });
    if (JSON.stringify(updated) !== JSON.stringify(docs)) persist(updated);
  }, []);

  /* ── New document ── */
  const startNew = (type: DocType = 'invoice') => {
    const count = docs.filter(d => d.type === type).length + 1;
    const prefix = type === 'invoice' ? 'INV' : type === 'quotation' ? 'QUO' : 'RCT';
    setEditing(calcDoc({
      id: uid(), type, number: `${prefix}-${new Date().getFullYear()}-${String(count).padStart(4,'0')}`,
      clientName:'', clientEmail:'', clientPhone:'', clientAddress:'',
      businessName: biz.name||'', businessEmail: biz.email||'', businessPhone: biz.phone||'',
      businessAddress: biz.address||'', businessLogo: biz.logo||'', pin: biz.pin||'',
      lineItems: [newLine()], taxRate: 16, discount: 0, currency: 'KES',
      notes: type === 'invoice' ? 'Thank you for your business!' : type === 'quotation' ? 'This quotation is valid for 30 days.' : 'Payment received. Thank you!',
      terms: 'Payment is due within 30 days of invoice date.',
      issuedDate: today(), dueDate: addDays(today(), 30),
      status: type === 'receipt' ? 'paid' : 'draft',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }));
    setView('create');
  };

  const save = () => {
    if (!editing) return;
    const doc = { ...calcDoc(editing), updatedAt: new Date().toISOString() } as Document;
    if (!doc.clientName?.trim()) { alert('Client name is required.'); return; }
    if (!doc.lineItems?.length || !doc.lineItems[0].description?.trim()) { alert('Add at least one item.'); return; }
    const updated = docs.find(d => d.id === doc.id) ? docs.map(d => d.id === doc.id ? doc : d) : [doc, ...docs];
    persist(updated); setView('list'); setEditing(null);
  };

  const del = (id: string) => { if (confirm('Delete this document?')) persist(docs.filter(d => d.id !== id)); };

  const duplicate = (doc: Document) => {
    const count = docs.filter(d => d.type === doc.type).length + 1;
    const prefix = doc.type === 'invoice' ? 'INV' : doc.type === 'quotation' ? 'QUO' : 'RCT';
    const newDoc = { ...doc, id: uid(), number: `${prefix}-${new Date().getFullYear()}-${String(count).padStart(4,'0')}`, status: 'draft' as DocStatus, issuedDate: today(), dueDate: addDays(today(),30), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    persist([newDoc, ...docs]);
  };

  const updateStatus = (id: string, status: DocStatus) => persist(docs.map(d => d.id === id ? { ...d, status, paidAt: status === 'paid' ? new Date().toISOString() : d.paidAt } : d));

  /* ── Export PDF ── */
  const exportPDF = (doc: Document) => {
    const pdf = new jsPDF({ format: 'a4', unit: 'pt' });
    const W = 595, M = 40;
    const type = doc.type.toUpperCase();
    let y = M;

    // Header
    pdf.setFillColor(31,111,235); pdf.rect(0,0,W,70,'F');
    pdf.setTextColor(255,255,255); pdf.setFont('helvetica','bold'); pdf.setFontSize(20);
    pdf.text(doc.businessName || 'Your Business', M, 35);
    pdf.setFontSize(11); pdf.setFont('helvetica','normal');
    pdf.text(`${type}  #${doc.number}`, M, 52);
    pdf.setFontSize(9);
    pdf.text(`Issued: ${doc.issuedDate}  |  Due: ${doc.dueDate}`, W/2, 52, { align:'center' });
    if (doc.pin) pdf.text(`KRA PIN: ${doc.pin}`, W-M, 35, { align:'right' });
    y = 90;

    // Business & Client
    pdf.setTextColor(30,30,30); pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
    pdf.text('FROM', M, y); pdf.text('BILL TO', W/2+10, y);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9); y += 14;
    const bizLines = [doc.businessName||'', doc.businessEmail||'', doc.businessPhone||'', doc.businessAddress||''].filter(Boolean);
    const clientLines = [doc.clientName||'', doc.clientEmail||'', doc.clientPhone||'', doc.clientAddress||''].filter(Boolean);
    const maxLines = Math.max(bizLines.length, clientLines.length);
    for (let i = 0; i < maxLines; i++) {
      if (bizLines[i]) pdf.text(bizLines[i], M, y);
      if (clientLines[i]) pdf.text(clientLines[i], W/2+10, y);
      y += 13;
    }
    y += 10;

    // Table header
    pdf.setFillColor(243,244,246); pdf.rect(M, y, W-M*2, 18, 'F');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(9); pdf.setTextColor(80,80,80);
    pdf.text('DESCRIPTION', M+5, y+12);
    pdf.text('QTY', W-160, y+12, { align:'right' });
    pdf.text('UNIT PRICE', W-100, y+12, { align:'right' });
    pdf.text('TOTAL', W-M, y+12, { align:'right' });
    y += 22;

    // Line items
    pdf.setFont('helvetica','normal'); pdf.setTextColor(30,30,30);
    doc.lineItems.forEach((item, i) => {
      if (i % 2 === 0) { pdf.setFillColor(252,252,252); pdf.rect(M, y-10, W-M*2, 16, 'F'); }
      const itTotal = item.qty * item.unitPrice;
      pdf.text(item.description, M+5, y);
      pdf.text(String(item.qty), W-160, y, { align:'right' });
      pdf.text(fmt(item.unitPrice, doc.currency), W-100, y, { align:'right' });
      pdf.text(fmt(itTotal, doc.currency), W-M, y, { align:'right' });
      y += 16;
    });
    y += 10;

    // Totals
    const totals = [
      ['Subtotal', fmt(doc.subtotal, doc.currency)],
      ...(doc.taxRate > 0 ? [[`VAT (${doc.taxRate}%)`, fmt(doc.taxAmount, doc.currency)]] : []),
      ...(doc.discount > 0 ? [['Discount', `-${fmt(doc.discount, doc.currency)}`]] : []),
    ];
    totals.forEach(([label, value]) => {
      pdf.setFont('helvetica','normal'); pdf.setFontSize(9);
      pdf.text(label, W-150, y); pdf.text(value, W-M, y, { align:'right' });
      y += 14;
    });
    pdf.setFont('helvetica','bold'); pdf.setFontSize(11);
    pdf.setFillColor(31,111,235); pdf.rect(W-160, y-11, 130, 18, 'F');
    pdf.setTextColor(255,255,255);
    pdf.text('TOTAL', W-150, y); pdf.text(fmt(doc.total, doc.currency), W-M, y, { align:'right' });
    y += 24; pdf.setTextColor(30,30,30);

    // Notes
    if (doc.notes) {
      pdf.setFont('helvetica','italic'); pdf.setFontSize(8); pdf.setTextColor(100,100,100);
      pdf.text(doc.notes, M, y); y += 12;
    }
    if (doc.terms) { pdf.setFont('helvetica','normal'); pdf.text(`Terms: ${doc.terms}`, M, y); }

    // Footer
    pdf.setFontSize(7); pdf.setTextColor(150,150,150);
    pdf.text('Generated by StampKE · stampke.co.ke', W/2, 820, { align:'center' });

    pdf.save(`${doc.type}-${doc.number}.pdf`);
  };

  const filtered = docs.filter(d =>
    (filter === 'all' || d.type === filter) &&
    (!search || d.clientName.toLowerCase().includes(search.toLowerCase()) || d.number.toLowerCase().includes(search.toLowerCase()))
  );

  /* ── Summary stats ── */
  const stats = {
    total: docs.filter(d => d.type === 'invoice').reduce((s,d) => s+d.total, 0),
    paid:  docs.filter(d => d.status === 'paid').reduce((s,d) => s+d.total, 0),
    overdue: docs.filter(d => d.status === 'overdue').length,
    draft: docs.filter(d => d.status === 'draft').length,
  };

  /* ══ LIST VIEW ═════════════════════════════════════════════════ */
  if (view === 'list') return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Smart Invoice</h1>
          <p className="text-sm text-[#8b949e]">KRA-compliant invoices, quotations & receipts</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowBizSetup(true)} className="flex items-center gap-1.5 px-3 py-2 border border-[#30363d] hover:border-[#58a6ff] text-[#8b949e] hover:text-white rounded-xl text-xs font-bold transition-colors">
            <Building2 size={13} /> Business Setup
          </button>
          <div className="flex gap-2">
            {(['invoice','quotation','receipt'] as DocType[]).map(t => (
              <button key={t} onClick={() => startNew(t)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${t==='invoice' ? 'bg-[#1f6feb] hover:bg-[#388bfd] text-white' : 'border border-[#30363d] text-[#8b949e] hover:text-white'}`}>
                {DOC_ICON[t]} {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoiced', value: fmt(stats.total), sub: 'all time', color: 'text-white' },
          { label: 'Collected',      value: fmt(stats.paid),  sub: 'paid',     color: 'text-emerald-400' },
          { label: 'Overdue',        value: stats.overdue,    sub: 'invoices', color: stats.overdue > 0 ? 'text-red-400' : 'text-white' },
          { label: 'Drafts',         value: stats.draft,      sub: 'pending',  color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
            <p className="text-[11px] text-[#8b949e] uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-[#8b949e]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client or number..." className="w-full bg-[#161b22] border border-[#30363d] rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
        </div>
        <div className="flex gap-1.5">
          {(['all','invoice','quotation','receipt'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filter===f ? 'bg-[#1f6feb] text-white' : 'border border-[#30363d] text-[#8b949e] hover:text-white'}`}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#161b22] border border-[#30363d] rounded-2xl">
          <Receipt size={32} className="mx-auto mb-3 text-[#30363d]" />
          <p className="text-white font-bold mb-1">{docs.length === 0 ? 'No documents yet' : 'No results'}</p>
          <p className="text-xs text-[#8b949e]">{docs.length === 0 ? 'Create your first invoice, quotation or receipt.' : 'Try a different search or filter.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 hover:border-[#58a6ff]/30 transition-all">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="flex items-center gap-1 text-[10px] text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded-full">{DOC_ICON[doc.type]}{doc.type}</span>
                    <span className="text-sm font-bold text-white">{doc.number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_MAP[doc.status]?.cls}`}>{STATUS_MAP[doc.status]?.label}</span>
                  </div>
                  <p className="text-sm text-white font-semibold truncate">{doc.clientName || 'No client'}</p>
                  <div className="flex items-center gap-3 text-xs text-[#8b949e] mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar size={10} />{doc.issuedDate}</span>
                    <span className="font-bold text-white">{fmt(doc.total, doc.currency)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { setPrev(doc); setView('preview'); }} className="p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] hover:text-white transition-colors" title="Preview"><Eye size={15} /></button>
                  <button onClick={() => { setEditing(doc); setView('create'); }} className="p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] hover:text-white transition-colors" title="Edit"><Edit3 size={15} /></button>
                  <button onClick={() => exportPDF(doc)} className="p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] hover:text-white transition-colors" title="Download PDF"><Download size={15} /></button>
                  <div className="relative group">
                    <button className="p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] hover:text-white transition-colors"><MoreVertical size={15} /></button>
                    <div className="absolute right-0 top-full mt-1 w-40 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl z-20 hidden group-hover:block overflow-hidden">
                      {(['draft','sent','paid','overdue','cancelled'] as DocStatus[]).map(s => (
                        <button key={s} onClick={() => updateStatus(doc.id, s)} className="w-full text-left px-3 py-2 text-xs text-[#8b949e] hover:bg-[#21262d] hover:text-white transition-colors capitalize">{s}</button>
                      ))}
                      <div className="border-t border-[#30363d]">
                        <button onClick={() => duplicate(doc)} className="w-full text-left px-3 py-2 text-xs text-[#8b949e] hover:bg-[#21262d] hover:text-white transition-colors"><Copy size={11} className="inline mr-1" />Duplicate</button>
                        <button onClick={() => del(doc.id)} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={11} className="inline mr-1" />Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Business setup modal */}
      {showBizSetup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Business Details</h3>
              <button onClick={() => setShowBizSetup(false)}><X size={18} className="text-[#8b949e]" /></button>
            </div>
            {/* Logo upload */}
            <div className="flex items-center gap-4">
              <div onClick={() => logoRef.current?.click()} className="w-16 h-16 rounded-2xl bg-[#21262d] border border-dashed border-[#30363d] hover:border-[#1f6feb] flex items-center justify-center cursor-pointer overflow-hidden">
                {biz.logo ? <img src={biz.logo} className="w-full h-full object-cover" alt="logo" /> : <Upload size={18} className="text-[#8b949e]" />}
              </div>
              <div><p className="text-sm font-bold text-white">Company Logo</p><p className="text-xs text-[#8b949e]">Click to upload</p></div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (!f) return;
                const r = new FileReader(); r.onload = () => { const nb = { ...biz, logo: r.result as string }; setBiz(nb); saveBiz(nb); }; r.readAsDataURL(f);
              }} />
            </div>
            {[['name','Business Name','Your Company Ltd'],['email','Email','billing@company.ke'],['phone','Phone','+254 ...'],['address','Address','Nairobi, Kenya'],['pin','KRA PIN (optional)','P051234567X']].map(([k,label,ph]) => (
              <div key={k}>
                <label className={labelCls}>{label}</label>
                <input value={biz[k]||''} onChange={e => { const nb={...biz,[k]:e.target.value}; setBiz(nb); saveBiz(nb); }} className={inputCls} placeholder={ph} />
              </div>
            ))}
            <button onClick={() => setShowBizSetup(false)} className="w-full py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl font-bold transition-colors">Save Business Details</button>
          </div>
        </div>
      )}
    </div>
  );

  /* ══ CREATE/EDIT VIEW ══════════════════════════════════════════ */
  if (view === 'create' && editing) {
    const upd = (u: Partial<Document>) => setEditing(e => calcDoc({ ...e, ...u }) as Partial<Document>);
    const updLine = (id: string, u: Partial<LineItem>) => upd({ lineItems: (editing.lineItems||[]).map(l => l.id===id ? {...l,...u} : l) });
    const addLine = () => upd({ lineItems: [...(editing.lineItems||[]), newLine()] });
    const delLine = (id: string) => upd({ lineItems: (editing.lineItems||[]).filter(l => l.id!==id) });

    return (
      <div className="max-w-3xl mx-auto space-y-5 pb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => { setView('list'); setEditing(null); }} className="p-2 hover:bg-[#21262d] rounded-xl transition-colors"><ArrowLeft size={18} className="text-[#8b949e]" /></button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white capitalize">{editing.id && docs.find(d=>d.id===editing.id) ? 'Edit' : 'New'} {editing.type}</h1>
            <p className="text-xs text-[#8b949e]">{editing.number}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { const d = calcDoc(editing) as Document; setPrev(d); setView('preview'); }} className="flex items-center gap-1.5 px-3 py-2 border border-[#30363d] text-[#8b949e] hover:text-white rounded-xl text-xs font-bold transition-colors"><Eye size={13} />Preview</button>
            <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-xs font-bold transition-colors"><Check size={13} />Save</button>
          </div>
        </div>

        {/* Document number & dates */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4">
          <p className={labelCls}>Document Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className={labelCls}>Number</label><input value={editing.number||''} onChange={e=>upd({number:e.target.value})} className={inputCls} /></div>
            <div><label className={labelCls}>Issue Date</label><input type="date" value={editing.issuedDate||''} onChange={e=>upd({issuedDate:e.target.value})} className={inputCls} /></div>
            <div><label className={labelCls}>{editing.type==='receipt'?'Payment Date':'Due Date'}</label><input type="date" value={editing.dueDate||''} onChange={e=>upd({dueDate:e.target.value})} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><label className={labelCls}>Currency</label>
              <select value={editing.currency||'KES'} onChange={e=>upd({currency:e.target.value})} className={inputCls}>
                {CURRENCIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>VAT Rate</label>
              <select value={editing.taxRate??16} onChange={e=>upd({taxRate:Number(e.target.value)})} className={inputCls}>
                {TAX_RATES.map(r=><option key={r} value={r}>{r}% {r===16?'(Standard VAT)':r===8?'(Reduced)':'(Exempt)'}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Status</label>
              <select value={editing.status||'draft'} onChange={e=>upd({status:e.target.value as DocStatus})} className={inputCls}>
                {Object.entries(STATUS_MAP).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* From */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-3">
            <p className={labelCls}>From (Your Business)</p>
            {[['businessName','Business Name'],['businessEmail','Email'],['businessPhone','Phone'],['businessAddress','Address'],['pin','KRA PIN']].map(([k,label])=>(
              <div key={k}><label className={labelCls}>{label}</label>
                <input value={(editing as any)[k]||''} onChange={e=>upd({[k]:e.target.value} as any)} className={inputCls} placeholder={k==='pin'?'P051234567X':''} />
              </div>
            ))}
          </div>
          {/* To */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-3">
            <p className={labelCls}>Bill To (Client)</p>
            {[['clientName','Full Name / Company *'],['clientEmail','Email'],['clientPhone','Phone'],['clientAddress','Address']].map(([k,label])=>(
              <div key={k}><label className={labelCls}>{label}</label>
                <input value={(editing as any)[k]||''} onChange={e=>upd({[k]:e.target.value} as any)} className={inputCls} />
              </div>
            ))}
          </div>
        </div>

        {/* Line items */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-3">
          <p className={labelCls}>Items</p>
          {/* Header — desktop */}
          <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold text-[#8b949e] uppercase tracking-wide px-1">
            <span className="col-span-5">Description</span>
            <span className="col-span-2 text-right">Qty</span>
            <span className="col-span-2">Unit</span>
            <span className="col-span-2 text-right">Price</span>
            <span />
          </div>
          {(editing.lineItems||[]).map((item,i) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-12 sm:col-span-5">
                {i===0 && <label className={labelCls + ' sm:hidden'}>Description</label>}
                <input value={item.description} onChange={e=>updLine(item.id,{description:e.target.value})} className={inputCls} placeholder="Item description..." />
              </div>
              <div className="col-span-4 sm:col-span-2">
                {i===0 && <label className={labelCls + ' sm:hidden'}>Qty</label>}
                <input type="number" min="0" step="0.01" value={item.qty} onChange={e=>updLine(item.id,{qty:+e.target.value})} className={inputCls + ' text-right'} />
              </div>
              <div className="col-span-4 sm:col-span-2">
                {i===0 && <label className={labelCls + ' sm:hidden'}>Unit</label>}
                <select value={item.unit} onChange={e=>updLine(item.id,{unit:e.target.value})} className={inputCls}>
                  {['pcs','hrs','days','kg','m','m²','m³','units','sqft','trips','months'].map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="col-span-3 sm:col-span-2">
                {i===0 && <label className={labelCls + ' sm:hidden'}>Price</label>}
                <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e=>updLine(item.id,{unitPrice:+e.target.value})} className={inputCls + ' text-right'} />
              </div>
              <div className="col-span-1 flex items-start pt-1 sm:pt-0">
                {i===0 && <div className="sm:hidden h-5" />}
                <button onClick={()=>delLine(item.id)} className="p-2 text-[#8b949e] hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
              </div>
              {/* Line total — mobile */}
              <div className="col-span-12 sm:hidden text-right text-sm font-bold text-white pb-1 border-b border-[#21262d]">
                = {fmt(item.qty*item.unitPrice, editing.currency||'KES')}
              </div>
            </div>
          ))}
          <button onClick={addLine} className="flex items-center gap-2 text-sm text-[#1f6feb] hover:text-[#388bfd] font-bold transition-colors">
            <Plus size={16} /> Add Item
          </button>
        </div>

        {/* Totals */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <div className="sm:w-64 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-[#8b949e]">Subtotal</span><span className="text-white font-bold">{fmt(editing.subtotal||0, editing.currency)}</span></div>
              {(editing.taxRate||0) > 0 && <div className="flex justify-between text-sm"><span className="text-[#8b949e]">VAT ({editing.taxRate}%)</span><span className="text-white">{fmt(editing.taxAmount||0, editing.currency)}</span></div>}
              <div className="flex justify-between text-sm items-center">
                <span className="text-[#8b949e]">Discount</span>
                <input type="number" min="0" value={editing.discount||0} onChange={e=>upd({discount:+e.target.value})} className="w-28 bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-white text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#1f6feb]" />
              </div>
              <div className="flex justify-between text-base font-black border-t border-[#30363d] pt-2">
                <span className="text-white">TOTAL</span>
                <span className="text-[#1f6feb]">{fmt(editing.total||0, editing.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
            <label className={labelCls}>Notes to Client</label>
            <textarea value={editing.notes||''} onChange={e=>upd({notes:e.target.value})} rows={3} className={inputCls+' resize-none'} placeholder="Thank you for your business!" />
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
            <label className={labelCls}>Payment Terms</label>
            <textarea value={editing.terms||''} onChange={e=>upd({terms:e.target.value})} rows={3} className={inputCls+' resize-none'} placeholder="Payment due within 30 days..." />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button onClick={save} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-2xl font-black transition-colors"><Check size={18} />Save {editing.type?.charAt(0).toUpperCase()+(editing.type?.slice(1)||'')}</button>
          <button onClick={() => { setView('list'); setEditing(null); }} className="px-6 py-4 border border-[#30363d] text-[#8b949e] hover:text-white rounded-2xl font-bold transition-colors">Cancel</button>
        </div>
      </div>
    );
  }

  /* ══ PREVIEW VIEW ══════════════════════════════════════════════ */
  if (view === 'preview' && previewing) return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => setView('list')} className="p-2 hover:bg-[#21262d] rounded-xl transition-colors"><ArrowLeft size={18} className="text-[#8b949e]" /></button>
        <h1 className="text-xl font-black text-white flex-1 capitalize">{previewing.type} #{previewing.number}</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportPDF(previewing)} className="flex items-center gap-1.5 px-3 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-xs font-bold transition-colors"><Download size={13} />PDF</button>
          <button onClick={() => { setEditing(previewing); setView('create'); }} className="flex items-center gap-1.5 px-3 py-2 border border-[#30363d] text-[#8b949e] hover:text-white rounded-xl text-xs font-bold transition-colors"><Edit3 size={13} />Edit</button>
        </div>
      </div>

      {/* Invoice preview card */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#1f6feb] p-6 text-white">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              {previewing.businessLogo && <img src={previewing.businessLogo} className="h-10 mb-2 object-contain" alt="logo" />}
              <h2 className="text-xl font-black">{previewing.businessName || 'Your Business'}</h2>
              {previewing.businessEmail && <p className="text-sm opacity-80">{previewing.businessEmail}</p>}
              {previewing.businessPhone && <p className="text-sm opacity-80">{previewing.businessPhone}</p>}
              {previewing.pin && <p className="text-xs opacity-70 mt-1">KRA PIN: {previewing.pin}</p>}
            </div>
            <div className="text-right">
              <p className="text-2xl font-black uppercase">{previewing.type}</p>
              <p className="text-lg font-bold opacity-90">#{previewing.number}</p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-1 rounded-full bg-white/20`}>{STATUS_MAP[previewing.status]?.label}</span>
            </div>
          </div>
        </div>
        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Bill To</p>
              <p className="font-bold text-gray-800">{previewing.clientName}</p>
              {previewing.clientEmail && <p className="text-sm text-gray-500">{previewing.clientEmail}</p>}
              {previewing.clientPhone && <p className="text-sm text-gray-500">{previewing.clientPhone}</p>}
              {previewing.clientAddress && <p className="text-sm text-gray-500">{previewing.clientAddress}</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Details</p>
              <p className="text-sm text-gray-600">Issued: <span className="font-bold text-gray-800">{previewing.issuedDate}</span></p>
              <p className="text-sm text-gray-600">Due: <span className="font-bold text-gray-800">{previewing.dueDate}</span></p>
              <p className="text-sm text-gray-600 mt-1">Currency: <span className="font-bold text-gray-800">{previewing.currency}</span></p>
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wide">
                <th className="text-left p-3 rounded-l-lg">Description</th>
                <th className="text-right p-3">Qty</th>
                <th className="text-right p-3">Unit Price</th>
                <th className="text-right p-3 rounded-r-lg">Total</th>
              </tr></thead>
              <tbody>{previewing.lineItems.map((item,i) => (
                <tr key={item.id} className={i%2===0?'':'bg-gray-50/50'}>
                  <td className="p-3 text-gray-800 font-medium">{item.description}</td>
                  <td className="p-3 text-right text-gray-600">{item.qty} {item.unit}</td>
                  <td className="p-3 text-right text-gray-600">{fmt(item.unitPrice, previewing.currency)}</td>
                  <td className="p-3 text-right font-bold text-gray-800">{fmt(item.qty*item.unitPrice, previewing.currency)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span className="font-bold">{fmt(previewing.subtotal, previewing.currency)}</span></div>
              {previewing.taxRate > 0 && <div className="flex justify-between text-sm text-gray-600"><span>VAT ({previewing.taxRate}%)</span><span>{fmt(previewing.taxAmount, previewing.currency)}</span></div>}
              {previewing.discount > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Discount</span><span>-{fmt(previewing.discount, previewing.currency)}</span></div>}
              <div className="flex justify-between text-base font-black border-t border-gray-200 pt-2 text-gray-800">
                <span>TOTAL</span><span className="text-[#1f6feb]">{fmt(previewing.total, previewing.currency)}</span>
              </div>
            </div>
          </div>

          {(previewing.notes || previewing.terms) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              {previewing.notes && <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Notes</p><p className="text-sm text-gray-600">{previewing.notes}</p></div>}
              {previewing.terms && <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Terms</p><p className="text-sm text-gray-600">{previewing.terms}</p></div>}
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-center">
          <p className="text-[10px] text-gray-400">Generated by StampKE · stampke.co.ke</p>
        </div>
      </div>
    </div>
  );

  return null;
}
