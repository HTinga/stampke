import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Brain, FileText, Plus, Trash2, Download, Search, Filter,
  ChevronDown, ChevronUp, X, Check, RefreshCw, BarChart2, TrendingUp,
  TrendingDown, DollarSign, Tag, FolderOpen, Calendar, Eye, Edit3,
  ArrowDownToLine, Loader2, AlertCircle, CheckCircle2, Receipt, Layers,
  SlidersHorizontal, Package, FileImage, FilePlus, Wallet, PieChart,
  Archive, ChevronRight, MoreVertical, Sparkles, Settings, Home, Save,
  Send, Share2, Copy, Printer, ArrowLeft, Building2, Star, Hash,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

/* ─── Types ──────────────────────────────────────────────────── */
interface InvoiceItem { name: string; qty?: number; price?: number; total?: number; }
interface Transaction {
  id: string; name: string; merchant: string; description: string;
  type: 'expense' | 'income'; total: number; currency: string;
  category: string; project: string; issuedAt: string; note: string;
  items: InvoiceItem[]; fileData?: string; fileName?: string; fileMime?: string;
  createdAt: string; status: 'pending' | 'reviewed';
}
interface InvoiceLineItem { id: string; description: string; qty: number; unitPrice: number; unit?: string; }
type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
type DocType = 'invoice' | 'quotation' | 'receipt';
interface CreatedInvoice {
  id: string; type: DocType; invoiceNumber: string;
  clientName: string; clientEmail: string; clientPhone: string; clientAddress: string;
  businessName: string; businessEmail: string; businessPhone?: string; businessAddress?: string;
  businessLogo?: string; pin?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number; taxRate: number; taxAmount: number; discount?: number; total: number;
  currency: string; issuedDate: string; dueDate: string;
  note: string; terms?: string; status: InvoiceStatus;
  paidAt?: string; reminderCount: number; lastReminderAt?: string; createdAt: string;
  // Template / design
  template?: string; accentColor?: string;
}
interface UnsortedFile { id: string; name: string; data: string; mime: string; createdAt: string; analyzed: boolean; }

/* ─── Constants ─────────────────────────────────────────────── */
const CATEGORIES = [
  { code: 'food',          name: 'Food & Drinks',      color: '#d40e70', emoji: '🍽' },
  { code: 'transport',     name: 'Transport',           color: '#0e7d86', emoji: '🚗' },
  { code: 'tools',         name: 'Tools & Equipment',   color: '#c69713', emoji: '🛠' },
  { code: 'communication', name: 'Mobile & Internet',   color: '#0e6885', emoji: '📱' },
  { code: 'invoice',       name: 'Invoice / Bill',      color: '#064e85', emoji: '🧾' },
  { code: 'salary',        name: 'Salary',              color: '#1e6359', emoji: '💰' },
  { code: 'software',      name: 'Software & SaaS',     color: '#5b21b6', emoji: '💻' },
  { code: 'insurance',     name: 'Insurance',           color: '#050942', emoji: '🛡' },
  { code: 'events',        name: 'Events',              color: '#ff8b32', emoji: '🎫' },
  { code: 'tax',           name: 'Taxes & Fees',        color: '#882727', emoji: '📋' },
  { code: 'other',         name: 'Other',               color: '#374151', emoji: '📦' },
];
const CURRENCIES = ['KES','USD','EUR','GBP','UGX','TZS','ZAR','NGN'];
const TAX_RATES  = [0, 8, 16];
const INVOICE_TEMPLATES = [
  { id: 'classic', name: 'Classic',   accent: '#1f6feb', desc: 'Clean & professional' },
  { id: 'modern',  name: 'Modern',    accent: '#059669', desc: 'Fresh & contemporary' },
  { id: 'bold',    name: 'Bold',      accent: '#dc2626', desc: 'Strong & authoritative' },
  { id: 'elegant', name: 'Elegant',   accent: '#7c3aed', desc: 'Premium & stylish' },
  { id: 'minimal', name: 'Minimal',   accent: '#374151', desc: 'Clean & simple' },
];
const INDUSTRIES = ['General','Real Estate','Construction','Retail','Hospitality','Healthcare','Legal','Consulting','Transport','Agriculture','Technology','Events','Import/Export'];
const DB_KEY       = 'smart_invoice_v1';
const INVOICE_KEY  = 'stampke_docs_v2';
const BIZ_KEY      = 'stampke_biz_v1';
const TEMPLATE_KEY = 'stampke_inv_templates_v1';

/* ─── Helpers ────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().slice(0,10);
const addDays = (d: string, n: number) => { const dt = new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10); };
const fmt = (n: number, c = 'KES') => `${c} ${Number(n||0).toLocaleString('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const loadDocs = (): CreatedInvoice[] => { try { return JSON.parse(localStorage.getItem(INVOICE_KEY)||'[]'); } catch { return []; } };
const loadBiz  = () => { try { return JSON.parse(localStorage.getItem(BIZ_KEY)||'{}'); } catch { return {}; } };
const saveBiz  = (b: any) => localStorage.setItem(BIZ_KEY, JSON.stringify(b));
const loadDB   = () => { try { return JSON.parse(localStorage.getItem(DB_KEY)||'{"transactions":[],"unsorted":[]}'); } catch { return {transactions:[],unsorted:[]}; } };
const catInfo  = (code: string) => CATEGORIES.find(c => c.code === code) || CATEGORIES[CATEGORIES.length-1];

const calcDoc = (doc: Partial<CreatedInvoice>): Partial<CreatedInvoice> => {
  const sub  = (doc.lineItems||[]).reduce((s,i) => s + i.qty*i.unitPrice, 0);
  const tax  = sub * ((doc.taxRate||0)/100);
  const disc = doc.discount || 0;
  return { ...doc, subtotal: sub, taxAmount: tax, total: sub + tax - disc };
};

const newLine = (): InvoiceLineItem => ({ id: uid(), description: '', qty: 1, unitPrice: 0, unit: 'pcs' });

/* ─── AI Analysis ────────────────────────────────────────────── */
async function analyzeWithAI(fileData: string, mime: string): Promise<Record<string, any>> {
  const content: any[] = [];
  if (mime.startsWith('image/')) {
    content.push({ type: 'image', source: { type: 'base64', media_type: mime, data: fileData } });
  } else if (mime === 'application/pdf') {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileData } });
  }
  content.push({ type: 'text', text: `You are a professional accountant. Extract all information from this receipt/invoice and return ONLY valid JSON:
{
  "name": "short transaction name",
  "merchant": "vendor name",
  "description": "brief description",
  "type": "expense or income",
  "total": numeric amount,
  "currency": "3-letter code e.g. KES",
  "category": "one of: food, transport, tools, communication, invoice, salary, software, insurance, events, tax, other",
  "issuedAt": "YYYY-MM-DD",
  "items": [{"name":"item","qty":1,"price":100,"total":100}],
  "note": "any notes"
}
Return ONLY the JSON. No markdown. No explanation.` });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content }] }),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  const text = data.content?.find((b: any) => b.type === 'text')?.text || '{}';
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    if (!Array.isArray(parsed.items)) parsed.items = [];
    parsed.total = parseFloat(parsed.total) || 0;
    return parsed;
  } catch { return { items: [], total: 0 }; }
}

