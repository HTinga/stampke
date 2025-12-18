
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
  User
} from 'lucide-react';
import { StampConfig, StampTemplate, StampShape } from './types';
import { DEFAULT_CONFIG } from './constants';
import SVGPreview from './components/SVGPreview';
import TemplateLibrary from './components/TemplateLibrary';
import EditorControls from './components/EditorControls';
import AuthPage from './components/AuthPage';
import SubscriptionPage from './components/SubscriptionPage';
import { analyzeStampImage } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'editor' | 'templates' | 'convert' | 'auth' | 'pricing'>('home');
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
    if (!source.match(/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
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
    alert("Stamp generated successfully! Check your downloads.");
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

  const handlePlanSelect = (planId: string) => {
    alert(`Upgrading to ${planId.toUpperCase()}... Please wait.`);
    setTimeout(() => {
        handleAuthSuccess();
        alert("Plan activated! You now have unlimited downloads.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
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

          <nav className="hidden lg:flex items-center gap-10 text-[13px] font-black text-slate-500 uppercase tracking-widest">
            <button onClick={() => setActiveTab('home')} className={`hover:text-blue-600 transition-all ${activeTab === 'home' ? 'text-blue-600' : ''}`}>Home</button>
            <button onClick={() => setActiveTab('templates')} className={`hover:text-blue-600 transition-all ${activeTab === 'templates' ? 'text-blue-600' : ''}`}>Templates</button>
            <button onClick={() => setActiveTab('pricing')} className={`hover:text-blue-600 transition-all ${activeTab === 'pricing' ? 'text-blue-600' : ''}`}>Pricing</button>
            <button onClick={() => setActiveTab('convert')} className={`hover:text-blue-600 transition-all ${activeTab === 'convert' ? 'text-blue-600' : ''}`}>AI Digitize</button>
            
            {user ? (
              <button onClick={() => setUser(null)} className="flex items-center gap-3 text-slate-900 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all group">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">JD</div>
                <span className="font-bold lowercase">Dashboard</span>
              </button>
            ) : (
              <button 
                onClick={() => setActiveTab('auth')}
                className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 font-black"
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-[60] pt-24 px-6 space-y-6 flex flex-col items-center text-center animate-in slide-in-from-top duration-300">
          <button onClick={() => { setActiveTab('home'); setIsMobileMenuOpen(false); }} className="text-3xl font-black">Home</button>
          <button onClick={() => { setActiveTab('templates'); setIsMobileMenuOpen(false); }} className="text-3xl font-black">Templates</button>
          <button onClick={() => { setActiveTab('pricing'); setIsMobileMenuOpen(false); }} className="text-3xl font-black">Pricing</button>
          <button onClick={() => { setActiveTab('convert'); setIsMobileMenuOpen(false); }} className="text-3xl font-black">AI Digitize</button>
          <div className="w-full pt-10">
            <button onClick={() => { setActiveTab('auth'); setIsMobileMenuOpen(false); }} className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black text-xl shadow-2xl shadow-blue-100">Sign In</button>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="mt-8 text-slate-400 p-4 bg-slate-100 rounded-full"><X size={32} /></button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-700">
             {/* Hero Section */}
             <section className="pt-24 pb-40 px-4 bg-gradient-to-b from-slate-50 to-white overflow-hidden relative">
               <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
                 <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-blue-50 text-blue-700 rounded-full text-[11px] font-black uppercase tracking-widest mb-8 border border-blue-100 shadow-sm shadow-blue-50">
                      <Sparkles size={14} fill="currentColor" /> Advanced Layout Engine v3.0
                    </div>
                    <h2 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 leading-[0.95] tracking-tighter">
                      Official <span className="text-blue-600">Stamps</span> <br/>In Seconds.
                    </h2>
                    <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                      The industry standard for Advocates, Notaries, and Cyber Cafes in Kenya. High-fidelity vector outputs guaranteed.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start">
                      <button 
                        onClick={() => setActiveTab('templates')}
                        className="w-full sm:w-auto bg-blue-600 text-white px-12 py-6 rounded-[28px] font-black text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-3 group"
                      >
                        Explore Templates <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                      </button>
                      <label className="w-full sm:w-auto bg-white text-slate-900 border-2 border-slate-100 px-12 py-6 rounded-[28px] font-black text-lg hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-slate-100">
                        <ImageIcon size={22} className="text-blue-600" />
                        AI Digitize Tool
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>

                    <div className="mt-16 flex items-center justify-center lg:justify-start gap-5">
                       <div className="flex -space-x-3">
                         {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 ring-1 ring-slate-100" />)}
                       </div>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Trusted by 5,000+ Law Firms</p>
                    </div>
                 </div>

                 <div className="flex-1 relative lg:translate-x-10">
                    <div className="relative z-10 p-6 bg-white rounded-[56px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-100 -rotate-2 hover:rotate-0 transition-all duration-700 scale-110">
                       <div className="bg-slate-50/50 p-10 rounded-[40px] border-2 border-dashed border-slate-200">
                          <SVGPreview config={{ ...DEFAULT_CONFIG, logoUrl: null }} className="h-[350px] border-none !p-0" />
                       </div>
                    </div>
                    <div className="absolute -top-20 -right-20 bg-blue-600 w-64 h-64 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-20 -left-20 bg-purple-600 w-64 h-64 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
                 </div>
               </div>
             </section>
             
             {/* Business/Cyber Cafe Focus */}
             <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
               <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-20 items-center relative z-10">
                 <div className="space-y-10">
                    <div className="bg-blue-600/20 text-blue-400 w-20 h-20 rounded-[32px] flex items-center justify-center border border-blue-600/30">
                      <Zap size={40} strokeWidth={3} />
                    </div>
                    <div>
                      <h3 className="text-5xl font-black mb-6 tracking-tight leading-none">Cyber Cafe? <br/><span className="text-blue-500">Upgrade to Pro.</span></h3>
                      <p className="text-slate-400 text-xl font-medium leading-relaxed">Boost your shop revenue by offering instant stamp digitizing and professional seal creation services. Unlimited downloads, no per-file fees.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                          <p className="text-2xl font-black text-white">Unlimited</p>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Downloads</p>
                       </div>
                       <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                          <p className="text-2xl font-black text-white">5 Users</p>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Simultaneous Access</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('pricing')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[24px] font-black text-lg transition-all flex items-center gap-3 shadow-2xl shadow-blue-900/40"
                    >
                      View Business Plans <ArrowRight size={20} />
                    </button>
                 </div>
                 <div className="hidden lg:block">
                    <div className="grid grid-cols-2 gap-6 rotate-6">
                       {[1,2,3,4].map(i => (
                         <div key={i} className="aspect-square bg-white/5 border border-white/10 rounded-[48px] p-8 backdrop-blur-md hover:bg-white/10 transition-colors">
                            <div className="w-full h-full rounded-full border-4 border-white/10 flex items-center justify-center opacity-30">
                               <Plus size={48} className="text-white" />
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               </div>
               <div className="absolute -bottom-1/2 left-0 w-full h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>
             </section>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 animate-in slide-in-from-bottom-8 duration-500">
             <div className="mb-16 flex flex-col md:flex-row items-end justify-between gap-8">
                <div>
                   <h2 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter">Authentic Library</h2>
                   <p className="text-xl text-slate-500 font-medium">Recaptured from original physical seals used by Kenyan institutions.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('editor')}
                  className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-2xl shadow-slate-100"
                >
                  <Plus size={22} strokeWidth={3} /> Start Custom
                </button>
             </div>
             <TemplateLibrary onSelect={handleTemplateSelect} />
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 animate-in fade-in duration-500 min-h-[calc(100vh-80px)]">
            {/* Editor Sidebar */}
            <div className="lg:col-span-5 border-r border-slate-100 bg-slate-50/20 p-6 md:p-12 order-2 lg:order-1 overflow-y-auto custom-scrollbar">
               <div className="flex items-center gap-5 mb-12">
                 <button onClick={() => setActiveTab('templates')} className="p-3 hover:bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:scale-105 active:scale-90"><ChevronLeft size={24} /></button>
                 <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Custom Builder</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live Editor v4.2</p>
                 </div>
               </div>
               <EditorControls 
                 config={stampConfig}
                 onChange={(updates) => setStampConfig(prev => ({ ...prev, ...updates }))}
               />
            </div>

            {/* Canvas Area */}
            <div className="lg:col-span-7 p-6 md:p-16 flex flex-col items-center justify-center order-1 lg:order-2 bg-white relative">
               <div className="w-full max-w-2xl space-y-12">
                 <div className="bg-white p-2 rounded-[64px] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden group">
                   <div className="bg-slate-50/50 p-6 md:p-16 rounded-[56px] border-2 border-dashed border-slate-200 transition-all group-hover:border-blue-300">
                     <SVGPreview ref={svgRef} config={stampConfig} className="h-[350px] md:h-[550px] border-none shadow-none !bg-transparent" />
                   </div>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-5">
                   <button 
                    onClick={() => setShowPayment(true)}
                    className="flex-[2] bg-blue-600 text-white py-6 px-12 rounded-[28px] font-black text-xl flex items-center justify-center gap-4 hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95"
                   >
                     <Download size={28} strokeWidth={3} />
                     Download Vector SVG
                   </button>
                   <button 
                    className="flex-1 bg-slate-100 text-slate-600 p-6 rounded-[28px] font-black hover:bg-red-50 hover:text-red-600 transition-all shadow-md active:scale-95 flex items-center justify-center gap-3"
                    onClick={() => setStampConfig(DEFAULT_CONFIG)}
                   >
                     <Trash2 size={24} /> Reset
                   </button>
                 </div>
                 
                 <div className="flex items-center justify-center gap-10">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                       <ShieldCheck size={14} className="text-emerald-500" /> Print-Ready Output
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                       <Zap size={14} className="text-blue-500" /> High Res 600DPI
                    </div>
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <SubscriptionPage onSelectPlan={handlePlanSelect} />
        )}

        {activeTab === 'auth' && (
          <AuthPage onSuccess={handleAuthSuccess} onNavigateToPricing={() => setActiveTab('pricing')} />
        )}

        {activeTab === 'convert' && (
          <div className="max-w-4xl mx-auto py-32 px-4 animate-in zoom-in duration-500">
             <div className="text-center mb-16">
               <div className="bg-blue-600 text-white w-24 h-24 rounded-[36px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-200">
                 <Zap size={48} strokeWidth={3} />
               </div>
               <h2 className="text-6xl font-black text-slate-900 mb-5 tracking-tighter">AI Stamp Digitize</h2>
               <p className="text-2xl text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">Instantly convert a photo of a physical rubber stamp into a clean, editable digital seal.</p>
             </div>

             <div className="bg-white border-4 border-dashed border-slate-100 rounded-[56px] p-24 text-center relative hover:border-blue-300 transition-all group cursor-pointer shadow-2xl shadow-slate-100 hover:shadow-blue-50">
               {isProcessing ? (
                 <div className="space-y-8 py-10">
                   <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full"></div>
                      <div className="absolute inset-0 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                   </div>
                   <div className="space-y-3">
                    <p className="text-3xl font-black text-slate-900">Gemini 3 Pro Processing...</p>
                    <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">Analyzing Text & Shape Geometries</p>
                   </div>
                 </div>
               ) : (
                 <>
                   <input 
                     type="file" 
                     accept="image/*" 
                     onChange={handleFileUpload}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                   />
                   <div className="space-y-8">
                     <div className="bg-slate-50 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all group-hover:scale-110 group-active:scale-90 shadow-inner">
                       <Plus size={48} strokeWidth={3} />
                     </div>
                     <div>
                       <p className="text-3xl font-black text-slate-800 tracking-tight">Drop stamp photo</p>
                       <p className="text-xl text-slate-400 font-medium mt-2">Or click to browse from device</p>
                     </div>
                   </div>
                 </>
               )}
             </div>
          </div>
        )}
      </main>

      {/* Payment & Download Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[56px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] max-w-lg w-full overflow-hidden animate-in zoom-in duration-300 border border-white/20">
             <div className="p-12 md:p-16">
               <div className="flex justify-between items-start mb-12">
                 <div className="bg-blue-600 text-white p-5 rounded-[24px] shadow-xl shadow-blue-100"><Download size={32} strokeWidth={3} /></div>
                 <button onClick={() => setShowPayment(false)} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:rotate-90"><X size={32} /></button>
               </div>
               
               <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tight leading-tight">Export Your <br/>Official Seal</h3>
               <p className="text-slate-500 text-lg font-medium mb-12 leading-relaxed">You're about to download a print-ready vector SVG. This can be scaled to any size without losing quality.</p>
               
               <div className="flex items-center justify-between mb-12 bg-slate-50 p-8 rounded-[32px] border-2 border-slate-100/50">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">One-Time Fee</p>
                    <p className="text-2xl font-black text-slate-900">Standard Export</p>
                 </div>
                 <div className="text-right">
                    <p className="text-4xl font-black text-blue-600 tracking-tighter">KES 650</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incl. VAT</p>
                 </div>
               </div>
               
               <div className="space-y-4">
                 <button onClick={handleDownload} className="w-full bg-slate-900 text-white py-6 rounded-[24px] font-black text-xl hover:bg-slate-800 transition-all shadow-2xl active:scale-95">Complete & Download</button>
                 <button onClick={() => { setShowPayment(false); setActiveTab('pricing'); }} className="w-full bg-blue-50 text-blue-700 py-4 rounded-[24px] font-black text-sm hover:bg-blue-100 transition-all flex items-center justify-center gap-2">
                   Save 70% with Pro Plan <ArrowRight size={16} />
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}
      
      {/* Universal Footer */}
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
                Modernizing the Kenyan administrative toolkit since 2024. Accurate, professional, instant.
              </p>
              <div className="flex gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"><ShieldCheck size={24} /></div>
                 <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"><Settings size={24} /></div>
              </div>
            </div>
            <div className="md:col-span-3">
              <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-400 mb-10">Solutions</h4>
              <ul className="space-y-5 font-black text-slate-700 text-sm">
                <li><button onClick={() => setActiveTab('pricing')} className="hover:text-blue-600 transition-colors uppercase">Cyber Cafe Plan</button></li>
                <li><button onClick={() => setActiveTab('templates')} className="hover:text-blue-600 transition-colors uppercase">Advocate Library</button></li>
                <li><button onClick={() => setActiveTab('templates')} className="hover:text-blue-600 transition-colors uppercase">Notary Seals</button></li>
              </ul>
            </div>
            <div className="md:col-span-3">
              <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-400 mb-10">Company</h4>
              <ul className="space-y-5 font-black text-slate-700 text-sm">
                <li><button className="hover:text-blue-600 transition-colors uppercase">About JijiTechy</button></li>
                <li><button className="hover:text-blue-600 transition-colors uppercase">Privacy Policy</button></li>
                <li><button className="hover:text-blue-600 transition-colors uppercase">Terms of Use</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-24 pt-10 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">&copy; 2024 FreeStamps KE by JijiTechy. All Rights Reserved.</p>
             <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Built in Nairobi 🇰🇪</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
