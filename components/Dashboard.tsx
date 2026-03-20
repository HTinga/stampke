import React, { useMemo } from 'react';
import {
  PenTool, CheckCircle2, FileText, Wrench, QrCode, Share2,
  Camera, Download, Layers, ChevronRight, TrendingUp,
  BarChart3, Clock, Zap, ArrowUpRight, Sparkles, Activity,
  FileCheck, Target
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStats } from '../src/appStatsStore';

type TabType = 'stamp-studio' | 'esign' | 'dashboard' | 'pdf-forge' | 'convert' | 'apply-stamp' | 'templates' | 'qr-tracker' | 'social-hub' | 'landing';

interface DashboardProps {
  userName?: string;
  onNavigate: (tab: TabType) => void;
  theme: 'light' | 'dark';
}

const ICON_MAP: Record<string, React.ComponentType<{size?: number; className?: string}>> = {
  PenTool, CheckCircle2, FileText, Wrench, QrCode, Camera, Layers, Download,
  Share2, BarChart3, Activity, FileCheck,
};

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Weekly activity: deterministic sparkline data seeded from total (no re-randomize on render)
function generateWeeklyData(total: number): number[] {
  const days = 7;
  // Simple deterministic seed based on total value
  const seed = (n: number, s: number) => ((n * 1664525 + s * 1013904223) & 0x7fffffff) / 0x7fffffff;
  const arr: number[] = [];
  let remaining = Math.max(total, days);
  for (let i = 0; i < days - 1; i++) {
    const v = Math.floor(seed(remaining, i + 1) * (remaining / (days - i)) * 1.5);
    arr.push(Math.max(0, v));
    remaining -= v;
  }
  arr.push(Math.max(0, remaining));
  return arr;
}

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data, 1);
  const w = 60, h = 24;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ userName, onNavigate, theme }) => {
  const stats = useAppStats();
  const isDark = theme === 'dark';

  const totalActions = stats.stampsCreated + stats.stampsApplied + stats.documentsSigned +
    stats.pdfEdits + stats.qrCodesGenerated + stats.templatesUsed + stats.aiScans + stats.stampsDownloaded;

  const statCards = [
    {
      label: 'Stamps Created',
      value: stats.stampsCreated,
      icon: PenTool,
      color: 'text-[#134589]',
      bg: 'bg-[#eaf2fc] dark:bg-[#062040]',
      border: 'border-[#d4e6f9] dark:border-blue-900/40',
      accent: '#2563eb',
      tab: 'stamp-studio' as TabType,
      sparkData: generateWeeklyData(stats.stampsCreated),
      description: 'Designed in Stamp Studio',
    },
    {
      label: 'Stamps Applied',
      value: stats.stampsApplied,
      icon: FileText,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-100 dark:border-orange-900/40',
      accent: '#ea580c',
      tab: 'apply-stamp' as TabType,
      sparkData: generateWeeklyData(stats.stampsApplied),
      description: 'Applied to PDF documents',
    },
    {
      label: 'Documents Signed',
      value: stats.documentsSigned,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-100 dark:border-emerald-900/40',
      accent: '#059669',
      tab: 'esign' as TabType,
      sparkData: generateWeeklyData(stats.documentsSigned),
      description: 'Signed via Sign Center',
    },
    {
      label: 'PDF Edits',
      value: stats.pdfEdits,
      icon: Wrench,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-100 dark:border-purple-900/40',
      accent: '#9333ea',
      tab: 'pdf-forge' as TabType,
      sparkData: generateWeeklyData(stats.pdfEdits),
      description: 'Processed in PDF Editor',
    },
    {
      label: 'QR Codes',
      value: stats.qrCodesGenerated,
      icon: QrCode,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
      border: 'border-cyan-100 dark:border-cyan-900/40',
      accent: '#0891b2',
      tab: 'qr-tracker' as TabType,
      sparkData: generateWeeklyData(stats.qrCodesGenerated),
      description: 'Generated & tracked',
    },
    {
      label: 'AI Scans',
      value: stats.aiScans,
      icon: Camera,
      color: 'text-pink-600',
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      border: 'border-pink-100 dark:border-pink-900/40',
      accent: '#db2777',
      tab: 'convert' as TabType,
      sparkData: generateWeeklyData(stats.aiScans),
      description: 'Stamps digitized via AI',
    },
    {
      label: 'Templates Used',
      value: stats.templatesUsed,
      icon: Layers,
      color: 'text-[#224260]',
      bg: 'bg-[#eaf2fc] dark:bg-[#062040]',
      border: 'border-[#c5d8ef] dark:border-[#134589]',
      accent: '#475569',
      tab: 'templates' as TabType,
      sparkData: generateWeeklyData(stats.templatesUsed),
      description: 'Applied from library',
    },
    {
      label: 'Downloads',
      value: stats.stampsDownloaded,
      icon: Download,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      border: 'border-indigo-100 dark:border-indigo-900/40',
      accent: '#4f46e5',
      tab: 'stamp-studio' as TabType,
      sparkData: generateWeeklyData(stats.stampsDownloaded),
      description: 'Exported as SVG/PNG/PDF',
    },
  ];

  const quickActions = [
    { label: 'Design New Stamp', icon: PenTool, color: 'from-blue-500 to-indigo-600', tab: 'stamp-studio' as TabType, desc: 'Open Stamp Studio' },
    { label: 'Sign a Document', icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', tab: 'esign' as TabType, desc: 'Open Sign Center' },
    { label: 'Apply Stamp to PDF', icon: FileText, color: 'from-orange-500 to-amber-600', tab: 'apply-stamp' as TabType, desc: 'Stamp Applier' },
    { label: 'Edit PDF', icon: Wrench, color: 'from-purple-500 to-violet-600', tab: 'pdf-forge' as TabType, desc: 'PDF Editor' },
    { label: 'Track with QR', icon: QrCode, color: 'from-cyan-500 to-sky-600', tab: 'qr-tracker' as TabType, desc: 'QR Tracker' },
    { label: 'AI Scan Stamp', icon: Camera, color: 'from-pink-500 to-rose-600', tab: 'convert' as TabType, desc: 'Digitize Rubber Stamp' },
  ];

  const isEmpty = totalActions === 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-[#365874]' : 'text-[#4d7291]'}`}>Live Dashboard</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter mb-1">
            Welcome back{userName ? `, ${userName}` : ''}.
          </h2>
          <p className={`font-medium ${isDark ? 'text-[#4d7291]' : 'text-[#365874]'}`}>
            Here's your real-time activity overview across all Sahihi tools.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('stamp-studio')}
            className="bg-[#134589] text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#0e3a72] transition-all shadow-lg shadow-[#c5d8ef] dark:shadow-none"
          >
            <PenTool size={16} /> New Stamp
          </button>
          <button
            onClick={() => onNavigate('landing')}
            className={`px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all border ${isDark ? 'border-[#134589] text-[#7ab3e8] hover:bg-[#062040]' : 'border-[#c5d8ef] text-[#224260] hover:bg-[#f0f6ff]'}`}
          >
            <Sparkles size={16} /> View Plans
          </button>
        </div>
      </div>

      {/* Empty state CTA */}
      {isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl border-2 border-dashed p-10 text-center ${isDark ? 'border-[#134589] bg-[#041628]/50' : 'border-[#d4e6f9] bg-[#eaf2fc]/50'}`}
        >
          <div className="w-14 h-14 bg-[#134589] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#aaccf2]">
            <Zap size={28} className="text-white" />
          </div>
          <h3 className="text-2xl font-black tracking-tight mb-2">Your activity will appear here</h3>
          <p className={`mb-6 font-medium ${isDark ? 'text-[#4d7291]' : 'text-[#365874]'}`}>
            Start designing stamps, signing documents, or applying stamps — your stats update in real time.
          </p>
          <button
            onClick={() => onNavigate('stamp-studio')}
            className="bg-[#134589] text-white px-8 py-4 rounded-2xl font-black text-base hover:bg-[#0e3a72] transition-all shadow-lg shadow-[#aaccf2] inline-flex items-center gap-2"
          >
            <PenTool size={18} /> Design Your First Stamp
          </button>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onNavigate(stat.tab)}
            className={`group text-left p-5 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-0.5 ${isDark ? 'bg-[#041628] border-[#0e3a72] hover:border-[#1a5cad]' : 'bg-white border-[#eaf2fc] hover:border-[#c5d8ef] shadow-sm'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.border} border`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <ArrowUpRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity mt-1 ${stat.color}`} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-[#365874]' : 'text-[#4d7291]'}`}>{stat.label}</p>
                <h3 className="text-3xl font-black tracking-tighter leading-none">{stat.value.toLocaleString()}</h3>
                <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-[#224260]' : 'text-[#4d7291]'}`}>{stat.description}</p>
              </div>
              <div className="pb-1">
                <Sparkline data={stat.sparkData} color={stat.accent} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Middle row: Activity feed + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent Activity */}
        <div className={`lg:col-span-3 rounded-3xl border p-6 ${isDark ? 'bg-[#041628] border-[#0e3a72]' : 'bg-white border-[#eaf2fc] shadow-sm'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#eaf2fc] dark:bg-[#062040] rounded-xl flex items-center justify-center">
                <Activity size={16} className="text-[#365874]" />
              </div>
              <h3 className="text-base font-black tracking-tight">Recent Activity</h3>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#224260]' : 'text-[#4d7291]'}`}>
              {stats.recentActivity.length} events
            </span>
          </div>

          {stats.recentActivity.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-[#224260]' : 'text-[#7ab3e8]'}`}>
              <Clock size={32} className="mx-auto mb-3" />
              <p className="font-black text-sm">No activity yet</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-[#0a2d5a]' : 'text-[#4d7291]'}`}>Your actions will appear here in real time</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentActivity.slice(0, 8).map((event, i) => {
                const IconComp = ICON_MAP[event.icon] || Activity;
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-4 p-3 rounded-2xl transition-colors ${isDark ? 'hover:bg-[#062040]' : 'hover:bg-[#f0f6ff]'}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${event.color}`}>
                      <IconComp size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{event.description}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${isDark ? 'text-[#224260]' : 'text-[#4d7291]'}`}>
                      {timeAgo(event.timestamp)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions + Summary */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Total activity score */}
          <div className={`rounded-3xl border p-6 ${isDark ? 'bg-[#041628] border-[#0e3a72]' : 'bg-white border-[#eaf2fc] shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#eaf2fc] dark:bg-[#062040] rounded-xl flex items-center justify-center">
                <Target size={16} className="text-[#134589]" />
              </div>
              <h3 className="text-base font-black tracking-tight">Session Summary</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Total Actions', value: totalActions, color: 'bg-[#134589]' },
                { label: 'Stamps', value: stats.stampsCreated + stats.stampsApplied + stats.stampsDownloaded, color: 'bg-indigo-500' },
                { label: 'Documents', value: stats.documentsSigned + stats.pdfEdits, color: 'bg-emerald-500' },
                { label: 'Tracking & AI', value: stats.qrCodesGenerated + stats.aiScans, color: 'bg-pink-500' },
              ].map((item, i) => {
                const pct = totalActions > 0 ? Math.min(100, Math.round((item.value / totalActions) * 100)) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-[#365874]' : 'text-[#4d7291]'}`}>{item.label}</span>
                      <span className="text-sm font-black">{item.value}</span>
                    </div>
                    <div className={`h-1.5 rounded-full ${isDark ? 'bg-[#062040]' : 'bg-[#eaf2fc]'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className={`rounded-3xl border p-6 flex-1 ${isDark ? 'bg-[#041628] border-[#0e3a72]' : 'bg-white border-[#eaf2fc] shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-[#eaf2fc] dark:bg-[#062040] rounded-xl flex items-center justify-center">
                <Zap size={16} className="text-[#365874]" />
              </div>
              <h3 className="text-base font-black tracking-tight">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(action.tab)}
                  className={`group flex flex-col items-start gap-2 p-3 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${isDark ? 'border-[#0e3a72] hover:border-[#1a5cad] bg-[#062040]/50' : 'border-[#eaf2fc] hover:border-[#c5d8ef] bg-[#f0f6ff]'}`}
                >
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    <action.icon size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black leading-tight">{action.label}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isDark ? 'text-[#224260]' : 'text-[#4d7291]'}`}>{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom banner */}
      <div
        onClick={() => onNavigate('landing')}
        className="cursor-pointer group relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex items-center justify-between"
      >
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
        <div className="relative flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="font-black text-white text-base">Unlock unlimited stamps & features</p>
            <p className="text-white/70 text-sm font-medium">Upgrade to Professional — KES 2,499/month</p>
          </div>
        </div>
        <div className="relative flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-xl font-black text-sm group-hover:scale-105 transition-transform shadow-lg">
          View Plans <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
