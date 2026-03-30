import React, { useState, useEffect, useRef } from 'react';
import {
  User, Star, Upload, Award, BookOpen, ChevronRight, CheckCircle2,
  Clock, MapPin, Phone, Mail, Briefcase, Plus, Trash2, X, Save,
  ArrowLeft, Shield, AlertCircle, FileText, Camera, Edit3, Bell,
  LogOut, Settings, ChevronDown, ExternalLink, Search, DollarSign
} from 'lucide-react';
import StampKELogo from './StampKELogo';

/* ── Types ── */
interface Certificate { _id?: string; name: string; issuer: string; year: string; fileUrl?: string; fileName?: string; verified?: boolean; }
interface Course { _id: string; title: string; description: string; provider: string; duration: string; level: string; category: string; isPublished: boolean; }
interface CompletedCourse { course: Course; completedAt: string; score?: number; badgeUrl?: string; }
interface WorkerProfile {
  _id?: string; category: string; jobTypes: string[]; location: string; bio: string;
  skills: string[]; hourlyRate: string; availability: string; shortNotice: boolean;
  website?: string; cvUrl?: string; cvFileName?: string;
  certificates: Certificate[]; completedCourses: CompletedCourse[];
  portfolioUrl?: string; status: string; verified: boolean;
  rating: number; completedJobs: number; adminNote?: string;
}

interface WorkerAppProps {
  user: { name: string; email: string; emailVerified?: boolean } | null;
  onLogout: () => void;
  token: string | null;
}

const API = (import.meta as any).env?.VITE_API_URL || '';
const apiFetch = (path: string, opts?: RequestInit, token?: string | null) =>
  fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers || {}) } }).then(r => r.json());

const JOB_CATEGORIES = ['Plumbing','Electrical','Carpentry','Cleaning','Security','Driving','Cooking / Catering','Gardening','IT Support','Graphic Design','Photography','Event Staff','Construction','Tailoring','Tutoring','Delivery','Beauty & Hair','Admin / Office','Other'];
const JOB_TYPES = [{ id: 'quick-gig', label: 'Quick Errand' },{ id: 'temporary', label: 'Temporary' },{ id: 'contract', label: 'Contract' },{ id: 'permanent', label: 'Permanent' }];
const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const cls = (...a: (string|false|undefined)[]) => a.filter(Boolean).join(' ');
const inputCls = 'w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]';
const labelCls = 'block text-xs font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wide';

/* ── Star display ── */
const Stars = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size} className={i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-[#30363d]'} />
    ))}
    {rating > 0 && <span className="text-xs text-[#8b949e] ml-1">{rating.toFixed(1)}</span>}
  </div>
);

