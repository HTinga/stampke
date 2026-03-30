import React, { useState } from 'react';
import {
  Users, Briefcase, Shield, CheckCircle2, XCircle, Clock, Star,
  Search, Eye, Trash2, Ban, ChevronDown, ChevronUp, Phone, Mail,
  MapPin, Globe, Award, AlertTriangle, BarChart2, UserCheck, UserX,
  Edit3, X, Check, RefreshCw, Download, Filter, ExternalLink
} from 'lucide-react';
import { useWorkStore, WorkerProfile, SaasUser, WorkerStatus } from '../workStore';

/* ─── STAR RATING ─────────────────────────────────────────── */
const StarRating: React.FC<{ value: number; onChange?: (v: number) => void; size?: number }> = ({ value, onChange, size = 16 }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(n => (
      <button key={n} onClick={() => onChange?.(n)} className={`transition-colors ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}>
        <Star size={size} className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-[#30363d]'} />
      </button>
    ))}
  </div>
);

/* ─── WORKER DETAIL MODAL ─────────────────────────────────── */
const WorkerDetailModal: React.FC<{ worker: WorkerProfile; onClose: () => void }> = ({ worker, onClose }) => {
  const { approveWorker, suspendWorker, deleteWorker, rateWorker, updateWorker } = useWorkStore();
  const [note, setNote] = useState(worker.adminNote || '');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const statusBadge = {
    approved:  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
  }[worker.status];

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="bg-[#161b22] border border-[#30363d] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#30363d]">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-[#1f6feb] rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {worker.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-white text-lg">{worker.name}</h2>
                {worker.verified && <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">✓ Verified</span>}
                <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full capitalize ${statusBadge}`}>{worker.status}</span>
              </div>
              <p className="text-[#58a6ff] text-sm">{worker.category}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-[#8b949e]">
                <span className="flex items-center gap-1"><MapPin size={11} />{worker.location}</span>
                <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-yellow-400" />{worker.rating} ({worker.completedJobs} jobs)</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#21262d] rounded-xl"><X size={18} className="text-[#8b949e]" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <a href={`tel:${worker.phone}`} className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 hover:border-[#58a6ff] transition-colors">
              <Phone size={15} className="text-[#58a6ff]" />
              <div><p className="text-[10px] text-[#8b949e]">Phone</p><p className="text-sm text-white font-medium">{worker.phone}</p></div>
            </a>
            <a href={`mailto:${worker.email}`} className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 hover:border-[#58a6ff] transition-colors">
              <Mail size={15} className="text-[#58a6ff]" />
              <div><p className="text-[10px] text-[#8b949e]">Email</p><p className="text-sm text-white font-medium truncate">{worker.email}</p></div>
            </a>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Rate', value: worker.hourlyRate, green: true },
              { label: 'Availability', value: worker.availability },
              { label: 'Short Notice', value: worker.shortNotice ? '✅ Yes' : '❌ No' },
              { label: 'Registered', value: new Date(worker.registeredAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) },
            ].map(f => (
              <div key={f.label} className="bg-[#0d1117] rounded-xl p-3 border border-[#30363d]">
                <p className="text-[10px] text-[#8b949e] uppercase tracking-widest mb-0.5">{f.label}</p>
                <p className={`text-sm font-semibold ${f.green ? 'text-emerald-400' : 'text-white'}`}>{f.value}</p>
              </div>
            ))}
          </div>

          {/* Bio */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-2">About</p>
            <p className="text-sm text-[#e6edf3] leading-relaxed">{worker.bio}</p>
          </div>

          {/* Skills */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">{worker.skills.map(s => <span key={s} className="text-xs bg-[#21262d] text-[#e6edf3] px-3 py-1 rounded-xl">{s}</span>)}</div>
          </div>

          {/* Job types */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-2">Available For</p>
            <div className="flex flex-wrap gap-2">{worker.jobTypes.map(t => <span key={t} className="text-xs bg-[#21262d] text-[#e6edf3] px-3 py-1 rounded-xl capitalize">{t.replace('-', ' ')}</span>)}</div>
          </div>

          {/* Portfolio / Website */}
          {(worker.website || worker.portfolioUrl) && (
            <div className="flex gap-3">
              {worker.website && <a href={worker.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#58a6ff] hover:underline"><Globe size={14} /> Website</a>}
              {worker.portfolioUrl && <a href={worker.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#58a6ff] hover:underline"><ExternalLink size={14} /> Portfolio</a>}
            </div>
          )}

          {/* Portfolio images */}
          {worker.portfolioFiles.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-2">Portfolio</p>
              <div className="grid grid-cols-3 gap-2">
                {worker.portfolioFiles.map((f, i) => <img key={i} src={f} alt={`Portfolio ${i+1}`} className="aspect-square object-cover rounded-xl border border-[#30363d]" />)}
              </div>
            </div>
          )}

          {/* Admin Rating */}
          <div className="bg-[#0d1117] rounded-xl p-4 border border-[#30363d]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-3">Admin Rating</p>
            <StarRating value={worker.adminRating || 0} onChange={r => rateWorker(worker.id, r)} size={20} />
            <p className="text-[10px] text-[#8b949e] mt-2">Your internal rating — not visible to workers</p>
          </div>

          {/* Admin Note */}
          <div className="bg-[#0d1117] rounded-xl p-4 border border-[#30363d]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e]">Admin Note</p>
              <button onClick={() => setShowNoteInput(!showNoteInput)} className="text-xs text-[#58a6ff] hover:underline">{showNoteInput ? 'Cancel' : 'Edit'}</button>
            </div>
            {showNoteInput ? (
              <div className="space-y-2">
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Internal notes about this worker..."
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f6feb] resize-none placeholder:text-[#8b949e]" />
                <button onClick={() => { updateWorker(worker.id, { adminNote: note }); setShowNoteInput(false); }} className="px-4 py-2 bg-[#1f6feb] text-white rounded-xl text-xs font-bold hover:bg-[#388bfd] transition-colors">Save Note</button>
              </div>
            ) : (
              <p className="text-sm text-[#8b949e] italic">{worker.adminNote || 'No notes yet.'}</p>
            )}
          </div>
        </div>

        {/* Actions footer */}
        <div className="p-5 border-t border-[#30363d] space-y-3">
          {worker.status === 'pending' && (
            <div className="flex gap-3">
              <button onClick={() => { approveWorker(worker.id); onClose(); }} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"><UserCheck size={16} /> Approve & List</button>
              <button onClick={() => { suspendWorker(worker.id, 'Rejected at review.'); onClose(); }} className="flex-1 py-3 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"><UserX size={16} /> Reject</button>
            </div>
          )}
          {worker.status === 'approved' && (
            <button onClick={() => { suspendWorker(worker.id, note || 'Suspended by admin.'); onClose(); }} className="w-full py-3 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"><Ban size={16} /> Suspend Worker</button>
          )}
          {worker.status === 'suspended' && (
            <button onClick={() => { approveWorker(worker.id); onClose(); }} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"><RefreshCw size={16} /> Reinstate Worker</button>
          )}
          <button onClick={() => { if (confirm(`Remove ${worker.name} permanently?`)) { deleteWorker(worker.id); onClose(); } }} className="w-full py-2 text-red-400 hover:text-red-300 text-sm font-medium flex items-center justify-center gap-1 transition-colors"><Trash2 size={14} /> Remove permanently</button>
        </div>
      </div>
    </div>
  );
};

/* ─── USER ROW ────────────────────────────────────────────── */
const UserRow: React.FC<{ user: SaasUser; onRemove: () => void }> = ({ user, onRemove }) => (
  <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#21262d] hover:bg-[#21262d]/50 transition-colors">
    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: user.role === 'admin' ? '#1f6feb' : user.role === 'worker' ? '#7c3aed' : '#059669' }}>
      {user.name.charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
      <p className="text-xs text-[#8b949e] truncate">{user.email}</p>
    </div>
    <span className={`text-[10px] font-bold px-2 py-1 rounded-xl border flex-shrink-0 capitalize ${
      user.role === 'admin' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
      user.role === 'worker' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    }`}>{user.role}</span>
    {user.company && <span className="text-xs text-[#8b949e] hidden sm:block flex-shrink-0">{user.company}</span>}
    <span className={`text-[10px] px-2 py-1 rounded-xl border flex-shrink-0 ${user.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'}`}>
      {user.active ? 'Active' : 'Inactive'}
    </span>
    {user.role !== 'admin' && (
      <button onClick={onRemove} className="p-1.5 hover:bg-red-900/30 rounded-lg text-[#8b949e] hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={14} /></button>
    )}
  </div>
);

/* ─── ADMIN PANEL ─────────────────────────────────────────── */
export default function AdminPanel() {
  const { workers, jobs, users, approveWorker, suspendWorker, deleteWorker, rateWorker, removeUser } = useWorkStore();
  const [tab, setTab] = useState<'overview' | 'workers' | 'jobs' | 'users'>('overview');
  const [workerFilter, setWorkerFilter] = useState<WorkerStatus | ''>('');
  const [search, setSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);

  const pending = workers.filter(w => w.status === 'pending');
  const approved = workers.filter(w => w.status === 'approved');
  const suspended = workers.filter(w => w.status === 'suspended');
  const openJobs = jobs.filter(j => j.status === 'open');
  const totalApplicants = jobs.reduce((sum, j) => sum + j.applicants.length, 0);

  const filteredWorkers = workers.filter(w => {
    const matchStatus = !workerFilter || w.status === workerFilter;
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.category.toLowerCase().includes(search.toLowerCase()) || w.location.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const TABS = [
    { id: 'overview' as const, label: 'Overview',  emoji: '📊' },
    { id: 'workers' as const,  label: `Workers (${workers.length})`, emoji: '👷', badge: pending.length },
    { id: 'jobs' as const,     label: `Jobs (${jobs.length})`,     emoji: '💼' },
    { id: 'users' as const,    label: `Users (${users.length})`,   emoji: '👥' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#1f6feb] rounded-2xl flex items-center justify-center"><Shield size={20} className="text-white" /></div>
        <div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-[#8b949e]">Manage workers, jobs, and platform users</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle size={13} className="text-red-400" />
          <span className="text-xs text-red-400 font-semibold">{pending.length} pending approval{pending.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-2xl p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${tab === t.id ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'}`}>
            <span className="hidden sm:inline">{t.emoji}</span>
            <span className="truncate">{t.label}</span>
            {t.badge ? <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Pending Approval', value: pending.length, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', onClick: () => { setTab('workers'); setWorkerFilter('pending'); } },
              { label: 'Active Workers', value: approved.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', onClick: () => { setTab('workers'); setWorkerFilter('approved'); } },
              { label: 'Open Jobs', value: openJobs.length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', onClick: () => setTab('jobs') },
              { label: 'Total Applicants', value: totalApplicants, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', onClick: () => setTab('jobs') },
            ].map((s, i) => (
              <button key={i} onClick={s.onClick} className={`${s.bg} border rounded-2xl p-5 text-left hover:scale-[1.02] transition-all`}>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-[#8b949e] mt-1">{s.label}</p>
              </button>
            ))}
          </div>

          {/* Pending workers — needs immediate attention */}
          {pending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={15} className="text-yellow-400" />
                <h2 className="text-sm font-bold text-white">Awaiting Your Approval</h2>
              </div>
              <div className="space-y-3">
                {pending.map(worker => (
                  <div key={worker.id} className="bg-[#161b22] border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#1f6feb] rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">{worker.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{worker.name}</p>
                      <p className="text-xs text-[#58a6ff]">{worker.category} · {worker.location}</p>
                      <p className="text-xs text-[#8b949e] mt-0.5">Applied {new Date(worker.registeredAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setSelectedWorker(worker)} className="px-3 py-2 bg-[#21262d] text-[#8b949e] hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"><Eye size={13} /> Review</button>
                      <button onClick={() => approveWorker(worker.id)} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"><Check size={13} /> Approve</button>
                      <button onClick={() => suspendWorker(worker.id, 'Rejected at review.')} className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-xl transition-colors"><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent jobs summary */}
          {jobs.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-white mb-3">Recent Jobs Posted</h2>
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
                {jobs.slice(0, 5).map((j, i) => (
                  <div key={j.id} className={`flex items-center gap-3 px-5 py-3.5 ${i < Math.min(jobs.length, 5) - 1 ? 'border-b border-[#21262d]' : ''}`}>
                    <div className="w-8 h-8 bg-[#21262d] rounded-xl flex items-center justify-center flex-shrink-0"><Briefcase size={14} className="text-[#58a6ff]" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{j.title}</p><p className="text-xs text-[#8b949e]">{j.postedBy} · {j.location}</p></div>
                    <span className="text-xs text-emerald-400 font-semibold flex-shrink-0">{j.applicants.length} applied</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WORKERS */}
      {tab === 'workers' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-44 flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2.5">
              <Search size={15} className="text-[#8b949e]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workers..." className="flex-1 bg-transparent text-white text-sm placeholder:text-[#8b949e] focus:outline-none" />
            </div>
            <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-xl p-1">
              {([['', 'All'], ['pending', '⏳ Pending'], ['approved', '✅ Approved'], ['suspended', '🚫 Suspended']] as [WorkerStatus | '', string][]).map(([v, l]) => (
                <button key={v} onClick={() => setWorkerFilter(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${workerFilter === v ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredWorkers.length === 0 ? (
              <div className="text-center py-12 bg-[#161b22] border border-[#30363d] rounded-2xl">
                <Users size={32} className="text-[#30363d] mx-auto mb-3" />
                <p className="text-[#8b949e] text-sm">No workers found.</p>
              </div>
            ) : filteredWorkers.map(worker => {
              const statusColor = { approved: 'border-l-emerald-500', pending: 'border-l-yellow-500', suspended: 'border-l-red-500' }[worker.status];
              return (
                <div key={worker.id} className={`bg-[#161b22] border border-[#30363d] border-l-4 ${statusColor} rounded-2xl p-4`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1f6feb] rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">{worker.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white text-sm">{worker.name}</p>
                        {worker.verified && <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full font-bold">✓</span>}
                        {worker.adminRating ? <StarRating value={worker.adminRating} size={12} /> : null}
                      </div>
                      <p className="text-xs text-[#58a6ff]">{worker.category} · {worker.location}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[#8b949e]">
                        <span>{worker.hourlyRate}</span>
                        <span className={worker.shortNotice ? 'text-emerald-400' : ''}>{worker.availability}</span>
                        <span>{worker.completedJobs} jobs</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setSelectedWorker(worker)} className="p-2 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white rounded-xl transition-colors"><Eye size={14} /></button>
                      {worker.status === 'pending' && <button onClick={() => approveWorker(worker.id)} className="p-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 rounded-xl transition-colors"><Check size={14} /></button>}
                      {worker.status === 'approved' && <button onClick={() => suspendWorker(worker.id, 'Suspended by admin.')} className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-xl transition-colors"><Ban size={14} /></button>}
                      {worker.status === 'suspended' && <button onClick={() => approveWorker(worker.id)} className="p-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 rounded-xl transition-colors"><RefreshCw size={14} /></button>}
                      <button onClick={() => { if (confirm('Remove permanently?')) deleteWorker(worker.id); }} className="p-2 bg-[#21262d] hover:bg-red-900/30 text-[#8b949e] hover:text-red-400 rounded-xl transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* JOBS */}
      {tab === 'jobs' && (
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-16 bg-[#161b22] border border-[#30363d] rounded-2xl">
              <Briefcase size={36} className="text-[#30363d] mx-auto mb-3" />
              <p className="text-[#8b949e] text-sm">No jobs posted yet.</p>
            </div>
          ) : (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
              {jobs.map((j, i) => (
                <div key={j.id} className={`px-5 py-4 ${i < jobs.length - 1 ? 'border-b border-[#21262d]' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {j.urgent && <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-bold">🔥 Urgent</span>}
                        <span className="text-[10px] text-[#8b949e]">{j.type.replace('-', ' ')}</span>
                      </div>
                      <p className="font-semibold text-white text-sm truncate">{j.title}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[#8b949e]">
                        <span>{j.postedBy}</span>
                        {j.location && <span className="flex items-center gap-0.5"><MapPin size={10} />{j.location}</span>}
                        {j.pay && <span className="text-emerald-400 font-semibold">{j.pay}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-[#58a6ff] font-semibold">{j.applicants.length} applicant{j.applicants.length !== 1 ? 's' : ''}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-xl border capitalize ${
                        j.status === 'open' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        j.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                      }`}>{j.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#21262d] bg-[#0d1117]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">Platform Users — {users.length} total</p>
            </div>
            {users.map(u => <UserRow key={u.id} user={u} onRemove={() => { if (confirm(`Remove ${u.name}?`)) removeUser(u.id); }} />)}
          </div>
        </div>
      )}

      {selectedWorker && <WorkerDetailModal worker={selectedWorker} onClose={() => setSelectedWorker(null)} />}
    </div>
  );
}
