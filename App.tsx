
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
  Star
} from 'lucide-react';
import { StampConfig, StampTemplate, StampShape } from './types';
import { DEFAULT_CONFIG } from './constants';
import SVGPreview from './components/SVGPreview';
import TemplateLibrary from './components/TemplateLibrary';
import EditorControls from './components/EditorControls';
import { analyzeStampImage } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'editor' | 'templates' | 'convert'>('home');
  const [stampConfig, setStampConfig] = useState<StampConfig>(DEFAULT_CONFIG);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

    // Serialize the SVG to a string
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);

    // Add namespaces if they're missing
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    // Add XML declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    // Convert string to blob
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Create a link and trigger click
    const link = document.createElement('a');
    link.href = url;
    link.download = `${stampConfig.primaryText.toLowerCase().replace(/\s+/g, '_')}_stamp.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
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
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200">
              <Plus size={20} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">FreeStamps <span className="text-blue-600">KE</span></h1>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[13px] font-bold text-slate-500 uppercase tracking-wider">
            <button onClick={() => setActiveTab('home')} className={`hover:text-blue-600 transition-colors ${activeTab === 'home' ? 'text-blue-600' : ''}`}>Home</button>
            <button onClick={() => setActiveTab('templates')} className={`hover:text-blue-600 transition-colors ${activeTab === 'templates' ? 'text-blue-600' : ''}`}>Templates</button>
            <button onClick={() => setActiveTab('convert')} className={`hover:text-blue-600 transition-colors ${activeTab === 'convert' ? 'text-blue-600' : ''}`}>AI Convert</button>
            <button className="bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-md active:scale-95">Sign In</button>
          </nav>

          <button className="md:hidden text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-[60] pt-20 px-6 space-y-6 flex flex-col items-center text-center">
          <button onClick={() => { setActiveTab('home'); setIsMobileMenuOpen(false); }} className="text-2xl font-bold">Home</button>
          <button onClick={() => { setActiveTab('templates'); setIsMobileMenuOpen(false); }} className="text-2xl font-bold">Templates</button>
          <button onClick={() => { setActiveTab('convert'); setIsMobileMenuOpen(false); }} className="text-2xl font-bold">AI Convert</button>
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg">Sign In</button>
          <button onClick={() => setIsMobileMenuOpen(false)} className="mt-8 text-slate-400 p-3 bg-slate-100 rounded-full"><X size={32} /></button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-700">
             {/* Hero Section - Sleek Landing */}
             <section className="pt-20 pb-32 px-4 bg-gradient-to-b from-slate-50 to-white overflow-hidden relative">
               <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                 <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-blue-100">
                      <Zap size={14} fill="currentColor" /> Powered by Gemini 3
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tighter">
                      Official Kenyan Stamps <span className="text-blue-600">Created Instantly.</span>
                    </h2>
                    <p className="text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                      Designed accurately from physical samples for Advocates, Notaries, and Businesses. Choose a template or upload to digitize.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                      <button 
                        onClick={() => setActiveTab('templates')}
                        className="w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-2 group"
                      >
                        Browse 25+ Templates <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                      </button>
                      <label className="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95">
                        <ImageIcon size={20} className="text-blue-600" />
                        Upload Stamp Photo
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                    
                    <div className="mt-12 flex items-center justify-center lg:justify-start gap-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />)}
                      </div>
                      <p className="text-sm font-bold text-slate-500">Official Standards Met for KE Firms</p>
                    </div>
                 </div>

                 {/* Visual Demo / Graphic */}
                 <div className="flex-1 relative">
                    <div className="relative z-10 p-4 bg-white rounded-[40px] shadow-2xl border border-slate-100 rotate-2 hover:rotate-0 transition-transform duration-500 scale-110">
                       <div className="bg-slate-50 p-8 rounded-[32px] border border-dashed border-slate-200">
                          <SVGPreview config={{ ...DEFAULT_CONFIG, logoUrl: null }} className="h-[300px] border-none !p-0" />
                       </div>
                    </div>
                    <div className="absolute -top-10 -right-10 bg-blue-600 w-32 h-32 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-10 -left-10 bg-purple-600 w-32 h-32 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                 </div>
               </div>
             </section>

             {/* Features Section */}
             <section className="py-24 max-w-7xl mx-auto px-4 md:px-6">
               <div className="grid md:grid-cols-3 gap-12 text-center lg:text-left">
                 <div className="space-y-4">
                   <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-50 mx-auto lg:mx-0"><ShieldCheck size={28} /></div>
                   <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Accurate & Professional</h3>
                   <p className="text-slate-500 leading-relaxed font-medium">Every detail accurately captured from official samples. From Advocate seals to Corporate common seals.</p>
                 </div>
                 <div className="space-y-4">
                   <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-50 mx-auto lg:mx-0"><Zap size={28} /></div>
                   <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Digitize Tool</h3>
                   <p className="text-slate-500 leading-relaxed font-medium">Digitize existing physical rubber stamps in seconds. Our AI extracts text and paths for a clean digital copy.</p>
                 </div>
                 <div className="space-y-4">
                   <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-50 mx-auto lg:mx-0"><Download size={28} /></div>
                   <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Vector SVG Output</h3>
                   <p className="text-slate-500 leading-relaxed font-medium">Download infinite-resolution vector files. High-contrast output with built-in logo support for your branding.</p>
                 </div>
               </div>
             </section>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 animate-in slide-in-from-bottom-4 duration-500">
             <div className="mb-12 flex items-center justify-between gap-4 flex-wrap">
                <div>
                   <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Authentic Templates</h2>
                   <p className="text-slate-500 font-medium">Professionally captured from real Kenyan rubber stamp samples.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('editor')}
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
                >
                  <Plus size={18} /> Start Custom
                </button>
             </div>
             <TemplateLibrary onSelect={handleTemplateSelect} />
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 animate-in fade-in duration-500 min-h-[calc(100vh-64px)]">
            {/* Controls */}
            <div className="lg:col-span-5 border-r border-slate-100 bg-slate-50/30 p-4 md:p-8 order-2 lg:order-1">
               <div className="flex items-center gap-4 mb-8">
                 <button onClick={() => setActiveTab('templates')} className="p-2 hover:bg-white rounded-xl shadow-sm border border-slate-100 transition-all"><ChevronLeft size={20} /></button>
                 <h2 className="text-2xl font-black tracking-tight text-slate-900">Custom Builder</h2>
               </div>
               <EditorControls 
                 config={stampConfig}
                 onChange={(updates) => setStampConfig(prev => ({ ...prev, ...updates }))}
               />
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-7 p-4 md:p-8 flex flex-col items-center justify-center order-1 lg:order-2 bg-white relative">
               <div className="w-full max-w-2xl space-y-8">
                 <div className="bg-white p-1 rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden group">
                   <div className="bg-slate-50 p-4 md:p-12 rounded-[36px] border border-dashed border-slate-200 transition-colors group-hover:border-blue-200">
                     <SVGPreview ref={svgRef} config={stampConfig} className="h-[300px] md:h-[500px] border-none shadow-none !bg-transparent" />
                   </div>
                 </div>
                 
                 <div className="flex flex-wrap gap-4">
                   <button 
                    onClick={() => setShowPayment(true)}
                    className="flex-1 bg-blue-600 text-white py-5 px-10 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95"
                   >
                     <Download size={24} />
                     Generate & Download SVG
                   </button>
                   <button 
                    className="bg-slate-100 text-slate-600 p-5 rounded-2xl font-bold hover:bg-red-50 hover:text-red-600 transition-all shadow-sm active:scale-95"
                    onClick={() => setStampConfig(DEFAULT_CONFIG)}
                   >
                     <Trash2 size={24} />
                   </button>
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'convert' && (
          <div className="max-w-3xl mx-auto py-24 px-4 animate-in zoom-in duration-300">
             <div className="text-center mb-12">
               <div className="bg-blue-600 text-white w-20 h-20 rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-200">
                 <Zap size={40} />
               </div>
               <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">AI Stamp Digitize</h2>
               <p className="text-xl text-slate-500 font-medium">Recreate your old rubber stamps in seconds.</p>
             </div>

             <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center relative hover:border-blue-400 transition-all group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-50">
               {isProcessing ? (
                 <div className="space-y-6 py-8">
                   <div className="animate-spin w-16 h-16 border-[6px] border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                   <div className="space-y-2">
                    <p className="text-2xl font-black text-slate-900">Gemini 3 Pro Working...</p>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Analyzing Shape & Text Path</p>
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
                   <div className="space-y-6">
                     <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all group-hover:scale-110">
                       <Plus size={40} />
                     </div>
                     <div>
                       <p className="text-2xl font-black text-slate-800 tracking-tight">Drop your photo here</p>
                       <p className="text-lg text-slate-400 font-medium">Or click to browse files</p>
                     </div>
                   </div>
                 </>
               )}
             </div>
          </div>
        )}
      </main>

      {/* Simplified Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200">
             <div className="p-10">
               <div className="flex justify-between items-start mb-10">
                 <div className="bg-blue-50 text-blue-600 p-4 rounded-3xl"><Zap size={32} /></div>
                 <button onClick={() => setShowPayment(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={24} /></button>
               </div>
               
               <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Ready to Download?</h3>
               <p className="text-slate-500 font-medium mb-10 leading-relaxed">Download a high-resolution, print-ready SVG file of your custom stamp design.</p>
               
               <div className="flex items-end justify-between mb-10 bg-slate-50 p-6 rounded-3xl">
                 <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Instant Download</span>
                    <p className="text-xl font-bold text-slate-900">Vector SVG Output</p>
                 </div>
                 <p className="text-4xl font-black text-blue-600 tracking-tighter">KES 650</p>
               </div>
               
               <div className="space-y-3">
                 <button onClick={handleDownload} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl active:scale-95">Pay & Download</button>
                 <button className="w-full bg-white border border-slate-200 text-slate-600 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
               </div>
             </div>
           </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
            <div className="md:col-span-6">
              <div className="flex items-center gap-2 mb-8">
                <div className="bg-blue-600 text-white p-2 rounded-xl">
                  <Plus size={20} />
                </div>
                <h3 className="text-2xl font-black tracking-tighter">FreeStamps <span className="text-blue-600">KE</span></h3>
              </div>
              <p className="text-xl text-slate-400 font-medium max-w-sm">
                Professional tools for official Kenyan stamps.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
