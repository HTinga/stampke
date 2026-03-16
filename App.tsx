import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Layers, 
  Download, 
  Trash2, 
  Settings, 
  CreditCard, 
  ChevronLeft,
  Image as ImageIcon,
  CheckCircle2,
  HelpCircle,
  Menu,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Star,
  Copy,
  Files,
  ArrowDown,
  Camera,
  ArrowBigDown,
  User,
  // Added missing Users icon import
  Users,
  BookOpen,
  FolderOpen,
  LogOut,
  Mail,
  Lock,
  Smartphone,
  Info,
  PenTool,
  Award,
  Globe,
  Monitor,
  MousePointerClick,
  CheckCircle,
  MessageSquare,
  Twitter,
  Linkedin,
  Github,
  FileText,
  Check,
  Wrench,
  FileCode,
  CalendarDays,
  FileSpreadsheet,
  LayoutDashboard,
  Clock,
  Bell,
  Search,
  MoreVertical,
  History,
  TrendingUp,
  Receipt,
  Briefcase,
  Briefcase as ListTodo,
  BarChart3,
  ClipboardList,
  Layout,
  Sun,
  Moon,
  ChevronRight,
  Home,
  QrCode,
  FileType,
  File as FileIcon,
  Loader2,
  Cloud
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { StampConfig, StampTemplate, StampShape } from './types';
import { DEFAULT_CONFIG, TEMPLATES } from './constants';
import SVGPreview from './components/SVGPreview';
import TemplateLibrary from './components/TemplateLibrary';
import EditorControls from './components/EditorControls';
import DigitalSignCenter from './components/DigitalSignCenter';
import PDFTools from './components/PDFTools';
import BookingSystem from './components/BookingSystem';
import DocumentArchitect from './components/DocumentArchitect';
import PresentationGenerator from './components/PresentationGenerator';
import CommunicationCenter from './components/CommunicationCenter';
import StampApplier from './components/StampApplier';
import WorkspaceSuite from './components/WorkspaceSuite';
import Reminders from './components/Reminders';
import { analyzeStampImage } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

import QRTracker from './components/QRTracker';
import FinanceCenter from './components/FinanceCenter';
import EditorSuite from './components/EditorSuite';

const NAVIGATION_GROUPS = [
  {
    id: 'apps',
    label: 'Core Workspace',
    items: ['home', 'dashboard', 'workspace-dashboard', 'comm-center', 'booking', 'reminders']
  },
  {
    id: 'authority',
    label: 'Digital Authority',
    items: ['stamp-studio', 'esign', 'apply-stamp', 'convert']
  },
  {
    id: 'productivity',
    label: 'Productivity Suite',
    items: ['editor-suite', 'pdf-forge', 'doc-gen', 'presentation', 'templates']
  },
  {
    id: 'ops',
    label: 'Operations & Tracking',
    items: ['qr-tracker', 'tasks', 'gantt', 'time', 'whiteboard']
  },
  {
    id: 'finance',
    label: 'Finance & Accounts',
    items: ['finance-center', 'forms', 'automation', 'workload', 'company']
  }
];

