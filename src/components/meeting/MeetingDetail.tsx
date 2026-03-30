import React, { useState } from 'react';
import { 
  ArrowLeft, Calendar, Clock, Sparkles, CheckCircle2, 
  Copy, Download, Share2, Save, Trash2, Edit3, 
  MessageSquare, List, Zap, Quote, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TiptapEditor from '../TiptapEditor';

interface Meeting {
  _id: string;
  title: string;
  date: string;
  duration: string;
  transcript: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  notes?: string;
}

interface Props {
  meeting: Meeting;
  onBack: () => void;
  onSave: (id: string, updates: { title?: string; notes?: string }) => void;
  onDelete: (id: string) => void;
}

export default function MeetingDetail({ meeting, onBack, onSave, onDelete }: Props) {
  const [activeTab, setActiveTab] = useState<'insights' | 'notes'>('insights');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(meeting.title);
  const [editedNotes, setEditedNotes] = useState(meeting.notes || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSave(meeting._id, { title: editedTitle, notes: editedNotes });
    setIsEditingTitle(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] -mx-8 -mb-8 overflow-hidden">
      {/* Detail Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-[#30363d] bg-[#0d1117] relative z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 hover:bg-[#161b22] rounded-2xl text-[#8b949e] hover:text-white transition-all border border-transparent hover:border-[#30363d] group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  className="bg-[#161b22] border border-violet-500/50 rounded-xl px-3 py-0.5 text-lg font-black text-white focus:outline-none"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-lg font-black text-white hover:text-violet-400 cursor-pointer transition-colors flex items-center gap-2 group"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {meeting.title}
                  <Edit3 size={14} className="opacity-0 group-hover:opacity-100 text-[#8b949e]" />
                </h1>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black text-[#484f58] uppercase tracking-[0.2em]">
              <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(meeting.date).toLocaleDateString()}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-violet-400"><Clock size={10} /> {meeting.duration}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-500"><Zap size={10} /> AI Summary Complete</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <div className="hidden md:flex items-center gap-1 bg-[#161b22] p-1 rounded-xl border border-[#30363d] mr-4">
              {[
                { id: 'insights' as const, label: 'Analytics', icon: Sparkles },
                { id: 'notes' as const, label: 'Editor', icon: Edit3 },
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id ? 'bg-violet-600/20 text-violet-400 border border-violet-500/20' : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
           </div>
           
           <button className="p-2.5 bg-[#161b22] border border-[#30363d] rounded-xl text-[#8b949e] hover:text-white transition-all">
             <Download size={18} />
           </button>
           <button className="p-2.5 bg-[#161b22] border border-[#30363d] rounded-xl text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-all" onClick={() => onDelete(meeting._id)}>
             <Trash2 size={18} />
           </button>
           <button 
             onClick={handleSave}
             className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-xs font-black text-white shadow-lg shadow-violet-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
           >
             <Save size={16} /> Update Record
           </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 divide-x divide-[#30363d]">
        {/* Left Side: Transcript (Scrolling) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#0d1117] h-full">
           <div className="max-w-2xl mx-auto space-y-10">
              <div className="flex items-center justify-between pb-4 border-b border-[#161b22]">
                 <h2 className="text-xs font-black text-[#58a6ff] uppercase tracking-[0.2em] flex items-center gap-2">
                    <MessageSquare size={14} /> Full Conversation Log
                 </h2>
                 <button onClick={() => handleCopy(meeting.transcript)} className="text-[10px] font-black text-[#8b949e] hover:text-white transition-colors">
                    {copied ? 'Copied' : 'Copy Plain Text'}
                 </button>
              </div>

              <div className="space-y-12">
                {meeting.transcript.split('\n').filter(l => l.trim()).map((line, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-[#21262d] to-[#0d1117] border border-[#30363d] flex items-center justify-center text-violet-400 group-hover:border-violet-500/40 transition-all">
                      <User size={20} />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">Speaker {i % 2 === 0 ? 'A' : 'B'}</span>
                         <span className="text-[10px] font-black text-[#484f58] uppercase tracking-widest tabular-nums">{Math.floor(i * 1.5)}:{(i * 30) % 60 === 0 ? '00' : '30'}</span>
                      </div>
                      <p className="text-[#8b949e] group-hover:text-[#e6edf3] transition-colors leading-[1.8] text-sm font-medium tracking-wide">
                        {line.replace(/^Speaker \d+: /i, '')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Right Side: Insights & Editor (Scrolling) */}
        <div className="w-[480px] overflow-y-auto custom-scrollbar bg-[#161b22] h-full relative">
           <div className="p-8 space-y-8">
              <AnimatePresence mode="wait">
                {activeTab === 'insights' ? (
                  <motion.div 
                    key="insights" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="bg-[#0d1117] border border-[#30363d] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleCopy(meeting.summary)} className="p-2 hover:bg-[#161b22] rounded-xl text-[#8b949e]">
                           <Copy size={16} />
                         </button>
                      </div>
                      <h3 className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                         <Quote size={18} className="fill-violet-400/20" /> Executive Overview
                      </h3>
                      <p className="text-[#e6edf3] leading-[1.8] text-sm font-medium">
                        {meeting.summary}
                      </p>
                      <div className="absolute bottom-0 right-0 w-24 h-24 bg-violet-600/5 blur-[40px] rounded-full translate-x-1/2 translate-y-1/2" />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2 leading-none">
                         <CheckCircle2 size={16} /> Decisive Action Items
                      </h4>
                      <div className="space-y-2">
                        {meeting.actionItems.map((item, i) => (
                          <div key={i} className="flex gap-4 p-4 bg-[#0d1117]/50 border border-[#30363d] rounded-2xl hover:border-emerald-500/30 transition-all group">
                             <div className="mt-1 w-5 h-5 rounded-lg border-2 border-[#30363d] group-hover:border-emerald-500 flex items-center justify-center flex-shrink-0 transition-colors">
                                <CheckCircle2 size={12} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                             </div>
                             <span className="text-xs text-[#8b949e] group-hover:text-[#e6edf3] leading-relaxed transition-colors">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[#30363d]">
                      <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2 leading-none">
                         <Sparkles size={16} /> AI Generated Key Points
                      </h4>
                      <ul className="space-y-3 px-2">
                        {meeting.keyPoints.map((point, i) => (
                          <li key={i} className="flex gap-3 text-xs text-[#8b949e] leading-snug">
                             <span className="text-amber-500">•</span>
                             {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="notes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                     <div className="mb-6 px-1">
                        <h3 className="text-sm font-black text-white mb-2">Smart Context Editor</h3>
                        <p className="text-[10px] font-bold text-[#484f58] uppercase tracking-widest leading-relaxed">
                          Your private notes are stored securely and encrypted. <br/> Integrated with meeting context.
                        </p>
                     </div>
                     <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-[2rem] p-4 min-h-[500px]">
                        <TiptapEditor content={editedNotes} onChange={setEditedNotes} />
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
}
