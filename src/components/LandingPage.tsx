import React, { useState } from 'react';
import StampKELogo from './StampKELogo';
import {
  PenTool, FileCheck, FileText, Mic, Bot, Shield,
  ArrowRight, Check, ChevronDown, X, Menu,
  Lock, Globe, Zap, Download, Wifi
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
}

/* ── 4 real features only ─────────────────────────────────── */
const FEATURES = [
  {
    icon: PenTool,
    title: 'eSign & Stamps',
    desc: 'Design professional digital stamps and collect legally-binding e-signatures. Multi-party signing with email delivery, audit trails, and real-time status tracking.',
    color: '#4285F4',
    plans: 'All Plans',
  },
  {
    icon: FileText,
    title: 'Smart Invoice',
    desc: 'Create KRA-compliant invoices, quotations and receipts. PDF export, WhatsApp sharing, automated payment reminders, and full financial tracking.',
    color: '#34A853',
    plans: 'Starter+',
  },
  {
    icon: FileCheck,
    title: 'Docs & PDF Editor',
    desc: 'Full PDF editing — annotate, redact, merge, split, reorder pages, and fill forms. AI-powered receipt scanner extracts data instantly from photos.',
    color: '#FBBC04',
    plans: 'Professional+',
  },
  {
    icon: Bot,
    title: 'Virtual Assistants',
    desc: 'Access trained virtual assistants for tasks like document review, business process automation, and data organization—now on all tiers.',
    color: '#EA4335',
    plans: 'All Plans',
  },
];

