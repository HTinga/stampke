import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  ChevronLeft,
  Image as ImageIcon,
  CheckCircle2,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Camera,
  User,
  PenTool,
  Twitter,
  Linkedin,
  Github,
  FileText,
  Wrench,
  LayoutDashboard,
  Sun,
  Moon,
  ChevronRight,
  Search,
  HardDrive,
  Loader2,
  FileType,
  FileIcon,
  Layers,
  QrCode,
  Share2,
  MessageSquare,
  Mail,
  Send,
  Smartphone,
  Globe,
  Zap,
  MessageCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { StampConfig, StampTemplate, StampShape } from './types';
import { DEFAULT_CONFIG, TEMPLATES } from './constants';
import SVGPreview from './components/SVGPreview';
import TemplateLibrary from './components/TemplateLibrary';
import EditorControls from './components/EditorControls';
import DigitalSignCenter from './components/DigitalSignCenter';
import DocuSealSignCenter from './components/esign/DocuSealSignCenter';
import PDFTools from './components/PDFTools';
import StampApplier from './components/StampApplier';
import QRTracker from './components/QRTracker';
import EmployeeQRTracker from './components/hr/EmployeeQRTracker';
import SocialHub from './components/SocialHub';
import { analyzeStampImage } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { useStampStore } from './src/store';

const NAVIGATION_GROUPS = [
  {
    id: 'apps',
    label: 'Core Workspace',
    items: ['dashboard']
  },
  {
    id: 'authority',
    label: 'Digital Authority',
    items: ['stamp-studio', 'esign', 'apply-stamp', 'convert']
  },
  {
    id: 'productivity',
    label: 'Productivity Suite',
    items: ['pdf-forge', 'templates']
  },
  {
    id: 'management',
    label: 'Enterprise Management',
    items: ['qr-tracker', 'social-hub']
  }
];

const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'SaaS Dashboard', icon: LayoutDashboard },
  { id: 'stamp-studio', label: 'Stamp Designer', icon: PenTool },
  { id: 'esign', label: 'Sign Center', icon: CheckCircle2 },
  { id: 'apply-stamp', label: 'Stamp Applier', icon: FileText },
  { id: 'convert', label: 'AI Scan', icon: Camera },
  { id: 'pdf-forge', label: 'PDF Editor', icon: Wrench },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'qr-tracker', label: 'QR Tracker', icon: QrCode },
  { id: 'social-hub', label: 'Social Hub', icon: Share2 },
];

