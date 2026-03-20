import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Image as ImageIcon, CheckCircle2, Menu, X, ArrowRight, ShieldCheck,
  Camera, User, PenTool, Twitter, Linkedin, Github, FileText, Wrench,
  LayoutDashboard, Sun, Moon, ChevronRight, Search, FileType, FileIcon,
  Layers, QrCode, Share2, Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { StampConfig, StampTemplate, StampShape } from './types';
import { DEFAULT_CONFIG, TEMPLATES } from './constants';
import SVGPreview from './components/SVGPreview';
import TemplateLibrary from './components/TemplateLibrary';
import EditorControls from './components/EditorControls';
import DocuSealSignCenter from './components/esign/DocuSealSignCenter';
import PDFTools from './components/PDFTools';
import StampApplier from './components/StampApplier';
import EmployeeQRTracker from './components/hr/EmployeeQRTracker';
import SocialHub from './components/SocialHub';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { analyzeStampImage } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { useStampStore } from './src/store';
import { useAppStats } from './src/appStatsStore';

type ActiveTab = 'stamp-studio' | 'esign' | 'dashboard' | 'pdf-forge' | 'convert' | 'apply-stamp' | 'templates' | 'qr-tracker' | 'social-hub' | 'landing';

const NAVIGATION_GROUPS = [
  { id: 'apps', label: 'Core Workspace', items: ['dashboard'] },
  { id: 'authority', label: 'Digital Authority', items: ['stamp-studio', 'esign', 'apply-stamp', 'convert'] },
  { id: 'productivity', label: 'Productivity Suite', items: ['pdf-forge', 'templates'] },
  { id: 'management', label: 'Enterprise Management', items: ['qr-tracker', 'social-hub'] }
];

