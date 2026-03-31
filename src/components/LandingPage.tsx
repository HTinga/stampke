import React, { useState, useEffect, useRef } from 'react';
import StampKELogo from './StampKELogo';
import {
  PenTool, CheckCircle2, FileText, Wrench, QrCode,
  Camera, ArrowRight, Shield, Zap, Globe, ChevronDown,
  Check, X, Menu, Sparkles, Award, Clock, Users,
  FileCheck, Lock, TrendingUp, ChevronRight, Mic,
  Download, Star, PlayCircle
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
}

const CookieBanner: React.FC<{ onAccept: () => void; onDecline: () => void }> = ({ onAccept, onDecline }) => (
  <div className="fixed bottom-0 left-0 right-0 z-[900] bg-white border-t border-gray-200 shadow-2xl">
    <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900 mb-1">🍪 We use cookies</p>
        <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
          StampKE uses cookies to improve your experience, analyze traffic, and personalize content.
          By clicking "Accept all", you agree to our <span className="text-[#1a73e8] underline font-medium cursor-pointer">Privacy Policy</span> and <span className="text-[#1a73e8] underline font-medium cursor-pointer">Cookie Policy</span>.
        </p>
      </div>
      <div className="flex gap-3 flex-shrink-0">
        <button onClick={onDecline} className="px-5 py-2 border border-gray-300 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Decline</button>
        <button onClick={onAccept} className="px-5 py-2 bg-[#1a73e8] text-white rounded-full text-sm font-semibold hover:bg-[#1557b0] transition-colors shadow-sm">Accept all</button>
      </div>
    </div>
  </div>
);

const AnimatedNumber: React.FC<{ target: number; suffix?: string }> = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

const FEATURES = [
  { icon: PenTool, title: 'Stamp Designer', desc: 'Design professional digital stamps — round, oval, rectangular — with real-time SVG preview. Export as SVG or PNG.', color: '#1a73e8', badge: '1 Free Trial', bc: '#34a853' },
  { icon: FileCheck, title: 'Toho eSign', desc: 'Legally binding e-signatures with audit trails, multi-party workflows, and email delivery to signers and viewers.', color: '#0f9d58', badge: 'Starter+', bc: '#1a73e8' },
  { icon: FileText, title: 'Stamp Applier', desc: 'Apply your stamp to any PDF with precision. 1 free trial included. Pay KES 650 per use or subscribe for unlimited.', color: '#f4511e', badge: '1 Free Trial', bc: '#34a853' },
  { icon: Wrench, title: 'PDF Editor', desc: 'Full-featured PDF editing: annotations, redactions, merging, splitting, form-filling, and page reordering.', color: '#9c27b0', badge: 'Pro+', bc: '#1a73e8' },
  { icon: Mic, title: 'AI Transcriber', desc: 'Transcribe audio recordings and summarize PDF documents with Gemini AI. Perfect for meetings and legal proceedings.', color: '#00bcd4', badge: 'Pro+', bc: '#1a73e8' },
  { icon: Camera, title: 'AI Stamp Digitizer', desc: 'Photograph your rubber stamp. Gemini AI reconstructs it as a precise digital vector in seconds.', color: '#ff5722', badge: 'Pro+', bc: '#1a73e8' },
  { icon: QrCode, title: 'QR Tracker', desc: 'Generate traceable QR codes for employees and documents. Monitor scan events, locations, and timestamps live.', color: '#607d8b', badge: 'Business+', bc: '#f4511e' },
];

