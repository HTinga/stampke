
import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Bell, 
  Search, 
  Star, 
  Trash2, 
  Archive, 
  Send, 
  MoreVertical, 
  Share2, 
  MessageSquare, 
  ArrowLeft,
  User,
  Clock,
  CheckCircle2,
  Paperclip,
  ExternalLink,
  Users,
  Briefcase,
  CheckSquare,
  TrendingUp,
  Hash,
  AtSign,
  Plus,
  SendHorizontal,
  Shield,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  isRead: boolean;
  isStarred: boolean;
  category: 'Inbox' | 'Notifications' | 'Sent' | 'Archive' | 'Tasks' | 'Chat';
  content: string;
  attachments?: string[];
  tags?: string[];
  priority?: 'Low' | 'Medium' | 'High';
  status?: 'Pending' | 'In Progress' | 'Completed' | 'Awaiting Approval';
  assignedTo?: string;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  avatar?: string;
}

export default function CommunicationCenter() {
  const [activeCategory, setActiveCategory] = useState<'Inbox' | 'Notifications' | 'Sent' | 'Archive' | 'Tasks' | 'Chat'>('Inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [userRole, setUserRole] = useState<'Admin' | 'Manager' | 'Employee'>('Manager');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Legal Department',
      subject: 'Quarterly Compliance Report Ready',
      preview: 'The Q1 compliance report has been generated and is ready for your signature...',
      time: '10:45 AM',
      isRead: false,
      isStarred: true,
      category: 'Inbox',
      content: 'Dear Counsel,\n\nThe quarterly compliance report for Q1 2026 has been finalized. Please review the attached document and apply your digital stamp and signature through the Sign Center.\n\nBest regards,\nCompliance Team',
      attachments: ['Q1_Compliance_Report.pdf'],
      tags: ['@Legal', '@Compliance']
    },
    {
      id: 't1',
      sender: 'Operations Director',
      subject: 'Assign: Review Q2 Projections',
      preview: 'Please review the attached projections and approve by EOD.',
      time: '9:00 AM',
      isRead: false,
      isStarred: false,
      category: 'Tasks',
      content: 'I have assigned you the task of reviewing the Q2 financial projections. We need these approved before the board meeting tomorrow.',
      status: 'In Progress',
      priority: 'High',
      assignedTo: 'You',
      tags: ['@Finance', '@Board']
    },
    {
      id: 't2',
      sender: 'HR Manager',
      subject: 'Approval: New Hire Onboarding',
      preview: 'Awaiting your final approval for the new engineering lead.',
      time: 'Yesterday',
      isRead: true,
      isStarred: false,
      category: 'Tasks',
      content: 'The onboarding documents for the new Engineering Lead are ready. Please provide your final approval stamp.',
      status: 'Awaiting Approval',
      priority: 'Medium',
      assignedTo: 'You',
      tags: ['@HR', '@Engineering']
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'c1', user: 'Sarah (Legal)', text: 'Has anyone seen the latest draft of the Acme contract?', time: '11:00 AM' },
    { id: 'c2', user: 'Mike (Finance)', text: 'I just uploaded it to the Doc Architect. @Sarah check it out.', time: '11:05 AM' },
    { id: 'c3', user: 'You', text: 'Thanks Mike. I will review it now.', time: '11:10 AM' },
  ]);

  const filteredMessages = messages.filter(m => 
    m.category === activeCategory && 
    (m.sender.toLowerCase().includes(searchQuery.toLowerCase()) || 
     m.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      user: 'You',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages([...chatMessages, newMsg]);
    setChatInput('');
  };

  const updateTaskStatus = (id: string, status: Message['status']) => {
    setMessages(messages.map(m => m.id === id ? { ...m, status } : m));
  };

  return (
    <div className="max-w-7xl mx-auto h-[850px] flex bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-50 dark:border-slate-800 p-8 flex flex-col bg-slate-50/30 dark:bg-slate-900/50">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black tracking-tighter">Comm <span className="text-blue-600">Hub</span></h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Shield size={12} /> {userRole}
          </div>
        </div>
        
        <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4">Communication</p>
          {[
            { id: 'Inbox', icon: Mail, label: 'Inbox', count: messages.filter(m => m.category === 'Inbox' && !m.isRead).length },
            { id: 'Chat', icon: MessageSquare, label: 'Local Slack', count: 0 },
            { id: 'Notifications', icon: Bell, label: 'Alerts', count: messages.filter(m => m.category === 'Notifications' && !m.isRead).length },
          ].map((item) => (
            <SidebarButton 
              key={item.id}
              active={activeCategory === item.id}
              icon={item.icon}
              label={item.label}
              count={item.count}
              onClick={() => { setActiveCategory(item.id as any); setSelectedMessage(null); }}
            />
          ))}

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-8 mb-4 ml-4">Workspace</p>
          {[
            { id: 'Tasks', icon: CheckSquare, label: 'Duty Board', count: messages.filter(m => m.category === 'Tasks' && m.status !== 'Completed').length },
            { id: 'Sent', icon: Send, label: 'Sent Items', count: 0 },
            { id: 'Archive', icon: Archive, label: 'Archive', count: 0 },
          ].map((item) => (
            <SidebarButton 
              key={item.id}
              active={activeCategory === item.id}
              icon={item.icon}
              label={item.label}
              count={item.count}
              onClick={() => { setActiveCategory(item.id as any); setSelectedMessage(null); }}
            />
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">T</div>
              <div>
                <p className="text-sm font-black">Tinga</p>
                <p className="text-[10px] text-slate-400 font-bold">tinga@company.ke</p>
              </div>
            </div>
            <button className="w-full py-2 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
              Switch Role
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        <AnimatePresence mode="wait">
          {activeCategory === 'Chat' ? (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Hash size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">#general-workspace</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Local Slack for FreeStamps KE</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 flex items-center justify-center text-[10px] font-black">U{i}</div>
                    ))}
                  </div>
                  <button className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400">
                    <Users size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.user === 'You' ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs">
                      {msg.user.charAt(0)}
                    </div>
                    <div className={`max-w-[70%] ${msg.user === 'You' ? 'items-end' : ''} flex flex-col gap-1`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">{msg.user}</span>
                        <span className="text-[10px] font-bold text-slate-400">{msg.time}</span>
                      </div>
                      <div className={`p-4 rounded-[24px] text-sm font-medium ${msg.user === 'You' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 border-t border-slate-50 dark:border-slate-800">
                <form onSubmit={handleSendMessage} className="relative">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Message #general-workspace..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-5 pl-6 pr-16 outline-none font-bold focus:ring-4 focus:ring-blue-500/10"
                  />
                  <button 
                    type="submit"
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    <SendHorizontal size={20} />
                  </button>
                </form>
              </div>
            </motion.div>
          ) : !selectedMessage ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col"
            >
              {/* Search Bar */}
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder={`Search ${activeCategory.toLowerCase()}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-6 outline-none font-bold"
                  />
                </div>
                <button className="ml-4 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
                  <Plus size={18} /> New {activeCategory === 'Tasks' ? 'Duty' : 'Message'}
                </button>
              </div>

              {/* Message/Task List */}
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                {filteredMessages.length > 0 ? filteredMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full p-8 rounded-[40px] text-left transition-all border group ${
                      msg.isRead 
                        ? 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800' 
                        : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 ring-1 ring-blue-100 dark:ring-blue-900/30 shadow-sm'
                    } hover:shadow-2xl hover:-translate-y-1`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${msg.isRead ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'}`}>
                          {msg.sender.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {msg.sender}
                            {!msg.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{msg.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {msg.priority && (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            msg.priority === 'High' ? 'bg-red-50 text-red-600' : 
                            msg.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {msg.priority}
                          </span>
                        )}
                        {msg.status && (
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {msg.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <h5 className="font-black text-xl text-slate-800 dark:text-slate-200 mb-2 tracking-tight">{msg.subject}</h5>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{msg.preview}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {msg.tags?.map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                          <AtSign size={10} /> {tag.replace('@', '')}
                        </span>
                      ))}
                    </div>
                  </button>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[40px] flex items-center justify-center text-slate-300 mb-6">
                      <Archive size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Workspace Empty</h3>
                    <p className="text-slate-500 max-w-xs">No active {activeCategory.toLowerCase()} found in your current workspace.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              {/* Header */}
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedMessage(null)}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{selectedMessage.sender}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedMessage.time}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-3 hover:bg-blue-50 text-blue-600 rounded-2xl transition-all"><Star size={20} /></button>
                  <button className="p-3 hover:bg-emerald-50 text-emerald-600 rounded-2xl transition-all"><Share2 size={20} /></button>
                  <button className="p-3 hover:bg-red-50 text-red-600 rounded-2xl transition-all"><Trash2 size={20} /></button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-blue-600 rounded-[32px] flex items-center justify-center text-white text-2xl font-black shadow-2xl shadow-blue-200">
                        {selectedMessage.sender.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-4xl font-black tracking-tighter mb-2">{selectedMessage.subject}</h2>
                        <div className="flex flex-wrap gap-2">
                          {selectedMessage.tags?.map(tag => (
                            <span key={tag} className="flex items-center gap-1 text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-xl">
                              <AtSign size={12} /> {tag.replace('@', '')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedMessage.category === 'Tasks' && (
                    <div className="grid grid-cols-3 gap-6 mb-12">
                      <TaskStat icon={<TrendingUp size={18} />} label="Priority" value={selectedMessage.priority || 'Medium'} color="text-red-600" bg="bg-red-50" />
                      <TaskStat icon={<UserCheck size={18} />} label="Assigned To" value={selectedMessage.assignedTo || 'Unassigned'} color="text-blue-600" bg="bg-blue-50" />
                      <TaskStat icon={<AlertCircle size={18} />} label="Status" value={selectedMessage.status || 'Pending'} color="text-orange-600" bg="bg-orange-50" />
                    </div>
                  )}
                  
                  <div className="prose dark:prose-invert max-w-none mb-16">
                    <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedMessage.content}
                    </p>
                  </div>

                  {selectedMessage.attachments && (
                    <div className="space-y-6 pt-12 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Workspace Assets</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedMessage.attachments.map((file, i) => (
                          <div key={i} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 group cursor-pointer hover:border-blue-400 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white dark:bg-slate-700 rounded-2xl"><Paperclip size={20} className="text-blue-600" /></div>
                              <span className="font-black text-sm">{file}</span>
                            </div>
                            <ExternalLink size={18} className="text-slate-300 group-hover:text-blue-600" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-8 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-4">
                {selectedMessage.category === 'Tasks' ? (
                  <>
                    <button 
                      onClick={() => updateTaskStatus(selectedMessage.id, 'In Progress')}
                      className="flex-1 bg-blue-600 text-white py-5 rounded-3xl font-black text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200"
                    >
                      Accept Duty
                    </button>
                    <button 
                      onClick={() => updateTaskStatus(selectedMessage.id, 'Completed')}
                      className="flex-1 bg-slate-900 dark:bg-slate-800 text-white py-5 rounded-3xl font-black text-lg hover:opacity-90 transition-all"
                    >
                      Mark Completed
                    </button>
                  </>
                ) : (
                  <>
                    <button className="flex-1 bg-blue-600 text-white py-5 rounded-3xl font-black text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200">
                      Reply Now
                    </button>
                    <button className="flex-1 bg-slate-900 dark:bg-slate-800 text-white py-5 rounded-3xl font-black text-lg hover:opacity-90 transition-all">
                      Forward to Team
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SidebarButton({ active, icon: Icon, label, count, onClick }: { active: boolean, icon: any, label: string, count: number, onClick: () => void, key?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-6 py-4 rounded-[24px] font-black text-sm transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-2xl shadow-blue-200' 
          : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-4">
        <Icon size={20} />
        <span className="tracking-tight">{label}</span>
      </div>
      {count > 0 && (
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${active ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function TaskStat({ icon, label, value, color, bg }: { icon: any, label: string, value: string, color: string, bg: string }) {
  return (
    <div className={`p-6 ${bg} rounded-[32px] border border-white/50`}>
      <div className={`${color} mb-3`}>{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-lg font-black ${color} tracking-tight`}>{value}</p>
    </div>
  );
}
