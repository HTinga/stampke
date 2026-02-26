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
  Check
} from 'lucide-react';
import { StampConfig, StampTemplate, StampShape } from './types';
import { DEFAULT_CONFIG, TEMPLATES } from './constants';
import SVGPreview from './components/SVGPreview';
import TemplateLibrary from './components/TemplateLibrary';
import EditorControls from './components/EditorControls';
import BulkStamper from './components/BulkStamper';
import DigitalSignCenter from './components/DigitalSignCenter';
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
  const [activeTab, setActiveTab] = useState<'home' | 'editor' | 'templates' | 'convert' | 'bulk' | 'esign' | 'help' | 'terms' | 'privacy' | 'blogs' | 'resources' | 'account'>('home');
  const [stampConfig, setStampConfig] = useState<StampConfig>(DEFAULT_CONFIG);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<'single' | 'bulk' | 'esign'>('single');
  const [bulkCost, setBulkCost] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [pendingStampFieldId, setPendingStampFieldId] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const [openedFromSignCenter, setOpenedFromSignCenter] = useState(false);

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

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setUser({ name: 'Kenya Business Owner', email: 'owner@example.ke' });
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
            <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl shadow-blue-200 group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">FreeStamps <span className="text-blue-600">KE</span></h1>
          </div>

          <nav className="hidden xl:flex items-center gap-8 text-[12px] font-black text-slate-800 uppercase tracking-widest">
            <button onClick={() => setActiveTab('home')} className={`hover:text-blue-600 transition-colors ${activeTab === 'home' ? 'text-blue-600 underline decoration-2 underline-offset-4' : ''}`}>Home</button>
            <button onClick={() => setActiveTab('esign')} className={`hover:text-blue-600 transition-colors ${activeTab === 'esign' ? 'text-blue-600 underline decoration-2 underline-offset-4' : ''}`}>Digital Sign</button>
            <button onClick={() => setActiveTab('templates')} className={`hover:text-blue-600 transition-colors ${activeTab === 'templates' ? 'text-blue-600 underline decoration-2 underline-offset-4' : ''}`}>Templates</button>
            <button onClick={() => setActiveTab('bulk')} className={`hover:text-blue-600 transition-colors ${activeTab === 'bulk' ? 'text-blue-600 underline decoration-2 underline-offset-4' : ''}`}>Bulk Engine</button>
            <button onClick={() => setActiveTab('convert')} className={`hover:text-blue-600 transition-colors ${activeTab === 'convert' ? 'text-blue-600 underline decoration-2 underline-offset-4' : ''}`}>AI Scan</button>
            <button onClick={() => setActiveTab('blogs')} className={`hover:text-blue-600 transition-colors ${activeTab === 'blogs' ? 'text-blue-600 underline decoration-2 underline-offset-4' : ''}`}>Blogs</button>
            <button onClick={() => setActiveTab('resources')} className={`hover:text-blue-600 transition-colors ${activeTab === 'resources' ? 'text-blue-600 underline decoration-2 underline-offset-4' : ''}`}>Resources</button>
            
            {isLoggedIn ? (
              <button onClick={() => setActiveTab('account')} className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                <User size={16} /> Dashboard
              </button>
            ) : (
              <button onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }} className="bg-blue-600 text-white px-7 py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95">
                Client Login
              </button>
            )}
          </nav>

          <button className="xl:hidden text-slate-900 p-2 hover:bg-slate-50 rounded-xl transition-all" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'home' && (
          <>
            {/* Hero Section */}
            <section className="pt-24 pb-32 px-4 bg-gradient-to-b from-slate-50 via-white to-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-[120px] -z-10"></div>
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-widest mb-10 shadow-xl shadow-blue-200">
                    <Award size={14} /> The #1 Legal Stamp & Sign Platform in Kenya
                  </div>
                  <h2 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 leading-[1] tracking-tighter">
                    Enterprise Grade <span className="text-blue-600">Document Flow.</span>
                  </h2>
                  <p className="text-2xl text-slate-500 mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                    Authenticate your firm's document workflow. Place stamps, collect digital signatures, and track audit logs with absolute legal integrity.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
                    <button onClick={() => setActiveTab('esign')} className="w-full sm:w-auto bg-blue-600 text-white px-12 py-6 rounded-3xl font-black text-xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-300 active:scale-95 flex items-center justify-center gap-3 group">
                      Digital Sign Center <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                    </button>
                    <button onClick={() => setActiveTab('templates')} className="w-full sm:w-auto bg-slate-900 text-white px-12 py-6 rounded-3xl font-black text-xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
                      <Zap size={24} className="text-blue-400" /> Rubber Stamp Studio
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative">
                  <div className="relative z-10 p-6 bg-white rounded-[56px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 rotate-3 hover:rotate-0 transition-all duration-700 scale-110 group">
                    <div className="bg-slate-50 p-12 rounded-[48px] border-2 border-dashed border-slate-200 group-hover:border-blue-200 transition-colors">
                      <SVGPreview config={{ ...DEFAULT_CONFIG, logoUrl: null }} className="h-[350px] border-none !p-0" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Showcase & Features */}
            <section className="py-24 bg-slate-900 overflow-hidden">
               <div className="max-w-7xl mx-auto px-4 mb-16 text-center lg:text-left">
                 <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">Official Signing Standards</h3>
                 <p className="text-slate-400 text-xl font-medium">Trusted by law firms and corporations across Nairobi.</p>
               </div>
               <div className="flex gap-10 animate-marquee whitespace-nowrap">
                  {[...TEMPLATES, ...TEMPLATES].map((tpl, idx) => (
                    <div key={`${tpl.id}-${idx}`} className="inline-block w-[300px] h-[300px] bg-white rounded-[40px] p-8 shrink-0 hover:scale-105 transition-transform cursor-pointer shadow-2xl">
                       <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] p-4">
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-full border-2 mx-auto mb-4" style={{ borderColor: tpl.borderColor }}></div>
                            <p className="font-black text-slate-900 uppercase text-[10px] tracking-widest truncate">{tpl.name}</p>
                            <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-1">{tpl.category}</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            <section className="py-32 px-4 bg-white">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                  <h3 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6">Complete <span className="text-blue-600">Digital Authority.</span></h3>
                  <p className="text-xl text-slate-500 font-medium max-w-3xl mx-auto">From rubber stamps to encrypted e-signatures, manage your firm's identity in one high-precision platform.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="p-12 bg-slate-50 rounded-[56px] border border-slate-100">
                    <ShieldCheck className="text-blue-600 mb-8" size={48} />
                    <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Audit Logs</h4>
                    <p className="text-slate-500 text-lg leading-relaxed font-medium">Full tracking of IP addresses, timestamps, and signer identities for legally-binding audit trails.</p>
                  </div>
                  <div className="p-12 bg-slate-50 rounded-[56px] border border-slate-100">
                    {/* Fixed missing Users component reference */}
                    <Users className="text-blue-600 mb-8" size={48} />
                    <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Multi-Signer</h4>
                    <p className="text-slate-500 text-lg leading-relaxed font-medium">Design complex signing orders. Send to one or many recipients with specific roles and sequences.</p>
                  </div>
                  <div className="p-12 bg-slate-50 rounded-[56px] border border-slate-100">
                    <CreditCard className="text-blue-600 mb-8" size={48} />
                    <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Payment on Sign</h4>
                    <p className="text-slate-500 text-lg leading-relaxed font-medium">Collect payments (M-PESA/Visa) the moment a document is signed to streamline your firm's billing.</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        <div className={activeTab === 'esign' ? 'block' : 'hidden'}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
            <DigitalSignCenter 
              stampConfig={stampConfig} 
              onOpenStudio={(fieldId) => {
                setOpenedFromSignCenter(true);
                setPendingStampFieldId(fieldId || null);
                setActiveTab('editor');
              }}
              pendingStampFieldId={pendingStampFieldId}
              onClearPendingField={() => setPendingStampFieldId(null)}
              isActive={activeTab === 'esign'}
            />
          </div>
        </div>

        {activeTab === 'templates' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Authentic Templates</h2>
            <p className="text-slate-500 font-medium mb-12">Professionally captured from real Kenyan rubber stamp samples.</p>
            <TemplateLibrary onSelect={handleTemplateSelect} />
          </div>
        )}

        {activeTab === 'bulk' && (
          <BulkStamper config={stampConfig} onStartBulk={(cost) => triggerPayment('bulk', cost)} />
        )}

        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 min-h-[calc(100vh-64px)]">
            <div className="lg:col-span-5 border-r border-slate-100 bg-slate-50/30 p-4 md:p-8 order-2 lg:order-1">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => {
                  if (openedFromSignCenter) {
                    setActiveTab('esign');
                    setOpenedFromSignCenter(false);
                  } else {
                    setActiveTab('templates');
                  }
                }} className="p-2 hover:bg-white rounded-xl shadow-sm border border-slate-100 transition-all"><ChevronLeft size={20} /></button>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Custom Builder</h2>
                {openedFromSignCenter && (
                  <div className="ml-auto bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Linked to Sign Center
                  </div>
                )}
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
                  {openedFromSignCenter ? (
                    <button 
                      onClick={() => {
                        setActiveTab('esign');
                        setOpenedFromSignCenter(false);
                      }} 
                      className="w-full bg-blue-600 text-white py-6 px-10 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95"
                    >
                      <Check size={28} /> Done Editing
                    </button>
                  ) : (
                    <>
                      <button onClick={() => triggerPayment('single')} className="flex-1 bg-blue-600 text-white py-5 px-10 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95">
                        <Download size={24} /> Download SVG
                      </button>
                      <button onClick={() => setActiveTab('bulk')} className="flex-1 bg-slate-900 text-white py-5 px-10 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-800 shadow-xl active:scale-95">
                        <Copy size={24} className="text-blue-400" /> Use for Bulk Run
                      </button>
                    </>
                  )}
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
          </div>
        )}

        {/* Rest of the Tabs (Blogs, Resources, Legal) */}
        {['blogs', 'resources', 'terms', 'privacy', 'help', 'account'].includes(activeTab) && (
          <div className="max-w-5xl mx-auto py-24 px-4">
             {/* Dynamic content would go here as per previous App.tsx implementation */}
             <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm text-center">
                <h3 className="text-3xl font-black text-slate-900 mb-4 capitalize">{activeTab}</h3>
                <p className="text-slate-500">Enterprise content coming soon.</p>
             </div>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] shadow-2xl max-w-lg w-full p-12">
            <div className="flex justify-between items-start mb-10">
              <div className="bg-blue-50 text-blue-600 p-6 rounded-[32px]"><Zap size={40} /></div>
              <button onClick={() => setShowPayment(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={24} /></button>
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">Confirm Transaction</h3>
            <div className="bg-slate-50 p-8 rounded-[36px] mb-10 flex items-center justify-between border border-slate-100">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{paymentType === 'bulk' ? 'Bulk Processing Fee' : 'Platform License'}</p>
                <p className="text-2xl font-black text-slate-900">{paymentType === 'bulk' ? 'Verified Batch' : 'Digital Authority'}</p>
              </div>
              <p className="text-4xl font-black text-blue-600 tracking-tighter">KES {(paymentType === 'bulk' ? bulkCost : 650).toLocaleString()}</p>
            </div>
            <div className="space-y-4">
              <button onClick={handleDownload} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95">Complete Transaction</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Restored */}
      <footer className="bg-slate-900 text-slate-400 pt-32 pb-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center lg:text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-20">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-10 justify-center lg:justify-start">
                <div className="bg-blue-600 text-white p-2 rounded-xl"><Plus size={24} /></div>
                <h3 className="text-3xl font-black tracking-tighter text-white">FreeStamps <span className="text-blue-600">KE</span></h3>
              </div>
              <p className="text-2xl font-medium leading-relaxed max-w-md mx-auto lg:mx-0 mb-10">Empowering Kenyan firms with automated, legally-compliant digital authentication tools.</p>
              <div className="flex gap-6 justify-center lg:justify-start">
                 <button className="bg-slate-800 p-4 rounded-2xl hover:text-white transition-all"><Twitter size={24} /></button>
                 <button className="bg-slate-800 p-4 rounded-2xl hover:text-white transition-all"><Linkedin size={24} /></button>
                 <button className="bg-slate-800 p-4 rounded-2xl hover:text-white transition-all"><Github size={24} /></button>
              </div>
            </div>
          </div>
          <div className="mt-32 pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-10">
            <p className="font-black text-[10px] uppercase tracking-widest text-slate-500">© 2024 JijiTechy Innovations. LSK Standards Applied.</p>
            <div className="flex gap-10">
               <div className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest"><ShieldCheck size={16} className="text-blue-600" /> AES-256 ENCRYPTED</div>
               <div className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest"><CreditCard size={16} className="text-blue-600" /> MPESA INTEGRATED</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;