import React, { useState, useEffect } from 'react';
import {
  PenTool, CheckCircle2, FileText, Wrench, QrCode, Share2,
  Camera, ArrowRight, Star, Shield, Zap, Globe, ChevronDown,
  Check, X, Menu, Plus, Sparkles, Award, Clock, Users,
  FileCheck, Layers, Lock, TrendingUp, ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  theme: 'light' | 'dark';
}

const FEATURES = [
  {
    icon: PenTool,
    title: 'Stamp Designer',
    desc: 'Craft pixel-perfect digital stamps — round, oval, rectangular — with real-time vector preview. Export as SVG, PNG, or PDF at any resolution.',
    color: 'from-blue-500 to-indigo-600',
    badge: 'Core',
  },
  {
    icon: CheckCircle2,
    title: 'Sign Center',
    desc: 'Enterprise-grade document signing with legally binding e-signatures, audit trails, and multi-party workflows.',
    color: 'from-emerald-500 to-teal-600',
    badge: 'Legal',
  },
  {
    icon: FileText,
    title: 'Stamp Applier',
    desc: 'Apply your stamp to any PDF with precision placement controls. Batch-stamp hundreds of documents in seconds.',
    color: 'from-orange-500 to-amber-600',
    badge: 'Productivity',
  },
  {
    icon: Wrench,
    title: 'PDF Editor',
    desc: 'Full-featured PDF editing: annotations, redactions, merging, splitting, form-filling, and page reordering.',
    color: 'from-purple-500 to-violet-600',
    badge: 'Power Tool',
  },
  {
    icon: Camera,
    title: 'AI Stamp Digitizer',
    desc: 'Photograph your old rubber stamp. Our AI reconstructs it as a perfect digital vector in under 5 seconds.',
    color: 'from-pink-500 to-rose-600',
    badge: 'AI-Powered',
  },
  {
    icon: QrCode,
    title: 'QR Tracker',
    desc: 'Generate traceable QR codes for employees and documents. Monitor scan events, locations, and timestamps live.',
    color: 'from-cyan-500 to-sky-600',
    badge: 'Enterprise',
  },
  {
    icon: Share2,
    title: 'Social Hub',
    desc: 'Schedule and publish stamp-branded content across all social platforms from a single command center.',
    color: 'from-yellow-500 to-orange-500',
    badge: 'Marketing',
  },
  {
    icon: Layers,
    title: 'Template Library',
    desc: 'Hundreds of professional stamp templates built from real Kenyan LSK-standard originals — ready to customize.',
    color: 'from-slate-600 to-slate-800',
    badge: 'Library',
  },
];

const PRICING = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    desc: 'Perfect for individuals and freelancers.',
    color: 'border-slate-200 dark:border-slate-700',
    btnClass: 'bg-slate-900 dark:bg-slate-700 text-white hover:opacity-90',
    features: [
      '5 stamps per month',
      'SVG & PNG export',
      '3 PDF sign requests',
      'Basic templates',
      'AI Digitizer (3 scans)',
    ],
    missing: ['Bulk stamp applier', 'QR Tracker', 'Social Hub', 'Priority support'],
  },
  {
    name: 'Professional',
    price: 'KES 2,499',
    period: '/month',
    desc: 'For law firms, SMEs, and growing teams.',
    color: 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30',
    btnClass: 'bg-blue-600 text-white hover:bg-blue-700',
    badge: 'Most Popular',
    features: [
      'Unlimited stamps',
      'SVG, PNG & PDF export',
      'Unlimited sign requests',
      'Full template library',
      'AI Digitizer (unlimited)',
      'Bulk stamp applier',
      'QR Tracker (50 codes)',
      'Social Hub',
    ],
    missing: ['White-label branding', 'Custom integrations'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large organizations and government agencies.',
    color: 'border-slate-800 dark:border-slate-600',
    btnClass: 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:opacity-90',
    features: [
      'Everything in Professional',
      'White-label branding',
      'Unlimited QR codes',
      'Custom API integrations',
      'Dedicated account manager',
      'SLA uptime guarantee',
      'On-premise deployment',
      'Custom compliance docs',
    ],
    missing: [],
  },
];

