
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Smile, 
  Paperclip, 
  ThumbsUp, 
  User, 
  ShieldOff, 
  Hash, 
  AtSign, 
  Search, 
  MoreVertical,
  Flag,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Lock,
  EyeOff,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  upvotes: number;
  isAnonymous: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
  avatar?: string;
  role?: string;
}

export default function EnterpriseChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user: 'Sarah Wambui',
      text: 'Great job on the Q1 report everyone! The results are looking fantastic.',
      time: '09:30 AM',
      upvotes: 12,
      isAnonymous: false,
      sentiment: 'positive',
      role: 'Manager'
    },
    {
      id: '2',
      user: 'Anonymous',
      text: 'I think we should reconsider the new office coffee brand. It is quite bitter.',
      time: '10:15 AM',
      upvotes: 5,
      isAnonymous: true,
      sentiment: 'negative'
    },
    {
      id: '3',
      user: 'John Kamau',
      text: 'The server maintenance is scheduled for tonight at 11 PM.',
      time: '11:00 AM',
      upvotes: 2,
      isAnonymous: false,
      sentiment: 'neutral',
      role: 'IT Admin'
    }
  ]);

  const [input, setInput] = useState('');
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);
  const [activeChannel, setActiveChannel] = useState('general');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
    const positiveWords = ['great', 'fantastic', 'good', 'excellent', 'happy', 'love', 'amazing', 'success'];
    const negativeWords = ['bad', 'bitter', 'poor', 'issue', 'problem', 'error', 'fail', 'hate', 'slow'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => { if (lowerText.includes(word)) score++; });
    negativeWords.forEach(word => { if (lowerText.includes(word)) score--; });
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: isAnonymousMode ? 'Anonymous' : 'You',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      upvotes: 0,
      isAnonymous: isAnonymousMode,
      sentiment: analyzeSentiment(input)
    };

    setMessages([...messages, newMessage]);
    setInput('');
  };

  const handleUpvote = (id: string) => {
    setMessages(messages.map(m => m.id === id ? { ...m, upvotes: m.upvotes + 1 } : m));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-[#161b22] dark:bg-[#161b22] rounded-[48px] border border-[#21262d] dark:border-[#30363d] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-8 border-b border-[#21262d] dark:border-[#30363d] flex items-center justify-between bg-[#0d1117]/50 dark:bg-[#21262d]/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#1f6feb] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black">
            <Hash size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tighter capitalize">{activeChannel}</h3>
            <p className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest">Enterprise Communication Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#161b22] dark:bg-[#161b22] px-4 py-2 rounded-xl border border-[#21262d] dark:border-[#30363d]">
            <Search size={16} className="text-[#8b949e]" />
            <input type="text" placeholder="Search messages..." className="bg-transparent border-none outline-none text-xs font-bold w-32" />
          </div>
          <button className="p-3 hover:bg-[#161b22] dark:hover:bg-[#161b22] rounded-xl transition-all text-[#8b949e]"><Palette size={20} /></button>
          <button className="p-3 hover:bg-[#161b22] dark:hover:bg-[#161b22] rounded-xl transition-all text-[#8b949e]"><MoreVertical size={20} /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-[#21262d] dark:border-[#30363d] p-6 space-y-8 hidden lg:block">
          <div>
            <h4 className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest mb-4">Channels</h4>
            <div className="space-y-1">
              {['general', 'legal-ops', 'finance', 'random'].map(channel => (
                <button 
                  key={channel}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeChannel === channel ? 'bg-[#21262d] dark:bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e] hover:bg-[#0d1117] dark:hover:bg-[#21262d]'}`}
                >
                  <Hash size={16} /> {channel}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest mb-4">Direct Messages</h4>
            <div className="space-y-1">
              {['Sarah Wambui', 'John Kamau', 'Legal Bot'].map(user => (
                <button key={user} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold text-[#8b949e] hover:bg-[#0d1117] dark:hover:bg-[#21262d] transition-all">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> {user}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-[#21262d] dark:border-[#30363d]">
            <div className="bg-[#0d1117] dark:bg-[#21262d] p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-[#8b949e]">Sentiment Trend</span>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-[#e6edf3] dark:text-[#8b949e]">Overall Mood: Positive</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#0d1117]/30 dark:bg-[#0d1117]/30">
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.user === 'You' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${msg.isAnonymous ? 'bg-[#21262d]' : 'bg-[#1f6feb]'}`}>
                    {msg.isAnonymous ? <EyeOff size={18} /> : <User size={18} />}
                  </div>
                  <div className={`max-w-[70%] space-y-2 ${msg.user === 'You' ? 'items-end' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white dark:text-white">{msg.user}</span>
                      {msg.role && <span className="text-[8px] font-black uppercase bg-[#21262d] dark:bg-[#21262d] text-[#58a6ff] px-1.5 py-0.5 rounded-md">{msg.role}</span>}
                      <span className="text-[10px] text-[#8b949e] font-medium">{msg.time}</span>
                      {msg.sentiment === 'positive' && <Zap size={12} className="text-amber-500" />}
                    </div>
                    <div className={`p-4 rounded-3xl shadow-sm border ${msg.user === 'You' ? 'bg-[#1f6feb] text-white border-[#1a5cad] rounded-tr-none' : 'bg-[#161b22] dark:bg-[#161b22] border-[#21262d] dark:border-[#30363d] rounded-tl-none'}`}>
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-3 px-2">
                      <button 
                        onClick={() => handleUpvote(msg.id)}
                        className="flex items-center gap-1.5 text-[10px] font-black text-[#8b949e] hover:text-[#58a6ff] transition-all"
                      >
                        <ThumbsUp size={12} /> {msg.upvotes}
                      </button>
                      <button className="text-[10px] font-black text-[#8b949e] hover:text-[#e6edf3] transition-all">Reply</button>
                      <div className={`w-1.5 h-1.5 rounded-full ${msg.sentiment === 'positive' ? 'bg-emerald-500' : msg.sentiment === 'negative' ? 'bg-rose-500' : 'bg-[#aaccf2]'}`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-8 bg-[#161b22] dark:bg-[#161b22] border-t border-[#21262d] dark:border-[#30363d]">
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => setIsAnonymousMode(!isAnonymousMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAnonymousMode ? 'bg-[#161b22] text-white' : 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d]'}`}
              >
                {isAnonymousMode ? <EyeOff size={14} /> : <User size={14} />}
                {isAnonymousMode ? 'Anonymous Active' : 'Go Anonymous'}
              </button>
              <div className="h-4 w-px bg-[#21262d] dark:bg-[#21262d]" />
              <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">
                {isAnonymousMode ? 'Your identity is hidden' : 'Posting as Tinga'}
              </span>
            </div>
            <div className="flex items-center gap-4 bg-[#0d1117] dark:bg-[#21262d] p-2 rounded-[32px] border border-[#21262d] dark:border-[#58a6ff]">
              <button className="p-4 hover:bg-[#161b22] dark:hover:bg-[#161b22] rounded-full transition-all text-[#8b949e]"><Paperclip size={20} /></button>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message or use / for commands..." 
                className="flex-1 bg-transparent border-none outline-none font-bold text-sm px-2"
              />
              <button className="p-4 hover:bg-[#161b22] dark:hover:bg-[#161b22] rounded-full transition-all text-[#8b949e]"><Smile size={20} /></button>
              <button 
                onClick={handleSend}
                className="bg-[#1f6feb] text-white p-4 rounded-full shadow-lg shadow-black hover:scale-110 transition-all active:scale-95"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
