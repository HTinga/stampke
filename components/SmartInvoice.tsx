import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Brain, FileText, Plus, Trash2, Download, Search, Filter,
  ChevronDown, ChevronUp, X, Check, RefreshCw, BarChart2, TrendingUp,
  TrendingDown, DollarSign, Tag, FolderOpen, Calendar, Eye, Edit3,
  ArrowDownToLine, Loader2, AlertCircle, CheckCircle2, Receipt, Layers,
  SlidersHorizontal, Package, FileImage, FilePlus, Wallet, PieChart,
  Archive, ChevronRight, MoreVertical, Sparkles, Settings, Home,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
interface InvoiceItem { name: string; qty?: number; price?: number; total?: number; }
interface Transaction {
  id: string;
  name: string;
  merchant: string;
  description: string;
  type: 'expense' | 'income';
  total: number;
  currency: string;
  category: string;
  project: string;
  issuedAt: string;
  note: string;
  items: InvoiceItem[];
  fileData?: string; // base64
  fileName?: string;
  fileMime?: string;
  createdAt: string;
  status: 'pending' | 'reviewed';
}

interface UnsortedFile {
  id: string;
  name: string;
  data: string; // base64
  mime: string;
  createdAt: string;
  analyzed: boolean;
  parseResult?: Record<string, any>;
}

const CATEGORIES = [
  { code: 'food', name: 'Food & Drinks', color: '#d40e70', emoji: '🍽' },
  { code: 'transport', name: 'Transport', color: '#0e7d86', emoji: '🚗' },
  { code: 'tools', name: 'Tools & Equipment', color: '#c69713', emoji: '🛠' },
  { code: 'communication', name: 'Mobile & Internet', color: '#0e6885', emoji: '📱' },
  { code: 'invoice', name: 'Invoice / Bill', color: '#064e85', emoji: '🧾' },
  { code: 'salary', name: 'Salary', color: '#1e6359', emoji: '💰' },
  { code: 'software', name: 'Software & SaaS', color: '#5b21b6', emoji: '💻' },
  { code: 'insurance', name: 'Insurance', color: '#050942', emoji: '🛡' },
  { code: 'events', name: 'Events', color: '#ff8b32', emoji: '🎫' },
  { code: 'tax', name: 'Taxes & Fees', color: '#882727', emoji: '📋' },
  { code: 'other', name: 'Other', color: '#374151', emoji: '📦' },
];

const CURRENCIES = ['KES', 'USD', 'EUR', 'GBP', 'UGX', 'TZS', 'ZAR', 'NGN'];

const DB_KEY = 'smart_invoice_v1';
const loadData = () => {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || '{"transactions":[],"unsorted":[]}'); }
  catch { return { transactions: [], unsorted: [] }; }
};
const saveData = (data: any) => localStorage.setItem(DB_KEY, JSON.stringify(data));

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n: number, c = 'KES') => `${c} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fileToBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res((r.result as string).split(',')[1]); r.onerror = rej; r.readAsDataURL(file);
});
const catInfo = (code: string) => CATEGORIES.find(c => c.code === code) || CATEGORIES[CATEGORIES.length - 1];

// ── AI Analysis via Anthropic API ──────────────────────────────
async function analyzeWithAI(fileData: string, mime: string): Promise<Record<string, any>> {
  const isImage = mime.startsWith('image/');
  const isPdf = mime === 'application/pdf';

  const content: any[] = [];
  if (isImage) {
    content.push({ type: 'image', source: { type: 'base64', media_type: mime, data: fileData } });
  } else if (isPdf) {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileData } });
  }
  content.push({
    type: 'text',
    text: `You are a professional accountant and invoice analysis assistant.