const NAVIGATION_ITEMS = [
  { id: 'home', label: 'Portal Home', icon: Home },
  { id: 'dashboard', label: 'SaaS Dashboard', icon: LayoutDashboard },
  { id: 'workspace-dashboard', label: 'Workspace Hub', icon: Briefcase },
  { id: 'comm-center', label: 'Mail & Chat', icon: MessageSquare },
  { id: 'booking', label: 'Appointments', icon: CalendarDays },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'stamp-studio', label: 'Stamp Designer', icon: PenTool },
  { id: 'esign', label: 'Sign Center', icon: CheckCircle2 },
  { id: 'apply-stamp', label: 'Stamp Applier', icon: FileText },
  { id: 'convert', label: 'AI Scan', icon: Camera },
  { id: 'editor-suite', label: 'Editor Suite', icon: FileCode },
  { id: 'pdf-forge', label: 'PDF Forge', icon: Wrench },
  { id: 'doc-gen', label: 'Doc Architect', icon: FileCode },
  { id: 'presentation', label: 'Presentation', icon: Monitor },
  { id: 'templates', label: 'Templates', icon: BookOpen },
  { id: 'qr-tracker', label: 'QR & GPS Tracking', icon: QrCode },
  { id: 'tasks', label: 'Task Board', icon: ListTodo },
  { id: 'gantt', label: 'Gantt Chart', icon: BarChart3 },
  { id: 'time', label: 'Time Tracking', icon: Clock },
  { id: 'whiteboard', label: 'Whiteboard', icon: Layout },
  { id: 'finance-center', label: 'Finance Hub', icon: Receipt },
  { id: 'forms', label: 'Smart Forms', icon: ClipboardList },
  { id: 'automation', label: 'Automations', icon: Zap },
  { id: 'workload', label: 'Workload', icon: TrendingUp },
  { id: 'company', label: 'Company', icon: Users },
];

const BLOG_POSTS = [
  { 
    id: 1, 
    title: 'Digital Signatures and Rubber Stamps in Kenyan Law: The Definitive 2024 Guide', 
    date: 'Jan 15, 2024', 
    icon: <ShieldCheck size={24} />,
    content: `
      ### The Evolution of Kenyan Business Law
      In the heart of Nairobi's growing tech hub, the legal landscape is shifting. The Business Laws (Amendment) Act has revolutionized how we perceive "authority." No longer is a heavy metal press or a messy rubber stamp the only way to authenticate a document. We are entering the era of the "Verified Digital Impression."

      ### Understanding the Legal Framework
      Section 83G of the Kenya Information and Communications Act (KICA) is clear: an electronic signature or digital authentication cannot be denied legal effect solely because it is digital. However, for Advocates and Notaries, the Law Society of Kenya (LSK) maintains a high bar. A digital stamp is more than just a picture; it is a representation of professional standing.

      ### Why Vector (SVG) Matters for Official Use
      Most "free" tools generate blurry PNG files. In a court of law or when filing at the Business Registration Service (BRS), clarity is non-negotiable. Vector stamps (SVG) are mathematically defined. This means they remain razor-sharp whether they are on a mobile screen or printed on an A0-sized architectural plan. FreeStamps KE focuses exclusively on high-precision SVG output to ensure Kenyan professionals are never turned away due to "pixelated" credentials.

      ### Corporate Governance and Digital Seals
      The 2015 Companies Act was a turning point. It removed the mandatory requirement for a common seal for many private companies. Today, a digital impression paired with an authorized signature is sufficient for most board resolutions. However, having a professionally designed digital seal adds a layer of "Corporate Gravity" to your documents that standard text simply cannot provide.

      ### Security in the Age of AI
      As AI becomes more sophisticated, so do forgeries. FreeStamps KE recommends a "Layered Authentication" approach:
      1. Use a High-Resolution Custom Stamp.
      2. Pair it with a handwritten digital signature (using our multi-page signing tool).
      3. Secure the final document with a cryptographic hash.
      
      ### The Practical Future
      From e-filing in the Kenyan Judiciary to remote contract signing in Mombasa, the tools we build today define the speed of our economy tomorrow. FreeStamps KE is proud to be at the forefront of this digital transition.
    `
  },
  { 
    id: 2, 
    title: 'LSK & Notary Standards: Dimensions, Wording, and Color Protocols', 
    date: 'Feb 02, 2024', 
    icon: <BookOpen size={24} />,
    content: `
      ### Precision is the Profession
      For a Kenyan Advocate, their stamp is their "Sword of Office." The Judiciary's e-filing system is notoriously picky about stamp impressions. This article details the exact technical specifications required for your digital tools to pass the "Registrar's Test."

      ### Dimensions and Ratios
      The standard "Round" Advocate stamp is typically 40mm to 42mm in diameter. In the digital world, this translates to roughly 400px to 600px in SVG viewbox units. Our templates are hard-coded to maintain these ratios, ensuring that when you "place" a stamp on a document using our multi-page tool, the scale is physically accurate.

      ### Wording: The "Commissioner for Oaths" Requirement
      Many practitioners forget the specific line required for the date of admission or the P.105 designation. A stamp that says "Michael Kamau Advocate" is fine, but one that includes "Commissioner for Oaths & Notary Public" alongside a clear P.O. Box and Firm Name is authoritative.

      ### The Color Protocol of Kenyan Institutions
      While most business stamps are Royal Blue (#0000FF), the Kenyan Judiciary has historically favored specific shades of Black or Deep Blue for certified copies. "PAID" and "URGENT" stamps should almost always be Crimson Red (#991b1b). Using the wrong color can lead to psychological friction during document review.

      ### Multi-Page Processing: A Game Changer for Large Firms
      Imagine having to certify 500 pages of a bank mortgage application. Doing this manually with a physical stamp takes hours. Our multi-page stamping & signing engine can process those 500 pages in under 30 seconds. This isn't just a tool; it's an efficiency multiplier for modern legal firms.
    `
  }
];

