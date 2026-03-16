
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
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Hash size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tighter capitalize">{activeChannel}</h3>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Enterprise Communication Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search messages..." className="bg-transparent border-none outline-none text-xs font-bold w-32" />
          </div>
          <button className="p-3 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all text-slate-400"><Palette size={20} /></button>
          <button className="p-3 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all text-slate-400"><MoreVertical size={20} /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-100 dark:border-slate-800 p-6 space-y-8 hidden lg:block">
          <div>
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Channels</h4>
            <div className="space-y-1">
              {['general', 'legal-ops', 'finance', 'random'].map(channel => (
                <button 
                  key={channel}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeChannel === channel ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <Hash size={16} /> {channel}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Direct Messages</h4>
            <div className="space-y-1">
              {['Sarah Wambui', 'John Kamau', 'Legal Bot'].map(user => (
                <button key={user} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> {user}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Sentiment Trend</span>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Overall Mood: Positive</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950/30">
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.user === 'You' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${msg.isAnonymous ? 'bg-slate-800' : 'bg-blue-600'}`}>
                    {msg.isAnonymous ? <EyeOff size={18} /> : <User size={18} />}
                  </div>
                  <div className={`max-w-[70%] space-y-2 ${msg.user === 'You' ? 'items-end' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">{msg.user}</span>
                      {msg.role && <span className="text-[8px] font-black uppercase bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded-md">{msg.role}</span>}
                      <span className="text-[10px] text-slate-400 font-medium">{msg.time}</span>
                      {msg.sentiment === 'positive' && <Zap size={12} className="text-amber-500" />}
                    </div>
                    <div className={`p-4 rounded-3xl shadow-sm border ${msg.user === 'You' ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-tl-none'}`}>
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-3 px-2">
                      <button 
                        onClick={() => handleUpvote(msg.id)}
                        className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all"
                      >
                        <ThumbsUp size={12} /> {msg.upvotes}
                      </button>
                      <button className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all">Reply</button>
                      <div className={`w-1.5 h-1.5 rounded-full ${msg.sentiment === 'positive' ? 'bg-emerald-500' : msg.sentiment === 'negative' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => setIsAnonymousMode(!isAnonymousMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAnonymousMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {isAnonymousMode ? <EyeOff size={14} /> : <User size={14} />}
                {isAnonymousMode ? 'Anonymous Active' : 'Go Anonymous'}
              </button>
              <div className="h-4 w-px bg-slate-100 dark:bg-slate-800" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {isAnonymousMode ? 'Your identity is hidden' : 'Posting as Tinga'}
              </span>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-[32px] border border-slate-100 dark:border-slate-700">
              <button className="p-4 hover:bg-white dark:hover:bg-slate-900 rounded-full transition-all text-slate-400"><Paperclip size={20} /></button>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message or use / for commands..." 
                className="flex-1 bg-transparent border-none outline-none font-bold text-sm px-2"
              />
              <button className="p-4 hover:bg-white dark:hover:bg-slate-900 rounded-full transition-all text-slate-400"><Smile size={20} /></button>
              <button 
                onClick={handleSend}
                className="bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-200 hover:scale-110 transition-all active:scale-95"
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