const PRICING = [
  { name: 'Stamp Only', price: 'KES 650', period: 'one-time', desc: 'Download or apply your stamp once.', highlight: false, features: ['Design 1 stamp', 'Download as SVG + PNG', 'Apply to 1 PDF', 'No subscription needed'], cta: 'Pay Once', ctaStyle: 'border border-[#1a73e8] text-[#1a73e8] hover:bg-blue-50' },
  { name: 'Starter', price: 'KES 1,000', period: '/month', desc: 'Essential digital stamp and eSign tools.', highlight: false, features: ['Unlimited Stamp Design', 'Toho eSign (unlimited)', 'Apply Stamp to PDFs', 'Template Library', 'AI Digitizer (3 scans)'], cta: 'Get Starter', ctaStyle: 'border border-[#1a73e8] text-[#1a73e8] hover:bg-blue-50' },
  { name: 'Professional', price: 'KES 2,500', period: '/month', desc: 'Full business document management.', highlight: true, badge: 'Most Popular', features: ['Everything in Starter', 'Smart Invoice & Payments', 'PDF Editor', 'AI Transcriber', 'QR Tracker', 'Priority Support'], cta: 'Get Professional', ctaStyle: 'bg-[#1a73e8] text-white hover:bg-[#1557b0]' },
  { name: 'Business', price: 'KES 7,500', period: '/month', desc: 'Enterprise tools for large organizations.', highlight: false, features: ['Everything in Professional', 'Virtual Assistants', 'Admin Sub-accounts', 'API Access', 'White-label branding', 'Dedicated Support'], cta: 'Get Business', ctaStyle: 'border border-[#1a73e8] text-[#1a73e8] hover:bg-blue-50' },
];

