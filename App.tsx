import React, { useState, useRef, useEffect } from 'react';
import {
  Home, Users, DollarSign, FileText, Briefcase, BarChart2, Settings,
  Plus, X, Menu, ChevronRight, Search, Bell, LogOut, User,
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
import JobsLandingPage from './components/JobsLandingPage';
import TrialBanner from './components/TrialBanner';
import SuperAdminPanel from './components/SuperAdminPanel';
import { analyzeStampImage } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { useStampStore } from './src/store';
import { useAppStats } from './src/appStatsStore';

// ─── Navigation Model (business-owner language) ──────────────────────────────
type MainSection = 'home' | 'clients' | 'money' | 'documents' | 'work' | 'activity' | 'settings';
type SubView =
  | 'dashboard'
  | 'clients-all' | 'clients-add' | 'clients-leads'
  | 'money-invoices' | 'money-payments' | 'money-unpaid' | 'money-create'
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
  { id: 'home',      label: 'Home',      icon: Home,       emoji: '🏠' },
  { id: 'clients',   label: 'Clients',   icon: Users,      emoji: '👥' },
  { id: 'money',     label: 'Money',     icon: DollarSign, emoji: '💰' },
  { id: 'documents', label: 'Documents', icon: FileText,   emoji: '📄' },
  { id: 'work',      label: 'Work',      icon: Briefcase,  emoji: '👷' },
  { id: 'activity',  label: 'Activity',  icon: BarChart2,  emoji: '📊' },
  { id: 'settings',  label: 'Settings',  icon: Settings,   emoji: '⚙️' },
];

const SUB_MENUS: Record<MainSection, { id: SubView; label: string; desc?: string }[]> = {
  home:      [],
  clients:   [
    { id: 'clients-all',   label: 'All Clients',    desc: 'View and manage clients' },
    { id: 'clients-add',   label: 'Add Client',     desc: 'Add a new client' },
    { id: 'clients-leads', label: 'Lead Tracking',  desc: 'WhatsApp, Facebook, etc.' },
  ],
  money:     [
    { id: 'money-invoices', label: 'Invoices',       desc: 'All invoices' },
    { id: 'money-payments', label: 'Payments',       desc: 'Payment history' },
    { id: 'money-unpaid',   label: 'Unpaid',         desc: 'Outstanding balances' },
    { id: 'money-create',   label: 'Create Invoice', desc: 'New invoice' },
  ],
  documents: [
    { id: 'documents-create',       label: 'Create Document',    desc: 'New document or contract' },
    { id: 'documents-templates',    label: 'Templates',          desc: 'Invoice, contract, letter' },
    { id: 'documents-esign',        label: 'eSign',              desc: 'Collect signatures' },
    { id: 'documents-stamps',       label: 'Stamps',             desc: 'Design & manage stamps' },
    { id: 'documents-pdf',          label: 'PDF Editor',         desc: 'Edit PDF documents' },
    { id: 'documents-stamp-applier',label: 'Apply Stamp',        desc: 'Stamp a document' },
    { id: 'documents-presentation', label: 'Create Presentation',desc: 'PowerPoint / slides' },
    { id: 'documents-ai-scan',      label: 'AI Stamp Scan',      desc: 'Digitize rubber stamp' },
  ],
  work:      [
    { id: 'work-find',      label: 'Find Worker',   desc: 'Search for staff' },
    { id: 'work-my-workers',label: 'My Workers',    desc: 'Your team' },
    { id: 'work-active',    label: 'Active Jobs',   desc: 'In-progress tasks' },
    { id: 'work-completed', label: 'Completed Jobs',desc: 'Done tasks' },
    { id: 'work-tracking',  label: '📍 GPS Tracking', desc: 'QR check-in & GPS attendance' },
  ],
  activity:  [
    { id: 'activity-all',           label: 'All Actions',    desc: 'Full activity log' },
    { id: 'activity-notifications', label: 'Notifications',  desc: 'Alerts & updates' },
  ],
  settings:  [
    { id: 'settings-profile',  label: 'Profile',         desc: 'Your account' },
    { id: 'settings-business', label: 'Business Info',   desc: 'Company details & billing' },
    { id: 'admin-panel',       label: '⚡ Admin Panel',  desc: 'Platform management (owner only)' },
    { id: 'worker-portal',     label: '👷 Worker Portal',desc: 'Register as a worker' },
  ],
};