/* ── Status badge ── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'under-review': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const labels: Record<string, string> = { pending: 'Pending Review', 'under-review': 'Under Review', approved: 'Approved ✓', suspended: 'Suspended' };
  return <span className={cls('text-[10px] font-bold px-2 py-0.5 rounded-full border', map[status] || map.pending)}>{labels[status] || status}</span>;
};

/* ══════════════════════════════════════════════════════════════ */
export default function WorkerApp({ user, onLogout, token }: WorkerAppProps) {
  const [tab, setTab]           = useState<'home' | 'jobs' | 'applied' | 'profile' | 'documents' | 'courses' | 'settings'>('jobs');
  const [profile, setProfile]   = useState<WorkerProfile | null>(null);
  const [courses, setCourses]   = useState<Course[]>([]);
  const [jobs, setJobs]           = useState<any[]>([]);
  const [applications, setApps]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast]       = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const reload = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, jRes, aRes] = await Promise.all([
        apiFetch('/api/worker/me', {}, token),
        apiFetch('/api/worker/courses', {}, token).catch(() => ({ result: [] })),
        apiFetch('/api/job/open', {}, token).catch(() => ({ result: [] })),
        apiFetch('/api/job/my-applications', {}, token).catch(() => ({ result: [] })),
      ]);
      if (pRes.success) setProfile(pRes.result);
      if (cRes.success) setCourses(cRes.result || []);
      if (jRes.success) setJobs(jRes.result || []);
      if (aRes.success) setApps(aRes.result || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  /* ── Completeness score ── */
  const completeness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.category) score += 15;
    if (profile.bio?.length > 20) score += 15;
    if (profile.skills?.length > 0) score += 10;
    if (profile.hourlyRate) score += 10;
    if (profile.location) score += 10;
    if (profile.cvUrl) score += 20;
    if (profile.certificates?.length > 0) score += 10;
    if (profile.completedCourses?.length > 0) score += 10;
    return Math.min(100, score);
  };

  const pct = completeness();

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">

      {/* ── Top nav ── */}
      <header className="sticky top-0 z-50 bg-[#161b22]/95 backdrop-blur border-b border-[#30363d]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StampKELogo size={26} />
            <div>
              <span className="font-black text-white text-sm">StampKE</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 ml-1.5">Errands</span>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setShowMenu(m => !m)} className="flex items-center gap-2 hover:bg-[#21262d] rounded-xl px-2 py-1.5 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#1f6feb] flex items-center justify-center text-white text-xs font-black">{user?.name?.charAt(0).toUpperCase()}</div>
              <ChevronDown size={13} className="text-[#8b949e]" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#21262d] bg-[#0d1117]">
                    <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-[#8b949e] truncate">{user?.email}</p>
                    {profile && <div className="mt-1"><StatusBadge status={profile.status} /></div>}
                  </div>
                  <div className="p-1.5">
                    <button onClick={() => { setTab('settings'); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[#e6edf3] hover:bg-[#21262d]"><Settings size={14} className="text-[#8b949e]" /> Account Settings</button>
                    <button onClick={() => { onLogout(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10"><LogOut size={14} /> Sign Out</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl animate-bounce-in">
          ✓ {toast}
        </div>
      )}

      {/* ── Content ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-[#1f6feb] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            {tab === 'jobs'     && <JobsTab jobs={jobs} token={token} user={user} onApplied={() => { reload(); setTab('applied'); }} onViewApplied={() => setTab('applied')} />}
            {tab === 'applied'  && <AppliedTab applications={applications} />}
            {tab === 'home'      && <HomeTab profile={profile} user={user} pct={pct} onEdit={() => setTab('profile')} onDocs={() => setTab('documents')} onCourses={() => setTab('courses')} onJobs={() => setTab('jobs')} />}
            {tab === 'profile'   && <ProfileTab profile={profile} token={token} onSaved={p => { setProfile(p); showToast('Profile saved!'); }} onBack={() => setTab('home')} />}
            {tab === 'documents' && <DocumentsTab profile={profile} token={token} onSaved={p => { setProfile(p); showToast('Saved!'); }} onBack={() => setTab('home')} />}
            {tab === 'courses'   && <CoursesTab courses={courses} completed={profile?.completedCourses || []} onBack={() => setTab('home')} />}
            {tab === 'settings'  && <SettingsTab user={user} onLogout={onLogout} onBack={() => setTab('home')} />}
          </>
        )}
      </main>

      {/* ── Bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#161b22] border-t border-[#30363d] flex z-40">
        {([
          { id: 'jobs' as const,      icon: Briefcase, label: 'Find Work' },
          { id: 'applied' as const,   icon: CheckCircle2, label: 'Applied' },
          { id: 'home' as const,      icon: User,      label: 'Profile' },
          { id: 'courses' as const,   icon: BookOpen,  label: 'Courses' },
          { id: 'settings' as const,  icon: Settings,  label: 'Settings' },
        ] as const).map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            className={cls('flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors', tab === item.id ? 'text-[#1f6feb]' : 'text-[#8b949e]')}>
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}


/* ══ JOBS TAB ══════════════════════════════════════════════════════ */
const TYPE_COLORS: Record<string, string> = {
  'quick-gig': 'bg-orange-500/20 text-orange-400',
  'temporary':  'bg-blue-500/20 text-blue-400',
  'contract':   'bg-purple-500/20 text-purple-400',
  'permanent':  'bg-emerald-500/20 text-emerald-400',
};
const TYPE_LABELS: Record<string, string> = {
  'quick-gig': 'Quick Errand', 'temporary': 'Temporary', 'contract': 'Contract', 'permanent': 'Permanent',
};

function JobsTab({ jobs, token, user, onApplied, onViewApplied }: { jobs: any[]; token: string | null; user: any; onApplied: () => void; onViewApplied: () => void; }) {
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType] = useState('');
  const [applying, setApplying]   = useState<string | null>(null);
  const [applied, setAppliedSet]  = useState<Set<string>>(new Set());
  const [showApply, setShowApply] = useState<any | null>(null);
  const [form, setForm]           = useState({ note: '' });

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    return (!q || j.title.toLowerCase().includes(q) || (j.location||'').toLowerCase().includes(q) || (j.skills||[]).some((s: string) => s.toLowerCase().includes(q)))
      && (!filterType || j.type === filterType);
  });

  const apply = async (job: any) => {
    setApplying(job._id);
    const res = await apiFetch(`/api/job/apply/${job._id}`, {
      method: 'POST',
      body: JSON.stringify({ name: user?.name, email: user?.email, note: form.note }),
    }, token);
    setApplying(null);
    if (res.success) {
      setAppliedSet(s => new Set(s).add(job._id));
      setShowApply(null);
      onApplied();
    } else {
      alert(res.message || 'Failed to apply.');
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className="text-xl font-black text-white">Find Errands</h1>
        <p className="text-xs text-[#8b949e]">{jobs.length} open positions</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search title, skill, location..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#161b22] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(['', 'quick-gig', 'temporary', 'contract', 'permanent'] as const).map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={cls('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all', filterType === t ? 'bg-[#1f6feb] text-white border-[#1f6feb]' : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-white')}>
            {t ? TYPE_LABELS[t] : 'All'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-[#161b22] border border-[#30363d] rounded-2xl">
          <Briefcase size={28} className="mx-auto mb-3 text-[#30363d]" />
          <p className="text-white font-bold mb-1">No jobs found</p>
          <p className="text-xs text-[#8b949e]">Try a different search or check back soon.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job: any) => {
            const isApplied = applied.has(job._id);
            return (
              <div key={job._id} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-white text-sm truncate">{job.title}</h3>
                      {job.urgent && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full flex-shrink-0">Urgent</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#8b949e] flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign size={10} />{job.pay}</span>
                    </div>
                  </div>
                  <span className={cls('text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0', TYPE_COLORS[job.type] || 'bg-[#21262d] text-[#8b949e]')}>
                    {TYPE_LABELS[job.type] || job.type}
                  </span>
                </div>
                {job.description && <p className="text-xs text-[#8b949e] mb-3 line-clamp-2">{job.description}</p>}
                {(job.skills||[]).length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {job.skills.slice(0,3).map((s: string) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 bg-[#21262d] text-[#8b949e] rounded-full">{s}</span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => isApplied ? null : setShowApply(job)}
                  disabled={isApplied || applying === job._id}
                  className={cls('w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2',
                    isApplied ? 'bg-emerald-500/20 text-emerald-400 cursor-default' : 'bg-[#1f6feb] hover:bg-[#388bfd] text-white')}>
                  {isApplied ? <><CheckCircle2 size={14} /> Applied</> : applying === job._id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Apply Now'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply modal */}
      {showApply && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="text-base font-black text-white">Apply: {showApply.title}</h3>
            <p className="text-xs text-[#8b949e]">Your profile and CV will be shared with the employer.</p>
            <div>
              <label className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wide block mb-1">Cover Note (optional)</label>
              <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1f6feb]"
                placeholder="Why are you a good fit for this role?" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowApply(null)} className="flex-1 py-3 border border-[#30363d] text-[#8b949e] rounded-xl text-sm font-bold">Cancel</button>
              <button onClick={() => apply(showApply)} disabled={applying === showApply._id}
                className="flex-1 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">
                {applying === showApply._id ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ APPLIED TAB ═══════════════════════════════════════════════════ */
function AppliedTab({ applications }: { applications: any[] }) {
  const STATUS_COLORS: Record<string, string> = {
    pending:     'bg-yellow-500/20 text-yellow-400',
    shortlisted: 'bg-blue-500/20 text-blue-400',
    hired:       'bg-emerald-500/20 text-emerald-400',
    rejected:    'bg-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className="text-xl font-black text-white">My Applications</h1>
        <p className="text-xs text-[#8b949e]">{applications.length} applications submitted</p>
      </div>
      {applications.length === 0 ? (
        <div className="text-center py-12 bg-[#161b22] border border-[#30363d] rounded-2xl">
          <CheckCircle2 size={28} className="mx-auto mb-3 text-[#30363d]" />
          <p className="text-white font-bold mb-1">No applications yet</p>
          <p className="text-xs text-[#8b949e]">Browse open errands and apply to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((item: any, i: number) => (
            <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm truncate">{item.job?.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#8b949e] mt-0.5">
                    <MapPin size={10} />{item.job?.location}
                    <DollarSign size={10} />{item.job?.pay}
                  </div>
                  <p className="text-xs text-[#8b949e] mt-1">Applied {new Date(item.application?.appliedAt).toLocaleDateString('en-KE')}</p>
                </div>
                <span className={cls('text-[10px] font-bold px-2 py-1 rounded-full capitalize flex-shrink-0', STATUS_COLORS[item.application?.status] || 'bg-[#21262d] text-[#8b949e]')}>
                  {item.application?.status}
                </span>
              </div>
              {item.application?.status === 'shortlisted' && (
                <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                  <p className="text-xs text-blue-400 font-bold">🎉 You've been shortlisted!</p>
                  <p className="text-xs text-[#8b949e] mt-1">The employer will contact you soon. Make sure your phone and email are correct.</p>
                </div>
              )}
              {item.application?.status === 'hired' && (
                <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <p className="text-xs text-emerald-400 font-bold">✅ Hired! Congratulations!</p>
                  <p className="text-xs text-[#8b949e] mt-1">You've been hired for this position. Check your email for details.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══ HOME TAB ══════════════════════════════════════════════════════ */
function HomeTab({ profile, user, pct, onEdit, onDocs, onCourses, onJobs }: { profile: WorkerProfile | null; user: any; pct: number; onEdit: () => void; onDocs: () => void; onCourses: () => void; onJobs: () => void; }) {
  return (
    <div className="space-y-5">
      {/* Hero card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1f6feb] flex items-center justify-center text-white text-xl font-black flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-white truncate">{user?.name}</h2>
            {profile ? (
              <>
                <p className="text-sm text-[#8b949e] truncate">{profile.category}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <StatusBadge status={profile.status} />
                  {profile.verified && <span className="flex items-center gap-1 text-[10px] text-emerald-400"><Shield size={10} /> Verified</span>}
                  {profile.rating > 0 && <Stars rating={profile.rating} size={12} />}
                </div>
              </>
            ) : (
              <p className="text-sm text-yellow-400 mt-1">Profile not set up yet</p>
            )}
          </div>
        </div>

        {/* Profile completeness */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-[#8b949e] font-semibold">Profile Strength</span>
            <span className={cls('text-xs font-bold', pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400')}>{pct}%</span>
          </div>
          <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct >= 80 ? '#34A853' : pct >= 50 ? '#FBBC04' : '#EA4335' }} />
          </div>
          {pct < 100 && <p className="text-[11px] text-[#8b949e] mt-1.5">{pct < 50 ? 'Complete your profile to get discovered by employers.' : 'Almost there — add more details to boost your ranking.'}</p>}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Edit3, label: 'Edit Profile', sub: 'Update your details', onClick: onEdit, color: '#1f6feb' },
          { icon: FileText, label: 'My Documents', sub: 'CV & certificates', onClick: onDocs, color: '#34A853' },
          { icon: BookOpen, label: 'Free Courses', sub: 'Improve your skills', onClick: onCourses, color: '#EA4335' },
          { icon: Briefcase, label: 'Find Errands', sub: 'Browse open jobs', onClick: onJobs, color: '#FBBC04' },
        ].map(a => (
          <button key={a.label} onClick={a.onClick}
            className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 text-left hover:border-[#58a6ff]/40 transition-all active:scale-95">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${a.color}22` }}>
              <a.icon size={16} style={{ color: a.color }} />
            </div>
            <p className="text-sm font-bold text-white">{a.label}</p>
            <p className="text-[11px] text-[#8b949e] mt-0.5">{a.sub}</p>
          </button>
        ))}
      </div>

      {/* Status info */}
      {profile?.status === 'pending' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-yellow-400">Profile Under Review</p>
            <p className="text-xs text-[#8b949e] mt-1">Our team vets every applicant to ensure quality. You'll receive an email once approved — usually within 24–48 hours.</p>
          </div>
        </div>
      )}
      {profile?.status === 'approved' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-400">Profile Active</p>
            <p className="text-xs text-[#8b949e] mt-1">Employers can find and contact you. Keep your profile updated for better opportunities.</p>
          </div>
        </div>
      )}
      {profile?.adminNote && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
          <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-1">Note from StampKE Team</p>
          <p className="text-sm text-white">{profile.adminNote}</p>
        </div>
      )}

      {/* Stats */}
      {profile && profile.completedJobs > 0 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
          <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-3">Your Track Record</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-black text-white">{profile.completedJobs}</p><p className="text-[11px] text-[#8b949e]">Errands Done</p></div>
            <div><p className="text-2xl font-black text-white">{profile.rating.toFixed(1)}</p><p className="text-[11px] text-[#8b949e]">Avg Rating</p></div>
            <div><p className="text-2xl font-black text-white">{profile.completedCourses?.length || 0}</p><p className="text-[11px] text-[#8b949e]">Courses Done</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ PROFILE TAB ═══════════════════════════════════════════════════ */
function ProfileTab({ profile, token, onSaved, onBack }: { profile: WorkerProfile | null; token: string | null; onSaved: (p: WorkerProfile) => void; onBack: () => void; }) {
  const [form, setForm] = useState({
    category: profile?.category || '', jobTypes: profile?.jobTypes || ['quick-gig'],
    location: profile?.location || '', bio: profile?.bio || '',
    skills: profile?.skills || [], hourlyRate: profile?.hourlyRate || '',
    availability: profile?.availability || 'Available now',
    shortNotice: profile?.shortNotice ?? true, website: profile?.website || '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const upd = (u: Partial<typeof form>) => setForm(f => ({ ...f, ...u }));
  const toggleType = (t: string) => upd({ jobTypes: form.jobTypes.includes(t) ? form.jobTypes.filter(x => x !== t) : [...form.jobTypes, t] });
  const addSkill = () => { const s = skillInput.trim(); if (s && !form.skills.includes(s)) { upd({ skills: [...form.skills, s] }); setSkillInput(''); } };

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!form.category) errs.category = 'Required';
    if (!form.location.trim()) errs.location = 'Required';
    if (!form.bio.trim()) errs.bio = 'Required';
    if (!form.hourlyRate.trim()) errs.hourlyRate = 'Required';
    if (!form.jobTypes.length) errs.jobTypes = 'Select at least one';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    const res = await apiFetch('/api/worker/me', { method: 'POST', body: JSON.stringify(form) }, token);
    setSaving(false);
    if (res.success) onSaved(res.result);
  };

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-[#21262d] rounded-xl transition-colors"><ArrowLeft size={18} className="text-[#8b949e]" /></button>
        <h1 className="text-xl font-black text-white">Edit Profile</h1>
      </div>

      <div className="space-y-4">
        {/* Category */}
        <div>
          <label className={labelCls}>Work Category *</label>
          <select value={form.category} onChange={e => upd({ category: e.target.value })} className={inputCls}>
            <option value="">Select category...</option>
            {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
        </div>

        {/* Job types */}
        <div>
          <label className={labelCls}>Available For *</label>
          <div className="flex gap-2 flex-wrap">
            {JOB_TYPES.map(t => (
              <button key={t.id} type="button" onClick={() => toggleType(t.id)}
                className={cls('px-3 py-1.5 rounded-full text-xs font-bold border transition-all', form.jobTypes.includes(t.id) ? 'bg-[#1f6feb] border-[#1f6feb] text-white' : 'border-[#30363d] text-[#8b949e] hover:border-[#58a6ff]')}>
                {t.label}
              </button>
            ))}
          </div>
          {errors.jobTypes && <p className="text-red-400 text-xs mt-1">{errors.jobTypes}</p>}
        </div>

        {/* Location */}
        <div>
          <label className={labelCls}>Location / Area *</label>
          <input value={form.location} onChange={e => upd({ location: e.target.value })} className={inputCls} placeholder="e.g. Westlands, Nairobi" />
          {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
        </div>

        {/* Rate */}
        <div>
          <label className={labelCls}>Rate / Day or Hour *</label>
          <input value={form.hourlyRate} onChange={e => upd({ hourlyRate: e.target.value })} className={inputCls} placeholder="e.g. KES 1,500/day or KES 200/hr" />
          {errors.hourlyRate && <p className="text-red-400 text-xs mt-1">{errors.hourlyRate}</p>}
        </div>

        {/* Bio */}
        <div>
          <label className={labelCls}>About You *</label>
          <textarea value={form.bio} onChange={e => upd({ bio: e.target.value })} rows={4} className={inputCls + ' resize-none'} placeholder="Describe your experience, strengths, and what makes you reliable..." />
          {errors.bio && <p className="text-red-400 text-xs mt-1">{errors.bio}</p>}
        </div>

        {/* Skills */}
        <div>
          <label className={labelCls}>Skills</label>
          <div className="flex gap-2 mb-2">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} className={inputCls + ' flex-1'} placeholder="Add skill and press Enter..." />
            <button onClick={addSkill} className="px-4 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors"><Plus size={16} /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.skills.map(s => (
              <span key={s} className="flex items-center gap-1.5 px-3 py-1 bg-[#21262d] border border-[#30363d] rounded-full text-xs text-white">
                {s} <button onClick={() => upd({ skills: form.skills.filter(x => x !== s) })}><X size={11} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Availability</label>
            <select value={form.availability} onChange={e => upd({ availability: e.target.value })} className={inputCls}>
              {['Available now','Available in 1 week','Available in 2 weeks','Not available'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Short Notice?</label>
            <button onClick={() => upd({ shortNotice: !form.shortNotice })}
              className={cls('w-full py-3 rounded-xl text-sm font-bold border transition-all', form.shortNotice ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-[#30363d] text-[#8b949e]')}>
              {form.shortNotice ? '✓ Yes, same day' : 'No'}
            </button>
          </div>
        </div>

        {/* Website */}
        <div>
          <label className={labelCls}>Website / LinkedIn (optional)</label>
          <input value={form.website} onChange={e => upd({ website: e.target.value })} className={inputCls} placeholder="https://..." type="url" />
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="w-full py-4 bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-50 text-white rounded-2xl font-black text-base transition-colors flex items-center justify-center gap-2">
        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}

/* ══ DOCUMENTS TAB ═════════════════════════════════════════════════ */
function DocumentsTab({ profile, token, onSaved, onBack }: { profile: WorkerProfile | null; token: string | null; onSaved: (p: WorkerProfile) => void; onBack: () => void; }) {
  const [uploading, setUploading] = useState(false);
  const [certForm, setCertForm]   = useState({ name: '', issuer: '', year: '' });
  const [addingCert, setAddingCert] = useState(false);
  const cvRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);

  const toBase64 = (f: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f);
  });

  const uploadCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB.'); return; }
    setUploading(true);
    const data = await toBase64(file);
    const res = await apiFetch('/api/worker/cv', { method: 'POST', body: JSON.stringify({ cvUrl: data, cvFileName: file.name }) }, token);
    setUploading(false);
    if (res.success) onSaved(res.result);
  };

  const uploadCertFile = async (e: React.ChangeEvent<HTMLInputElement>): Promise<{ url: string; name: string } | null> => {
    const file = e.target.files?.[0]; if (!file) return null;
    const data = await toBase64(file);
    return { url: data, name: file.name };
  };

  const saveCert = async (fileUrl?: string, fileName?: string) => {
    if (!certForm.name.trim()) { alert('Certificate name is required.'); return; }
    setAddingCert(true);
    const res = await apiFetch('/api/worker/certificate', { method: 'POST', body: JSON.stringify({ ...certForm, fileUrl, fileName }) }, token);
    setAddingCert(false);
    if (res.success) { onSaved(res.result); setCertForm({ name: '', issuer: '', year: '' }); }
  };

  const removeCert = async (certId: string) => {
    if (!confirm('Remove this certificate?')) return;
    const res = await apiFetch(`/api/worker/certificate/${certId}`, { method: 'DELETE' }, token);
    if (res.success) onSaved(res.result);
  };

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-[#21262d] rounded-xl transition-colors"><ArrowLeft size={18} className="text-[#8b949e]" /></button>
        <div>
          <h1 className="text-xl font-black text-white">My Documents</h1>
          <p className="text-xs text-[#8b949e]">Private — only visible to StampKE admin and employers who shortlist you</p>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="bg-[#1f6feb]/10 border border-[#1f6feb]/20 rounded-2xl p-4 flex gap-3">
        <Shield size={16} className="text-[#58a6ff] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#8b949e]">Your CV and certificates are <strong className="text-white">private by default</strong>. StampKE admin vets them first. Only employers who shortlist you will have access — you'll be notified when this happens.</p>
      </div>

      {/* CV upload */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><FileText size={15} className="text-[#1f6feb]" /> Curriculum Vitae (CV)</h3>
        {profile?.cvUrl ? (
          <div className="flex items-center justify-between gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-white truncate">{profile.cvFileName || 'CV uploaded'}</span>
            </div>
            <button onClick={() => cvRef.current?.click()} className="text-xs text-[#58a6ff] hover:text-white flex-shrink-0">Replace</button>
          </div>
        ) : (
          <button onClick={() => cvRef.current?.click()}
            className="w-full border-2 border-dashed border-[#30363d] hover:border-[#1f6feb] rounded-xl p-6 text-center transition-all">
            {uploading ? <div className="w-6 h-6 border-2 border-[#1f6feb] border-t-transparent rounded-full animate-spin mx-auto" />
              : <><Upload size={24} className="mx-auto mb-2 text-[#8b949e]" /><p className="text-sm font-bold text-white">Upload your CV</p><p className="text-xs text-[#8b949e] mt-1">PDF, DOCX, or image — max 5MB</p></>}
          </button>
        )}
        <input ref={cvRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={uploadCV} />
      </div>

      {/* Certificates */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Award size={15} className="text-yellow-400" /> Certificates & Qualifications</h3>

        {/* Existing certs */}
        {profile?.certificates && profile.certificates.length > 0 && (
          <div className="space-y-2 mb-4">
            {profile.certificates.map(cert => (
              <div key={cert._id} className="flex items-center justify-between gap-3 p-3 bg-[#0d1117] border border-[#30363d] rounded-xl">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">{cert.name}</p>
                    {cert.verified && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30 flex-shrink-0">Verified ✓</span>}
                  </div>
                  <p className="text-xs text-[#8b949e]">{cert.issuer} {cert.year && `· ${cert.year}`}</p>
                </div>
                <button onClick={() => removeCert(cert._id!)} className="p-1 text-[#8b949e] hover:text-red-400 flex-shrink-0"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Add certificate form */}
        <div className="space-y-3 border-t border-[#30363d] pt-4">
          <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wide">Add Certificate</p>
          <input value={certForm.name} onChange={e => setCertForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Certificate name *" />
          <div className="grid grid-cols-2 gap-3">
            <input value={certForm.issuer} onChange={e => setCertForm(f => ({ ...f, issuer: e.target.value }))} className={inputCls} placeholder="Issued by" />
            <input value={certForm.year} onChange={e => setCertForm(f => ({ ...f, year: e.target.value }))} className={inputCls} placeholder="Year" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => certRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 border border-[#30363d] hover:border-[#58a6ff] rounded-xl text-xs text-[#8b949e] hover:text-white transition-colors">
              <Upload size={13} /> Attach File
            </button>
            <button onClick={() => saveCert()} disabled={addingCert}
              className="flex-1 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {addingCert ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={14} />}
              Add
            </button>
          </div>
          <input ref={certRef} type="file" accept=".pdf,image/*" className="hidden" onChange={async e => { const r = await uploadCertFile(e); if (r) saveCert(r.url, r.name); }} />
        </div>
      </div>
    </div>
  );
}

/* ══ COURSES TAB ═══════════════════════════════════════════════════ */
function CoursesTab({ courses, completed, onBack }: { courses: Course[]; completed: CompletedCourse[]; onBack: () => void; }) {
  const completedIds = new Set(completed.map(c => c.course?._id || ''));

  const levelColor = (l: string) => l === 'beginner' ? 'text-emerald-400' : l === 'intermediate' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-[#21262d] rounded-xl transition-colors"><ArrowLeft size={18} className="text-[#8b949e]" /></button>
        <div>
          <h1 className="text-xl font-black text-white">Free Courses</h1>
          <p className="text-xs text-[#8b949e]">Complete courses to boost your profile ranking</p>
        </div>
      </div>

      {/* Completed courses */}
      {completed.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-3">Completed ({completed.length})</p>
          <div className="space-y-2">
            {completed.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{c.course?.title || 'Course'}</p>
                  <p className="text-xs text-[#8b949e]">Completed · {c.score ? `Score: ${c.score}%` : 'Passed'}</p>
                </div>
                <Award size={16} className="text-yellow-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available courses */}
      {courses.length > 0 ? (
        <div>
          <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wide mb-3">Available Courses</p>
          <div className="space-y-3">
            {courses.map(c => {
              const done = completedIds.has(c._id);
              return (
                <div key={c._id} className={cls('bg-[#161b22] border rounded-2xl p-4 transition-all', done ? 'border-emerald-500/30 opacity-70' : 'border-[#30363d]')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-bold text-white">{c.title}</h3>
                        {done && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Done ✓</span>}
                      </div>
                      <p className="text-xs text-[#8b949e] mb-2">{c.description}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-[#8b949e]">{c.provider}</span>
                        {c.duration && <span className="flex items-center gap-1 text-[#8b949e]"><Clock size={10} />{c.duration}</span>}
                        <span className={levelColor(c.level)}>{c.level}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-[#161b22] border border-[#30363d] rounded-2xl">
          <BookOpen size={32} className="mx-auto mb-3 text-[#30363d]" />
          <p className="text-white font-bold mb-1">Courses Coming Soon</p>
          <p className="text-xs text-[#8b949e] max-w-xs mx-auto">StampKE Academy is building free courses to improve your skills. Check back soon!</p>
        </div>
      )}
    </div>
  );
}

/* ══ SETTINGS TAB ══════════════════════════════════════════════════ */
function SettingsTab({ user, onLogout, onBack }: { user: any; onLogout: () => void; onBack: () => void; }) {
  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-[#21262d] rounded-xl transition-colors"><ArrowLeft size={18} className="text-[#8b949e]" /></button>
        <h1 className="text-xl font-black text-white">Account Settings</h1>
      </div>
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl divide-y divide-[#21262d]">
        <div className="px-5 py-4">
          <p className="text-xs text-[#8b949e] mb-1">Signed in as</p>
          <p className="text-sm font-bold text-white">{user?.name}</p>
          <p className="text-xs text-[#8b949e]">{user?.email}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-[#8b949e] mb-1">Platform</p>
          <p className="text-sm text-white">StampKE Errands — Free account</p>
          <p className="text-xs text-[#8b949e] mt-1">Your profile and documents are stored securely.</p>
        </div>
      </div>
      <button onClick={onLogout}
        className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}