/* ── Plans — correct prices ───────────────────────────────── */
const PLANS = [
  {
    name: 'Starter',
    price: 'KES 1,500',
    period: '/month',
    color: '#4285F4',
    highlight: false,
    features: [
      'eSign — unlimited signatures',
      'Stamp Designer & Applier',
      'Smart Invoice & Receipts',
      'Virtual Assistants',
      'Add clients & contacts',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: 'KES 3,000',
    period: '/month',
    color: '#34A853',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Everything in Starter',
      'PDF Editor & Transcriber',
      'AI Receipt Scanner',
      'Client CRM & Leads',
      'Team members (up to 5)',
      'WhatsApp sharing',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'KES 10,000',
    period: '/year',
    color: '#EA4335',
    highlight: false,
    features: [
      'Everything in Professional',
      'Offline Installation (5 gadgets)',
      'AI Transcriber',
      'Virtual Assistants (Priority)',
      'Unlimited team members',
      'White-label branding',
      'Dedicated account manager',
    ],
  },
];

const FAQS = [
  {
    q: 'Is StampKE legally valid in Kenya?',
    a: 'Yes. eSignatures on StampKE comply with the Kenya Information and Communications Act (KICA) and the Evidence Act. All documents carry a timestamped audit trail.',
  },
  {
    q: 'How does payment work?',
    a: 'We accept M-Pesa (Safaricom STK push) and card payments via IntaSend. All amounts are in Kenyan Shillings. There is no free trial — plans start at KES 650/month.',
  },
  {
    q: 'Can I sign in with Google?',
    a: 'Yes. We use Google Sign-In exclusively for security and simplicity. No password is needed — just your Google account.',
  },
  {
    q: 'What is the offline / installable app?',
    a: 'Enterprise customers can install StampKE as a Progressive Web App (PWA) on desktop and mobile for offline access. This is ideal for field teams in areas with limited connectivity.',
  },
  {
    q: 'Can my team use the same account?',
    a: 'Professional plans support up to 5 team members. Enterprise supports unlimited members with role-based access control.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPolicy, setShowPolicy] = useState<'privacy' | 'terms' | null>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d1117]/90 backdrop-blur-xl border-b border-[#30363d]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <StampKELogo size={34} />
            <span className="text-lg font-black text-white tracking-tight">StampKE</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {[{ l: 'Features', id: 'features' }, { l: 'Pricing', id: 'pricing' }, { l: 'FAQs', id: 'faq' }].map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                className="px-4 py-2 text-sm font-medium text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-xl transition-all">
                {item.l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onSignIn || onGetStarted}
              className="hidden md:block text-sm font-semibold text-[#8b949e] hover:text-white transition-colors px-3 py-2">
              Sign in
            </button>
            <button onClick={onGetStarted}
              className="bg-[#1f6feb] hover:bg-[#388bfd] text-white px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
              Get started <ArrowRight size={14} />
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-[#8b949e] hover:text-white">
              <Menu size={20} />
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-[#161b22] border-t border-[#30363d] px-6 py-4 space-y-1">
            {[{ l: 'Features', id: 'features' }, { l: 'Pricing', id: 'pricing' }, { l: 'FAQs', id: 'faq' }].map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                className="block w-full text-left px-4 py-2.5 text-sm text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-xl transition-colors">
                {item.l}
              </button>
            ))}
            <div className="pt-3 flex gap-2">
              <button onClick={onSignIn || onGetStarted} className="flex-1 py-2.5 border border-[#30363d] text-[#8b949e] rounded-xl text-sm font-semibold hover:text-white">Sign in</button>
              <button onClick={onGetStarted} className="flex-1 py-2.5 bg-[#1f6feb] text-white rounded-xl text-sm font-bold">Get started</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden">
        {/* Subtle gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#1f6feb]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-[#4285F4]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-[#1f6feb]/15 border border-[#1f6feb]/30 text-[#58a6ff] px-4 py-1.5 rounded-full text-xs font-semibold mb-8">
            <Zap size={11} /> Kenya's digital business platform
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
            Stamp. Sign.<br />
            <span className="text-[#1f6feb]">Invoice. Automate.</span>
          </h1>

          <p className="text-lg md:text-xl text-[#8b949e] mb-10 max-w-2xl mx-auto leading-relaxed">
            One platform for digital stamps, e-signatures, KRA-compliant invoicing, and document management. Built for Kenyan businesses.
          </p>

          {/* Google sign-in CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button onClick={onGetStarted}
              className="flex items-center gap-3 bg-white text-gray-800 px-7 py-3.5 rounded-xl font-bold text-base hover:bg-gray-100 transition-all shadow-lg shadow-black/20">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button onClick={() => scrollTo('pricing')}
              className="flex items-center gap-2 border border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#8b949e] px-7 py-3.5 rounded-xl font-semibold text-base transition-all">
              View pricing
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#8b949e]">
            {['M-Pesa & Card payments', 'LSK Compliant', 'No setup fee'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <Check size={13} className="text-[#34A853]" />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-[#0d1117]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              4 powerful tools. One subscription.
            </h2>
            <p className="text-[#8b949e] text-lg max-w-xl mx-auto">
              Everything your business needs for professional document workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className="bg-[#161b22] border border-[#30363d] rounded-2xl p-7 hover:border-[#58a6ff]/30 transition-all group">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: f.color + '18' }}>
                    <f.icon size={22} style={{ color: f.color }} />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#21262d] text-[#8b949e]">
                    {f.plans}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mb-2">{f.title}</h3>
                <p className="text-[#8b949e] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Trust row */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: 'LSK & KICA Compliant', desc: 'Meets Kenyan legal requirements for e-signatures and digital stamps.' },
              { icon: Lock, title: 'AES-256 Encrypted', desc: 'All documents encrypted at rest and in transit. Full audit trails.' },
              { icon: Globe, title: 'Built for Kenya', desc: 'M-Pesa payments, KRA PIN support, local currencies, and KES invoicing.' },
            ].map(t => (
              <div key={t.title} className="flex items-start gap-4 bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
                <div className="w-9 h-9 bg-[#1f6feb]/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <t.icon size={17} className="text-[#58a6ff]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">{t.title}</p>
                  <p className="text-xs text-[#8b949e] leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6 bg-[#0d1117]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-[#8b949e] text-lg">
              Pay via M-Pesa or card · No hidden fees · Cancel anytime
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map(plan => (
              <div key={plan.name}
                className={`relative rounded-2xl p-7 flex flex-col transition-all ${
                  plan.highlight
                    ? 'bg-[#1f6feb]/10 border-2 border-[#1f6feb] shadow-xl shadow-[#1f6feb]/10'
                    : 'bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/40'
                }`}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#1f6feb] text-white text-[10px] font-black px-4 py-1.5 rounded-full">
                    {plan.badge}
                  </div>
                )}

                {/* Plan name + price */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                    <h3 className="font-black text-white text-lg">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-black text-white">{plan.price}</span>
                    <span className="text-sm text-[#8b949e]">{plan.period}</span>
                  </div>
                </div>

                <button onClick={onGetStarted}
                  className={`w-full py-3 rounded-xl text-sm font-black mb-6 transition-all ${
                    plan.highlight
                      ? 'bg-[#1f6feb] hover:bg-[#388bfd] text-white'
                      : 'bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d]'
                  }`}>
                  Get {plan.name}
                </button>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#c9d1d9]">
                      <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Payment methods */}
          <div className="mt-10 text-center">
            <p className="text-xs text-[#8b949e] mb-4 font-medium uppercase tracking-widest">Payment methods</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {['M-Pesa (Safaricom)', 'Visa', 'Mastercard'].map(m => (
                <span key={m} className="px-4 py-2 bg-[#161b22] border border-[#30363d] rounded-full text-xs font-semibold text-[#8b949e]">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Enterprise note */}
          <div className="mt-8 bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex items-start gap-4">
            <div className="w-9 h-9 bg-[#EA4335]/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Wifi size={17} className="text-[#EA4335]" />
            </div>
            <div>
              <p className="font-bold text-white text-sm mb-1">Enterprise includes offline installation</p>
              <p className="text-xs text-[#8b949e] leading-relaxed">
                Install StampKE on desktop or mobile as a PWA for offline access. Ideal for field teams, legal offices, and organisations with limited connectivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 bg-[#0d1117]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-12 tracking-tight">
            Frequently asked questions
          </h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden hover:border-[#58a6ff]/30 transition-colors">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left">
                  <span className="font-semibold text-white text-sm pr-4">{faq.q}</span>
                  <ChevronDown size={16} className={`text-[#8b949e] flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-[#8b949e] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#161b22] border-t border-[#30363d]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
            Ready to go digital?
          </h2>
          <p className="text-[#8b949e] mb-8 text-lg leading-relaxed">
            Join Kenyan businesses using StampKE for stamps, signatures, invoicing, and document management.
          </p>
          <button onClick={onGetStarted}
            className="inline-flex items-center gap-3 bg-white text-gray-800 px-8 py-4 rounded-xl font-bold text-base hover:bg-gray-100 transition-all shadow-xl shadow-black/30 mx-auto">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>
          <p className="text-xs text-[#8b949e] mt-4">Plans from KES 1,500/month · M-Pesa or card · No setup fee</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-[#0d1117] border-t border-[#30363d] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <StampKELogo size={28} />
              <span className="font-black text-white">StampKE</span>
            </div>
            <p className="text-xs text-[#c9d1d9] leading-relaxed">
              Kenya's digital business platform for stamps, eSign, invoicing, and document management.
            </p>
            <p className="text-xs text-[#8b949e] mt-3">© {new Date().getFullYear()} StampKE · Nairobi, Kenya</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
            <div>
              <p className="font-bold text-white mb-3 uppercase tracking-widest text-[10px]">Features</p>
              <ul className="space-y-2 text-[#8b949e]">
                {['eSign & Stamps', 'Smart Invoice', 'Docs & PDF Editor', 'Virtual Assistants'].map(f => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-white mb-3 uppercase tracking-widest text-[10px]">Pricing</p>
              <ul className="space-y-2 text-[#8b949e]">
                <li>Starter — KES 1,500/mo</li>
                <li>Professional — KES 3,000/mo</li>
                <li>Enterprise — KES 10,000/yr</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white mb-3 uppercase tracking-widest text-[10px]">Legal</p>
              <ul className="space-y-2 text-[#8b949e]">
                <li><button onClick={() => setShowPolicy('privacy')} className="hover:text-white transition-colors text-left">Privacy Policy</button></li>
                <li><button onClick={() => setShowPolicy('terms')} className="hover:text-white transition-colors text-left">Terms of Service</button></li>
                <li>KICA Compliant</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Policy modals ────────────────────────────────────── */}
      {showPolicy && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#161b22] border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
              <h2 className="font-black text-white">{showPolicy === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h2>
              <button onClick={() => setShowPolicy(null)} className="p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 text-sm text-[#8b949e] space-y-4 leading-relaxed">
              {showPolicy === 'privacy' ? (
                <>
                  <p className="font-bold text-white">Last updated: January 2025</p>
                  <p>StampKE is operated by JijiTechy Innovations, Nairobi, Kenya. We collect account registration data, documents you upload, and payment info processed by IntaSend. We do not store card numbers or sell your data.</p>
                  <p className="font-bold text-white">Your Rights</p>
                  <p>Under Kenya's Data Protection Act 2019, you may access, correct, or delete your data. Email privacy@stampke.co.ke.</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-white">Last updated: January 2025</p>
                  <p>By using StampKE you agree to these terms, governed by the laws of Kenya. There is no free tier — all features require a paid plan (KES 650–5,000/month).</p>
                  <p className="font-bold text-white">Acceptable Use</p>
                  <p>You may not use StampKE for fraudulent or illegal purposes. Misuse results in immediate account termination without refund.</p>
                  <p className="font-bold text-white">Refunds</p>
                  <p>Subscriptions are non-refundable after activation.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