Extract all information from this receipt/invoice and return ONLY a valid JSON object with these fields:
{
  "name": "short transaction name (merchant + type)",
  "merchant": "vendor/merchant name",
  "description": "brief description of what was purchased",
  "type": "expense or income",
  "total": numeric total amount (number only, no currency symbol),
  "currency": "3-letter currency code e.g. KES, USD, EUR",
  "category": one of: food, transport, tools, communication, invoice, salary, software, insurance, events, tax, other,
  "issuedAt": "YYYY-MM-DD date format",
  "items": [{"name":"item name","qty":1,"price":100,"total":100}],
  "note": "any important notes"
}
Rules: Return ONLY the JSON object. No markdown. No explanation. If you cannot find a value, use empty string or 0. Never make up data.`
  });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API error ${response.status}: ${err.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data.content?.find((b: any) => b.type === 'text')?.text || '{}';
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      // Ensure items is always an array
      if (!Array.isArray(parsed.items)) parsed.items = [];
      // Ensure total is a number
      parsed.total = parseFloat(parsed.total) || 0;
      return parsed;
    } catch { return { items: [], total: 0 }; }
  } catch (err: any) {
    throw new Error(err.message || 'Analysis failed. Check your connection.');
  }
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
export default function SmartInvoice() {
  const [view, setView] = useState<'dashboard' | 'unsorted' | 'transactions' | 'analyze' | 'stats'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [unsorted, setUnsorted] = useState<UnsortedFile[]>([]);
  const [activeFile, setActiveFile] = useState<UnsortedFile | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<Record<string, any> | null>(null);
  const [analyzeError, setAnalyzeError] = useState('');
  const [formData, setFormData] = useState<Partial<Transaction>>({});
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterType, setFilterType] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Load from localStorage
  useEffect(() => {
    const d = loadData();
    setTransactions(d.transactions || []);
    setUnsorted(d.unsorted || []);
  }, []);

  const persist = useCallback((txs: Transaction[], uns: UnsortedFile[]) => {
    saveData({ transactions: txs, unsorted: uns });
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Upload files ──
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const newUnsorted: UnsortedFile[] = [];
    for (const file of arr) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) continue;
      const data = await fileToBase64(file);
      newUnsorted.push({ id: Date.now() + Math.random().toString(36), name: file.name, data, mime: file.type, createdAt: new Date().toISOString(), analyzed: false });
    }
    const updated = [...unsorted, ...newUnsorted];
    setUnsorted(updated);
    persist(transactions, updated);
    showToast(`${newUnsorted.length} file(s) uploaded`);
    if (newUnsorted.length === 1) { setActiveFile(newUnsorted[0]); setView('analyze'); }
    else setView('unsorted');
  }, [unsorted, transactions, persist]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // ── AI Analyze ──
  const startAnalyze = async (file: UnsortedFile) => {
    setAnalyzing(true);
    setAnalyzeError('');
    setAnalyzeResult(null);
    try {
      const result = await analyzeWithAI(file.data, file.mime);
      setAnalyzeResult(result);
      setFormData({
        name: result.name || file.name,
        merchant: result.merchant || '',
        description: result.description || '',
        type: result.type === 'income' ? 'income' : 'expense',
        total: parseFloat(result.total) || 0,
        currency: result.currency || 'KES',
        category: result.category || 'other',
        project: 'personal',
        issuedAt: result.issuedAt || new Date().toISOString().split('T')[0],
        note: result.note || '',
        items: result.items || [],
      });
      // Update unsorted cache
      const upd = unsorted.map(u => u.id === file.id ? { ...u, analyzed: true, parseResult: result } : u);
      setUnsorted(upd);
      persist(transactions, upd);
    } catch (err: any) {
      setAnalyzeError(err.message || 'Analysis failed');
    } finally { setAnalyzing(false); }
  };

  const openAnalyze = (file: UnsortedFile) => {
    setActiveFile(file);
    setAnalyzeResult(file.parseResult || null);
    setAnalyzeError('');
    setFormData(file.parseResult ? {
      name: file.parseResult.name || file.name,
      merchant: file.parseResult.merchant || '',
      description: file.parseResult.description || '',
      type: file.parseResult.type || 'expense',
      total: parseFloat(file.parseResult.total) || 0,
      currency: file.parseResult.currency || 'KES',
      category: file.parseResult.category || 'other',
      project: 'personal',
      issuedAt: file.parseResult.issuedAt || '',
      note: file.parseResult.note || '',
      items: file.parseResult.items || [],
    } : { currency: 'KES', type: 'expense', category: 'other', project: 'personal', items: [] });
    setView('analyze');
  };

  // ── Save transaction ──
  const saveTransaction = () => {
    if (!formData.name) { showToast('Please enter a name', 'error'); return; }
    const tx: Transaction = {
      id: Date.now().toString(),
      name: formData.name || '',
      merchant: formData.merchant || '',
      description: formData.description || '',
      type: formData.type || 'expense',
      total: formData.total || 0,
      currency: formData.currency || 'KES',
      category: formData.category || 'other',
      project: formData.project || 'personal',
      issuedAt: formData.issuedAt || new Date().toISOString().split('T')[0],
      note: formData.note || '',
      items: formData.items || [],
      fileData: activeFile?.data,
      fileName: activeFile?.name,
      fileMime: activeFile?.mime,
      createdAt: new Date().toISOString(),
      status: 'reviewed',
    };
    const newTxs = [tx, ...transactions];
    // Remove from unsorted
    const newUns = activeFile ? unsorted.filter(u => u.id !== activeFile.id) : unsorted;
    setTransactions(newTxs);
    setUnsorted(newUns);
    persist(newTxs, newUns);
    setActiveFile(null);
    setFormData({});
    setAnalyzeResult(null);
    showToast('Transaction saved!');
    setView('transactions');
  };

  const deleteTransaction = (id: string) => {
    const upd = transactions.filter(t => t.id !== id);
    setTransactions(upd);
    persist(upd, unsorted);
    showToast('Transaction deleted');
  };

  const deleteUnsorted = (id: string) => {
    const upd = unsorted.filter(u => u.id !== id);
    setUnsorted(upd);
    persist(transactions, upd);
  };

  // ── Stats ──
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.total || 0), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.total || 0), 0);
  const byCat = CATEGORIES.map(c => ({
    ...c,
    total: transactions.filter(t => t.category === c.code && t.type === 'expense').reduce((s, t) => s + (t.total || 0), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  // ── Export CSV ──
  const exportCSV = () => {
    const rows = [['Date', 'Name', 'Merchant', 'Type', 'Category', 'Total', 'Currency', 'Description', 'Note']];
    transactions.forEach(t => rows.push([t.issuedAt, t.name, t.merchant, t.type, t.category, String(t.total), t.currency, t.description, t.note]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `smart_invoice_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredTx = transactions.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.merchant.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat && t.category !== filterCat) return false;
    if (filterType && t.type !== filterType) return false;
    return true;
  });

  // ── Styles ──
  const S = {
    card: { background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 } as React.CSSProperties,
    input: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', padding: '8px 12px', width: '100%', fontSize: 13, outline: 'none' } as React.CSSProperties,
    label: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', marginBottom: 4, display: 'block' },
    btn: (accent = false, danger = false) => ({
      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
      background: danger ? 'rgba(239,68,68,0.15)' : accent ? 'linear-gradient(135deg,#1f6feb,#2d7ff9)' : 'rgba(255,255,255,0.07)',
      color: danger ? '#f87171' : 'white',
    } as React.CSSProperties),
  };

  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{ background: '#0a0f1a', minHeight: '100%', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Nav ── */}
      <div style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 20px', height: 48, flexShrink: 0, gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16, paddingRight: 16, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#1f6feb,#34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt size={14} color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 13, color: 'white', letterSpacing: '-0.02em' }}>Smart Invoice</span>
        </div>
        {[
          { id: 'dashboard', label: 'Home', icon: Home },
          { id: 'unsorted', label: `Inbox${unsorted.length ? ` (${unsorted.length})` : ''}`, icon: Archive },
          { id: 'transactions', label: 'Transactions', icon: Receipt },
          { id: 'stats', label: 'Analytics', icon: PieChart },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setView(id as any)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: view === id ? 'rgba(31,111,235,0.15)' : 'transparent',
              color: view === id ? '#58a6ff' : 'rgba(255,255,255,0.4)',
            }}>
            <Icon size={13} />{label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => fileInputRef.current?.click()}
          style={{ ...S.btn(true), fontSize: 11 }}>
          <Plus size={13} /> Upload
        </button>
        <button onClick={exportCSV} style={{ ...S.btn(), fontSize: 11, marginLeft: 4 }}>
          <Download size={13} /> CSV
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" style={{ display: 'none' }}
          onChange={e => e.target.files && handleFiles(e.target.files)} />
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'success' ? '#0d1117' : '#1a0a0a', border: `1px solid ${toast.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 12, padding: '10px 20px', color: toast.type === 'success' ? '#34d399' : '#f87171', fontWeight: 700, fontSize: 13, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{toast.msg}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>

        {/* ════ DASHBOARD ════ */}
        {view === 'dashboard' && (
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Total Income', val: fmt(totalIncome), color: '#34d399', icon: TrendingUp },
                { label: 'Total Expenses', val: fmt(totalExpenses), color: '#f87171', icon: TrendingDown },
                { label: 'Net Balance', val: fmt(totalIncome - totalExpenses), color: totalIncome >= totalExpenses ? '#34d399' : '#f87171', icon: Wallet },
                { label: 'Transactions', val: String(transactions.length), color: '#58a6ff', icon: Receipt },
                { label: 'Inbox', val: String(unsorted.length), color: '#f59e0b', icon: Archive },
              ].map(({ label, val, color, icon: Icon }) => (
                <div key={label} style={{ ...S.card, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={S.label}>{label}</span>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: '-0.02em' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Drop zone */}
            <div ref={dropRef} onDragOver={e => e.preventDefault()} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ ...S.card, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', borderStyle: 'dashed', borderColor: 'rgba(88,166,255,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(88,166,255,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(88,166,255,0.3)')}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(31,111,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={24} color="#58a6ff" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Drop receipts & invoices here</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>PDF, JPG, PNG, WEBP · AI will extract all data automatically</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Receipt', 'Invoice', 'Bank Statement', 'Bill'].map(t => (
                  <span key={t} style={{ background: 'rgba(88,166,255,0.1)', border: '1px solid rgba(88,166,255,0.2)', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, color: '#58a6ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Recent */}
            {transactions.length > 0 && (
              <div style={S.card}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: 'white' }}>Recent Transactions</span>
                  <button onClick={() => setView('transactions')} style={{ ...S.btn(), padding: '4px 10px', fontSize: 10 }}>View All</button>
                </div>
                {transactions.slice(0, 5).map(tx => {
                  const cat = catInfo(tx.category);
                  return (
                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{cat.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>{tx.merchant || tx.issuedAt}</p>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 14, color: tx.type === 'income' ? '#34d399' : '#f87171', flexShrink: 0 }}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.total, tx.currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ INBOX ════ */}
        {view === 'unsorted' && (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ color: 'white', fontWeight: 900, fontSize: 20, margin: 0 }}>Inbox <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 600 }}>({unsorted.length})</span></h2>
              <button onClick={() => fileInputRef.current?.click()} style={S.btn(true)}><Plus size={14} />Upload More</button>
            </div>
            {unsorted.length === 0 ? (
              <div style={{ ...S.card, padding: 60, textAlign: 'center' }}>
                <Archive size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
                <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>No files in inbox. Upload receipts to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {unsorted.map(file => (
                  <div key={file.id} style={{ ...S.card, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(88,166,255,0.4)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
                    {/* Preview */}
                    <div style={{ height: 140, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {file.mime.startsWith('image/') ? (
                        <img src={`data:${file.mime};base64,${file.data}`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} alt={file.name} />
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <FileImage size={32} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: 6 }} />
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>PDF</p>
                        </div>
                      )}
                      {file.analyzed && <div style={{ position: 'absolute', top: 8, right: 8, background: '#065f46', borderRadius: 6, padding: '2px 6px', fontSize: 9, fontWeight: 800, color: '#34d399', textTransform: 'uppercase' }}>Analyzed</div>}
                    </div>
                    <div style={{ padding: 12 }}>
                      <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 10px' }}>{new Date(file.createdAt).toLocaleDateString()}</p>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openAnalyze(file)} style={{ ...S.btn(true), flex: 1, justifyContent: 'center', padding: '7px 8px', fontSize: 11 }}>
                          <Brain size={12} /> Analyze
                        </button>
                        <button onClick={() => deleteUnsorted(file.id)} style={{ ...S.btn(false, true), padding: '7px 10px' }}>
                          <Trash2 size={12} />
                        </button>
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
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20, alignItems: 'start' }}>
            {/* Left: preview */}
            <div style={{ ...S.card, overflow: 'hidden', position: 'sticky', top: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setView('unsorted')} style={{ ...S.btn(), padding: '4px 8px', fontSize: 11 }}><ChevronRight size={12} style={{ transform: 'rotate(180deg)' }} /> Back</button>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeFile.name}</span>
              </div>
              <div style={{ padding: 16, background: '#0d1117', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeFile.mime.startsWith('image/') ? (
                  <img src={`data:${activeFile.mime};base64,${activeFile.data}`} style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 8 }} alt="" />
                ) : (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <FileText size={48} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 12 }} />
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>PDF Document</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>{activeFile.name}</p>
                  </div>
                )}
              </div>
              <div style={{ padding: 16 }}>
                <button onClick={() => startAnalyze(activeFile)} disabled={analyzing}
                  style={{ ...S.btn(true), width: '100%', justifyContent: 'center', padding: '12px', fontSize: 13, opacity: analyzing ? 0.7 : 1 }}>
                  {analyzing ? <><Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</> : <><Sparkles size={14} /> Analyze with AI</>}
                </button>
                {analyzeError && <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: 12 }}>{analyzeError}</div>}
              </div>
            </div>

            {/* Right: form */}
            <div style={S.card}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 14, margin: 0 }}>Transaction Details</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>Review and edit extracted data before saving</p>
              </div>
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Name */}
                <div><label style={S.label}>Transaction Name *</label><input style={S.input} value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Office supplies - Nairobi" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={S.label}>Merchant</label><input style={S.input} value={formData.merchant || ''} onChange={e => setFormData(p => ({ ...p, merchant: e.target.value }))} placeholder="Vendor name" /></div>
                  <div><label style={S.label}>Date</label><input type="date" style={S.input} value={formData.issuedAt || ''} onChange={e => setFormData(p => ({ ...p, issuedAt: e.target.value }))} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div><label style={S.label}>Total</label><input type="number" style={S.input} value={formData.total || ''} onChange={e => setFormData(p => ({ ...p, total: parseFloat(e.target.value) || 0 }))} placeholder="0.00" /></div>
                  <div><label style={S.label}>Currency</label>
                    <select style={S.input} value={formData.currency || 'KES'} onChange={e => setFormData(p => ({ ...p, currency: e.target.value }))}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label style={S.label}>Type</label>
                    <select style={S.input} value={formData.type || 'expense'} onChange={e => setFormData(p => ({ ...p, type: e.target.value as any }))}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                </div>
                <div><label style={S.label}>Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {CATEGORIES.map(c => (
                      <button key={c.code} onClick={() => setFormData(p => ({ ...p, category: c.code }))}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: formData.category === c.code ? `1px solid ${c.color}` : '1px solid rgba(255,255,255,0.08)', background: formData.category === c.code ? `${c.color}22` : 'rgba(255,255,255,0.04)', color: formData.category === c.code ? c.color : 'rgba(255,255,255,0.5)', transition: 'all 0.12s' }}>
                        {c.emoji} {c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label style={S.label}>Description</label><input style={S.input} value={formData.description || ''} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" /></div>
                <div><label style={S.label}>Note</label><textarea style={{ ...S.input, height: 60, resize: 'vertical' } as React.CSSProperties} value={formData.note || ''} onChange={e => setFormData(p => ({ ...p, note: e.target.value }))} placeholder="Optional note" /></div>

                {/* Items */}
                {(formData.items || []).length > 0 && (
                  <div>
                    <label style={S.label}>Detected Items ({(formData.items || []).length})</label>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
                      {(formData.items || []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: i < (formData.items || []).length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <Package size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                          <span style={{ flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{item.name}</span>
                          {item.qty && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>×{item.qty}</span>}
                          <span style={{ color: '#58a6ff', fontWeight: 700, fontSize: 12 }}>{fmt(item.total || item.price || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                  <button onClick={() => { setView('unsorted'); setActiveFile(null); }} style={{ ...S.btn(), flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button onClick={saveTransaction} style={{ ...S.btn(true), flex: 2, justifyContent: 'center', padding: '10px' }}>
                    <ArrowDownToLine size={14} /> Save Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ TRANSACTIONS ════ */}
        {view === 'transactions' && (
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input style={{ ...S.input, paddingLeft: 32 }} placeholder="Search transactions…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select style={{ ...S.input, width: 'auto', minWidth: 120 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c.code} value={c.code}>{c.emoji} {c.name}</option>)}
              </select>
              <select style={{ ...S.input, width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600 }}>{filteredTx.length} records</span>
            </div>

            {filteredTx.length === 0 ? (
              <div style={{ ...S.card, padding: 60, textAlign: 'center' }}>
                <Receipt size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
                <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>No transactions yet. Upload receipts to get started.</p>
              </div>
            ) : (
              <div style={S.card}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 140px 90px 90px 80px 60px', gap: 8, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['', 'Transaction', 'Merchant', 'Date', 'Amount', 'Category', ''].map((h, i) => (
                    <span key={i} style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)' }}>{h}</span>
                  ))}
                </div>
                {filteredTx.map((tx, idx) => {
                  const cat = catInfo(tx.category);
                  return (
                    <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 140px 90px 90px 80px 60px', gap: 8, padding: '10px 16px', borderBottom: idx < filteredTx.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{cat.emoji}</div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.name}</p>
                        {tx.description && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</p>}
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.merchant}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{tx.issuedAt}</span>
                      <span style={{ fontWeight: 800, fontSize: 13, color: tx.type === 'income' ? '#34d399' : '#f87171' }}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.total, tx.currency)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                      </span>
                      <button onClick={() => deleteTransaction(tx.id)} style={{ ...S.btn(false, true), padding: '5px 8px' }}><Trash2 size={11} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ ANALYTICS ════ */}
        {view === 'stats' && (
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'Total Income', val: fmt(totalIncome), color: '#34d399', sub: `${transactions.filter(t => t.type === 'income').length} transactions` },
                { label: 'Total Expenses', val: fmt(totalExpenses), color: '#f87171', sub: `${transactions.filter(t => t.type === 'expense').length} transactions` },
                { label: 'Net Balance', val: fmt(totalIncome - totalExpenses), color: totalIncome >= totalExpenses ? '#34d399' : '#f87171', sub: 'Income minus expenses' },
              ].map(({ label, val, color, sub }) => (
                <div key={label} style={{ ...S.card, padding: 20 }}>
                  <p style={S.label}>{label}</p>
                  <p style={{ color, fontWeight: 900, fontSize: 24, margin: '4px 0 2px', letterSpacing: '-0.03em' }}>{val}</p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Expenses by category */}
            <div style={S.card}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 14, margin: 0 }}>Expenses by Category</p>
              </div>
              {byCat.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No expenses yet</div>
              ) : (
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {byCat.map(cat => {
                    const pct = totalExpenses ? (cat.total / totalExpenses) * 100 : 0;
                    return (
                      <div key={cat.code}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>
                            <span>{cat.emoji}</span>{cat.name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{pct.toFixed(1)}%</span>
                            <span style={{ color: '#f87171', fontWeight: 800, fontSize: 13 }}>{fmt(cat.total)}</span>
                          </div>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: cat.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Monthly breakdown */}
            {transactions.length > 0 && (() => {
              const monthly: Record<string, { income: number; expense: number }> = {};
              transactions.forEach(tx => {
                const month = tx.issuedAt?.slice(0, 7) || tx.createdAt.slice(0, 7);
                if (!monthly[month]) monthly[month] = { income: 0, expense: 0 };
                if (tx.type === 'income') monthly[month].income += tx.total;
                else monthly[month].expense += tx.total;
              });
              const months = Object.entries(monthly).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
              const maxVal = Math.max(...months.flatMap(([, v]) => [v.income, v.expense]));
              return (
                <div style={S.card}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ color: 'white', fontWeight: 800, fontSize: 14, margin: 0 }}>Monthly Overview</p>
                  </div>
                  <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {months.map(([month, vals]) => (
                      <div key={month} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 12, alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }}>{month}</span>
                        <div>
                          <div style={{ height: 8, background: 'rgba(52,211,153,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${maxVal ? (vals.income / maxVal) * 100 : 0}%`, height: '100%', background: '#34d399', borderRadius: 4 }} />
                          </div>
                          <span style={{ color: '#34d399', fontSize: 10, fontWeight: 700 }}>+{fmt(vals.income)}</span>
                        </div>
                        <div>
                          <div style={{ height: 8, background: 'rgba(248,113,113,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${maxVal ? (vals.expense / maxVal) * 100 : 0}%`, height: '100%', background: '#f87171', borderRadius: 4 }} />
                          </div>
                          <span style={{ color: '#f87171', fontSize: 10, fontWeight: 700 }}>-{fmt(vals.expense)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
