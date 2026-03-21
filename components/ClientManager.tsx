import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Phone, Mail, MapPin, Building2, Tag,
  Edit3, Trash2, X, Check, ChevronRight, Filter, Star,
  Globe, MessageSquare, Instagram, Facebook, ExternalLink,
  TrendingUp, Clock, AlertCircle, User, Save, ArrowLeft,
  MoreVertical, RefreshCw, FileText
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ClientStatus = 'lead' | 'active' | 'inactive';
type ClientSource = 'direct' | 'referral' | 'whatsapp' | 'facebook' | 'instagram' | 'website' | 'other';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  country: string;
  city: string;
  notes: string;
  source: ClientSource;
  status: ClientStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  invoiceCount?: number;
  totalBilled?: number;
}

// ─── Local store (localStorage) ──────────────────────────────────────────────
const STORE_KEY = 'tomo_clients_v1';
const loadClients = (): Client[] => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
  catch { return []; }
};
const saveClients = (clients: Client[]) =>
  localStorage.setItem(STORE_KEY, JSON.stringify(clients));

// ─── Constants ────────────────────────────────────────────────────────────────
const SOURCE_LABELS: Record<ClientSource, string> = {
  direct: 'Direct', referral: 'Referral', whatsapp: 'WhatsApp',
  facebook: 'Facebook', instagram: 'Instagram', website: 'Website', other: 'Other',
};
const SOURCE_ICONS: Record<ClientSource, React.ComponentType<any>> = {
  direct: User, referral: Users, whatsapp: MessageSquare,
  facebook: Facebook, instagram: Instagram, website: Globe, other: Tag,
};
const STATUS_STYLES: Record<ClientStatus, string> = {
  lead:     'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  active:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  inactive: 'bg-[#21262d] text-[#8b949e] border-[#30363d]',
};

// ─── Client Form ──────────────────────────────────────────────────────────────
const BlankClient = (): Omit<Client, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: '', email: '', phone: '', company: '', address: '',
  country: 'Kenya', city: '', notes: '', source: 'direct', status: 'active', tags: [],
});