/* ─── PDF Export ─────────────────────────────────────────────── */
function exportDocPDF(doc: CreatedInvoice) {
  const pdf = new jsPDF({ format: 'a4', unit: 'pt' });
  const W = 595, M = 40;
  const accent = doc.accentColor || '#1f6feb';
  const [r,g,b] = [parseInt(accent.slice(1,3),16), parseInt(accent.slice(3,5),16), parseInt(accent.slice(5,7),16)];

  // Header bar
  pdf.setFillColor(r,g,b); pdf.rect(0,0,W,70,'F');
  pdf.setTextColor(255,255,255);
  pdf.setFont('helvetica','bold'); pdf.setFontSize(18);
  pdf.text(doc.businessName || 'Your Business', M, 32);
  pdf.setFontSize(11); pdf.setFont('helvetica','normal');
  pdf.text(`${doc.type.toUpperCase()}  #${doc.invoiceNumber}`, M, 50);
  if (doc.pin) pdf.text(`KRA PIN: ${doc.pin}`, W-M, 32, { align:'right' });
  pdf.text(`Issued: ${doc.issuedDate}  |  Due: ${doc.dueDate}`, W-M, 50, { align:'right' });

  let y = 90;
  pdf.setTextColor(30,30,30); pdf.setFont('helvetica','bold'); pdf.setFontSize(9);
  pdf.text('FROM', M, y); pdf.text('BILL TO', W/2+10, y);
  pdf.setFont('helvetica','normal'); y += 13;
  [[doc.businessName||'', doc.businessEmail||'', doc.businessPhone||'', doc.businessAddress||''],
   [doc.clientName||'',   doc.clientEmail||'',   doc.clientPhone||'',   doc.clientAddress||'']].forEach((lines, col) => {
    let ly = y;
    lines.filter(Boolean).forEach(l => { pdf.text(l, col === 0 ? M : W/2+10, ly); ly += 12; });
  });
  y += 52;

  // Table header
  pdf.setFillColor(243,244,246); pdf.rect(M, y, W-M*2, 18, 'F');
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8); pdf.setTextColor(80,80,80);
  pdf.text('DESCRIPTION', M+5, y+12);
  pdf.text('QTY', W-155, y+12, { align:'right' });
  pdf.text('UNIT PRICE', W-95, y+12, { align:'right' });
  pdf.text('TOTAL', W-M, y+12, { align:'right' });
  y += 22;

  pdf.setFont('helvetica','normal'); pdf.setTextColor(30,30,30);
  doc.lineItems.forEach((item, i) => {
    if (i%2===0) { pdf.setFillColor(252,252,252); pdf.rect(M, y-10, W-M*2, 16, 'F'); }
    pdf.text(item.description, M+5, y);
    pdf.text(`${item.qty}${item.unit ? ' '+item.unit : ''}`, W-155, y, { align:'right' });
    pdf.text(fmt(item.unitPrice, doc.currency), W-95, y, { align:'right' });
    pdf.text(fmt(item.qty*item.unitPrice, doc.currency), W-M, y, { align:'right' });
    y += 16;
  });
  y += 8;

  // Totals
  [['Subtotal', fmt(doc.subtotal, doc.currency)],
   ...(doc.taxRate > 0 ? [[`VAT (${doc.taxRate}%)`, fmt(doc.taxAmount, doc.currency)]] : []),
   ...(doc.discount ? [['Discount', `-${fmt(doc.discount, doc.currency)}`]] : [])
  ].forEach(([label, value]) => {
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9);
    pdf.text(label, W-150, y); pdf.text(value, W-M, y, { align:'right' });
    y += 14;
  });
  pdf.setFont('helvetica','bold'); pdf.setFontSize(11);
  pdf.setFillColor(r,g,b); pdf.rect(W-160, y-11, 125, 18, 'F');
  pdf.setTextColor(255,255,255);
  pdf.text('TOTAL', W-150, y); pdf.text(fmt(doc.total, doc.currency), W-M, y, { align:'right' });
  y += 24; pdf.setTextColor(30,30,30);
  if (doc.note) { pdf.setFont('helvetica','italic'); pdf.setFontSize(8); pdf.setTextColor(100,100,100); pdf.text(doc.note, M, y); y += 12; }
  if (doc.terms) { pdf.setFont('helvetica','normal'); pdf.text(`Terms: ${doc.terms}`, M, y); }
  pdf.setFontSize(7); pdf.setTextColor(150,150,150);
  pdf.text('Generated by StampKE · stampke.co.ke · KRA Compliant', W/2, 820, { align:'center' });
  pdf.save(`${doc.type}-${doc.invoiceNumber}.pdf`);
}

/* ─── Styles ─────────────────────────────────────────────────── */
const S = {
  card: { background: 'rgba(22,27,34,0.95)', border: '1px solid rgba(48,54,61,0.9)', borderRadius: 14 } as React.CSSProperties,
  label: { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 5, display: 'block' },
  input: { background: '#0d1117', border: '1px solid rgba(48,54,61,0.9)', borderRadius: 8, padding: '8px 12px', color: 'white', fontSize: 13, width: '100%', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  btn: (primary = false, danger = false): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 9, cursor: 'pointer',
    border: 'none', fontWeight: 700, fontSize: 12, transition: 'all 0.15s',
    background: primary ? 'linear-gradient(135deg,#1f6feb,#388bfd)' : danger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
    color: primary ? 'white' : danger ? '#f87171' : 'rgba(255,255,255,0.7)',
  }),
};

