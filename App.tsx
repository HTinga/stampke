import StampKELogo from './components/StampKELogo';
import React, { useState, useRef, useEffect } from 'react';
import {
  Home, Users, DollarSign, FileText, Briefcase, BarChart2, Settings,
  Plus, X, Menu, ChevronRight, ChevronDown, Search, Bell, LogOut, User,
  PenTool, CheckCircle2, Camera, Wrench, QrCode, Share2,
  ArrowRight, ShieldCheck, Receipt, FileType, FileIcon, Layers, BookOpen,
  Image as ImageIcon, Save, Sparkles, Sun, Moon, Twitter, Linkedin, Github,
  LayoutDashboard
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { StampConfig, StampTemplate, StampShape } from './types';
import { DEFAULT_CONFIG } from './constants';
import SVGPreview from './components/SVGPreview';
import TemplateLibrary from './components/TemplateLibrary';
import EditorControls from './components/EditorControls';
import TohoSignCenter from './components/esign/DocuSealSignCenter';
import PDFTools from './components/PDFTools';
import StampApplier from './components/StampApplier';
import EmployeeQRTracker from './components/hr/EmployeeQRTracker';
import SocialHub from './components/SocialHub';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import SmartInvoice from './components/SmartInvoice';
import DocumentsHub from './components/DocumentsHub';
import EmployeeTracking from './components/EmployeeTracking';
import WorkHub from './components/WorkHub';
import ClientManager from './components/ClientManager';
import AdminPanel from './components/AdminPanel';
import ActivityLog from './components/ActivityLog';
import SettingsPanel from './components/SettingsPanel';
import WorkerPortal from './components/WorkerPortal';
import WorkerApp from './components/WorkerApp';
import JobsLandingPage from './components/JobsLandingPage';
import TrialBanner from './components/TrialBanner';
import SuperAdminPanel from './components/SuperAdminPanel';
import PricingPage from './components/PricingPage';
import { analyzeStampImage } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { useStampStore } from './src/store';
import { useAppStats } from './src/appStatsStore';
// ─── Navigation Model (business-owner language) ──────────────────────────────
type MainSection = 'home' | 'sign-docs' | 'invoicing' | 'documents' | 'recruit' | 'clients' | 'settings';
type SubView =
  | 'dashboard'
  | 'clients-all' | 'clients-add' | 'clients-leads'
  | 'money-invoices' | 'money-payments' | 'money-unpaid' | 'money-create' | 'money-upgrade'
  | 'invoicing-invoices' | 'invoicing-payments' | 'invoicing-unpaid' | 'invoicing-create' | 'invoicing-upgrade'
  | 'sign-esign' | 'sign-stamps' | 'sign-applier' | 'sign-templates' | 'sign-ai-scan' | 'sign-upgrade'
  | 'recruit-find' | 'recruit-workers' | 'recruit-active' | 'recruit-completed' | 'recruit-tracking' | 'recruit-upgrade'
  | 'clients-upgrade'
  | 'documents-upgrade'
  | 'documents-create' | 'documents-templates' | 'documents-esign' | 'documents-stamps' | 'documents-pdf' | 'documents-stamp-applier' | 'documents-ai-scan' | 'documents-presentation'
  | 'work-find' | 'work-my-workers' | 'work-active' | 'work-completed' | 'work-tracking'
  | 'activity-all' | 'activity-notifications'
  | 'settings-profile' | 'settings-business'
  | 'admin-panel' | 'worker-portal'
  | 'landing';

// Kept for compatibility with child components that use old tab names
type LegacyTab = 'stamp-studio' | 'esign' | 'dashboard' | 'pdf-forge' | 'convert' | 'apply-stamp' | 'templates' | 'qr-tracker' | 'social-hub' | 'landing' | 'smart-invoice';


// Demo accounts removed — real authentication only

// Admin nav item injected below based on role
const NAV_ITEMS: { id: MainSection; label: string; icon: React.ComponentType<any>; emoji: string }[] = [
  { id: 'home',      label: 'Home',             icon: Home,       emoji: '🏠' },
  { id: 'sign-docs', label: 'eSign & Stamps',   icon: PenTool,    emoji: '✍️' },
  { id: 'invoicing', label: 'Smart Invoice',    icon: Receipt,    emoji: '💰' },
  { id: 'documents', label: 'Docs & PDF',       icon: FileText,   emoji: '📄' },
  { id: 'recruit',   label: 'Recruit & Track',  icon: Briefcase,  emoji: '👷' },
  { id: 'clients',   label: 'Get Clients',      icon: Users,      emoji: '👥' },
  { id: 'settings',  label: 'Settings',         icon: Settings,   emoji: '⚙️' },
];

const SUB_MENUS: Record<MainSection, { id: SubView; label: string; desc?: string; locked?: boolean }[]> = {
  home: [],
  'sign-docs': [
    { id: 'sign-esign',     label: '✍️ eSign',           desc: 'Collect legally binding signatures' },
    { id: 'sign-stamps',    label: '🖋 Stamp Designer',   desc: 'Design digital stamps' },
    { id: 'sign-applier',   label: '📄 Apply Stamp',      desc: 'Stamp a PDF document' },
    { id: 'sign-templates', label: '📂 Templates',        desc: 'Stamp & document templates', locked: true },
    { id: 'sign-ai-scan',   label: '🤖 AI Scan Stamp',    desc: 'Digitize a rubber stamp with AI', locked: true },
    { id: 'sign-upgrade',   label: '⚡ Upgrade',          desc: 'Unlock all eSign features' },
  ],
  invoicing: [
    { id: 'invoicing-invoices', label: '🧾 Invoices',       desc: 'All invoices' },
    { id: 'invoicing-create',   label: '➕ New Invoice',    desc: 'Create & send invoice' },
    { id: 'invoicing-payments', label: '💳 Payments',       desc: 'Payment history', locked: true },
    { id: 'invoicing-unpaid',   label: '⏳ Unpaid',         desc: 'Outstanding balances', locked: true },
    { id: 'invoicing-upgrade',  label: '⚡ Upgrade',        desc: 'Unlock full invoicing suite' },
  ],
  documents: [
    { id: 'documents-create',       label: '📝 New Document',   desc: 'Contract, letter, form', locked: true },
    { id: 'documents-pdf',          label: '📑 PDF Editor',     desc: 'Edit & fill PDF files', locked: true },
    { id: 'documents-presentation', label: '🎨 Presentations',  desc: 'Slides & pitch decks', locked: true },
    { id: 'documents-upgrade',      label: '⚡ Upgrade',        desc: 'Unlock all document tools' },
  ],
  recruit: [
    { id: 'recruit-find',      label: '🔍 Find Workers',   desc: 'Search vetted workers' },
    { id: 'recruit-workers',   label: '👥 My Team',        desc: 'Workers you hired' },
    { id: 'recruit-active',    label: '⚡ Active Errands',  desc: 'In-progress work', locked: true },
    { id: 'recruit-completed', label: '✅ Completed',       desc: 'Done tasks & history', locked: true },
    { id: 'recruit-tracking',  label: '📍 GPS Tracking',   desc: 'Live attendance & check-in', locked: true },
    { id: 'recruit-upgrade',   label: '⚡ Upgrade',         desc: 'Unlock full workforce tools' },
  ],
  clients: [
    { id: 'clients-all',     label: '👤 All Clients',     desc: 'View & manage clients', locked: true },
    { id: 'clients-add',     label: '➕ Add Client',       desc: 'Add a new client' },
    { id: 'clients-leads',   label: '📊 Lead Tracking',   desc: 'WhatsApp, Facebook, Instagram', locked: true },
    { id: 'clients-upgrade', label: '⚡ Upgrade',          desc: 'Unlock full CRM suite' },
  ],
  settings: [
    { id: 'settings-profile',  label: 'My Profile',       desc: 'Account details' },
    { id: 'settings-business', label: 'Business Info',    desc: 'Company & billing details' },
    { id: 'money-upgrade',     label: '⚡ Plans & Billing',desc: 'Upgrade your plan' },
    { id: 'admin-panel',       label: '🛡 Admin Panel',   desc: 'Platform management' },
    { id: 'worker-portal',     label: '👷 Worker Portal', desc: 'Find Errands profile' },
  ],
};

// ─── Create Quick-Action items ────────────────────────────────────────────────
const CREATE_ACTIONS = [
  { label: 'Sign Document',    sub: 'sign-esign' as SubView,       section: 'sign-docs' as MainSection,  emoji: '✍️' },
  { label: 'Design Stamp',     sub: 'sign-stamps' as SubView,      section: 'sign-docs' as MainSection,  emoji: '🖋️' },
  { label: 'Create Invoice',   sub: 'invoicing-create' as SubView, section: 'invoicing' as MainSection,  emoji: '🧾' },
  { label: 'Add Client',       sub: 'clients-add' as SubView,      section: 'clients' as MainSection,    emoji: '👥' },
  { label: 'Find Worker',      sub: 'recruit-find' as SubView,     section: 'recruit' as MainSection,    emoji: '👷' },
];

// ─── Placeholder view for unbuilt sections ────────────────────────────────────
const ComingSoon: React.FC<{ title: string; desc: string; emoji?: string }> = ({ title, desc, emoji = '🚧' }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <div className="text-5xl mb-4">{emoji}</div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-sm text-[#8b949e] max-w-xs">{desc}</p>
  </div>
);

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<MainSection>('home');
  const [activeView, setActiveView] = useState<SubView>('landing');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const { config: stampConfig, setConfig: setStampConfig } = useStampStore();
  const appStats = useAppStats();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpRole, setSignUpRole] = useState<'business' | 'worker'>('business');
  const [user, setUser] = useState<{ name: string; email: string; role?: string; plan?: string; trialActive?: boolean; trialDaysLeft?: number; adminPermissions?: string[]; emailVerified?: boolean } | null>(null);
  const userRole = user?.role || 'business';
  // Landing page type: 'main' = business tools, 'jobs' = worker portal
  const [landingType, setLandingType] = useState<'main' | 'jobs'>('main');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pendingStampFieldId, setPendingStampFieldId] = useState<string | null>(null);
  const [openedFromSignCenter, setOpenedFromSignCenter] = useState(false);
  const [openedFromPDFEditor, setOpenedFromPDFEditor] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<StampTemplate[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDark = theme === 'dark';

  // ── Compat nav helper for child components that use old tab names ─────────
  const navLegacy = (tab: LegacyTab | string) => {
    const map: Record<string, { section: MainSection; view: SubView }> = {
      'dashboard':    { section: 'home',      view: 'dashboard' },
      'stamp-studio': { section: 'sign-docs', view: 'sign-stamps' },
      'esign':        { section: 'sign-docs', view: 'sign-esign' },
      'apply-stamp':  { section: 'sign-docs', view: 'sign-applier' },
      'convert':      { section: 'sign-docs', view: 'sign-ai-scan' },
      'pdf-forge':    { section: 'documents', view: 'documents-pdf' },
      'templates':    { section: 'sign-docs', view: 'sign-templates' },
      'smart-invoice':{ section: 'invoicing', view: 'invoicing-invoices' },
      'qr-tracker':   { section: 'recruit',   view: 'recruit-workers' },
      'social-hub':   { section: 'clients',   view: 'clients-leads' },
      'landing':      { section: 'home',      view: 'landing' },
      'admin':        { section: 'settings',  view: 'admin-panel' },
      'worker-portal':{ section: 'settings',  view: 'worker-portal' },
    };
    const target = map[tab];
    if (target) { setActiveSection(target.section); setActiveView(target.view); }
  };

  const goTo = (section: MainSection, view?: SubView) => {
    setActiveSection(section);
    if (view) setActiveView(view);
    else if (section === 'home') setActiveView('dashboard');
    else if (SUB_MENUS[section].length > 0) setActiveView(SUB_MENUS[section][0].id);
    setIsSidebarOpen(false);
    setShowCreate(false);
  };

  // Handle Stripe redirect back to app
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const plan = params.get('plan') || 'pro';
      window.history.replaceState({}, '', window.location.pathname);
      if (isLoggedIn) {
        setUser(u => u ? { ...u, plan, trialActive: false, trialDaysLeft: 0 } : u);
        alert(`🎉 Payment successful! Your ${plan} plan is now active. Welcome to StampKE Pro!`);
      }
    }
    if (params.get('payment') === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isLoggedIn]);

  // Handle Stripe redirect back with ?payment=success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const plan = params.get('plan') || 'pro';
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh user data from API to get updated plan
      const token = localStorage.getItem('tomo_token');
      if (token) {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
        fetch(`${apiUrl}/api/user/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => {
            if (d.success && d.result) {
              const u = d.result;
              setUser(prev => prev ? { ...prev, plan: u.plan, trialActive: u.trialActive, trialDaysLeft: u.trialDaysLeft } : prev);
            }
          }).catch(() => {});
        setTimeout(() => alert(`🎉 Payment successful! Your ${plan} plan is now active.`), 500);
      }
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('custom_stamp_templates');
    if (saved) { try { setCustomTemplates(JSON.parse(saved)); } catch {} }
  }, []);

  // Handle Google OAuth redirect response (?google_auth= or ?auth_error= or ?verified=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleAuth = params.get('google_auth');
    const authError  = params.get('auth_error');
    const verified   = params.get('verified');

    if (verified === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      // Update user state if logged in
      setUser(u => u ? { ...u, emailVerified: true } : u);
      setShowLoginModal(false);
      // Show a subtle success — don't alert, just show modal with message
      setLoginError('');
      setIsSignUp(false);
      setTimeout(() => {
        const token = localStorage.getItem('tomo_token');
        if (!token) { setShowLoginModal(true); }
      }, 100);
      return;
    }

    if (authError) {
      window.history.replaceState({}, '', window.location.pathname);
      setLoginError(decodeURIComponent(authError));
      setShowLoginModal(true);
      return;
    }

    if (googleAuth) {
      window.history.replaceState({}, '', window.location.pathname);
      try {
        const u = JSON.parse(decodeURIComponent(googleAuth));
        localStorage.setItem('tomo_token', u.token);
        setUser({ name: u.name, email: u.email, role: u.role, plan: u.plan, trialActive: u.trialActive, trialDaysLeft: u.trialDaysLeft, adminPermissions: u.adminPermissions || [] });
        setIsLoggedIn(true);
        setShowLoginModal(false);
        if (u.role === 'superadmin' || u.role === 'admin') goTo('settings', 'admin-panel');
        else if (u.role === 'worker') goTo('settings', 'worker-portal');
        else goTo('home');
      } catch (e) {
        setLoginError('Google sign-in failed. Please try email login.');
        setShowLoginModal(true);
      }
      return;
    }
  }, []);

  // Restore session on reload — keep user on current view, never redirect to landing
  useEffect(() => {
    const token = localStorage.getItem('tomo_token');
    if (!token) return;
    const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
    fetch(`${apiUrl}/api/user/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.result) {
          const u = d.result;
          setUser({ name: u.name, email: u.email, role: u.role, plan: u.plan,
            trialActive: u.trialActive, trialDaysLeft: u.trialDaysLeft,
            adminPermissions: u.adminPermissions, emailVerified: u.emailVerified });
          setIsLoggedIn(true);
          // Only route if currently on landing page — otherwise keep current view
          setActiveView(v => {
            if (v !== 'landing') return v;
            if (u.role === 'superadmin' || u.role === 'admin') { setActiveSection('settings'); return 'admin-panel'; }
            if (u.role === 'worker') { setActiveSection('settings'); return 'worker-portal'; }
            setActiveSection('home'); return 'dashboard';
          });
        } else {
          localStorage.removeItem('tomo_token');
        }
      })
      .catch(() => localStorage.removeItem('tomo_token'));
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
    const handleOAuth = (e: MessageEvent) => {
      if (e.data?.type === 'OAUTH_AUTH_SUCCESS') { setUser(e.data.user); setIsLoggedIn(true); }
    };
    window.addEventListener('message', handleOAuth);
    return () => window.removeEventListener('message', handleOAuth);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSaveTemplate = () => {
    if (!isLoggedIn) return;
    const t: StampTemplate = { id: `custom-${Date.now()}`, name: `Custom ${stampConfig.primaryText || 'Stamp'}`, category: 'Custom', ...stampConfig };
    const updated = [...customTemplates, t];
    setCustomTemplates(updated);
    localStorage.setItem('custom_stamp_templates', JSON.stringify(updated));
    alert('Template saved!');
  };

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const apiUrl = import.meta.env.VITE_API_URL || '';

    // SIGN UP flow
    if (isSignUp) {
      if (!signUpName.trim()) { setLoginError('Please enter your full name.'); return; }
      try {
        const role = landingType === 'jobs' ? 'worker' : signUpRole;
        const res = await fetch(`${apiUrl}/api/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: signUpName, email: loginEmail, password: loginPassword, role }),
        });
        const data = await res.json();
        if (data.success) {
          // Auto-login after signup
          const loginRes = await fetch(`${apiUrl}/api/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: loginEmail, password: loginPassword }),
          });
          const loginData = await loginRes.json();
          if (loginData.success && loginData.result) {
            const u = loginData.result;
            localStorage.setItem('tomo_token', u.token);
            setUser({ name: u.name, email: u.email, role: u.role, plan: u.plan,
              trialActive: u.trialActive, trialDaysLeft: u.trialDaysLeft,
              adminPermissions: u.adminPermissions });
            setIsLoggedIn(true); setShowLoginModal(false); setLoginError('');
            // Business signup → directly to Find Workers; workers → their portal
            if (u.role === 'worker') goTo('settings', 'worker-portal');
            else if (signUpRole === 'business') goTo('recruit', 'recruit-find');
            else goTo('home');
            return;
          }
          // Fallback if auto-login fails
          setShowLoginModal(false);
          setLoginError('');
          alert('✅ Account created! Check your email for a verification link, then sign in.');
          setIsSignUp(false);
          return;
        }
        setLoginError(data.message || 'Registration failed.');
        return;
      } catch { setLoginError('Network error. Please try again.'); return; }
    }

    // SIGN IN flow
    if (loginEmail && loginPassword) {
      try {
        const res = await fetch(`${apiUrl}/api/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        });
        const data = await res.json();
        if (data.success && data.result) {
          const u = data.result;
          localStorage.setItem('tomo_token', u.token);
          setUser({ name: u.name, email: u.email, role: u.role, plan: u.plan, trialActive: u.trialActive, trialDaysLeft: u.trialDaysLeft, adminPermissions: u.adminPermissions });
          setIsLoggedIn(true); setShowLoginModal(false); setLoginError('');
          if (u.role === 'superadmin' || u.role === 'admin') goTo('settings', 'admin-panel');
          else if (u.role === 'worker') goTo('settings', 'worker-portal');
          else goTo('home');
          return;
        }
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          setLoginError('Please verify your email first. Check your inbox for the verification link.');
          return;
        }
        if (data.code === 'DISABLED') {
          setLoginError('Your account has been disabled. Contact support.');
          return;
        }
        setLoginError(data.message || 'Login failed.');
        return;
      } catch { /* fall through to local */ }
    }
    setLoginError('Login failed. Please check your credentials.');
  };

  const handleLogout = () => { setUser(null); setIsLoggedIn(false); setActiveView('landing'); };

  const handleTemplateSelect = (template: StampTemplate) => {
    setStampConfig({ ...DEFAULT_CONFIG, shape: template.shape, primaryText: template.primaryText, secondaryText: template.secondaryText || '', innerTopText: template.innerTopText || '', innerBottomText: template.innerBottomText || '', centerText: template.centerText || '', centerSubText: template.centerSubText || '', borderColor: template.borderColor, secondaryColor: template.secondaryColor || template.borderColor, fontFamily: template.fontFamily, showSignatureLine: template.showSignatureLine || false, showDateLine: template.showDateLine || false, showStars: template.showStars || false, showInnerLine: template.showInnerLine || false, innerLineOffset: template.innerLineOffset || 15, wetInk: template.wetInk || false, logoUrl: null });
    appStats.recordTemplateUsed(template.name);
    goTo('sign-docs', 'sign-stamps');
  };

  const downloadStamp = async (format: 'svg' | 'png' | 'pdf') => {
    if (!svgRef.current) return;
    const name = `stamp_${stampConfig.primaryText.toLowerCase().replace(/\s+/g, '_')}`;
    if (format === 'svg') {
      const data = new XMLSerializer().serializeToString(svgRef.current);
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([data], { type: 'image/svg+xml' })), download: `${name}.svg` });
      a.click();
    } else {
      const data = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas'); canvas.width = 2000; canvas.height = 2000;
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      const url = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml' }));
      img.onload = () => {
        if (format === 'pdf') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 2000, 2000); }
        ctx.drawImage(img, 0, 0, 2000, 2000);
        if (format === 'png') { Object.assign(document.createElement('a'), { href: canvas.toDataURL('image/png'), download: `${name}.png` }).click(); }
        else { const pdf = new jsPDF({ unit: 'px', format: [2000, 2000] }); pdf.addImage(canvas.toDataURL('image/jpeg', 1), 'JPEG', 0, 0, 2000, 2000); pdf.save(`${name}.pdf`); }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
    appStats.recordStampDownloaded();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    goTo('sign-docs', 'sign-ai-scan');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const analysis = await analyzeStampImage(reader.result as string);
      if (analysis) {
        setStampConfig(prev => ({ ...prev, shape: analysis.shape === 'OVAL' ? StampShape.OVAL : analysis.shape === 'ROUND' ? StampShape.ROUND : StampShape.RECTANGLE, primaryText: analysis.primaryText || prev.primaryText, secondaryText: analysis.secondaryText || '', centerText: analysis.centerText || '', borderColor: analysis.color || prev.borderColor }));
        appStats.recordAiScan(); goTo('sign-docs', 'sign-stamps');
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Role-based feature gate ─────────────────────────────────────────────────
  const canAccess = (feature: string): boolean => {
    if (userRole === 'superadmin') return true;
    if (userRole === 'admin') {
      const perms = user?.adminPermissions || [];
      if (['clients-all','clients-add','clients-leads'].includes(feature)) return perms.includes('clients');
      if (['money-invoices','money-payments','money-unpaid','money-create'].includes(feature)) return perms.includes('invoices');
      if (['work-find','work-my-workers','work-active','work-completed'].includes(feature)) return perms.includes('jobs');
      return true;
    }
    if (userRole === 'worker') return ['worker-portal','recruit-find'].includes(feature);
    // Free forever: eSign (1 free) + Stamp Designer + Apply Stamp
    const alwaysFree = ['sign-esign','sign-stamps','sign-applier','documents-esign','documents-stamps','documents-stamp-applier'];
    if (alwaysFree.includes(feature)) return true;
    // Paid plan or active trial for everything else
    const paid = user?.plan === 'pro' || user?.plan === 'enterprise' || user?.trialActive === true;
    return paid;
  };

  // ── Locked feature placeholder ──────────────────────────────────────────────
  const renderLocked = (feature: string) => (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-5">
      <div className="w-16 h-16 bg-[#161b22] border border-[#30363d] rounded-2xl flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-2">Premium Feature</h3>
        <p className="text-sm text-[#8b949e] max-w-sm">{feature} requires a paid plan. Your 7-day free trial covers eSign & Stamps only.</p>
        <button onClick={() => goTo('invoicing', 'invoicing-upgrade')} className="mt-3 px-5 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">View Plans & Upgrade</button>
      </div>
    </div>
  );

  // ── Auth Modal ──────────────────────────────────────────────────────────────
  const renderAuthModal = () => (
    <div className="fixed inset-0 bg-[#0d1117]/90 backdrop-blur-3xl z-[600] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
        className="bg-[#161b22] w-full max-w-md rounded-3xl shadow-2xl border border-[#30363d] p-8 space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#1f6feb] rounded-2xl flex items-center justify-center text-white mx-auto mb-4"><ShieldCheck size={24} /></div>
          <h3 className="text-2xl font-black text-white mb-1">{isSignUp ? (landingType === 'jobs' ? 'Find Work on StampKE' : 'Join StampKE') : 'Welcome Back'}</h3>
          <p className="text-[#8b949e] text-sm">{isSignUp ? (landingType === 'jobs' ? 'Create your free worker profile.' : 'Start your 7-day free trial.') : 'Sign in to your account.'}</p>
        </div>

        {/* Role selector — sign up, main landing only */}
        {isSignUp && landingType !== 'jobs' && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'business', label: '🏢 Business', desc: 'Tools & invoicing' },
              { value: 'worker',   label: '👷 Find Errands', desc: 'Find work & gigs' },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => setSignUpRole(opt.value as 'business' | 'worker')}
                className={`p-3 rounded-xl border text-left transition-all ${signUpRole === opt.value ? 'border-[#1f6feb] bg-[#1f6feb]/10' : 'border-[#30363d] hover:border-[#58a6ff]'}`}>
                <p className="text-sm font-bold text-white">{opt.label}</p>
                <p className="text-[10px] text-[#8b949e]">{opt.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Google Sign-In — standard OAuth redirect, works in all browsers */}
        <button type="button" onClick={() => {
          const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
          if (!clientId) {
            setLoginError('Google Sign-In not configured yet. Please use email login below.');
            return;
          }
          setLoginError('');
          // Standard Google OAuth2 redirect — works in all browsers, no popup blocking
          const params = new URLSearchParams({
            client_id:     clientId,
            redirect_uri:  window.location.origin + '/api/auth/google/callback',
            response_type: 'code',
            scope:         'openid email profile',
            access_type:   'offline',
            prompt:        'select_account',
            state:         JSON.stringify({ landingType, signUpRole }),
          });
          window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
        }} className="w-full flex items-center justify-center gap-3 py-3 bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] text-white rounded-xl text-sm font-semibold transition-colors">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3"><div className="flex-1 h-px bg-[#30363d]"/><span className="text-[10px] text-[#8b949e] uppercase tracking-widest">or with email</span><div className="flex-1 h-px bg-[#30363d]"/></div>

        <form onSubmit={handleDemoLogin} className="space-y-3">
          {isSignUp && (
            <input type="text" required value={signUpName} onChange={e => setSignUpName(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]"
              placeholder="Full name" />
          )}
          <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]"
            placeholder="you@company.com" />
          <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]"
            placeholder="••••••••" />
          {loginError && <p className="text-red-400 text-xs text-center bg-red-500/10 py-2 px-3 rounded-lg">{loginError}</p>}
          <button type="submit" className="w-full bg-[#1f6feb] hover:bg-[#388bfd] text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
            {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>
        {isSignUp && <p className="text-[10px] text-[#8b949e] text-center">A verification email will be sent. You must verify before signing in.</p>}
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => { setIsSignUp(!isSignUp); setLoginError(''); }} className="text-[#8b949e] text-xs hover:text-[#58a6ff] transition-colors">
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
          <button onClick={() => { setShowLoginModal(false); setLoginError(''); }} className="p-1 text-[#8b949e] hover:text-white transition-colors"><X size={16} /></button>
        </div>
      </motion.div>
    </div>
  );
  // ─── WORKER APP — completely separate, no SaaS UI ──────────────────────────
  if (isLoggedIn && userRole === 'worker') {
    return (
      <WorkerApp
        user={user}
        token={localStorage.getItem('tomo_token')}
        onLogout={handleLogout}
      />
    );
  }

  // ─── LANDING PAGE ROUTER ────────────────────────────────────────────────────
  if (activeView === 'landing') {
    // Jobs landing for workers
    if (landingType === 'jobs') {
      return (
        <>
          <JobsLandingPage
            onSignUp={() => { setIsSignUp(true); setShowLoginModal(true); }}
            onSignIn={() => { setIsSignUp(false); setShowLoginModal(true); }}
          />
          <AnimatePresence>
            {showLoginModal && renderAuthModal()}
          </AnimatePresence>
        </>
      );
    }
    return (
      <>
        <LandingPage onGetStarted={() => { if (isLoggedIn) goTo('home'); else { setIsSignUp(true); setShowLoginModal(true); } }} onSignIn={() => { setIsSignUp(false); setShowLoginModal(true); }} theme={theme} />
        {/* Jobs portal link */}
        <div className="fixed bottom-4 right-4 z-50">
          <button onClick={() => setLandingType('jobs')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg transition-colors">
            <ShieldCheck size={15} /> Looking for work?
          </button>
        </div>
        <AnimatePresence>
          {showLoginModal && renderAuthModal()}
        </AnimatePresence>
      </>
    );
  }

  // ─── MAIN APP SHELL ───────────────────────────────────────────────────────

  // Extract complex views as inline helpers for readability
  const renderView_stamps = () => {
    const openedFrom = openedFromSignCenter ? 'sign-center' : openedFromPDFEditor ? 'pdf' : null;
    return (
      <div className="h-full flex flex-col -m-5 md:-m-8" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="flex items-center justify-between px-5 md:px-8 py-4 border-b border-[#30363d] bg-[#0d1117] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1f6feb] rounded-xl flex items-center justify-center"><PenTool size={17} className="text-white" /></div>
            <div><h2 className="text-base font-bold text-white">Stamp Studio</h2><p className="text-xs text-[#8b949e] hidden sm:block">Design · Export · Apply</p></div>
          </div>
          <div className="flex items-center gap-2">
            {openedFrom === 'sign-center' && <button onClick={() => { goTo('sign-docs','sign-esign'); setOpenedFromSignCenter(false); }} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"><CheckCircle2 size={14} /> Return to Sign</button>}
            {openedFrom === 'pdf' && <button onClick={() => { goTo('sign-docs','sign-applier'); setOpenedFromPDFEditor(false); }} className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors"><CheckCircle2 size={14} /> Return to PDF</button>}
          </div>
        </div>
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="lg:order-2 flex-1 lg:flex-none lg:w-[60%] xl:w-[65%] bg-[#0d1117] flex flex-col border-b lg:border-b-0 lg:border-l border-[#30363d]">
            <div className="relative flex items-center justify-center p-8 lg:p-16 flex-1 flex-shrink-0" style={{ background:'radial-gradient(ellipse at center, #041628 0%, #020b18 70%)' }}>
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage:'radial-gradient(circle, #4d93d9 1px, transparent 1px)', backgroundSize:'28px 28px' }} />
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 xl:w-[420px] xl:h-[420px] flex items-center justify-center">
                <div className="absolute inset-0 rounded-3xl border border-dashed border-[#58a6ff]/40" />
                <SVGPreview config={stampConfig} ref={svgRef} onUpdateConfig={(u) => setStampConfig(prev => ({ ...prev, ...u }))} />
              </div>
            </div>
            <div className="px-5 pb-4 flex-shrink-0 border-t border-[#30363d] pt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-3">Export As</p>
              <div className="grid grid-cols-3 gap-2">
                {[{format:'svg' as const,Icon:FileType,label:'SVG',desc:'Vector',color:'text-[#58a6ff] hover:bg-[#30363d] hover:border-[#58a6ff]'},{format:'png' as const,Icon:ImageIcon,label:'PNG',desc:'2000px',color:'text-emerald-400 hover:bg-emerald-900/30 hover:border-emerald-500'},{format:'pdf' as const,Icon:FileIcon,label:'PDF',desc:'Print',color:'text-orange-400 hover:bg-orange-900/20 hover:border-orange-500'}].map(({format,Icon,label,desc,color})=>(
                  <button key={format} onClick={()=>downloadStamp(format)} className={`flex flex-col items-center gap-1 py-3 rounded-xl border border-[#30363d] bg-[#161b22] transition-all ${color} active:scale-95`}>
                    <Icon size={18}/><span className="text-[11px] font-bold">{label}</span><span className="text-[9px] text-[#8b949e]">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5 flex-shrink-0 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={()=>{appStats.recordStampCreated(`${stampConfig.primaryText} stamp`);goTo('sign-docs','sign-applier');}} className="flex items-center justify-center gap-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white py-2.5 rounded-xl text-xs font-bold transition-colors"><FileText size={14}/>Apply to PDF</button>
                <button onClick={()=>{setOpenedFromSignCenter(true);goTo('sign-docs','sign-esign');}} className="flex items-center justify-center gap-1.5 bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] text-white py-2.5 rounded-xl text-xs font-bold transition-colors"><Layers size={14} className="text-[#58a6ff]"/>eSign</button>
              </div>
              <button onClick={handleSaveTemplate} disabled={!isLoggedIn} className="w-full flex items-center justify-center gap-1.5 bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] text-[#8b949e] py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-40"><Save size={14}/>{isLoggedIn?'Save Template':'Sign in to Save'}</button>
            </div>
          </div>
          <div className="lg:order-1 flex-shrink-0 lg:w-[40%] xl:w-[35%] overflow-y-auto bg-[#161b22]" style={{scrollbarWidth:'thin'}}>
            <div className="p-3 md:p-4 space-y-1">
              <div className="mb-3"><h3 className="text-sm font-bold text-white">Stamp Configuration</h3><p className="text-xs text-[#8b949e]">Every change updates the preview instantly</p></div>
              <EditorControls config={stampConfig} onChange={(u)=>setStampConfig(prev=>({...prev,...u}))} isLoggedIn={isLoggedIn} onSaveTemplate={handleSaveTemplate}/>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderView_aiScan = () => (
    <div className="max-w-3xl mx-auto py-10 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Camera size={32} className="text-white"/></div>
      <h2 className="text-3xl font-black text-white mb-3">AI Stamp Digitizer</h2>
      <p className="text-[#8b949e] mb-10">Photograph your old rubber stamp — AI recreates it as a perfect digital vector in seconds.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="group relative rounded-2xl border-2 border-dashed border-[#30363d] hover:border-[#1f6feb] p-10 text-center cursor-pointer transition-all bg-[#161b22] hover:bg-[#21262d]">
          <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10"/>
          <ImageIcon size={36} className="mx-auto mb-3 text-[#8b949e] group-hover:text-[#1f6feb] transition-colors"/>
          <p className="font-bold text-white mb-1">Upload Photo</p><p className="text-xs text-[#8b949e]">Select from device</p>
        </label>
        <label className="group relative rounded-2xl border-2 border-dashed border-[#30363d] hover:border-[#1f6feb] p-10 text-center cursor-pointer transition-all bg-[#161b22] hover:bg-[#21262d]">
          <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer z-10"/>
          <Camera size={36} className="mx-auto mb-3 text-[#8b949e] group-hover:text-[#1f6feb] transition-colors"/>
          <p className="font-bold text-white mb-1">Live Camera</p><p className="text-xs text-[#8b949e]">Take a photo now</p>
        </label>
      </div>
    </div>
  );

  const renderView = () => {
    // HOME
    if (activeView === 'dashboard' || activeSection === 'home') {
      return <Dashboard userName={user?.name} onNavigate={navLegacy as any} theme={theme} />;
    }

    // ── Get Clients ──────────────────────────────────────────────────────────────
    if (activeView === 'clients-upgrade') return <PricingPage userEmail={user?.email} currentPlan={user?.plan || 'trial'} />;
    if (activeView === 'clients-leads') { if (!canAccess('clients-leads')) return renderLocked('Lead Tracking'); return <SocialHub />; }
    if (activeView === 'clients-all') { if (!canAccess('clients-all')) return renderLocked('Client CRM'); return <ClientManager initialView="all" />; }
    if (activeView === 'clients-add') return <ClientManager initialView="add" />;

    // ── Smart Invoice ────────────────────────────────────────────────────────────
    if (activeView === 'invoicing-upgrade') return <PricingPage userEmail={user?.email} currentPlan={user?.plan || 'trial'} />;
    if (activeView === 'money-upgrade')     return <PricingPage userEmail={user?.email} currentPlan={user?.plan || 'trial'} />;
    if (['invoicing-invoices','invoicing-payments','invoicing-unpaid','invoicing-create',
         'money-invoices','money-payments','money-unpaid','money-create'].includes(activeView)) {
      if (!canAccess('invoicing')) return renderLocked('Smart Invoice & Payments');
      return <SmartInvoice />;
    }

    // ── eSign & Stamps ──────────────────────────────────────────────────────────
    if (activeView === 'sign-esign') {
      return <TohoSignCenter stampConfig={stampConfig} onOpenStudio={(fieldId) => { setOpenedFromSignCenter(true); setPendingStampFieldId(fieldId || null); goTo('sign-docs', 'sign-stamps'); }} pendingStampFieldId={pendingStampFieldId} onClearPendingField={() => setPendingStampFieldId(null)} isActive />;
    }
    if (activeView === 'sign-stamps')    return renderView_stamps();
    if (activeView === 'sign-applier')   return <StampApplier config={stampConfig} svgRef={svgRef} onGoToStudio={() => goTo('sign-docs','sign-stamps')} />;
    if (activeView === 'sign-templates') { if (!canAccess('sign-templates')) return renderLocked('Stamp Templates'); return <div className="max-w-5xl mx-auto py-6"><h2 className="text-2xl font-bold text-white mb-8">Your Templates</h2><TemplateLibrary onSelect={handleTemplateSelect} customTemplates={customTemplates} onCreateNew={() => goTo('sign-docs','sign-stamps')} /></div>; }
    if (activeView === 'sign-ai-scan')  { if (!canAccess('sign-ai-scan')) return renderLocked('AI Stamp Digitizer'); return renderView_aiScan(); }
    if (activeView === 'sign-upgrade')  return <PricingPage userEmail={user?.email} currentPlan={user?.plan || 'trial'} />;

    // ── Docs & PDF ───────────────────────────────────────────────────────────────
    if (activeView === 'documents-upgrade') return <PricingPage userEmail={user?.email} currentPlan={user?.plan || 'trial'} />;
    if (activeView === 'documents-pdf') { if (!canAccess('documents-pdf')) return renderLocked('PDF Editor'); return <PDFTools />; }
    if (activeView === 'documents-stamp-applier') {
      return <StampApplier config={stampConfig} svgRef={svgRef} onGoToStudio={() => { setOpenedFromPDFEditor(true); goTo('sign-docs', 'sign-stamps'); }} />;
    }
    if (activeView === 'documents-templates') {
      return (
        <div className="max-w-5xl mx-auto py-6">
          <h2 className="text-2xl font-bold text-white mb-1">Your Templates</h2>
          <p className="text-[#8b949e] text-sm mb-8">Saved stamp templates — ready to use.</p>
          <TemplateLibrary onSelect={handleTemplateSelect} customTemplates={customTemplates} onCreateNew={() => goTo('sign-docs', 'sign-stamps')} />
        </div>
      );
    }
    if (activeView === 'documents-presentation') return <DocumentsHub />;
    if (activeView === 'documents-create') return <DocumentsHub />;
    if (activeView === 'documents-ai-scan') {
      return (
        <div className="max-w-3xl mx-auto py-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Camera size={32} className="text-white" /></div>
          <h2 className="text-3xl font-black text-white mb-3">AI Stamp Digitizer</h2>
          <p className="text-[#8b949e] mb-10">Photograph your old rubber stamp — AI recreates it as a perfect digital vector in seconds.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="group relative rounded-2xl border-2 border-dashed border-[#30363d] hover:border-[#1f6feb] p-10 text-center cursor-pointer transition-all bg-[#161b22] hover:bg-[#21262d]">
              <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <ImageIcon size={36} className="mx-auto mb-3 text-[#8b949e] group-hover:text-[#1f6feb] transition-colors" />
              <p className="font-bold text-white mb-1">Upload Photo</p>
              <p className="text-xs text-[#8b949e]">Select from device</p>
            </label>
            <label className="group relative rounded-2xl border-2 border-dashed border-[#30363d] hover:border-[#1f6feb] p-10 text-center cursor-pointer transition-all bg-[#161b22] hover:bg-[#21262d]">
              <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <Camera size={36} className="mx-auto mb-3 text-[#8b949e] group-hover:text-[#1f6feb] transition-colors" />
              <p className="font-bold text-white mb-1">Live Camera</p>
              <p className="text-xs text-[#8b949e]">Take a photo now</p>
            </label>
          </div>
        </div>
      );
    }

    // STAMP STUDIO (documents-stamps)
    if (activeView === 'documents-stamps') {
      return (
        <div className="h-full flex flex-col -m-5 md:-m-8" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <div className="flex items-center justify-between px-5 md:px-8 py-4 border-b border-[#30363d] bg-[#0d1117] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1f6feb] rounded-xl flex items-center justify-center"><PenTool size={17} className="text-white" /></div>
              <div>
                <h2 className="text-base font-bold text-white">Stamp Studio</h2>
                <p className="text-xs text-[#8b949e] hidden sm:block">Design · Export · Apply</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {openedFromSignCenter && <button onClick={() => { goTo('sign-docs', 'sign-esign'); setOpenedFromSignCenter(false); }} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"><CheckCircle2 size={14} /> Return to Sign</button>}
              {openedFromPDFEditor && <button onClick={() => { goTo('sign-docs', 'sign-applier'); setOpenedFromPDFEditor(false); }} className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors"><CheckCircle2 size={14} /> Return to PDF</button>}
            </div>
          </div>
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="lg:order-2 flex-1 lg:flex-none lg:w-[60%] xl:w-[65%] bg-[#0d1117] flex flex-col border-b lg:border-b-0 lg:border-l border-[#30363d]">
              <div className="relative flex items-center justify-center p-8 lg:p-16 flex-1 flex-shrink-0" style={{ background: 'radial-gradient(ellipse at center, #041628 0%, #020b18 70%)' }}>
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #4d93d9 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 xl:w-[420px] xl:h-[420px] flex items-center justify-center">
                  <div className="absolute inset-0 rounded-3xl border border-dashed border-[#58a6ff]/40" />
                  <SVGPreview config={stampConfig} ref={svgRef} onUpdateConfig={(u) => setStampConfig(prev => ({ ...prev, ...u }))} />
                </div>
              </div>
              <div className="px-5 pb-4 flex-shrink-0 border-t border-[#30363d] pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-3">Export As</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { format: 'svg' as const, Icon: FileType,  label: 'SVG', desc: 'Vector',  color: 'text-[#58a6ff] hover:bg-[#30363d] hover:border-[#58a6ff]' },
                    { format: 'png' as const, Icon: ImageIcon, label: 'PNG', desc: '2000px',  color: 'text-emerald-400 hover:bg-emerald-900/30 hover:border-emerald-500' },
                    { format: 'pdf' as const, Icon: FileIcon,  label: 'PDF', desc: 'Print',   color: 'text-orange-400 hover:bg-orange-900/20 hover:border-orange-500' },
                  ].map(({ format, Icon, label, desc, color }) => (
                    <button key={format} onClick={() => downloadStamp(format)} className={`flex flex-col items-center gap-1 py-3 rounded-xl border border-[#30363d] bg-[#161b22] transition-all ${color} active:scale-95`}>
                      <Icon size={18} /><span className="text-[11px] font-bold">{label}</span><span className="text-[9px] text-[#8b949e]">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-5 pb-5 flex-shrink-0 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { appStats.recordStampCreated(`${stampConfig.primaryText} stamp`); goTo('sign-docs', 'sign-applier'); }} className="flex items-center justify-center gap-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white py-2.5 rounded-xl text-xs font-bold transition-colors"><FileText size={14} /> Apply to PDF</button>
                  <button onClick={() => { setOpenedFromSignCenter(true); goTo('sign-docs', 'sign-esign'); }} className="flex items-center justify-center gap-1.5 bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] text-white py-2.5 rounded-xl text-xs font-bold transition-colors"><Layers size={14} className="text-[#58a6ff]" /> eSign</button>
                </div>
                <button onClick={handleSaveTemplate} disabled={!isLoggedIn} className="w-full flex items-center justify-center gap-1.5 bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] text-[#8b949e] py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-40"><Save size={14} /> {isLoggedIn ? 'Save Template' : 'Sign in to Save'}</button>
                <button onClick={() => goTo('sign-docs', 'sign-ai-scan')} className="w-full flex items-center justify-center gap-1.5 border border-[#30363d] hover:border-[#30363d] text-[#8b949e] py-2 rounded-xl text-xs font-medium transition-colors"><Camera size={13} /> AI Scan Existing Stamp</button>
              </div>
            </div>
            <div className="lg:order-1 flex-shrink-0 lg:w-[40%] xl:w-[35%] overflow-y-auto bg-[#161b22]" style={{ scrollbarWidth: 'thin' }}>
              <div className="p-3 md:p-4 space-y-1">
                <div className="mb-3"><h3 className="text-sm font-bold text-white">Stamp Configuration</h3><p className="text-xs text-[#8b949e]">Every change updates the preview instantly</p></div>
                <EditorControls config={stampConfig} onChange={(u) => setStampConfig(prev => ({ ...prev, ...u }))} isLoggedIn={isLoggedIn} onSaveTemplate={handleSaveTemplate} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── Recruit & Track ──────────────────────────────────────────────────────────
    if (activeView === 'recruit-upgrade') return <PricingPage userEmail={user?.email} currentPlan={user?.plan || 'trial'} />;
    if (activeView === 'recruit-find' || activeView === 'work-find') return <WorkHub initialView="find-worker" />;
    if (activeView === 'recruit-workers' || activeView === 'work-my-workers') return <WorkHub initialView="my-jobs" />;
    if (['recruit-active','recruit-completed','work-active','work-completed'].includes(activeView)) { if (!canAccess('recruit-active')) return renderLocked('Advanced Workforce Tools'); return <WorkHub initialView="browse" />; }
    if (activeView === 'recruit-tracking' || activeView === 'work-tracking') { if (!canAccess('recruit-tracking')) return renderLocked('GPS Tracking'); return <EmployeeTracking />; }

    // ACTIVITY
    if (activeView === 'activity-all' || activeView === 'activity-notifications') {
      return <ActivityLog view={activeView} />;
    }

    // SETTINGS & SPECIAL VIEWS
    if (activeView === 'admin-panel') {
      if (userRole === 'superadmin') return <SuperAdminPanel />;
      return <AdminPanel />;
    }
    if (activeView === 'worker-portal') return <WorkerPortal workerEmail={user?.email} prefilledName={userRole === 'worker' ? user?.name : undefined} />;
    if (activeView === 'settings-profile') {
      return <SettingsPanel view="settings-profile" user={user} theme={theme} onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} onLogout={handleLogout} />;
    }
    if (activeView === 'settings-business') {
      return <SettingsPanel view="settings-business" user={user} theme={theme} onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} onLogout={handleLogout} />;
    }

    return <Dashboard userName={user?.name} onNavigate={navLegacy as any} theme={theme} />;
  };

  const subItems = SUB_MENUS[activeSection] || [];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0d1117] text-white">
      {/* Email verification reminder — shown only if unverified, dismissible */}
      {isLoggedIn && user && !user.emailVerified && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-[#1f6feb]/10 border-b border-[#1f6feb]/20 text-xs">
          <span className="text-[#58a6ff]">📧 Check your email to verify your account.</span>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">

      {/* ── Desktop Sidebar — accordion ── */}
      <aside className="hidden lg:flex w-60 flex-col bg-[#161b22] border-r border-[#30363d] flex-shrink-0 z-[100]">
        {/* Logo */}
        <button onClick={() => goTo('home')} className="p-5 flex items-center gap-3 hover:bg-[#21262d] transition-colors">
          <StampKELogo size={32} />
          <span className="text-lg font-black tracking-tight text-white">StampKE</span>
        </button>

        {/* Main nav — clicking section expands subitems, not navigates */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const subs = SUB_MENUS[item.id] || [];
            const isActive = activeSection === item.id;
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (subs.length === 0) { goTo(item.id); }
                    else { setActiveSection(item.id); setIsSidebarOpen(false); }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:bg-[#21262d] hover:text-white'}`}>
                  <item.icon size={16} className={isActive ? 'text-[#1f6feb]' : ''} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {subs.length > 0 && (
                    <ChevronDown size={13} className={`ml-auto text-[#8b949e] transition-transform ${isActive ? 'rotate-180' : ''}`} />
                  )}
                </button>
                {/* Subitems — shown inline when section is active */}
                {isActive && subs.length > 0 && (
                  <div className="mt-0.5 ml-2 pl-3 border-l border-[#30363d] space-y-0.5 pb-1">
                    {subs.map(sub => {
                      const isLocked = (sub as any).locked && !canAccess(sub.id);
                      return (
                        <button key={sub.id}
                          onClick={() => setActiveView(sub.id as SubView)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-1
                            ${activeView === sub.id ? 'bg-[#1f6feb]/15 text-white font-bold' : isLocked ? 'text-[#8b949e]/50 hover:bg-[#21262d]/50' : 'text-[#8b949e] hover:bg-[#21262d] hover:text-white'}`}>
                          <span>{sub.label}</span>
                          {isLocked && <span className="text-[10px] flex-shrink-0">🔒</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-[#30363d] space-y-2">
          {isLoggedIn ? (
            <div className="space-y-1">
              <button
                onClick={() => setShowUserMenu(m => !m)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-[#21262d] transition-colors">
                <div className="w-7 h-7 rounded-lg bg-[#1f6feb] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{user?.name?.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-[#8b949e] capitalize">{userRole}</p>
                </div>
              </button>
              <button onClick={() => { goTo('settings', 'settings-profile'); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#8b949e] hover:bg-[#21262d] hover:text-white transition-colors">
                <Settings size={13} /> Settings
              </button>
              <button onClick={() => { goTo('invoicing', 'invoicing-upgrade'); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#8b949e] hover:bg-[#21262d] hover:text-white transition-colors">
                <Receipt size={13} /> Billing
              </button>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => { setIsSignUp(false); setShowLoginModal(true); }} className="w-full flex items-center justify-center gap-2 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-xs font-bold transition-colors">
              <User size={14} /> Sign In
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/70 z-[150]" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="lg:hidden fixed inset-y-0 left-0 w-72 bg-[#161b22] border-r border-[#30363d] z-[200] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
                <div className="flex items-center gap-2">
                  <StampKELogo size={28} />
                  <span className="font-black tracking-tight text-white">StampKE</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-[#30363d] rounded-lg"><X size={18} /></button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                {NAV_ITEMS.map(item => (
                  <div key={item.id}>
                    <button onClick={() => { goTo(item.id); if (SUB_MENUS[item.id].length === 0) setIsSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeSection === item.id ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:text-white'}`}>
                      <item.icon size={16} className={activeSection === item.id ? 'text-[#1f6feb]' : ''} />
                      <span>{item.label}</span>
                    </button>
                    {activeSection === item.id && SUB_MENUS[item.id].map(sub => (
                      <button key={sub.id} onClick={() => { setActiveView(sub.id); setIsSidebarOpen(false); }}
                        className={`w-full text-left pl-10 pr-3 py-2 rounded-xl text-sm transition-all ${activeView === sub.id ? 'text-white font-semibold' : 'text-[#8b949e] hover:text-white'}`}>
                        {sub.label}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
              {/* Mobile drawer bottom */}
              {isLoggedIn && (
                <div className="p-3 border-t border-[#30363d] space-y-1">
                  <button onClick={() => { goTo('settings', 'settings-profile'); setIsSidebarOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[#8b949e] hover:bg-[#21262d] hover:text-white transition-colors">
                    <User size={15} /> My Profile
                  </button>
                  <button onClick={() => { goTo('invoicing', 'invoicing-upgrade'); setIsSidebarOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[#8b949e] hover:bg-[#21262d] hover:text-white transition-colors">
                    <Receipt size={15} /> Billing & Plans
                  </button>
                  <button onClick={() => { handleLogout(); setIsSidebarOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-13 border-b border-[#30363d] bg-[#161b22] px-4 flex items-center justify-between flex-shrink-0 gap-3" style={{ height: 52 }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-[#21262d] rounded-lg text-[#8b949e]"><Menu size={18} /></button>
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#8b949e]">
              <span className="font-semibold">{NAV_ITEMS.find(n => n.id === activeSection)?.label}</span>
              {subItems.length > 0 && activeView !== 'dashboard' && (
                <>
                  <ChevronRight size={12} />
                  <span className="text-white font-semibold">{subItems.find(s => s.id === activeView)?.label}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Global search */}
            <div className="hidden md:flex items-center bg-[#21262d] px-3 py-1.5 rounded-xl border border-[#30363d] gap-2">
              <Search size={13} className="text-[#8b949e]" />
              <input type="text" placeholder="Search anything..." className="bg-transparent border-none outline-none text-xs text-white w-36 placeholder:text-[#8b949e]" />
            </div>
            {/* ➕ Create button */}
            <div className="relative">
              <button onClick={() => setShowCreate(c => !c)} className="flex items-center gap-1.5 px-3 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-xs font-bold transition-colors">
                <Plus size={15} /> Create
              </button>
              <AnimatePresence>
                {showCreate && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl z-[300] overflow-hidden">
                    <div className="p-1">
                      {CREATE_ACTIONS.map(a => (
                        <button key={a.sub} onClick={() => { goTo(a.section, a.sub); setShowCreate(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#e6edf3] hover:bg-[#21262d] transition-colors">
                          <span className="text-base">{a.emoji}</span> {a.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Theme */}
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] transition-colors">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            {/* Notifications */}
            <button className="p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] transition-colors"><Bell size={15} /></button>
            {/* User menu */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(m => !m)}
                  className="w-8 h-8 rounded-xl bg-[#1f6feb] flex items-center justify-center text-white text-xs font-black hover:bg-[#388bfd] transition-colors ring-2 ring-[#1f6feb]/30"
                  title="Account">
                  {user?.name?.charAt(0).toUpperCase()}
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-[400]" onClick={() => setShowUserMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl z-[500] overflow-hidden">
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-[#21262d] bg-[#0d1117]">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#1f6feb] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                              {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                              <p className="text-xs text-[#8b949e] truncate">{user?.email}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              userRole === 'superadmin' ? 'bg-red-500/20 text-red-400' :
                              userRole === 'admin' ? 'bg-orange-500/20 text-orange-400' :
                              userRole === 'worker' ? 'bg-emerald-500/20 text-emerald-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>{userRole}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              user?.plan === 'pro' || user?.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>{user?.plan || 'trial'}</span>
                            {!user?.emailVerified && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">unverified</span>
                            )}
                          </div>
                        </div>
                        {/* Menu items */}
                        <div className="p-1.5">
                          <button onClick={() => { goTo('settings', 'settings-profile'); setShowUserMenu(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#e6edf3] hover:bg-[#21262d] transition-colors">
                            <User size={15} className="text-[#58a6ff]" /> My Profile
                          </button>
                          <button onClick={() => { goTo('settings', 'settings-business'); setShowUserMenu(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#e6edf3] hover:bg-[#21262d] transition-colors">
                            <Settings size={15} className="text-[#8b949e]" /> Business Settings
                          </button>
                          <button onClick={() => { goTo('invoicing', 'invoicing-upgrade'); setShowUserMenu(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#e6edf3] hover:bg-[#21262d] transition-colors">
                            <Receipt size={15} className="text-emerald-400" /> Billing & Plans
                          </button>
                          {(userRole === 'superadmin' || userRole === 'admin') && (
                            <button onClick={() => { goTo('settings', 'admin-panel'); setShowUserMenu(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#e6edf3] hover:bg-[#21262d] transition-colors">
                              <ShieldCheck size={15} className="text-red-400" /> Admin Panel
                            </button>
                          )}
                          <div className="border-t border-[#21262d] mt-1 pt-1">
                            <button onClick={() => { setShowUserMenu(false); handleLogout(); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                              <LogOut size={15} /> Sign Out
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button onClick={() => { setIsSignUp(false); setShowLoginModal(true); }} className="px-3 py-1.5 bg-[#1f6feb] text-white rounded-xl text-xs font-bold hover:bg-[#388bfd] transition-colors">Sign In</button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden bg-[#0d1117] flex flex-col" onClick={() => showCreate && setShowCreate(false)}>
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 md:p-8 min-h-full">
              <AnimatePresence mode="wait">
                <motion.div key={activeView} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="lg:hidden flex border-t border-[#30363d] bg-[#161b22] flex-shrink-0">
          {(['home', 'sign-docs', 'invoicing', 'recruit'] as MainSection[]).map(s => {
            const item = NAV_ITEMS.find(n => n.id === s)!;
            return (
              <button key={s} onClick={() => goTo(s)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors ${activeSection === s ? 'text-[#1f6feb]' : 'text-[#8b949e]'}`}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
          {/* Documents via floating Create */}
          <button onClick={() => setShowCreate(c => !c)} className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold text-[#8b949e]">
            <Plus size={20} />
            <span>Create</span>
          </button>
        </nav>

        {/* Hidden SVG ref for stamp export */}
        <div className="fixed -left-[9999px] -top-[9999px] invisible pointer-events-none">
          <SVGPreview config={stampConfig} ref={svgRef} />
        </div>
      </div>

      </div>{/* end flex */}
      {/* Login Modal (in-app) */}
      <AnimatePresence>{showLoginModal && renderAuthModal()}</AnimatePresence>
    </div>
  );
};

export default App;
