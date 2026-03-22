import React, { useState, useEffect } from 'react';
import StampKELogo from './StampKELogo';
import {
  Search, MapPin, Briefcase, Clock, ChevronRight,
  ArrowRight, Building2, DollarSign, Users, Plus, Flame
} from 'lucide-react';

interface JobsLandingPageProps {
  onSignUp: () => void;
  onSignIn: () => void;
}

const ACTIVITY_MESSAGES = [
  { icon: '💰', text: 'Vincent M. was paid KES 15,000 for a plumbing errand in Westlands' },
  { icon: '✅', text: 'Sarah K. completed a graphic design errand — 5 stars' },
  { icon: '🎉', text: 'James O. was hired as a driver by Logistics Ltd' },
  { icon: '⭐', text: 'Faith W. received a 5-star review for cleaning services' },
  { icon: '🚀', text: 'Peter N. landed a permanent IT support role' },
  { icon: '💼', text: 'Amina H. started a 2-week catering errand in Karen' },
  { icon: '✅', text: 'David K. completed electrical installation — paid same day' },
  { icon: '🎉', text: 'Grace M. was shortlisted for a marketing errand' },
  { icon: '💰', text: 'Moses A. earned KES 8,500 for weekend security work' },
  { icon: '🚀', text: 'Brian O. signed a 6-month construction contract' },
];

const SAMPLE_JOBS = [
  { id: 1, title: 'Plumber — Emergency Repairs',  company: 'Nairobi Facilities', location: 'Westlands', pay: 'KES 2,500/day',   type: 'quick-gig', urgent: true,  posted: '2h ago',  skills: ['Plumbing', 'Pipe fitting'] },
  { id: 2, title: 'Graphic Designer',             company: 'Creative Agency KE', location: 'Remote',    pay: 'KES 60,000/mo',  type: 'contract',  urgent: false, posted: '5h ago',  skills: ['Illustrator', 'Figma'] },
  { id: 3, title: 'Security Officer',             company: 'Shield Guards Ltd',  location: 'CBD Nairobi',pay: 'KES 25,000/mo', type: 'permanent', urgent: false, posted: '1d ago',  skills: ['Security', 'First Aid'] },
  { id: 4, title: 'Executive Driver',             company: 'VIP Transport KE',   location: 'Kilimani',  pay: 'KES 35,000/mo',  type: 'temporary', urgent: true,  posted: '3h ago',  skills: ['Driving', 'PSV License'] },
  { id: 5, title: 'Data Entry Clerk',             company: 'FinTech Startup',    location: 'Upperhill', pay: 'KES 18,000/mo',  type: 'temporary', urgent: false, posted: '2d ago',  skills: ['Excel', 'Typing'] },
  { id: 6, title: 'Event Waitstaff',              company: 'Prestige Events',    location: 'Gigiri',    pay: 'KES 1,500/event',type: 'quick-gig', urgent: true,  posted: '1h ago',  skills: ['Hospitality', 'Service'] },
];

const TYPE_COLORS: Record<string,string> = {
  'quick-gig': 'bg-orange-500/20 text-orange-400',
  'temporary':  'bg-blue-500/20 text-blue-400',
  'contract':   'bg-purple-500/20 text-purple-400',
  'permanent':  'bg-emerald-500/20 text-emerald-400',
};
const TYPE_LABELS: Record<string,string> = {
  'quick-gig': 'Quick Errand', 'temporary': 'Temporary', 'contract': 'Contract', 'permanent': 'Permanent',
};