const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'stamp-studio', label: 'Stamp Designer', icon: PenTool },
  { id: 'esign', label: 'Sign Center', icon: CheckCircle2 },
  { id: 'apply-stamp', label: 'Stamp Applier', icon: FileText },
  { id: 'convert', label: 'AI Scan', icon: Camera },
  { id: 'pdf-forge', label: 'PDF Editor', icon: Wrench },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'qr-tracker', label: 'QR Tracker', icon: QrCode },
  { id: 'social-hub', label: 'Social Hub', icon: Share2 },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { config: stampConfig, setConfig: setStampConfig } = useStampStore();
  const appStats = useAppStats();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [userRole] = useState<'admin' | 'supervisor' | 'staff'>('admin');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [user, setUser] = useState<{name: string, email: string, picture?: string} | null>(null);
  const [pendingStampFieldId, setPendingStampFieldId] = useState<string | null>(null);
  const [openedFromSignCenter, setOpenedFromSignCenter] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<StampTemplate[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const savedTemplates = localStorage.getItem('custom_stamp_templates');
    if (savedTemplates) {
      try { setCustomTemplates(JSON.parse(savedTemplates)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'stamp-studio' || activeTab === 'apply-stamp') setIsSidebarOpen(false);
  }, [activeTab]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
    const handleOAuth = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setUser(event.data.user);
        setIsLoggedIn(true);
      }
    };
    window.addEventListener('message', handleOAuth);
    return () => window.removeEventListener('message', handleOAuth);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSaveTemplate = () => {
    if (!isLoggedIn) return;
    const newTemplate: StampTemplate = {
      id: `custom-${Date.now()}`,
      name: `Custom ${stampConfig.primaryText || 'Stamp'}`,
      category: 'Custom',
      ...stampConfig
    };
    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem('custom_stamp_templates', JSON.stringify(updated));
    alert("Template saved successfully!");
  };

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp || (loginEmail && loginPassword)) {
      setUser({ name: loginEmail.split('@')[0] || 'User', email: loginEmail });
      setIsLoggedIn(true);
      setShowLoginModal(false);
      setLoginError('');
      setActiveTab('dashboard');
    } else {
      setLoginError('Please enter your credentials.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setActiveTab('landing');
  };

  const handleTemplateSelect = (template: StampTemplate) => {
    setStampConfig({
      ...DEFAULT_CONFIG,
      shape: template.shape,
      primaryText: template.primaryText,
      secondaryText: template.secondaryText || '',
      innerTopText: template.innerTopText || '',
      innerBottomText: template.innerBottomText || '',
      centerText: template.centerText || '',
      centerSubText: template.centerSubText || '',
      borderColor: template.borderColor,
      secondaryColor: template.secondaryColor || template.borderColor,
      fontFamily: template.fontFamily,
      showSignatureLine: template.showSignatureLine || false,
      showDateLine: template.showDateLine || false,
      showStars: template.showStars || false,
      showInnerLine: template.showInnerLine || false,
      innerLineOffset: template.innerLineOffset || 15,
      wetInk: template.wetInk || false,
      logoUrl: null
    });
    appStats.recordTemplateUsed(template.name);
    setActiveTab('stamp-studio');
  };

  const downloadStamp = async (format: 'svg' | 'png' | 'pdf') => {
    if (!svgRef.current) return;
    const fileName = `stamp_${stampConfig.primaryText.toLowerCase().replace(/\s+/g, '_')}`;
    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `${fileName}.svg`; link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'png') {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      canvas.width = 2000; canvas.height = 2000;
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        try { if (ctx) { ctx.drawImage(img, 0, 0, 2000, 2000); const link = document.createElement('a'); link.href = canvas.toDataURL('image/png'); link.download = `${fileName}.png`; link.click(); } }
        catch (err) { console.error(err); } finally { URL.revokeObjectURL(url); }
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    } else if (format === 'pdf') {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      canvas.width = 2000; canvas.height = 2000;
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        try {
          if (ctx) {
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 2000, 2000); ctx.drawImage(img, 0, 0, 2000, 2000);
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [2000, 2000] });
            pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, 2000, 2000);
            pdf.save(`${fileName}.pdf`);
          }
        } catch (err) { console.error(err); } finally { URL.revokeObjectURL(url); }
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    }
    appStats.recordStampDownloaded();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setActiveTab('convert');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const analysis = await analyzeStampImage(reader.result as string);
      if (analysis) {
        setStampConfig(prev => ({
          ...prev,
          shape: analysis.shape === 'OVAL' ? StampShape.OVAL : analysis.shape === 'ROUND' ? StampShape.ROUND : StampShape.RECTANGLE,
          primaryText: analysis.primaryText || prev.primaryText,
          secondaryText: analysis.secondaryText || '',
          centerText: analysis.centerText || '',
          borderColor: analysis.color || prev.borderColor
        }));
        appStats.recordAiScan();
        setActiveTab('stamp-studio');
      }
    };
    reader.readAsDataURL(file);
  };

  const nav = (tab: ActiveTab) => setActiveTab(tab);
  const isDark = theme === 'dark';

  // ─── LANDING PAGE ───────────────────────────────────────────────────────
  if (activeTab === 'landing') {
    return (
      <>
        <LandingPage
          onGetStarted={() => {
            if (isLoggedIn) { setActiveTab('dashboard'); }
            else { setIsSignUp(true); setShowLoginModal(true); }
          }}
          theme={theme}
        />
        <AnimatePresence>
          {showLoginModal && (
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-3xl z-[600] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[64px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="p-16 space-y-10">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-[28px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-200 mb-6">
                      <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-4xl font-black tracking-tighter mb-2">{isSignUp ? 'Join Sahihi' : 'Welcome Back'}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-base">
                      {isSignUp ? 'Create your professional digital authority account.' : 'Sign in to your workspace.'}
                    </p>
                  </div>
                  <form onSubmit={handleDemoLogin} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Email Address</label>
                      <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/20 font-bold"
                        placeholder="counsel@firm.ke" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Password</label>
                      <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/20 font-bold"
                        placeholder="••••••••" />
                    </div>
                    {loginError && <p className="text-red-500 text-sm font-bold text-center">{loginError}</p>}
                    <button type="submit" className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:scale-[1.02] transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95">
                      {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={22} />
                    </button>
                  </form>
                  <div className="flex items-center justify-between">
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-slate-400 font-bold hover:text-blue-600 transition-all text-sm">
                      {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                    <button onClick={() => setShowLoginModal(false)} className="p-2 text-slate-300 hover:text-slate-500 transition-colors"><X size={18} /></button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ─── APP SHELL ────────────────────────────────────────────────────────────
  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[100] flex-shrink-0">
        <div className="p-5 flex items-center gap-3 cursor-pointer" onClick={() => nav('dashboard')}>
          <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none"><Plus size={18} /></div>
          <h1 className="text-lg font-black tracking-tighter">Sahihi</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {NAVIGATION_GROUPS.map(group => (
            <div key={group.id}>
              <h4 className="px-3 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">{group.label}</h4>
              {group.items.map(itemId => {
                const item = NAVIGATION_ITEMS.find(i => i.id === itemId);
                if (!item) return null;
                return (
                  <button key={item.id} onClick={() => nav(item.id as ActiveTab)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all text-sm mb-0.5 ${
                      activeTab === item.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}>
                    <item.icon size={15} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {activeTab === item.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-4 space-y-3">
          <button onClick={() => nav('landing')} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
            <Sparkles size={14} /> Landing Page
          </button>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">Pro Plan</p>
            <p className="text-xs font-bold mb-3 opacity-90">Unlock unlimited features.</p>
            <button onClick={() => nav('landing')} className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all">Upgrade →</button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150]" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[200] flex flex-col">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white p-2 rounded-xl"><Plus size={16} /></div>
                  <h1 className="text-lg font-black tracking-tighter">Sahihi</h1>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={18} /></button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-5">
                {NAVIGATION_GROUPS.map(group => (
                  <div key={group.id}>
                    <h4 className="px-3 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">{group.label}</h4>
                    {group.items.map(itemId => {
                      const item = NAVIGATION_ITEMS.find(i => i.id === itemId);
                      if (!item) return null;
                      return (
                        <button key={item.id} onClick={() => { nav(item.id as ActiveTab); setIsSidebarOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all text-sm mb-0.5 ${activeTab === item.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                          <item.icon size={15} /><span className="flex-1 text-left">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-50 px-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Menu size={18} /></button>
            <div className="hidden md:flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <LayoutDashboard size={12} />
              <span>Sahihi</span>
              <ChevronRight size={12} />
              <span className="text-slate-900 dark:text-white capitalize">{activeTab.replace(/-/g, ' ')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Search size={12} className="text-slate-400 mr-2" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-xs font-bold w-32 lg:w-40" />
            </div>
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-black">{user?.name}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{userRole}</p>
                </div>
                <button onClick={handleLogout} className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs hover:bg-blue-700 transition-all">
                  {user?.name.charAt(0).toUpperCase()}
                </button>
              </div>
            ) : (
              <button onClick={() => { setIsSignUp(false); setShowLoginModal(true); }} className="bg-slate-900 dark:bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all">
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="p-5 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

                {/* DASHBOARD */}
                {activeTab === 'dashboard' && (
                  <Dashboard userName={user?.name} onNavigate={nav} theme={theme} />
                )}

                {/* STAMP STUDIO — Premium UI */}
                {activeTab === 'stamp-studio' && (
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                            <PenTool size={16} className="text-white" />
                          </div>
                          <h2 className="text-3xl font-black tracking-tighter">Stamp Studio</h2>
                        </div>
                        <p className={`text-sm font-medium ml-11 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Design your professional vector stamp with real-time preview</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-100 text-slate-500'}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Vector SVG · 2K PNG · PDF
                        </div>
                        <button onClick={() => nav('dashboard')} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={20} /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Controls */}
                      <div className="lg:col-span-4">
                        <div className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                          <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-50 bg-slate-50/80'}`}>
                            <h3 className="text-sm font-black">Stamp Configuration</h3>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Customize every detail</p>
                          </div>
                          <div className="p-4 overflow-y-auto max-h-[calc(100vh-260px)]">
                            <EditorControls config={stampConfig} onChange={(u) => setStampConfig(prev => ({ ...prev, ...u }))} isLoggedIn={isLoggedIn} onSaveTemplate={handleSaveTemplate} />
                          </div>
                        </div>
                      </div>

                      {/* Preview + Actions */}
                      <div className="lg:col-span-8 flex flex-col gap-5">
                        {/* Canvas */}
                        <div className={`relative rounded-3xl border flex flex-col items-center justify-center p-8 md:p-12 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`} style={{minHeight:'380px'}}>
                          <div className="absolute top-4 left-4 flex gap-2">
                            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${isDark ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>Vector SVG</span>
                            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>High Resolution</span>
                          </div>
                          <div className="w-full max-w-xs aspect-square flex items-center justify-center relative">
                            <div className={`absolute inset-0 rounded-3xl border-2 border-dashed ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
                            <div className="relative z-10 p-8 w-full h-full flex items-center justify-center">
                              <SVGPreview config={stampConfig} ref={svgRef} onUpdateConfig={(u) => setStampConfig(prev => ({ ...prev, ...u }))} />
                            </div>
                          </div>
                        </div>

                        {/* Download */}
                        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Export Stamp</h4>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Ready</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { format: 'svg' as const, Icon: FileType, label: 'SVG', desc: 'Vector', hover: 'hover:border-blue-400 text-blue-600' },
                              { format: 'png' as const, Icon: ImageIcon, label: 'PNG', desc: '2000×2000', hover: 'hover:border-emerald-400 text-emerald-600' },
                              { format: 'pdf' as const, Icon: FileIcon, label: 'PDF', desc: 'Print', hover: 'hover:border-orange-400 text-orange-600' },
                            ].map(({ format, Icon, label, desc, hover }) => (
                              <button key={format} onClick={() => downloadStamp(format)}
                                className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all group ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-transparent'} ${hover}`}>
                                <Icon size={22} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[11px] font-black uppercase">{label}</span>
                                <span className={`text-[9px] font-bold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => { appStats.recordStampCreated(`${stampConfig.primaryText} stamp designed`); nav('apply-stamp'); }}
                            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-100 dark:shadow-none hover:scale-[1.02] active:scale-95">
                            <FileText size={18} /> Apply to PDF
                          </button>
                          <button onClick={() => { appStats.recordStampCreated(`${stampConfig.primaryText} stamp designed`); setOpenedFromSignCenter(true); nav('esign'); }}
                            className={`flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-lg ${isDark ? 'bg-slate-800 border border-slate-700 text-white hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                            <Layers size={18} className="text-blue-400" /> Bulk Stamp
                          </button>
                        </div>
                        <button onClick={() => nav('convert')}
                          className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-sm transition-all hover:scale-[1.02] active:scale-95 border-2 ${isDark ? 'bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                          <Camera size={18} className="text-blue-600" /> AI Scan & Vectorize Existing Stamp
                        </button>
                        {openedFromSignCenter && (
                          <button onClick={() => { nav('esign'); setOpenedFromSignCenter(false); }}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 px-6 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all active:scale-95">
                            <CheckCircle2 size={18} /> Apply to Document & Return
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'esign' && (
                  <DocuSealSignCenter stampConfig={stampConfig} onOpenStudio={(fieldId) => { setOpenedFromSignCenter(true); setPendingStampFieldId(fieldId || null); nav('stamp-studio'); }} pendingStampFieldId={pendingStampFieldId} onClearPendingField={() => setPendingStampFieldId(null)} isActive={activeTab === 'esign'} />
                )}
                {activeTab === 'pdf-forge' && <PDFTools />}
                {activeTab === 'qr-tracker' && <EmployeeQRTracker />}
                {activeTab === 'social-hub' && <SocialHub />}
                {activeTab === 'templates' && (
                  <div className="max-w-7xl mx-auto py-8">
                    <h2 className="text-3xl font-black tracking-tighter mb-1">Authentic Templates</h2>
                    <p className={`font-medium mb-10 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Professionally captured from real Kenyan rubber stamp samples.</p>
                    <TemplateLibrary onSelect={handleTemplateSelect} customTemplates={customTemplates} />
                  </div>
                )}
                {activeTab === 'apply-stamp' && <StampApplier config={stampConfig} svgRef={svgRef} />}
                {activeTab === 'convert' && (
                  <div className="max-w-4xl mx-auto py-12 text-center">
                    <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-pink-200 dark:shadow-none">
                      <Camera size={40} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">AI Stamp Digitizer</h2>
                    <p className={`text-lg font-medium mb-12 max-w-lg mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Photograph your old rubber stamp — our AI recreates it as a perfect digital vector in seconds.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <label className={`group relative rounded-3xl border-4 border-dashed p-12 text-center hover:border-blue-400 transition-all cursor-pointer ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <ImageIcon size={40} className={`mx-auto mb-4 transition-colors group-hover:text-blue-500 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                        <p className="text-xl font-black mb-1">Upload Photo</p>
                        <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Select from gallery</p>
                      </label>
                      <label className="group relative bg-slate-900 dark:bg-slate-800 text-white rounded-3xl p-12 text-center cursor-pointer overflow-hidden border-4 border-transparent hover:border-blue-500 transition-all">
                        <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <Camera size={40} className="mx-auto text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                        <p className="text-xl font-black mb-1">Live Camera</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Snap a picture now</p>
                      </label>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Hidden SVG ref */}
          <div className="fixed -left-[9999px] -top-[9999px] invisible pointer-events-none">
            <SVGPreview config={stampConfig} ref={svgRef} />
          </div>

          {/* Footer */}
          <footer className={`border-t py-8 px-6 mt-12 ${isDark ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-100'}`}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Plus size={14} /></div>
                <span className="font-black text-base tracking-tighter">Sahihi</span>
              </div>
              <p className={`font-black text-[9px] uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>© 2024 JijiTechy Innovations · LSK Standards Applied</p>
              <div className="flex gap-4">
                <Twitter size={16} className="text-slate-400 hover:text-blue-400 cursor-pointer transition-colors" />
                <Linkedin size={16} className="text-slate-400 hover:text-blue-600 cursor-pointer transition-colors" />
                <Github size={16} className="text-slate-400 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-3xl z-[600] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[64px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
              <div className="p-16 space-y-10">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-[28px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-200 mb-6"><ShieldCheck size={32} /></div>
                  <h3 className="text-4xl font-black tracking-tighter mb-2">{isSignUp ? 'Join Sahihi' : 'Welcome Back'}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{isSignUp ? 'Create your account.' : 'Sign in to your workspace.'}</p>
                </div>
                <form onSubmit={handleDemoLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Email Address</label>
                    <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/20 font-bold" placeholder="counsel@firm.ke" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Password</label>
                    <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/20 font-bold" placeholder="••••••••" />
                  </div>
                  {loginError && <p className="text-red-500 text-sm font-bold text-center">{loginError}</p>}
                  <button type="submit" className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:scale-[1.02] transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95">
                    {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={22} />
                  </button>
                </form>
                <div className="flex items-center justify-between">
                  <button onClick={() => setIsSignUp(!isSignUp)} className="text-slate-400 font-bold hover:text-blue-600 transition-all text-sm">{isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}</button>
                  <button onClick={() => setShowLoginModal(false)} className="p-2 text-slate-300 hover:text-slate-500 transition-colors"><X size={18} /></button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
