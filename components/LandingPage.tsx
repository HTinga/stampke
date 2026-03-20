import React, { useState } from 'react';
import {
  PenTool, CheckCircle2, FileText, Wrench, QrCode, Share2,
  Camera, ArrowRight, Star, Shield, Zap, Globe, ChevronDown,
  Check, X, Menu, Plus, Sparkles, Award, Clock, Users,
  FileCheck, Layers, Lock, TrendingUp, ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  theme?: 'light' | 'dark';
}

const FEATURES = [
  { icon: PenTool,      title: 'Stamp Designer',      desc: 'Craft pixel-perfect digital stamps — round, oval, rectangular — with real-time vector preview. Export as SVG, PNG, or PDF at any resolution.',            color: 'from-[#134589] to-[#1a5cad]', badge: 'Core' },
  { icon: CheckCircle2, title: 'Toho Sign',            desc: 'Enterprise-grade document signing with legally binding e-signatures, audit trails, and multi-party workflows.',                                        color: 'from-emerald-600 to-teal-600',  badge: 'Legal' },
  { icon: FileText,     title: 'Stamp Applier',        desc: 'Apply your stamp to any PDF with precision placement controls. Batch-stamp hundreds of documents in seconds.',                                          color: 'from-orange-500 to-amber-600',  badge: 'Productivity' },
  { icon: Wrench,       title: 'PDF Editor',           desc: 'Full-featured PDF editing: annotations, redactions, merging, splitting, form-filling, and page reordering.',                                           color: 'from-purple-600 to-violet-700', badge: 'Power Tool' },
  { icon: Camera,       title: 'AI Stamp Digitizer',   desc: 'Photograph your old rubber stamp. Our AI reconstructs it as a perfect digital vector in under 5 seconds.',                                             color: 'from-pink-600 to-rose-600',     badge: 'AI-Powered' },
  { icon: QrCode,       title: 'QR Tracker',           desc: 'Generate traceable QR codes for employees and documents. Monitor scan events, locations, and timestamps live.',                                        color: 'from-cyan-600 to-sky-600',      badge: 'Enterprise' },
  { icon: Share2,       title: 'Social Hub',           desc: 'Schedule and publish stamp-branded content across all social platforms from a single command center.',                                                  color: 'from-yellow-500 to-orange-500', badge: 'Marketing' },
  { icon: Layers,       title: 'Template Library',     desc: 'Hundreds of professional stamp templates built from real Kenyan LSK-standard originals — ready to customize.',                                         color: 'from-[#0e3a72] to-[#134589]',  badge: 'Library' },
];

const PRICING = [
  {
    name: 'Starter', price: 'Free', period: '',
    desc: 'Perfect for individuals and freelancers.',
    highlight: false,
    features: ['5 stamps per month','SVG & PNG export','3 PDF sign requests','Basic templates','AI Digitizer (3 scans)'],
    missing: ['Bulk stamp applier','QR Tracker','Social Hub','Priority support'],
  },
  {
    name: 'Professional', price: 'KES 2,499', period: '/month',
    desc: 'For law firms, SMEs, and growing teams.',
    highlight: true, badge: 'Most Popular',
    features: ['Unlimited stamps','SVG, PNG & PDF export','Unlimited sign requests','Full template library','AI Digitizer (unlimited)','Bulk stamp applier','QR Tracker (50 codes)','Social Hub'],
    missing: ['White-label branding','Custom integrations'],
  },
  {
    name: 'Enterprise', price: 'Custom', period: '',
    desc: 'For large organizations and government agencies.',
    highlight: false,
    features: ['Everything in Professional','White-label branding','Unlimited QR codes','Custom API integrations','Dedicated account manager','SLA uptime guarantee','On-premise deployment','Custom compliance docs'],
    missing: [],
  },
];

