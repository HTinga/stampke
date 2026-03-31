import React, { useState, useEffect } from 'react';
import {
  Users, Shield, Briefcase, DollarSign, Settings, Plus, Check,
  X, ChevronDown, Search, RefreshCw, Star, AlertTriangle,
  Crown, Lock, Unlock, Trash2, Edit3, Eye, Mail, Clock,
  TrendingUp, Activity, Award
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  enabled: boolean;
  emailVerified: boolean;
  plan: string;
  trialEndsAt?: string;
  adminPermissions?: string[];
  created: string;
  company?: string;
}

const PLAN_COLORS: Record<string, string> = {
  trial:      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  free:       'bg-gray-500/20 text-gray-400 border-gray-500/30',
  pro:        'bg-blue-500/20 text-blue-400 border-blue-500/30',
  enterprise: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-red-500/20 text-red-400',
  admin:      'bg-orange-500/20 text-orange-400',
  business:   'bg-blue-500/20 text-blue-400',
  worker:     'bg-emerald-500/20 text-emerald-400',
};

const ADMIN_PERMISSIONS = ['users', 'workers', 'jobs', 'invoices', 'clients', 'analytics', 'settings'];

const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
const token  = () => localStorage.getItem('tomo_token') || '';
const apiFetch = (path: string, opts: RequestInit = {}) =>
  fetch(`${apiUrl}/api${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    ...opts,
  }).then(r => r.json());

export default function SuperAdminPanel() {
  const [tab, setTab]           = useState<'users' | 'workers' | 'admins' | 'plans'>('users');
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Create admin form
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', adminPermissions: [] as string[] });
  const [adminSaving, setAdminSaving] = useState(false);

  // Grant plan / approve access
  const [grantingPlan, setGrantingPlan] = useState<string | null>(null);
  const [planValue, setPlanValue] = useState('pro');
  const [approvalMonths, setApprovalMonths] = useState(1); // 1–12 months duration

  const load = async () => {
    setLoading(true);
    const roleFilter = tab === 'workers' ? '?role=worker' : tab === 'admins' ? '?role=admin' : tab === 'plans' ? '?role=business' : '';
    const res = await apiFetch(`/user/list${roleFilter}`);
    if (res.success) setUsers(res.result);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.company?.toLowerCase().includes(q);
  });

  const activate   = async (id: string) => { await apiFetch(`/user/activate/${id}`, { method: 'PATCH' }); load(); };
  const suspend    = async (id: string) => { await apiFetch(`/user/suspend/${id}`, { method: 'PATCH', body: JSON.stringify({}) }); load(); };
  const deleteUser = async (id: string) => { if (!confirm('Delete this user?')) return; await apiFetch(`/user/delete/${id}`, { method: 'DELETE' }); load(); };

  const grantPlan = async (id: string) => {
    // Calculate expiry date from now + approvalMonths
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + approvalMonths);
    await apiFetch(`/user/grant-plan/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ plan: planValue, approvalMonths, approvalExpiresAt: expiresAt.toISOString(), adminApproved: true }),
    });
    setGrantingPlan(null);
    load();
  };

  const createAdmin = async () => {
    setAdminSaving(true);
    const res = await apiFetch('/user/create-admin', { method: 'POST', body: JSON.stringify(adminForm) });
    setAdminSaving(false);
    if (res.success) { setShowCreateAdmin(false); setAdminForm({ name: '', email: '', password: '', adminPermissions: [] }); load(); }
    else alert(res.message);
  };

  const togglePerm = (perm: string) => {
    setAdminForm(f => ({
      ...f,
      adminPermissions: f.adminPermissions.includes(perm)
        ? f.adminPermissions.filter(p => p !== perm)
        : [...f.adminPermissions, perm],
    }));
  };

  const inp = 'w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center">
            <Crown size={18} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">SuperAdmin Panel</h1>
            <p className="text-xs text-[#8b949e]">Full platform control</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateAdmin(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">
            <Plus size={14} /> New Admin
          </button>
          <button onClick={load} className="p-2.5 bg-[#161b22] border border-[#30363d] rounded-xl text-[#8b949e] hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-xl p-1">
        {[
          { id: 'users',   label: 'All Users',    icon: Users },
          { id: 'workers', label: 'Find Errands', icon: Briefcase },
          { id: 'admins',  label: 'Admins',       icon: Shield },
          { id: 'plans',   label: 'Subscriptions',icon: Award },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:text-white'}`}>
            <t.icon size={13} /> <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#161b22] border border-[#30363d] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
      </div>

      {/* User table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#8b949e]">
          <RefreshCw size={20} className="animate-spin mr-2" /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#8b949e] bg-[#161b22] border border-[#30363d] rounded-2xl">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p>No users found</p>
        </div>
      ) : (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
          {filtered.map((u, i) => (
            <div key={u._id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-[#21262d]/40 transition-colors ${i < filtered.length - 1 ? 'border-b border-[#21262d]' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${ROLE_COLORS[u.role]?.split(' ')[0] || 'bg-[#1f6feb]'}`}>
                {u.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${ROLE_COLORS[u.role] || ''}`}>{u.role}</span>
                  {!u.emailVerified && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">unverified</span>}
                  {!u.enabled && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">suspended</span>}
                </div>
                <p className="text-xs text-[#8b949e] truncate">{u.email}{u.company ? ` · ${u.company}` : ''}</p>
                {u.role === 'admin' && u.adminPermissions && u.adminPermissions.length > 0 && (
                  <p className="text-[10px] text-[#58a6ff]">Perms: {u.adminPermissions.join(', ')}</p>
                )}
              </div>

              {/* Plan (business only) */}
              {(tab === 'plans' || tab === 'users') && u.plan && u.role === 'business' && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${PLAN_COLORS[u.plan] || ''}`}>
                  {u.plan}
                  {u.plan === 'trial' && u.trialEndsAt && ` · ${Math.max(0, Math.ceil((new Date(u.trialEndsAt).getTime() - Date.now()) / 86400000))}d left`}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {tab === 'plans' && u.role === 'business' && (
                  grantingPlan === u._id ? (
                    <div className="flex flex-col gap-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 min-w-[220px]">
                      <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">Approve Access</p>
                      <div className="flex gap-1.5">
                        <select value={planValue} onChange={e => setPlanValue(e.target.value)}
                          className="text-xs bg-[#161b22] border border-[#30363d] rounded-lg px-2 py-1 text-white flex-1">
                          {['starter', 'pro', 'business'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select value={approvalMonths} onChange={e => setApprovalMonths(Number(e.target.value))}
                          className="text-xs bg-[#161b22] border border-[#30363d] rounded-lg px-2 py-1 text-white">
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m} mo</option>)}
                        </select>
                      </div>
                      <p className="text-[10px] text-[#8b949e]">
                        Expires: {(() => { const d = new Date(); d.setMonth(d.getMonth() + approvalMonths); return d.toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' }); })()}
                      </p>
                      <div className="flex gap-1">
                        <button onClick={() => grantPlan(u._id)} className="flex-1 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors">Approve</button>
                        <button onClick={() => setGrantingPlan(null)} className="flex-1 py-1 text-xs font-bold bg-[#21262d] text-[#8b949e] hover:text-white rounded-lg transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setGrantingPlan(u._id)} title="Approve Access"
                      className="p-1.5 text-[#8b949e] hover:text-[#58a6ff] transition-colors">
                      <Award size={13} />
                    </button>
                  )
                )}
                {u.enabled ? (
                  <button onClick={() => suspend(u._id)} title="Suspend"
                    className="p-1.5 text-[#8b949e] hover:text-red-400 transition-colors"><Lock size={13} /></button>
                ) : (
                  <button onClick={() => activate(u._id)} title="Activate"
                    className="p-1.5 text-[#8b949e] hover:text-emerald-400 transition-colors"><Unlock size={13} /></button>
                )}
                <button onClick={() => deleteUser(u._id)} title="Delete"
                  className="p-1.5 text-[#8b949e] hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-[#0d1117]/90 z-[700] flex items-center justify-center p-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2"><Shield size={16} className="text-orange-400" /> Create Sub-Admin</h3>
              <button onClick={() => setShowCreateAdmin(false)} className="p-1 text-[#8b949e] hover:text-white"><X size={16} /></button>
            </div>
            <input className={inp} placeholder="Full Name" value={adminForm.name} onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))} />
            <input className={inp} placeholder="Email address" type="email" value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))} />
            <input className={inp} placeholder="Password (min 6 chars)" type="password" value={adminForm.password} onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-2">Permissions</p>
              <div className="grid grid-cols-2 gap-2">
                {ADMIN_PERMISSIONS.map(perm => (
                  <label key={perm} className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => togglePerm(perm)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${adminForm.adminPermissions.includes(perm) ? 'bg-[#1f6feb] border-[#1f6feb]' : 'border-[#30363d]'}`}>
                      {adminForm.adminPermissions.includes(perm) && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-xs text-[#e6edf3] capitalize">{perm}</span>
                  </label>
                ))}
              </div>
            </div>
            <button onClick={createAdmin} disabled={adminSaving || !adminForm.name || !adminForm.email || !adminForm.password}
              className="w-full py-3 bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors">
              {adminSaving ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
