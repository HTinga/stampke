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
  Layout,
  Sun,
  Moon,
  ChevronRight,
  Home
} from 'lucide-react';
import { StampConfig, StampTemplate, StampShape } from './types';
import { DEFAULT_CONFIG, TEMPLATES } from './constants';
import SVGPreview from './components/SVGPreview';
import TemplateLibrary from './components/TemplateLibrary';
import EditorControls from './components/EditorControls';
import BulkStamper from './components/BulkStamper';
import DigitalSignCenter from './components/DigitalSignCenter';
import PDFTools from './components/PDFTools';
import BookingSystem from './components/BookingSystem';
import DocumentArchitect from './components/DocumentArchitect';
import PresentationGenerator from './components/PresentationGenerator';
import CommunicationCenter from './components/CommunicationCenter';
import { analyzeStampImage } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

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
      2. Pair it with a handwritten digital signature (using our Bulk Signing tool).
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
      The standard "Round" Advocate stamp is typically 40mm to 42mm in diameter. In the digital world, this translates to roughly 400px to 600px in SVG viewbox units. Our templates are hard-coded to maintain these ratios, ensuring that when you "place" a stamp on a document using our Bulk Tool, the scale is physically accurate.

      ### Wording: The "Commissioner for Oaths" Requirement
      Many practitioners forget the specific line required for the date of admission or the P.105 designation. A stamp that says "Michael Kamau Advocate" is fine, but one that includes "Commissioner for Oaths & Notary Public" alongside a clear P.O. Box and Firm Name is authoritative.

      ### The Color Protocol of Kenyan Institutions
      While most business stamps are Royal Blue (#0000FF), the Kenyan Judiciary has historically favored specific shades of Black or Deep Blue for certified copies. "PAID" and "URGENT" stamps should almost always be Crimson Red (#991b1b). Using the wrong color can lead to psychological friction during document review.

      ### Bulk Processing: A Game Changer for Large Firms
      Imagine having to certify 500 pages of a bank mortgage application. Doing this manually with a physical stamp takes hours. Our Bulk Stamping & Signing engine can process those 500 pages in under 30 seconds. This isn't just a tool; it's an efficiency multiplier for modern legal firms.
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
    { icon: FileSpreadsheet, label: 'Doc Architect', desc: 'Industry-standard templates.', color: 'text-violet-600' },
    { icon: Monitor, label: 'Slide Deck', desc: 'Corporate presentations.', color: 'text-indigo-600' },
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
  const [activeTab, setActiveTab] = useState<'home' | 'stamp-studio' | 'esign' | 'pdf-forge' | 'booking' | 'doc-gen' | 'presentation' | 'comm-center' | 'templates' | 'bulk' | 'convert' | 'blogs' | 'resources' | 'terms' | 'privacy' | 'help' | 'account'>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [stampConfig, setStampConfig] = useState<StampConfig>(DEFAULT_CONFIG);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<'single' | 'bulk' | 'esign'>('single');
  const [bulkCost, setBulkCost] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [user, setUser] = useState<{name: string, email: string, picture?: string} | null>(null);
  const [pendingStampFieldId, setPendingStampFieldId] = useState<string | null>(null);
  const [openedFromSignCenter, setOpenedFromSignCenter] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

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
    setShowLoginModal(true);
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
      logoUrl: null
    });
    setActiveTab('editor');
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
    setShowPayment(false);
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
        setActiveTab('editor');
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerPayment = (type: 'single' | 'bulk' | 'esign', cost?: number) => {
    setPaymentType(type);
    if (cost) setBulkCost(cost);
    setShowPayment(true);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Bar */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-[100] px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none"><Plus size={24} /></div>
            <h1 className="text-2xl font-black tracking-tighter">FreeStamps <span className="text-blue-600">KE</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-500 dark:text-slate-400"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-black">{user?.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user?.email}</p>
              </div>
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border-2 border-blue-600 p-0.5" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black">
                  {user?.name.charAt(0)}
                </div>
              )}
              <button 
                onClick={handleLogout}
                className="p-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-2xl transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleGoogleLogin}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 dark:shadow-none active:scale-95"
            >
              <Globe size={18} /> Login with Google
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && isLoggedIn && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto hidden lg:block"
            >
              <nav className="p-6 space-y-2">
                {[
                  { id: 'home', label: 'Dashboard', icon: Home },
                  { id: 'stamp-studio', label: 'Stamp Studio', icon: PenTool },
                  { id: 'esign', label: 'Sign Center', icon: CheckCircle2 },
                  { id: 'pdf-forge', label: 'PDF Forge', icon: FileCode },
                  { id: 'booking', label: 'Booking', icon: CalendarDays },
                  { id: 'comm-center', label: 'Comm Hub', icon: Mail },
                  { id: 'doc-gen', label: 'Doc Generator', icon: FileSpreadsheet },
                  { id: 'presentation', label: 'Slide Deck', icon: Monitor },
                  { id: 'templates', label: 'Templates', icon: Layout },
                  { id: 'bulk', label: 'Bulk Engine', icon: Layers },
                  { id: 'convert', label: 'AI Scan', icon: Camera },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all group ${
                      activeTab === item.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'group-hover:text-blue-600'} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {activeTab === item.id && <ChevronRight size={16} />}
                  </button>
                ))}
              </nav>
              
              <div className="p-6 mt-10">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Pro Account</p>
                  <p className="text-sm font-bold mb-4">Unlock unlimited bulk processing and custom templates.</p>
                  <button className="w-full bg-slate-900 dark:bg-blue-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all">Upgrade Now</button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile Drawer Overlay */}
        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90]"
            />
          )}
        </AnimatePresence>

        {/* Main Content Area */}
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
                <div className="max-w-7xl mx-auto space-y-20">
                  {/* Hero Section - Calendly Style */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-12">
                    <div className="space-y-10">
                      <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-[0.9] text-slate-900">
                        Easy <span className="text-blue-600">authority</span> ahead.
                      </h1>
                      <p className="text-2xl text-slate-500 font-medium leading-relaxed max-w-xl">
                        Join 20,000+ Kenyan professionals who easily manage stamps, signatures, and documents with the #1 digital authority tool.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={handleGoogleLogin} className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95">
                          <Globe size={24} /> Sign up with Google
                        </button>
                        <button className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95">
                          <Monitor size={24} /> Sign up with Microsoft
                        </button>
                      </div>
                      <p className="text-sm text-slate-400 font-bold">
                        OR <button className="text-blue-600 hover:underline">Sign up free with email.</button> No credit card required.
                      </p>
                    </div>

                    <div className="relative">
                      {/* Rotating Feature Card */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 p-10 relative z-10"
                      >
                        <div className="flex items-center justify-between mb-10">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                              <Plus size={24} />
                            </div>
                            <div>
                              <h3 className="font-black text-xl">FreeStamps KE</h3>
                              <p className="text-slate-400 font-bold text-sm">Enterprise Solution</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                              <User size={32} />
                            </div>
                            <div>
                              <h4 className="font-black text-lg">Feature Spotlight</h4>
                              <p className="text-slate-500 font-medium">Digital Authority Management</p>
                            </div>
                            <div className="space-y-3">
                              <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                <motion.div 
                                  animate={{ x: ['-100%', '100%'] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                  className="h-full w-1/2 bg-blue-600"
                                />
                              </div>
                              <div className="h-2 w-2/3 bg-slate-50 rounded-full"></div>
                              <div className="h-2 w-1/2 bg-slate-50 rounded-full"></div>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                            <FeatureRotator />
                          </div>
                        </div>
                      </motion.div>

                      {/* Decorative Background Elements */}
                      <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
                      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl -z-10"></div>
                    </div>
                  </div>

                  <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-20 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Welcome Back, <span className="text-blue-600">{user?.name || 'Counsel'}</span></h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Manage your firm's digital authority from one central dashboard.</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setActiveTab('stamp-studio')} className="bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black shadow-xl shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all flex items-center gap-3">
                        <PenTool size={20} /> Create New Stamp
                      </button>
                    </div>
                  </header>

                  {/* Feature Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                      { id: 'stamp-studio', label: 'Stamp Studio', desc: 'Design high-precision vector rubber stamps for legal and corporate use.', icon: PenTool, color: 'blue' },
                      { id: 'esign', label: 'Sign Center', desc: 'Collect legally-binding digital signatures with full audit trails.', icon: CheckCircle2, color: 'emerald' },
                      { id: 'pdf-forge', label: 'PDF Forge', desc: 'Merge, split, unlock, and watermark PDFs with enterprise security.', icon: FileCode, color: 'slate' },
                      { id: 'booking', label: 'Smart Booking', desc: 'Automated scheduling for client consultations and firm meetings.', icon: CalendarDays, color: 'indigo' },
                      { id: 'doc-gen', label: 'Doc Architect', desc: 'Generate invoices, letterheads, and contracts with usage tracking.', icon: FileSpreadsheet, color: 'violet' },
                      { id: 'bulk', label: 'Bulk Engine', desc: 'Process thousands of documents in seconds with automated stamping.', icon: Layers, color: 'orange' },
                    ].map((feature) => (
                      <button
                        key={feature.id}
                        onClick={() => setActiveTab(feature.id as any)}
                        className="group bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-100 dark:border-slate-800 text-left hover:shadow-2xl hover:shadow-blue-100 dark:hover:shadow-none transition-all hover:-translate-y-2"
                      >
                        <div className={`w-16 h-16 rounded-[24px] bg-${feature.color}-50 dark:bg-${feature.color}-900/20 flex items-center justify-center text-${feature.color}-600 mb-8 group-hover:scale-110 transition-transform`}>
                          <feature.icon size={32} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 tracking-tight">{feature.label}</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">{feature.desc}</p>
                        <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
                          Try Feature <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Recent Activity / Stats */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-slate-900 text-white p-12 rounded-[56px] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={200} />
                      </div>
                      <h3 className="text-3xl font-black mb-6 tracking-tight">Enterprise Security</h3>
                      <p className="text-slate-400 text-lg font-medium mb-10 max-w-md">All documents are processed client-side. Your firm's data never leaves your device, ensuring absolute confidentiality.</p>
                      <div className="flex gap-8">
                        <div>
                          <p className="text-4xl font-black text-blue-400 mb-1">AES-256</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Encryption</p>
                        </div>
                        <div className="w-px h-12 bg-slate-800"></div>
                        <div>
                          <p className="text-4xl font-black text-blue-400 mb-1">LSK</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Compliant</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-[56px] border border-slate-100 dark:border-slate-800">
                      <h3 className="text-2xl font-black mb-8 tracking-tight">Quick Stats</h3>
                      <div className="space-y-8">
                        {[
                          { label: 'Stamps Created', value: '12', icon: PenTool },
                          { label: 'Docs Signed', value: '48', icon: CheckCircle2 },
                          { label: 'Bulk Runs', value: '3', icon: Layers },
                        ].map((stat, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <stat.icon size={18} />
                              </div>
                              <p className="font-bold text-slate-600 dark:text-slate-400">{stat.label}</p>
                            </div>
                            <p className="text-2xl font-black">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                      <EditorControls config={stampConfig} onChange={(updates) => setStampConfig(prev => ({ ...prev, ...updates }))} />
                    </div>
                    <div className="lg:col-span-8 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[56px] border border-slate-100 dark:border-slate-800 p-12 shadow-sm relative group">
                      <div className="absolute top-8 left-8 flex gap-3">
                        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Vector SVG</div>
                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">High Res</div>
                      </div>
                      <div className="relative z-10 w-full max-w-md aspect-square flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 group-hover:border-blue-400 transition-all">
                        <SVGPreview config={stampConfig} ref={svgRef} />
                      </div>
                      <div className="mt-12 w-full max-w-md flex flex-col gap-4">
                        <div className="flex gap-4">
                          <button onClick={() => triggerPayment('single')} className="flex-1 bg-blue-600 text-white py-5 px-10 rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-700 shadow-2xl shadow-blue-200 dark:shadow-none active:scale-95">
                            <Download size={24} /> Download SVG
                          </button>
                          <button onClick={() => setActiveTab('bulk')} className="flex-1 bg-slate-900 dark:bg-slate-800 text-white py-5 px-10 rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-800 shadow-xl active:scale-95">
                            <Copy size={24} className="text-blue-400" /> Bulk Run
                          </button>
                        </div>
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
                />
              )}
              {activeTab === 'pdf-forge' && <PDFTools />}
              {activeTab === 'booking' && <BookingSystem />}
              {activeTab === 'comm-center' && <CommunicationCenter />}
              {activeTab === 'doc-gen' && <DocumentArchitect />}
              {activeTab === 'presentation' && <PresentationGenerator />}
              {activeTab === 'templates' && (
                <div className="max-w-7xl mx-auto py-12">
                  <h2 className="text-4xl font-black mb-2 tracking-tight">Authentic Templates</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-12">Professionally captured from real Kenyan rubber stamp samples.</p>
                  <TemplateLibrary onSelect={handleTemplateSelect} />
                </div>
              )}
              {activeTab === 'bulk' && <BulkStamper config={stampConfig} onStartBulk={(cost) => triggerPayment('bulk', cost)} />}
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
        </main>
      </div>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 p-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-blue-200">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-3xl font-black tracking-tighter mb-2">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                <p className="text-slate-500 font-medium">{isSignUp ? 'Join the FreeStamps KE workspace today.' : 'Enter your credentials to access your dashboard.'}</p>
              </div>

              <form onSubmit={handleDemoLogin} className="space-y-6">
                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required
                        placeholder="John Doe"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="tinga@gmail.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                    />
                  </div>
                </div>

                {loginError && (
                  <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>
                )}

                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95"
                >
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 text-center">
                <p className="text-slate-400 text-sm font-medium">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"} <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 font-bold">{isSignUp ? 'Sign In' : 'Sign up free'}</button>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl max-w-lg w-full p-12">
            <div className="flex justify-between items-start mb-10">
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 p-6 rounded-[32px]"><Zap size={40} /></div>
              <button onClick={() => setShowPayment(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-all"><X size={24} /></button>
            </div>
            <h3 className="text-4xl font-black tracking-tighter mb-6">Confirm Transaction</h3>
            <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[36px] mb-10 flex items-center justify-between border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{paymentType === 'bulk' ? 'Bulk Processing Fee' : 'Platform License'}</p>
                <p className="text-2xl font-black">{paymentType === 'bulk' ? 'Verified Batch' : 'Digital Authority'}</p>
              </div>
              <p className="text-4xl font-black text-blue-600 tracking-tighter">KES {(paymentType === 'bulk' ? bulkCost : 650).toLocaleString()}</p>
            </div>
            <div className="space-y-4">
              <button onClick={handleDownload} className="w-full bg-slate-900 dark:bg-blue-600 text-white py-6 rounded-3xl font-black text-xl hover:opacity-90 transition-all shadow-2xl shadow-slate-200 dark:shadow-none active:scale-95">Complete Transaction</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 text-slate-400 py-12 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Plus size={16} /></div>
            <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">FreeStamps <span className="text-blue-600">KE</span></h3>
          </div>
          <p className="font-black text-[10px] uppercase tracking-widest text-slate-500">© 2024 JijiTechy Innovations. LSK Standards Applied.</p>
          <div className="flex gap-6">
             <Twitter size={18} className="hover:text-blue-400 cursor-pointer transition-colors" />
             <Linkedin size={18} className="hover:text-blue-600 cursor-pointer transition-colors" />
             <Github size={18} className="hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;