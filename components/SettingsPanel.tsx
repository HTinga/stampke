import React, { useState } from 'react';
import {
  User, Building2, Mail, Phone, Globe, Save, Camera,
  Shield, Bell, Moon, Sun, LogOut, Key, Check,
  ChevronRight, AlertTriangle, Palette, Eye, EyeOff,
  Smartphone, Lock, Zap, Package
} from 'lucide-react';
import { useAppStats } from '../src/appStatsStore';

interface SettingsProps {
  view: 'settings-profile' | 'settings-business';
  user: { name: string; email: string; role?: string } | null;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onLogout: () => void;
}

export default function SettingsPanel({ view, user, theme, onThemeToggle, onLogout }: SettingsProps) {
  const stats = useAppStats();

  // Profile form state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    avatar: '',
  });
  const [business, setBusiness] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: 'Nairobi',
    country: 'Kenya',
    website: '',
    taxPin: '',
    currency: 'KES',
  });
  const [saved, setSaved] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  // Load from localStorage
  React.useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('tomo_profile') || '{}');
      if (p.name) setProfile(prev => ({ ...prev, ...p }));
      const b = JSON.parse(localStorage.getItem('tomo_business') || '{}');
      if (b.name) setBusiness(prev => ({ ...prev, ...b }));
    } catch {}
  }, []);

  const saveProfile = async () => {
    // Save to API first, localStorage as backup
    const token = localStorage.getItem('tomo_token');
    const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
    if (token) {
      try {
        await fetch(`${apiUrl}/api/user/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: profile.name, phone: profile.phone, photo: profile.avatar }),
        });
      } catch { /* fallback to localStorage */ }
    }
    localStorage.setItem('tomo_profile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  const saveBusiness = () => {
    localStorage.setItem('tomo_business', JSON.stringify(business));
    // Also store business name for invoice pre-fill
    localStorage.setItem('tomo_business_name', business.name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls = 'w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]';
  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] block mb-1.5">{label}</label>
      {children}
    </div>
  );

  const roleColor = user?.role === 'admin' ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : user?.role === 'worker' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    : 'bg-blue-500/20 text-blue-400 border-blue-500/30';

  // ── PROFILE ───────────────────────────────────────────────────────────────
  if (view === 'settings-profile') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-xl font-bold text-white">Your Profile</h1>
          <p className="text-sm text-[#8b949e]">Manage your account information and preferences</p>
        </div>

        {/* Account card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-[#1f6feb] rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {profile.name.charAt(0) || user?.name?.charAt(0) || 'U'}
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#161b22] border border-[#30363d] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#21262d] transition-colors">
                <Camera size={11} className="text-[#8b949e]" />
                <input type="file" accept="image/*" className="sr-only" />
              </label>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-white">{profile.name || user?.name || 'User'}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${roleColor}`}>{user?.role || 'recruiter'}</span>
              </div>
              <p className="text-sm text-[#8b949e] flex items-center gap-1.5 mt-1">
                <Mail size={12} />
                {showEmail ? user?.email : '••••••@•••••.com'}
                <button onClick={() => setShowEmail(v => !v)} className="text-[#8b949e] hover:text-white">
                  {showEmail ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <F label="Full Name">
              <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Your full name" />
            </F>
            <F label="Phone Number">
              <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="0712 345 678" type="tel" />
            </F>
          </div>
        </div>

        {/* Usage stats */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-4">Your Usage</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Stamps Created', value: stats.stampsCreated },
              { label: 'Documents Signed', value: stats.documentsSigned },
              { label: 'PDFs Edited', value: stats.pdfEdits },
              { label: 'AI Scans', value: stats.aiScans },
            ].map(s => (
              <div key={s.label} className="bg-[#0d1117] rounded-xl p-3 border border-[#30363d]">
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-xs text-[#8b949e]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-2">Preferences</p>
          <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-xl border border-[#30363d]">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={16} className="text-[#58a6ff]" /> : <Sun size={16} className="text-yellow-400" />}
              <div>
                <p className="text-sm font-semibold text-white">Appearance</p>
                <p className="text-xs text-[#8b949e]">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
              </div>
            </div>
            <button onClick={onThemeToggle}
              className={`w-11 h-6 rounded-full transition-all ${theme === 'dark' ? 'bg-[#1f6feb]' : 'bg-[#30363d]'}`}>
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${theme === 'dark' ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={saveProfile}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">
            {saved ? <Check size={15} /> : <Save size={15} />}
            {saved ? 'Saved!' : 'Save Profile'}
          </button>
          <button onClick={onLogout}
            className="flex items-center gap-2 px-5 py-3 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-sm font-semibold transition-colors">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // ── BUSINESS INFO ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-white">Business Info</h1>
        <p className="text-sm text-[#8b949e]">Used on invoices, stamps, and documents</p>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#58a6ff]">Company Details</p>
        <F label="Business Name">
          <input value={business.name} onChange={e => setBusiness(b => ({ ...b, name: e.target.value }))} className={inputCls} placeholder="My Business Ltd" />
        </F>
        <div className="grid grid-cols-2 gap-4">
          <F label="Business Email">
            <input value={business.email} onChange={e => setBusiness(b => ({ ...b, email: e.target.value }))} className={inputCls} placeholder="billing@mybusiness.ke" type="email" />
          </F>
          <F label="Phone">
            <input value={business.phone} onChange={e => setBusiness(b => ({ ...b, phone: e.target.value }))} className={inputCls} placeholder="0712 345 678" type="tel" />
          </F>
        </div>
        <F label="Website">
          <input value={business.website} onChange={e => setBusiness(b => ({ ...b, website: e.target.value }))} className={inputCls} placeholder="https://mybusiness.ke" type="url" />
        </F>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#58a6ff]">Address & Billing</p>
        <F label="Physical Address">
          <input value={business.address} onChange={e => setBusiness(b => ({ ...b, address: e.target.value }))} className={inputCls} placeholder="123 Business Street" />
        </F>
        <div className="grid grid-cols-2 gap-4">
          <F label="City">
            <input value={business.city} onChange={e => setBusiness(b => ({ ...b, city: e.target.value }))} className={inputCls} placeholder="Nairobi" />
          </F>
          <F label="Country">
            <input value={business.country} onChange={e => setBusiness(b => ({ ...b, country: e.target.value }))} className={inputCls} placeholder="Kenya" />
          </F>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <F label="KRA PIN / Tax Number">
            <input value={business.taxPin} onChange={e => setBusiness(b => ({ ...b, taxPin: e.target.value }))} className={inputCls} placeholder="P000111222A" />
          </F>
          <F label="Default Currency">
            <select value={business.currency} onChange={e => setBusiness(b => ({ ...b, currency: e.target.value }))} className={inputCls}>
              {['KES', 'USD', 'EUR', 'GBP', 'UGX', 'TZS'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </F>
        </div>
      </div>

      <button onClick={saveBusiness}
        className="w-full flex items-center justify-center gap-2 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">
        {saved ? <Check size={15} /> : <Save size={15} />}
        {saved ? 'Saved!' : 'Save Business Info'}
      </button>
    </div>
  );
}
