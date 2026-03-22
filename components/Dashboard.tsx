import React from 'react';
import {
  DollarSign, Users, FileText, Briefcase, Bell, ArrowUpRight,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Plus, ChevronRight,
  PenTool, FileCheck, Send, Stamp, Package
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStats } from '../src/appStatsStore';

type NavTab = string;
interface DashboardProps {
  userName?: string;
  onNavigate: (tab: NavTab) => void;
  theme?: 'light' | 'dark';
}

const Dashboard: React.FC<DashboardProps> = ({ userName, onNavigate }) => {
  const stats = useAppStats();
  const first = userName?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Activity feed built from real app stats
  const recentActivity = stats.recentActivity.slice(0, 6);
  const totalActions = stats.stampsCreated + stats.stampsApplied + stats.documentsSigned + stats.pdfEdits + stats.stampsDownloaded + stats.aiScans + stats.qrCodesGenerated + stats.templatesUsed;

  const kpiCards = [
    {
      label: 'Stamps Created',
      value: stats.stampsCreated,
      sub: stats.stampsCreated === 0 ? 'Design your first stamp' : `${stats.stampsDownloaded} downloaded`,
      icon: PenTool,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      tab: 'stamp-studio',
    },
    {
      label: 'Documents Signed',
      value: stats.documentsSigned,
      sub: stats.documentsSigned === 0 ? 'Upload a doc to sign' : 'via Toho Sign',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      tab: 'esign',
    },
    {
      label: 'PDF Edits',
      value: stats.pdfEdits,
      sub: stats.pdfEdits === 0 ? 'Open PDF Editor' : 'documents edited',
      icon: FileText,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      tab: 'pdf-forge',
    },
    {
      label: 'QR Codes',
      value: stats.qrCodesGenerated,
      sub: stats.qrCodesGenerated === 0 ? 'Track your workers' : 'codes generated',
      icon: Package,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20',
      tab: 'qr-tracker',
    },
  ];

  const quickActions = [
    { emoji: '🖋️', label: 'Design Stamp',    tab: 'stamp-studio',  color: 'from-blue-600/20 to-blue-500/10 border-blue-500/30 hover:border-blue-400' },
    { emoji: '✍️', label: 'Sign Document',   tab: 'esign',          color: 'from-purple-600/20 to-purple-500/10 border-purple-500/30 hover:border-purple-400' },
    { emoji: '📄', label: 'Edit PDF',        tab: 'pdf-forge',      color: 'from-orange-600/20 to-orange-500/10 border-orange-500/30 hover:border-orange-400' },
    { emoji: '💰', label: 'Smart Invoice',   tab: 'smart-invoice',  color: 'from-emerald-600/20 to-emerald-500/10 border-emerald-500/30 hover:border-emerald-400' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">{greeting}, {first} 👋</h1>
        <p className="text-[#8b949e] text-sm mt-0.5">
          {totalActions === 0
            ? "Welcome to StampKE. Start by designing a stamp or uploading a document."
            : `You've completed ${totalActions} action${totalActions !== 1 ? 's' : ''} so far.`}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <motion.button key={i} onClick={() => onNavigate(card.tab)}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`${card.bg} border rounded-2xl p-5 text-left hover:scale-[1.02] transition-all active:scale-[0.98] group`}>
            <div className="flex items-start justify-between mb-3">
              <card.icon size={20} className={card.color} />
              <ArrowUpRight size={14} className="text-[#8b949e] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl font-bold text-white leading-tight">{card.value}</p>
            <p className="text-xs text-[#8b949e] mt-0.5">{card.label}</p>
            <p className="text-[10px] text-[#8b949e]/70 mt-0.5">{card.sub}</p>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Quick Actions</h2>
            <span className="text-[10px] text-[#8b949e]">2 clicks max</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a, i) => (
              <motion.button key={i} onClick={() => onNavigate(a.tab)}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.06 }}
                className={`bg-gradient-to-br ${a.color} border rounded-2xl p-5 text-left hover:scale-[1.03] transition-all active:scale-[0.97]`}>
                <div className="text-2xl mb-3">{a.emoji}</div>
                <p className="text-sm font-semibold text-white">{a.label}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Recent Activity</h2>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-12 h-12 bg-[#21262d] rounded-2xl flex items-center justify-center mb-3">
                  <TrendingUp size={22} className="text-[#8b949e]" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">No activity yet</p>
                <p className="text-xs text-[#8b949e]">Actions you take — stamps created, documents signed, invoices sent — will appear here.</p>
              </div>
            ) : (
              recentActivity.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < recentActivity.length - 1 ? 'border-b border-[#21262d]' : ''} hover:bg-[#21262d]/50 transition-colors`}>
                  <div className="w-8 h-8 bg-[#1f6feb]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={13} className="text-[#1f6feb]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.description}</p>
                    <p className="text-[10px] text-[#8b949e] flex items-center gap-1 mt-0.5">
                      <Clock size={9} /> {new Date(item.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Get Started section — shown when there's no activity */}
      {totalActions === 0 && (
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Get Started</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Design your stamp', desc: 'Create a professional digital stamp for your business', tab: 'stamp-studio', cta: 'Open Stamp Studio', color: 'border-blue-500/30' },
              { step: '2', title: 'Upload & sign a document', desc: 'Collect legally binding e-signatures from clients and partners', tab: 'esign', cta: 'Open Toho Sign', color: 'border-purple-500/30' },
              { step: '3', title: 'Post a work opportunity', desc: 'Find an electrician, driver or errand person in minutes', tab: 'work-find', cta: 'Post a Job', color: 'border-emerald-500/30' },
            ].map((s, i) => (
              <div key={i} className={`bg-[#161b22] border ${s.color} rounded-2xl p-5`}>
                <div className="w-7 h-7 bg-[#1f6feb] rounded-lg flex items-center justify-center text-white text-xs font-bold mb-3">{s.step}</div>
                <h3 className="font-bold text-white text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-[#8b949e] mb-4">{s.desc}</p>
                <button onClick={() => onNavigate(s.tab)} className="text-xs text-[#58a6ff] hover:underline font-semibold flex items-center gap-1">
                  {s.cta} <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats summary — only when there's activity */}
      {totalActions > 0 && (
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Your Usage</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Stamps Applied', value: stats.stampsApplied, color: 'text-blue-400' },
              { label: 'AI Scans', value: stats.aiScans, color: 'text-pink-400' },
              { label: 'Templates Used', value: stats.templatesUsed, color: 'text-yellow-400' },
              { label: 'Total Actions', value: totalActions, color: 'text-[#58a6ff]' },
            ].map((s, i) => (
              <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-[#8b949e] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
