import StampKELogo from './components/StampKELogo';
import React, { useState, useRef, useEffect } from 'react';
import {
  Home, Users, DollarSign, FileText, Briefcase, BarChart2, Settings,
  Plus, X, Menu, ChevronRight, ChevronDown, ChevronLeft, Search, Bell, LogOut, User,
  Pen, CheckCircle2, Camera, Wrench, QrCode, Share2, Type, Star, Layout,
  ArrowRight, ShieldCheck, Receipt, FileType, FileIcon, Layers, BookOpen,
  Image as ImageIcon, Save, Sparkles, Sun, Moon, Twitter, Linkedin, Github,
  LayoutDashboard, Bot, Globe, Mic, Download, Eye
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
import StampStudio from './components/StampStudio';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import SmartInvoice from './components/SmartInvoice';
import DocumentsHub from './components/DocumentsHub';
import VirtualAssistants from './components/VirtualAssistants';
import AISummarizer from './components/AISummarizer';
import AdminPanel from './components/AdminPanel';
import ActivityLog from './components/ActivityLog';
import SettingsPanel from './components/SettingsPanel';
import WorkerPortal from './components/WorkerPortal';
import WorkerApp from './components/WorkerApp';
import JobsLandingPage from './components/JobsLandingPage';
import TrialBanner from './components/TrialBanner';
import SuperAdminPanel from './components/SuperAdminPanel';
import PricingPage from './components/PricingPage';
import PublicSignerPage from './components/PublicSignerPage';
import PaywallModal from './components/PaywallModal';
import { checkFeatureAccess, markTrialUsed } from './hooks/useAccessControl';
import type { FeatureKey } from './hooks/useAccessControl';
import { analyzeStampImage } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { useStampStore } from './store';
import { useAppStats } from './appStatsStore';
// ─── Navigation Model (business-owner language) ──────────────────────────────
type MainSection = 'home' | 'sign-docs' | 'invoicing' | 'documents' | 'assistants' | 'settings';
type SubView =
  | 'dashboard'
  | 'money-invoices' | 'money-payments' | 'money-unpaid' | 'money-create'
  | 'invoicing-invoices' | 'invoicing-payments' | 'invoicing-unpaid' | 'invoicing-create'
  | 'sign-esign' | 'sign-stamps' | 'sign-applier' | 'sign-templates' | 'sign-ai-scan'
  | 'assistants-browse' | 'assistants-requests' | 'assistants-active' | 'assistants-history'
  | 'documents-create' | 'documents-templates' | 'documents-esign' | 'documents-stamps' | 'documents-pdf' | 'documents-stamp-applier' 
  | 'ai-summarizer' | 'ai-digitizer' | 'ai-translate'
  | 'work-find' | 'work-my-workers' | 'work-active' | 'work-completed' | 'work-tracking'
  | 'activity-all' | 'activity-notifications'
  | 'settings-profile' | 'settings-business' | 'pricing'
  | 'admin-panel' | 'worker-portal'
  | 'landing';

// Kept for compatibility with child components that use old tab names
type LegacyTab = 'stamp-studio' | 'esign' | 'dashboard' | 'pdf-forge' | 'convert' | 'apply-stamp' | 'templates' | 'qr-tracker' | 'social-hub' | 'landing' | 'smart-invoice';


// Demo accounts removed — real authentication only

// Admin nav item injected below based on role
const NAV_ITEMS: { id: MainSection; label: string; icon: React.ComponentType<any>; emoji: string }[] = [
  { id: 'home',       label: 'Home',                icon: Home,       emoji: '🏠' },
  { id: 'sign-docs',  label: 'eSign & Stamps',      icon: Pen,    emoji: '✍️' },
  { id: 'invoicing',  label: 'Smart Invoice',       icon: Receipt,    emoji: '💰' },
  { id: 'assistants', label: 'Virtual Assistants',  icon: Bot,        emoji: '🤖' },
  { id: 'documents',  label: 'Document Studio',     icon: FileText,   emoji: '📄' },
  { id: 'settings',   label: 'Settings',            icon: Settings,   emoji: '⚙️' },
];

const SUB_MENUS: Record<MainSection, { id: SubView; label: string; desc?: string; locked?: boolean }[]> = {
  home: [],
  'sign-docs': [
    { id: 'sign-esign',     label: '✍️ eSign',           desc: 'Collect legally binding signatures' },
    { id: 'sign-stamps',    label: '🖋 Stamp Designer',   desc: 'Design digital stamps' },
    { id: 'sign-applier',   label: '📄 Apply Stamp',      desc: 'Stamp a PDF document' },
    { id: 'sign-templates', label: '📂 Templates',        desc: 'Stamp & document templates', locked: true },
  ],
  documents: [
    { id: 'documents-pdf',            label: '📑 PDF Editor',       desc: 'Edit & fill PDF files' },
    { id: 'ai-summarizer',            label: '🎙 Transcriber',   desc: 'AI Audio & Document Transcriber' },
    { id: 'ai-translate' as SubView,  label: '🌍 PDF Translator', desc: 'AI-powered document translation' },
    { id: 'ai-digitizer' as SubView,  label: '📸 Stamp Digitizer', desc: 'Convert photo to digital stamp' },
  ],
  assistants: [
    { id: 'assistants-browse',   label: '🔍 Browse',        desc: 'Find virtual assistants' },
    { id: 'assistants-requests', label: '📑 My Requests',    desc: 'Your errand requests' },
    { id: 'assistants-active',   label: '🏃 Active',         desc: 'Ongoing tasks' },
    { id: 'assistants-history',  label: '✅ History',        desc: 'Completed errands' },
  ],
  settings: [
    { id: 'settings-profile',  label: 'My Profile',       desc: 'Account details' },
    { id: 'settings-business', label: 'Business Info',    desc: 'Company & billing details' },
    { id: 'admin-panel',       label: '🛡 Admin Panel',   desc: 'Platform management' },
  ],
};

// ─── Create Quick-Action items ────────────────────────────────────────────────
const CREATE_ACTIONS = [
  { label: 'Sign Document',    sub: 'sign-esign' as SubView,         section: 'sign-docs' as MainSection,   emoji: '✍️' },
  { label: 'Design Stamp',     sub: 'sign-stamps' as SubView,        section: 'sign-docs' as MainSection,   emoji: '🖋️' },
  { label: 'Edit PDF',         sub: 'documents-pdf' as SubView,      section: 'documents' as MainSection,   emoji: '📑' },
  { label: 'Transcribe Audio', sub: 'ai-summarizer' as SubView,      section: 'documents' as MainSection,   emoji: '🎙️' },
  { label: 'Create Invoice',   sub: 'invoicing-create' as SubView,   section: 'invoicing' as MainSection,   emoji: '🧾' },
  { label: 'Virtual Assistant', sub: 'assistants-browse' as SubView, section: 'assistants' as MainSection,  emoji: '🤖' },
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
  // Helper to get initial state from localStorage
  const getSaved = (key: string, def: string) => localStorage.getItem(key) || def;

  const [activeSection, setActiveSection] = useState<MainSection>(() => getSaved('tomo_activeSection', 'home') as MainSection);
  const [activeView, setActiveView] = useState<SubView>(() => getSaved('tomo_activeView', 'landing') as SubView);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') || 'dark') as 'light' | 'dark');
  const { config: stampConfig, setConfig: setStampConfig, customTemplates, removeCustomTemplate } = useStampStore();
  const [notifications, setNotifications] = useState<{ id: string; title: string; body: string; read: boolean; createdAt: string; link?: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [loginEmail, setLoginEmail] = useState('hempstonetinga@gmail.com');
  const [loginPassword, setLoginPassword] = useState('@Outlier12');
  const [loginError, setLoginError] = useState('');
  const [signUpName, setSignUpName] = useState('Hempstone Tinga');
  const [user, setUser] = useState<{ name: string; email: string; role?: string; plan?: string; trialActive?: boolean; trialDaysLeft?: number; adminPermissions?: string[]; emailVerified?: boolean; adminApproved?: boolean; approvalExpiresAt?: string } | null>(null);
  const [freeUsage, setFreeUsage] = useState({ esign: { used:0, limit:1, remaining:1 }, stamp: { used:0, limit:1, remaining:1 }, invoice: { used:0, limit:1, remaining:1 }, pdf: { used:0, limit:1, remaining:1 }, summarizer: { used:0, limit:1, remaining:1 }, assistant: { used:0, limit:1, remaining:1 }, scrape: { used:0, limit:1, remaining:1 }, isPaid: false });
  // ── Paywall state ─────────────────────────────────────────────────────────
  const [paywallFeature, setPaywallFeature] = useState<FeatureKey | null>(null);
  const showPaywall = (feature: FeatureKey) => setPaywallFeature(feature);
  const hidePaywall = () => setPaywallFeature(null);
  // Derive user access object for checkFeatureAccess
  const userAccess = {
    plan: user?.plan,
    adminApproved: user?.adminApproved || false,
    approvalExpiresAt: user?.approvalExpiresAt,
    trialUsed: localStorage.getItem('stampke_trial_used') === 'true',
  };
  const getStampAccess = () => checkFeatureAccess('stamp_design', userAccess).status;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pendingStampFieldId, setPendingStampFieldId] = useState<string | null>(null);
  const [openedFromSignCenter, setOpenedFromSignCenter] = useState(false);
  const [openedFromPDFEditor, setOpenedFromPDFEditor] = useState(false);
  const [selectedStampElement, setSelectedStampElement] = useState<string>('frame');
  const appStats = useAppStats();
  const svgRef = useRef<SVGSVGElement>(null);

  // Derived values
  const unreadCount = notifications.filter(n => !n.read).length;
  const userRole = user?.role || 'business';
  const isDark = theme === 'dark';

  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const token = localStorage.getItem('tomo_token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/notification/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setNotifications(data.result);
    } catch (err) { console.error('[Notifications] Fetch failed:', err); }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
      const timer = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(timer);
    }
  }, [isLoggedIn]);

  const markNotificationRead = async (id: string) => {
    try {
      const token = localStorage.getItem('tomo_token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await fetch(`${apiUrl}/api/notification/read/${id}`, { 
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) { console.error('[Notifications] Mark read failed:', err); }
  };


  // ── Compat nav helper for child components that use old tab names ─────────
  const navLegacy = (tab: LegacyTab | string) => {
    const map: Record<string, { section: MainSection; view: SubView }> = {
      'dashboard':    { section: 'home',      view: 'dashboard' },
      'stamp-studio': { section: 'sign-docs', view: 'sign-stamps' },
      'esign':        { section: 'sign-docs', view: 'sign-esign' },
      'apply-stamp':  { section: 'sign-docs', view: 'sign-applier' },
      'convert':      { section: 'documents', view: 'ai-digitizer' },
      'pdf-forge':    { section: 'documents', view: 'documents-pdf' },
      'templates':    { section: 'sign-docs', view: 'sign-templates' },
      'smart-invoice':{ section: 'invoicing', view: 'invoicing-invoices' },
      'landing':      { section: 'home',      view: 'landing' },
      'admin':        { section: 'settings',  view: 'admin-panel' },
      'worker-portal':{ section: 'settings',  view: 'worker-portal' },
    };
    const target = map[tab];
    if (target) { setActiveSection(target.section); setActiveView(target.view); }
  };

  const goTo = (section: MainSection, view?: SubView) => {
    setActiveSection(section);
    if (view) {
      setActiveView(view);
      localStorage.setItem('tomo_activeView', view);
    }
    else if (section === 'home') setActiveView('dashboard');
    else if (section === 'documents') setActiveView('documents-pdf');
    else if (SUB_MENUS[section] && SUB_MENUS[section].length > 0) setActiveView(SUB_MENUS[section][0].id);
    else setActiveView(section as any);
    
    // Auto-minimize sidebar for features (any non-home section)
    setIsSidebarMinimized(section !== 'home');
    
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

  // Removed redundant template loading, now handled by useStampStore

  // Handle OAuth redirect responses (?google_auth=, ?facebook_auth=, ?auth_error=, ?verified=)
  useEffect(() => {
    const params       = new URLSearchParams(window.location.search);
    const googleAuth   = params.get('google_auth');
    const facebookAuth = params.get('facebook_auth');
    const authError    = params.get('auth_error');
    const verified     = params.get('verified');

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
        localStorage.setItem('tomo_user_plan', u.plan || 'trial');
        setUser({ 
          name: u.name, email: u.email, role: u.role, plan: u.plan, 
          trialActive: u.trialActive, trialDaysLeft: u.trialDaysLeft, 
          adminPermissions: u.adminPermissions || [], 
          adminApproved: u.adminApproved || false, 
          approvalExpiresAt: u.approvalExpiresAt 
        });
        setIsLoggedIn(true);
        setShowLoginModal(false);

        if (u.isNew) {
           setTimeout(() => {
             alert('Welcome to StampKE! 🚀 Your account is verified and your Starter Trial is active.\n\nEnjoy unlimited VA access and 1 free Sign/Stamp during your 7-day trial.');
           }, 500);
        }

        // Always go to home (dashboard) after Google login
        goTo('home');
      } catch (e) {
        setLoginError('Google sign-in failed. Please try email login.');
        setShowLoginModal(true);
      }
      return;
    }

    if (facebookAuth) {
      window.history.replaceState({}, '', window.location.pathname);
      try {
        const u = JSON.parse(decodeURIComponent(facebookAuth));
        localStorage.setItem('tomo_token', u.token);
        localStorage.setItem('tomo_user_plan', u.plan || 'trial');
        setUser({ name: u.name, email: u.email, role: u.role, plan: u.plan, trialActive: u.trialActive, trialDaysLeft: u.trialDaysLeft, adminPermissions: u.adminPermissions || [], adminApproved: u.adminApproved || false, approvalExpiresAt: u.approvalExpiresAt });
        setIsLoggedIn(true);
        setShowLoginModal(false);
        // Always go to home after Facebook login
        goTo('home');
      } catch (e) {
        setLoginError('Facebook sign-in failed. Please try email login.');
        setShowLoginModal(true);
      }
      return;
    }
  }, []);

  // Restore session on reload — but NOT if user explicitly logged out
  useEffect(() => {
    // If user deliberately logged out in this tab, don't restore
    if (sessionStorage.getItem('logged_out') === '1') return;
    const token = localStorage.getItem('tomo_token');
    if (!token) {
      setActiveView('landing');
      return;
    }
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
          // Fetch free usage counts
          const apiUrl2 = (import.meta as any).env?.VITE_API_URL || '';
          fetch(`${apiUrl2}/api/user/usage`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(d => { if (d.success) setFreeUsage(d.result); }).catch(()=>{});
          // Fetch templates
          useStampStore.getState().fetchTemplates();

          // Restore view from localStorage if it's not landing, otherwise default to dashboard
          setActiveView(v => {
            const savedView = localStorage.getItem('tomo_activeView');
            if (savedView && savedView !== 'landing') {
              const savedSection = localStorage.getItem('tomo_activeSection') as MainSection;
              if (savedSection) setActiveSection(savedSection);
              return savedView as SubView;
            }
            if (u.role === 'superadmin' || u.role === 'admin') { setActiveSection('settings'); return 'admin-panel'; }
            if (u.role === 'worker') { setActiveSection('settings'); return 'worker-portal'; }
            setActiveSection('home'); return 'dashboard';
          });
        } else {
          localStorage.removeItem('tomo_token');
          setIsLoggedIn(false);
          setActiveView('landing');
        }
      })
      .catch(() => {
        localStorage.removeItem('tomo_token');
        setIsLoggedIn(false);
        setActiveView('landing');
      });
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

  // Persist navigation state
  useEffect(() => {
    localStorage.setItem('tomo_activeSection', activeSection);
    localStorage.setItem('tomo_activeView', activeView);
  }, [activeSection, activeView]);

  // handleSaveTemplate removed — StampStudio now correctly uses store.saveTemplateRemote

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const apiUrl = import.meta.env.VITE_API_URL || '';

    // SIGN UP flow
    if (isSignUp) {
      if (!signUpName.trim()) { setLoginError('Please enter your full name.'); return; }
      try {
        const role = 'business';
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
        localStorage.setItem('tomo_user_plan', u.plan || 'trial');
            setUser({ name: u.name, email: u.email, role: u.role, plan: u.plan,
              trialActive: u.trialActive, trialDaysLeft: u.trialDaysLeft,
              adminPermissions: u.adminPermissions });
            setIsLoggedIn(true); setShowLoginModal(false); setLoginError('');
            goTo('home');
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
        localStorage.setItem('tomo_user_plan', u.plan || 'trial');
          setUser({ name: u.name, email: u.email, role: u.role, plan: u.plan, trialActive: u.trialActive, trialDaysLeft: u.trialDaysLeft, adminPermissions: u.adminPermissions, adminApproved: u.adminApproved || false, approvalExpiresAt: u.approvalExpiresAt });
          setIsLoggedIn(true); setShowLoginModal(false); setLoginError('');
          
          // Fetch templates on login
          useStampStore.getState().fetchTemplates();

          // After login, favor Home/Dashboard
          goTo('home');
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

  const handleLogout = () => {
    // Clear ALL session data so page refresh does NOT restore the session
    localStorage.removeItem('tomo_token');
    localStorage.removeItem('tomo_profile');
    localStorage.removeItem('tomo_activeSection');
    localStorage.removeItem('tomo_activeView');
    sessionStorage.clear();
    setUser(null);
    setIsLoggedIn(false);
    setActiveSection('home');
    setActiveView('landing');
    setShowUserMenu(false);
    setIsSidebarOpen(false);
  };


  // ── Trial usage tracking: 5 free uses per feature (per user, persisted) ──
  const getUserUsage = () => {
    if (!user?.email) return {};
    try { return JSON.parse(localStorage.getItem(`usage_${user.email}`) || '{}'); } catch { return {}; }
  };
  const bumpUsage = (key: string) => {
    if (!user?.email) return;
    const u = getUserUsage();
    u[key] = (u[key] || 0) + 1;
    localStorage.setItem(`usage_${user.email}`, JSON.stringify(u));
  };
  const FREE_LIMITS: Record<string, number> = { esign: 5, stamp: 5, invoice: 5, pdf: 5, summarizer: 5, assistant: 999, scrape: 5 };
  const hasPaidPlan = user?.plan === 'starter' || user?.plan === 'pro' || user?.plan === 'business';
  const withinFreeLimit = (key: string) => {
    if (userRole === 'superadmin' || hasPaidPlan) return true;
    // VA is unlimited
    if (key === 'assistant') return true;
    const usage = getUserUsage();
    const limit = FREE_LIMITS[key] || 5;
    return (usage[key] || 0) < limit;
  };
  const usageLeft = (key: string) => {
    if (userRole === 'superadmin' || hasPaidPlan) return 999;
    if (key === 'assistant') return 999;
    const usage = getUserUsage();
    const limit = FREE_LIMITS[key] || 5;
    return Math.max(0, limit - (usage[key] || 0));
  };

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

  // Legacy file upload removed - digitizer moved to StampStudio

  // ── Role-based feature gate ─────────────────────────────────────────────────
  const canAccess = (feature: string): boolean => {
    // Superadmin — no restrictions ever
    if (userRole === 'superadmin') return true;

    // Admin — based on granted permissions
    if (userRole === 'admin') {
      const perms = user?.adminPermissions || [];
      if (['assistants-browse','assistants-requests','assistants-active','assistants-history'].includes(feature)) return perms.includes('jobs');
      if (['scrapping-dashboard','scrapping-new','scrapping-results'].includes(feature)) return perms.includes('clients');
      if (['money-invoices','money-payments','money-unpaid','money-create','invoicing-invoices','invoicing-create'].includes(feature)) return perms.includes('invoices');
      return true;
    }

    // Worker — very limited
    if (userRole === 'worker') return false; // workers sign up via employer platform only

    // Business users — check plan (3-tier: starter, pro, business)
    const plan = user?.plan;
    const isStarter  = plan === 'starter' || plan === 'pro' || plan === 'business';
    const isPro      = plan === 'pro' || plan === 'business';
    const isBusiness = plan === 'business';

    // Starter tier features (KES 1,000): eSign & Stamps
    const starterFeatures = [
      'sign-esign', 'sign-stamps', 'sign-applier', 'sign-templates', 'sign-ai-scan',
      'documents-esign', 'documents-stamps', 'documents-stamp-applier',
    ];
    if (starterFeatures.includes(feature)) return isStarter;

    // Professional tier features (KES 2,500): + Invoice, PDF, AI Summarizer
    const proFeatures = [
      'invoicing-invoices', 'invoicing-create', 'invoicing-payments', 'invoicing-unpaid',
      'money-invoices', 'money-create', 'money-payments', 'money-unpaid',
      'documents-pdf', 'documents-create', 'documents-templates',
      'ai-summarizer', 'ai-digitizer',
    ];
    if (proFeatures.includes(feature)) return isPro;

    // Business tier features (KES 7,500): + Virtual Assistants, Scrapping
    const businessFeatures = [
      'assistants-browse', 'assistants-requests', 'assistants-active', 'assistants-history',
      'scrapping-dashboard', 'scrapping-new', 'scrapping-results',
    ];
    if (businessFeatures.includes(feature)) return isBusiness;

    // Default: require any paid plan
    return isStarter;
  };

  // ── Trial usage: 1 free trial per feature, then paywall ─────────────────────
  const hasTrialLeft = (featureKey: string): boolean => {
    if (userRole === 'superadmin') return true;
    if (user?.plan) return true; // paid users bypass trial
    const usage = getUserUsage();
    return (usage[featureKey] || 0) < 1;
  };

  // ── Locked feature placeholder — triggers PaywallModal ─────────────────────
  const renderLocked = (message?: string, feature: FeatureKey = 'esign') => {
    // Auto-show paywall modal for better UX
    setTimeout(() => showPaywall(feature), 50);
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-5 px-4">
        <div className="w-16 h-16 bg-[#161b22] border border-[#30363d] rounded-2xl flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div className="max-w-sm">
          <h3 className="text-lg font-bold text-white mb-2">⚡ Upgrade Required</h3>
          <p className="text-sm text-[#8b949e] mb-4 leading-relaxed">
            {message || 'This feature requires a paid plan. Upgrade to unlock all StampKE tools.'}
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={() => showPaywall(feature)}
              className="px-6 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">
              View Plans & Upgrade
            </button>
            <p className="text-xs text-[#8b949e]">Plans from KES 1,000/month · Cancel anytime</p>
          </div>
        </div>
      </div>
    );
  };

  // ── Auth Modal ──────────────────────────────────────────────────────────────
  const handleGoogleSignIn = () => {
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) { setLoginError('Google Sign-In is not yet configured. Contact support at support@stampke.co.ke'); return; }
    setLoginError('');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: window.location.origin + '/api/auth/google/callback',
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state: JSON.stringify({ landingType: 'main', signUpRole: 'business' }),
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  const renderAuthModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[600] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }}
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Top gradient header */}
        <div className="bg-gradient-to-br from-[#1a73e8] to-[#1557b0] px-8 pt-10 pb-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 70% 20%, white 1px, transparent 1px)',backgroundSize:'20px 20px'}} />
          {/* StampKE logo */}
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10">
            <svg viewBox="0 0 32 32" width="36" height="36" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#1a73e8" strokeWidth="2.5"/>
              <circle cx="16" cy="16" r="9" stroke="#ea4335" strokeWidth="2"/>
              <circle cx="16" cy="16" r="4" fill="#34a853"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-1 relative z-10">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h3>
          <p className="text-blue-100 text-xs relative z-10">
            {isSignUp ? 'Stamps, eSign & Invoicing for Kenya' : 'Sign in to StampKE'}
          </p>
        </div>

        <div className="px-8 py-10 space-y-6">
          {/* Google Sign-In — primary and only method */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-200 hover:border-[#1a73e8] hover:bg-blue-50 text-gray-700 rounded-2xl text-base font-bold transition-all shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="text-red-500 text-xs mt-0.5">⚠</span>
              <p className="text-red-600 text-xs leading-relaxed">{loginError}</p>
            </div>
          )}

          <p className="text-[10px] text-gray-400 text-center leading-relaxed px-4">
            By continuing, you agree to our{' '}
            <a href="#" className="underline hover:text-gray-600">Terms of Service</a> and{' '}
            <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
          </p>
        </div>

        <div className="px-8 pb-6 flex items-center justify-between">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-[#1a73e8] text-xs font-semibold hover:underline">
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
          <button onClick={() => { setShowLoginModal(false); setLoginError(''); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
      </motion.div>
    </div>
  );
  // ─── PUBLIC SIGNER/VIEWER PAGES (no auth required) ─────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const publicToken = urlParams.get('token');
  const publicEnvelopeId = urlParams.get('envelope');
  const isSignRoute = window.location.pathname === '/sign' || window.location.search.includes('sign=1');
  const isViewRoute = window.location.pathname === '/view' || window.location.search.includes('view=1');

  if (publicToken && publicEnvelopeId && (isSignRoute || isViewRoute)) {
    return (
      <PublicSignerPage
        mode={isViewRoute ? 'view' : 'sign'}
        token={publicToken}
        envelopeId={publicEnvelopeId}
      />
    );
  }

  // ─── WORKER APP — completely separate, no SaaS UI ──────────────────────────
  // ─── LANDING PAGE ROUTER ────────────────────────────────────────────────────
  if (activeView === 'landing') {
    return (
      <>
        <LandingPage onGetStarted={() => { if (isLoggedIn) goTo('home'); else { setIsSignUp(true); setShowLoginModal(true); } }} onSignIn={() => { setIsSignUp(false); setShowLoginModal(true); }} theme={theme} />
        <AnimatePresence>
          {showLoginModal && renderAuthModal()}
        </AnimatePresence>
      </>
    );
  }

  // ─── MAIN APP SHELL ───────────────────────────────────────────────────────

  const renderView_stamps = (autoDigitize = false) => {
    return (
      <StampStudio 
        onClose={() => goTo('home')} 
        accessStatus={getStampAccess()}
        onPaywallTrigger={() => showPaywall('stamp_design')}
        autoDigitize={autoDigitize}
        onApply={(s) => {
          // Mark trial as used when exporting/applying for the first time
          if (getStampAccess() === 'trial_available') {
            markTrialUsed();
          }
          if (pendingStampFieldId) {
             // Handle apply logic for specific fields
          } else {
             goTo('sign-docs', 'sign-applier');
          }
        }}
      />
    );
  };


  const renderView = () => {
    // HOME
    if (activeView === 'dashboard' || activeSection === 'home') {
      return <Dashboard userName={user?.name} onNavigate={navLegacy as any} theme={theme} />;
    }

    // ── Scrapping Tool ─────────────────────────────────────────────────────────
    // ── Pricing Page ──
    if (activeView === 'pricing') return <PricingPage userEmail={user?.email} currentPlan={user?.plan || 'trial'} onClose={() => goTo('home')} />;

    // ── Smart Invoice ────────────────────────────────────────────────────────────
    if (['invoicing-invoices','invoicing-payments','invoicing-unpaid','invoicing-create',
         'money-invoices','money-payments','money-unpaid','money-create'].includes(activeView)) {
      if (!canAccess('invoicing-invoices')) return renderLocked('Smart Invoice & Payments requires a Starter plan (KES 1,500/mo)', 'invoicing');
      return <SmartInvoice />;
    }

    // ── eSign & Stamps ──────────────────────────────────────────────────────────
    if (activeView === 'sign-esign') {
      if (!withinFreeLimit('esign')) return renderLocked('Toho eSign requires a Starter plan (KES 1,000/mo)', 'esign');
      return <TohoSignCenter
        stampConfig={stampConfig}
        onOpenStudio={(fieldId) => { setOpenedFromSignCenter(true); setPendingStampFieldId(fieldId || null); goTo('sign-docs', 'sign-stamps'); }}
        pendingStampFieldId={pendingStampFieldId}
        onClearPendingField={() => setPendingStampFieldId(null)}
        isActive
        isPaid={canAccess('sign-esign')}
        onUpgrade={() => goTo('settings', 'pricing')}
      />;
    }
    if (activeView === 'sign-stamps')    return renderView_stamps();
    if (activeView === 'sign-applier')   return <StampApplier config={stampConfig} svgRef={svgRef} onGoToStudio={() => goTo('sign-docs','sign-stamps')} userStampCount={freeUsage.stamp.used} />;
    if (activeView === 'sign-templates') { if (!canAccess('sign-templates')) return renderLocked('Template Library requires a Starter plan (KES 1,000/mo)', 'templates'); return <div className="max-w-5xl mx-auto py-6"><h2 className="text-2xl font-bold text-white mb-8">Your Templates</h2><TemplateLibrary onSelect={handleTemplateSelect} onRemove={removeCustomTemplate} customTemplates={customTemplates} onCreateNew={() => goTo('sign-docs','sign-stamps')} /></div>; }
    if (activeView === 'sign-ai-scan' || activeView === 'ai-digitizer')  { 
      if (!canAccess('ai-digitizer')) return renderLocked('AI Stamp Digitizer requires a Professional plan (KES 3,000/mo)', 'ai_digitizer'); 
      return renderView_stamps(true); 
    }

    if (activeView === 'documents-pdf' || activeView === 'ai-summarizer') {
      if (!canAccess('ai-summarizer')) return renderLocked('AI Transcriber requires a Professional plan (KES 2,500/mo)', 'ai_summarizer');
      return <AISummarizer />;
    }
    if (activeView === 'ai-translate') { if (!canAccess('ai-translate')) return renderLocked('AI PDF Translator requires a Professional plan', 'ai_summarizer'); return <PDFTools />; }
    if (activeView === 'documents-create') return <DocumentsHub />;

    // STAMP STUDIO (documents-stamps) — reuses the same 3-column layout
    if (activeView === 'documents-stamps') return renderView_stamps();

    // ── Virtual Assistants ────────────────────────────────────────────────────────

    if (activeView === 'assistants-browse' || activeView === 'assistants-requests' || activeView === 'assistants-active' || activeView === 'assistants-history') {
      if (!canAccess('assistants-browse')) return renderLocked('Virtual Assistants requires a Business plan (KES 7,500/mo)', 'virtual_assistants');
      return <VirtualAssistants initialView={activeView === 'assistants-requests' ? 'requests' : activeView === 'assistants-active' ? 'active' : activeView === 'assistants-history' ? 'history' : 'browse'} onUpgrade={() => goTo('home', 'pricing')} />;
    }

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

  // Detect if stamp studio is active (hide sidebar for full-width editor)
  const isStampStudio = activeView === 'sign-stamps' || activeView === 'documents-stamps';

  // Hide sidebar completely when ANY feature section is active (not home)
  const isFeatureActive = activeSection !== 'home';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0d1117] text-white">
      {/* Email verification reminder — shown only if unverified, dismissible */}
      {isLoggedIn && user && !user.emailVerified && !isStampStudio && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-[#1f6feb]/10 border-b border-[#1f6feb]/20 text-xs">
          <span className="text-[#58a6ff]">📧 Check your email to verify your account.</span>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">

      {/* ── Desktop Sidebar — accordion (hidden when a feature is active) ── */}
      {!isFeatureActive && <aside className={`hidden lg:flex ${isSidebarMinimized ? 'w-[72px]' : 'w-64'} flex-col bg-[#161b22] border-r border-[#30363d] flex-shrink-0 z-[100] transition-all duration-300 overflow-hidden`}>
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between p-4 mb-2">
          {!isSidebarMinimized && (
            <button onClick={() => goTo('home')} className="flex items-center gap-3 hover:bg-[#21262d] p-1 rounded-lg transition-colors overflow-hidden">
              <StampKELogo size={32} />
              <span className="text-lg font-black tracking-tight text-white whitespace-nowrap">StampKE</span>
            </button>
          )}
          {isSidebarMinimized && (
             <button onClick={() => goTo('home')} className="mx-auto hover:bg-[#21262d] p-1 rounded-lg transition-colors">
               <StampKELogo size={32} />
             </button>
          )}
          <button 
            onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
            className={`p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] hover:text-white transition-colors ${isSidebarMinimized ? 'mx-auto mt-2' : ''}`}
            title={isSidebarMinimized ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarMinimized ? <Menu size={20} /> : <X size={18} />}
          </button>
        </div>

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
                  className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all ${isSidebarMinimized ? 'justify-center py-3' : 'gap-3 px-3 py-2.5'} ${isActive ? 'bg-[#21262d] text-white' : 'text-[#8b949e] hover:bg-[#21262d] hover:text-white'}`}>
                  <item.icon size={isSidebarMinimized ? 20 : 16} className={isActive ? 'text-[#1f6feb]' : ''} />
                  {!isSidebarMinimized && <span className="flex-1 text-left">{item.label}</span>}
                  {!isSidebarMinimized && subs.length > 0 && (
                    <ChevronDown size={13} className={`ml-auto text-[#8b949e] transition-transform ${isActive ? 'rotate-180' : ''}`} />
                  )}
                </button>
                {/* Subitems — shown inline when section is active and not minimized */}
                {isActive && subs.length > 0 && !isSidebarMinimized && (
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
              {!isSidebarMinimized ? (
                <>
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
                </>
              ) : (
                <button
                  onClick={() => setIsSidebarMinimized(false)}
                  className="w-12 h-12 mx-auto rounded-xl bg-[#1f6feb] flex items-center justify-center text-white text-sm font-bold shadow-lg hover:scale-105 transition-transform"
                  title={user?.name}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </button>
              )}
            </div>
          ) : (
            <button onClick={() => { setIsSignUp(false); setShowLoginModal(true); }} className="w-full flex items-center justify-center gap-2 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-xs font-bold transition-colors">
              <User size={14} /> Sign In
            </button>
          )}
        </div>
      </aside>}

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

        {/* Topbar (hidden in stamp studio — studio has its own header) */}
        {!isStampStudio && <header className="border-b border-[#30363d] bg-[#161b22] flex-shrink-0">
          <div className="px-4 flex items-center justify-between gap-3" style={{ height: 52 }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-[#21262d] rounded-lg text-[#8b949e]"><Menu size={18} /></button>
            {/* Back to Home button — shown when sidebar is hidden */}
            {isFeatureActive && (
              <button onClick={() => goTo('home')} className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#21262d] rounded-xl text-[#8b949e] hover:text-white transition-colors text-xs font-semibold">
                <ChevronLeft size={15} />
                <StampKELogo size={22} />
              </button>
            )}
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
            {/* Notification Bell */}
            {isLoggedIn && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-xl border transition-all ${showNotifications ? 'bg-[#1f6feb] border-[#1f6feb] text-white' : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-white'}`}>
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#161b22] translate-x-1 -translate-y-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      key="notification-dropdown"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden z-[500]">
                    <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
                        <span className="text-sm font-bold text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <button 
                            onClick={async () => { 
                              const token = localStorage.getItem('tomo_token');
                              await fetch('/api/notification/readAll', { 
                                method: 'PATCH',
                                headers: { Authorization: `Bearer ${token}` }
                              }); 
                              fetchNotifications(); 
                            }}
                            className="text-[10px] text-[#1f6feb] hover:underline font-bold uppercase">Mark all read</button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell size={32} className="text-[#30363d] mx-auto mb-2 opacity-20" />
                            <p className="text-xs text-[#8b949e]">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <button
                              key={n._id}
                              onClick={() => { markNotificationRead(n._id); if (n.link) { /* navigate to n.link */ } }}
                              className={`w-full text-left p-3 border-b border-[#30363d] hover:bg-[#21262d] transition-colors flex items-start gap-3 ${!n.read ? 'bg-[#1f6feb]/5' : ''}`}>
                              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                                n.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                n.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-[#1f6feb]/10 text-[#1f6feb]'
                              }`}>
                                {n.type === 'success' ? <CheckCircle2 size={14} /> : n.type === 'warning' ? <Star size={14} /> : <Bell size={14} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold leading-tight ${n.read ? 'text-[#e6edf3]' : 'text-white'}`}>{n.title}</p>
                                <p className="text-[11px] text-[#8b949e] line-clamp-2 mt-0.5">{n.message}</p>
                                <p className="text-[9px] text-[#545d68] mt-1">{new Date(n.createdAt).toLocaleDateString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              {!n.read && <div className="w-2 h-2 rounded-full bg-[#1f6feb] mt-1.5" />}
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

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
            <div className="relative">
              <button
                onClick={() => setShowNotifications(n => !n)}
                className="p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] transition-colors relative"
              >
                <Bell size={15} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-[390]" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-10 w-80 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl z-[400] overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[#21262d]">
                        <span className="text-xs font-black text-white uppercase tracking-widest">Notifications</span>
                        {notifications.length > 0 && (
                          <button onClick={() => setNotifications(n => n.map(x => ({ ...x, read: true })))} className="text-[10px] text-[#58a6ff] font-bold hover:underline">Mark all read</button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell size={24} className="mx-auto mb-2 text-[#30363d]" />
                            <p className="text-xs text-[#8b949e] font-bold">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <div key={notif.id} onClick={() => { setNotifications(n => n.map(x => x.id === notif.id ? { ...x, read: true } : x)); if (notif.link) navLegacy(notif.link); setShowNotifications(false); }}
                              className={`flex gap-3 px-4 py-3 border-b border-[#21262d]/50 cursor-pointer hover:bg-[#21262d] transition-colors ${!notif.read ? 'bg-[#1f6feb]/5' : ''}`}>
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.read ? 'bg-[#1f6feb]' : 'bg-transparent'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{notif.title}</p>
                                <p className="text-[10px] text-[#8b949e] mt-0.5">{notif.body}</p>
                                <p className="text-[9px] text-[#8b949e]/60 mt-1">{new Date(notif.createdAt).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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
          </div>
          {/* Sub-navigation tabs — shown when sidebar is hidden on desktop */}
          {isFeatureActive && subItems.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 px-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {subItems.map(sub => {
                const isLocked = (sub as any).locked && !canAccess(sub.id);
                return (
                  <button key={sub.id}
                    onClick={() => setActiveView(sub.id as SubView)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                      ${activeView === sub.id
                        ? 'bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/30'
                        : isLocked
                          ? 'text-[#8b949e]/50 hover:bg-[#21262d]/50 border border-transparent'
                          : 'text-[#8b949e] hover:bg-[#21262d] hover:text-white border border-transparent'}`}>
                    <span>{sub.label}</span>
                    {isLocked && <span className="text-[9px]">🔒</span>}
                  </button>
                );
              })}
            </div>
          )}
        </header>}

        {/* Page content */}
        <main className={`flex-1 overflow-hidden bg-[#0d1117] flex flex-col`} onClick={() => showCreate && setShowCreate(false)}>
          <div className="flex-1 overflow-y-auto relative">
            <div className={`${isStampStudio || activeView === 'documents-pdf' || activeView === 'sign-applier' || activeView === 'documents-stamp-applier' || activeView === 'sign-esign' ? '' : 'p-5 md:p-8'} min-h-full flex flex-col`}>
              <AnimatePresence mode="wait">
                <motion.div key={activeView} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {isLoggedIn ? renderView() : (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                      <p className="text-[#8b949e]">Please sign in to access this page.</p>
                      <button onClick={() => { setIsSignUp(false); setShowLoginModal(true); }} className="px-6 py-3 bg-[#1f6feb] text-white rounded-xl font-bold text-sm hover:bg-[#388bfd] transition-colors">Sign In</button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* ── Mobile Bottom Nav (hidden in stamp studio) ── */}
        {!isStampStudio && <nav className="lg:hidden flex border-t border-[#30363d] bg-[#161b22] flex-shrink-0">
          {(['home', 'sign-docs', 'invoicing', 'assistants'] as MainSection[]).map(s => {
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
        </nav>}

        {/* Hidden SVG ref for stamp export */}
        <div className="fixed -left-[9999px] -top-[9999px] invisible pointer-events-none">
          <SVGPreview config={stampConfig} ref={svgRef} />
        </div>
      </div>

      </div>{/* end flex */}
      {/* Login Modal (in-app) */}
      <AnimatePresence>{showLoginModal && renderAuthModal()}</AnimatePresence>

      {/* Paywall Modal */}
      {paywallFeature && (
        <PaywallModal
          feature={paywallFeature}
          status={checkFeatureAccess(paywallFeature, userAccess).status}
          approvalExpiresAt={userAccess.approvalExpiresAt}
          onClose={hidePaywall}
          onPlanSelected={(planId) => {
            hidePaywall();
            goTo('settings', 'pricing');
          }}
          onOneTimePay={() => {
            hidePaywall();
            goTo('settings', 'pricing');
          }}
        />
      )}
    </div>
  );
};

export default App;
