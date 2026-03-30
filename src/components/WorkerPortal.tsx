import React, { useState, useRef } from 'react';
import {
  User, PenTool, Briefcase, Star, MapPin, Phone, Mail, Globe,
  Upload, X, Check, ChevronRight, Clock, AlertCircle, CheckCircle2,
  Award, Zap, Image as ImageIcon, ExternalLink, Edit3, Save,
  Eye, EyeOff, Search, Filter, Send
} from 'lucide-react';
import {
  useWorkStore, WorkerProfile, Job, Applicant, JOB_CATEGORIES,
  TYPE_LABELS, TYPE_COLORS, JobType
} from '../workStore';

const JOB_TYPE_OPTIONS: JobType[] = ['quick-gig', 'temporary', 'contract', 'permanent'];

/* ─── PROFILE FORM ────────────────────────────────────────── */
const ProfileForm: React.FC<{ initial?: Partial<WorkerProfile>; onSave: (p: WorkerProfile) => void; onCancel?: () => void }> = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState<Partial<WorkerProfile>>({
    name: '', email: '', phone: '', category: '', jobTypes: ['quick-gig'],
    location: '', bio: '', skills: [], hourlyRate: '', availability: 'Available now',
    shortNotice: true, website: '', portfolioUrl: '', portfolioFiles: [],
    rating: 0, completedJobs: 0, status: 'pending', verified: false,
    registeredAt: new Date().toISOString(),
    ...initial,
  });
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const upd = (u: Partial<WorkerProfile>) => setForm(f => ({ ...f, ...u }));
  const toggleType = (t: JobType) => {
    const cur = form.jobTypes || [];
    upd({ jobTypes: cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t] });
  };
  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !(form.skills || []).includes(s)) { upd({ skills: [...(form.skills || []), s] }); setSkillInput(''); }
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onloadend = () => upd({ portfolioFiles: [...(form.portfolioFiles || []), reader.result as string] });
      reader.readAsDataURL(f as File);
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name?.trim()) errs.name = 'Name is required';
    if (!form.phone?.trim()) errs.phone = 'Phone is required';
    if (!form.email?.trim()) errs.email = 'Email is required';
    if (!form.category) errs.category = 'Category is required';
    if (!form.location?.trim()) errs.location = 'Location is required';
    if (!form.hourlyRate?.trim()) errs.hourlyRate = 'Rate is required';
    if (!form.bio?.trim()) errs.bio = 'A short bio is required';
    if (!form.jobTypes?.length) errs.jobTypes = 'Select at least one job type';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const profile: WorkerProfile = {
      id: initial?.id || Math.random().toString(36).slice(2, 9),
      name: form.name!, email: form.email!, phone: form.phone!,
      category: form.category!, jobTypes: form.jobTypes || ['quick-gig'],
      location: form.location!, bio: form.bio!, skills: form.skills || [],
      hourlyRate: form.hourlyRate!, availability: form.availability || 'Available now',
      shortNotice: form.shortNotice ?? true,
      website: form.website, portfolioUrl: form.portfolioUrl,
      portfolioFiles: form.portfolioFiles || [],
      rating: form.rating || 0, completedJobs: form.completedJobs || 0,
      status: initial?.status || 'pending', verified: form.verified || false,
      registeredAt: form.registeredAt || new Date().toISOString(),
      adminNote: form.adminNote, adminRating: form.adminRating,
    };
    onSave(profile);
  };

  const F: React.FC<{ label: string; error?: string; required?: boolean; children: React.ReactNode }> = ({ label, error, required, children }) => (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-[#8b949e] block mb-1.5">{label}{required && ' *'}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );

  const inputCls = (err?: string) => `w-full bg-[#0d1117] border ${err ? 'border-red-500' : 'border-[#30363d]'} rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">{initial?.id ? 'Edit Your Profile' : 'Join as a Worker'}</h2>
        <p className="text-sm text-[#8b949e]">Complete your profile to get listed and found by recruiters. Your profile will be reviewed before going live.</p>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#58a6ff]">Personal Info</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Full Name" error={errors.name} required>
            <input value={form.name || ''} onChange={e => upd({ name: e.target.value })} placeholder="John Kamau" className={inputCls(errors.name)} />
          </F>
          <F label="Phone Number" error={errors.phone} required>
            <input value={form.phone || ''} onChange={e => upd({ phone: e.target.value })} placeholder="0712 345 678" type="tel" className={inputCls(errors.phone)} />
          </F>
        </div>
        <F label="Email Address" error={errors.email} required>
          <input value={form.email || ''} onChange={e => upd({ email: e.target.value })} placeholder="you@example.com" type="email" className={inputCls(errors.email)} />
        </F>
        <F label="Location / Area" error={errors.location} required>
          <input value={form.location || ''} onChange={e => upd({ location: e.target.value })} placeholder="e.g. Westlands, Nairobi" className={inputCls(errors.location)} />
        </F>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#58a6ff]">Work Details</p>
        <F label="Primary Category" error={errors.category} required>
          <select value={form.category || ''} onChange={e => upd({ category: e.target.value })} className={inputCls(errors.category)}>
            <option value="">Select your main skill category</option>
            {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </F>

        <F label="Job Types You're Available For" error={errors.jobTypes} required>
          <div className="flex flex-wrap gap-2">
            {JOB_TYPE_OPTIONS.map(t => (
              <button key={t} onClick={() => toggleType(t)} type="button"
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${(form.jobTypes || []).includes(t) ? 'bg-[#1f6feb] text-white border-[#1f6feb]' : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-[#58a6ff]'}`}>
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </F>

        <F label="Hourly / Daily Rate" error={errors.hourlyRate} required>
          <input value={form.hourlyRate || ''} onChange={e => upd({ hourlyRate: e.target.value })} placeholder="e.g. KES 800/hr or KES 3,500/day" className={inputCls(errors.hourlyRate)} />
        </F>

        <div className="grid grid-cols-2 gap-4">
          <F label="Availability">
            <input value={form.availability || ''} onChange={e => upd({ availability: e.target.value })} placeholder="Available now / Weekends only" className={inputCls()} />
          </F>
          <div className="flex flex-col justify-end">
            <label className="flex items-center justify-between p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] cursor-pointer hover:border-[#58a6ff] transition-colors">
              <div>
                <p className="text-sm font-semibold text-white">⚡ Short Notice</p>
                <p className="text-[10px] text-[#8b949e]">Available on same-day calls</p>
              </div>
              <button type="button" onClick={() => upd({ shortNotice: !form.shortNotice })}
                className={`w-10 h-5 rounded-full transition-all flex-shrink-0 ml-2 ${form.shortNotice ? 'bg-orange-500' : 'bg-[#30363d]'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${form.shortNotice ? 'translate-x-5' : ''}`} />
              </button>
            </label>
          </div>
        </div>

        <F label="Short Bio" error={errors.bio} required>
          <textarea value={form.bio || ''} onChange={e => upd({ bio: e.target.value })} rows={3}
            placeholder="Describe your experience, specialisations, and what makes you stand out..."
            className={`${inputCls(errors.bio)} resize-none`} />
        </F>

        <F label="Skills (press Enter or Add)">
          <div className="flex gap-2 mb-2">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="e.g. Wiring, Solar, Fault Diagnosis"
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
            <button type="button" onClick={addSkill} className="px-4 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">Add</button>
          </div>
          {(form.skills || []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(form.skills || []).map(s => (
                <span key={s} className="flex items-center gap-1.5 bg-[#21262d] text-[#e6edf3] text-xs px-3 py-1 rounded-xl">
                  {s}
                  <button type="button" onClick={() => upd({ skills: (form.skills || []).filter(x => x !== s) })} className="text-[#8b949e] hover:text-red-400"><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </F>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#58a6ff]">Portfolio & Links (Optional)</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Website">
            <input value={form.website || ''} onChange={e => upd({ website: e.target.value })} placeholder="https://yourwebsite.ke" type="url" className={inputCls()} />
          </F>
          <F label="Portfolio URL">
            <input value={form.portfolioUrl || ''} onChange={e => upd({ portfolioUrl: e.target.value })} placeholder="Behance, Instagram, Drive link" className={inputCls()} />
          </F>
        </div>
        <F label="Portfolio Images (max 5)">
          <div className="space-y-3">
            {(form.portfolioFiles || []).length < 5 && (
              <label className="flex items-center gap-3 p-4 border-2 border-dashed border-[#30363d] hover:border-[#58a6ff] rounded-xl cursor-pointer transition-colors hover:bg-[#21262d]">
                <Upload size={18} className="text-[#8b949e]" />
                <div><p className="text-sm text-[#e6edf3] font-medium">Upload photos of your work</p><p className="text-xs text-[#8b949e]">JPG, PNG · max 5 images</p></div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={handlePortfolioUpload} />
              </label>
            )}
            {(form.portfolioFiles || []).length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {(form.portfolioFiles || []).map((f, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={f} alt={`Portfolio ${i+1}`} className="w-full h-full object-cover rounded-xl border border-[#30363d]" />
                    <button type="button" onClick={() => upd({ portfolioFiles: (form.portfolioFiles || []).filter((_, j) => j !== i) })}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </F>
      </div>

      <div className="flex gap-3">
        {onCancel && <button type="button" onClick={onCancel} className="flex-1 py-3 border border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-xl text-sm font-semibold transition-colors">Cancel</button>}
        <button type="button" onClick={submit} className="flex-1 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
          <Send size={15} /> {initial?.id ? 'Update Profile' : 'Submit for Review'}
        </button>
      </div>
      <p className="text-center text-xs text-[#8b949e]">Your profile will be reviewed by the admin before going live on the platform.</p>
    </div>
  );
};

/* ─── WORKER PORTAL MAIN ─────────────────────────────────── */
interface WorkerPortalProps { workerEmail?: string; prefilledName?: string; }

export default function WorkerPortal({ workerEmail }: WorkerPortalProps) {
  const { workers, jobs, addWorker, updateWorker, addApplicant } = useWorkStore();
  const [tab, setTab] = useState<'browse' | 'profile' | 'my-applications'>('browse');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<JobType | ''>('');
  const [filterCat, setFilterCat] = useState('');
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [applyNote, setApplyNote] = useState('');

  // Find this worker's profile if they're already registered
  const myProfile = workerEmail ? workers.find(w => w.email === workerEmail) : undefined;
  const [editMode, setEditMode] = useState(!myProfile);

  // Jobs this worker applied to
  const myApplications = jobs.filter(j => j.applicants.some(a => a.email === workerEmail));

  // Available (approved) jobs to browse
  const openJobs = jobs.filter(j => j.status === 'open');
  const filteredJobs = openJobs.filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.category.toLowerCase().includes(search.toLowerCase()) || j.location.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || j.type === filterType;
    const matchCat = !filterCat || j.category === filterCat;
    return matchSearch && matchType && matchCat;
  });

  const handleSaveProfile = (profile: WorkerProfile) => {
    if (myProfile) updateWorker(profile.id, profile);
    else addWorker(profile);
    setEditMode(false);
  };

  const submitApplication = (job: Job) => {
    if (!myProfile) return;
    const app: Applicant = {
      id: Math.random().toString(36).slice(2, 9),
      workerId: myProfile.id,
      name: myProfile.name, phone: myProfile.phone, email: myProfile.email,
      skills: myProfile.skills, rating: myProfile.rating,
      completedJobs: myProfile.completedJobs,
      availability: myProfile.availability, note: applyNote,
      status: 'pending', appliedAt: new Date().toISOString(),
    };
    addApplicant(job.id, app);
    setApplyingJob(null);
    setApplyNote('');
    setTab('my-applications');
  };

  const TABS = [
    { id: 'browse' as const,          label: 'Browse Jobs',       emoji: '🔍' },
    { id: 'profile' as const,         label: 'My Profile',        emoji: '👤' },
    { id: 'my-applications' as const, label: 'My Applications',   emoji: '📋' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Status banner */}
      {myProfile && (
        <div className={`mb-5 flex items-center gap-3 px-4 py-3 rounded-2xl border ${
          myProfile.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/30' :
          myProfile.status === 'pending'  ? 'bg-yellow-500/10 border-yellow-500/30' :
                                            'bg-red-500/10 border-red-500/30'
        }`}>
          {myProfile.status === 'approved' ? <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" /> :
           myProfile.status === 'pending'  ? <Clock size={16} className="text-yellow-400 flex-shrink-0" /> :
                                             <AlertCircle size={16} className="text-red-400 flex-shrink-0" />}
          <div>
            <p className={`text-sm font-semibold ${myProfile.status === 'approved' ? 'text-emerald-400' : myProfile.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
              {myProfile.status === 'approved' ? '✅ Profile Live — Recruiters can find you'
               : myProfile.status === 'pending' ? '⏳ Profile Under Review — Admin will approve shortly'
               : '🚫 Profile Suspended — Contact support for details'}
            </p>
            {myProfile.adminNote && <p className="text-xs text-[#8b949e] mt-0.5">{myProfile.adminNote}</p>}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-2xl p-1 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'profile') setEditMode(!myProfile); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'}`}>
            <span className="hidden sm:inline">{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* BROWSE JOBS */}
      {tab === 'browse' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-44 flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2.5">
              <Search size={15} className="text-[#8b949e]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..." className="flex-1 bg-transparent text-white text-sm placeholder:text-[#8b949e] focus:outline-none" />
            </div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb]">
              <option value="">All Categories</option>
              {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value as JobType | '')} className="bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb]">
              <option value="">All Types</option>
              {JOB_TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="text-center py-16 bg-[#161b22] border border-[#30363d] rounded-2xl">
              <Briefcase size={36} className="text-[#30363d] mx-auto mb-3" />
              <p className="font-bold text-white mb-2">No jobs available yet</p>
              <p className="text-sm text-[#8b949e]">Check back soon — recruiters post new opportunities daily.</p>
            </div>
          ) : filteredJobs.map(job => {
            const alreadyApplied = myApplications.some(j => j.id === job.id);
            return (
              <div key={job.id} className="bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/50 rounded-2xl p-5 transition-all hover:bg-[#1c2128]">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {job.urgent && <span className="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">🔥 Urgent</span>}
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${TYPE_COLORS[job.type]}`}>{TYPE_LABELS[job.type]}</span>
                    </div>
                    <h3 className="font-bold text-white text-base">{job.title}</h3>
                    <p className="text-sm text-[#8b949e]">{job.postedBy}</p>
                  </div>
                  {alreadyApplied ? (
                    <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-xl font-semibold flex-shrink-0"><Check size={12} /> Applied</span>
                  ) : (
                    <button onClick={() => { if (!myProfile) { setTab('profile'); } else setApplyingJob(job); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors flex-shrink-0">
                      <Send size={13} /> Apply
                    </button>
                  )}
                </div>
                {job.description && <p className="text-sm text-[#8b949e] line-clamp-2 mb-3">{job.description}</p>}
                <div className="flex flex-wrap gap-2 mb-3">
                  {job.skills.slice(0, 4).map(s => <span key={s} className="text-[10px] bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded-lg">{s}</span>)}
                </div>
                <div className="flex items-center gap-4 text-xs text-[#8b949e]">
                  {job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
                  {job.duration && <span className="flex items-center gap-1"><Clock size={11} />{job.duration}</span>}
                  {job.pay && <span className="text-emerald-400 font-semibold">{job.pay}</span>}
                  <span className="ml-auto">{job.applicants.length} applied</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PROFILE */}
      {tab === 'profile' && (
        <div>
          {myProfile && !editMode ? (
            <div className="space-y-5">
              <div className="flex items-start gap-4 bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
                <div className="w-16 h-16 bg-[#1f6feb] rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">{myProfile.name.charAt(0)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-lg font-bold text-white">{myProfile.name}</h2>
                    {myProfile.verified && <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">✓ Verified</span>}
                  </div>
                  <p className="text-[#58a6ff] text-sm">{myProfile.category} · {myProfile.location}</p>
                  <p className="text-sm text-[#8b949e] mt-2">{myProfile.bio}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {myProfile.skills.map(s => <span key={s} className="text-xs bg-[#21262d] text-[#e6edf3] px-2 py-1 rounded-xl">{s}</span>)}
                  </div>
                </div>
                <button onClick={() => setEditMode(true)} className="p-2 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white rounded-xl transition-colors flex-shrink-0"><Edit3 size={15} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Rate', value: myProfile.hourlyRate, green: true },
                  { label: 'Availability', value: myProfile.availability },
                  { label: 'Short Notice', value: myProfile.shortNotice ? '⚡ Yes' : '❌ No' },
                  { label: 'Jobs Done', value: String(myProfile.completedJobs) },
                ].map(f => (
                  <div key={f.label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                    <p className="text-[10px] text-[#8b949e] uppercase tracking-widest mb-0.5">{f.label}</p>
                    <p className={`text-sm font-semibold ${f.green ? 'text-emerald-400' : 'text-white'}`}>{f.value}</p>
                  </div>
                ))}
              </div>
              {myProfile.portfolioFiles.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-3">Portfolio</p>
                  <div className="grid grid-cols-3 gap-2">{myProfile.portfolioFiles.map((f, i) => <img key={i} src={f} alt={`Portfolio ${i+1}`} className="aspect-square object-cover rounded-xl border border-[#30363d]" />)}</div>
                </div>
              )}
            </div>
          ) : (
            <ProfileForm initial={myProfile} onSave={handleSaveProfile} onCancel={myProfile ? () => setEditMode(false) : undefined} />
          )}
        </div>
      )}

      {/* MY APPLICATIONS */}
      {tab === 'my-applications' && (
        <div className="space-y-3">
          {myApplications.length === 0 ? (
            <div className="text-center py-16 bg-[#161b22] border border-[#30363d] rounded-2xl">
              <Briefcase size={36} className="text-[#30363d] mx-auto mb-3" />
              <p className="font-bold text-white mb-2">No applications yet</p>
              <p className="text-sm text-[#8b949e]">Browse jobs and hit Apply to get started.</p>
              <button onClick={() => setTab('browse')} className="mt-4 px-5 py-2.5 bg-[#1f6feb] text-white rounded-xl text-sm font-bold hover:bg-[#388bfd] transition-colors">Browse Jobs</button>
            </div>
          ) : myApplications.map(job => {
            const myApp = job.applicants.find(a => a.email === workerEmail);
            return (
              <div key={job.id} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">{job.title}</h3>
                    <p className="text-xs text-[#8b949e]">{job.postedBy} · {job.location}</p>
                    {job.pay && <p className="text-xs text-emerald-400 font-semibold mt-0.5">{job.pay}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-xl border flex-shrink-0 capitalize ${
                    myApp?.status === 'hired' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    myApp?.status === 'shortlisted' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                    myApp?.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                  }`}>{myApp?.status || 'pending'}</span>
                </div>
                {myApp?.note && <p className="text-xs text-[#8b949e] mt-2 italic">Your message: "{myApp.note}"</p>}
                <p className="text-[10px] text-[#8b949e] mt-2 flex items-center gap-1"><Clock size={9} /> Applied {myApp?.appliedAt ? new Date(myApp.appliedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : '—'}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply modal */}
      {applyingJob && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div><h3 className="font-bold text-white">Apply for Job</h3><p className="text-sm text-[#8b949e]">{applyingJob.title}</p></div>
              <button onClick={() => setApplyingJob(null)} className="p-1 hover:bg-[#21262d] rounded-xl"><X size={16} className="text-[#8b949e]" /></button>
            </div>
            {myProfile && (
              <div className="flex items-center gap-3 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 mb-4">
                <div className="w-8 h-8 bg-[#1f6feb] rounded-lg flex items-center justify-center text-white text-xs font-bold">{myProfile.name.charAt(0)}</div>
                <div><p className="text-sm font-semibold text-white">{myProfile.name}</p><p className="text-xs text-[#8b949e]">{myProfile.category} · {myProfile.phone}</p></div>
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#8b949e] block mb-2">Short Message (optional)</label>
              <textarea value={applyNote} onChange={e => setApplyNote(e.target.value)} rows={3} placeholder="Why are you the right person for this job?"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] resize-none placeholder:text-[#8b949e]" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setApplyingJob(null)} className="flex-1 py-3 border border-[#30363d] text-[#8b949e] rounded-xl text-sm font-semibold hover:bg-[#21262d] transition-colors">Cancel</button>
              <button onClick={() => submitApplication(applyingJob)} className="flex-1 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"><Send size={14} /> Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
