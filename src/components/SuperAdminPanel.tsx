import React, { useState, useEffect } from 'react';
import {
  Users, Shield, Briefcase, DollarSign, Plus, Check,
  X, Search, RefreshCw, ChevronDown, ChevronUp,
  Crown, Lock, Unlock, Trash2, Award, Bell,
  Calendar, AlertTriangle, CreditCard, Activity
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
  approvalExpiresAt?: string;
  adminPermissions?: string[];
  created: string;
  company?: string;
}

const PLAN_COLORS: Record<string, string> = {
  trial:        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  starter:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  professional: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  enterprise:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
  terminated:   'bg-red-500/20 text-red-400 border-red-500/30',
  free:         'bg-gray-500/20 text-gray-400 border-gray-500/30',
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

/** Send a notification to the user */
async function sendNotification(userId: string, message: string) {
  try {
    await apiFetch('/notification/send', {
      method: 'POST',
      body: JSON.stringify({ userId, type: 'account_update', message }),
    });
  } catch { /* non-blocking */ }
}

function daysLeft(iso?: string) {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SuperAdminPanel() {
  const [tab, setTab]           = useState<'users' | 'workers' | 'admins' | 'plans'>('users');
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create admin form
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', adminPermissions: [] as string[] });
  const [adminSaving, setAdminSaving] = useState(false);

  // Per-user action state (stored by userId)
  const [actionPlan, setActionPlan]   = useState<Record<string, string>>({});
  const [customDays, setCustomDays]   = useState<Record<string, string>>({});
  const [actionMsg, setActionMsg]     = useState<string>('');

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

  const notify = (userId: string, msg: string) => sendNotification(userId, msg);

  const activate = async (u: User) => {
    await apiFetch(`/user/activate/${u._id}`, { method: 'PATCH' });
    await notify(u._id, `✅ Your StampKE account has been activated. Welcome back!`);
    setActionMsg('Account activated'); load();
  };

  const suspend = async (u: User) => {
    await apiFetch(`/user/suspend/${u._id}`, { method: 'PATCH', body: JSON.stringify({}) });
    await notify(u._id, `⚠️ Your StampKE account has been suspended. Contact support for more information.`);
    setActionMsg('Account suspended'); load();
  };

  const terminate = async (u: User) => {
    if (!confirm(`Terminate ${u.name}'s account? This sets their plan to terminated and disables access.`)) return;
    await apiFetch(`/user/grant-plan/${u._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ plan: 'terminated', adminApproved: false, enabled: false }),
    });
    await notify(u._id, `🚫 Your StampKE account has been terminated. Contact support@stampke.co.ke if you believe this is a mistake.`);
    setActionMsg('Account terminated'); load();
  };

  const deleteUser = async (u: User) => {
    if (!confirm(`Permanently delete ${u.name}? This cannot be undone.`)) return;
    await apiFetch(`/user/delete/${u._id}`, { method: 'DELETE' });
    setActionMsg('User deleted'); load();
  };

  const grantPlan = async (u: User, plan: string, months: number) => {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);
    await apiFetch(`/user/grant-plan/${u._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ plan, approvalMonths: months, approvalExpiresAt: expiresAt.toISOString(), adminApproved: true, enabled: true }),
    });
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    await notify(u._id, `🎉 Your StampKE plan has been updated to ${planLabel}. Valid until ${fmt(expiresAt.toISOString())}. Enjoy your subscription!`);
    setActionMsg(`Plan set to ${planLabel}`); load();
  };

  const adjustDays = async (u: User, days: number) => {
    const base = u.approvalExpiresAt ? new Date(u.approvalExpiresAt) : new Date();
    const newDate = new Date(base.getTime() + days * 86400000);
    await apiFetch(`/user/grant-plan/${u._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalExpiresAt: newDate.toISOString(), adminApproved: true }),
    });
    const verb = days > 0 ? 'extended' : 'adjusted';
    await notify(u._id, `📅 Your StampKE subscription has been ${verb} by ${Math.abs(days)} days. New expiry: ${fmt(newDate.toISOString())}.`);
    setActionMsg(`Expiry ${verb} by ${Math.abs(days)}d`); load();
  };

  const applyCustomDays = async (u: User) => {
    const d = parseInt(customDays[u._id] || '0', 10);
    if (!d) return;
    await adjustDays(u, d);
    setCustomDays(prev => ({ ...prev, [u._id]: '' }));
  };

  const createAdmin = async () => {
    setAdminSaving(true);
    const res = await apiFetch('/user/create-admin', { method: 'POST', body: JSON.stringify(adminForm) });
    setAdminSaving(false);
    if (res.success) {
      setShowCreateAdmin(false);
      setAdminForm({ name: '', email: '', password: '', adminPermissions: [] });
      load();
    } else alert(res.message);
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

      {/* Flash message */}
      {actionMsg && (
        <div className="fixed top-20 right-6 z-[999] flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl animate-in slide-in-from-top-2"
          onAnimationEnd={() => setTimeout(() => setActionMsg(''), 2500)}>
          <Check size={14} /> {actionMsg}
        </div>
      )}

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
          { id: 'users',   label: 'All Users',     icon: Users },
          { id: 'workers', label: 'Find Errands',   icon: Briefcase },
          { id: 'admins',  label: 'Admins',         icon: Shield },
          { id: 'plans',   label: 'Subscriptions',  icon: Award },
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

      {/* User list */}
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
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden divide-y divide-[#21262d]">
          {filtered.map(u => {
            const isExpanded = expandedId === u._id;
            const plan = actionPlan[u._id] || u.plan || 'trial';
            const expiry = u.approvalExpiresAt || u.trialEndsAt;
            const dl = daysLeft(expiry);

            return (
              <div key={u._id}>
                {/* Compact row */}
                <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#21262d]/40 transition-colors">
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${ROLE_COLORS[u.role]?.split(' ')[0] || 'bg-[#1f6feb]/20'}`}>
                    {u.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${ROLE_COLORS[u.role] || ''}`}>{u.role}</span>
                      {!u.enabled && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">suspended</span>}
                    </div>
                    <p className="text-xs text-[#8b949e] truncate">{u.email}{u.company ? ` · ${u.company}` : ''}</p>
                  </div>

                  {/* Plan badge */}
                  {u.plan && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize hidden sm:block ${PLAN_COLORS[u.plan] || ''}`}>
                      {u.plan}{dl !== null ? ` · ${dl}d` : ''}
                    </span>
                  )}

                  {/* Quick actions */}
                  <div className="flex items-center gap-1">
                    {u.enabled ? (
                      <button onClick={() => suspend(u)} title="Suspend"
                        className="p-1.5 text-[#8b949e] hover:text-yellow-400 transition-colors"><Lock size={13} /></button>
                    ) : (
                      <button onClick={() => activate(u)} title="Activate"
                        className="p-1.5 text-[#8b949e] hover:text-emerald-400 transition-colors"><Unlock size={13} /></button>
                    )}
                    <button onClick={() => setExpandedId(isExpanded ? null : u._id)}
                      className="p-1.5 text-[#8b949e] hover:text-[#58a6ff] transition-colors">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="bg-[#0d1117] border-t border-[#30363d] px-5 py-4 space-y-4">

                    {/* Plan + months */}
                    <div>
                      <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-2">Set Plan</p>
                      <div className="flex flex-wrap gap-2">
                        {['trial','starter','professional','enterprise'].map(p => (
                          <button key={p} onClick={() => setActionPlan(prev => ({ ...prev, [u._id]: p }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${
                              plan === p
                                ? 'bg-[#1f6feb] border-[#1f6feb] text-white'
                                : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white'
                            }`}>
                            {p}
                          </button>
                        ))}
                        {[1, 3, 6, 12].map(mo => (
                          <button key={mo} onClick={() => grantPlan(u, plan, mo)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                            Approve {mo}mo
                          </button>
                        ))}
                      </div>
                      {expiry && (
                        <p className="text-xs text-[#8b949e] mt-1.5">Current expiry: <span className="text-white font-semibold">{fmt(expiry)}</span></p>
                      )}
                    </div>

                    {/* Adjust days */}
                    <div>
                      <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-2">Adjust Days</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        {[7, 30, 90].map(d => (
                          <button key={d} onClick={() => adjustDays(u, d)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#1f6feb]/30 bg-[#1f6feb]/10 text-[#58a6ff] hover:bg-[#1f6feb]/20 transition-all">
                            +{d}d
                          </button>
                        ))}
                        {[-7, -30].map(d => (
                          <button key={d} onClick={() => adjustDays(u, d)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                            {d}d
                          </button>
                        ))}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="Custom ±days"
                            value={customDays[u._id] || ''}
                            onChange={e => setCustomDays(prev => ({ ...prev, [u._id]: e.target.value }))}
                            className="w-28 bg-[#161b22] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#1f6feb] placeholder:text-[#8b949e]"
                          />
                          <button onClick={() => applyCustomDays(u)}
                            className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-xs font-bold text-[#8b949e] hover:text-white transition-colors">
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Danger zone */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[#30363d]">
                      <button onClick={() => terminate(u)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-all">
                        <AlertTriangle size={12} /> Terminate Account
                      </button>
                      <button onClick={() => deleteUser(u)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-red-400 hover:border-red-500/30 rounded-lg text-xs font-bold transition-all">
                        <Trash2 size={12} /> Delete User
                      </button>
                      <button onClick={() => { notify(u._id, '📣 You have a new notification from StampKE admin. Please check your account.'); setActionMsg('Notification sent'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f6feb]/10 border border-[#1f6feb]/20 text-[#58a6ff] hover:bg-[#1f6feb]/20 rounded-lg text-xs font-bold transition-all ml-auto">
                        <Bell size={12} /> Send Notification
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