export default function JobsLandingPage({ onSignUp, onSignIn }: JobsLandingPageProps) {
  const [tickerIdx, setTickerIdx]         = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);
  const [searchQ, setSearchQ]             = useState('');
  const [filterType, setFilterType]       = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => { setTickerIdx(i => (i + 1) % ACTIVITY_MESSAGES.length); setTickerVisible(true); }, 400);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const filtered = SAMPLE_JOBS.filter(j => {
    const q = searchQ.toLowerCase();
    return (!q || j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.skills.some(s => s.toLowerCase().includes(q)))
      && (!filterType || j.type === filterType);
  });

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#161b22]/95 backdrop-blur border-b border-[#30363d]">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <StampKELogo size={28} />
            <span className="font-black text-white">StampKE</span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 ml-1">Errands</span>
          </div>
          {/* Post Errands CTA — for businesses */}
          <button
            onClick={onSignUp}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full text-sm font-black shadow-lg shadow-red-900/40 transition-all hover:scale-105 active:scale-95">
            <Flame size={14} className="text-orange-300" />
            Post an Errand
          </button>
        </div>
      </header>

      {/* ── Live ticker ── */}
      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-2">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex-shrink-0">Live</span>
          <p className={`text-sm text-[#e6edf3] transition-all duration-300 ${tickerVisible ? 'opacity-100' : 'opacity-0'}`}>
            <span className="mr-2">{ACTIVITY_MESSAGES[tickerIdx].icon}</span>{ACTIVITY_MESSAGES[tickerIdx].text}
          </p>
        </div>
      </div>

      {/* ── Hero headline + search ── */}
      <section className="max-w-5xl mx-auto px-5 pt-10 pb-0">
        <h1 className="text-3xl sm:text-5xl font-black text-white mb-1 leading-tight">
          Errands <span className="text-emerald-400">Ready.</span><br />
          <span className="text-[#1f6feb]">Money Waiting.</span>
        </h1>
        <p className="text-[#8b949e] mb-7 text-sm sm:text-base">Quick gigs, contracts &amp; permanent roles across Kenya. Sign up free — tap any errand to apply.</p>

        {/* Search row */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b949e]" />
            <input
              value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Search skill, errand or location..."
              className="w-full pl-10 pr-4 py-3 bg-[#161b22] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
          </div>
          <button onClick={onSignUp} className="px-5 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl font-bold text-sm flex-shrink-0 transition-colors">
            Search
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap mb-7">
          {(['', 'quick-gig', 'temporary', 'contract', 'permanent'] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterType === t ? 'bg-[#1f6feb] text-white border-[#1f6feb]' : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-white hover:border-[#58a6ff]'}`}>
              {t ? TYPE_LABELS[t] : 'All'}
            </button>
          ))}
        </div>

        {/* Count + view all */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-white">{filtered.length} errands available</p>
          <button onClick={onSignUp} className="text-xs text-[#58a6ff] hover:text-white flex items-center gap-1 transition-colors">
            View all <ChevronRight size={13} />
          </button>
        </div>

        {/* Job cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {filtered.map(job => (
            <div
              key={job.id}
              onClick={onSignUp}
              className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 hover:border-[#1f6feb]/60 hover:bg-[#1a2030] transition-all cursor-pointer group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-white group-hover:text-[#58a6ff] transition-colors text-sm truncate">{job.title}</h3>
                    {job.urgent && <span className="text-[9px] font-black px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full uppercase flex-shrink-0">Urgent</span>}
                  </div>
                  <p className="text-xs text-[#8b949e] flex items-center gap-1"><Building2 size={10}/> {job.company}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${TYPE_COLORS[job.type]}`}>{TYPE_LABELS[job.type]}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#8b949e] mb-3 flex-wrap">
                <span className="flex items-center gap-1"><MapPin size={10}/> {job.location}</span>
                <span className="flex items-center gap-1"><DollarSign size={10}/> {job.pay}</span>
                <span className="flex items-center gap-1"><Clock size={10}/> {job.posted}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {job.skills.slice(0,2).map(s => <span key={s} className="text-[10px] px-2 py-0.5 bg-[#21262d] text-[#8b949e] rounded-full">{s}</span>)}
                </div>
                <span className="text-xs font-bold text-[#1f6feb] group-hover:text-[#388bfd] flex items-center gap-1 transition-colors">
                  Apply now <ArrowRight size={11}/>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Sign-up CTA */}
        <div className="bg-gradient-to-r from-[#1f6feb]/20 to-[#388bfd]/10 border border-[#1f6feb]/30 rounded-2xl p-7 text-center mb-14">
          <h3 className="text-xl font-black text-white mb-2">Your next opportunity is here.</h3>
          <p className="text-[#8b949e] text-sm mb-5">Sign up free. Fill your profile once. Employers come to you.</p>
          <button onClick={onSignUp} className="px-8 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl font-black text-sm transition-colors inline-flex items-center gap-2">
            Join Free — Start Earning <ArrowRight size={14}/>
          </button>
        </div>
      </section>

      {/* ── Info section (pre-footer) ── */}
      <section className="border-t border-[#30363d] bg-[#161b22] py-12 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Errands Posted',  value: 'Growing',  icon: Briefcase },
              { label: 'Workers Active',  value: 'Daily',    icon: Users },
              { label: 'Time to Apply',   value: '< 2 min',  icon: Clock },
              { label: 'Always',          value: 'Free',     icon: DollarSign },
            ].map(s => (
              <div key={s.label} className="text-center">
                <s.icon size={18} className="text-[#1f6feb] mx-auto mb-2"/>
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-xs text-[#8b949e] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: '📝', title: 'Fill Your Profile Once', desc: 'Skills, rate, availability — employers find you.' },
              { icon: '🔔', title: 'Get Notified Instantly',  desc: 'Matched errands land in your inbox and app.' },
              { icon: '💰', title: 'Get Paid Fast',           desc: 'Complete errands, receive payment within 24 hrs.' },
            ].map(s => (
              <div key={s.title} className="flex items-start gap-3 p-4 bg-[#0d1117] rounded-xl border border-[#30363d]">
                <span className="text-2xl">{s.icon}</span>
                <div><p className="font-bold text-white text-sm mb-1">{s.title}</p><p className="text-xs text-[#8b949e]">{s.desc}</p></div>
              </div>
            ))}
          </div>

          {/* Business CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-red-950/30 border border-red-900/40 rounded-2xl">
            <div>
              <p className="font-black text-white">Need someone for an errand?</p>
              <p className="text-sm text-[#8b949e]">Post an errand and get matched with verified workers in minutes.</p>
            </div>
            <button onClick={onSignUp} className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full font-black text-sm flex-shrink-0 transition-all hover:scale-105 shadow-lg shadow-red-900/40">
              <Flame size={15} className="text-orange-300"/> Post an Errand
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#30363d] py-5 text-center">
        <div className="flex items-center justify-center gap-4 text-xs text-[#8b949e]">
          <span>© 2025 StampKE</span>
          <button onClick={onSignIn} className="hover:text-white transition-colors">Sign In</button>
          <button onClick={onSignUp} className="hover:text-white transition-colors">Register</button>
        </div>
      </footer>
    </div>
  );
}