const BLOG_POSTS = [];
const RESOURCES = [];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stamp-studio' | 'esign' | 'dashboard' | 'pdf-forge' | 'convert' | 'apply-stamp' | 'templates' | 'qr-tracker' | 'social-hub'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { config: stampConfig, setConfig: setStampConfig } = useStampStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'supervisor' | 'staff'>('admin');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [user, setUser] = useState<{name: string, email: string, picture?: string} | null>(null);
  const [pendingStampFieldId, setPendingStampFieldId] = useState<string | null>(null);
  const [openedFromSignCenter, setOpenedFromSignCenter] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<StampTemplate[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const savedTemplates = localStorage.getItem('custom_stamp_templates');
    if (savedTemplates) {
      try {
        setCustomTemplates(JSON.parse(savedTemplates));
      } catch (e) {
        console.error("Failed to load custom templates", e);
      }
    }
  }, []);

  const handleSaveTemplate = () => {
    if (!isLoggedIn) return;
    
    const newTemplate: StampTemplate = {
      id: `custom-${Date.now()}`,
      name: `Custom ${stampConfig.primaryText || 'Stamp'}`,
      category: 'Custom',
      ...stampConfig
    };

    const updatedTemplates = [...customTemplates, newTemplate];
    setCustomTemplates(updatedTemplates);
    localStorage.setItem('custom_stamp_templates', JSON.stringify(updatedTemplates));
    alert("Template saved successfully!");
  };

  useEffect(() => {
    if (activeTab === 'stamp-studio' || activeTab === 'apply-stamp') {
      setIsSidebarOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
    
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setUser(event.data.user);
        setIsLoggedIn(true);
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleGoogleLogin = () => {
    // Disabled as per request
    console.log("Google Login disabled");
  };

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Lenient login for demo/signup
    if (isSignUp || (loginEmail && loginPassword)) {
      setUser({
        name: loginEmail.split('@')[0] || 'User',
        email: loginEmail,
      });
      setIsLoggedIn(true);
      setShowLoginModal(false);
      setLoginError('');
      setActiveTab('stamp-studio');
    } else {
      setLoginError('Please enter your credentials.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
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
    setActiveTab('stamp-studio');
  };

  const handleDownload = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${stampConfig.primaryText.toLowerCase().replace(/\s+/g, '_')}_stamp.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setActiveTab('convert');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const analysis = await analyzeStampImage(base64String);
      if (analysis) {
        setStampConfig(prev => ({
          ...prev,
          shape: analysis.shape === 'OVAL' ? StampShape.OVAL : analysis.shape === 'ROUND' ? StampShape.ROUND : StampShape.RECTANGLE,
          primaryText: analysis.primaryText || prev.primaryText,
          secondaryText: analysis.secondaryText || '',
          centerText: analysis.centerText || '',
          borderColor: analysis.color || prev.borderColor
        }));
        setActiveTab('stamp-studio');
      }
    };
    reader.readAsDataURL(file);
  };

  const downloadStamp = async (format: 'svg' | 'png' | 'pdf', transparent: boolean = true) => {
    if (!svgRef.current) return;

    const fileName = `stamp_${stampConfig.primaryText.toLowerCase().replace(/\s+/g, '_')}`;

    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'png') {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 2000;
      canvas.height = 2000;
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          if (ctx) {
            if (!transparent) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0, 2000, 2000);
            const pngUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = `${fileName}.png`;
            link.click();
          }
        } catch (err) {
          console.error('Error generating PNG:', err);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = (err) => {
        console.error('Error loading image for PNG:', err);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } else if (format === 'pdf') {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 2000;
      canvas.height = 2000;
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, 2000, 2000);
            
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'px',
              format: [2000, 2000]
            });
            
            pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, 2000, 2000);
            pdf.save(`${fileName}.pdf`);
          }
        } catch (err) {
          console.error('Error generating PDF:', err);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = (err) => {
        console.error('Error loading image for PDF:', err);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Persistent Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[100]">
        <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none"><Plus size={24} /></div>
          <h1 className="text-2xl font-black tracking-tighter">Sahihi</h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8">
          {NAVIGATION_GROUPS.map((group) => (
            <div key={group.id} className="space-y-2">
              <h4 className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                {group.label}
              </h4>
              <div className="space-y-1">
                {group.items.map((itemId) => {
                  const item = NAVIGATION_ITEMS.find(i => i.id === itemId);
                  if (!item) return null;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all group ${
                        activeTab === item.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <item.icon size={18} className={activeTab === item.id ? 'text-blue-600' : 'group-hover:text-blue-600'} />
                      <span className="flex-1 text-left text-sm">{item.label}</span>
                      {activeTab === item.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Pro Account</p>
            <p className="text-xs font-bold mb-3">Unlock unlimited processing.</p>
            <button className="w-full bg-slate-900 dark:bg-blue-600 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all">Upgrade</button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[200] flex flex-col"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white p-2 rounded-xl"><Plus size={20} /></div>
                  <h1 className="text-xl font-black tracking-tighter">Sahihi</h1>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-8">
                {NAVIGATION_GROUPS.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <h4 className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                      {group.label}
                    </h4>
                    <div className="space-y-1">
                      {group.items.map((itemId) => {
                        const item = NAVIGATION_ITEMS.find(i => i.id === itemId);
                        if (!item) return null;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id as any);
                              setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all group ${
                              activeTab === item.id 
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <item.icon size={18} className={activeTab === item.id ? 'text-blue-600' : 'group-hover:text-blue-600'} />
                            <span className="flex-1 text-left text-sm">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-50 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
              <ChevronRight size={14} />
              <span className="text-slate-900 dark:text-white capitalize">{activeTab.replace('-', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Search size={14} className="text-slate-400 mr-2" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-xs font-bold w-32 lg:w-48" />
            </div>

            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 dark:text-slate-400"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-black">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{userRole}</p>
                </div>
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-lg border-2 border-blue-600 p-0.5" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                    {user?.name.charAt(0)}
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="bg-slate-900 dark:bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'stamp-studio' && (
                <div className="max-w-7xl mx-auto h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter">Stamp Studio</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Design your professional vector impression.</p>
                    </div>
                    <button onClick={() => setActiveTab('dashboard')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
                    <div className="lg:col-span-4 space-y-6 md:space-y-8 overflow-y-auto px-4 md:pr-4">
                      <EditorControls 
                        config={stampConfig} 
                        onChange={(updates) => setStampConfig(prev => ({ ...prev, ...updates }))} 
                        isLoggedIn={isLoggedIn}
                        onSaveTemplate={handleSaveTemplate}
                      />
                    </div>
                    <div className="lg:col-span-8 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl md:rounded-[56px] border border-slate-100 dark:border-slate-800 p-6 md:p-12 shadow-sm relative group">
                      <div className="absolute top-4 left-4 md:top-8 md:left-8 flex gap-3">
                        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Vector SVG</div>
                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">High Res</div>
                      </div>
                      <div className="relative z-10 w-full max-w-full md:max-w-md aspect-square flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl md:rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 md:p-12 group-hover:border-blue-400 transition-all">
                        <SVGPreview 
                          config={stampConfig} 
                          ref={svgRef} 
                          onUpdateConfig={(updates) => setStampConfig(prev => ({ ...prev, ...updates }))}
                        />
                      </div>
                      <div className="mt-8 md:mt-12 w-full max-w-full md:max-w-md space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Download Options</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <button 
                              onClick={() => downloadStamp('svg')}
                              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-400 transition-all group"
                            >
                              <FileType size={20} className="text-blue-600 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-black uppercase">SVG</span>
                            </button>
                            <button 
                              onClick={() => downloadStamp('png')}
                              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-400 transition-all group"
                            >
                              <ImageIcon size={20} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-black uppercase">PNG</span>
                            </button>
                            <button 
                              onClick={() => downloadStamp('pdf')}
                              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-orange-400 transition-all group"
                            >
                              <FileIcon size={20} className="text-orange-600 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-black uppercase">PDF</span>
                            </button>
                          </div>
                          <div className="mt-4 flex items-center justify-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High-Resolution Vector Ready</span>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button onClick={() => setActiveTab('apply-stamp')} className="flex-1 bg-emerald-600 text-white py-5 px-10 rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-xl active:scale-95">
                            <FileText size={24} /> Apply to PDF
                          </button>
                          <button 
                            onClick={() => {
                              setOpenedFromSignCenter(true);
                              setActiveTab('esign');
                            }} 
                            className="flex-1 bg-slate-900 dark:bg-slate-800 text-white py-5 px-10 rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-800 shadow-xl active:scale-95"
                          >
                            <Layers size={24} className="text-blue-400" /> Bulk Stamp
                          </button>
                        </div>
                        <button onClick={() => setActiveTab('convert')} className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 py-5 px-10 rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xl active:scale-95">
                          <Camera size={24} className="text-blue-600" /> AI Scan & Vectorize
                        </button>
                        {openedFromSignCenter && (
                          <button 
                            onClick={() => {
                              setActiveTab('esign');
                              setOpenedFromSignCenter(false);
                            }}
                            className="w-full bg-emerald-600 text-white py-5 px-10 rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-xl active:scale-95"
                          >
                            <CheckCircle2 size={24} /> Apply to Document & Return
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-4xl font-black tracking-tighter">Sahihi Dashboard</h2>
                      <p className="text-slate-500 font-medium">Welcome back, {user?.name || 'Partner'}. Here's your firm's overview.</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setActiveTab('pdf-forge')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                      >
                        <Wrench size={18} /> PDF Editor
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Stamps', value: '1,284', icon: PenTool, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Signed Docs', value: '856', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { label: 'Active Users', value: '42', icon: User, color: 'text-orange-600', bg: 'bg-orange-50' },
                      { label: 'Storage Used', value: '12.4 GB', icon: HardDrive, color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                          </div>
                          <span className="text-emerald-500 text-xs font-black">+12%</span>
                        </div>
                        <p className="text-slate-500 text-sm font-bold mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-black tracking-tight">{stat.value}</h3>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black tracking-tight">Usage Analytics</h3>
                        <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold">
                          <option>Last 7 Days</option>
                          <option>Last 30 Days</option>
                        </select>
                      </div>
                      <div className="h-64 flex items-end justify-between gap-2">
                        {[45, 65, 35, 85, 55, 75, 95].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${h}%` }}
                              className="w-full bg-blue-600 rounded-t-xl"
                            />
                            <span className="text-[10px] font-black text-slate-400">Day {i+1}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                      <h3 className="text-xl font-black tracking-tight mb-6">Quick Actions</h3>
                      <div className="space-y-3">
                        {[
                          { label: 'New Stamp', icon: Plus, color: 'bg-blue-50 text-blue-600', tab: 'stamp-studio' },
                          { label: 'Sign PDF', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', tab: 'esign' },
                          { label: 'Apply Stamp', icon: FileText, color: 'bg-orange-50 text-orange-600', tab: 'apply-stamp' },
                          { label: 'PDF Editor', icon: Wrench, color: 'bg-purple-50 text-purple-600', tab: 'pdf-forge' },
                          { label: 'QR Tracker', icon: QrCode, color: 'bg-indigo-50 text-indigo-600', tab: 'qr-tracker' },
                          { label: 'Social Hub', icon: Share2, color: 'bg-pink-50 text-pink-600', tab: 'social-hub' },
                        ].map((action, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveTab(action.tab as any)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${action.color}`}>
                                <action.icon size={20} />
                              </div>
                              <span className="font-black text-sm">{action.label}</span>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-900 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'esign' && (
                <DocuSealSignCenter 
                  stampConfig={stampConfig} 
                  onOpenStudio={(fieldId) => {
                    setOpenedFromSignCenter(true);
                    setPendingStampFieldId(fieldId || null);
                    setActiveTab('stamp-studio');
                  }}
                  pendingStampFieldId={pendingStampFieldId}
                  onClearPendingField={() => setPendingStampFieldId(null)}
                  isActive={activeTab === 'esign'}
                />
              )}
              {activeTab === 'pdf-forge' && (
                <PDFTools />
              )}
              {activeTab === 'qr-tracker' && (
                <EmployeeQRTracker />
              )}
              {activeTab === 'social-hub' && (
                <SocialHub />
              )}
              {activeTab === 'templates' && (
                <div className="max-w-7xl mx-auto py-12">
                  <h2 className="text-4xl font-black mb-2 tracking-tight">Authentic Templates</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-12">Professionally captured from real Kenyan rubber stamp samples.</p>
                  <TemplateLibrary 
                    onSelect={handleTemplateSelect} 
                    customTemplates={customTemplates}
                  />
                </div>
              )}
              {activeTab === 'apply-stamp' && (
                <StampApplier 
                  config={stampConfig} 
                  svgRef={svgRef} 
                />
              )}
              {activeTab === 'convert' && (
                <div className="max-w-4xl mx-auto py-12 text-center">
                  <div className="bg-blue-600 text-white w-24 h-24 rounded-[36px] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-blue-200">
                    <Camera size={48} />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">AI Stamp Digitize</h2>
                  <p className="text-xl text-slate-500 dark:text-slate-400 font-medium mb-12">Capture a photo of your old rubber stamp to recreate it digitally.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-900 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl md:rounded-[48px] p-8 md:p-16 text-center group hover:border-blue-400 transition-all cursor-pointer relative">
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <ImageIcon size={48} className="mx-auto text-slate-200 mb-4 group-hover:text-blue-500 transition-all" />
                      <p className="text-2xl font-black">Upload Photo</p>
                      <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest">Select from gallery</p>
                    </div>
                    <div className="bg-slate-900 text-white rounded-3xl md:rounded-[48px] p-8 md:p-16 text-center group hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden">
                      <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <Camera size={48} className="mx-auto text-blue-500 mb-4 group-hover:scale-125 transition-transform" />
                      <p className="text-2xl font-black">Live Camera</p>
                      <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest">Snap a picture now</p>
                    </div>
                  </div>
                </div>
              )}

              {['blogs', 'resources', 'terms', 'privacy', 'help', 'account'].includes(activeTab) && (
                <div className="max-w-5xl mx-auto py-12">
                   <div className="bg-white dark:bg-slate-900 p-12 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                      <h3 className="text-3xl font-black mb-4 capitalize">{activeTab}</h3>
                      <p className="text-slate-500 dark:text-slate-400">Enterprise content coming soon.</p>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
          {/* Hidden SVG Preview for Ref access in other tabs (Fixes StampApplier bug) */}
          <div className="fixed -left-[9999px] -top-[9999px] invisible pointer-events-none">
            <SVGPreview config={stampConfig} ref={svgRef} />
          </div>

          {/* Footer */}
          <footer className="bg-white dark:bg-slate-950 text-slate-400 py-12 border-t border-slate-100 dark:border-slate-900">
            <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Plus size={16} /></div>
                <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Sahihi</h3>
              </div>
              <p className="font-black text-[10px] uppercase tracking-widest text-slate-500">© 2024 JijiTechy Innovations. LSK Standards Applied.</p>
              <div className="flex gap-6">
                 <Twitter size={18} className="hover:text-blue-400 cursor-pointer transition-colors" />
                 <Linkedin size={18} className="hover:text-blue-600 cursor-pointer transition-colors" />
                 <Github size={18} className="hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-3xl z-[600] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[64px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
          >
            <div className="p-16 space-y-12">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-blue-600 rounded-[32px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-200 mb-8">
                  <ShieldCheck size={40} />
                </div>
                <h3 className="text-5xl font-black tracking-tighter">{isSignUp ? 'Join Sahihi' : 'Welcome Back'}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                  {isSignUp ? 'Create your professional digital authority account.' : 'Sign in to manage your stamps and documents.'}
                </p>
              </div>

              <form onSubmit={handleDemoLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-3xl py-6 px-8 outline-none focus:ring-8 focus:ring-blue-500/10 font-bold text-lg"
                    placeholder="counsel@firm.ke"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Password</label>
                  <input 
                    type="password" 
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-3xl py-6 px-8 outline-none focus:ring-8 focus:ring-blue-500/10 font-bold text-lg"
                    placeholder="••••••••"
                  />
                </div>

                {loginError && <p className="text-red-500 text-sm font-bold text-center">{loginError}</p>}

                <button 
                  type="submit"
                  className="w-full bg-slate-900 dark:bg-blue-600 text-white py-8 rounded-[32px] font-black text-2xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95"
                >
                  {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={28} />
                </button>
              </form>

              <div className="text-center">
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-slate-400 font-bold hover:text-blue-600 transition-all"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
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