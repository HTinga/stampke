
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Download, Trash2, ChevronLeft, Image as ImageIcon, Menu, X, Sparkles, ArrowRight, ShieldCheck, Zap, User, BookOpen, Layers, Award, Search, Lock, Moon, Sun, Globe, ShieldAlert, Facebook, Twitter, Instagram, Linkedin
} from 'lucide-react';
import { StampConfig, StampTemplate, StampShape, SubscriptionTier, UserAccount, UserRole } from './types';
import { DEFAULT_CONFIG, TRANSLATIONS, MOCK_USERS } from './constants';
import SVGPreview from './components/SVGPreview';
import TemplateLibrary from './components/TemplateLibrary';
import EditorControls from './components/EditorControls';
import AuthPage from './components/AuthPage';
import SubscriptionPage from './components/SubscriptionPage';
import BlogPage from './components/BlogPage';
import BulkStamping from './components/BulkStamping';
import DemoSection from './components/DemoSection';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import PaymentModal from './components/PaymentModal';
import { analyzeStampImage } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'editor' | 'templates' | 'convert' | 'auth' | 'pricing' | 'blogs' | 'bulk' | 'profile' | 'admin'>('home');
  const [stampConfig, setStampConfig] = useState<StampConfig>(DEFAULT_CONFIG);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [user, setUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as any) || 'light');
  const [lang, setLang] = useState<'en' | 'sw'>(() => (localStorage.getItem('lang') as any) || 'en');

  const svgRef = useRef<SVGSVGElement>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

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
    });
    setActiveTab('editor');
  };

  const handleDownloadInitiate = () => {
    // Only pay on download as requested
    if (!user || user.tier === SubscriptionTier.FREE) {
      setShowPayment(true);
    } else {
      handleDownload();
    }
  };

  const handleDownload = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 flex flex-col">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 lg:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="bg-blue-600 text-white p-1.5 rounded-xl"><Plus size={20} strokeWidth={3} /></div>
            <h1 className="text-lg font-black dark:text-white">FreeStamps <span className="text-blue-600">KE</span></h1>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            <button onClick={() => setActiveTab('home')} className={`hover:text-blue-600 ${activeTab === 'home' ? 'text-blue-600' : ''}`}>{t.home}</button>
            <button onClick={() => setActiveTab('templates')} className={`hover:text-blue-600 ${activeTab === 'templates' ? 'text-blue-600' : ''}`}>{t.templates}</button>
            <button onClick={() => setActiveTab('bulk')} className={`hover:text-emerald-600 ${activeTab === 'bulk' ? 'text-emerald-600' : ''}`}>{t.bulk}</button>
            <button onClick={() => setActiveTab('blogs')} className={`hover:text-blue-600 ${activeTab === 'blogs' ? 'text-blue-600' : ''}`}>{t.resources}</button>
            
            <div className="flex items-center gap-4 pl-4 border-l dark:border-slate-800">
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">{theme === 'light' ? <Moon size={16}/> : <Sun size={16}/>}</button>
              <button onClick={() => setLang(lang === 'en' ? 'sw' : 'en')} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-1 font-bold"><Globe size={16}/> {lang.toUpperCase()}</button>
              {user ? (
                <button onClick={() => setActiveTab('profile')} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                  <User size={14}/> <span>{t.profile}</span>
                </button>
              ) : (
                <button onClick={() => setActiveTab('auth')} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 py-2 rounded-xl">{t.signIn}</button>
              )}
            </div>
          </nav>

          <button className="lg:hidden text-slate-600 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white dark:bg-slate-900 z-[200] p-8 flex flex-col">
           <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 text-white p-1.5 rounded-xl"><Plus size={16} /></div>
                <h1 className="font-black dark:text-white">FreeStamps KE</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full dark:text-white"><X size={24} /></button>
           </div>
           <div className="flex-1 flex flex-col gap-6 text-3xl font-black tracking-tight dark:text-white">
             {['home', 'templates', 'bulk', 'blogs', 'profile'].map(tab => (
               <button key={tab} onClick={() => { setActiveTab(tab as any); setIsMobileMenuOpen(false); }} className={`text-left capitalize ${activeTab === tab ? 'text-blue-600' : 'text-slate-300'}`}>
                 {tab === 'blogs' ? t.resources : tab === 'profile' ? t.profile : t[tab as keyof typeof t] || tab}
               </button>
             ))}
           </div>
           <div className="pt-8 border-t dark:border-slate-800 flex justify-around">
             <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="flex items-center gap-2 font-bold text-slate-500 uppercase text-[10px] tracking-widest"><Moon size={16}/> {theme}</button>
             <button onClick={() => setLang(lang === 'en' ? 'sw' : 'en')} className="flex items-center gap-2 font-bold text-slate-500 uppercase text-[10px] tracking-widest"><Globe size={16}/> {lang}</button>
           </div>
        </div>
      )}

      <main className="flex-1">
        {activeTab === 'home' && (
          <div className="animate-in fade-in">
             <section className="pt-20 lg:pt-32 pb-32 px-4 text-center lg:text-left">
               <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                 <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-[9px] font-black uppercase tracking-widest mb-6 border border-blue-100 dark:border-blue-800">
                      <Sparkles size={12} fill="currentColor" /> Authorized Kenyan Engine
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-none tracking-tight">
                      {t.slogan} <span className="text-blue-600">Instant.</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                      High-fidelity official digital stamps for Advocates, Schools, and Businesses. Authenticity guaranteed.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                      <button onClick={() => setActiveTab('templates')} className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 flex items-center justify-center gap-2">
                        {t.browse} <ArrowRight size={18} />
                      </button>
                      <label className="w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-700 px-8 py-4 rounded-2xl font-black text-sm cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-lg">
                        <ImageIcon size={18} className="text-blue-600" />
                        {t.aiDigitize}
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                 </div>
                 <div className="flex-1 relative">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-[48px] shadow-2xl border border-slate-100 dark:border-slate-700 -rotate-2">
                       <div className="bg-slate-50/50 dark:bg-slate-900/50 p-8 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-700">
                          <SVGPreview config={{ ...DEFAULT_CONFIG, logoUrl: null }} className="h-[250px] md:h-[350px] border-none !p-0" />
                       </div>
                    </div>
                 </div>
               </div>
             </section>
             <DemoSection />
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="max-w-7xl mx-auto px-4 py-16 animate-in">
             <TemplateLibrary onSelect={handleTemplateSelect} userTier={user?.tier || SubscriptionTier.FREE} onUpgrade={() => setActiveTab('pricing')} />
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 min-h-[calc(100vh-80px)]">
            {/* Live Preview - Sticky on Mobile */}
            <div className="lg:col-span-7 bg-slate-50/50 dark:bg-slate-900/50 p-4 lg:p-12 flex items-center justify-center sticky top-16 lg:static z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md lg:backdrop-blur-none border-b lg:border-none border-slate-100 dark:border-slate-800">
               <div className="w-full max-w-lg">
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-[40px] shadow-xl border border-slate-100 dark:border-slate-700 group transition-all">
                    <SVGPreview ref={svgRef} config={stampConfig} className="h-[220px] md:h-[350px] border-none shadow-none !bg-transparent" />
                 </div>
                 <div className="flex gap-2 mt-4">
                   <button onClick={handleDownloadInitiate} className="flex-[3] bg-blue-600 text-white py-4 rounded-xl font-black text-xs shadow-xl flex items-center justify-center gap-2">
                     <Download size={16} /> {t.download}
                   </button>
                   <button onClick={() => setStampConfig(DEFAULT_CONFIG)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-4 rounded-xl flex items-center justify-center">
                     <Trash2 size={16} />
                   </button>
                 </div>
               </div>
            </div>

            {/* Controls */}
            <div className="lg:col-span-5 p-4 lg:p-12 overflow-y-auto custom-scrollbar bg-slate-50/20 dark:bg-slate-950">
               <div className="flex items-center gap-3 mb-8">
                 <button onClick={() => setActiveTab('templates')} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg dark:text-white"><ChevronLeft size={18} /></button>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white">{t.editStamp}</h2>
               </div>
               <EditorControls 
                 config={stampConfig} 
                 onChange={(u) => setStampConfig(prev => ({ ...prev, ...u }))} 
                 userTier={user?.tier || SubscriptionTier.FREE}
                 onUpgrade={() => setActiveTab('pricing')}
               />
            </div>
          </div>
        )}

        {activeTab === 'profile' && user && <ProfilePage user={user} onLogout={() => { setUser(null); setActiveTab('home'); }} />}
        {activeTab === 'admin' && user?.role === 'ADMIN' && <AdminPage />}
        {activeTab === 'blogs' && <BlogPage />}
        {activeTab === 'pricing' && <SubscriptionPage onSelectPlan={() => setShowPayment(true)} />}
        {activeTab === 'auth' && <AuthPage onSuccess={(u) => { setUser(u); setActiveTab('home'); }} onNavigateToPricing={() => setActiveTab('pricing')} />}
        {activeTab === 'bulk' && <BulkStamping />}
      </main>

      {showPayment && (
        <PaymentModal 
          price="KES 650"
          onClose={() => setShowPayment(false)} 
          onSuccess={() => {
            if (user) setUser({...user, tier: SubscriptionTier.PRO, expiryDate: '2025-01-01'});
            handleDownload();
          }} 
        />
      )}

      <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1 space-y-6">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 text-white p-1.5 rounded-xl"><Plus size={20} /></div>
                <h3 className="text-xl font-black dark:text-white tracking-tighter">FreeStamps <span className="text-blue-600">KE</span></h3>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                The premier administrative engine for digital rubber stamps and official seals in Kenya. Trusted by advocates and enterprises nationwide.
              </p>
              <div className="flex gap-4">
                <button className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-600 transition-all shadow-sm"><Facebook size={18} /></button>
                <button className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-all shadow-sm"><Twitter size={18} /></button>
                <button className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-400 hover:text-pink-600 transition-all shadow-sm"><Instagram size={18} /></button>
                <button className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-700 transition-all shadow-sm"><Linkedin size={18} /></button>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Platform</h4>
              <ul className="space-y-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <li><button onClick={() => setActiveTab('templates')} className="hover:text-blue-600">Templates</button></li>
                <li><button onClick={() => setActiveTab('bulk')} className="hover:text-blue-600">Bulk Generator</button></li>
                <li><button onClick={() => setActiveTab('pricing')} className="hover:text-blue-600">Pricing</button></li>
                <li><button onClick={() => setActiveTab('blogs')} className="hover:text-blue-600">Resources</button></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Support</h4>
              <ul className="space-y-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <li><a href="#" className="hover:text-blue-600">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-600">Contact Us</a></li>
                <li><a href="#" className="hover:text-blue-600">API Documentation</a></li>
                <li><a href="#" className="hover:text-blue-600">Verify Seal</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Compliance</h4>
              <ul className="space-y-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <li><a href="#" className="hover:text-blue-600">{t.footerLegal}</a></li>
                <li><a href="#" className="hover:text-blue-600">{t.footerPrivacy}</a></li>
                <li><a href="#" className="hover:text-blue-600">{t.footerTerms}</a></li>
                {user?.role === 'ADMIN' && (
                  <li><button onClick={() => setActiveTab('admin')} className="text-amber-500 hover:underline">Secret Admin Terminal</button></li>
                )}
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">&copy; 2024 JijiTechy Solutions. All rights reserved. Nairobi, Kenya.</p>
            <div className="flex gap-8 items-center">
               <button onClick={() => setLang(lang === 'en' ? 'sw' : 'en')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all">
                  <Globe size={16} /> {lang === 'en' ? 'English' : 'Kiswahili'}
               </button>
               <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all">
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} {theme === 'light' ? 'Dark' : 'Light'} Mode
               </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
