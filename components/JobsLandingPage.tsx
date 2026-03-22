import React, { useState, useEffect } from 'react';
import StampKELogo from './StampKELogo';
import {
  Search, MapPin, Briefcase, Clock, ChevronRight,
  CheckCircle2, ArrowRight, Building2, DollarSign, Users, Zap
} from 'lucide-react';

interface JobsLandingPageProps {
  onSignUp: () => void;
  onSignIn: () => void;
}

const ACTIVITY_MESSAGES = [
  { icon: '💰', text: 'Vincent M. was paid KES 15,000 for a plumbing errand in Westlands' },
  { icon: '✅', text: 'Sarah K. completed a 3-day graphic design errand' },
  { icon: '🎉', text: 'James O. was hired as a driver by Logistics Ltd' },
  { icon: '⭐', text: 'Faith W. received a 5-star review for cleaning services' },
  { icon: '🚀', text: 'Peter N. landed a permanent IT support role' },
  { icon: '💼', text: 'Amina H. started a 2-week catering errand in Karen' },
  { icon: '✅', text: 'David K. completed electrical installation — paid same day' },
  { icon: '🎉', text: 'Grace M. was shortlisted for a marketing errand' },
  { icon: '💰', text: 'Moses A. earned KES 8,500 for weekend security work' },
  { icon: '⭐', text: 'Lucy W. got hired permanently after a quick errand trial' },
  { icon: '🚀', text: 'Brian O. signed a 6-month construction contract' },
  { icon: '✅', text: 'Ivy N. delivered a translation project — rated 5 stars' },
];

const SAMPLE_JOBS = [
  { id: 1, title: 'Plumber — Emergency Repairs', company: 'Nairobi Facilities', location: 'Westlands, Nairobi', pay: 'KES 2,500/day', type: 'quick-gig', urgent: true, posted: '2h ago', skills: ['Plumbing', 'Pipe fitting'] },
  { id: 2, title: 'Graphic Designer', company: 'Creative Agency KE', location: 'Remote', pay: 'KES 60,000/month', type: 'contract', urgent: false, posted: '5h ago', skills: ['Illustrator', 'Figma', 'Branding'] },
  { id: 3, title: 'Security Officer', company: 'Shield Guards Ltd', location: 'CBD, Nairobi', pay: 'KES 25,000/month', type: 'permanent', urgent: false, posted: '1d ago', skills: ['Security', 'First Aid'] },
  { id: 4, title: 'Driver — Executive', company: 'VIP Transport KE', location: 'Kilimani, Nairobi', pay: 'KES 35,000/month', type: 'temporary', urgent: true, posted: '3h ago', skills: ['Driving', 'PSV License'] },
  { id: 5, title: 'Data Entry Clerk', company: 'FinTech Startup', location: 'Upperhill', pay: 'KES 18,000/month', type: 'temporary', urgent: false, posted: '2d ago', skills: ['Excel', 'Typing', 'Accuracy'] },
  { id: 6, title: 'Event Waitstaff', company: 'Prestige Events', location: 'Gigiri, Nairobi', pay: 'KES 1,500/event', type: 'quick-gig', urgent: true, posted: '1h ago', skills: ['Hospitality', 'Customer Service'] },
];

const TYPE_COLORS: Record<string, string> = {
  'quick-gig': 'bg-orange-500/20 text-orange-400',
  'temporary':  'bg-blue-500/20 text-blue-400',
  'contract':   'bg-purple-500/20 text-purple-400',
  'permanent':  'bg-emerald-500/20 text-emerald-400',
};
const TYPE_LABELS: Record<string, string> = {
  'quick-gig': 'Quick Errand', 'temporary': 'Temporary', 'contract': 'Contract', 'permanent': 'Permanent',
};