const TESTIMONIALS = [
  { name: 'Adv. Wanjiku Kamau',  role: 'Senior Partner, Kamau & Associates',       text: 'Tomo transformed how our firm handles documentation. The AI digitizer recreated our 20-year-old firm stamp perfectly in minutes.',          stars: 5, initials: 'WK', color: 'bg-[#1f6feb]' },
  { name: 'James Otieno',        role: 'Finance Director, Rift Holdings',           text: 'The bulk stamp applier alone saves us 3+ hours every week. The audit trail for our signed documents is rock solid.',                          stars: 5, initials: 'JO', color: 'bg-emerald-600' },
  { name: 'Dr. Amina Hassan',    role: 'Registrar, Coast Technical University',     text: 'We process over 500 certificates a month. Tomo\'s batch processing and QR tracking is indispensable for our verification process.',           stars: 5, initials: 'AH', color: 'bg-purple-600' },
];

const STATS = [
  { value: '50,000+', label: 'Stamps Created',    icon: PenTool },
  { value: '12,000+', label: 'Documents Signed',  icon: FileCheck },
  { value: '98.7%',   label: 'Uptime SLA',        icon: TrendingUp },
  { value: '4,200+',  label: 'Active Users',      icon: Users },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const faqs = [
    { q: 'Is Tomo legally compliant in Kenya?',        a: 'Yes. Tomo is built to LSK (Law Society of Kenya) standards and our e-signatures comply with the Kenya Information and Communications Act and Evidence Act requirements for electronic documents.' },
    { q: 'Can I recreate my existing rubber stamp?',   a: 'Absolutely. Our AI Digitizer uses Google Gemini Vision to analyze a photo of your physical stamp and recreate it as a precise vector graphic, matching shape, font, text, and color.' },
    { q: 'How does the QR Tracker work?',              a: 'Each generated QR code links to a unique tracking page. Every time it\'s scanned, we log the timestamp, location, and device. You can view all events in real-time on your dashboard.' },
    { q: 'Can multiple team members use one account?', a: 'Professional plans include up to 5 seats. Enterprise plans support unlimited users with role-based access control (Admin, Supervisor, Staff).' },
    { q: 'What export formats are supported?',         a: 'Stamps export as SVG (vector, infinite resolution), PNG (2000×2000px, transparent background), and PDF. Signed documents export as certified PDF/A.' },
  ];

  return (
    <div className="min-h-screen font-sans bg-[#0d1117] text-white">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d1117]/95 border-b border-[#30363d] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1f6feb] rounded-xl flex items-center justify-center shadow-lg shadow-[#1f6feb]/40">
              <Plus size={18} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter">Tomo</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features','Pricing','Testimonials','FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-[#8b949e] hover:text-white transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onGetStarted}
              className="hidden md:block bg-[#1f6feb] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#388bfd] transition-all shadow-lg shadow-[#1f6feb]/30">
              Get Started Free
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-[#8b949e]">
              <Menu size={20} />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#161b22] border-t border-[#30363d] px-6 py-4 space-y-3">
            {['Features','Pricing','Testimonials','FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold py-2 text-[#e6edf3]">{item}</a>
            ))}
            <button onClick={onGetStarted} className="w-full bg-[#1f6feb] text-white py-3 rounded-xl font-bold text-sm mt-2">Get Started Free</button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#1f6feb]/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-[#30363d]/30 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:'radial-gradient(circle, #4d93d9 1px, transparent 1px)',backgroundSize:'40px 40px'}} />
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-[#30363d] text-[#8b949e] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8 border border-[#58a6ff]">
            <Sparkles size={12} /> Kenya's #1 Digital Stamp & Document Platform
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-8">
            Your stamp.<br />
            <span className="bg-gradient-to-r from-[#4d93d9] via-[#7ab3e8] to-[#00c8ff] bg-clip-text text-transparent">
              Digitized perfectly.
            </span>
          </h1>
          <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto mb-12 text-[#8b949e]">
            Design, apply, and manage professional digital stamps and e-signatures — built for Kenyan law firms, enterprises, and institutions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button onClick={onGetStarted}
              className="bg-[#1f6feb] text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 hover:bg-[#388bfd] transition-all shadow-2xl shadow-[#1f6feb]/40 hover:scale-105 active:scale-95">
              Start for Free <ArrowRight size={22} />
            </button>
            <button onClick={onGetStarted}
              className="px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 border-2 border-[#58a6ff] text-[#e6edf3] hover:bg-[#21262d] transition-all hover:scale-105">
              <Camera size={20} className="text-[#58a6ff]" /> AI Demo →
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-[#8b949e]">
            <span className="flex items-center gap-2"><Shield size={14} className="text-emerald-400" /> LSK Compliant</span>
            <span className="flex items-center gap-2"><Lock size={14} className="text-[#58a6ff]" /> Bank-grade Encryption</span>
            <span className="flex items-center gap-2"><Globe size={14} className="text-purple-400" /> Kenya & East Africa</span>
            <span className="flex items-center gap-2"><Zap size={14} className="text-yellow-400" /> No CC Required</span>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 bg-[#161b22] border-y border-[#30363d]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 bg-[#30363d] border border-[#58a6ff] rounded-2xl flex items-center justify-center">
                  <stat.icon size={20} className="text-[#58a6ff]" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-black tracking-tighter mb-1 text-white">{stat.value}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#8b949e]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-black uppercase tracking-widest mb-4 text-[#58a6ff]">Everything You Need</div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 text-white">One platform.<br />Total document authority.</h2>
            <p className="text-xl max-w-2xl mx-auto text-[#8b949e]">Eight powerful tools, seamlessly integrated. No juggling between apps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feature, i) => (
              <div key={i}
                className="group p-6 rounded-3xl border border-[#30363d] bg-[#161b22] hover:border-[#58a6ff] hover:bg-[#21262d] transition-all duration-300 hover:shadow-2xl hover:shadow-[#1f6feb]/10 cursor-pointer hover:-translate-y-1"
                onClick={onGetStarted}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon size={22} className="text-white" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-black text-base text-white">{feature.title}</h3>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#30363d] text-[#58a6ff] border border-[#58a6ff]/50">{feature.badge}</span>
                </div>
                <p className="text-sm leading-relaxed text-[#8b949e]">{feature.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#58a6ff] opacity-0 group-hover:opacity-100 transition-opacity">
                  Try it now <ChevronRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-24 px-6 bg-[#161b22] border-y border-[#30363d]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-black uppercase tracking-widest mb-4 text-[#58a6ff]">Simple Workflow</div>
            <h2 className="text-5xl font-black tracking-tighter text-white">From rubber stamp<br />to signed document</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step:'01', title:'Design or Digitize',  desc:'Build your stamp from scratch or photograph your existing one — AI recreates it perfectly.',               icon:PenTool,      color:'bg-[#1f6feb]' },
              { step:'02', title:'Apply to Documents',  desc:'Drag and drop your stamp onto any PDF. Apply individually or batch-stamp an entire folder instantly.',     icon:FileText,     color:'bg-emerald-600' },
              { step:'03', title:'Sign & Track',        desc:'Collect legally binding e-signatures, generate QR-tracked certificates, and maintain a full audit log.',   icon:CheckCircle2, color:'bg-purple-600' },
            ].map((step, i) => (
              <div key={i} className="relative p-8 rounded-3xl bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] transition-colors">
                <div className={`absolute -top-4 -left-4 w-10 h-10 ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <step.icon size={18} className="text-white" />
                </div>
                <div className="text-6xl font-black tracking-tighter mb-4 text-white">{step.step}</div>
                <h3 className="text-xl font-black mb-3 text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[#8b949e]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-black uppercase tracking-widest mb-4 text-[#58a6ff]">Trusted by Professionals</div>
            <h2 className="text-5xl font-black tracking-tighter text-white">What our users say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-8 rounded-3xl border border-[#30363d] bg-[#161b22] hover:border-[#58a6ff] transition-colors">
                <div className="flex gap-1 mb-6">
                  {Array.from({length: t.stars}).map((_, j) => <Star key={j} size={16} className="fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm leading-relaxed mb-8 text-[#e6edf3]">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${t.color} rounded-xl flex items-center justify-center text-white font-black text-sm`}>{t.initials}</div>
                  <div>
                    <div className="font-black text-sm text-white">{t.name}</div>
                    <div className="text-[11px] font-bold text-[#8b949e]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6 bg-[#161b22] border-y border-[#30363d]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-black uppercase tracking-widest mb-4 text-[#58a6ff]">Transparent Pricing</div>
            <h2 className="text-5xl font-black tracking-tighter text-white">Start free. Scale as you grow.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING.map((plan, i) => (
              <div key={i} className={`relative p-8 rounded-3xl border-2 transition-all ${plan.highlight ? 'border-[#58a6ff] bg-[#21262d] shadow-2xl shadow-[#1f6feb]/20' : 'border-[#30363d] bg-[#0d1117]'}`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1f6feb] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-black mb-2 text-white">{plan.name}</h3>
                  <p className="text-sm text-[#8b949e]">{plan.desc}</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-black tracking-tighter text-white">{plan.price}</span>
                  <span className="text-sm font-bold text-[#8b949e]">{plan.period}</span>
                </div>
                <button onClick={onGetStarted}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all mb-8 ${plan.highlight ? 'bg-[#1f6feb] text-white hover:bg-[#388bfd]' : 'bg-[#30363d] text-[#e6edf3] hover:bg-[#1f6feb] hover:text-white'}`}>
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
                <div className="space-y-3">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <Check size={14} className="text-emerald-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-[#e6edf3]">{f}</span>
                    </div>
                  ))}
                  {plan.missing.map((f, j) => (
                    <div key={j} className="flex items-center gap-3 opacity-30">
                      <X size={14} className="flex-shrink-0 text-[#8b949e]" />
                      <span className="text-sm font-medium text-[#8b949e]">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-black uppercase tracking-widest mb-4 text-[#58a6ff]">Got Questions?</div>
            <h2 className="text-5xl font-black tracking-tighter text-white">Frequently Asked</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className={`rounded-2xl border overflow-hidden transition-all ${openFaq === i ? 'border-[#58a6ff] bg-[#161b22]' : 'border-[#30363d] bg-[#0d1117] hover:border-[#58a6ff]/50'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                  <span className="font-bold text-sm pr-4 text-white">{faq.q}</span>
                  <ChevronDown size={18} className={`flex-shrink-0 transition-transform text-[#8b949e] ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <div className="px-6 pb-6 text-sm leading-relaxed text-[#8b949e]">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0e3a72] via-[#134589] to-[#1a5cad] rounded-[3rem] p-12 md:p-16 text-center border border-[#1a5cad]">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle, white 1px, transparent 1px)',backgroundSize:'30px 30px'}} />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#161b22]/5 rounded-full blur-2xl" />
            <div className="relative">
              <Award size={48} className="mx-auto mb-6 text-[#e6edf3]" />
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-white">Ready to go digital?</h2>
              <p className="text-xl text-[#e6edf3] mb-10 max-w-xl mx-auto">Join 4,200+ professionals who trust Tomo for their digital stamp and document authority.</p>
              <button onClick={onGetStarted}
                className="bg-[#161b22] text-[#58a6ff] px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl">
                Get Started — It's Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#30363d] bg-[#0d1117] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1f6feb] rounded-xl flex items-center justify-center">
              <Plus size={16} className="text-white" />
            </div>
            <span className="font-black text-lg tracking-tighter text-white">Tomo</span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#e6edf3]">
            © 2024 JijiTechy Innovations · LSK Standards Applied · Nairobi, Kenya
          </p>
          <div className="flex gap-6 text-sm font-bold text-[#8b949e]">
            <a href="#" className="hover:text-[#58a6ff] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#58a6ff] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#58a6ff] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
