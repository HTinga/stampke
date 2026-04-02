import React, { useState, useEffect } from 'react';
import { useWorkStore } from '../workStore';
import { useAppStats, AppActivity } from '../appStatsStore';
import { 
  Loader2, RefreshCw, Pen, FileText, Download, 
  CheckCircle2, Camera, QrCode, Layers, Bell, 
  Clock, Trash2, Activity, TrendingUp 
} from 'lucide-react';

const TYPE_META: Record<string, { icon: React.ComponentType<any>; color: string; label: string }> = {
  stamp_created:   { icon: Pen,       color: 'bg-blue-500',    label: 'Stamp Created'    },
  stamp_applied:   { icon: FileText,      color: 'bg-indigo-500',  label: 'Stamp Applied'    },
  stamp_downloaded:{ icon: Download,      color: 'bg-cyan-500',    label: 'Stamp Downloaded' },
  document_signed: { icon: CheckCircle2,  color: 'bg-emerald-500', label: 'Document Signed'  },
  pdf_edited:      { icon: FileText,      color: 'bg-orange-500',  label: 'PDF Edited'       },
  qr_generated:    { icon: QrCode,        color: 'bg-purple-500',  label: 'QR Generated'     },
  template_used:   { icon: Layers,        color: 'bg-pink-500',    label: 'Template Used'    },
  ai_scan:         { icon: Camera,        color: 'bg-rose-500',    label: 'AI Scan'          },
};

const timeAgo = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
};

export default function ActivityLog({ view }: { view: 'activity-all' | 'activity-notifications' }) {
  const stats = useAppStats();
  const { jobs } = useWorkStore();
  const [filterType, setFilterType] = useState<string>('');
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('tomo_token');
      const res = await fetch('/api/audit/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setActivities(data.result);
    } catch (err) {
      console.error('[ActivityLog] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filtered = activities.filter(a => !filterType || a.action.toLowerCase().includes(filterType.toLowerCase()));

  // Compose notifications from real data
  const notifications = [
    ...jobs.flatMap(j =>
      j.applicants
        .filter(a => a.status === 'pending')
        .map(a => ({
          id: `app-${j.id}-${a.id}`,
          title: 'New Job Application',
          body: `${a.name} applied for "${j.title}"`,
          time: a.appliedAt,
          icon: 'briefcase',
          urgent: j.urgent,
        }))
    ),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const totalActions = stats.stampsCreated + stats.stampsApplied + stats.documentsSigned +
    stats.pdfEdits + stats.stampsDownloaded + stats.aiScans + stats.qrCodesGenerated + stats.templatesUsed;

  if (view === 'activity-notifications') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-[#8b949e]">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <Bell size={13} className="text-red-400" />
              <span className="text-xs text-red-400 font-semibold">{notifications.length} unread</span>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-[#161b22] border border-[#30363d] rounded-2xl">
            <Bell size={40} className="text-[#30363d] mx-auto mb-4" />
            <h3 className="font-bold text-white mb-2">All caught up!</h3>
            <p className="text-sm text-[#8b949e]">New job applications, invoice reminders, and alerts will appear here.</p>
          </div>
        ) : (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
            {notifications.map((n, i) => (
              <div key={n.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-[#21262d]/50 transition-colors ${i < notifications.length - 1 ? 'border-b border-[#21262d]' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${n.urgent ? 'bg-red-500' : 'bg-[#1f6feb]'}`}>
                  <Bell size={15} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-[#8b949e] mt-0.5">{n.body}</p>
                </div>
                <span className="text-[10px] text-[#8b949e] flex-shrink-0 flex items-center gap-1">
                  <Clock size={9} /> {timeAgo(n.time)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Activity-all view
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Activity Log</h1>
          <p className="text-sm text-[#8b949e]">{totalActions} total action{totalActions !== 1 ? 's' : ''} this session</p>
        </div>
        <button onClick={() => stats.clearStats()}
          className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border border-[#30363d] hover:border-red-500/50 text-[#8b949e] hover:text-red-400 rounded-xl text-xs font-semibold transition-colors">
          <Trash2 size={13} /> Clear
        </button>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Stamps', value: stats.stampsCreated, icon: Pen, color: 'text-blue-400' },
          { label: 'Signed', value: stats.documentsSigned, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Scans', value: stats.aiScans, icon: Camera, color: 'text-pink-400' },
          { label: 'QR Codes', value: stats.qrCodesGenerated, icon: QrCode, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
            <s.icon size={16} className={s.color} />
            <p className="text-xl font-bold text-white mt-2">{s.value}</p>
            <p className="text-xs text-[#8b949e]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      {stats.recentActivity.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#8b949e] font-semibold uppercase tracking-widest">Filter:</span>
          <button onClick={() => setFilterType('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${!filterType ? 'bg-[#1f6feb] text-white' : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-white'}`}>
            All
          </button>
          {(Object.keys(TYPE_META) as AppActivity['type'][]).map(t => {
            const count = stats.recentActivity.filter(a => a.type === t).length;
            if (!count) return null;
            const meta = TYPE_META[t];
            return (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${filterType === t ? 'bg-[#1f6feb] text-white' : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-white'}`}>
                <meta.icon size={11} /> {meta.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={30} className="animate-spin text-[#1f6feb]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#161b22] border border-[#30363d] rounded-2xl">
          <Activity size={40} className="text-[#30363d] mx-auto mb-4" />
          <h3 className="font-bold text-white mb-2">No activity found</h3>
          <p className="text-sm text-[#8b949e]">Try clearing your filters or take some actions in the app.</p>
        </div>
      ) : (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
          {filtered.map((activity, i) => {
            const Icon = TrendingUp;
            return (
              <div key={activity.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-[#21262d]/50 transition-colors ${i < filtered.length - 1 ? 'border-b border-[#21262d]' : ''}`}>
                <div className={`w-8 h-8 bg-[#1f6feb]/20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={13} className="text-[#1f6feb]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{activity.action}</p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">{activity.details ? (typeof activity.details === 'string' ? activity.details : JSON.stringify(activity.details)) : 'Audit log'}</p>
                </div>
                <span className="text-[10px] text-[#8b949e] flex-shrink-0 flex items-center gap-1">
                  <Clock size={9} /> {timeAgo(activity.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
