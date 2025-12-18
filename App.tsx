
import React, { useState, useRef } from 'react';
import { 
  Plus, Download, Trash2, ChevronLeft, Image as ImageIcon, Menu, X, Sparkles, ArrowRight, ShieldCheck, Zap, User, BookOpen, Layers, Award
} from 'lucide-react';
import { StampConfig, StampTemplate, StampShape } from './types';
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
  const [user, setUser] = useState<{ email: string } | null>(null);
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

  const handleAuthSuccess = () => {
    setUser({ email: 'owner@cybercafe.co.ke' });
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
            <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl shadow-blue-200 transition-all group-hover:scale-110 group-active:scale-95">
              <Plus size={24} strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">FreeStamps <span className="text-blue-600">KE</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Digital Seals</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">
            <button onClick={() => setActiveTab('home')} className={`hover:text-blue-600 transition-all ${activeTab === 'home' ? 'text-blue-600' : ''}`}>Home</button>
            <button onClick={() => setActiveTab('templates')} className={`hover:text-blue-600 transition-all ${activeTab === 'templates' ? 'text-blue-600' : ''}`}>Templates</button>
            <button onClick={() => setActiveTab('bulk')} className={`hover:text-emerald-600 transition-all ${activeTab === 'bulk' ? 'text-emerald-600' : ''}`}>Bulk Stamping</button>
            <button onClick={() => setActiveTab('blogs')} className={`hover:text-blue-600 transition-all ${activeTab === 'blogs' ? 'text-blue-600' : ''}`}>Blogs & SEO</button>
            <button onClick={() => setActiveTab('certificate')} className={`hover:text-blue-600 transition-all ${activeTab === 'certificate' ? 'text-blue-600' : ''}`}>Certificates</button>
            <button onClick={() => setActiveTab('pricing')} className={`hover:text-blue-600 transition-all ${activeTab === 'pricing' ? 'text-blue-600' : ''}`}>Pricing</button>
            
            {user ? (
              <button onClick={() => setUser(null)} className="flex items-center gap-3 text-slate-900 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">JD</div>
                <span className="font-bold lowercase">Account</span>
              </button>
            ) : (
              <button 
                onClick={() => setActiveTab('auth')}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 font-black"
              >
                Sign In
              </button>
            )}
          </nav>

          <button className="lg:hidden text-slate-600 p-2 bg-slate-50 rounded-xl" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-[60] pt-24 px-6 space-y-6 flex flex-col items-center text-center animate-in slide-in-from-top duration-300">
          {['home', 'templates', 'bulk', 'blogs', 'certificate', 'pricing'].map(t => (
            <button key={t} onClick={() => { setActiveTab(t as any); setIsMobileMenuOpen(false); }} className="text-3xl font-black capitalize">{t}</button>
          ))}
          <div className="w-full pt-10">
            <button onClick={() => { setActiveTab('auth'); setIsMobileMenuOpen(false); }} className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black text-xl">Sign In</button>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="mt-8 text-slate-400 p-4 bg-slate-100 rounded-full"><X size={32} /></button>
        </div>
      )}

      <main className="flex-1">
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-700">
             <section className="pt-24 pb-40 px-4 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
               <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
                 <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-blue-50 text-blue-700 rounded-full text-[11px] font-black uppercase tracking-widest mb-8 border border-blue-100">
                      <Sparkles size={14} fill="currentColor" /> Powered by JijiTechy Pro v5.0
                    </div>
                    <h2 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 leading-[0.95] tracking-tighter">
                      Official Kenyan <br/><span className="text-blue-600">Digital Seals.</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                      Designed for Advocates, Schools, Clinics, and Car Showrooms across Nairobi, Kisumu, and Mombasa. High-fidelity vector generation.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start">
                      <button onClick={() => setActiveTab('templates')} className="w-full sm:w-auto bg-blue-600 text-white px-12 py-6 rounded-[28px] font-black text-lg shadow-2xl active:scale-95 flex items-center justify-center gap-3 group">
                        Create Your Seal <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                      </button>
                      <label className="w-full sm:w-auto bg-white text-slate-900 border-2 border-slate-100 px-12 py-6 rounded-[28px] font-black text-lg cursor-pointer flex items-center justify-center gap-3 active:scale-95 shadow-lg">
                        <ImageIcon size={22} className="text-blue-600" />
                        AI Digitize Tool
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                 </div>
                 <div className="flex-1 relative lg:translate-x-10">
                    <div className="relative z-10 p-6 bg-white rounded-[56px] shadow-2xl border border-slate-100 -rotate-2 hover:rotate-0 transition-all duration-700 scale-110">
                       <div className="bg-slate-50/50 p-10 rounded-[40px] border-2 border-dashed border-slate-200">
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
             <div className="mb-16 flex flex-col md:flex-row items-end justify-between gap-8">
                <div>
                   <h2 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter">Official Library</h2>
                   <p className="text-xl text-slate-500 font-medium">Professionally recaptured from real Kenyan administrative tools.</p>
                </div>
                <button onClick={() => setActiveTab('editor')} className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black flex items-center gap-3 shadow-2xl">
                  <Plus size={22} strokeWidth={3} /> Custom Builder
                </button>
             </div>
             <TemplateLibrary onSelect={handleTemplateSelect} />
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 animate-in fade-in duration-500 min-h-[calc(100vh-80px)]">
            <div className="lg:col-span-5 border-r border-slate-100 bg-slate-50/20 p-6 md:p-12 order-2 lg:order-1 overflow-y-auto custom-scrollbar">
               <div className="flex items-center gap-5 mb-12">
                 <button onClick={() => setActiveTab('templates')} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:scale-105 active:scale-90 transition-all"><ChevronLeft size={24} /></button>
                 <div>
                   <h2 className="text-3xl font-black tracking-tight text-slate-900">Live Editor</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Nairobi Engine v5.2</p>
                 </div>
               </div>
               <EditorControls config={stampConfig} onChange={(updates) => setStampConfig(prev => ({ ...prev, ...updates }))} />
            </div>
            <div className="lg:col-span-7 p-6 md:p-16 flex flex-col items-center justify-center order-1 lg:order-2 bg-white sticky top-20 h-fit lg:h-auto">
               <div className="w-full max-w-2xl space-y-12">
                 <div className="bg-white p-2 rounded-[64px] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden group">
                   <div className="bg-slate-50/50 p-6 md:p-16 rounded-[56px] border-2 border-dashed border-slate-200 transition-all group-hover:border-blue-300">
                     <SVGPreview ref={svgRef} config={stampConfig} className="h-[300px] md:h-[550px] border-none shadow-none !bg-transparent" />
                   </div>
                 </div>
                 <div className="flex flex-col sm:flex-row gap-5">
                   <button onClick={() => setShowPayment(true)} className="flex-[2] bg-blue-600 text-white py-6 px-12 rounded-[28px] font-black text-xl shadow-2xl flex items-center justify-center gap-4 hover:bg-blue-700 transition-all">
                     <Download size={28} strokeWidth={3} /> Download Official SVG
                   </button>
                   <button onClick={() => setStampConfig(DEFAULT_CONFIG)} className="flex-1 bg-slate-100 text-slate-600 p-6 rounded-[28px] font-black hover:bg-red-50 hover:text-red-600 shadow-md transition-all flex items-center justify-center gap-2">
                     <Trash2 size={24} /> Reset
                   </button>
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'blogs' && <BlogPage />}
        {activeTab === 'bulk' && <BulkStamping />}
        {activeTab === 'certificate' && <StampCertificate />}
        {activeTab === 'pricing' && <SubscriptionPage onSelectPlan={() => {}} />}
        {activeTab === 'auth' && <AuthPage onSuccess={handleAuthSuccess} onNavigateToPricing={() => setActiveTab('pricing')} />}
        
        {activeTab === 'convert' && (
          <div className="max-w-4xl mx-auto py-32 px-4 animate-in zoom-in duration-500">
             <div className="text-center mb-16 space-y-8">
               <div className="bg-blue-600 text-white w-24 h-24 rounded-[36px] flex items-center justify-center mx-auto shadow-2xl">
                 <Zap size={48} strokeWidth={3} />
               </div>
               <h2 className="text-6xl font-black text-slate-900 tracking-tighter">AI Digitizer Pro</h2>
               <p className="text-2xl text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">Instantly convert a photo of a physical rubber stamp into a clean, scalable vector digital seal.</p>
             </div>
             <div className="bg-white border-4 border-dashed border-slate-100 rounded-[56px] p-24 text-center relative hover:border-blue-300 transition-all group cursor-pointer shadow-2xl">
               {isProcessing ? (
                 <div className="space-y-8 py-10">
                   <div className="relative w-20 h-20 mx-auto border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-3xl font-black text-slate-900">Gemini 3 AI Processing...</p>
                 </div>
               ) : (
                 <>
                   <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                   <div className="space-y-8">
                     <div className="bg-slate-50 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto text-slate-300 group-hover:scale-110 transition-transform"><Plus size={48} strokeWidth={3} /></div>
                     <p className="text-3xl font-black text-slate-800 tracking-tight">Upload physical seal photo</p>
                   </div>
                 </>
               )}
             </div>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[56px] shadow-2xl max-w-lg w-full overflow-hidden border border-white/20 animate-in zoom-in duration-300">
             <div className="p-12 md:p-16">
               <div className="flex justify-between items-start mb-12">
                 <div className="bg-blue-600 text-white p-5 rounded-[24px] shadow-xl shadow-blue-100"><Download size={32} strokeWidth={3} /></div>
                 <button onClick={() => setShowPayment(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400"><X size={32} /></button>
               </div>
               <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tight leading-tight">Export Your <br/>Official Digital Seal</h3>
               <p className="text-slate-500 text-lg font-medium mb-12 leading-relaxed">Download a print-ready vector SVG. High-fidelity output for all official documents.</p>
               {stampConfig.includeCertificate && (
                 <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 text-xs font-black mb-8 flex items-center gap-2">
                   <ShieldCheck size={16} /> Authenticity Certificate Included
                 </div>
               )}
               <div className="flex items-center justify-between mb-12 bg-slate-50 p-8 rounded-[32px] border-2 border-slate-100/50">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Standard Export</p>
                    <p className="text-2xl font-black text-slate-900">One-Time Fee</p>
                 </div>
                 <p className="text-4xl font-black text-blue-600 tracking-tighter">KES 650</p>
               </div>
               <button onClick={handleDownload} className="w-full bg-slate-900 text-white py-6 rounded-[24px] font-black text-xl hover:bg-slate-800 transition-all shadow-2xl active:scale-95">Complete & Download</button>
             </div>
           </div>
        </div>
      )}
      
      <footer className="bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-20">
            <div className="md:col-span-6 space-y-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-xl">
                  <Plus size={24} strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black tracking-tighter">FreeStamps <span className="text-blue-600">KE</span></h3>
              </div>
              <p className="text-2xl text-slate-400 font-medium leading-relaxed max-w-md">
                Modernizing Kenyan administration. Accurate official seals for every city from Nairobi to Kisumu.
              </p>
              <div className="flex gap-4">
                 <div onClick={() => setActiveTab('certificate')} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition-colors shadow-sm"><ShieldCheck size={24} /></div>
                 <div onClick={() => setActiveTab('blogs')} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition-colors shadow-sm"><BookOpen size={24} /></div>
                 <div onClick={() => setActiveTab('bulk')} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition-colors shadow-sm"><Layers size={24} /></div>
              </div>
            </div>
            <div className="md:col-span-3">
              <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-400 mb-10">Solutions</h4>
              <ul className="space-y-5 font-black text-slate-700 text-sm">
                <li><button onClick={() => setActiveTab('bulk')} className="hover:text-blue-600 uppercase transition-all">Bulk Stamping</button></li>
                <li><button onClick={() => setActiveTab('blogs')} className="hover:text-blue-600 uppercase transition-all">Guides & SEO Resources</button></li>
                <li><button onClick={() => setActiveTab('certificate')} className="hover:text-blue-600 uppercase transition-all">Stamp Certificates</button></li>
              </ul>
            </div>
            <div className="md:col-span-3">
              <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-400 mb-10">Local Services</h4>
              <ul className="space-y-5 font-black text-slate-700 text-sm uppercase tracking-wider">
                <li>Nairobi Central</li>
                <li>Mombasa Port</li>
                <li>Kisumu Lakeside</li>
                <li>Eldoret Medical</li>
              </ul>
            </div>
          </div>
          <div className="mt-24 pt-10 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">&copy; 2024 FreeStamps KE by JijiTechy. Nairobi, Kenya.</p>
             <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Digital Trust for Kenya 🇰🇪</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