const RESOURCES = [
  { id: 1, name: 'LSK Standard Layout Guide', type: 'Technical PDF', size: '2.4 MB' },
  { id: 2, name: 'Business Registration Service (BRS) Stamp Specs', type: 'Official Doc', size: '1.1 MB' },
  { id: 3, name: 'Digital Security Whitepaper for Kenyan Firms', type: 'Legal PDF', size: '3.8 MB' },
  { id: 4, name: 'High-Resolution Vector Logo Pack', type: 'Asset Bundle', size: '15 MB' }
];

const FeatureRotator = () => {
  const [index, setIndex] = useState(0);
  const features = [
    { icon: PenTool, label: 'Stamp Studio', desc: 'Vector-perfect rubber stamps.', color: 'text-blue-600' },
    { icon: CheckCircle2, label: 'Sign Center', desc: 'Legally-binding e-signatures.', color: 'text-emerald-600' },
    { icon: QrCode, label: 'QR Tracking', desc: 'GPS-verified personnel tracking.', color: 'text-orange-600' },
    { icon: Receipt, label: 'Finance Hub', icon2: FileSpreadsheet, label2: 'Editor Suite', desc: 'Invoicing & cloud document editors.', color: 'text-rose-600' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const feature = features[index];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="flex flex-col items-center"
      >
        <div className={`w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center ${feature.color} mb-4`}>
          <feature.icon size={40} />
        </div>
        <h4 className="font-black text-xl mb-1">{feature.label}</h4>
        <p className="text-slate-400 font-bold text-sm">{feature.desc}</p>
      </motion.div>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stamp-studio' | 'esign' | 'home' | 'dashboard' | 'pdf-forge' | 'booking' | 'reminders' | 'doc-gen' | 'convert' | 'apply-stamp' | 'workspace-dashboard' | 'presentation' | 'templates' | 'comm-center' | 'tasks' | 'gantt' | 'time' | 'whiteboard' | 'forms' | 'automation' | 'workload' | 'company' | 'qr-tracker' | 'finance-center' | 'editor-suite'>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [stampConfig, setStampConfig] = useState<StampConfig>(DEFAULT_CONFIG);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'supervisor' | 'staff'>('admin');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [user, setUser] = useState<{name: string, email: string, picture?: string} | null>(null);
  const [usageCount, setUsageCount] = useState<number>(0);
  const [hasPaid, setHasPaid] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [pendingStampFieldId, setPendingStampFieldId] = useState<string | null>(null);
  const [openedFromSignCenter, setOpenedFromSignCenter] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

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
    if (usageCount >= 1 && !hasPaid) {
      setShowPaymentModal(true);
      return;
    }
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
    if (usageCount >= 1 && !hasPaid) {
      setShowPaymentModal(true);
      return;
    }

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
      setUsageCount(prev => prev + 1);
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
        URL.revokeObjectURL(url);
        setUsageCount(prev => prev + 1);
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
          setUsageCount(prev => prev + 1);
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Persistent Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[100]">
        <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
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
              {activeTab === 'home' && (
                <div className="max-w-7xl mx-auto space-y-24">
                  {/* World-Class SaaS Hero Section */}
                  <div className="relative py-24 overflow-hidden rounded-[64px] bg-slate-900 text-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
                    <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                      <div className="absolute top-20 right-20 w-96 h-96 bg-blue-400 rounded-full blur-[120px]" />
                      <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400 rounded-full blur-[120px]" />
                    </div>
                    
                    <div className="relative z-10 px-12 md:px-24 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                      <div className="space-y-10">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-full"
                        >
                          <Sparkles size={18} className="text-blue-400" />
                          <span className="text-xs font-black uppercase tracking-widest text-blue-400">The Ultimate SaaS OS</span>
                        </motion.div>
                        
                        <motion.h1 
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.8] mb-8"
                        >
                          Infinite Control. <br />
                          <span className="text-blue-500">One Platform.</span>
                        </motion.h1>
                        
                        <motion.p 
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-xl"
                        >
                          The professional operating system for modern firms. From digital authority to enterprise operations, manage everything in one place.
                        </motion.p>
                        
                        <motion.div 
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex flex-col sm:flex-row gap-6 pt-6"
                        >
                          <button 
                            onClick={() => setActiveTab('dashboard')} 
                            className="bg-blue-600 text-white px-12 py-6 rounded-[32px] font-black text-xl flex items-center justify-center gap-3 hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all active:scale-95"
                          >
                            Launch Workspace <ArrowRight size={28} />
                          </button>
                          <button 
                            onClick={() => setActiveTab('templates')} 
                            className="bg-white/10 backdrop-blur-xl text-white border border-white/20 px-12 py-6 rounded-[32px] font-black text-xl flex items-center justify-center gap-3 hover:bg-white/20 transition-all active:scale-95"
                          >
                            Explore Features
                          </button>
                        </motion.div>
                      </div>

                      <div className="hidden lg:block relative">
                        <FeatureRotator />
                      </div>
                    </div>
                  </div>

                  {/* Feature Grid Section */}
                  <section className="px-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                      <div>
                        <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-4">Enterprise Modules</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-xl">Every tool your business needs, integrated into a single high-performance interface.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-6 py-4 rounded-3xl border border-slate-200 dark:border-slate-700">
                          <Search size={20} className="text-slate-400 mr-3" />
                          <input type="text" placeholder="Search modules..." className="bg-transparent border-none outline-none font-bold text-sm w-48" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {NAVIGATION_ITEMS.filter(item => item.id !== 'home' && item.id !== 'dashboard').map((item, i) => (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setActiveTab(item.id as any)}
                          className="group bg-white dark:bg-slate-900 p-12 rounded-[56px] border border-slate-100 dark:border-slate-800 text-left hover:border-blue-400 hover:shadow-2xl transition-all relative overflow-hidden"
                        >
                          <div className="relative z-10">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[28px] flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all mb-8 shadow-sm">
                              <item.icon size={36} />
                            </div>
                            <h3 className="text-3xl font-black mb-4 tracking-tight group-hover:text-blue-600 transition-colors">{item.label}</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">
                              {item.id === 'booking' ? 'Professional diary and client scheduling system with automated reminders.' : 
                               item.id === 'qr-tracker' ? 'GPS-verified personnel and asset tracking with real-time verification.' :
                               item.id === 'finance-center' ? 'Invoicing, accounts sync, and tax compliance for modern firms.' :
                               item.id === 'editor-suite' ? 'Cloud-based Word and Spreadsheet editors for seamless collaboration.' :
                               item.id === 'esign' ? 'Legally binding digital signature center with full audit trails.' :
                               item.id === 'stamp-studio' ? 'Precision vector rubber stamp designer for corporate authority.' :
                               item.id === 'reminders' ? 'Smart notification system for deadlines and critical tasks.' :
                               'Advanced enterprise module for modern business operations and productivity.'}
                            </p>
                            <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
                              Launch App <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                          </div>
                          <div className="absolute -right-8 -bottom-8 opacity-0 group-hover:opacity-5 transition-all">
                            <item.icon size={160} />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </section>

                  {/* Trust Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 bg-slate-900 text-white p-16 rounded-[64px] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-16 opacity-10 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={240} />
                      </div>
                      <h3 className="text-4xl font-black mb-8 tracking-tight">Enterprise Security</h3>
                      <p className="text-slate-400 text-xl font-medium mb-12 max-w-lg leading-relaxed">All documents are processed client-side. Your firm's data never leaves your device, ensuring absolute confidentiality and LSK compliance.</p>
                      <div className="flex gap-12">
                        <div>
                          <p className="text-5xl font-black text-blue-400 mb-2">AES-256</p>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Encryption Standard</p>
                        </div>
                        <div className="w-px h-16 bg-slate-800"></div>
                        <div>
                          <p className="text-5xl font-black text-blue-400 mb-2">LSK</p>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Regulatory Compliant</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-16 rounded-[64px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                      <h3 className="text-3xl font-black mb-10 tracking-tight">System Health</h3>
                      <div className="space-y-10">
                        {[
                          { label: 'Cloud Sync', value: 'Active', icon: Cloud, color: 'text-emerald-500' },
                          { label: 'Security Scan', value: 'Passed', icon: ShieldCheck, color: 'text-blue-500' },
                          { label: 'Uptime', value: '99.9%', icon: Zap, color: 'text-amber-500' },
                        ].map((stat, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                              <div className={`w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${stat.color}`}>
                                <stat.icon size={24} />
                              </div>
                              <p className="font-black text-lg text-slate-600 dark:text-slate-400">{stat.label}</p>
                            </div>
                            <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}

              {activeTab === 'stamp-studio' && (
                <div className="max-w-7xl mx-auto h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter">Stamp Studio</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Design your professional vector impression.</p>
                    </div>
                    <button onClick={() => setActiveTab('home')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-8 overflow-y-auto pr-4">
                      <EditorControls 
                        config={stampConfig} 
                        onChange={(updates) => setStampConfig(prev => ({ ...prev, ...updates }))} 
                      />
                    </div>
                    <div className="lg:col-span-8 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[56px] border border-slate-100 dark:border-slate-800 p-12 shadow-sm relative group">
                      <div className="absolute top-8 left-8 flex gap-3">
                        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Vector SVG</div>
                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">High Res</div>
                      </div>
                      <div className="relative z-10 w-full max-w-md aspect-square flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 group-hover:border-blue-400 transition-all">
                        <SVGPreview config={stampConfig} ref={svgRef} />
                      </div>
                      <div className="mt-12 w-full max-w-md space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Download Options</h4>
                          <div className="grid grid-cols-3 gap-3">
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

              {activeTab === 'esign' && (
                <DigitalSignCenter 
                  stampConfig={stampConfig} 
                  onOpenStudio={(fieldId) => {
                    setOpenedFromSignCenter(true);
                    setPendingStampFieldId(fieldId || null);
                    setActiveTab('stamp-studio');
                  }}
                  pendingStampFieldId={pendingStampFieldId}
                  onClearPendingField={() => setPendingStampFieldId(null)}
                  isActive={activeTab === 'esign'}
                  usageCount={usageCount}
                  hasPaid={hasPaid}
                  setUsageCount={setUsageCount}
                  setShowPaymentModal={setShowPaymentModal}
                />
              )}
              {activeTab === 'pdf-forge' && (
                <PDFTools 
                  usageCount={usageCount}
                  hasPaid={hasPaid}
                  setUsageCount={setUsageCount}
                  setShowPaymentModal={setShowPaymentModal}
                />
              )}
              {activeTab === 'booking' && <BookingSystem />}
              {activeTab === 'reminders' && <Reminders />}
              {activeTab === 'comm-center' && <CommunicationCenter />}
              {activeTab === 'qr-tracker' && <QRTracker />}
              {activeTab === 'finance-center' && <FinanceCenter />}
              {activeTab === 'editor-suite' && <EditorSuite />}
              {activeTab === 'doc-gen' && <DocumentArchitect />}
              {activeTab === 'presentation' && <PresentationGenerator />}
              {activeTab === 'templates' && (
                <div className="max-w-7xl mx-auto py-12">
                  <h2 className="text-4xl font-black mb-2 tracking-tight">Authentic Templates</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-12">Professionally captured from real Kenyan rubber stamp samples.</p>
                  <TemplateLibrary onSelect={handleTemplateSelect} />
                </div>
              )}
              {activeTab === 'apply-stamp' && (
                <StampApplier 
                  config={stampConfig} 
                  svgRef={svgRef} 
                  usageCount={usageCount}
                  hasPaid={hasPaid}
                  setUsageCount={setUsageCount}
                  setShowPaymentModal={setShowPaymentModal}
                />
              )}
              {['workspace-dashboard', 'tasks', 'gantt', 'time', 'whiteboard', 'forms', 'automation', 'workload', 'company'].includes(activeTab) && (
                <WorkspaceSuite activeTab={activeTab === 'workspace-dashboard' ? 'home' : activeTab} />
              )}
              {activeTab === 'convert' && (
                <div className="max-w-4xl mx-auto py-12 text-center">
                  <div className="bg-blue-600 text-white w-24 h-24 rounded-[36px] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-blue-200">
                    <Camera size={48} />
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter mb-6">AI Stamp Digitize</h2>
                  <p className="text-xl text-slate-500 dark:text-slate-400 font-medium mb-12">Capture a photo of your old rubber stamp to recreate it digitally.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-900 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[48px] p-16 text-center group hover:border-blue-400 transition-all cursor-pointer relative">
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <ImageIcon size={48} className="mx-auto text-slate-200 mb-4 group-hover:text-blue-500 transition-all" />
                      <p className="text-2xl font-black">Upload Photo</p>
                      <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest">Select from gallery</p>
                    </div>
                    <div className="bg-slate-900 text-white rounded-[48px] p-16 text-center group hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden">
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

      {showPaymentModal && (
        <PaymentModal 
          isLoggedIn={isLoggedIn}
          setShowLoginModal={setShowLoginModal}
          onClose={() => setShowPaymentModal(false)} 
          onSuccess={() => {
            setHasPaid(true);
            setShowPaymentModal(false);
          }} 
        />
      )}
    </div>
  );
};

const Dashboard: React.FC<{ setActiveTab: (tab: any) => void }> = ({ setActiveTab }) => {
  return (
    <div className="space-y-12 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">Enterprise Dashboard</h2>
          <p className="text-slate-500 font-medium">Welcome back, Tinga. Here is your firm's overview.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-blue-100">
            <Plus size={18} /> New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Active Tasks', value: '24', icon: ListTodo, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Bookings', value: '8', icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Unread Mail', value: '12', icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Revenue (MTD)', value: 'KES 450K', icon: Receipt, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black tracking-tight">Recent Activity</h3>
              <button className="text-xs font-black text-blue-600 uppercase tracking-widest">View All</button>
            </div>
            <div className="space-y-6">
              {[
                { title: 'New Signature Request', desc: 'Acme Corp sent a contract for signing.', time: '2m ago', icon: CheckCircle2, color: 'text-emerald-600' },
                { title: 'Appointment Confirmed', desc: 'Legal consultation with John Doe.', time: '1h ago', icon: CalendarDays, color: 'text-blue-600' },
                { title: 'QR Scan Verified', desc: 'Sarah Wambui checked in at Mombasa Port.', time: '3h ago', icon: QrCode, color: 'text-orange-600' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color} bg-white dark:bg-slate-900 shadow-sm`}>
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 text-white p-10 rounded-[56px] shadow-2xl relative overflow-hidden">
            <h3 className="text-2xl font-black tracking-tight mb-6 relative z-10">Quick Launch</h3>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <button onClick={() => setActiveTab('stamp-studio')} className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 hover:bg-white/20 transition-all text-center">
                <PenTool className="mx-auto mb-2 text-blue-400" size={24} />
                <span className="text-[10px] font-black uppercase">Stamp</span>
              </button>
              <button onClick={() => setActiveTab('esign')} className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 hover:bg-white/20 transition-all text-center">
                <CheckCircle2 className="mx-auto mb-2 text-emerald-400" size={24} />
                <span className="text-[10px] font-black uppercase">Sign</span>
              </button>
              <button onClick={() => setActiveTab('qr-tracker')} className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 hover:bg-white/20 transition-all text-center">
                <QrCode className="mx-auto mb-2 text-orange-400" size={24} />
                <span className="text-[10px] font-black uppercase">Track</span>
              </button>
              <button onClick={() => setActiveTab('finance-center')} className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 hover:bg-white/20 transition-all text-center">
                <Receipt className="mx-auto mb-2 text-rose-400" size={24} />
                <span className="text-[10px] font-black uppercase">Finance</span>
              </button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
          </div>

          <div className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-black mb-6">Upcoming</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">In 30 mins</p>
                <p className="text-sm font-bold">Board Meeting</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tomorrow</p>
                <p className="text-sm font-bold">VAT Filing Deadline</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentModal: React.FC<{ 
  isLoggedIn: boolean,
  setShowLoginModal: (show: boolean) => void,
  onClose: () => void, 
  onSuccess: () => void 
}> = ({ isLoggedIn, setShowLoginModal, onClose, onSuccess }) => {
  const [method, setMethod] = useState<'mpesa' | 'card' | 'skrill'>('mpesa');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[500] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
      >
        <div className="p-12 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-4xl font-black tracking-tighter">Premium Access</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Unlock all features of Sahihi</p>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><X size={24} /></button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-3xl border border-blue-100 dark:border-blue-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Amount</p>
              <p className="text-3xl font-black text-blue-900 dark:text-blue-100">KES 2,500</p>
            </div>
            <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Lifetime Access</div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => setMethod('mpesa')}
                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'mpesa' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
              >
                <Smartphone className={method === 'mpesa' ? 'text-green-600' : 'text-slate-400'} size={24} />
                <span className="text-[10px] font-black uppercase">M-Pesa</span>
              </button>
              <button 
                onClick={() => setMethod('card')}
                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'card' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
              >
                <CreditCard className={method === 'card' ? 'text-blue-600' : 'text-slate-400'} size={24} />
                <span className="text-[10px] font-black uppercase">Card</span>
              </button>
              <button 
                onClick={() => setMethod('skrill')}
                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'skrill' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
              >
                <Globe className={method === 'skrill' ? 'text-purple-600' : 'text-slate-400'} size={24} />
                <span className="text-[10px] font-black uppercase">Skrill</span>
              </button>
            </div>
          </div>

          {method === 'mpesa' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">M-Pesa Phone Number</label>
              <input 
                type="text" 
                placeholder="07XX XXX XXX" 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-green-500/10 font-bold"
              />
            </div>
          )}

          <button 
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full bg-slate-900 dark:bg-blue-600 text-white py-6 rounded-3xl font-black text-xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />}
            {isProcessing ? 'Processing...' : `Pay with ${method.toUpperCase()}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default App;