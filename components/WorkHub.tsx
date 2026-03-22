import React, { useState } from 'react';
import {
  Briefcase, Plus, Search, MapPin, Clock, X, Check,
  Star, Phone, Mail, Filter, Users, CheckCircle2, DollarSign,
  Edit3, Trash2, Eye, Send, UserPlus, ThumbsUp, ThumbsDown, FileText
} from 'lucide-react';
import {
  useWorkStore, Job, WorkerProfile, Applicant, ApplicantStatus,
  JOB_CATEGORIES, TYPE_LABELS, TYPE_COLORS, JobType
} from '../src/workStore';


type ActiveView = 'post-job' | 'browse' | 'find-worker' | 'my-jobs';

const STATUS_COLORS: Record<string, string> = {
  'open': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'in-progress': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'completed': 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  'cancelled': 'bg-red-500/10 text-red-400 border-red-500/30',
};


/* ─── HELPERS ────────────────────────────────────────────── */
const timeAgo = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 1) return 'just now';
  if (d < 60) return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  return `${Math.floor(d / 1440)}d ago`;
};

const newJob = (): Job => ({
  id: Math.random().toString(36).slice(2, 9),
  title: '', description: '', category: '', type: 'quick-gig',
  location: '', pay: '', duration: '', postedBy: 'You',
  postedAt: new Date().toISOString(), status: 'open',
  applicants: [], urgent: false, skills: [], postedById: 'user',
});

/* ─── JOB CARD ───────────────────────────────────────────── */
const JobCard: React.FC<{ job: Job; onClick: () => void; onApply?: () => void; mine?: boolean }> = ({ job, onClick, onApply, mine }) => (
  <div onClick={onClick} className="bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/50 rounded-2xl p-5 cursor-pointer transition-all hover:bg-[#1c2128] group">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {job.urgent && <span className="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full uppercase tracking-wide">🔥 Urgent</span>}
          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${TYPE_COLORS[job.type]}`}>{TYPE_LABELS[job.type]}</span>
        </div>
        <h3 className="font-bold text-white text-base truncate group-hover:text-[#58a6ff] transition-colors">{job.title}</h3>
        <p className="text-sm text-[#8b949e] mt-0.5">{job.postedBy}</p>
      </div>
      <span className={`text-[10px] font-bold border px-2 py-1 rounded-xl flex-shrink-0 ${STATUS_COLORS[job.status]}`}>{job.status}</span>
    </div>
    <p className="text-sm text-[#8b949e] line-clamp-2 mb-3">{job.description || 'No description provided.'}</p>
    <div className="flex flex-wrap gap-2 mb-3">
      {job.skills.slice(0, 3).map(s => <span key={s} className="text-[10px] bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded-lg">{s}</span>)}
      {job.skills.length > 3 && <span className="text-[10px] text-[#8b949e]">+{job.skills.length - 3}</span>}
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 text-xs text-[#8b949e]">
        {job.location && <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>}
        {job.duration && <span className="flex items-center gap-1"><Clock size={11} /> {job.duration}</span>}
        {job.pay && <span className="flex items-center gap-1 text-emerald-400 font-semibold"><DollarSign size={11} /> {job.pay}</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-[#8b949e]">{timeAgo(job.postedAt)}</span>
        {mine ? (
          <span className="text-[10px] text-[#58a6ff] font-semibold">{job.applicants.length} applicant{job.applicants.length !== 1 ? 's' : ''}</span>
        ) : onApply ? (
          <button onClick={e => { e.stopPropagation(); onApply(); }} className="px-3 py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-bold rounded-xl transition-colors">Apply Now</button>
        ) : null}
      </div>
    </div>
  </div>
);

/* ─── WORKER CARD ────────────────────────────────────────── */
const WorkerCard: React.FC<{ 
  worker: WorkerProfile; 
  onShortlist: () => void; 
  onViewAndHire: () => void;
  isShortlisted?: boolean;
  shortlistsLeft?: number; 
  hiresLeft?: number;
}> = ({ worker, onShortlist, onViewAndHire, isShortlisted = false, shortlistsLeft = 999, hiresLeft = 999 }) => (
  <div className="bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/50 rounded-2xl p-5 transition-all hover:bg-[#1c2128]">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-12 h-12 bg-[#1f6feb] rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
        {worker.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3 className="font-bold text-white text-sm">{worker.name}</h3>
          {worker.verified && <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">✓ Verified</span>}
          {isShortlisted && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">⭐ Shortlisted</span>}
        </div>
        <p className="text-xs text-[#58a6ff]">{worker.category}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-[#8b949e]">
          <span className="flex items-center gap-0.5"><Star size={10} className="text-yellow-400 fill-yellow-400" /> {worker.rating}</span>
          <span>{worker.completedJobs} jobs</span>
          <span className="flex items-center gap-0.5"><MapPin size={10} /> {worker.location}</span>
        </div>
      </div>
    </div>
    <p className="text-xs text-[#8b949e] line-clamp-2 mb-3">{worker.bio}</p>
    <div className="flex flex-wrap gap-1 mb-3">
      {worker.skills.slice(0,4).map(s => <span key={s} className="text-[10px] bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded-lg">{s}</span>)}
    </div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-emerald-400 font-semibold">{worker.hourlyRate}</p>
        <p className={`text-[10px] ${worker.availability.includes('now') ? 'text-emerald-400' : 'text-yellow-400'}`}>{worker.availability}</p>
      </div>
      <div className="flex gap-2">
        {isShortlisted ? (
          <button onClick={onViewAndHire}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
            title={hiresLeft <= 0 ? 'Hire limit reached. Upgrade.' : 'View credentials & hire'}>
            <Eye size={13} /> View & Hire {hiresLeft < 999 && `(${hiresLeft} left)`}
          </button>
        ) : (
          <button onClick={onShortlist}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-colors ${shortlistsLeft > 0 ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30' : 'bg-[#21262d] text-[#8b949e] cursor-not-allowed'}`}
            disabled={shortlistsLeft <= 0} title={shortlistsLeft <= 0 ? 'Shortlist limit reached. Upgrade.' : `Shortlist (${shortlistsLeft} left)`}>
            <UserPlus size={13} /> {shortlistsLeft <= 0 ? '🔒 Upgrade' : `Shortlist`}
          </button>
        )}
      </div>
    </div>
  </div>
);

