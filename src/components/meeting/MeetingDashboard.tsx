import React from 'react';
import { Calendar, Clock, ChevronRight, FileText, Trash2, Search, Plus, Sparkles, Filter, User } from 'lucide-react';
import { motion } from 'motion/react';

interface Meeting {
  _id: string;
  title: string;
  date: string;
  duration: string;
  summary: string;
}

interface Props {
  meetings: Meeting[];
  onSelect: (m: Meeting) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export default function MeetingDashboard({ meetings, onSelect, onDelete, onNew }: Props) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filtered = meetings.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Meetings', value: meetings.length, icon: FileText, color: 'text-blue-400' },
          { label: 'Recording Time', value: '12h 45m', icon: Clock, color: 'text-violet-400' },
          { label: 'AI Insights', value: meetings.length * 3, icon: Sparkles, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 relative overflow-hidden group">
            <div className="relative z-10 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-white">{stat.value}</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-700" />
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pt-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" size={18} />
          <input
            type="text"
            placeholder="Search meetings, summaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#161b22] border border-[#30363d] rounded-xl text-sm text-white focus:border-violet-500/50 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
           <button className="p-2.5 bg-[#161b22] border border-[#30363d] rounded-xl text-[#8b949e] hover:text-white transition-all">
             <Filter size={18} />
           </button>
           <button
            onClick={onNew}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all"
          >
            <Plus size={18} />
            Quick Record
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#161b22] border border-dashed border-[#30363d] rounded-3xl py-24 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-600/20 to-transparent rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="text-violet-400" size={32} />
          </div>
          <h3 className="text-white font-black text-xl mb-2">No meetings found</h3>
          <p className="text-[#8b949e] text-sm max-w-xs mx-auto">Capture your first meeting to unlock automated AI insights and summaries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((meeting) => (
            <motion.div
              key={meeting._id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -6, borderColor: 'rgba(139, 92, 246, 0.4)' }}
              onClick={() => onSelect(meeting)}
              className="group bg-[#161b22] border border-[#30363d] rounded-3xl p-6 cursor-pointer transition-all relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(meeting._id); }}
                  className="p-2 hover:bg-red-500/20 text-[#8b949e] hover:text-red-400 rounded-xl transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600/20 to-indigo-600/10 rounded-xl flex items-center justify-center text-violet-400 border border-violet-500/20">
                  <FileText size={18} />
                </div>
                <div className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest bg-[#0d1117] px-2 py-1 rounded-lg border border-[#30363d]">
                  {meeting.duration}
                </div>
              </div>

              <h4 className="text-white font-black text-base mb-2 group-hover:text-violet-400 transition-colors line-clamp-1 leading-snug">
                {meeting.title}
              </h4>
              <p className="text-[#8b949e] text-xs leading-relaxed line-clamp-3 mb-6">
                {meeting.summary || "Generating summary insights..."}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[#30363d]">
                <div className="flex items-center gap-2">
                   <Calendar size={12} className="text-[#8b949e]" />
                   <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-tight">
                    {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                   </span>
                </div>
                <div className="flex -space-x-2">
                   {[1,2].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-[#161b22] bg-[#30363d] flex items-center justify-center text-[8px] font-bold text-white"><User size={10} /></div>)}
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