const FAQS = [
  { q: 'Is StampKE legally valid in Kenya?', a: 'Yes. StampKE is built to LSK (Law Society of Kenya) standards. E-signatures comply with the Kenya Information and Communications Act and the Evidence Act for electronic documents.' },
  { q: 'How does the 1 free trial work?', a: 'New users get exactly 1 free use of the Stamp Designer and Stamp Applier. After the trial, you can subscribe from KES 1,000/month or pay KES 650 for a one-time download/apply. All other features require a paid plan.' },
  { q: 'How does super admin account approval work?', a: 'Organizations can have a super admin activate staff accounts for 1 to 12 months without individual payment. Only the super admin can grant this access. Contact your organization administrator to request access.' },
  { q: 'Can I recreate my physical rubber stamp?', a: 'Yes. Our AI Digitizer uses Google Gemini Vision to analyze a photo of your physical stamp and recreate it as a precise digital vector, matching shape, font, text, and color.' },
  { q: 'How does Toho eSign email delivery work?', a: 'When you dispatch a document, signers and viewers receive personalized secure links via email. Signers can sign directly from the link; viewers get read-only access. No account is required for recipients.' },
  { q: 'What payment methods are supported?', a: 'We support M-Pesa (Safaricom STK push) and card payments via Flutterwave (Visa/Mastercard). All amounts are in Kenyan Shillings (KES).' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cookieChoice, setCookieChoice] = useState<'pending' | 'accepted' | 'declined'>(() =>
    (localStorage.getItem('stampke_cookie_consent') as any) || 'pending'
  );
  const [showPolicy, setShowPolicy] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); };

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Nunito Sans', 'Segoe UI', system-ui, sans-serif" }}>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <StampKELogo size={36} />
            <span className="text-xl font-bold tracking-tight text-gray-900">StampKE</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {[{l:"What's included",id:'features'},{l:'Premium features',id:'premium'},{l:'Plans & pricing',id:'pricing'},{l:'FAQs',id:'faq'}].map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all">{item.l}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onSignIn || onGetStarted} className="hidden md:block text-sm font-semibold text-[#1a73e8] hover:text-[#1557b0] px-4 py-2">Sign in</button>
            <button onClick={onGetStarted} className="hidden md:block bg-[#1a73e8] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#1557b0] transition-all shadow-sm">Get started</button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full"><Menu size={20} /></button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-1 shadow-lg">
            {[{l:"What's included",id:'features'},{l:'Premium features',id:'premium'},{l:'Plans & pricing',id:'pricing'},{l:'FAQs',id:'faq'}].map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl">{item.l}</button>
            ))}
            <div className="pt-3 flex gap-2">
              <button onClick={onSignIn || onGetStarted} className="flex-1 py-2.5 border border-[#1a73e8] text-[#1a73e8] rounded-full text-sm font-semibold">Sign in</button>
              <button onClick={onGetStarted} className="flex-1 py-2.5 bg-[#1a73e8] text-white rounded-full text-sm font-semibold">Get started</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-6 relative overflow-hidden bg-gradient-to-br from-[#f8faff] via-white to-[#f0f4ff]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full opacity-50 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-[#1a73e8] px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-blue-100">
              <Sparkles size={12} /> Kenya's #1 Digital Stamp & eSign Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-gray-900" style={{letterSpacing:'-0.02em'}}>
              The better way<br /><span className="text-[#1a73e8]">to stamp & sign</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
              Design, apply, and manage professional digital stamps and legally binding e-signatures — built for Kenyan law firms, enterprises, and institutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button onClick={onGetStarted} className="bg-[#1a73e8] text-white px-8 py-3.5 rounded-full font-semibold text-base hover:bg-[#1557b0] transition-all shadow-sm hover:shadow-lg flex items-center justify-center gap-2">
                Get started <ArrowRight size={18} />
              </button>
              <button onClick={() => scrollTo('pricing')} className="border border-gray-300 text-gray-700 px-8 py-3.5 rounded-full font-semibold text-base hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                View pricing
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 font-medium">
              {['LSK Compliant','No credit card required','1 free trial included'].map(t => (
                <span key={t} className="flex items-center gap-1.5"><Check size={14} className="text-[#34a853]" />{t}</span>
              ))}
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-yellow-400"/><div className="w-3 h-3 rounded-full bg-green-400"/>
                <span className="text-xs text-gray-400 ml-2 font-medium">Stamp Designer — StampKE</span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Live Preview</div>
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center aspect-square">
                    <svg viewBox="0 0 120 120" width="100" height="100">
                      <circle cx="60" cy="60" r="55" fill="none" stroke="#1a73e8" strokeWidth="3"/>
                      <circle cx="60" cy="60" r="45" fill="none" stroke="#1a73e8" strokeWidth="1.5"/>
                      <text x="60" y="52" textAnchor="middle" fontSize="9" fill="#1a73e8" fontWeight="bold" fontFamily="serif">ACME LAW FIRM</text>
                      <text x="60" y="64" textAnchor="middle" fontSize="7" fill="#1a73e8" fontFamily="serif">NAIROBI · KENYA</text>
                      <text x="60" y="74" textAnchor="middle" fontSize="6" fill="#1a73e8" fontFamily="serif">EST. 2019</text>
                    </svg>
                  </div>
                </div>
                <div className="w-36 space-y-2">
                  {['Shape: Round','Color: Blue','Font: Serif','Border: Double'].map(item => (
                    <div key={item} className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700 font-medium">{item}</div>
                  ))}
                  <button className="w-full bg-[#1a73e8] text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1">
                    <Download size={11} /> Export SVG
                  </button>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 bg-[#34a853] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">1 Free Trial</div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center"><CheckCircle2 size={16} className="text-[#34a853]"/></div>
              <div><p className="text-xs font-bold text-gray-900">Document Signed</p><p className="text-[10px] text-gray-500">3 parties · Audit trail saved</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky pill nav */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 py-3 px-6">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="flex items-center bg-gray-100 rounded-full p-1 gap-1">
            {[{l:"What's included",id:'features'},{l:'Premium features',id:'premium'},{l:'Plans & pricing',id:'pricing'},{l:'FAQs',id:'faq'}].map(tab => (
              <button key={tab.id} onClick={() => scrollTo(tab.id)} className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all">{tab.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100 py-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[{v:500,s:'+',l:'Organizations'},{v:10000,s:'+',l:'Documents Signed'},{v:99,s:'.9%',l:'Uptime SLA'},{v:5,s:' min',l:'Setup Time'}].map(item => (
            <div key={item.l} className="p-4">
              <div className="text-3xl font-bold text-[#1a73e8] mb-1"><AnimatedNumber target={item.v} suffix={item.s} /></div>
              <div className="text-sm text-gray-500 font-medium">{item.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What's included */}
      <section id="features" className="py-20 px-6 bg-gradient-to-b from-white to-[#f8faff]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{letterSpacing:'-0.02em'}}>All the tools you need<br />and a few more you'll love.</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Everything for digital stamps, document signing, and business document management — built for Kenya.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{backgroundColor: f.color+'15'}}>
                    <f.icon size={22} style={{color: f.color}} />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{backgroundColor: f.bc+'15', color: f.bc}}>{f.badge}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Sparkles, title: 'AI Built-in', desc: 'Gemini-powered stamp digitizer and document transcriber built into every professional plan.' },
              { icon: Shield, title: 'LSK & Legal Compliance', desc: 'Stamps and signatures meet Kenyan law requirements out of the box.' },
              { icon: Lock, title: 'Enterprise-grade Security', desc: 'AES-256 encryption, full audit trails, and role-based access control.' },
            ].map(p => (
              <div key={p.title} className="p-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><p.icon size={22} className="text-[#1a73e8]"/></div>
                <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium features */}
      <section id="premium" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-4" style={{letterSpacing:'-0.02em'}}>One subscription. So much premium value.</h2>
          <p className="text-center text-gray-500 mb-14 text-lg">Premium tools for every document workflow.</p>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Stamp Design */}
            <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center" style={{minHeight:200}}>
                <div className="bg-white rounded-2xl shadow-lg p-5 w-56">
                  <div className="flex items-center gap-2 mb-3"><div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center"><PenTool size={11} className="text-[#1a73e8]"/></div><span className="text-xs font-semibold text-gray-700">Stamp Designer</span></div>
                  <div className="flex items-center justify-center py-1">
                    <svg viewBox="0 0 80 80" width="65" height="65"><rect x="5" y="5" width="70" height="70" rx="4" fill="none" stroke="#1a73e8" strokeWidth="2.5"/><rect x="12" y="12" width="56" height="56" rx="2" fill="none" stroke="#1a73e8" strokeWidth="1"/><text x="40" y="36" textAnchor="middle" fontSize="7" fill="#1a73e8" fontWeight="bold">OFFICIAL STAMP</text><text x="40" y="46" textAnchor="middle" fontSize="5" fill="#1a73e8">NAIROBI · KENYA</text><text x="40" y="56" textAnchor="middle" fontSize="5" fill="#1a73e8">2025</text></svg>
                  </div>
                  <div className="flex gap-1 mt-2">{['#1a73e8','#34a853','#ea4335','#fbbc04'].map(c=><div key={c} className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{backgroundColor:c}}/>)}</div>
                </div>
              </div>
              <div className="p-6"><h3 className="font-bold text-gray-900 text-lg mb-2">Stamp Designer & Applier</h3><p className="text-sm text-gray-500 leading-relaxed mb-3">Design professional digital stamps with real-time SVG preview and apply them to any PDF with pixel-perfect placement.</p><div className="flex items-center gap-2 text-xs text-[#34a853] font-semibold"><CheckCircle2 size={13}/>Includes 1 free trial for new users</div></div>
            </div>
            {/* eSign */}
            <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 flex items-center justify-center" style={{minHeight:200}}>
                <div className="bg-white rounded-2xl shadow-lg p-5 w-60">
                  <div className="flex items-center gap-2 mb-3"><div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center"><FileCheck size={11} className="text-[#0f9d58]"/></div><span className="text-xs font-semibold text-gray-700">Toho eSign</span></div>
                  {['Alice Wanjiku — Signer','Bob Otieno — Viewer','Admin — Sender'].map((s,i)=>(
                    <div key={s} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-700">{s}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i===0?'bg-green-100 text-green-700':i===1?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-600'}`}>{i===0?'✓ Signed':i===1?'👁 Viewing':'📤 Sent'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6"><h3 className="font-bold text-gray-900 text-lg mb-2">Toho eSign — Multi-party Signing</h3><p className="text-sm text-gray-500 leading-relaxed mb-3">Send documents to signers and viewers via email. Signers sign from their email link; viewers get read-only access. Full audit trail included.</p><div className="flex items-center gap-2 text-xs text-[#1a73e8] font-semibold"><Zap size={13}/>Powered by Resend email delivery</div></div>
            </div>
            {/* AI Transcriber */}
            <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-8 flex items-center justify-center" style={{minHeight:160}}>
                <div className="bg-white rounded-2xl shadow-lg px-6 py-4 w-60">
                  <div className="flex items-center gap-2 mb-2"><div className="w-5 h-5 bg-cyan-100 rounded-lg flex items-center justify-center"><Mic size={11} className="text-cyan-600"/></div><span className="text-xs font-semibold text-gray-700">AI Transcriber</span></div>
                  <div className="flex items-center gap-0.5 mb-2">{Array.from({length:24}).map((_,i)=><div key={i} className="bg-cyan-400 rounded-full w-1 flex-shrink-0" style={{height:Math.sin(i)*8+12}}/>)}</div>
                  <p className="text-[10px] text-gray-500 bg-gray-50 rounded-lg p-2 leading-relaxed">"The meeting discussed quarterly targets and the board approved the new legal framework for digital signatures..."</p>
                </div>
              </div>
              <div className="p-6"><h3 className="font-bold text-gray-900 text-lg mb-2">AI Transcriber</h3><p className="text-sm text-gray-500 leading-relaxed">Transcribe audio files and summarize PDF documents using Gemini AI. Perfect for legal proceedings and board meetings.</p></div>
            </div>
            {/* Security block */}
            <div className="rounded-2xl bg-gradient-to-br from-[#f8faff] to-blue-50 border border-blue-100 p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3" style={{letterSpacing:'-0.01em'}}>Trusted with your most important documents</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">Every signature and stamp is secured with AES-256 encryption, timestamped, and stored with a complete audit trail that meets Kenyan legal requirements.</p>
              </div>
              <div className="flex flex-col gap-2">
                {[{icon:Shield,t:'LSK & Legal Compliance'},{icon:Lock,t:'AES-256 Encryption'},{icon:CheckCircle2,t:'Full Audit Trail'},{icon:Globe,t:'Kenya & East Africa'}].map(i=>(
                  <div key={i.t} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-blue-50 shadow-sm">
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center"><i.icon size={13} className="text-[#1a73e8]"/></div>
                    <span className="text-sm font-semibold text-gray-700">{i.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-gradient-to-b from-[#f8faff] to-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-4" style={{letterSpacing:'-0.02em'}}>Plans & Pricing</h2>
          <p className="text-center text-gray-500 mb-12 text-lg">Start with a free trial. Upgrade when you're ready.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PRICING.map(plan=>(
              <div key={plan.name} className={`relative bg-white rounded-2xl border p-6 flex flex-col transition-all hover:shadow-lg ${plan.highlight?'border-[#1a73e8] shadow-lg shadow-blue-100':'border-gray-100'}`}>
                {plan.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1a73e8] text-white text-[10px] font-bold px-4 py-1 rounded-full shadow-sm">{plan.badge}</div>}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-1"><span className="text-2xl font-bold text-gray-900">{plan.price}</span><span className="text-sm text-gray-400">{plan.period}</span></div>
                  <p className="text-xs text-gray-500">{plan.desc}</p>
                </div>
                <button onClick={onGetStarted} className={`w-full py-2.5 rounded-full text-sm font-semibold mb-5 transition-all ${plan.ctaStyle}`}>{plan.cta}</button>
                <ul className="space-y-2 flex-1">
                  {plan.features.map(f=><li key={f} className="flex items-start gap-2 text-xs text-gray-600"><Check size={13} className="text-[#34a853] flex-shrink-0 mt-0.5"/>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 max-w-2xl mx-auto">
            <Award size={18} className="text-amber-600 flex-shrink-0 mt-0.5"/>
            <div><p className="font-semibold text-gray-900 text-sm mb-1">Organization account approval</p><p className="text-xs text-gray-600 leading-relaxed">Your super admin can approve your account for 1–12 months without individual payment. Contact your organization administrator to request access.</p></div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 font-medium mb-3">Accepted payment methods</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {['M-Pesa (Safaricom)','Visa','Mastercard','Flutterwave'].map(m=><span key={m} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm">{m}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12" style={{letterSpacing:'-0.02em'}}>Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq,i)=>(
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 transition-colors">
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
                  <ChevronDown size={18} className={`text-gray-400 flex-shrink-0 transition-transform ${openFaq===i?'rotate-180':''}`}/>
                </button>
                {openFaq===i && <div className="px-5 pb-5"><p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sign up CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#e8f0fe] to-[#f0f4ff]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-3" style={{letterSpacing:'-0.02em'}}>Ready to go digital?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">Join hundreds of Kenyan organizations using StampKE for professional digital stamps and legally binding e-signatures.</p>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#1a73e8]"/><div className="w-16 h-2 rounded-full bg-[#1a73e8]"/></div>
          </div>
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full">
            <h3 className="font-bold text-gray-900 mb-5 text-base">Get started free</h3>
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="First name*" className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-colors"/>
                <input type="text" placeholder="Last name*" className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-colors"/>
              </div>
              <input type="email" placeholder="Business email*" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-colors"/>
            </div>
            <button onClick={onGetStarted} className="w-full bg-[#1a73e8] text-white py-3 rounded-full font-semibold text-sm hover:bg-[#1557b0] transition-all shadow-sm">Continue</button>
            <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
              By clicking Continue, you agree to StampKE's{' '}
              <button onClick={()=>setShowPolicy('terms')} className="underline hover:text-gray-600">Terms of Service</button> and{' '}
              <button onClick={()=>setShowPolicy('privacy')} className="underline hover:text-gray-600">Privacy Policy</button>.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f8f9fa] border-t border-gray-200 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4"><StampKELogo size={28}/><span className="font-bold text-gray-900">StampKE</span></div>
              <p className="text-xs text-gray-500 leading-relaxed">Kenya's professional digital stamp and document signing platform. Built for businesses, law firms, and institutions.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-gray-500">{['Stamp Designer','Toho eSign','Stamp Applier','PDF Editor','AI Transcriber','QR Tracker'].map(f=><li key={f}><a href="#features" className="hover:text-gray-900">{f}</a></li>)}</ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Pricing</h4>
              <ul className="space-y-2 text-xs text-gray-500">{['One-time (KES 650)','Starter (KES 1,000/mo)','Professional (KES 2,500/mo)','Business (KES 7,500/mo)','Organization approval'].map(f=><li key={f} className="hover:text-gray-900">{f}</li>)}</ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-gray-500">
                {[{l:'Privacy Policy',k:'privacy'},{l:'Terms of Service',k:'terms'},{l:'Cookie Policy',k:'cookies'}].map(item=>(
                  <li key={item.l}><button onClick={()=>setShowPolicy(item.k as any)} className="hover:text-gray-900 text-left">{item.l}</button></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">© 2025 JijiTechy Innovations · Nairobi, Kenya · LSK Standards Applied</p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>M-Pesa · Visa · Mastercard · Flutterwave</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modals */}
      {showPolicy && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">{showPolicy==='privacy'?'Privacy Policy':showPolicy==='terms'?'Terms of Service':'Cookie Policy'}</h2>
              <button onClick={()=>setShowPolicy(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={18} className="text-gray-500"/></button>
            </div>
            <div className="p-6 text-sm text-gray-600 space-y-4 leading-relaxed">
              {showPolicy==='privacy' && <>
                <p className="font-semibold text-gray-900">Last updated: January 2025</p>
                <p>StampKE ("we", "us") is operated by JijiTechy Innovations, Nairobi, Kenya. This policy explains how we collect, use, and protect your personal data in accordance with Kenya's Data Protection Act, 2019.</p>
                <p className="font-semibold text-gray-900">Data We Collect</p>
                <p>We collect: account registration data (name, email), documents you upload for signing or stamping, payment information processed by Flutterwave or Safaricom M-Pesa (we do not store card numbers), usage analytics via PostHog, and error reports via Sentry.</p>
                <p className="font-semibold text-gray-900">How We Use Your Data</p>
                <p>Your data is used to provide the StampKE service, process payments, send transactional emails (via Resend), and improve the platform. We do not sell your data to third parties.</p>
                <p className="font-semibold text-gray-900">Your Rights</p>
                <p>Under Kenya's Data Protection Act, you have the right to access, correct, or delete your personal data. Contact us at privacy@stampke.co.ke to exercise these rights.</p>
              </>}
              {showPolicy==='terms' && <>
                <p className="font-semibold text-gray-900">Last updated: January 2025</p>
                <p>By using StampKE, you agree to these Terms of Service. These terms are governed by the laws of Kenya.</p>
                <p className="font-semibold text-gray-900">Free Trial</p>
                <p>New users receive 1 free trial use of the Stamp Designer and Stamp Applier. After the trial, continued use requires a subscription (from KES 1,000/month) or a one-time payment of KES 650 for a single download or apply.</p>
                <p className="font-semibold text-gray-900">Account Approval</p>
                <p>Super administrators may approve organization accounts for periods of 1 to 12 months. Only the super administrator may grant such approval. Upon expiry, access is suspended until renewed.</p>
                <p className="font-semibold text-gray-900">Acceptable Use</p>
                <p>You may not use StampKE for fraudulent, illegal, or deceptive purposes. Misuse will result in immediate account termination without refund.</p>
                <p className="font-semibold text-gray-900">Refund Policy</p>
                <p>Subscription payments are non-refundable after the first 7 days. One-time payments (KES 650) are non-refundable once the stamp has been downloaded or applied to a document.</p>
              </>}
              {showPolicy==='cookies' && <>
                <p className="font-semibold text-gray-900">Last updated: January 2025</p>
                <p>StampKE uses cookies and similar technologies to improve your experience.</p>
                <p className="font-semibold text-gray-900">Essential Cookies</p>
                <p>Required for the platform to function — authentication session, preferences, and security tokens. You cannot opt out of these.</p>
                <p className="font-semibold text-gray-900">Analytics Cookies</p>
                <p>We use PostHog analytics to understand how users interact with StampKE. This helps us improve the product. You may decline these.</p>
                <p className="font-semibold text-gray-900">Error Tracking</p>
                <p>Sentry captures application errors anonymously to help us fix bugs faster.</p>
                <p className="font-semibold text-gray-900">Managing Cookies</p>
                <p>Manage preferences via the cookie banner on first visit, or clear cookies in your browser settings at any time.</p>
              </>}
            </div>
          </div>
        </div>
      )}

      {/* Cookie Banner */}
      {cookieChoice === 'pending' && (
        <CookieBanner
          onAccept={() => { localStorage.setItem('stampke_cookie_consent','accepted'); setCookieChoice('accepted'); }}
          onDecline={() => { localStorage.setItem('stampke_cookie_consent','declined'); setCookieChoice('declined'); }}
        />
      )}
    </div>
  );
};

export default LandingPage;