// ─── Create Quick-Action items ────────────────────────────────────────────────
const CREATE_ACTIONS = [
  { label: 'Create Invoice',   sub: 'money-create' as SubView,           section: 'money' as MainSection,     emoji: '💰' },
  { label: 'Add Client',       sub: 'clients-add' as SubView,            section: 'clients' as MainSection,   emoji: '👥' },
  { label: 'New Document',     sub: 'documents-create' as SubView,       section: 'documents' as MainSection, emoji: '📄' },
  { label: 'Sign Document',    sub: 'documents-esign' as SubView,        section: 'documents' as MainSection, emoji: '✍️' },
  { label: 'Design Stamp',     sub: 'documents-stamps' as SubView,       section: 'documents' as MainSection, emoji: '🖋️' },
  { label: 'Find Worker',      sub: 'work-find' as SubView,              section: 'work' as MainSection,      emoji: '👷' },
  { label: 'Worker Portal',    sub: 'worker-portal' as SubView,          section: 'settings' as MainSection,  emoji: '🪪' },
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
  const [user, setUser] = useState<{ name: string; email: string; role?: string; plan?: string; trialActive?: boolean; trialDaysLeft?: number; adminPermissions?: string[] } | null>(null);
  const userRole = user?.role || 'business';
  // Landing page type: 'main' = business tools, 'jobs' = worker portal
  const [landingType, setLandingType] = useState<'main' | 'jobs'>('main');
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
      'stamp-studio': { section: 'documents', view: 'documents-stamps' },
      'esign':        { section: 'documents', view: 'documents-esign' },
      'apply-stamp':  { section: 'documents', view: 'documents-stamp-applier' },
      'convert':      { section: 'documents', view: 'documents-ai-scan' },
      'pdf-forge':    { section: 'documents', view: 'documents-pdf' },
      'templates':    { section: 'documents', view: 'documents-templates' },
      'smart-invoice':{ section: 'money',     view: 'money-invoices' },
      'qr-tracker':   { section: 'work',      view: 'work-my-workers' },
      'social-hub':   { section: 'clients',   view: 'clients-leads' },
      'landing':      { section: 'home',      view: 'landing' },
      'admin':        { section: 'settings', view: 'admin-panel' },
      'worker-portal':{ section: 'settings', view: 'worker-portal' },
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

  useEffect(() => {
    const saved = localStorage.getItem('custom_stamp_templates');
    if (saved) { try { setCustomTemplates(JSON.parse(saved)); } catch {} }
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
          setLoginError('');
          setShowLoginModal(false);
          alert('✅ Account created! Please check your email to verify your address before signing in.');
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
        if (data.success && data.token) {
          const u = data.result || data.user || data;
          localStorage.setItem('tomo_token', u.token || data.token);
          setUser({ name: u.name, email: u.email, role: u.role, plan: u.plan, trialActive: u.trialActive, trialDaysLeft: u.trialDaysLeft, adminPermissions: u.adminPermissions });
          setIsLoggedIn(true); setShowLoginModal(false);
          const r = data.result || data.user || data;
          if (r.role === 'superadmin' || r.role === 'admin') goTo('settings', 'admin-panel');
          else if (r.role === 'worker') goTo('settings', 'worker-portal');
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
    goTo('documents', 'documents-stamps');
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
    goTo('documents', 'documents-ai-scan');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const analysis = await analyzeStampImage(reader.result as string);
      if (analysis) {
        setStampConfig(prev => ({ ...prev, shape: analysis.shape === 'OVAL' ? StampShape.OVAL : analysis.shape === 'ROUND' ? StampShape.ROUND : StampShape.RECTANGLE, primaryText: analysis.primaryText || prev.primaryText, secondaryText: analysis.secondaryText || '', centerText: analysis.centerText || '', borderColor: analysis.color || prev.borderColor }));
        appStats.recordAiScan(); goTo('documents', 'documents-stamps');
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper: role-based feature gate
  const canAccess = (feature: string): boolean => {
    if (userRole === 'superadmin') return true;
    if (userRole === 'admin') {
      const perms = user?.adminPermissions || [];
      if (feature === 'workers') return perms.includes('workers');
      if (feature === 'users') return perms.includes('users');
      if (feature === 'invoices') return perms.includes('invoices');
      if (feature === 'clients') return perms.includes('clients');
      if (feature === 'jobs') return perms.includes('jobs');
      return false;
    }
    if (userRole === 'worker') return ['worker-portal'].includes(feature);
    // business role
    const freeFeatures = ['documents-esign', 'documents-stamps', 'documents-templates'];
    if (freeFeatures.includes(feature)) return true;
    const hasPlan = user?.plan === 'pro' || user?.plan === 'enterprise';
    const onTrial = user?.trialActive === true;
    return hasPlan || onTrial;
  };

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
        <LandingPage onGetStarted={() => { if (isLoggedIn) goTo('home'); else { setIsSignUp(true); setShowLoginModal(true); } }} theme={theme} />
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
  }

  // ─── MAIN APP SHELL ───────────────────────────────────────────────────────
  const renderView = () => {
    // HOME
    if (activeView === 'dashboard' || activeSection === 'home') {
      return <Dashboard userName={user?.name} onNavigate={navLegacy as any} theme={theme} />;
    }

    // CLIENTS
    if (activeView === 'clients-leads') return <SocialHub />;
    if (activeView === 'clients-all') { if (userRole === 'business' && !canAccess('clients-all')) return renderLocked('Client Manager'); return <ClientManager initialView="all" />; }
    if (activeView === 'clients-add') { if (userRole === 'business' && !canAccess('clients-add')) return renderLocked('Client Manager'); return <ClientManager initialView="add" />; }

    // MONEY — premium for business (free only esign+stamps)
    if (activeView === 'money-invoices' || activeView === 'money-payments' || activeView === 'money-unpaid' || activeView === 'money-create') {
      if (userRole === 'business' && !canAccess('money-invoices')) return renderLocked('Smart Invoice');
      return <SmartInvoice />;
    }

    // DOCUMENTS
    if (activeView === 'documents-esign') {
      return <TohoSignCenter stampConfig={stampConfig} onOpenStudio={(fieldId) => { setOpenedFromSignCenter(true); setPendingStampFieldId(fieldId || null); goTo('documents', 'documents-stamps'); }} pendingStampFieldId={pendingStampFieldId} onClearPendingField={() => setPendingStampFieldId(null)} isActive />;
    }
    if (activeView === 'documents-pdf') { if (userRole === 'business' && !canAccess('documents-pdf')) return renderLocked('PDF Editor'); return <PDFTools />; }
    if (activeView === 'documents-stamp-applier') {
      return <StampApplier config={stampConfig} svgRef={svgRef} onGoToStudio={() => { setOpenedFromPDFEditor(true); goTo('documents', 'documents-stamps'); }} />;
    }
    if (activeView === 'documents-templates') {
      return (
        <div className="max-w-5xl mx-auto py-6">
          <h2 className="text-2xl font-bold text-white mb-1">Your Templates</h2>
          <p className="text-[#8b949e] text-sm mb-8">Saved stamp templates — ready to use.</p>
          <TemplateLibrary onSelect={handleTemplateSelect} customTemplates={customTemplates} onCreateNew={() => goTo('documents', 'documents-stamps')} />
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
              {openedFromSignCenter && <button onClick={() => { goTo('documents', 'documents-esign'); setOpenedFromSignCenter(false); }} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"><CheckCircle2 size={14} /> Return to Sign</button>}
              {openedFromPDFEditor && <button onClick={() => { goTo('documents', 'documents-stamp-applier'); setOpenedFromPDFEditor(false); }} className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors"><CheckCircle2 size={14} /> Return to PDF</button>}
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
                  <button onClick={() => { appStats.recordStampCreated(`${stampConfig.primaryText} stamp`); goTo('documents', 'documents-stamp-applier'); }} className="flex items-center justify-center gap-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white py-2.5 rounded-xl text-xs font-bold transition-colors"><FileText size={14} /> Apply to PDF</button>
                  <button onClick={() => { setOpenedFromSignCenter(true); goTo('documents', 'documents-esign'); }} className="flex items-center justify-center gap-1.5 bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] text-white py-2.5 rounded-xl text-xs font-bold transition-colors"><Layers size={14} className="text-[#58a6ff]" /> eSign</button>
                </div>
                <button onClick={handleSaveTemplate} disabled={!isLoggedIn} className="w-full flex items-center justify-center gap-1.5 bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] text-[#8b949e] py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-40"><Save size={14} /> {isLoggedIn ? 'Save Template' : 'Sign in to Save'}</button>
                <button onClick={() => goTo('documents', 'documents-ai-scan')} className="w-full flex items-center justify-center gap-1.5 border border-[#30363d] hover:border-[#30363d] text-[#8b949e] py-2 rounded-xl text-xs font-medium transition-colors"><Camera size={13} /> AI Scan Existing Stamp</button>
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

    // WORK — WorkHub handles all work sub-views
    if (activeView === 'work-find') return <WorkHub initialView="find-worker" />;
    if (activeView === 'work-my-workers') return <WorkHub initialView="my-jobs" />;
    if (activeView === 'work-active' || activeView === 'work-completed') return <WorkHub initialView="browse" />;
    if (activeView === 'work-tracking') return <EmployeeTracking />;

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
import JobsLandingPage from './components/JobsLandingPage';
import TrialBanner from './components/TrialBanner';
import SuperAdminPanel from './components/SuperAdminPanel';
import { analyzeStampImage } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { useStampStore } from './src/store';
import { useAppStats } from './src/appStatsStore';

// ─── Navigation Model (business-owner language) ──────────────────────────────
type MainSection = 'home' | 'clients' | 'money' | 'documents' | 'work' | 'activity' | 'settings';
type SubView =
  | 'dashboard'
  | 'clients-all' | 'clients-add' | 'clients-leads'
  | 'money-invoices' | 'money-payments' | 'money-unpaid' | 'money-create'
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
export default App;

