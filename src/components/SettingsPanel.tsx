import React, { useState, useRef, useEffect } from 'react';
import {
  User, Building2, Mail, Phone, Globe, Save, Camera,
  Shield, Bell, Moon, Sun, LogOut, Check,
  Eye, EyeOff, Upload, Plus, Trash2, Key, Users, Copy,
  CreditCard, Calendar, Activity, AlertTriangle
} from 'lucide-react';
import { useAppStats } from '../appStatsStore';

interface SettingsProps {
  view: 'settings-profile' | 'settings-business';
  user: { name: string; email: string; role?: string; plan?: string; emailVerified?: boolean } | null;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onLogout: () => void;
}

const API = (import.meta as any).env?.VITE_API_URL || '';

export default function SettingsPanel({ view, user, theme, onThemeToggle, onLogout }: SettingsProps) {
  const stats = useAppStats();
  const logoRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState(() => {
    try { return { ...{ name:'', phone:'', avatar:'' }, ...JSON.parse(localStorage.getItem('tomo_profile')||'{}') }; } catch { return { name:'', phone:'', avatar:'' }; }
  });
  const [business, setBusiness] = useState(() => {
    try { return { ...{ name:'', email:'', phone:'', address:'', city:'Nairobi', country:'Kenya', website:'', taxPin:'', currency:'KES', logo:'', sendingEmail:'' }, ...JSON.parse(localStorage.getItem('tomo_business')||'{}') }; } catch { return { name:'', email:'', phone:'', address:'', city:'Nairobi', country:'Kenya', website:'', taxPin:'', currency:'KES', logo:'', sendingEmail:'' }; }
  });
  const [teamMembers, setTeamMembers] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('tomo_team')||'[]'); } catch { return []; }
  });
  const [profileTab, setProfileTab] = useState<'account' | 'billing'>('account');
  const [payments, setPayments]     = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newMember, setNewMember] = useState({ name:'', email:'', role:'viewer', department:'accounts' });
  const [saved, setSaved] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  // Billing tab: fetch when tab becomes active
  useEffect(() => {
    if (profileTab !== 'billing') return;
    setBillingLoading(true);
    const tk = localStorage.getItem('tomo_token');
    const headers: any = { Authorization: `Bearer ${tk}` };
    Promise.all([
      fetch(`${API}/api/payment/my-payments`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`${API}/api/notification/mine`,   { headers }).then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([p, n]) => {
      if (p.success) setPayments(p.result || []);
      if (n.success) setNotifications(n.result || []);
      setBillingLoading(false);
    });
  }, [profileTab]);

  const DEPARTMENTS = ['Accounts','Finance','HR','Marketing','Legal','Operations','IT','Sales','Management','Other'];
  const TEAM_ROLES  = [{ id:'admin', label:'Admin', desc:'Full access to all features' },{ id:'accounts', label:'Accounts', desc:'Invoicing & payments only' },{ id:'viewer', label:'Viewer', desc:'Read-only access' }];

  const inputCls = 'w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]';
  const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-[#8b949e] block mb-1.5';
  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label className={labelCls}>{label}</label>{children}</div>
  );

  const saveProfile = async () => {
    setSaving(true);
    const token = localStorage.getItem('tomo_token');
    if (token) {
      try {
        await fetch(`${API}/api/user/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: profile.name, phone: profile.phone, photo: profile.avatar }),
        });
      } catch { /* fallback */ }
    }
    localStorage.setItem('tomo_profile', JSON.stringify(profile));
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const saveBusiness = () => {
    localStorage.setItem('tomo_business', JSON.stringify(business));
    localStorage.setItem('tomo_business_name', business.name);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const addTeamMember = () => {
    if (!newMember.name || !newMember.email) return;
    const updated = [...teamMembers, { ...newMember, id: Date.now().toString(), addedAt: new Date().toISOString(), status: 'invited' }];
    setTeamMembers(updated);
    localStorage.setItem('tomo_team', JSON.stringify(updated));
    setNewMember({ name:'', email:'', role:'viewer', department:'accounts' });
    setShowAddTeam(false);
    setInviteSent(true); setTimeout(() => setInviteSent(false), 3000);
  };

  const removeTeamMember = (id: string) => {
    const updated = teamMembers.filter(m => m.id !== id);
    setTeamMembers(updated);
    localStorage.setItem('tomo_team', JSON.stringify(updated));
  };

  const toBase64 = (file: File): Promise<string> => new Promise((res) => {
    const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file);
  });

  const roleColor = user?.role === 'superadmin' ? 'bg-red-500/20 text-red-400' :
                    user?.role === 'admin'       ? 'bg-orange-500/20 text-orange-400' :
                    user?.role === 'worker'      ? 'bg-purple-500/20 text-purple-400' :
                                                   'bg-blue-500/20 text-blue-400';

  // ── PROFILE ────────────────────────────────────────────────────────────────
  if (view === 'settings-profile') return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-white">Your Profile</h1>
        <p className="text-sm text-[#8b949e]">Manage your account details and subscription</p>
      </div>

      {/* Profile / Billing tabs */}
      <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-xl p-1">
        {[{ id: 'account', label: 'Account', icon: User }, { id: 'billing', label: 'Billing & Status', icon: CreditCard }].map(t => (
          <button key={t.id} onClick={() => setProfileTab(t.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              profileTab === t.id ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:text-white'
            }`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>
      {/* Account tab */}
      {profileTab === 'account' && (<>
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-[#1f6feb] flex items-center justify-center text-white text-2xl font-black overflow-hidden">
              {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="" /> : (profile.name||user?.name||'U').charAt(0).toUpperCase()}
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#161b22] border border-[#30363d] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#21262d] transition-colors">
              <Camera size={11} className="text-[#8b949e]" />
              <input ref={avatarRef} type="file" accept="image/*" className="sr-only" onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return;
                const data = await toBase64(f);
                setProfile(p => ({ ...p, avatar: data }));
              }} />
            </label>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-white">{profile.name || user?.name || 'User'}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${roleColor}`}>{user?.role || 'business'}</span>
              {user?.plan && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 capitalize">{user.plan}</span>}
            </div>
            <p className="text-sm text-[#8b949e] flex items-center gap-1.5 mt-1">
              <Mail size={12} />
              {showEmail ? user?.email : `${user?.email?.slice(0,3)}•••@•••.com`}
              <button onClick={() => setShowEmail(v => !v)} className="text-[#8b949e] hover:text-white transition-colors">
                {showEmail ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </p>
            {user?.emailVerified === false && (
              <span className="text-[10px] text-yellow-400 flex items-center gap-1 mt-1">⚠ Email not verified</span>
            )}
          </div>
        </div>

        <F label="Full Name">
          <input value={profile.name} onChange={e => setProfile(p => ({...p, name:e.target.value}))} className={inputCls} placeholder="Your full name" />
        </F>
        <F label="Phone Number">
          <input value={profile.phone} onChange={e => setProfile(p => ({...p, phone:e.target.value}))} className={inputCls} placeholder="0712 345 678" type="tel" />
        </F>
      </div>

      {/* Usage stats */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
        <p className={labelCls}>Your Activity</p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {[
            { label: 'Stamps Created', value: stats.stampsCreated },
            { label: 'Docs Signed',    value: stats.documentsSigned },
            { label: 'PDFs Edited',    value: stats.pdfEdits },
            { label: 'AI Scans',       value: stats.aiScans },
          ].map(s => (
            <div key={s.label} className="bg-[#0d1117] rounded-xl p-3 border border-[#30363d]">
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-xs text-[#8b949e]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={16} className="text-[#58a6ff]" /> : <Sun size={16} className="text-yellow-400" />}
            <div>
              <p className="text-sm font-semibold text-white">Appearance</p>
              <p className="text-xs text-[#8b949e]">{theme === 'dark' ? 'Dark mode active' : 'Light mode active'}</p>
            </div>
          </div>
          <button onClick={onThemeToggle} className={`w-11 h-6 rounded-full transition-all ${theme === 'dark' ? 'bg-[#1f6feb]' : 'bg-[#30363d]'}`}>
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${theme === 'dark' ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={saveProfile} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <Check size={15} /> : <Save size={15} />}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Profile'}
        </button>
        <button onClick={onLogout} className="flex items-center gap-2 px-5 py-3 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-sm font-semibold transition-colors">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
      </>
      )}

      {/* ── Billing & Status Tab ─── */}
      {profileTab === 'billing' && (
        <div className="space-y-5">

          {/* Current plan card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-3">Current Plan</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1f6feb]/15 rounded-xl flex items-center justify-center">
                <Shield size={18} className="text-[#58a6ff]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white capitalize">{user?.plan || 'No active plan'}</p>
                <p className="text-xs text-[#8b949e]">{user?.role || 'business'} account</p>
              </div>
              {user?.plan && (
                <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${
                  user.plan === 'pro' || user.plan === 'professional' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  user.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                  user.plan === 'terminated' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                }`}>{user.plan}</span>
              )}
            </div>
          </div>

          {/* Notifications from admin */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-3">Account Notifications</p>
            {billingLoading ? (
              <div className="text-center py-6 text-[#8b949e] text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6">
                <Bell size={24} className="mx-auto mb-2 text-[#30363d]" />
                <p className="text-sm text-[#8b949e]">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n: any, i: number) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                    n.message?.includes('terminated') ? 'bg-red-500/5 border-red-500/20' :
                    n.message?.includes('activated') || n.message?.includes('updated') ? 'bg-emerald-500/5 border-emerald-500/20' :
                    'bg-[#0d1117] border-[#30363d]'
                  }`}>
                    <Activity size={14} className="text-[#58a6ff] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-[#c9d1d9] leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-[#8b949e] mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString('en-KE') : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment history */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-3">Payment History</p>
            {billingLoading ? (
              <div className="text-center py-6 text-[#8b949e] text-sm">Loading...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-6">
                <CreditCard size={24} className="mx-auto mb-2 text-[#30363d]" />
                <p className="text-sm text-[#8b949e]">No payment records found</p>
                <p className="text-xs text-[#8b949e] mt-1">Payments will appear here once processed</p>
              </div>
            ) : (
              <div className="divide-y divide-[#21262d]">
                {payments.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      p.status === 'completed' ? 'bg-emerald-500/15' : 'bg-yellow-500/15'
                    }`}>
                      <CreditCard size={14} className={p.status === 'completed' ? 'text-emerald-400' : 'text-yellow-400'} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white capitalize">{p.plan || p.description || 'Subscription'}</p>
                      <p className="text-xs text-[#8b949e]">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' }) : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">KES {(p.amount || 0).toLocaleString()}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>{p.status || 'pending'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ── BUSINESS INFO ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-white">Business Settings</h1>
        <p className="text-sm text-[#8b949e]">Company details, logo, sending email & team members</p>
      </div>

      {/* Logo + brand */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-5">
        <p className={labelCls + ' text-[#58a6ff]'}>Brand & Identity</p>
        <div className="flex items-center gap-4">
          <div onClick={() => logoRef.current?.click()}
            className="w-20 h-20 rounded-2xl bg-[#0d1117] border-2 border-dashed border-[#30363d] hover:border-[#1f6feb] flex items-center justify-center cursor-pointer overflow-hidden transition-colors">
            {business.logo
              ? <img src={business.logo} className="w-full h-full object-cover" alt="logo" />
              : <Upload size={20} className="text-[#8b949e]" />}
          </div>
          <div>
            <p className="text-sm font-bold text-white mb-1">Company Logo</p>
            <p className="text-xs text-[#8b949e]">PNG or JPG · Shown on invoices, stamps and documents</p>
            <button onClick={() => logoRef.current?.click()} className="mt-2 text-xs text-[#58a6ff] hover:text-white transition-colors">Upload logo</button>
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={async e => {
            const f = e.target.files?.[0]; if (!f) return;
            const data = await toBase64(f);
            setBusiness(b => ({ ...b, logo: data }));
          }} />
        </div>
        <F label="Business Name">
          <input value={business.name} onChange={e => setBusiness(b => ({...b, name:e.target.value}))} className={inputCls} placeholder="My Business Ltd" />
        </F>
      </div>

      {/* Contact info */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
        <p className={labelCls + ' text-[#58a6ff]'}>Contact Details</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Business Email">
            <input value={business.email} onChange={e => setBusiness(b => ({...b, email:e.target.value}))} className={inputCls} placeholder="billing@mybusiness.ke" type="email" />
          </F>
          <F label="Phone">
            <input value={business.phone} onChange={e => setBusiness(b => ({...b, phone:e.target.value}))} className={inputCls} placeholder="0712 345 678" type="tel" />
          </F>
        </div>
        <F label="Sending Email (for document notifications)">
          <div className="relative">
            <input value={business.sendingEmail} onChange={e => setBusiness(b => ({...b, sendingEmail:e.target.value}))} className={inputCls + ' pl-9'} placeholder="invoices@mybusiness.ke" type="email" />
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          </div>
          <p className="text-xs text-[#8b949e] mt-1">Emails like invoices and reminders will appear to come from this address</p>
        </F>
        <F label="Website">
          <input value={business.website} onChange={e => setBusiness(b => ({...b, website:e.target.value}))} className={inputCls} placeholder="https://mybusiness.ke" type="url" />
        </F>
      </div>

      {/* Address & billing */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
        <p className={labelCls + ' text-[#58a6ff]'}>Address & Billing</p>
        <F label="Physical Address">
          <input value={business.address} onChange={e => setBusiness(b => ({...b, address:e.target.value}))} className={inputCls} placeholder="123 Business Street, Nairobi" />
        </F>
        <div className="grid grid-cols-2 gap-4">
          <F label="City"><input value={business.city} onChange={e => setBusiness(b => ({...b, city:e.target.value}))} className={inputCls} placeholder="Nairobi" /></F>
          <F label="Country"><input value={business.country} onChange={e => setBusiness(b => ({...b, country:e.target.value}))} className={inputCls} placeholder="Kenya" /></F>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <F label="KRA PIN / Tax Number">
            <input value={business.taxPin} onChange={e => setBusiness(b => ({...b, taxPin:e.target.value}))} className={inputCls} placeholder="P000111222A" />
          </F>
          <F label="Default Currency">
            <select value={business.currency} onChange={e => setBusiness(b => ({...b, currency:e.target.value}))} className={inputCls}>
              {['KES','USD','EUR','GBP','UGX','TZS','ZAR'].map(c => <option key={c}>{c}</option>)}
            </select>
          </F>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={labelCls + ' text-[#58a6ff]'}>Team Members</p>
            <p className="text-xs text-[#8b949e] mt-1">Give colleagues access to specific features</p>
          </div>
          <button onClick={() => setShowAddTeam(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-xs font-bold transition-colors">
            <Plus size={13} /> Add Member
          </button>
        </div>

        {/* Add member form */}
        {showAddTeam && (
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-white">Invite Team Member</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Full Name</label><input value={newMember.name} onChange={e => setNewMember(m => ({...m, name:e.target.value}))} className={inputCls} placeholder="Jane Kamau" /></div>
              <div><label className={labelCls}>Email</label><input value={newMember.email} onChange={e => setNewMember(m => ({...m, email:e.target.value}))} className={inputCls} placeholder="jane@company.ke" type="email" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Department</label>
                <select value={newMember.department} onChange={e => setNewMember(m => ({...m, department:e.target.value}))} className={inputCls}>
                  {DEPARTMENTS.map(d => <option key={d} value={d.toLowerCase()}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Access Level</label>
                <select value={newMember.role} onChange={e => setNewMember(m => ({...m, role:e.target.value}))} className={inputCls}>
                  {TEAM_ROLES.map(r => <option key={r.id} value={r.id}>{r.label} — {r.desc}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addTeamMember} className="flex-1 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">
                Send Invite
              </button>
              <button onClick={() => setShowAddTeam(false)} className="px-4 py-2.5 border border-[#30363d] text-[#8b949e] hover:text-white rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {inviteSent && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">
            <Check size={14} /> Invitation sent!
          </div>
        )}

        {teamMembers.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-[#30363d] rounded-xl">
            <Users size={24} className="mx-auto mb-2 text-[#30363d]" />
            <p className="text-sm text-[#8b949e]">No team members yet</p>
            <p className="text-xs text-[#8b949e] mt-1">Add your HR, accounts or marketing team</p>
          </div>
        ) : (
          <div className="space-y-2">
            {teamMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-[#0d1117] border border-[#30363d] rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-[#1f6feb]/20 flex items-center justify-center text-[#58a6ff] text-xs font-black flex-shrink-0">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{m.name}</p>
                  <p className="text-xs text-[#8b949e] truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] px-2 py-0.5 bg-[#21262d] text-[#8b949e] rounded-full capitalize">{m.department}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full capitalize">{m.role}</span>
                  <button onClick={() => removeTeamMember(m.id)} className="p-1 text-[#8b949e] hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={saveBusiness}
        className="w-full flex items-center justify-center gap-2 py-4 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-2xl text-sm font-black transition-colors">
        {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Business Settings</>}
      </button>
    </div>
  );
}
