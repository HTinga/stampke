import React from 'react';
import { 
  LayoutDashboard, 
  Mic, 
  Settings, 
  Library, 
  History, 
  Sparkles,
  Search,
  Plus,
  HelpCircle,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  activeView: string;
  onViewChange: (view: 'list' | 'recording' | 'settings') => void;
  onNewMeeting: () => void;
}

export default function MeetilySidebar({ activeView, onViewChange, onNewMeeting }: Props) {
  const menuItems = [
    { id: 'list', label: 'Meetings', icon: Library },
    { id: 'recording', label: 'New Recording', icon: Mic, primary: true },
    { id: 'history', label: 'Recent Activity', icon: History },
    { id: 'analytics', label: 'AI Analytics', icon: Sparkles },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Docs', icon: HelpCircle },
  ];

  return (
    <div className="w-64 h-full bg-[#0d1117] border-r border-[#30363d] flex flex-col p-4 font-inter">
      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" size={16} />
        <input 
          type="text" 
          placeholder="Global Search..."
          className="w-full bg-[#161b22] border border-[#30363d] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-violet-500/50 outline-none transition-all"
        />
      </div>

      {/* Primary Actions */}
      <div className="space-y-1 flex-1">
        <p className="px-3 text-[10px] font-black text-[#484f58] uppercase tracking-[0.2em] mb-4">Workspace</p>
        
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'recording') onNewMeeting();
              else onViewChange(item.id as any);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${
              activeView === item.id 
                ? 'bg-violet-600/10 text-violet-400' 
                : 'text-[#8b949e] hover:bg-[#161b22] hover:text-white'
            }`}
          >
            <item.icon size={18} className={activeView === item.id ? 'text-violet-400' : 'group-hover:text-violet-400 transition-colors'} />
            {item.label}
            {item.primary && <Plus size={14} className="ml-auto text-violet-500" />}
          </button>
        ))}
      </div>

      {/* Storage Stats */}
      <div className="mb-8 p-4 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 border border-violet-500/10 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-wider">Cloud Storage</span>
          <Database size={12} className="text-violet-400" />
        </div>
        <div className="h-1.5 w-full bg-[#21262d] rounded-full overflow-hidden mb-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '42%' }}
            className="h-full bg-gradient-to-r from-violet-600 to-indigo-500"
          />
        </div>
        <p className="text-[10px] text-[#484f58] font-bold">2.1 GB of 5 GB used</p>
      </div>

      {/* Bottom Menu */}
      <div className="space-y-1">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as any)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-[#8b949e] hover:bg-[#161b22] hover:text-white transition-all group"
          >
            <item.icon size={18} className="group-hover:text-violet-400 transition-colors" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
