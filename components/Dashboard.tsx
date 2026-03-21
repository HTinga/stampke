import React from 'react';
import {
  DollarSign, Users, FileText, Briefcase, Bell, ArrowUpRight,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Plus, ChevronRight,
  PenTool, FileCheck, Send, Stamp
} from 'lucide-react';
import { motion } from 'motion/react';

type NavTab = string;
interface DashboardProps {
  userName?: string;
  onNavigate: (tab: NavTab) => void;
  theme?: 'light' | 'dark';
}

// Recent activity feed
const ACTIVITY = [
  { icon: Send,         label: 'Invoice sent',       sub: 'Kamau & Associates · KES 45,000', time: '2m ago',  color: 'bg-blue-500' },
  { icon: CheckCircle2, label: 'Document signed',    sub: 'Employment Contract · 3 signers', time: '18m ago', color: 'bg-emerald-500' },
  { icon: Stamp,        label: 'Stamp applied',      sub: 'Helmarc Brands · 12 pages',      time: '1h ago',  color: 'bg-purple-500' },
  { icon: Users,        label: 'New client added',   sub: 'Dr. Amina Hassan',                time: '3h ago',  color: 'bg-orange-500' },
  { icon: FileCheck,    label: 'Payment received',   sub: 'Rift Holdings · KES 120,000',    time: '5h ago',  color: 'bg-emerald-500' },
];

const QUICK_ACTIONS = [
  { emoji: '💰', label: 'Create Invoice',  tab: 'smart-invoice', color: 'from-blue-600/20 to-blue-500/10 border-blue-500/30 hover:border-blue-400' },
  { emoji: '✍️', label: 'Sign Document',   tab: 'esign',         color: 'from-purple-600/20 to-purple-500/10 border-purple-500/30 hover:border-purple-400' },
  { emoji: '🖋️', label: 'Design Stamp',    tab: 'stamp-studio',  color: 'from-pink-600/20 to-pink-500/10 border-pink-500/30 hover:border-pink-400' },
  { emoji: '📄', label: 'Edit PDF',        tab: 'pdf-forge',     color: 'from-orange-600/20 to-orange-500/10 border-orange-500/30 hover:border-orange-400' },
];

const Dashboard: React.FC<DashboardProps> = ({ userName, onNavigate }) => {
  const first = userName?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">{greeting}, {first} 👋</h1>
        <p className="text-[#8b949e] text-sm mt-0.5">Here's what's happening with your business today.</p>
      </div>

      {/* KPI Cards — what a business owner needs in 5 seconds */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Unpaid Invoices', value: 'KES 284,000', sub: '6 invoices pending',    icon: DollarSign,  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',      tab: 'smart-invoice' },
          { label: 'Paid This Week',  value: 'KES 120,000', sub: '3 payments received',   icon: TrendingUp,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', tab: 'smart-invoice' },
          { label: 'Active Clients',  value: '24',          sub: '3 new this month',       icon: Users,       color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',    tab: 'social-hub' },
          { label: 'Pending Docs',    value: '7',           sub: '2 awaiting signature',   icon: FileText,    color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20', tab: 'esign' },
        ].map((card, i) => (
          <motion.button key={i} onClick={() => onNavigate(card.tab)}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`${card.bg} border rounded-2xl p-5 text-left hover:scale-[1.02] transition-all active:scale-[0.98] group`}>
            <div className="flex items-start justify-between mb-3">
              <card.icon size={20} className={card.color} />
              <ArrowUpRight size={14} className="text-[#8b949e] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xl font-bold text-white leading-tight">{card.value}</p>
            <p className="text-xs text-[#8b949e] mt-1">{card.label}</p>
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
            {QUICK_ACTIONS.map((a, i) => (
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
            <button onClick={() => onNavigate('dashboard')} className="text-[10px] text-[#58a6ff] hover:underline flex items-center gap-0.5">View all <ChevronRight size={10} /></button>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
            {ACTIVITY.map((item, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < ACTIVITY.length - 1 ? 'border-b border-[#21262d]' : ''} hover:bg-[#21262d]/50 transition-colors`}>
                <div className={`w-8 h-8 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <item.icon size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{item.label}</p>
                  <p className="text-[11px] text-[#8b949e] truncate">{item.sub}</p>
                </div>
                <span className="text-[10px] text-[#8b949e] flex-shrink-0 flex items-center gap-1"><Clock size={9} /> {item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Work summary */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Active Work</h2>
          <button onClick={() => onNavigate('qr-tracker')} className="text-[10px] text-[#58a6ff] hover:underline flex items-center gap-0.5">Manage <ChevronRight size={10} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Active Jobs',     value: '4',  icon: Briefcase,   color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
            { label: 'Workers On Site', value: '11', icon: Users,        color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Completed Today', value: '2',  icon: CheckCircle2, color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} border rounded-2xl p-5 flex items-center gap-4`}>
              <s.icon size={22} className={s.color} />
              <div>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-[#8b949e]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-[#1f6feb]" />
          <h2 className="text-sm font-bold text-white">Needs Attention</h2>
        </div>
        <div className="space-y-3">
          {[
            { msg: '2 invoices are 14+ days overdue',   action: 'View Unpaid',  tab: 'smart-invoice', urgent: true },
            { msg: 'Employment contract pending signature from 3 parties', action: 'Review',      tab: 'esign',         urgent: false },
            { msg: 'Worker QR codes expiring in 3 days', action: 'Renew',       tab: 'qr-tracker',   urgent: false },
          ].map((alert, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className={alert.urgent ? 'text-red-400' : 'text-yellow-400'} />
                <span className="text-sm text-[#e6edf3]">{alert.msg}</span>
              </div>
              <button onClick={() => onNavigate(alert.tab)} className="text-[11px] text-[#58a6ff] hover:underline flex-shrink-0">{alert.action}</button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
