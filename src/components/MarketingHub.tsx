
import React, { useState } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Share2, 
  Users, 
  Send, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  TrendingUp,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Globe,
  Zap,
  LayoutGrid,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SocialPost {
  id: string;
  platform: 'Instagram' | 'Twitter' | 'LinkedIn' | 'Facebook';
  content: string;
  status: 'Scheduled' | 'Published' | 'Draft';
  date: string;
  engagement?: string;
}

export default function MarketingHub() {
  const [activeTab, setActiveTab] = useState<'sms' | 'email' | 'calls' | 'social'>('sms');
  const [smsTemplate, setSmsTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const socialPosts: SocialPost[] = [
    { id: '1', platform: 'LinkedIn', content: 'Excited to announce our new legal tech partnership! #LegalTech #Innovation', status: 'Published', date: '2h ago', engagement: '1.2k reach' },
    { id: '2', platform: 'Twitter', content: 'New blog post: Digital Signatures in Kenya. Read more on our portal! 🇰🇪', status: 'Scheduled', date: 'Today, 4 PM' },
    { id: '3', platform: 'Instagram', content: 'Behind the scenes at JijiTechy Innovations. 🚀', status: 'Draft', date: 'Mar 18' },
  ];

  const renderSMS = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-[#161b22] dark:bg-[#161b22] p-10 rounded-[56px] border border-[#21262d] dark:border-[#30363d] shadow-sm">
        <h3 className="text-2xl font-black tracking-tight mb-8">Bulk SMS Campaign</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest">Recipient Group</label>
              <select className="w-full p-4 bg-[#0d1117] dark:bg-[#21262d] rounded-2xl border border-[#21262d] dark:border-[#58a6ff] font-bold text-sm outline-none focus:border-[#58a6ff] transition-all">
                <option>All Clients (1,240)</option>
                <option>Active Leads (450)</option>
                <option>Advocates Network (89)</option>
                <option>Custom List...</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest">Sender ID</label>
              <input type="text" defaultValue="SAHIHI_KE" className="w-full p-4 bg-[#0d1117] dark:bg-[#21262d] rounded-2xl border border-[#21262d] dark:border-[#58a6ff] font-bold text-sm outline-none focus:border-[#58a6ff] transition-all" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest">Message Content</label>
            <textarea 
              rows={4}
              value={smsTemplate}
              onChange={(e) => setSmsTemplate(e.target.value)}
              placeholder="Enter your SMS message here..."
              className="w-full p-6 bg-[#0d1117] dark:bg-[#21262d] rounded-[32px] border border-[#21262d] dark:border-[#58a6ff] font-bold text-sm outline-none focus:border-[#58a6ff] transition-all resize-none"
            />
            <div className="flex justify-between text-[10px] font-black text-[#8b949e] uppercase">
              <span>{smsTemplate.length} / 160 characters</span>
              <span>1 SMS Unit</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="flex-1 bg-[#1f6feb] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-[#30363d] transition-all shadow-lg shadow-[#c5d8ef]">
              <Send size={18} /> Send Campaign
            </button>
            <button className="px-8 py-4 bg-[#21262d] dark:bg-[#21262d] text-[#e6edf3] dark:text-[#8b949e] rounded-2xl font-black text-sm hover:bg-[#30363d] transition-all">
              Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#161b22] dark:bg-[#161b22] p-10 rounded-[56px] border border-[#21262d] dark:border-[#30363d] shadow-sm">
        <h3 className="text-xl font-black mb-6">Recent SMS Campaigns</h3>
        <div className="space-y-4">
          {[
            { name: 'Q1 Promo', sent: '1,240', status: 'Delivered', date: 'Mar 15' },
            { name: 'System Update', sent: '890', status: 'Delivered', date: 'Mar 10' },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between p-6 bg-[#0d1117] dark:bg-[#21262d] rounded-3xl border border-[#21262d] dark:border-[#58a6ff]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#21262d] text-[#58a6ff] rounded-xl flex items-center justify-center"><Smartphone size={20} /></div>
                <div>
                  <p className="text-sm font-bold">{c.name}</p>
                  <p className="text-[10px] text-[#8b949e] font-black uppercase">{c.sent} Recipients • {c.date}</p>
                </div>
              </div>
              <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">{c.status}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderEmail = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-[#161b22] dark:bg-[#161b22] p-10 rounded-[56px] border border-[#21262d] dark:border-[#30363d] shadow-sm">
        <h3 className="text-2xl font-black tracking-tight mb-8">Bulk Email Broadcaster</h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest">Subject Line</label>
            <input 
              type="text" 
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full p-4 bg-[#0d1117] dark:bg-[#21262d] rounded-2xl border border-[#21262d] dark:border-[#58a6ff] font-bold text-sm outline-none focus:border-[#58a6ff] transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest">Email Body (HTML Supported)</label>
            <textarea 
              rows={8}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Compose your email..."
              className="w-full p-6 bg-[#0d1117] dark:bg-[#21262d] rounded-[32px] border border-[#21262d] dark:border-[#58a6ff] font-bold text-sm outline-none focus:border-[#58a6ff] transition-all resize-none"
            />
          </div>
          <div className="flex gap-4">
            <button className="flex-1 bg-[#1f6feb] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-[#30363d] transition-all shadow-lg shadow-[#c5d8ef]">
              <Mail size={18} /> Blast Email
            </button>
            <button className="px-8 py-4 bg-[#21262d] dark:bg-[#21262d] text-[#e6edf3] dark:text-[#8b949e] rounded-2xl font-black text-sm hover:bg-[#30363d] transition-all">
              Save Template
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSocial = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-[#161b22] dark:bg-[#161b22] p-10 rounded-[56px] border border-[#21262d] dark:border-[#30363d] shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black tracking-tight">Unified Social Feed</h3>
              <button className="bg-[#1f6feb] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#30363d] transition-all">
                <Plus size={16} /> Create Post
              </button>
            </div>
            <div className="space-y-6">
              {socialPosts.map(post => (
                <div key={post.id} className="p-8 bg-[#0d1117] dark:bg-[#21262d] rounded-[40px] border border-[#21262d] dark:border-[#58a6ff] group hover:border-[#aaccf2] transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                        post.platform === 'LinkedIn' ? 'bg-[#0077b5]' : 
                        post.platform === 'Twitter' ? 'bg-[#1da1f2]' : 
                        post.platform === 'Instagram' ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' : 
                        'bg-[#1877f2]'
                      }`}>
                        {post.platform === 'LinkedIn' && <Linkedin size={24} />}
                        {post.platform === 'Twitter' && <Twitter size={24} />}
                        {post.platform === 'Instagram' && <Instagram size={24} />}
                        {post.platform === 'Facebook' && <Facebook size={24} />}
                      </div>
                      <div>
                        <h4 className="font-black text-white dark:text-white">{post.platform}</h4>
                        <p className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest">{post.date}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      post.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 
                      post.status === 'Scheduled' ? 'bg-[#d4e6f9] text-blue-700' : 
                      'bg-[#30363d] text-[#8b949e]'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#e6edf3] dark:text-[#8b949e] leading-relaxed mb-6">{post.content}</p>
                  {post.engagement && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-[#58a6ff] uppercase tracking-widest">
                      <TrendingUp size={14} /> {post.engagement}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#161b22] text-white p-10 rounded-[56px] shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-black mb-6 relative z-10">Connected Accounts</h3>
            <div className="space-y-4 relative z-10">
              {[
                { name: 'LinkedIn', icon: Linkedin, status: 'Connected', color: 'text-blue-400' },
                { name: 'Twitter', icon: Twitter, status: 'Connected', color: 'text-blue-300' },
                { name: 'Instagram', icon: Instagram, status: 'Connected', color: 'text-pink-400' },
                { name: 'Facebook', icon: Facebook, status: 'Disconnected', color: 'text-[#8b949e]' },
              ].map((acc, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[#161b22]/10 backdrop-blur-md rounded-2xl border border-[#30363d]/10">
                  <div className="flex items-center gap-3">
                    <acc.icon size={18} className={acc.color} />
                    <span className="text-xs font-bold">{acc.name}</span>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${acc.status === 'Connected' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {acc.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#1f6feb]/10 rounded-full blur-3xl" />
          </div>

          <div className="bg-[#161b22] dark:bg-[#161b22] p-10 rounded-[56px] border border-[#21262d] dark:border-[#30363d] shadow-sm">
            <h3 className="text-xl font-black mb-6">Marketing Insights</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#21262d] text-[#58a6ff] rounded-xl flex items-center justify-center"><Users size={20} /></div>
                  <div>
                    <p className="text-xs font-bold">Total Reach</p>
                    <p className="text-[10px] text-[#8b949e] font-black uppercase">+12% this month</p>
                  </div>
                </div>
                <span className="text-lg font-black">45.2k</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Zap size={20} /></div>
                  <div>
                    <p className="text-xs font-bold">Engagement</p>
                    <p className="text-[10px] text-[#8b949e] font-black uppercase">+5% this month</p>
                  </div>
                </div>
                <span className="text-lg font-black">8.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderCalls = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      <div className="lg:col-span-4">
        <div className="bg-[#161b22] dark:bg-[#161b22] p-10 rounded-[56px] border border-[#21262d] dark:border-[#30363d] shadow-sm">
          <h3 className="text-2xl font-black tracking-tight mb-8">Smart Dialer</h3>
          <div className="bg-[#0d1117] dark:bg-[#21262d] p-8 rounded-[40px] mb-8">
            <input type="text" placeholder="Enter number..." className="w-full bg-transparent text-3xl font-black tracking-tighter text-center outline-none mb-8" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map(n => (
                <button key={n} className="w-16 h-16 bg-[#161b22] dark:bg-[#161b22] rounded-2xl flex items-center justify-center text-xl font-black hover:bg-[#1f6feb] hover:text-white transition-all shadow-sm">
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button className="w-full bg-emerald-500 text-white py-5 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all">
            <Phone size={24} /> Start Call
          </button>
        </div>
      </div>

      <div className="lg:col-span-8">
        <div className="bg-[#161b22] dark:bg-[#161b22] p-10 rounded-[56px] border border-[#21262d] dark:border-[#30363d] shadow-sm h-full">
          <h3 className="text-2xl font-black tracking-tight mb-8">Call History & CRM</h3>
          <div className="space-y-4">
            {[
              { name: 'John Kamau', type: 'Outgoing', duration: '5:24', time: '10:30 AM', status: 'Completed' },
              { name: 'Sarah Wambui', type: 'Incoming', duration: '2:15', time: '09:15 AM', status: 'Missed' },
              { name: 'Legal Consult', type: 'Outgoing', duration: '12:45', time: 'Yesterday', status: 'Completed' },
            ].map((call, i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-[#0d1117] dark:bg-[#21262d] rounded-3xl border border-[#21262d] dark:border-[#58a6ff]">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${call.status === 'Missed' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{call.name}</p>
                    <p className="text-[10px] text-[#8b949e] font-black uppercase">{call.type} • {call.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{call.duration}</p>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${call.status === 'Missed' ? 'text-rose-600' : 'text-emerald-600'}`}>{call.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">Marketing & Comm Hub</h2>
          <p className="text-[#8b949e] font-medium">Manage bulk communications and social media from one central command center.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-6 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">SMS Credits: 4,500</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#21262d] dark:bg-[#21262d] p-1.5 rounded-2xl w-fit">
        {[
          { id: 'sms', label: 'Bulk SMS', icon: MessageSquare },
          { id: 'email', label: 'Bulk Email', icon: Mail },
          { id: 'calls', label: 'Phone Dialer', icon: Phone },
          { id: 'social', label: 'Social Media', icon: Share2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#161b22] dark:bg-[#161b22] text-[#58a6ff] shadow-sm' : 'text-[#8b949e] hover:text-white'}`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1">
        {activeTab === 'sms' && renderSMS()}
        {activeTab === 'email' && renderEmail()}
        {activeTab === 'calls' && renderCalls()}
        {activeTab === 'social' && renderSocial()}
      </div>
    </div>
  );
}