const TESTIMONIALS = [
  {
    name: 'Adv. Wanjiku Kamau',
    role: 'Senior Partner, Kamau & Associates',
    text: 'Tomo transformed how our firm handles documentation. The AI digitizer recreated our 20-year-old firm stamp perfectly in minutes.',
    stars: 5,
    initials: 'WK',
    color: 'bg-blue-600',
  },
  {
    name: 'James Otieno',
    role: 'Finance Director, Rift Holdings',
    text: 'The bulk stamp applier alone saves us 3+ hours every week. The audit trail for our signed documents is rock solid.',
    stars: 5,
    initials: 'JO',
    color: 'bg-emerald-600',
  },
  {
    name: 'Dr. Amina Hassan',
    role: 'Registrar, Coast Technical University',
    text: 'We process over 500 certificates a month. Tomo\'s batch processing and QR tracking is indispensable for our verification process.',
    stars: 5,
    initials: 'AH',
    color: 'bg-purple-600',
  },
];

const STATS = [
  { value: '50,000+', label: 'Stamps Created', icon: PenTool },
  { value: '12,000+', label: 'Documents Signed', icon: FileCheck },
  { value: '98.7%', label: 'Uptime SLA', icon: TrendingUp },
  { value: '4,200+', label: 'Active Users', icon: Users },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, theme }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = theme === 'dark';

  const faqs = [
    { q: 'Is Tomo legally compliant in Kenya?', a: 'Yes. Tomo is built to LSK (Law Society of Kenya) standards and our e-signatures comply with the Kenya Information and Communications Act and Evidence Act requirements for electronic documents.' },
    { q: 'Can I recreate my existing rubber stamp?', a: 'Absolutely. Our AI Digitizer uses Google Gemini Vision to analyze a photo of your physical stamp and recreate it as a precise vector graphic, matching shape, font, text, and color.' },
    { q: 'How does the QR Tracker work?', a: 'Each generated QR code links to a unique tracking page. Every time it\'s scanned, we log the timestamp, location, and device. You can view all events in real-time on your dashboard.' },
    { q: 'Can multiple team members use one account?', a: 'Professional plans include up to 5 seats. Enterprise plans support unlimited users with role-based access control (Admin, Supervisor, Staff).' },
    { q: 'What export formats are supported?', a: 'Stamps export as SVG (vector, infinite resolution), PNG (2000×2000px, transparent background), and PDF. Signed documents export as certified PDF/A.' },
  ];

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-100'} backdrop-blur-xl border-b`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Plus size={18} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter">Tomo</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'Testimonials', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className={`text-sm font-bold transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onGetStarted}
              className="hidden md:block bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
            >
              Get Started Free
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
              <Menu size={20} />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className={`md:hidden ${isDark ? 'bg-slate-900' : 'bg-white'} border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} px-6 py-4 space-y-3`}>
            {['Features', 'Pricing', 'Testimonials', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold py-2">{item}</a>
            ))}
            <button onClick={onGetStarted} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-sm mt-2">Get Started Free</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-[0.03]'}`} style={{backgroundImage: 'radial-gradient(circle, #1e40af 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-blue-100 dark:border-blue-800">
            <Sparkles size={12} />
            Kenya's #1 Digital Stamp & Document Platform
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-8">
            Your stamp.
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Digitized perfectly.
            </span>
          </h1>
          
          <p className={`text-xl md:text-2xl font-medium max-w-2xl mx-auto mb-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Design, apply, and manage professional digital stamps and e-signatures — built for Kenyan law firms, enterprises, and institutions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onGetStarted}
              className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 dark:shadow-blue-900/50 hover:scale-105 active:scale-95"
            >
              Start for Free <ArrowRight size={22} />
            </button>
            <button
              onClick={onGetStarted}
              className={`px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 border-2 transition-all hover:scale-105 ${isDark ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <Camera size={20} className="text-blue-600" /> AI Demo →
            </button>
          </div>

          {/* Social proof bar */}
          <div className={`flex flex-wrap items-center justify-center gap-6 text-sm font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span className="flex items-center gap-2"><Shield size={14} className="text-emerald-500" /> LSK Compliant</span>
            <span className="flex items-center gap-2"><Lock size={14} className="text-blue-500" /> Bank-grade Encryption</span>
            <span className="flex items-center gap-2"><Globe size={14} className="text-purple-500" /> Kenya & East Africa</span>
            <span className="flex items-center gap-2"><Zap size={14} className="text-yellow-500" /> No CC Required</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={`py-16 px-6 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                  <stat.icon size={20} className="text-blue-600" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-black tracking-tighter mb-1">{stat.value}</div>
              <div className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Everything You Need</div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-6">One platform.<br />Total document authority.</h2>
            <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Eight powerful tools, seamlessly integrated. No juggling between apps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className={`group p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl cursor-pointer hover:-translate-y-1 ${isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}
                onClick={onGetStarted}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon size={22} className="text-white" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-black text-base">{feature.title}</h3>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>{feature.badge}</span>
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{feature.desc}</p>
                <div className={`mt-4 flex items-center gap-1 text-xs font-black text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Try it now <ChevronRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={`py-24 px-6 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Simple Workflow</div>
            <h2 className="text-5xl font-black tracking-tighter">From rubber stamp<br />to signed document</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Design or Digitize', desc: 'Build your stamp from scratch using our designer, or photograph your existing stamp and let AI recreate it.', icon: PenTool, color: 'bg-blue-600' },
              { step: '02', title: 'Apply to Documents', desc: 'Drag and drop your stamp onto any PDF. Apply it individually or batch-stamp an entire folder instantly.', icon: FileText, color: 'bg-emerald-600' },
              { step: '03', title: 'Sign & Track', desc: 'Collect legally binding e-signatures, generate QR-tracked certificates, and maintain a full audit log.', icon: CheckCircle2, color: 'bg-purple-600' },
            ].map((step, i) => (
              <div key={i} className={`relative p-8 rounded-3xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'}`}>
                <div className={`absolute -top-4 -left-4 w-10 h-10 ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <step.icon size={18} className="text-white" />
                </div>
                <div className={`text-6xl font-black tracking-tighter mb-4 ${isDark ? 'text-slate-800' : 'text-slate-100'}`}>{step.step}</div>
                <h3 className="text-xl font-black mb-3">{step.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Trusted by Professionals</div>
            <h2 className="text-5xl font-black tracking-tighter">What our users say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={`p-8 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex gap-1 mb-6">
                  {Array.from({length: t.stars}).map((_, j) => (
                    <Star key={j} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className={`text-sm leading-relaxed mb-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${t.color} rounded-xl flex items-center justify-center text-white font-black text-sm`}>{t.initials}</div>
                  <div>
                    <div className="font-black text-sm">{t.name}</div>
                    <div className={`text-[11px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={`py-24 px-6 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Transparent Pricing</div>
            <h2 className="text-5xl font-black tracking-tighter">Start free. Scale as you grow.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING.map((plan, i) => (
              <div key={i} className={`relative p-8 rounded-3xl border-2 ${plan.color} ${isDark ? 'bg-slate-900' : 'bg-white'} transition-all`}>
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-black mb-2">{plan.name}</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{plan.desc}</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-black tracking-tighter">{plan.price}</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{plan.period}</span>
                </div>
                <button onClick={onGetStarted} className={`w-full py-4 rounded-2xl font-black text-sm transition-all mb-8 ${plan.btnClass}`}>
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
                <div className="space-y-3">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <Check size={14} className="text-emerald-500 flex-shrink-0" />
                      <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{f}</span>
                    </div>
                  ))}
                  {plan.missing.map((f, j) => (
                    <div key={j} className="flex items-center gap-3 opacity-40">
                      <X size={14} className="flex-shrink-0" />
                      <span className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Got Questions?</div>
            <h2 className="text-5xl font-black tracking-tighter">Frequently Asked</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className={`rounded-2xl border overflow-hidden transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-black text-sm pr-4">{faq.q}</span>
                  <ChevronDown size={18} className={`flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''} text-slate-400`} />
                </button>
                {openFaq === i && (
                  <div className={`px-6 pb-6 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 md:p-16 text-center text-white">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px'}} />
            <div className="relative">
              <Award size={48} className="mx-auto mb-6 opacity-80" />
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">Ready to go digital?</h2>
              <p className="text-xl opacity-80 mb-10 max-w-xl mx-auto">Join 4,200+ professionals who trust Tomo for their digital stamp and document authority.</p>
              <button
                onClick={onGetStarted}
                className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl"
              >
                Get Started — It's Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-slate-50'} py-12 px-6`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <Plus size={16} className="text-white" />
            </div>
            <span className="font-black text-lg tracking-tighter">Tomo</span>
          </div>
          <p className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            © 2024 JijiTechy Innovations · LSK Standards Applied · Nairobi, Kenya
          </p>
          <div className={`flex gap-6 text-sm font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
