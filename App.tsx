
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Download, Trash2, ChevronLeft, Image as ImageIcon, Menu, X, Sparkles, ArrowRight, ShieldCheck, Zap, User, BookOpen, Layers, Award, Search, Lock, Store
} from 'lucide-react';
import { StampConfig, StampTemplate, StampShape, SubscriptionTier } from './types';
import { DEFAULT_CONFIG } from './constants';
import SVGPreview from './components/SVGPreview';
import TemplateLibrary from './components/TemplateLibrary';
import EditorControls from './components/EditorControls';
import AuthPage from './components/AuthPage';
import SubscriptionPage from './components/SubscriptionPage';
import BlogPage from './components/BlogPage';
import BulkStamping from './components/BulkStamping';
import DemoSection from './components/DemoSection';
import StampCertificate from './components/StampCertificate';
import { analyzeStampImage } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'editor' | 'templates' | 'convert' | 'auth' | 'pricing' | 'blogs' | 'bulk' | 'certificate'>('home');
  const [stampConfig, setStampConfig] = useState<StampConfig>(DEFAULT_CONFIG);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userTier, setUserTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sync scroll on mobile tab change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const handleTemplateSelect = (template: StampTemplate) => {
    // LOCKING LOGIC: If premium and user is free, redirect to pricing
    if (template.isPremium && userTier === SubscriptionTier.FREE) {
      setActiveTab('pricing');
      return;
    }
    
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

  const handleAuthSuccess = () => {
    setUser({ email: 'owner@cybercafe.ke' });
    setActiveTab('home');
  };

  const handleUpgrade = (tier: SubscriptionTier) => {
    setUserTier(tier);
    if (!user) setUser({ email: 'authorized@ke.org' });
    setActiveTab('home');
    alert(`Upgraded to ${tier} Successfully! Pro templates and corporate tools are now active.`);
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
    link.download = `${stampConfig.primaryText.toLowerCase().replace(/\s+/g, '_')}_official_stamp.svg`;
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
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Responsive Navigation */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 lg:h-24 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
            <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl shadow-blue-200 transition-all group-hover:scale-110 active:scale-95">
              <Plus size={24} strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter leading-none">FreeStamps <span className="text-blue-600">KE</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Official Kenya Engine</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
            <button onClick={() => setActiveTab('home')} className={`hover:text-blue-600 transition-all ${activeTab === 'home' ? 'text-blue-600' : ''}`}>Home</button>
            <button onClick={() => setActiveTab('templates')} className={`hover:text-blue-600 transition-all ${activeTab === 'templates' ? 'text-blue-600' : ''}`}>Templates</button>
            <button onClick={() => setActiveTab('bulk')} className={`hover:text-emerald-600 transition-all ${activeTab === 'bulk' ? 'text-emerald-600' : ''}`}>Bulk Stamping</button>
            <button onClick={() => setActiveTab('blogs')} className={`hover:text-blue-600 transition-all ${activeTab === 'blogs' ? 'text-blue-600' : ''}`}>Resources</button>
            <button onClick={() => setActiveTab('pricing')} className={`hover:text-blue-600 transition-all ${activeTab === 'pricing' ? 'text-blue-600' : ''}`}>Pricing</button>
            
            {user ? (
              <div className="flex items-center gap-4 text-slate-900 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 group cursor-pointer" onClick={() => setUser(null)}>
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{userTier.charAt(0)}</div>
                <div className="flex flex-col">
                  <span className="font-black text-[9px] leading-tight text-blue-600">{userTier} TIER</span>
                  <span className="font-bold lowercase text-[8px] text-slate-400">Sign Out</span>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setActiveTab('auth')}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 font-black transition-all active:scale-95"
              >
                Sign In
              </button>
            )}
          </nav>

          <button className="lg:hidden text-slate-600 p-3 bg-slate-50 rounded-xl" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-[100] flex flex-col p-8 animate-in slide-in-from-right duration-500">
           <div className="flex justify-between items-center mb-16">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2.5 rounded-2xl"><Plus size={20} /></div>
                <h1 className="text-xl font-black">FreeStamps KE</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-4 bg-slate-100 rounded-full"><X size={28} /></button>
           </div>
           
           <div className="flex-1 flex flex-col gap-10 text-4xl font-black tracking-tighter">
             {['home', 'templates', 'bulk', 'blogs', 'pricing'].map(tab => (
               <button 
                 key={tab} 
                 onClick={() => { setActiveTab(tab as any); setIsMobileMenuOpen(false); }}
                 className={`text-left capitalize ${activeTab === tab ? 'text-blue-600' : 'text-slate-300'}`}
               >
                 {tab === 'blogs' ? 'Resources' : tab}
               </button>
             ))}
           </div>
           
           <div className="pt-12 border-t border-slate-100">
              {user ? (
                <div className="space-y-4">
                  <p className="font-black text-slate-400 uppercase text-xs tracking-widest">{userTier} Account Active</p>
                  <button onClick={() => setUser(null)} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xl">Sign Out</button>
                </div>
              ) : (
                <button onClick={() => { setActiveTab('auth'); setIsMobileMenuOpen(false); }} className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black text-xl shadow-2xl">Sign In</button>
              )}
           </div>
        </div>
      )}

      <main className="flex-1">
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-700">
             <section className="pt-24 lg:pt-32 pb-40 px-4 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
               <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
                 <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-blue-100">
                      <Sparkles size={14} fill="currentColor" /> Advanced Official Kenyan Engine v5.0
                    </div>
                    <h2 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 leading-[0.95] tracking-tighter">
                      Official Kenyan <br/><span className="text-blue-600">Stamps. Instant.</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                      High-fidelity official digital stamps for Advocates, Schools, and Businesses. Vector ready. Authenticity guaranteed.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start">
                      <button onClick={() => setActiveTab('templates')} className="w-full sm:w-auto bg-blue-600 text-white px-12 py-6 rounded-[32px] font-black text-lg shadow-2xl active:scale-95 flex items-center justify-center gap-4 group">
                        Browse 30+ Templates <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                      </button>
                      <label className="w-full sm:w-auto bg-white text-slate-900 border-2 border-slate-100 px-12 py-6 rounded-[32px] font-black text-lg cursor-pointer flex items-center justify-center gap-4 active:scale-95 shadow-lg hover:border-blue-200 transition-all">
                        <ImageIcon size={22} className="text-blue-600" />
                        AI Digitize Tool
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                 </div>
                 <div className="flex-1 relative lg:translate-x-10">
                    <div className="relative z-10 p-6 bg-white rounded-[72px] shadow-2xl border border-slate-100 -rotate-2 hover:rotate-0 transition-all duration-1000 scale-110">
                       <div className="bg-slate-50/50 p-10 rounded-[56px] border-2 border-dashed border-slate-200">
                          <SVGPreview config={{ ...DEFAULT_CONFIG, logoUrl: null }} className="h-[300px] md:h-[450px] border-none !p-0" />
                       </div>
                    </div>
                 </div>
               </div>
             </section>
             <DemoSection />
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 animate-in slide-in-from-bottom-8 duration-500">
             <div className="mb-16 flex flex-col md:flex-row items-end justify-between gap-10">
                <div>
                   <div className="text-blue-600 text-xs font-black uppercase tracking-[0.3em] mb-4">The Administrative Registry</div>
                   <h2 className="text-5xl lg:text-8xl font-black text-slate-900 mb-4 tracking-tighter leading-none">Official <br/>Stamp Library.</h2>
                   <p className="text-xl text-slate-500 font-medium max-w-xl">Standardized templates for Kenyan administrative law, trade, and education.</p>
                </div>
                <button onClick={() => setActiveTab('editor')} className="w-full lg:w-auto bg-slate-900 text-white px-12 py-6 rounded-[32px] font-black flex items-center justify-center gap-4 shadow-2xl hover:bg-slate-800 transition-all active:scale-95">
                  <Plus size={24} strokeWidth={3} /> Custom Design
                </button>
             </div>
             <TemplateLibrary onSelect={handleTemplateSelect} userTier={userTier} onUpgrade={() => setActiveTab('pricing')} />
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 animate-in fade-in duration-500 min-h-[calc(100vh-80px)]">
            {/* Control Sidebar - Juggles well on mobile as it scrolls under the sticky preview */}
            <div className="lg:col-span-5 border-r border-slate-100 bg-slate-50/20 p-6 md:p-12 order-2 lg:order-1 overflow-y-auto custom-scrollbar">
               <div className="flex items-center gap-5 mb-16">
                 <button onClick={() => setActiveTab('templates')} className="p-4 bg-white rounded-[24px] shadow-sm border border-slate-100 hover:scale-105 active:scale-90 transition-all"><ChevronLeft size={24} /></button>
                 <div>
                   <h2 className="text-3xl font-black tracking-tighter text-slate-900">Stamp Builder</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Kenya Engine v5.2</p>
                 </div>
               </div>
               <EditorControls 
                 config={stampConfig} 
                 onChange={(updates) => setStampConfig(prev => ({ ...prev, ...updates }))} 
                 userTier={userTier}
                 onUpgrade={() => setActiveTab('pricing')}
               />
            </div>

            {/* Live Preview Area - Sticky for responsive juggling */}
            <div className="lg:col-span-7 p-6 md:p-16 flex flex-col items-center justify-center order-1 lg:order-2 bg-white sticky top-20 h-fit lg:h-auto overflow-hidden">
               <div className="w-full max-w-2xl space-y-12">
                 <div className="bg-white p-3 rounded-[72px] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden group">
                   <div className="bg-slate-50/50 p-6 md:p-16 rounded-[64px] border-2 border-dashed border-slate-200 transition-all group-hover:border-blue-400">
                     <SVGPreview ref={svgRef} config={stampConfig} className="h-[300px] md:h-[550px] border-none shadow-none !bg-transparent" />
                   </div>
                 </div>
                 <div className="flex flex-col sm:flex-row gap-5">
                   <button onClick={() => setShowPayment(true)} className="flex-[2] bg-blue-600 text-white py-6 lg:py-8 px-12 rounded-[32px] font-black text-xl shadow-2xl flex items-center justify-center gap-5 hover:bg-blue-700 transition-all active:scale-95">
                     <Download size={32} strokeWidth={3} /> Download Official Stamp
                   </button>
                   <button onClick={() => setStampConfig(DEFAULT_CONFIG)} className="flex-1 bg-slate-100 text-slate-600 p-6 rounded-[32px] font-black hover:bg-red-50 hover:text-red-600 shadow-md transition-all flex items-center justify-center gap-3">
                     <Trash2 size={24} /> Reset
                   </button>
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'blogs' && <BlogPage />}
        
        {activeTab === 'bulk' && (
          userTier === SubscriptionTier.BUSINESS ? <BulkStamping /> : 
          <div className="max-w-4xl mx-auto py-32 px-4 text-center space-y-12 animate-in zoom-in duration-500">
             <div className="bg-emerald-50 text-emerald-600 w-32 h-32 rounded-[48px] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-100 border border-emerald-100"><Layers size={64} /></div>
             <div className="space-y-4">
                <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9]">Bulk Engine <br/><span className="text-emerald-600">is Locked.</span></h2>
                <p className="text-2xl text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">Automate 1,000s of official stamps for report cards and certificates instantly. This tool is exclusive to Business subscribers.</p>
             </div>
             <button onClick={() => setActiveTab('pricing')} className="bg-slate-900 text-white px-12 py-6 rounded-[32px] font-black text-xl hover:bg-slate-800 shadow-2xl transition-all active:scale-95">Upgrade to Business Plan</button>
          </div>
        )}

        {activeTab === 'pricing' && <SubscriptionPage onSelectPlan={(id) => handleUpgrade(id as SubscriptionTier)} />}
        {activeTab === 'auth' && <AuthPage onSuccess={handleAuthSuccess} onNavigateToPricing={() => setActiveTab('pricing')} />}
        
        {activeTab === 'convert' && (
          <div className="max-w-4xl mx-auto py-32 px-4 animate-in zoom-in duration-500">
             <div className="text-center mb-16 space-y-8">
               <div className="bg-blue-600 text-white w-24 h-24 rounded-[36px] flex items-center justify-center mx-auto shadow-2xl">
                 <Zap size={48} strokeWidth={3} />
               </div>
               <h2 className="text-6xl font-black text-slate-900 tracking-tighter">AI Stamp Digitizer</h2>
               <p className="text-2xl text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">Instantly convert a photo of a physical rubber stamp into a clean, scalable vector digital asset using Gemini 3 AI.</p>
             </div>
             <div className="bg-white border-4 border-dashed border-slate-100 rounded-[64px] p-24 text-center relative hover:border-blue-300 transition-all group cursor-pointer shadow-2xl">
               {isProcessing ? (
                 <div className="space-y-8 py-10">
                   <div className="relative w-28 h-28 mx-auto border-[10px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-3xl font-black text-slate-900">AI Processing & Reconstructing...</p>
                 </div>
               ) : (
                 <>
                   <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                   <div className="space-y-8">
                     <div className="bg-slate-50 w-28 h-28 rounded-[48px] flex items-center justify-center mx-auto text-slate-300 group-hover:scale-110 transition-transform duration-500"><Plus size={56} strokeWidth={3} /></div>
                     <p className="text-3xl font-black text-slate-800 tracking-tighter">Upload physical stamp photo</p>
                   </div>
                 </>
               )}
             </div>
          </div>
        )}
      </main>

      {/* Export & Payment Modal - Highly Responsive */}
      {showPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[72px] shadow-2xl max-w-xl w-full overflow-hidden border border-white/20 animate-in zoom-in duration-300">
             <div className="p-12 lg:p-16">
               <div className="flex justify-between items-start mb-12">
                 <div className="bg-blue-600 text-white p-7 rounded-[32px] shadow-2xl shadow-blue-100"><Download size={36} strokeWidth={3} /></div>
                 <button onClick={() => setShowPayment(false)} className="p-5 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={36} /></button>
               </div>
               <h3 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.9]">Official Asset <br/>Export.</h3>
               <p className="text-slate-500 text-xl font-medium mb-12 leading-relaxed">Download a high-fidelity vector SVG for your professional documents. Guaranteed Kenyan judicial standards.</p>
               
               {stampConfig.includeCertificate && (
                 <div className="bg-emerald-50 text-emerald-700 p-6 rounded-[32px] border border-emerald-100 text-[10px] font-black mb-10 flex items-center gap-4 uppercase tracking-widest">
                   <ShieldCheck size={24} /> Authenticity Certificate & Serial ID Included
                 </div>
               )}
               
               <div className="flex items-center justify-between mb-12 bg-slate-50 p-10 rounded-[40px] border-2 border-slate-100/50">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Standard Professional License</p>
                    <p className="text-3xl font-black text-slate-900">Single Stamp Export</p>
                 </div>
                 <p className="text-5xl font-black text-blue-600 tracking-tighter">KES 650</p>
               </div>
               <button onClick={handleDownload} className="w-full bg-slate-900 text-white py-8 rounded-[36px] font-black text-2xl hover:bg-slate-800 transition-all shadow-2xl active:scale-95">Complete & Download SVG</button>
             </div>
           </div>
        </div>
      )}
      
      <footer className="bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-20">
            <div className="md:col-span-6 space-y-12">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-xl shadow-blue-100">
                  <Plus size={32} strokeWidth={3} />
                </div>
                <h3 className="text-3xl font-black tracking-tighter">FreeStamps <span className="text-blue-600">KE</span></h3>
              </div>
              <p className="text-3xl text-slate-400 font-medium leading-relaxed max-w-md tracking-tight">
                Modernizing administrative trust for the Silicon Savannah. Trusted in Nairobi, Mombasa, and Kisumu.
              </p>
              <div className="flex gap-8">
                 <button onClick={() => setActiveTab('certificate')} className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-slate-100"><ShieldCheck size={32} /></button>
                 <button onClick={() => setActiveTab('blogs')} className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-slate-100"><BookOpen size={32} /></button>
                 <button onClick={() => setActiveTab('bulk')} className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all shadow-sm border border-slate-100"><Layers size={32} /></button>
              </div>
            </div>
            <div className="md:col-span-3">
              <h4 className="font-black uppercase text-[12px] tracking-[0.4em] text-slate-300 mb-12">Registry Solutions</h4>
              <ul className="space-y-8 font-black text-slate-900 text-sm tracking-widest uppercase">
                <li><button onClick={() => setActiveTab('bulk')} className="hover:text-blue-600 transition-all">Bulk Engine</button></li>
                <li><button onClick={() => setActiveTab('blogs')} className="hover:text-blue-600 transition-all">Official Blogs</button></li>
                <li><button onClick={() => setActiveTab('pricing')} className="hover:text-blue-600 transition-all">Pro Subscriptions</button></li>
                <li><button onClick={() => setActiveTab('certificate')} className="hover:text-blue-600 transition-all">Stamp Verification</button></li>
              </ul>
            </div>
            <div className="md:col-span-3">
              <h4 className="font-black uppercase text-[12px] tracking-[0.4em] text-slate-300 mb-12">Administrative Districts</h4>
              <ul className="space-y-8 font-black text-slate-500 text-sm uppercase tracking-widest">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Nairobi CBD</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Mombasa Port</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Kisumu Lakes</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Eldoret Hub</li>
              </ul>
            </div>
          </div>
          <div className="mt-32 pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">&copy; 2024 FreeStamps KE by JijiTechy. Nairobi, Kenya.</p>
             <div className="flex items-center gap-3 bg-slate-50 px-5 py-2 rounded-full border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">KE Trust Engine: Online</p>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