export default function JobsLandingPage({ onSignUp, onSignIn }: JobsLandingPageProps) {
  const [tickerIdx, setTickerIdx]       = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);
  const [searchQ, setSearchQ]           = useState('');
  const [filterType, setFilterType]     = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => { setTickerIdx(i => (i + 1) % ACTIVITY_MESSAGES.length); setTickerVisible(true); }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const filtered = SAMPLE_JOBS.filter(j => {
    const q = searchQ.toLowerCase();
    return (!q || j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.skills.some(s => s.toLowerCase().includes(q)))
      && (!filterType || j.type === filterType);
  });

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">

      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-[#161b22]/95 backdrop-blur border-b border-[#30363d]">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StampKELogo size={28} />
            <span className="font-black text-white">StampKE</span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 ml-1">Find Errands</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onSignIn} className="text-sm text-[#8b949e] hover:text-white transition-colors">Sign In</button>
            <button onClick={onSignUp} className="px-4 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">Post Profile</button>
          </div>
        </div>
      </header>

      {/* Live ticker */}
      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-2">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Live</span>
          </div>
          <p className={`text-sm text-[#e6edf3] transition-all duration-300 ${tickerVisible ? 'opacity-100' : 'opacity-0'}`}>
            <span className="mr-2">{ACTIVITY_MESSAGES[tickerIdx].icon}</span>{ACTIVITY_MESSAGES[tickerIdx].text}
          </p>
        </div>
      </div>

      {/* ── SEARCH + JOBS FIRST ── */}
      <section className="max-w-5xl mx-auto px-5 pt-10 pb-4">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Find Errands & Work <span className="text-[#1f6feb]">in Kenya</span></h1>
        <p className="text-[#8b949e] mb-6">Quick gigs, contracts, and permanent roles — register in 2 minutes.</p>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b949e]" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Search errand, skill, or location..."
              className="w-full pl-10 pr-4 py-3 bg-[#161b22] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
          </div>
          <button onClick={onSignUp} className="px-5 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors">
            Search <ArrowRight size={15} />
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          {['', 'quick-gig', 'temporary', 'contract', 'permanent'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterType === t ? 'bg-[#1f6feb] text-white border-[#1f6feb]' : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-white'}`}>
              {t ? TYPE_LABELS[t] : 'All Types'}
            </button>
          ))}
        </div>

        {/* Job listings */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">{filtered.length} Errands &amp; Jobs Available</h2>
          <button onClick={onSignUp} className="text-sm text-[#58a6ff] hover:text-white flex items-center gap-1 transition-colors">
            View all <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {filtered.map(job => (
            <div key={job.id} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 hover:border-[#1f6feb]/50 transition-all group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-white group-hover:text-[#58a6ff] transition-colors text-sm">{job.title}</h3>
                    {job.urgent && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full uppercase">Urgent</span>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#8b949e]"><Building2 size={11} /> {job.company}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${TYPE_COLORS[job.type]}`}>{TYPE_LABELS[job.type]}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#8b949e] mb-3 flex-wrap">
                <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                <span className="flex items-center gap-1"><DollarSign size={11} /> {job.pay}</span>
                <span className="flex items-center gap-1"><Clock size={11} /> {job.posted}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {job.skills.slice(0, 2).map(s => <span key={s} className="text-[10px] px-2 py-0.5 bg-[#21262d] text-[#8b949e] rounded-full">{s}</span>)}
                </div>
                <button onClick={onSignUp} className="text-xs font-bold text-[#1f6feb] hover:text-[#388bfd] flex items-center gap-1 transition-colors">
                  Apply <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#1f6feb]/20 to-[#388bfd]/10 border border-[#1f6feb]/30 rounded-2xl p-8 text-center mb-16">
          <h3 className="text-xl font-bold text-white mb-2">Ready to start earning?</h3>
          <p className="text-[#8b949e] text-sm mb-5">Create your free profile in 2 minutes. Employers will find you directly.</p>
          <button onClick={onSignUp} className="px-8 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl font-bold text-sm transition-colors inline-flex items-center gap-2">
            Post My Profile Free <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ── Stats + How it works — moved to pre-footer ── */}
      <section className="border-t border-[#30363d] bg-[#161b22] py-12 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Errands Posted', value: '1,200+', icon: Briefcase },
              { label: 'Workers Hired',  value: '8,500+', icon: Users },
              { label: 'Time to Hire',   value: '< 24hrs', icon: Clock },
              { label: 'Avg Monthly Pay',value: 'KES 32K', icon: DollarSign },
            ].map(s => (
              <div key={s.label} className="text-center">
                <s.icon size={18} className="text-[#1f6feb] mx-auto mb-2" />
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-xs text-[#8b949e] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: '📝', title: 'Post Your Profile', desc: 'Tell employers your skills, availability and rate.' },
              { icon: '🔍', title: 'Get Discovered',    desc: 'Employers search and contact you directly.' },
              { icon: '💰', title: 'Get Paid Fast',     desc: 'Complete errands and receive payment within 24hrs.' },
            ].map(s => (
              <div key={s.title} className="flex items-start gap-3 p-4 bg-[#0d1117] rounded-xl border border-[#30363d]">
                <span className="text-2xl">{s.icon}</span>
                <div><p className="font-bold text-white text-sm mb-1">{s.title}</p><p className="text-xs text-[#8b949e]">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#30363d] py-5 text-center">
        <p className="text-xs text-[#8b949e]">
          © 2025 StampKE ·{' '}
          <button onClick={onSignIn} className="hover:text-white transition-colors">Sign In</button> ·{' '}
          <button onClick={onSignUp} className="hover:text-white transition-colors">Register</button>
        </p>
      </footer>
    </div>
  );
}