/* ─── POST JOB FORM ──────────────────────────────────────── */
const PostJobForm: React.FC<{ onSave: (job: Job) => void; initial?: Job; onCancel: () => void }> = ({ onSave, initial, onCancel }) => {
  const [form, setForm] = useState<Job>(initial || newJob());
  const [skillInput, setSkillInput] = useState('');
  const upd = (u: Partial<Job>) => setForm(f => ({ ...f, ...u }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) { upd({ skills: [...form.skills, s] }); setSkillInput(''); }
  };

  const valid = form.title.trim() && form.category && form.location.trim() && form.pay.trim();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">{initial ? 'Edit Job' : 'Post a Job'}</h2>
        <p className="text-sm text-[#8b949e]">Find the right person in minutes, not days.</p>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#8b949e] block mb-2">Job Title *</label>
          <input value={form.title} onChange={e => upd({ title: e.target.value })} placeholder="e.g. Need an electrician urgently"
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
        </div>

        {/* Category & Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#8b949e] block mb-2">Category *</label>
            <select value={form.category} onChange={e => upd({ category: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb]">
              <option value="">Select category</option>
              {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#8b949e] block mb-2">Job Type</label>
            <select value={form.type} onChange={e => upd({ type: e.target.value as JobType })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb]">
              <option value="quick-gig">⚡ Quick Gig</option>
              <option value="temporary">📅 Temporary</option>
              <option value="contract">📋 Contract</option>
              <option value="permanent">🏢 Permanent</option>
            </select>
          </div>
        </div>

        {/* Location & Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#8b949e] block mb-2">Location *</label>
            <input value={form.location} onChange={e => upd({ location: e.target.value })} placeholder="e.g. Westlands, Nairobi"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[#8b949e] block mb-2">Duration</label>
            <input value={form.duration} onChange={e => upd({ duration: e.target.value })} placeholder="e.g. 1 day, 2 weeks"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
          </div>
        </div>

        {/* Pay */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#8b949e] block mb-2">Pay / Rate *</label>
          <input value={form.pay} onChange={e => upd({ pay: e.target.value })} placeholder="e.g. KES 1,500/day or KES 800/hr"
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#8b949e] block mb-2">Description</label>
          <textarea value={form.description} onChange={e => upd({ description: e.target.value })} rows={3} placeholder="Describe the job, any requirements, tools needed..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e] resize-none" />
        </div>

        {/* Skills */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#8b949e] block mb-2">Required Skills</label>
          <div className="flex gap-2 mb-2">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Type a skill and press Enter"
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
            <button onClick={addSkill} className="px-4 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">Add</button>
          </div>
          {form.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.skills.map(s => (
                <span key={s} className="flex items-center gap-1.5 bg-[#21262d] text-[#e6edf3] text-xs px-3 py-1 rounded-xl">
                  {s}
                  <button onClick={() => upd({ skills: form.skills.filter(x => x !== s) })} className="text-[#8b949e] hover:text-red-400 transition-colors"><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Urgent toggle */}
        <label className="flex items-center justify-between p-4 bg-[#0d1117] rounded-xl border border-[#30363d] cursor-pointer hover:border-[#58a6ff] transition-colors">
          <div>
            <p className="text-sm font-semibold text-white">🔥 Mark as Urgent</p>
            <p className="text-xs text-[#8b949e]">Gets highlighted and shown first to available workers</p>
          </div>
          <button onClick={() => upd({ urgent: !form.urgent })} className={`w-11 h-6 rounded-full transition-all flex-shrink-0 ${form.urgent ? 'bg-orange-500' : 'bg-[#30363d]'}`}>
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.urgent ? 'translate-x-5' : ''}`} />
          </button>
        </label>
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 border border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-xl text-sm font-semibold transition-colors">Cancel</button>
        <button onClick={() => valid && onSave(form)} disabled={!valid}
          className="flex-1 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
          <Send size={15} /> {initial ? 'Save Changes' : 'Post Job'}
        </button>
      </div>
    </div>
  );
};

/* ─── JOB DETAIL MODAL ───────────────────────────────────── */
const JobDetail: React.FC<{ job: Job; onClose: () => void; onApply?: () => void; onUpdateApplicant?: (jobId: string, appId: string, status: ApplicantStatus) => void; mine?: boolean }> = ({ job, onClose, onApply, onUpdateApplicant, mine }) => {
  const [tab, setTab] = useState<'details' | 'applicants'>('details');
  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-start justify-between p-5 border-b border-[#30363d]">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {job.urgent && <span className="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">🔥 Urgent</span>}
              <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${TYPE_COLORS[job.type]}`}>{TYPE_LABELS[job.type]}</span>
            </div>
            <h2 className="text-lg font-bold text-white">{job.title}</h2>
            <p className="text-sm text-[#8b949e]">{job.postedBy} · {timeAgo(job.postedAt)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#21262d] rounded-xl text-[#8b949e] hover:text-white"><X size={18} /></button>
        </div>

        {mine && (
          <div className="flex border-b border-[#30363d]">
            {(['details', 'applicants'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${tab === t ? 'text-white border-b-2 border-[#1f6feb]' : 'text-[#8b949e] hover:text-white'}`}>
                {t === 'applicants' ? `Applicants (${job.applicants.length})` : t}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'details' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Category', value: job.category },
                  { label: 'Location', value: job.location || '—' },
                  { label: 'Pay', value: job.pay, green: true },
                  { label: 'Duration', value: job.duration || '—' },
                ].map(f => (
                  <div key={f.label} className="bg-[#0d1117] rounded-xl p-3">
                    <p className="text-[10px] text-[#8b949e] uppercase tracking-widest mb-1">{f.label}</p>
                    <p className={`text-sm font-semibold ${f.green ? 'text-emerald-400' : 'text-white'}`}>{f.value}</p>
                  </div>
                ))}
              </div>
              {job.description && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-2">Description</p>
                  <p className="text-sm text-[#e6edf3] leading-relaxed">{job.description}</p>
                </div>
              )}
              {job.skills.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-2">{job.skills.map(s => <span key={s} className="text-xs bg-[#21262d] text-[#e6edf3] px-3 py-1 rounded-xl">{s}</span>)}</div>
                </div>
              )}
              {!mine && onApply && (
                <button onClick={onApply} className="w-full py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                  <UserPlus size={16} /> Apply for this Job
                </button>
              )}
            </div>
          )}

          {tab === 'applicants' && (
            <div className="space-y-3">
              {job.applicants.length === 0 ? (
                <div className="text-center py-10">
                  <Users size={32} className="text-[#30363d] mx-auto mb-3" />
                  <p className="text-[#8b949e] text-sm">No applicants yet. Share this job to attract workers.</p>
                </div>
              ) : job.applicants.map(app => (
                <div key={app.id} className="bg-[#0d1117] rounded-2xl p-4 border border-[#30363d]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white text-sm">{app.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[#8b949e]">
                        <span className="flex items-center gap-0.5"><Star size={10} className="text-yellow-400 fill-yellow-400" /> {app.rating}</span>
                        <span>{app.completedJobs} jobs done</span>
                        <a href={`tel:${app.phone}`} className="flex items-center gap-0.5 text-[#58a6ff] hover:underline"><Phone size={10} /> {app.phone}</a>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-xl border ${
                      app.status === 'hired' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      app.status === 'shortlisted' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      app.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                    }`}>{app.status}</span>
                  </div>
                  {app.note && <p className="text-xs text-[#8b949e] mb-3 italic">"{app.note}"</p>}
                  <div className="flex flex-wrap gap-1 mb-3">{app.skills.map(s => <span key={s} className="text-[10px] bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded-lg">{s}</span>)}</div>
                  {app.status === 'pending' && onUpdateApplicant && (
                    <div className="flex gap-2">
                      <button onClick={() => onUpdateApplicant(job.id, app.id, 'shortlisted')} className="flex-1 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-1"><ThumbsUp size={12} /> Shortlist</button>
                      <button onClick={() => onUpdateApplicant(job.id, app.id, 'hired')} className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-1"><Check size={12} /> Hire</button>
                      <button onClick={() => onUpdateApplicant(job.id, app.id, 'rejected')} className="py-2 px-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold hover:bg-red-500/30 transition-colors"><ThumbsDown size={12} /></button>
                    </div>
                  )}
                  {app.status === 'shortlisted' && onUpdateApplicant && (
                    <button onClick={() => onUpdateApplicant(job.id, app.id, 'hired')} className="w-full py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-1"><Check size={12} /> Confirm Hire</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── APPLY MODAL ────────────────────────────────────────── */
const ApplyModal: React.FC<{ job: Job; onApply: (a: Applicant) => void; onClose: () => void }> = ({ job, onApply, onClose }) => {
  const [form, setForm] = useState({ name: '', phone: '', skills: '', note: '' });
  const valid = form.name.trim() && form.phone.trim();
  const submit = () => {
    if (!valid) return;
    const app: Applicant = {
      id: Math.random().toString(36).slice(2, 9),
      name: form.name, phone: form.phone, email: '',
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      rating: 4.5, completedJobs: 0,
      availability: 'Available now', note: form.note,
      status: 'pending', appliedAt: new Date().toISOString(),
    };
    onApply(app);
  };
  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div><h3 className="font-bold text-white">Apply for Job</h3><p className="text-sm text-[#8b949e]">{job.title}</p></div>
          <button onClick={onClose} className="p-1 hover:bg-[#21262d] rounded-xl"><X size={16} className="text-[#8b949e]" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#8b949e] font-bold uppercase tracking-widest block mb-1.5">Your Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Kamau"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
          </div>
          <div>
            <label className="text-xs text-[#8b949e] font-bold uppercase tracking-widest block mb-1.5">Phone Number *</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0712 345 678" type="tel"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
          </div>
          <div>
            <label className="text-xs text-[#8b949e] font-bold uppercase tracking-widest block mb-1.5">Your Skills (comma-separated)</label>
            <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="Electrician, Wiring, Solar"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e]" />
          </div>
          <div>
            <label className="text-xs text-[#8b949e] font-bold uppercase tracking-widest block mb-1.5">Short Message (optional)</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} placeholder="Why are you the right person for this job?"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] placeholder:text-[#8b949e] resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 border border-[#30363d] text-[#8b949e] rounded-xl text-sm font-semibold hover:bg-[#21262d] transition-colors">Cancel</button>
          <button onClick={submit} disabled={!valid} className="flex-1 py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            <Send size={14} /> Submit Application
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── MAIN WORK HUB ──────────────────────────────────────── */
interface WorkHubProps { initialView?: 'post-job' | 'browse' | 'find-worker' | 'my-jobs'; shortlistsLeft?: number; hiresLeft?: number; onUpgrade?: () => void; onBumpShortlist?: () => void; onBumpHire?: () => void; onSendContract?: (workerName: string, workerEmail: string, jobTitle: string) => void; }
interface HireModalState { worker: WorkerProfile; jobTitle: string; }

export default function WorkHub({ initialView = 'browse', shortlistsLeft = 999, hiresLeft = 999, onUpgrade, onBumpShortlist, onBumpHire, onSendContract }: WorkHubProps) {
  const [shortlisted, setShortlisted] = React.useState<Set<string>>(new Set());
  const [hired, setHired] = React.useState<Set<string>>(new Set());
  const [hireModal, setHireModal] = React.useState<HireModalState | null>(null);
  const [view, setView] = useState<ActiveView>(initialView);
  const { jobs, workers, addJob, updateJob, deleteJob, addApplicant, updateApplicant } = useWorkStore();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterType, setFilterType] = useState<JobType | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter jobs
  const filteredJobs = jobs.filter(j => {
    const matchQ = !searchQ || j.title.toLowerCase().includes(searchQ.toLowerCase()) || j.category.toLowerCase().includes(searchQ.toLowerCase()) || j.location.toLowerCase().includes(searchQ.toLowerCase());
    const matchCat = !filterCat || j.category === filterCat;
    const matchType = !filterType || j.type === filterType;
    return matchQ && matchCat && matchType;
  });

  const myJobs = jobs; // In production, filter by current user
  const openJobs = filteredJobs.filter(j => j.status === 'open');

  const saveJob = (job: Job) => {
    if (jobs.find(j => j.id === job.id)) {
      updateJob(job.id, job);
    } else {
      addJob(job);
    }
    setEditingJob(null);
    setView('my-jobs');
  };

  

  const applyToJob = (jobId: string, applicant: Applicant) => { addApplicant(jobId, applicant); setApplyingJob(null); setSelectedJob(null); };

  

  const doShortlist = (worker: WorkerProfile) => {
    if (shortlistsLeft <= 0) { onUpgrade?.(); return; }
    setShortlisted(s => { const n = new Set(s); n.add(worker.id); return n; });
    onBumpShortlist?.();
  };

  const doViewAndHire = (worker: WorkerProfile) => {
    if (hiresLeft <= 0) { onUpgrade?.(); return; }
    setHireModal({ worker, jobTitle: `${worker.category} role — ${worker.location}` });
  };

  const confirmHire = () => {
    if (!hireModal) return;
    const { worker, jobTitle } = hireModal;
    setHired(h => { const n = new Set(h); n.add(worker.id); return n; });
    onBumpHire?.();
    onSendContract?.(worker.name, worker.phone || '', jobTitle);
    setHireModal(null);
  };

  // Keep old for backward compat
  const hireWorker = (worker: WorkerProfile) => doShortlist(worker);

  const TABS: { id: ActiveView; label: string; emoji: string }[] = [
    { id: 'browse',      label: 'Browse Jobs',  emoji: '🔍' },
    { id: 'find-worker', label: 'Find Worker',  emoji: '👷' },
    { id: 'my-jobs',     label: 'My Jobs',      emoji: '📋' },
    { id: 'post-job',    label: 'Post a Job',   emoji: '➕' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-2xl p-1 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setView(t.id); setEditingJob(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${view === t.id ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'}`}>
            <span className="hidden sm:inline">{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── BROWSE JOBS ── */}
      {view === 'browse' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-48 flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2.5">
              <Search size={16} className="text-[#8b949e] flex-shrink-0" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search jobs, skills, location..."
                className="flex-1 bg-transparent text-white text-sm placeholder:text-[#8b949e] focus:outline-none" />
            </div>
            <button onClick={() => setShowFilters(f => !f)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${showFilters ? 'bg-[#1f6feb] text-white border-[#1f6feb]' : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-white'}`}>
              <Filter size={15} /> Filter
            </button>
          </div>
          {showFilters && (
            <div className="flex gap-3 flex-wrap">
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb]">
                <option value="">All Categories</option>
                {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value as JobType | '')} className="bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb]">
                <option value="">All Types</option>
                <option value="quick-gig">⚡ Quick Gig</option>
                <option value="temporary">📅 Temporary</option>
                <option value="contract">📋 Contract</option>
                <option value="permanent">🏢 Permanent</option>
              </select>
              {(filterCat || filterType) && <button onClick={() => { setFilterCat(''); setFilterType(''); }} className="px-3 py-2 text-[#8b949e] hover:text-white text-sm transition-colors">Clear filters</button>}
            </div>
          )}

          {openJobs.length === 0 ? (
            <div className="text-center py-16 bg-[#161b22] border border-[#30363d] rounded-2xl">
              <Briefcase size={40} className="text-[#30363d] mx-auto mb-4" />
              <h3 className="font-bold text-white mb-2">No jobs posted yet</h3>
              <p className="text-sm text-[#8b949e] mb-6">Be the first to post a job opportunity.</p>
              <button onClick={() => setView('post-job')} className="px-5 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors">Post a Job</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {openJobs.map(job => (
                <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} onApply={() => setApplyingJob(job)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FIND WORKER ── */}
      {view === 'find-worker' && (
        <div className="space-y-4">
          {/* Free tier usage bar */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">Shortlists</span>
                <span className={`text-xs font-bold ${shortlistsLeft > 0 ? 'text-blue-400' : 'text-red-400'}`}>{shortlistsLeft < 999 ? `${shortlistsLeft} left` : 'Unlimited'}</span>
              </div>
              {shortlistsLeft < 999 && <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(shortlistsLeft/5)*100}%` }} /></div>}
            </div>
            <div className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">Hires</span>
                <span className={`text-xs font-bold ${hiresLeft > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{hiresLeft < 999 ? `${hiresLeft} left` : 'Unlimited'}</span>
              </div>
              {hiresLeft < 999 && <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(hiresLeft/3)*100}%` }} /></div>}
            </div>
            {(shortlistsLeft <= 0 || hiresLeft <= 0) && onUpgrade && (
              <button onClick={onUpgrade} className="px-4 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-xs font-black transition-colors flex-shrink-0">⚡ Upgrade</button>
            )}
          </div>
          <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2.5">
            <Search size={16} className="text-[#8b949e]" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by skill, name, location..."
              className="flex-1 bg-transparent text-white text-sm placeholder:text-[#8b949e] focus:outline-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workers.filter(w => !searchQ || w.name.toLowerCase().includes(searchQ.toLowerCase()) || w.category.toLowerCase().includes(searchQ.toLowerCase()) || w.skills.some(s => s.toLowerCase().includes(searchQ.toLowerCase())) || w.location.toLowerCase().includes(searchQ.toLowerCase())).map(w => (
              <WorkerCard key={w.id} worker={w} onShortlist={() => doShortlist(w)} onViewAndHire={() => doViewAndHire(w)} isShortlisted={shortlisted.has(w.id)} shortlistsLeft={shortlistsLeft} hiresLeft={hiresLeft} />
            ))}
          </div>
        </div>
      )}

      {/* ── MY JOBS ── */}
      {view === 'my-jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-white">My Posted Jobs</h2><p className="text-sm text-[#8b949e]">{myJobs.length} job{myJobs.length !== 1 ? 's' : ''} posted</p></div>
            <button onClick={() => { setEditingJob(newJob()); setView('post-job'); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors"><Plus size={15} /> New Job</button>
          </div>
          {myJobs.length === 0 ? (
            <div className="text-center py-16 bg-[#161b22] border border-[#30363d] rounded-2xl">
              <FileText size={40} className="text-[#30363d] mx-auto mb-4" />
              <h3 className="font-bold text-white mb-2">No jobs posted yet</h3>
              <button onClick={() => { setEditingJob(newJob()); setView('post-job'); }} className="mt-4 px-5 py-2.5 bg-[#1f6feb] text-white rounded-xl text-sm font-bold hover:bg-[#388bfd] transition-colors">Post your first job</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {myJobs.map(job => (
                <div key={job.id} className="relative">
                  <JobCard job={job} mine onClick={() => setSelectedJob(job)} />
                  <div className="absolute top-4 right-4 flex gap-1">
                    <button onClick={e => { e.stopPropagation(); setEditingJob(job); setView('post-job'); }} className="p-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white rounded-lg transition-colors"><Edit3 size={13} /></button>
                    <button onClick={e => { e.stopPropagation(); deleteJob(job.id); }} className="p-1.5 bg-[#21262d] hover:bg-red-900/40 text-[#8b949e] hover:text-red-400 rounded-lg transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── POST JOB ── */}
      {view === 'post-job' && (
        <PostJobForm onSave={saveJob} initial={editingJob || undefined} onCancel={() => { setEditingJob(null); setView('my-jobs'); }} />
      )}

      {/* ── MODALS ── */}
      {selectedJob && (
        <JobDetail job={selectedJob} onClose={() => setSelectedJob(null)}
          onApply={selectedJob.status === 'open' ? () => { setApplyingJob(selectedJob); setSelectedJob(null); } : undefined}
          onUpdateApplicant={updateApplicant} mine />
      )}
      {applyingJob && (
        <ApplyModal job={applyingJob} onApply={app => applyToJob(applyingJob.id, app)} onClose={() => setApplyingJob(null)} />
      )}
      {/* ── Hire Modal — shows worker credentials + contract send ── */}
      {hireModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur z-[500] flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-[#30363d] flex items-center justify-between">
              <h3 className="text-base font-black text-white">Worker Credentials</h3>
              <button onClick={() => setHireModal(null)} className="p-1 text-[#8b949e] hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Worker details */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-[#1f6feb] rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">{hireModal.worker.name.charAt(0)}</div>
                <div>
                  <p className="font-black text-white">{hireModal.worker.name}</p>
                  <p className="text-xs text-[#58a6ff]">{hireModal.worker.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {hireModal.worker.verified && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">✓ Verified</span>}
                  </div>
                </div>
              </div>
              {/* Credentials */}
              <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wide">Contact Details</p>
                {hireModal.worker.phone && (
                  <a href={`tel:${hireModal.worker.phone}`} className="flex items-center gap-2 text-sm text-white hover:text-[#58a6ff] transition-colors">
                    <Phone size={14} className="text-[#8b949e]" /> {hireModal.worker.phone}
                  </a>
                )}
                {hireModal.worker.email && (
                  <a href={`mailto:${hireModal.worker.email}`} className="flex items-center gap-2 text-sm text-white hover:text-[#58a6ff] transition-colors">
                    <Mail size={14} className="text-[#8b949e]" /> {hireModal.worker.email}
                  </a>
                )}
              </div>
              <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wide">Profile</p>
                <p className="text-sm text-white">{hireModal.worker.bio}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {hireModal.worker.skills.map(s => <span key={s} className="text-[10px] bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded-lg">{s}</span>)}
                </div>
                <p className="text-sm text-emerald-400 font-semibold mt-2">{hireModal.worker.hourlyRate}</p>
              </div>
              {/* Contract info */}
              <div className="bg-[#1f6feb]/10 border border-[#1f6feb]/20 rounded-xl p-4">
                <p className="text-sm font-bold text-white mb-1">📄 Auto-send Employment Contract</p>
                <p className="text-xs text-[#8b949e]">Clicking "Hire & Send Contract" will use one eSign credit to automatically send a contract for <strong className="text-white">{hireModal.worker.name}</strong> to sign digitally.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setHireModal(null)} className="flex-1 py-3 border border-[#30363d] text-[#8b949e] hover:text-white rounded-xl text-sm font-bold transition-colors">Cancel</button>
                <button onClick={confirmHire} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black transition-colors">
                  ✓ Hire & Send Contract
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
