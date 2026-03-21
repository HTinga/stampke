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
import WorkHub from './components/WorkHub';
import AdminPanel from './components/AdminPanel';
import WorkerPortal from './components/WorkerPortal';
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
  | 'work-find' | 'work-my-workers' | 'work-active' | 'work-completed'
  | 'activity-all' | 'activity-notifications'
  | 'settings-profile' | 'settings-business'
  | 'admin-panel' | 'worker-portal'
  | 'landing';

// Kept for compatibility with child components that use old tab names
type LegacyTab = 'stamp-studio' | 'esign' | 'dashboard' | 'pdf-forge' | 'convert' | 'apply-stamp' | 'templates' | 'qr-tracker' | 'social-hub' | 'landing' | 'smart-invoice';


// ─── Demo Accounts ─────────────────────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  { email: 'admin@tomo.ke',      password: 'admin123',     name: 'Admin Owner',    role: 'admin' as const },
  { email: 'recruiter@demo.ke',  password: 'recruit123',   name: 'James Otieno',   role: 'recruiter' as const },
  { email: 'worker@demo.ke',     password: 'worker123',    name: 'John Kamau',     role: 'worker' as const },
];

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
  ],
  activity:  [
    { id: 'activity-all',           label: 'All Actions',    desc: 'Full activity log' },
    { id: 'activity-notifications', label: 'Notifications',  desc: 'Alerts & updates' },
  ],
  settings:  [
    { id: 'settings-profile',  label: 'Profile',       desc: 'Your account' },
    { id: 'settings-business', label: 'Business Info', desc: 'Company details' },
    { id: 'admin-panel',       label: '⚡ Admin Panel', desc: 'Platform management (owner only)' },
    { id: 'worker-portal',    label: '👷 Worker Portal', desc: 'Register as a worker' },
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
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);
  const userRole = user?.role || 'recruiter';
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

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Check demo accounts first
    const demo = DEMO_ACCOUNTS.find(a => a.email === loginEmail && a.password === loginPassword);
    if (demo) {
      setUser({ name: demo.name, email: demo.email, role: demo.role });
      setIsLoggedIn(true); setShowLoginModal(false); setLoginError('');
      // Route based on role
      if (demo.role === 'admin') goTo('settings', 'admin-panel');
      else if (demo.role === 'worker') goTo('settings', 'worker-portal');
      else goTo('home');
      return;
    }
    // Generic login for any other credentials
    if (isSignUp || (loginEmail && loginPassword)) {
      setUser({ name: loginEmail.split('@')[0] || 'User', email: loginEmail, role: 'recruiter' });
      setIsLoggedIn(true); setShowLoginModal(false); setLoginError('');
      goTo('home');
    } else { setLoginError('Please enter your credentials.'); }
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

  // ─── LANDING PAGE ─────────────────────────────────────────────────────────
  if (activeView === 'landing') {
    return (
      <>
        <LandingPage onGetStarted={() => { if (isLoggedIn) goTo('home'); else { setIsSignUp(true); setShowLoginModal(true); } }} theme={theme} />
        <AnimatePresence>
          {showLoginModal && (
            <div className="fixed inset-0 bg-[#0d1117]/90 backdrop-blur-3xl z-[600] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-[#161b22] w-full max-w-md rounded-3xl shadow-2xl border border-[#30363d] p-10 space-y-8">
                <div className="text-center">
                  <div className="w-14 h-14 bg-[#1f6feb] rounded-2xl flex items-center justify-center text-white mx-auto mb-5"><ShieldCheck size={28} /></div>
                  <h3 className="text-2xl font-black text-white mb-1">{isSignUp ? 'Join Tomo' : 'Welcome Back'}</h3>
                  <p className="text-[#8b949e] text-sm">{isSignUp ? 'Create your workspace.' : 'Sign in to continue.'}</p>
                </div>
                {/* Demo account quick-login cards */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] text-center">Quick Demo Login</p>
                  {DEMO_ACCOUNTS.map(a => (
                    <button key={a.email} type="button" onClick={() => { setLoginEmail(a.email); setLoginPassword(a.password); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.01] ${loginEmail === a.email ? 'border-[#1f6feb] bg-[#1f6feb]/10' : 'border-[#30363d] bg-[#0d1117] hover:border-[#58a6ff]'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${a.role === 'admin' ? 'bg-red-500' : a.role === 'worker' ? 'bg-purple-600' : 'bg-[#1f6feb]'}`}>
                        {a.name.charAt(0)}
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-semibold text-white">{a.name}</p>
                        <p className="text-[10px] text-[#8b949e]">{a.email}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg capitalize ${a.role === 'admin' ? 'bg-red-500/20 text-red-400' : a.role === 'worker' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>{a.role}</span>
                    </button>
                  ))}
                </div>
                <div className="relative flex items-center gap-3"><div className="flex-1 h-px bg-[#30363d]"/><span className="text-[10px] text-[#8b949e] uppercase tracking-widest">or sign in manually</span><div className="flex-1 h-px bg-[#30363d]"/></div>
                <form onSubmit={handleDemoLogin} className="space-y-3">
                  <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb]" placeholder="you@company.com" />
                  <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb]" placeholder="••••••••" />
                  {loginError && <p className="text-red-400 text-xs text-center">{loginError}</p>}
                  <button type="submit" className="w-full bg-[#1f6feb] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#388bfd] transition-colors flex items-center justify-center gap-2">
                    {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={18} />
                  </button>
                </form>
                <div className="flex items-center justify-between">
                  <button onClick={() => setIsSignUp(!isSignUp)} className="text-[#8b949e] text-xs hover:text-[#58a6ff] transition-colors">{isSignUp ? 'Already have an account?' : 'Need an account?'}</button>
                  <button onClick={() => setShowLoginModal(false)} className="p-1 text-[#8b949e] hover:text-white"><X size={16} /></button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ─── MAIN APP SHELL ───────────────────────────────────────────────────────
  const renderView = () => {
    // HOME
    if (activeView === 'dashboard' || activeSection === 'home') {
      return <Dashboard userName={user?.name} onNavigate={navLegacy as any} theme={theme} />;
    }

    // CLIENTS
    if (activeView === 'clients-leads') return <SocialHub />;
    if (activeView === 'clients-all' || activeView === 'clients-add') {
      return <ComingSoon title={activeView === 'clients-all' ? 'All Clients' : 'Add Client'} desc="Client management is coming soon. You can track leads via the Leads view." emoji="👥" />;
    }

    // MONEY
    if (activeView === 'money-invoices' || activeView === 'money-payments' || activeView === 'money-unpaid' || activeView === 'money-create') {
      return <SmartInvoice />;
    }

    // DOCUMENTS
    if (activeView === 'documents-esign') {
      return <TohoSignCenter stampConfig={stampConfig} onOpenStudio={(fieldId) => { setOpenedFromSignCenter(true); setPendingStampFieldId(fieldId || null); goTo('documents', 'documents-stamps'); }} pendingStampFieldId={pendingStampFieldId} onClearPendingField={() => setPendingStampFieldId(null)} isActive />;
    }
    if (activeView === 'documents-pdf') return <PDFTools />;
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
    if (activeView === 'documents-presentation') return <DocumentsHub />;
    if (activeView === 'documents-create') return <DocumentsHub />;

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

    // ACTIVITY
    if (activeView === 'activity-all' || activeView === 'activity-notifications') {
      return <ComingSoon title={activeView === 'activity-all' ? 'All Activity' : 'Notifications'} desc="Activity logs and notifications are coming soon." emoji="📊" />;
    }

    // SETTINGS & SPECIAL VIEWS
    if (activeView === 'admin-panel') return <AdminPanel />;
    if (activeView === 'worker-portal') return <WorkerPortal workerEmail={user?.email} prefilledName={userRole === 'worker' ? user?.name : undefined} />;
    if (activeView === 'settings-profile' || activeView === 'settings-business') {
      return <ComingSoon title={activeView === 'settings-profile' ? 'Profile' : 'Business Info'} desc="Settings are coming soon." emoji="⚙️" />;
    }

    return <Dashboard userName={user?.name} onNavigate={navLegacy as any} theme={theme} />;
  };

  const subItems = SUB_MENUS[activeSection] || [];

  return (
    <div className="h-screen flex overflow-hidden bg-[#0d1117] text-white">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-56 flex-col bg-[#161b22] border-r border-[#30363d] flex-shrink-0 z-[100]">
        {/* Logo */}
        <button onClick={() => goTo('home')} className="p-5 flex items-center gap-3 hover:bg-[#21262d] transition-colors">
          <div className="w-8 h-8 bg-[#1f6feb] rounded-xl flex items-center justify-center"><span className="text-white font-black text-sm">T</span></div>
          <span className="text-lg font-black tracking-tight text-white">Tomo</span>
        </button>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => goTo(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeSection === item.id ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:bg-[#21262d] hover:text-white'}`}>
              <item.icon size={16} className={activeSection === item.id ? 'text-[#1f6feb]' : ''} />
              <span>{item.label}</span>
              {activeSection === item.id && subItems.length > 0 && <ChevronRight size={14} className="ml-auto text-[#8b949e]" />}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-[#30363d] space-y-2">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-7 h-7 rounded-lg bg-[#1f6feb] flex items-center justify-center text-white text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-white truncate">{user?.name}</p><p className="text-[10px] text-[#8b949e]">Admin</p></div>
              <button onClick={handleLogout} className="p-1 text-[#8b949e] hover:text-white transition-colors"><LogOut size={14} /></button>
            </div>
          ) : (
            <button onClick={() => { setIsSignUp(false); setShowLoginModal(true); }} className="w-full flex items-center justify-center gap-2 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-xs font-bold transition-colors">
              <User size={14} /> Sign In
            </button>
          )}
        </div>
      </aside>

      {/* ── Desktop Sub-sidebar (second level) ── */}
      {subItems.length > 0 && (
        <aside className="hidden lg:flex w-48 flex-col bg-[#0d1117] border-r border-[#30363d] flex-shrink-0">
          <div className="p-4 pb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8b949e]">{NAV_ITEMS.find(n => n.id === activeSection)?.label}</p>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {subItems.map(item => (
              <button key={item.id} onClick={() => { setActiveView(item.id); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${activeView === item.id ? 'bg-[#21262d] text-white font-semibold' : 'text-[#8b949e] hover:bg-[#21262d] hover:text-white'}`}>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
      )}

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/70 z-[150]" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="lg:hidden fixed inset-y-0 left-0 w-72 bg-[#161b22] border-r border-[#30363d] z-[200] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#1f6feb] rounded-lg flex items-center justify-center"><span className="text-white font-black text-xs">T</span></div>
                  <span className="font-black text-white">Tomo</span>
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
            {/* User */}
            {isLoggedIn ? (
              <button onClick={handleLogout} className="w-7 h-7 rounded-lg bg-[#1f6feb] flex items-center justify-center text-white text-xs font-bold" title="Log out">
                {user?.name?.charAt(0).toUpperCase()}
              </button>
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
          {(['home', 'clients', 'money', 'work'] as MainSection[]).map(s => {
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

      {/* Login Modal (in-app) */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 bg-[#0d1117]/90 backdrop-blur-3xl z-[600] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="bg-[#161b22] w-full max-w-md rounded-3xl shadow-2xl border border-[#30363d] p-10 space-y-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#1f6feb] rounded-2xl flex items-center justify-center text-white mx-auto mb-4"><ShieldCheck size={24} /></div>
                <h3 className="text-xl font-black text-white mb-1">{isSignUp ? 'Join Tomo' : 'Welcome Back'}</h3>
                <p className="text-[#8b949e] text-sm">{isSignUp ? 'Create your workspace.' : 'Sign in to continue.'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] text-center">Quick Demo Login</p>
                {DEMO_ACCOUNTS.map(a => (
                  <button key={a.email} type="button" onClick={() => { setLoginEmail(a.email); setLoginPassword(a.password); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${loginEmail === a.email ? 'border-[#1f6feb] bg-[#1f6feb]/10' : 'border-[#30363d] bg-[#0d1117] hover:border-[#58a6ff]'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${a.role === 'admin' ? 'bg-red-500' : a.role === 'worker' ? 'bg-purple-600' : 'bg-[#1f6feb]'}`}>{a.name.charAt(0)}</div>
                    <div className="text-left flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{a.name}</p><p className="text-[10px] text-[#8b949e] truncate">{a.email}</p></div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg capitalize flex-shrink-0 ${a.role === 'admin' ? 'bg-red-500/20 text-red-400' : a.role === 'worker' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>{a.role}</span>
                  </button>
                ))}
              </div>
              <form onSubmit={handleDemoLogin} className="space-y-3">
                <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb]" placeholder="you@company.com" />
                <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb]" placeholder="••••••••" />
                {loginError && <p className="text-red-400 text-xs text-center">{loginError}</p>}
                <button type="submit" className="w-full bg-[#1f6feb] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#388bfd] flex items-center justify-center gap-2"><ArrowRight size={16} /> {isSignUp ? 'Create Account' : 'Sign In'}</button>
              </form>
              <div className="flex items-center justify-between">
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-[#8b949e] text-xs hover:text-[#58a6ff]">{isSignUp ? 'Already have an account?' : 'Need an account?'}</button>
                <button onClick={() => setShowLoginModal(false)} className="p-1 text-[#8b949e] hover:text-white"><X size={16} /></button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
