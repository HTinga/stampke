
import React, { useState, useRef } from 'react';
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
  BookOpen,
  FolderOpen,
  LogOut,
  Mail,
  Lock,
  Smartphone,
  Info,
  PenTool
} from 'lucide-react';
import { StampConfig, StampTemplate, StampShape } from './types';
import { DEFAULT_CONFIG } from './constants';
import SVGPreview from './components/SVGPreview';
import TemplateLibrary from './components/TemplateLibrary';
import EditorControls from './components/EditorControls';
import BulkStamper from './components/BulkStamper';
import { analyzeStampImage } from './services/geminiService';

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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'editor' | 'templates' | 'convert' | 'bulk' | 'help' | 'terms' | 'privacy' | 'blogs' | 'resources' | 'account'>('home');
  const [stampConfig, setStampConfig] = useState<StampConfig>(DEFAULT_CONFIG);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<'single' | 'bulk'>('single');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [user, setUser] = useState<{name: string, email: string} | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

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
    setIsProcessing(true);
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
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const triggerPayment = (type: 'single' | 'bulk') => {
    setPaymentType(type);
    setShowPayment(true);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setUser({ name: 'Kenya Business Owner', email: 'owner@example.ke' });
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200">
              <Plus size={20} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">FreeStamps <span className="text-blue-600">KE</span></h1>
          </div>

          <nav className="hidden xl:flex items-center gap-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <button onClick={() => setActiveTab('home')} className={`hover:text-blue-600 transition-colors ${activeTab === 'home' ? 'text-blue-600' : ''}`}>Home</button>
            <button onClick={() => setActiveTab('templates')} className={`hover:text-blue-600 transition-colors ${activeTab === 'templates' ? 'text-blue-600' : ''}`}>Templates</button>
            <button onClick={() => setActiveTab('bulk')} className={`hover:text-blue-600 transition-colors ${activeTab === 'bulk' ? 'text-blue-600' : ''}`}>Bulk Run</button>
            <button onClick={() => setActiveTab('convert')} className={`hover:text-blue-600 transition-colors ${activeTab === 'convert' ? 'text-blue-600' : ''}`}>AI Convert</button>
            <button onClick={() => setActiveTab('blogs')} className={`hover:text-blue-600 transition-colors ${activeTab === 'blogs' ? 'text-blue-600' : ''}`}>Blogs</button>
            <button onClick={() => setActiveTab('resources')} className={`hover:text-blue-600 transition-colors ${activeTab === 'resources' ? 'text-blue-600' : ''}`}>Resources</button>
            
            {isLoggedIn ? (
              <button onClick={() => setActiveTab('account')} className="bg-slate-50 text-slate-900 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2">
                <User size={16} /> Account
              </button>
            ) : (
              <button onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }} className="bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-md active:scale-95">
                Sign In
              </button>
            )}
          </nav>

          <button className="xl:hidden text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'home' && (
          <section className="pt-20 pb-32 px-4 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-blue-100">
                  <Zap size={14} fill="currentColor" /> Authorized Business Tools
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tighter">
                  Official Kenyan Stamps <span className="text-blue-600">Created Instantly.</span>
                </h2>
                <p className="text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                  Designed accurately from physical samples for Advocates, Notaries, and Businesses. Choose a template or upload to digitize.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <button onClick={() => setActiveTab('templates')} className="w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-2 group">
                    Browse Templates <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => setActiveTab('bulk')} className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                    <PenTool size={20} className="text-blue-400" /> Bulk Stamping & Signing
                  </button>
                </div>
              </div>
              <div className="flex-1 relative">
                <div className="relative z-10 p-4 bg-white rounded-[40px] shadow-2xl border border-slate-100 rotate-2 hover:rotate-0 transition-transform duration-500 scale-110">
                  <div className="bg-slate-50 p-8 rounded-[32px] border border-dashed border-slate-200">
                    <SVGPreview config={{ ...DEFAULT_CONFIG, logoUrl: null }} className="h-[300px] border-none !p-0" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'templates' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Authentic Templates</h2>
            <p className="text-slate-500 font-medium mb-12">Professionally captured from real Kenyan rubber stamp samples.</p>
            <TemplateLibrary onSelect={handleTemplateSelect} />
          </div>
        )}

        {activeTab === 'bulk' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
            <BulkStamper config={stampConfig} onStartBulk={() => triggerPayment('bulk')} />
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 min-h-[calc(100vh-64px)]">
            <div className="lg:col-span-5 border-r border-slate-100 bg-slate-50/30 p-4 md:p-8 order-2 lg:order-1">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setActiveTab('templates')} className="p-2 hover:bg-white rounded-xl shadow-sm border border-slate-100 transition-all"><ChevronLeft size={20} /></button>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Custom Builder</h2>
              </div>
              <EditorControls config={stampConfig} onChange={(updates) => setStampConfig(prev => ({ ...prev, ...updates }))} />
            </div>
            <div className="lg:col-span-7 p-4 md:p-8 flex flex-col items-center justify-center order-1 lg:order-2 bg-white relative">
              <div className="w-full max-w-2xl space-y-8">
                <div className="bg-white p-1 rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden group">
                  <div className="bg-slate-50 p-4 md:p-12 rounded-[36px] border border-dashed border-slate-200 transition-colors group-hover:border-blue-200">
                    <SVGPreview ref={svgRef} config={stampConfig} className="h-[300px] md:h-[500px] border-none shadow-none !bg-transparent" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => triggerPayment('single')} className="flex-1 bg-blue-600 text-white py-5 px-10 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95">
                    <Download size={24} /> Download SVG
                  </button>
                  <button onClick={() => setActiveTab('bulk')} className="flex-1 bg-slate-900 text-white py-5 px-10 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-800 shadow-xl active:scale-95">
                    <Copy size={24} className="text-blue-400" /> Use for Bulk Run
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'convert' && (
          <div className="max-w-4xl mx-auto py-24 px-4 animate-in fade-in duration-500 text-center">
            <div className="bg-blue-600 text-white w-24 h-24 rounded-[36px] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-blue-200">
              <Camera size={48} />
            </div>
            <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">AI Stamp Digitize</h2>
            <p className="text-xl text-slate-500 font-medium mb-12">Capture a photo of your old rubber stamp to recreate it digitally.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              <div className="bg-white border-4 border-dashed border-slate-100 rounded-[48px] p-16 text-center group hover:border-blue-400 transition-all cursor-pointer relative">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <ImageIcon size={48} className="mx-auto text-slate-200 mb-4 group-hover:text-blue-500 transition-all" />
                <p className="text-2xl font-black">Upload Photo</p>
                <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest">Select from gallery</p>
              </div>
              <div className="bg-slate-900 text-white rounded-[48px] p-16 text-center group hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden">
                <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <Camera size={48} className="mx-auto text-blue-500 mb-4 group-hover:scale-125 transition-transform" />
                <p className="text-2xl font-black">Live Camera</p>
                <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest">Snap a picture now</p>
              </div>
            </div>
            <div className="mt-16 animate-bounce text-blue-600 flex flex-col items-center">
              <ArrowDown size={40} />
              <span className="text-xs font-black uppercase tracking-widest mt-2">Start Here</span>
            </div>
          </div>
        )}

        {activeTab === 'blogs' && (
          <div className="max-w-5xl mx-auto py-24 px-4">
            <h2 className="text-5xl font-black text-slate-900 mb-12 tracking-tighter">Expert Insights</h2>
            <div className="space-y-16">
              {BLOG_POSTS.map(post => (
                <article key={post.id} className="bg-white border border-slate-100 p-12 md:p-20 rounded-[48px] shadow-sm hover:shadow-2xl transition-all">
                  <div className="flex items-center gap-6 mb-10">
                    <div className="bg-blue-600 text-white p-5 rounded-3xl shadow-lg">{post.icon}</div>
                    <div>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{post.date}</span>
                      <h3 className="text-4xl font-black text-slate-900 leading-tight">{post.title}</h3>
                    </div>
                  </div>
                  <div className="prose prose-slate prose-xl max-w-none text-slate-600 whitespace-pre-line leading-relaxed font-medium">
                    {post.content}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="max-w-5xl mx-auto py-24 px-4">
            <h2 className="text-5xl font-black text-slate-900 mb-12 tracking-tighter text-center">Professional Downloads</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {RESOURCES.map(res => (
                <div key={res.id} className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-xl transition-all cursor-pointer">
                  <div className="flex items-center gap-6">
                    <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-lg"><FolderOpen size={32} /></div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">{res.name}</p>
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{res.type} • {res.size}</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 text-blue-600 shadow-sm"><Download size={24} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Support Tabs */}
        {['help', 'terms', 'privacy', 'account'].includes(activeTab) && (
          <div className="max-w-4xl mx-auto py-24 px-4">
            <h2 className="text-5xl font-black text-slate-900 mb-12 tracking-tighter capitalize">{activeTab}</h2>
            <div className="prose prose-slate prose-lg max-w-none text-slate-600 bg-white border border-slate-100 p-12 rounded-[48px] shadow-sm">
               {activeTab === 'account' && isLoggedIn ? (
                 <div className="space-y-8">
                   <div className="flex items-center gap-6 mb-8">
                     <div className="bg-slate-900 text-white p-8 rounded-[36px]"><User size={64} /></div>
                     <div>
                       <p className="text-4xl font-black text-slate-900">{user?.name}</p>
                       <p className="text-slate-500 font-bold uppercase tracking-widest">{user?.email}</p>
                     </div>
                   </div>
                   <button onClick={() => { setIsLoggedIn(false); setActiveTab('home'); }} className="bg-red-50 text-red-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-red-100 transition-all flex items-center gap-2">
                     <LogOut size={24} /> Sign Out Session
                   </button>
                 </div>
               ) : (
                 <p>Standard legal and support documentation for FreeStamps KE. All rights reserved.</p>
               )}
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] shadow-2xl max-w-md w-full p-12 relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={24} /></button>
            <div className="bg-blue-600 text-white w-16 h-16 rounded-[24px] flex items-center justify-center mb-10"><Lock size={32} /></div>
            <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</h3>
            <p className="text-slate-500 font-bold mb-8">Access your Kenyan business dashboard.</p>
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && <input type="text" placeholder="Full Name" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6 outline-none focus:ring-4 focus:ring-blue-100 font-bold" />}
              <input type="email" placeholder="Email Address" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6 outline-none focus:ring-4 focus:ring-blue-100 font-bold" />
              <input type="password" placeholder="Password" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6 outline-none focus:ring-4 focus:ring-blue-100 font-bold" />
              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95">{authMode === 'signin' ? 'Login' : 'Create Account'}</button>
            </form>
            <p className="mt-8 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">
              {authMode === 'signin' ? "No account?" : "Already joined?"}
              <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} className="ml-2 text-blue-600 hover:underline">{authMode === 'signin' ? 'Register' : 'Login'}</button>
            </p>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] shadow-2xl max-w-lg w-full p-12">
            <div className="flex justify-between items-start mb-10">
              <div className="bg-blue-50 text-blue-600 p-6 rounded-[32px]"><Zap size={40} /></div>
              <button onClick={() => setShowPayment(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={24} /></button>
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">Confirm Processing</h3>
            <div className="bg-slate-50 p-8 rounded-[36px] mb-10 flex items-center justify-between border border-slate-100">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{paymentType === 'bulk' ? 'Bulk Bundle' : 'Standard License'}</p>
                <p className="text-2xl font-black text-slate-900">{paymentType === 'bulk' ? 'Bulk Document Run' : 'Vector SVG Export'}</p>
              </div>
              <p className="text-4xl font-black text-blue-600 tracking-tighter">KES {paymentType === 'bulk' ? '1,500' : '650'}</p>
            </div>
            <div className="space-y-4">
              <button onClick={paymentType === 'bulk' ? () => alert("Initiating Bulk Run...") : handleDownload} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95">Complete Payment & Start</button>
              <button onClick={() => setShowPayment(false)} className="w-full bg-white text-slate-400 py-4 font-bold hover:text-slate-600 transition-all">Go Back</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            <div className="lg:col-span-6">
              <div className="flex items-center gap-2 mb-10">
                <div className="bg-blue-600 text-white p-2 rounded-xl"><Plus size={20} /></div>
                <h3 className="text-3xl font-black tracking-tighter">FreeStamps <span className="text-blue-600">KE</span></h3>
              </div>
              <p className="text-2xl text-slate-400 font-medium max-w-md leading-relaxed">The professional standard for official Kenyan stamps, seals, and automated document processing.</p>
            </div>
            <div className="lg:col-span-6 grid grid-cols-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Platform</h4>
                <ul className="space-y-4 text-slate-500 font-bold">
                  <li><button onClick={() => setActiveTab('templates')} className="hover:text-blue-600 transition-all">Templates</button></li>
                  <li><button onClick={() => setActiveTab('bulk')} className="hover:text-blue-600 transition-all">Bulk Signing</button></li>
                  <li><button onClick={() => setActiveTab('convert')} className="hover:text-blue-600 transition-all">AI Digitize</button></li>
                  <li><button onClick={() => setActiveTab('blogs')} className="hover:text-blue-600 transition-all">Blogs</button></li>
                </ul>
              </div>
              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Legal</h4>
                <ul className="space-y-4 text-slate-500 font-bold">
                  <li><button onClick={() => setActiveTab('help')} className="hover:text-blue-600 transition-all">Support</button></li>
                  <li><button onClick={() => setActiveTab('terms')} className="hover:text-blue-600 transition-all">Terms</button></li>
                  <li><button onClick={() => setActiveTab('privacy')} className="hover:text-blue-600 transition-all">Privacy</button></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-32 pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-10">
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">© 2024 JijiTechy Innovations Ltd. All rights reserved.</p>
            <div className="flex gap-8">
              <span className="text-slate-200 hover:text-blue-600 transition-all cursor-pointer"><ShieldCheck size={28} /></span>
              <span className="text-slate-200 hover:text-blue-600 transition-all cursor-pointer"><CreditCard size={28} /></span>
              <span className="text-slate-200 hover:text-blue-600 transition-all cursor-pointer"><Lock size={28} /></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