const inputCls = 'w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]';
const labelCls = 'block text-[11px] font-bold text-[#8b949e] uppercase tracking-wide mb-1';

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function SmartInvoice() {
  type View = 'dashboard' | 'invoices' | 'create' | 'preview' | 'inbox' | 'transactions' | 'analyze' | 'stats' | 'biz-setup' | 'templates';
  const [view, setView]             = useState<View>('dashboard');
  const [docs, setDocs]             = useState<CreatedInvoice[]>(loadDocs);
  const [editing, setEditing]       = useState<Partial<CreatedInvoice> | null>(null);
  const [preview, setPreview]       = useState<CreatedInvoice | null>(null);
  const [biz, setBiz]               = useState(loadBiz);
  const [savedTemplates, setSavedTpl] = useState<any[]>(() => { try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY)||'[]'); } catch { return []; } });

  // Finance inbox state
  const [db, setDb]                 = useState(loadDB);
  const [activeFile, setActiveFile] = useState<UnsortedFile | null>(null);
  const [analyzing, setAnalyzing]   = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [formData, setFormData]     = useState<Partial<Transaction>>({});
  const [filterCat, setFilterCat]   = useState('');
  const [search, setSearch]         = useState('');

  const [toast, setToast]           = useState<{msg:string;type:'success'|'error'} | null>(null);
  const [docFilter, setDocFilter]   = useState<DocType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');

  const dropRef  = useRef<HTMLDivElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);
  const logoRef  = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const persistDocs = (d: CreatedInvoice[]) => { setDocs(d); localStorage.setItem(INVOICE_KEY, JSON.stringify(d)); };
  const persistDB   = (d: any)              => { setDb(d);   localStorage.setItem(DB_KEY, JSON.stringify(d)); };

  // Auto-mark overdue
  useEffect(() => {
    const updated = docs.map(d => d.status === 'sent' && new Date(d.dueDate) < new Date() ? { ...d, status: 'overdue' as InvoiceStatus } : d);
    if (JSON.stringify(updated) !== JSON.stringify(docs)) persistDocs(updated);
  }, []);

  /* ── New document ── */
  const startNew = (type: DocType = 'invoice') => {
    const count  = docs.filter(d => d.type === type).length + 1;
    const prefix = type === 'invoice' ? 'INV' : type === 'quotation' ? 'QUO' : 'RCT';
    const tpl    = INVOICE_TEMPLATES[0];
    setEditing(calcDoc({
      id: uid(), type,
      invoiceNumber: `${prefix}-${new Date().getFullYear()}-${String(count).padStart(4,'0')}`,
      clientName:'', clientEmail:'', clientPhone:'', clientAddress:'',
      businessName: biz.name||'', businessEmail: biz.email||'',
      businessPhone: biz.phone||'', businessAddress: biz.address||'',
      businessLogo: biz.logo||'', pin: biz.pin||'',
      lineItems: [newLine()], taxRate: 16, discount: 0, currency: 'KES',
      note: type==='invoice' ? 'Thank you for your business! Payment is due by the date above.' :
            type==='quotation' ? 'This quotation is valid for 30 days.' : 'Payment received. Thank you!',
      terms: 'Payment is due within 30 days of invoice date.',
      issuedDate: today(), dueDate: addDays(today(), type==='receipt' ? 0 : 30),
      status: type==='receipt' ? 'paid' : 'draft', reminderCount: 0,
      template: tpl.id, accentColor: tpl.accent,
      createdAt: new Date().toISOString(),
    }));
    setView('create');
  };

  const saveDoc = () => {
    if (!editing) return;
    const doc = { ...calcDoc(editing), updatedAt: new Date().toISOString() } as CreatedInvoice;
    if (!doc.clientName?.trim()) { showToast('Client name is required.','error'); return; }
    if (!doc.lineItems?.length || !doc.lineItems[0].description?.trim()) { showToast('Add at least one item.','error'); return; }
    const updated = docs.find(d => d.id === doc.id) ? docs.map(d => d.id === doc.id ? doc : d) : [doc, ...docs];
    persistDocs(updated); setView('invoices'); setEditing(null);
    showToast(doc.status === 'sent' ? `${doc.type} sent! 🎉` : `${doc.type} saved.`);
  };

  const deleteDoc = (id: string) => {
    if (!confirm('Delete this document?')) return;
    persistDocs(docs.filter(d => d.id !== id));
    showToast('Deleted.');
  };

  const markPaid = (id: string) => {
    persistDocs(docs.map(d => d.id === id ? { ...d, status: 'paid' as InvoiceStatus, paidAt: new Date().toISOString() } : d));
    showToast('Marked as paid! 💚');
  };

  const sendReminder = (id: string) => {
    const inv = docs.find(d => d.id === id);
    if (!inv) return;
    persistDocs(docs.map(d => d.id === id ? { ...d, reminderCount: d.reminderCount+1, lastReminderAt: new Date().toISOString(), status: 'sent' as InvoiceStatus } : d));
    showToast(`Reminder #${inv.reminderCount+1} sent to ${inv.clientName}`);
  };

  const saveAsTemplate = () => {
    if (!editing) return;
    const name = prompt('Template name:');
    if (!name) return;
    const tpl = { ...editing, id: uid(), name, savedAt: new Date().toISOString() };
    const updated = [tpl, ...savedTemplates];
    setSavedTpl(updated); localStorage.setItem(TEMPLATE_KEY, JSON.stringify(updated));
    showToast(`Template "${name}" saved!`);
  };

  const shareWhatsApp = (doc: CreatedInvoice) => {
    const msg = encodeURIComponent(`${doc.type.toUpperCase()} ${doc.invoiceNumber}\nClient: ${doc.clientName}\nTotal: ${fmt(doc.total, doc.currency)}\nDue: ${doc.dueDate}\n\nGenerated by StampKE`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const copyLink = (doc: CreatedInvoice) => {
    navigator.clipboard.writeText(`${doc.type.toUpperCase()} ${doc.invoiceNumber} | ${doc.clientName} | ${fmt(doc.total, doc.currency)} | Due: ${doc.dueDate}`);
    showToast('Copied to clipboard!');
  };

  // Finance inbox
  const handleFiles = async (files: FileList) => {
    const newFiles: UnsortedFile[] = [];
    for (const f of Array.from(files)) {
      const data = await new Promise<string>((res) => {
        const r = new FileReader(); r.onload = () => res((r.result as string).split(',')[1]); r.readAsDataURL(f);
      });
      newFiles.push({ id: uid(), name: f.name, data, mime: f.type, createdAt: new Date().toISOString(), analyzed: false });
    }
    const d = { ...db, unsorted: [...newFiles, ...db.unsorted] };
    persistDB(d);
  };

  const startAnalyze = async (file: UnsortedFile) => {
    setAnalyzing(true); setAnalyzeError('');
    try {
      const result = await analyzeWithAI(file.data, file.mime);
      setFormData({
        name: result.name || '', merchant: result.merchant || '',
        description: result.description || '', type: result.type === 'income' ? 'income' : 'expense',
        total: result.total || 0, currency: result.currency || 'KES',
        category: result.category || 'other', issuedAt: result.issuedAt || today(),
        items: result.items || [], note: result.note || '',
      });
      const d = { ...db, unsorted: db.unsorted.map((f: UnsortedFile) => f.id === file.id ? { ...f, analyzed: true } : f) };
      persistDB(d);
    } catch (e: any) { setAnalyzeError(e.message); }
    setAnalyzing(false);
  };

  const saveTransaction = () => {
    if (!activeFile || !formData.name) { showToast('Transaction name is required.','error'); return; }
    const tx: Transaction = {
      id: uid(), name: formData.name||'', merchant: formData.merchant||'', description: formData.description||'',
      type: formData.type||'expense', total: formData.total||0, currency: formData.currency||'KES',
      category: formData.category||'other', project: '', issuedAt: formData.issuedAt||today(),
      note: formData.note||'', items: formData.items||[],
      fileData: activeFile.data, fileName: activeFile.name, fileMime: activeFile.mime,
      createdAt: new Date().toISOString(), status: 'reviewed',
    };
    const d = {
      transactions: [tx, ...db.transactions],
      unsorted: db.unsorted.filter((f: UnsortedFile) => f.id !== activeFile.id),
    };
    persistDB(d); setActiveFile(null); setFormData({}); setView('transactions');
    showToast('Transaction saved! ✅');
  };

  /* ── Stats ── */
  const txs = db.transactions as Transaction[];
  const totalIncome   = txs.filter(t => t.type === 'income').reduce((s,t) => s+t.total, 0);
  const totalExpenses = txs.filter(t => t.type === 'expense').reduce((s,t) => s+t.total, 0);
  const totalPaid     = docs.filter(d => d.status === 'paid').reduce((s,d) => s+d.total, 0);
  const totalOutstanding = docs.filter(d => ['sent','overdue'].includes(d.status)).reduce((s,d) => s+d.total, 0);

  const filtered = docs.filter(d =>
    (docFilter === 'all' || d.type === docFilter) &&
    (!statusFilter || d.status === statusFilter) &&
    (!search || d.clientName.toLowerCase().includes(search.toLowerCase()) || d.invoiceNumber.toLowerCase().includes(search.toLowerCase()))
  );

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:'70vh', background:'#0d1117', color:'white', borderRadius:16, overflow:'hidden' }}>

      {/* ── Nav tabs ── */}
      <div style={{ display:'flex', gap:2, padding:'12px 16px 0', overflowX:'auto', borderBottom:'1px solid rgba(48,54,61,0.8)', flexShrink:0 }}>
        {([
          { id:'dashboard', label:'🏠 Home' },
          { id:'invoices',  label:'🧾 Documents' },
          { id:'inbox',     label:`📥 Inbox${db.unsorted.length > 0 ? ` (${db.unsorted.length})` : ''}` },
          { id:'transactions', label:'💳 Transactions' },
          { id:'stats',     label:'📊 Stats' },
          { id:'templates', label:'🎨 Templates' },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id as View)}
            style={{ padding:'8px 14px', borderRadius:'9px 9px 0 0', fontWeight:700, fontSize:12, cursor:'pointer', border:'none',
              background: view === tab.id ? 'rgba(31,111,235,0.15)' : 'transparent',
              color: view === tab.id ? '#58a6ff' : 'rgba(255,255,255,0.4)',
              borderBottom: view === tab.id ? '2px solid #1f6feb' : '2px solid transparent',
              whiteSpace:'nowrap',
            }}>
            {tab.label}
          </button>
        ))}
        <div style={{ flex:1 }} />
        <button onClick={() => setView('biz-setup')} style={{ ...S.btn(), fontSize:11, padding:'6px 10px', marginBottom:4 }}>
          <Building2 size={12} /> Business
        </button>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:9999,
          background: toast.type==='success' ? '#0d1117' : '#1a0a0a',
          border:`1px solid ${toast.type==='success' ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius:12, padding:'10px 20px', color: toast.type==='success' ? '#34d399' : '#f87171',
          fontWeight:700, fontSize:13, boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
          display:'flex', alignItems:'center', gap:8 }}>
          {toast.type==='success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{toast.msg}
        </div>
      )}

      <div style={{ flex:1, overflow:'auto', padding:20 }}>

        {/* ════ DASHBOARD ════ */}
        {view === 'dashboard' && (
          <div style={{ maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>
            {/* Stats row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
              {[
                { label:'Invoiced Total', val:fmt(docs.filter(d=>d.type==='invoice').reduce((s,d)=>s+d.total,0)), color:'#58a6ff', icon:Receipt },
                { label:'Collected',      val:fmt(totalPaid),        color:'#34d399', icon:CheckCircle2 },
                { label:'Outstanding',    val:fmt(totalOutstanding),  color:'#f59e0b', icon:AlertCircle },
                { label:'Income',         val:fmt(totalIncome),       color:'#34d399', icon:TrendingUp },
                { label:'Expenses',       val:fmt(totalExpenses),     color:'#f87171', icon:TrendingDown },
              ].map(({ label, val, color, icon: Icon }) => (
                <div key={label} style={{ ...S.card, padding:14 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ color:'rgba(255,255,255,0.35)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <div style={{ fontSize:18, fontWeight:900, color, letterSpacing:'-0.02em' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Drop zone */}
            <div ref={dropRef} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFiles(e.dataTransfer.files);}}
              onClick={() => fileRef.current?.click()}
              style={{ ...S.card, padding:36, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, cursor:'pointer', borderStyle:'dashed', borderColor:'rgba(88,166,255,0.25)', transition:'all 0.2s' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'rgba(31,111,235,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Upload size={22} color="#58a6ff" />
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ color:'white', fontWeight:800, fontSize:14, marginBottom:4 }}>Drop receipts & invoices here</p>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>PDF, JPG, PNG, WEBP · AI extracts all data automatically</p>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
                {['Receipt','Invoice','Bank Statement','Bill'].map(t => (
                  <span key={t} style={{ background:'rgba(88,166,255,0.1)', border:'1px solid rgba(88,166,255,0.2)', borderRadius:5, padding:'2px 7px', fontSize:10, fontWeight:700, color:'#58a6ff', textTransform:'uppercase', letterSpacing:'0.05em' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {(['invoice','quotation','receipt'] as DocType[]).map(t => (
                <button key={t} onClick={() => startNew(t)} style={{ ...S.btn(t==='invoice'), fontSize:12 }}>
                  <Plus size={13} /> New {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>

            {/* Recent docs */}
            {docs.length > 0 && (
              <div style={S.card}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(48,54,61,0.6)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontWeight:800, fontSize:13, color:'white' }}>Recent Documents</span>
                  <button onClick={() => setView('invoices')} style={{ ...S.btn(), padding:'4px 10px', fontSize:10 }}>View All</button>
                </div>
                {docs.slice(0,5).map(doc => {
                  const statusColor: Record<string,string> = { draft:'rgba(255,255,255,0.25)', sent:'#58a6ff', paid:'#34d399', overdue:'#f87171', cancelled:'rgba(255,255,255,0.15)' };
                  return (
                    <div key={doc.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid rgba(48,54,61,0.3)' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ color:'white', fontWeight:700, fontSize:13 }}>{doc.invoiceNumber}</span>
                          <span style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>→ {doc.clientName||'No client'}</span>
                          <span style={{ background:`${statusColor[doc.status]}22`, border:`1px solid ${statusColor[doc.status]}44`, borderRadius:5, padding:'1px 6px', fontSize:9, fontWeight:700, color:statusColor[doc.status], textTransform:'uppercase' }}>{doc.status}</span>
                        </div>
                        <span style={{ color:'rgba(255,255,255,0.25)', fontSize:11 }}>Due: {doc.dueDate}</span>
                      </div>
                      <span style={{ color:'white', fontWeight:900, fontSize:14 }}>{fmt(doc.total, doc.currency)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ INVOICES / DOCUMENTS LIST ════ */}
        {view === 'invoices' && (
          <div style={{ maxWidth:900, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search client or number..." style={{ ...S.input, flex:1, minWidth:180 }} />
              <div style={{ display:'flex', gap:4 }}>
                {(['all','invoice','quotation','receipt'] as const).map(t => (
                  <button key={t} onClick={() => setDocFilter(t)} style={{ ...S.btn(docFilter===t), padding:'7px 11px', fontSize:11 }}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {(['','draft','sent','paid','overdue'] as const).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{ ...S.btn(statusFilter===s), padding:'7px 11px', fontSize:11 }}>
                    {s || 'All'}
                  </button>
                ))}
              </div>
              <button onClick={() => startNew()} style={{ ...S.btn(true), fontSize:12 }}><Plus size={13} /> New Invoice</button>
            </div>

            {filtered.length === 0 ? (
              <div style={{ ...S.card, padding:60, textAlign:'center' }}>
                <FileText size={40} style={{ color:'rgba(255,255,255,0.1)', margin:'0 auto 12px' }} />
                <p style={{ color:'rgba(255,255,255,0.3)', fontWeight:600 }}>No documents found. Create your first invoice.</p>
              </div>
            ) : filtered.map(doc => {
              const statusColor: Record<string,string> = { draft:'rgba(255,255,255,0.25)', sent:'#58a6ff', paid:'#34d399', overdue:'#f87171', cancelled:'rgba(255,255,255,0.15)' };
              const daysUntil = Math.ceil((new Date(doc.dueDate).getTime()-Date.now())/86400000);
              return (
                <div key={doc.id} style={{ ...S.card, marginBottom:8, padding:'13px 16px', display:'flex', alignItems:'center', gap:12, borderLeft:`3px solid ${statusColor[doc.status]}` }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                      <span style={{ color:'rgba(255,255,255,0.4)', fontSize:11, background:'rgba(255,255,255,0.06)', borderRadius:4, padding:'1px 6px' }}>{doc.type}</span>
                      <span style={{ color:'white', fontWeight:800, fontSize:14 }}>{doc.invoiceNumber}</span>
                      <span style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>→ {doc.clientName||'Unnamed Client'}</span>
                      <span style={{ background:`${statusColor[doc.status]}22`, border:`1px solid ${statusColor[doc.status]}44`, borderRadius:5, padding:'1px 6px', fontSize:9, fontWeight:700, color:statusColor[doc.status], textTransform:'uppercase' }}>{doc.status}</span>
                      {doc.reminderCount > 0 && <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>🔔 {doc.reminderCount}</span>}
                    </div>
                    <div style={{ display:'flex', gap:14, fontSize:11, color:'rgba(255,255,255,0.3)', flexWrap:'wrap' }}>
                      <span>Due: {new Date(doc.dueDate).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}</span>
                      {doc.status==='sent' && daysUntil > 0 && <span style={{ color:daysUntil<=3?'#f59e0b':'rgba(255,255,255,0.3)' }}>{daysUntil}d left</span>}
                      {doc.status==='overdue' && <span style={{ color:'#f87171' }}>{Math.abs(daysUntil)}d overdue</span>}
                      {doc.status==='paid' && doc.paidAt && <span style={{ color:'#34d399' }}>Paid {new Date(doc.paidAt).toLocaleDateString('en-KE',{day:'numeric',month:'short'})}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ color:'white', fontWeight:900, fontSize:16, margin:0 }}>{fmt(doc.total, doc.currency)}</p>
                    <p style={{ color:'rgba(255,255,255,0.25)', fontSize:11, margin:'2px 0 0' }}>{doc.lineItems.length} item{doc.lineItems.length!==1?'s':''}</p>
                  </div>
                  <div style={{ display:'flex', gap:3, flexShrink:0, flexWrap:'wrap' }}>
                    <button onClick={() => { setPreview(doc); setView('preview'); }} style={{ ...S.btn(), padding:'6px 9px' }} title="Preview"><Eye size={13} /></button>
                    <button onClick={() => { setEditing(doc); setView('create'); }} style={{ ...S.btn(), padding:'6px 9px' }} title="Edit"><Edit3 size={13} /></button>
                    <button onClick={() => exportDocPDF(doc)} style={{ ...S.btn(), padding:'6px 9px' }} title="PDF"><Download size={13} /></button>
                    <button onClick={() => shareWhatsApp(doc)} style={{ ...S.btn(), padding:'6px 9px', color:'#34d399' }} title="WhatsApp"><Share2 size={13} /></button>
                    {['sent','overdue'].includes(doc.status) && (
                      <button onClick={() => sendReminder(doc.id)} style={{ ...S.btn(), padding:'6px 9px', color:'#f59e0b' }} title="Send Reminder"><AlertCircle size={13} /></button>
                    )}
                    {['sent','overdue','draft'].includes(doc.status) && (
                      <button onClick={() => markPaid(doc.id)} style={{ ...S.btn(), padding:'6px 9px', color:'#34d399' }} title="Mark Paid"><CheckCircle2 size={13} /></button>
                    )}
                    <button onClick={() => deleteDoc(doc.id)} style={{ ...S.btn(false,true), padding:'6px 9px' }} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════ CREATE / EDIT ════ */}
        {view === 'create' && editing && (() => {
          const upd = (u: Partial<CreatedInvoice>) => setEditing(e => calcDoc({ ...e, ...u }) as Partial<CreatedInvoice>);
          const updLine = (id: string, u: Partial<InvoiceLineItem>) => upd({ lineItems: (editing.lineItems||[]).map(l => l.id===id ? {...l,...u} : l) });
          return (
            <div style={{ maxWidth:820, margin:'0 auto' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, flexWrap:'wrap' }}>
                <button onClick={() => { setEditing(null); setView('invoices'); }} style={{ ...S.btn(), fontSize:12 }}>← Back</button>
                <h2 style={{ color:'white', fontWeight:900, fontSize:18, margin:0, flex:1 }}>
                  {docs.find(d=>d.id===editing.id) ? 'Edit' : 'New'} {editing.type?.charAt(0).toUpperCase()+(editing.type?.slice(1)||'')} — {editing.invoiceNumber}
                </h2>
                <button onClick={() => { setPreview(calcDoc(editing) as CreatedInvoice); setView('preview'); }} style={{ ...S.btn(), fontSize:12 }}>
                  <Eye size={13} /> Preview
                </button>
                <button onClick={saveAsTemplate} style={{ ...S.btn(), fontSize:12 }}>
                  <Save size={13} /> Save Template
                </button>
              </div>

              {/* Template picker */}
              <div style={{ ...S.card, padding:14, marginBottom:12 }}>
                <p style={S.label}>Invoice Template</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
                  {INVOICE_TEMPLATES.map(tpl => (
                    <button key={tpl.id} onClick={() => upd({ template:tpl.id, accentColor:tpl.accent })}
                      style={{ padding:'8px 14px', borderRadius:9, cursor:'pointer', fontWeight:700, fontSize:11, border:`2px solid ${editing.template===tpl.id ? tpl.accent : 'rgba(48,54,61,0.9)'}`, background: editing.template===tpl.id ? `${tpl.accent}22` : 'transparent', color: editing.template===tpl.id ? tpl.accent : 'rgba(255,255,255,0.5)', transition:'all 0.15s' }}>
                      <span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:tpl.accent, marginRight:6, verticalAlign:'middle' }} />
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Business + Client */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div style={{ ...S.card, padding:16 }}>
                  <p style={{ ...S.label, color:'#58a6ff', marginBottom:10 }}>From (Your Business)</p>
                  {[['businessName','Business Name'],['businessEmail','Email'],['businessPhone','Phone'],['businessAddress','Address'],['pin','KRA PIN']].map(([k,l]) => (
                    <div key={k} style={{ marginBottom:10 }}>
                      <label style={S.label}>{l}</label>
                      <input value={(editing as any)[k]||''} onChange={e=>upd({[k]:e.target.value} as any)} style={S.input} placeholder={k==='pin'?'P051234567X':''} />
                    </div>
                  ))}
                </div>
                <div style={{ ...S.card, padding:16 }}>
                  <p style={{ ...S.label, color:'#34d399', marginBottom:10 }}>Bill To (Client)</p>
                  {[['clientName','Full Name / Company *'],['clientEmail','Email'],['clientPhone','Phone'],['clientAddress','Address']].map(([k,l]) => (
                    <div key={k} style={{ marginBottom:10 }}>
                      <label style={S.label}>{l}</label>
                      <input value={(editing as any)[k]||''} onChange={e=>upd({[k]:e.target.value} as any)} style={S.input} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates + Currency + VAT */}
              <div style={{ ...S.card, padding:16, marginBottom:12 }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10 }}>
                  <div><label style={S.label}>Doc Number</label><input value={editing.invoiceNumber||''} onChange={e=>upd({invoiceNumber:e.target.value})} style={S.input} /></div>
                  <div><label style={S.label}>Issue Date</label><input type="date" value={editing.issuedDate||''} onChange={e=>upd({issuedDate:e.target.value})} style={S.input} /></div>
                  <div><label style={S.label}>{editing.type==='receipt'?'Payment Date':'Due Date'}</label><input type="date" value={editing.dueDate||''} onChange={e=>upd({dueDate:e.target.value})} style={S.input} /></div>
                  <div><label style={S.label}>Currency</label>
                    <select value={editing.currency||'KES'} onChange={e=>upd({currency:e.target.value})} style={{ ...S.input, cursor:'pointer' }}>
                      {CURRENCIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label style={S.label}>VAT Rate</label>
                    <select value={editing.taxRate??16} onChange={e=>upd({taxRate:+e.target.value})} style={{ ...S.input, cursor:'pointer' }}>
                      {TAX_RATES.map(r=><option key={r} value={r}>{r}% {r===16?'(Std KRA)':r===8?'(Reduced)':'(Exempt)'}</option>)}
                    </select>
                  </div>
                  <div><label style={S.label}>Status</label>
                    <select value={editing.status||'draft'} onChange={e=>upd({status:e.target.value as InvoiceStatus})} style={{ ...S.input, cursor:'pointer' }}>
                      {['draft','sent','paid','overdue','cancelled'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div style={{ ...S.card, padding:16, marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={S.label}>Line Items</span>
                  <button onClick={() => upd({ lineItems:[...(editing.lineItems||[]),newLine()] })} style={{ ...S.btn(), fontSize:11 }}><Plus size={12} /> Add Item</button>
                </div>
                {/* Header - desktop */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 60px 80px 70px 80px 26px', gap:6, marginBottom:6 }}>
                  {['Description','Qty','Unit','Unit Price','Total',''].map(h=><span key={h} style={{ ...S.label, marginBottom:0 }}>{h}</span>)}
                </div>
                {(editing.lineItems||[]).map(item => (
                  <div key={item.id} style={{ display:'grid', gridTemplateColumns:'1fr 60px 80px 70px 80px 26px', gap:6, marginBottom:6, alignItems:'center' }}>
                    <input value={item.description} onChange={e=>updLine(item.id,{description:e.target.value})} style={S.input} placeholder="Description..." />
                    <input type="number" min="0" step="0.01" value={item.qty} onChange={e=>updLine(item.id,{qty:+e.target.value})} style={{ ...S.input, textAlign:'center' }} />
                    <select value={item.unit||'pcs'} onChange={e=>updLine(item.id,{unit:e.target.value})} style={{ ...S.input, cursor:'pointer' }}>
                      {['pcs','hrs','days','kg','m','m²','sqft','trips','months','units'].map(u=><option key={u}>{u}</option>)}
                    </select>
                    <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e=>updLine(item.id,{unitPrice:+e.target.value})} style={{ ...S.input, textAlign:'right' }} />
                    <div style={{ textAlign:'right', color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:700 }}>{fmt(item.qty*item.unitPrice,editing.currency||'KES')}</div>
                    <button onClick={()=>upd({lineItems:(editing.lineItems||[]).filter(l=>l.id!==item.id)})} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(239,68,68,0.6)', padding:2 }} disabled={(editing.lineItems||[]).length<=1}><Trash2 size={13} /></button>
                  </div>
                ))}
                <div style={{ borderTop:'1px solid rgba(48,54,61,0.8)', marginTop:10, paddingTop:10 }}>
                  {[['Subtotal',fmt(editing.subtotal||0,editing.currency)],
                    ...(editing.taxRate&&editing.taxRate>0?[[`VAT (${editing.taxRate}%)`,fmt(editing.taxAmount||0,editing.currency)]]:[] as any),
                  ].map((row: any) => (
                    <div key={row[0]} style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ color:'rgba(255,255,255,0.35)', fontSize:12, fontWeight:700 }}>{row[0]}</span>
                      <span style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>{row[1]}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                    <span style={{ color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:700, textTransform:'uppercase' }}>Discount</span>
                    <input type="number" min="0" value={editing.discount||0} onChange={e=>upd({discount:+e.target.value})} style={{ ...S.input, width:110, textAlign:'right', fontSize:12 }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, paddingTop:8, borderTop:'1px solid rgba(48,54,61,0.6)' }}>
                    <span style={{ color:'white', fontSize:16, fontWeight:900, textTransform:'uppercase' }}>TOTAL</span>
                    <span style={{ color: editing.accentColor||'#1f6feb', fontSize:18, fontWeight:900 }}>{fmt(editing.total||0,editing.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <div style={{ ...S.card, padding:14 }}>
                  <label style={S.label}>Notes to Client</label>
                  <textarea value={editing.note||''} onChange={e=>upd({note:e.target.value})} rows={3} style={{ ...S.input, resize:'none' }} />
                </div>
                <div style={{ ...S.card, padding:14 }}>
                  <label style={S.label}>Payment Terms</label>
                  <textarea value={editing.terms||''} onChange={e=>upd({terms:e.target.value})} rows={3} style={{ ...S.input, resize:'none' }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={() => { upd({status:'draft'}); setTimeout(saveDoc,0); }} style={{ ...S.btn(), flex:1, justifyContent:'center', padding:13 }}><Save size={15} /> Save Draft</button>
                <button onClick={() => { upd({status:'sent'}); setTimeout(saveDoc,0); }} style={{ ...S.btn(true), flex:2, justifyContent:'center', padding:13 }}><Send size={15} /> Save & Mark Sent</button>
              </div>
              <p style={{ textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:11, marginTop:8 }}>
                KRA-compliant · Reminders track until paid · StampKE
              </p>
            </div>
          );
        })()}

        {/* ════ PREVIEW ════ */}
        {view === 'preview' && preview && (
          <div style={{ maxWidth:680, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <button onClick={() => setView('invoices')} style={{ ...S.btn(), fontSize:12 }}>← Back</button>
              <h2 style={{ color:'white', fontWeight:900, fontSize:18, margin:0, flex:1 }}>Preview — {preview.invoiceNumber}</h2>
              <button onClick={() => exportDocPDF(preview)} style={{ ...S.btn(true), fontSize:12 }}><Download size={13} /> PDF</button>
              <button onClick={() => shareWhatsApp(preview)} style={{ ...S.btn(), fontSize:12, color:'#34d399' }}><Share2 size={13} /> WhatsApp</button>
              <button onClick={() => copyLink(preview)} style={{ ...S.btn(), fontSize:12 }}><Copy size={13} /> Copy</button>
              <button onClick={() => { setEditing(preview); setView('create'); }} style={{ ...S.btn(), fontSize:12 }}><Edit3 size={13} /> Edit</button>
            </div>
            {/* White invoice card */}
            <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
              <div style={{ background: preview.accentColor||'#1f6feb', padding:'24px 28px', color:'white' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                  <div>
                    {preview.businessLogo && <img src={preview.businessLogo} style={{ height:36, marginBottom:8, objectFit:'contain' }} alt="logo" />}
                    <h2 style={{ fontSize:18, fontWeight:900, margin:0 }}>{preview.businessName||'Your Business'}</h2>
                    {preview.businessEmail && <p style={{ fontSize:12, opacity:0.8, margin:'2px 0 0' }}>{preview.businessEmail}</p>}
                    {preview.pin && <p style={{ fontSize:11, opacity:0.65, margin:'2px 0 0' }}>KRA PIN: {preview.pin}</p>}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:22, fontWeight:900, margin:0, textTransform:'uppercase' }}>{preview.type}</p>
                    <p style={{ fontSize:15, fontWeight:700, opacity:0.9, margin:'2px 0 0' }}>#{preview.invoiceNumber}</p>
                    <span style={{ display:'inline-block', marginTop:6, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,0.2)' }}>
                      {preview.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ padding:'20px 28px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
                  <div>
                    <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Bill To</p>
                    <p style={{ fontWeight:700, color:'#111827', marginBottom:2 }}>{preview.clientName}</p>
                    {preview.clientEmail && <p style={{ fontSize:13, color:'#6b7280' }}>{preview.clientEmail}</p>}
                    {preview.clientPhone && <p style={{ fontSize:13, color:'#6b7280' }}>{preview.clientPhone}</p>}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Details</p>
                    <p style={{ fontSize:13, color:'#374151' }}>Issued: <strong>{preview.issuedDate}</strong></p>
                    <p style={{ fontSize:13, color:'#374151' }}>Due: <strong>{preview.dueDate}</strong></p>
                    <p style={{ fontSize:13, color:'#374151' }}>Currency: <strong>{preview.currency}</strong></p>
                  </div>
                </div>
                {/* Items */}
                <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:16 }}>
                  <thead><tr style={{ background:'#f9fafb' }}>
                    {['Description','Qty','Unit Price','Total'].map(h=><th key={h} style={{ padding:'8px 10px', fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', textAlign:h==='Description'?'left':'right', letterSpacing:'0.04em' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{preview.lineItems.map((item,i) => (
                    <tr key={item.id} style={{ background:i%2===0?'white':'#f9fafb' }}>
                      <td style={{ padding:'9px 10px', color:'#111827', fontWeight:500 }}>{item.description}</td>
                      <td style={{ padding:'9px 10px', color:'#6b7280', textAlign:'right' }}>{item.qty}{item.unit?' '+item.unit:''}</td>
                      <td style={{ padding:'9px 10px', color:'#6b7280', textAlign:'right' }}>{fmt(item.unitPrice,preview.currency)}</td>
                      <td style={{ padding:'9px 10px', color:'#111827', fontWeight:700, textAlign:'right' }}>{fmt(item.qty*item.unitPrice,preview.currency)}</td>
                    </tr>
                  ))}</tbody>
                </table>
                {/* Totals */}
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <div style={{ width:240 }}>
                    {[['Subtotal',preview.subtotal],
                      ...(preview.taxRate>0?[[`VAT (${preview.taxRate}%)`,preview.taxAmount]]:[] as any),
                      ...(preview.discount&&preview.discount>0?[['Discount',-preview.discount]]:[] as any)
                    ].map((row: any) => (
                      <div key={row[0]} style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13 }}>
                        <span style={{ color:'#6b7280' }}>{row[0]}</span>
                        <span style={{ fontWeight:600, color:'#374151' }}>{fmt(row[1],preview.currency)}</span>
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'2px solid #e5e7eb', marginTop:4 }}>
                      <span style={{ fontWeight:900, fontSize:15, color:'#111827' }}>TOTAL</span>
                      <span style={{ fontWeight:900, fontSize:16, color: preview.accentColor||'#1f6feb' }}>{fmt(preview.total,preview.currency)}</span>
                    </div>
                  </div>
                </div>
                {(preview.note || preview.terms) && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, borderTop:'1px solid #f3f4f6', paddingTop:14, marginTop:14 }}>
                    {preview.note && <div><p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', marginBottom:4 }}>Notes</p><p style={{ fontSize:12, color:'#6b7280' }}>{preview.note}</p></div>}
                    {preview.terms && <div><p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', marginBottom:4 }}>Terms</p><p style={{ fontSize:12, color:'#6b7280' }}>{preview.terms}</p></div>}
                  </div>
                )}
              </div>
              <div style={{ background:'#f9fafb', padding:'10px 28px', textAlign:'center' }}>
                <p style={{ fontSize:10, color:'#9ca3af' }}>Generated by StampKE · stampke.co.ke · KRA Compliant</p>
              </div>
            </div>
          </div>
        )}

        {/* ════ INBOX ════ */}
        {view === 'inbox' && (
          <div style={{ maxWidth:900, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <h2 style={{ color:'white', fontWeight:900, fontSize:18, margin:0 }}>Receipt Inbox <span style={{ color:'rgba(255,255,255,0.3)', fontSize:14 }}>({db.unsorted.length})</span></h2>
              <button onClick={() => fileRef.current?.click()} style={S.btn(true)}><Upload size={13} /> Upload</button>
            </div>
            {db.unsorted.length === 0 ? (
              <div style={{ ...S.card, padding:60, textAlign:'center' }}>
                <Archive size={40} style={{ color:'rgba(255,255,255,0.1)', margin:'0 auto 12px' }} />
                <p style={{ color:'rgba(255,255,255,0.3)', fontWeight:600 }}>No files. Drop receipts here or upload to start AI extraction.</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                {db.unsorted.map((file: UnsortedFile) => (
                  <div key={file.id} style={{ ...S.card, overflow:'hidden', cursor:'pointer' }}>
                    <div style={{ height:130, background:'#0d1117', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                      {file.mime.startsWith('image/') ? (
                        <img src={`data:${file.mime};base64,${file.data}`} style={{ maxHeight:'100%', maxWidth:'100%', objectFit:'contain' }} alt={file.name} />
                      ) : (
                        <div style={{ textAlign:'center' }}><FileImage size={30} style={{ color:'rgba(255,255,255,0.15)', marginBottom:6 }} /><p style={{ color:'rgba(255,255,255,0.3)', fontSize:10 }}>PDF</p></div>
                      )}
                      {file.analyzed && <div style={{ position:'absolute', top:6, right:6, background:'#065f46', borderRadius:5, padding:'2px 5px', fontSize:9, fontWeight:800, color:'#34d399' }}>Analyzed</div>}
                    </div>
                    <div style={{ padding:10 }}>
                      <p style={{ color:'white', fontWeight:700, fontSize:11, margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.name}</p>
                      <p style={{ color:'rgba(255,255,255,0.3)', fontSize:10, margin:'0 0 8px' }}>{new Date(file.createdAt).toLocaleDateString()}</p>
                      <div style={{ display:'flex', gap:5 }}>
                        <button onClick={() => { setActiveFile(file); setFormData({}); setAnalyzeError(''); setView('analyze'); }} style={{ ...S.btn(true), flex:1, justifyContent:'center', padding:'6px 8px', fontSize:10 }}>
                          <Brain size={11} /> Analyze
                        </button>
                        <button onClick={() => persistDB({...db, unsorted:db.unsorted.filter((f:UnsortedFile)=>f.id!==file.id)})} style={{ ...S.btn(false,true), padding:'6px 8px' }}><Trash2 size={11} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ ANALYZE ════ */}
        {view === 'analyze' && activeFile && (
          <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:16, alignItems:'start' }}>
            <div style={{ ...S.card, overflow:'hidden', position:'sticky', top:0 }}>
              <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(48,54,61,0.6)', display:'flex', gap:8 }}>
                <button onClick={() => setView('inbox')} style={{ ...S.btn(), fontSize:11, padding:'4px 8px' }}>← Back</button>
                <span style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', alignSelf:'center' }}>{activeFile.name}</span>
              </div>
              <div style={{ padding:14, background:'#0d1117', minHeight:280, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {activeFile.mime.startsWith('image/') ? (
                  <img src={`data:${activeFile.mime};base64,${activeFile.data}`} style={{ maxWidth:'100%', maxHeight:400, objectFit:'contain', borderRadius:8 }} alt="" />
                ) : (
                  <div style={{ textAlign:'center', padding:30 }}>
                    <FileText size={44} style={{ color:'rgba(255,255,255,0.12)', marginBottom:10 }} />
                    <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>PDF Document</p>
                  </div>
                )}
              </div>
              <div style={{ padding:14 }}>
                <button onClick={() => startAnalyze(activeFile)} disabled={analyzing}
                  style={{ ...S.btn(true), width:'100%', justifyContent:'center', padding:12, fontSize:13, opacity:analyzing?0.7:1 }}>
                  {analyzing ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> Analyzing…</> : <><Sparkles size={14} /> Analyze with AI</>}
                </button>
                {analyzeError && <div style={{ marginTop:8, padding:'8px 10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:7, color:'#f87171', fontSize:12 }}>{analyzeError}</div>}
              </div>
            </div>
            <div style={S.card}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(48,54,61,0.6)' }}>
                <p style={{ color:'white', fontWeight:800, fontSize:13, margin:0 }}>Transaction Details</p>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11, margin:'2px 0 0' }}>Review AI-extracted data and save</p>
              </div>
              <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12 }}>
                <div><label style={S.label}>Name *</label><input style={S.input} value={formData.name||''} onChange={e=>setFormData(p=>({...p,name:e.target.value}))} placeholder="Transaction name" /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div><label style={S.label}>Merchant</label><input style={S.input} value={formData.merchant||''} onChange={e=>setFormData(p=>({...p,merchant:e.target.value}))} /></div>
                  <div><label style={S.label}>Date</label><input type="date" style={S.input} value={formData.issuedAt||''} onChange={e=>setFormData(p=>({...p,issuedAt:e.target.value}))} /></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                  <div><label style={S.label}>Total</label><input type="number" style={S.input} value={formData.total||''} onChange={e=>setFormData(p=>({...p,total:+e.target.value}))} /></div>
                  <div><label style={S.label}>Currency</label>
                    <select style={{ ...S.input, cursor:'pointer' }} value={formData.currency||'KES'} onChange={e=>setFormData(p=>({...p,currency:e.target.value}))}>
                      {CURRENCIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label style={S.label}>Type</label>
                    <select style={{ ...S.input, cursor:'pointer' }} value={formData.type||'expense'} onChange={e=>setFormData(p=>({...p,type:e.target.value as any}))}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                </div>
                <div><label style={S.label}>Category</label>
                  <select style={{ ...S.input, cursor:'pointer' }} value={formData.category||'other'} onChange={e=>setFormData(p=>({...p,category:e.target.value}))}>
                    {CATEGORIES.map(c=><option key={c.code} value={c.code}>{c.emoji} {c.name}</option>)}
                  </select>
                </div>
                <div><label style={S.label}>Notes</label><input style={S.input} value={formData.note||''} onChange={e=>setFormData(p=>({...p,note:e.target.value}))} /></div>
                <button onClick={saveTransaction} style={{ ...S.btn(true), justifyContent:'center', padding:12, fontSize:13 }}><CheckCircle2 size={14} /> Save Transaction</button>
              </div>
            </div>
          </div>
        )}

        {/* ════ TRANSACTIONS ════ */}
        {view === 'transactions' && (
          <div style={{ maxWidth:900, margin:'0 auto' }}>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions..." style={{ ...S.input, flex:1, minWidth:180 }} />
              <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{ ...S.input, cursor:'pointer', width:'auto' }}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c=><option key={c.code} value={c.code}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            {txs.length === 0 ? (
              <div style={{ ...S.card, padding:60, textAlign:'center' }}>
                <Receipt size={40} style={{ color:'rgba(255,255,255,0.1)', margin:'0 auto 12px' }} />
                <p style={{ color:'rgba(255,255,255,0.3)', fontWeight:600 }}>No transactions yet. Upload receipts to the inbox.</p>
              </div>
            ) : (
              <div style={S.card}>
                {txs.filter(t => (!filterCat||t.category===filterCat) && (!search||t.name.toLowerCase().includes(search.toLowerCase())||t.merchant.toLowerCase().includes(search.toLowerCase()))).map((tx,i,arr) => {
                  const cat = catInfo(tx.category);
                  return (
                    <div key={tx.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', borderBottom: i<arr.length-1?'1px solid rgba(48,54,61,0.5)':'none' }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:`${cat.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{cat.emoji}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ color:'white', fontWeight:700, fontSize:13, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.name}</p>
                        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11, margin:0 }}>{tx.merchant||tx.issuedAt}</p>
                      </div>
                      <span style={{ fontWeight:800, fontSize:14, color:tx.type==='income'?'#34d399':'#f87171', flexShrink:0 }}>
                        {tx.type==='income'?'+':'-'}{fmt(tx.total,tx.currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ STATS ════ */}
        {view === 'stats' && (
          <div style={{ maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
              {[
                { label:'Total Income',    val:fmt(totalIncome),   color:'#34d399', sub:`${txs.filter(t=>t.type==='income').length} txs` },
                { label:'Total Expenses',  val:fmt(totalExpenses), color:'#f87171', sub:`${txs.filter(t=>t.type==='expense').length} txs` },
                { label:'Net Balance',     val:fmt(totalIncome-totalExpenses), color:totalIncome>=totalExpenses?'#34d399':'#f87171', sub:'Income - Expenses' },
                { label:'Invoiced Total',  val:fmt(docs.filter(d=>d.type==='invoice').reduce((s,d)=>s+d.total,0)), color:'#58a6ff', sub:`${docs.filter(d=>d.type==='invoice').length} invoices` },
                { label:'Collected',       val:fmt(totalPaid),     color:'#34d399', sub:`${docs.filter(d=>d.status==='paid').length} paid` },
                { label:'Outstanding',     val:fmt(totalOutstanding), color:'#f59e0b', sub:`${docs.filter(d=>['sent','overdue'].includes(d.status)).length} pending` },
              ].map(s => (
                <div key={s.label} style={{ ...S.card, padding:16 }}>
                  <p style={{ ...S.label, marginBottom:6 }}>{s.label}</p>
                  <p style={{ fontSize:20, fontWeight:900, color:s.color, letterSpacing:'-0.02em', margin:0 }}>{s.val}</p>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', margin:'4px 0 0' }}>{s.sub}</p>
                </div>
              ))}
            </div>
            {/* Category breakdown */}
            <div style={{ ...S.card, padding:16 }}>
              <p style={{ color:'white', fontWeight:800, fontSize:13, marginBottom:12 }}>Expense Breakdown</p>
              {CATEGORIES.filter(c => txs.filter(t=>t.category===c.code&&t.type==='expense').length > 0).map(cat => {
                const total = txs.filter(t=>t.category===cat.code&&t.type==='expense').reduce((s,t)=>s+t.total,0);
                const pct   = totalExpenses > 0 ? (total/totalExpenses)*100 : 0;
                return (
                  <div key={cat.code} style={{ display:'grid', gridTemplateColumns:'120px 1fr 100px', gap:10, alignItems:'center', marginBottom:8 }}>
                    <span style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>{cat.emoji} {cat.name}</span>
                    <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:3, background:cat.color, width:`${pct}%`, transition:'width 0.5s' }} />
                    </div>
                    <span style={{ color:'rgba(255,255,255,0.5)', fontSize:11, textAlign:'right' }}>{fmt(total)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ TEMPLATES ════ */}
        {view === 'templates' && (
          <div style={{ maxWidth:900, margin:'0 auto' }}>
            <h2 style={{ color:'white', fontWeight:900, fontSize:18, marginBottom:16 }}>Invoice Templates</h2>
            {/* Built-in templates */}
            <p style={{ ...S.label, marginBottom:10 }}>Design Templates</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10, marginBottom:24 }}>
              {INVOICE_TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={() => startNew('invoice')}
                  style={{ ...S.card, padding:16, cursor:'pointer', border:`2px solid ${tpl.accent}44`, background:`${tpl.accent}08`, textAlign:'left' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:tpl.accent, marginBottom:10 }} />
                  <p style={{ color:'white', fontWeight:700, fontSize:13, margin:'0 0 3px' }}>{tpl.name}</p>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:11, margin:0 }}>{tpl.desc}</p>
                </button>
              ))}
            </div>
            {/* Saved templates */}
            {savedTemplates.length > 0 && (
              <>
                <p style={{ ...S.label, marginBottom:10 }}>Your Saved Templates ({savedTemplates.length})</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
                  {savedTemplates.map((tpl: any) => (
                    <div key={tpl.id} style={{ ...S.card, padding:14 }}>
                      <p style={{ color:'white', fontWeight:700, fontSize:13, margin:'0 0 3px' }}>{tpl.name}</p>
                      <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11, margin:'0 0 10px' }}>
                        {tpl.type} · Saved {new Date(tpl.savedAt).toLocaleDateString()}
                      </p>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => { setEditing({...tpl, id:uid(), invoiceNumber:`INV-${Date.now().toString().slice(-6)}`}); setView('create'); }} style={{ ...S.btn(true), flex:1, justifyContent:'center', fontSize:11, padding:'6px 8px' }}>Use Template</button>
                        <button onClick={() => { const u=savedTemplates.filter((t:any)=>t.id!==tpl.id); setSavedTpl(u); localStorage.setItem(TEMPLATE_KEY,JSON.stringify(u)); }} style={{ ...S.btn(false,true), padding:'6px 8px' }}><Trash2 size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════ BIZ SETUP ════ */}
        {view === 'biz-setup' && (
          <div style={{ maxWidth:520, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <button onClick={() => setView('dashboard')} style={{ ...S.btn(), fontSize:12 }}>← Back</button>
              <h2 style={{ color:'white', fontWeight:900, fontSize:18, margin:0 }}>Business Setup</h2>
            </div>
            {/* Logo */}
            <div style={{ ...S.card, padding:16, marginBottom:12 }}>
              <p style={{ ...S.label, marginBottom:10 }}>Company Logo</p>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div onClick={() => logoRef.current?.click()}
                  style={{ width:64, height:64, borderRadius:14, background:'rgba(255,255,255,0.05)', border:'2px dashed rgba(88,166,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden' }}>
                  {biz.logo ? <img src={biz.logo} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="logo" /> : <Upload size={18} color="rgba(255,255,255,0.3)" />}
                </div>
                <div><p style={{ color:'white', fontWeight:700, fontSize:13, margin:'0 0 3px' }}>Upload Logo</p><p style={{ color:'rgba(255,255,255,0.4)', fontSize:11, margin:0 }}>PNG or JPG, shown on all invoices</p></div>
                <input ref={logoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const r = new FileReader(); r.onload = () => { const nb={...biz,logo:r.result as string}; setBiz(nb); saveBiz(nb); }; r.readAsDataURL(f);
                }} />
              </div>
            </div>
            <div style={{ ...S.card, padding:16 }}>
              {[['name','Business Name','My Company Ltd'],['email','Business Email','billing@company.ke'],['phone','Phone','+254 700 000 000'],['address','Address','Nairobi, Kenya'],['pin','KRA PIN (for VAT invoices)','P051234567X'],['industry','Industry','General']].map(([k,l,ph]) => (
                <div key={k} style={{ marginBottom:12 }}>
                  <label style={S.label}>{l}</label>
                  {k==='industry' ? (
                    <select value={biz[k]||''} onChange={e=>{const nb={...biz,[k]:e.target.value};setBiz(nb);saveBiz(nb);}} style={{ ...S.input, cursor:'pointer' }}>
                      <option value="">Select industry...</option>
                      {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
                    </select>
                  ) : (
                    <input value={biz[k]||''} onChange={e=>{const nb={...biz,[k]:e.target.value};setBiz(nb);saveBiz(nb);}} style={S.input} placeholder={ph} />
                  )}
                </div>
              ))}
              <button onClick={() => { showToast('Business details saved!'); setView('dashboard'); }} style={{ ...S.btn(true), width:'100%', justifyContent:'center', padding:13, fontSize:13 }}><Check size={15} /> Save Business Details</button>
            </div>
          </div>
        )}

      </div>

      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" style={{ display:'none' }} onChange={e=>e.target.files&&handleFiles(e.target.files)} />
    </div>
  );
}