interface ClientFormProps {
  initial?: Client;
  onSave: (c: Client) => void;
  onCancel: () => void;
}
const ClientForm: React.FC<ClientFormProps> = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>(
    initial ? { name: initial.name, email: initial.email, phone: initial.phone, company: initial.company, address: initial.address, country: initial.country, city: initial.city, notes: initial.notes, source: initial.source, status: initial.status, tags: initial.tags }
    : BlankClient()
  );
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const upd = (u: Partial<typeof form>) => setForm(f => ({ ...f, ...u }));
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) { upd({ tags: [...form.tags, t] }); setTagInput(''); }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const now = new Date().toISOString();
    onSave({
      ...form,
      id: initial?.id || Math.random().toString(36).slice(2, 10),
      createdAt: initial?.createdAt || now,
      updatedAt: now,
    });
  };

  const inputCls = (err?: string) =>
    `w-full bg-[#0d1117] border ${err ? 'border-red-500' : 'border-[#30363d]'} rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]`;

  const F: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancel} className="p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white">{initial ? 'Edit Client' : 'Add Client'}</h2>
          <p className="text-xs text-[#8b949e]">{initial ? 'Update client information' : 'Add a new client to your CRM'}</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Basic info */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#58a6ff]">Contact Info</p>
          <F label="Full Name *" error={errors.name}>
            <input value={form.name} onChange={e => upd({ name: e.target.value })} placeholder="e.g. John Kamau" className={inputCls(errors.name)} />
          </F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Phone">
              <input value={form.phone} onChange={e => upd({ phone: e.target.value })} placeholder="0712 345 678" type="tel" className={inputCls()} />
            </F>
            <F label="Email">
              <input value={form.email} onChange={e => upd({ email: e.target.value })} placeholder="client@example.com" type="email" className={inputCls()} />
            </F>
          </div>
          <F label="Company / Organisation">
            <input value={form.company} onChange={e => upd({ company: e.target.value })} placeholder="Company name (optional)" className={inputCls()} />
          </F>
        </div>

        {/* Location */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#58a6ff]">Location</p>
          <div className="grid grid-cols-2 gap-4">
            <F label="City">
              <input value={form.city} onChange={e => upd({ city: e.target.value })} placeholder="Nairobi" className={inputCls()} />
            </F>
            <F label="Country">
              <input value={form.country} onChange={e => upd({ country: e.target.value })} placeholder="Kenya" className={inputCls()} />
            </F>
          </div>
          <F label="Address">
            <input value={form.address} onChange={e => upd({ address: e.target.value })} placeholder="Street address" className={inputCls()} />
          </F>
        </div>

        {/* CRM fields */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#58a6ff]">CRM Details</p>
          <div className="grid grid-cols-2 gap-4">
            <F label="Status">
              <select value={form.status} onChange={e => upd({ status: e.target.value as ClientStatus })} className={inputCls()}>
                <option value="lead">Lead</option>
                <option value="active">Active Client</option>
                <option value="inactive">Inactive</option>
              </select>
            </F>
            <F label="Source">
              <select value={form.source} onChange={e => upd({ source: e.target.value as ClientSource })} className={inputCls()}>
                {(Object.entries(SOURCE_LABELS) as [ClientSource, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </F>
          </div>

          <F label="Tags">
            <div className="flex gap-2 mb-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag and press Enter" className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
              <button onClick={addTag} className="px-4 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">Add</button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map(t => (
                  <span key={t} className="flex items-center gap-1.5 bg-[#21262d] text-[#e6edf3] text-xs px-3 py-1 rounded-xl">
                    {t}
                    <button onClick={() => upd({ tags: form.tags.filter(x => x !== t) })} className="text-[#8b949e] hover:text-red-400 transition-colors"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </F>

          <F label="Notes">
            <textarea value={form.notes} onChange={e => upd({ notes: e.target.value })} rows={3}
              placeholder="Any notes about this client..." className={`${inputCls()} resize-none`} />
          </F>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-xl text-sm font-semibold transition-colors">Cancel</button>
          <button onClick={submit} className="flex-2 flex-1 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
            <Save size={15} /> {initial ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Client Detail Panel ──────────────────────────────────────────────────────
const ClientDetail: React.FC<{ client: Client; onEdit: () => void; onDelete: () => void; onClose: () => void }> = ({ client, onEdit, onDelete, onClose }) => {
  const SourceIcon = SOURCE_ICONS[client.source] || Tag;
  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between p-6 border-b border-[#30363d]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#1f6feb] rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {client.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">{client.name}</h2>
              {client.company && <p className="text-sm text-[#58a6ff]">{client.company}</p>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[client.status]}`}>{client.status}</span>
                <span className="flex items-center gap-1 text-[10px] text-[#8b949e]"><SourceIcon size={10} />{SOURCE_LABELS[client.source]}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#21262d] rounded-xl"><X size={18} className="text-[#8b949e]" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Contact details */}
          <div className="grid grid-cols-2 gap-3">
            {client.phone && (
              <a href={`tel:${client.phone}`} className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 hover:border-[#58a6ff] transition-colors">
                <Phone size={14} className="text-[#58a6ff] flex-shrink-0" />
                <div className="min-w-0"><p className="text-[10px] text-[#8b949e]">Phone</p><p className="text-sm text-white font-medium truncate">{client.phone}</p></div>
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 hover:border-[#58a6ff] transition-colors">
                <Mail size={14} className="text-[#58a6ff] flex-shrink-0" />
                <div className="min-w-0"><p className="text-[10px] text-[#8b949e]">Email</p><p className="text-sm text-white font-medium truncate">{client.email}</p></div>
              </a>
            )}
          </div>

          {/* Location */}
          {(client.city || client.country || client.address) && (
            <div className="flex items-start gap-2 bg-[#0d1117] border border-[#30363d] rounded-xl p-3">
              <MapPin size={14} className="text-[#8b949e] flex-shrink-0 mt-0.5" />
              <div><p className="text-sm text-white">{[client.address, client.city, client.country].filter(Boolean).join(', ')}</p></div>
            </div>
          )}

          {/* Tags */}
          {client.tags.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {client.tags.map(t => <span key={t} className="text-xs bg-[#21262d] text-[#e6edf3] px-3 py-1 rounded-xl">{t}</span>)}
              </div>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-2">Notes</p>
              <p className="text-sm text-[#e6edf3] leading-relaxed">{client.notes}</p>
            </div>
          )}

          <p className="text-[10px] text-[#8b949e]">Added {new Date(client.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="p-5 border-t border-[#30363d] flex gap-3">
          <button onClick={onEdit} className="flex-1 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"><Edit3 size={14} /> Edit</button>
          <button onClick={() => { if (confirm(`Remove ${client.name}?`)) onDelete(); }} className="py-2.5 px-4 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 rounded-xl text-sm font-bold transition-colors"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );
};

// ─── Main ClientManager ────────────────────────────────────────────────────────
interface ClientManagerProps { initialView?: 'all' | 'add'; }

export default function ClientManager({ initialView = 'all' }: ClientManagerProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [view, setView] = useState<'list' | 'form' | 'detail'>(initialView === 'add' ? 'form' : 'list');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ClientStatus | ''>('');
  const [filterSource, setFilterSource] = useState<ClientSource | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  // Load from localStorage
  useEffect(() => { setClients(loadClients()); }, []);

  const persist = (c: Client[]) => { setClients(c); saveClients(c); };

  const saveClient = (c: Client) => {
    const idx = clients.findIndex(x => x.id === c.id);
    const updated = idx >= 0 ? clients.map(x => x.id === c.id ? c : x) : [c, ...clients];
    persist(updated);
    setView('list');
    setEditingClient(null);
  };

  const deleteClient = (id: string) => {
    persist(clients.filter(c => c.id !== id));
    setSelectedClient(null);
  };

  const filtered = clients.filter(c => {
    const matchSearch = !search || [c.name, c.email, c.phone, c.company].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = !filterStatus || c.status === filterStatus;
    const matchSource = !filterSource || c.source === filterSource;
    return matchSearch && matchStatus && matchSource;
  });

  const stats = {
    total:    clients.length,
    active:   clients.filter(c => c.status === 'active').length,
    leads:    clients.filter(c => c.status === 'lead').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
  };

  // ── Form view ──────────────────────────────────────────────────────────────
  if (view === 'form') {
    return (
      <ClientForm
        initial={editingClient || undefined}
        onSave={saveClient}
        onCancel={() => { setView('list'); setEditingClient(null); }}
      />
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Clients</h1>
          <p className="text-sm text-[#8b949e]">{stats.total} client{stats.total !== 1 ? 's' : ''} · {stats.active} active · {stats.leads} leads</p>
        </div>
        <button onClick={() => { setEditingClient(null); setView('form'); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">
          <Plus size={15} /> Add Client
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-[#161b22] border-[#30363d]', onClick: () => setFilterStatus('') },
          { label: 'Active', value: stats.active, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', onClick: () => setFilterStatus('active') },
          { label: 'Leads', value: stats.leads, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', onClick: () => setFilterStatus('lead') },
          { label: 'Inactive', value: stats.inactive, color: 'text-[#8b949e]', bg: 'bg-[#161b22] border-[#30363d]', onClick: () => setFilterStatus('inactive') },
        ].map(s => (
          <button key={s.label} onClick={s.onClick} className={`${s.bg} border rounded-2xl p-4 text-left hover:scale-[1.02] transition-all`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#8b949e] mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2.5">
            <Search size={15} className="text-[#8b949e]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone..."
              className="flex-1 bg-transparent text-white text-sm placeholder:text-[#8b949e] focus:outline-none" />
            {search && <button onClick={() => setSearch('')} className="text-[#8b949e] hover:text-white"><X size={13} /></button>}
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${showFilters || filterStatus || filterSource ? 'bg-[#1f6feb] text-white border-[#1f6feb]' : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-white'}`}>
            <Filter size={15} /> Filter
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-3 flex-wrap">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ClientStatus | '')}
              className="bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb]">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="lead">Lead</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value as ClientSource | '')}
              className="bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb]">
              <option value="">All Sources</option>
              {(Object.entries(SOURCE_LABELS) as [ClientSource, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {(filterStatus || filterSource) && (
              <button onClick={() => { setFilterStatus(''); setFilterSource(''); }} className="px-3 py-2 text-[#8b949e] hover:text-white text-sm transition-colors flex items-center gap-1"><RefreshCw size={13} /> Clear</button>
            )}
          </div>
        )}
      </div>

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#161b22] border border-[#30363d] rounded-2xl">
          <Users size={40} className="text-[#30363d] mx-auto mb-4" />
          <h3 className="font-bold text-white mb-2">{clients.length === 0 ? 'No clients yet' : 'No results'}</h3>
          <p className="text-sm text-[#8b949e] mb-6">{clients.length === 0 ? 'Add your first client to start managing your relationships.' : 'Try a different search or clear filters.'}</p>
          {clients.length === 0 && (
            <button onClick={() => setView('form')} className="px-5 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">Add First Client</button>
          )}
        </div>
      ) : (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_160px_120px_100px_80px] gap-4 px-5 py-3 border-b border-[#21262d] bg-[#0d1117]">
            {['Client', 'Contact', 'Source', 'Status', ''].map(h => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">{h}</span>
            ))}
          </div>
          {filtered.map((client, i) => {
            const SourceIcon = SOURCE_ICONS[client.source] || Tag;
            return (
              <div key={client.id}
                className={`flex sm:grid sm:grid-cols-[1fr_160px_120px_100px_80px] gap-4 items-center px-5 py-4 hover:bg-[#21262d]/50 transition-colors cursor-pointer ${i < filtered.length - 1 ? 'border-b border-[#21262d]' : ''}`}
                onClick={() => setSelectedClient(client)}>
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-[#1f6feb] rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{client.name}</p>
                    {client.company && <p className="text-xs text-[#8b949e] truncate">{client.company}</p>}
                  </div>
                </div>
                {/* Contact */}
                <div className="hidden sm:block min-w-0">
                  {client.phone && <p className="text-xs text-[#e6edf3] truncate flex items-center gap-1"><Phone size={10} className="text-[#8b949e] flex-shrink-0" />{client.phone}</p>}
                  {client.email && <p className="text-xs text-[#8b949e] truncate">{client.email}</p>}
                </div>
                {/* Source */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#8b949e]">
                  <SourceIcon size={12} />
                  {SOURCE_LABELS[client.source]}
                </div>
                {/* Status */}
                <div className="hidden sm:block">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-xl border capitalize ${STATUS_STYLES[client.status]}`}>{client.status}</span>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 ml-auto sm:ml-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setEditingClient(client); setView('form'); }} className="p-1.5 hover:bg-[#30363d] text-[#8b949e] hover:text-white rounded-lg transition-colors"><Edit3 size={13} /></button>
                  <button onClick={() => { if (confirm(`Remove ${client.name}?`)) deleteClient(client.id); }} className="p-1.5 hover:bg-red-900/30 text-[#8b949e] hover:text-red-400 rounded-lg transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedClient && (
        <ClientDetail
          client={selectedClient}
          onEdit={() => { setEditingClient(selectedClient); setSelectedClient(null); setView('form'); }}
          onDelete={() => { deleteClient(selectedClient.id); setView('list'); }}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}
