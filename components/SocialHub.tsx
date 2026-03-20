import React, { useState } from 'react';
import { 
  Share2, 
  MessageSquare, 
  Mail, 
  Send, 
  MessageCircle, 
  Globe, 
  Zap, 
  Smartphone, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Instagram, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  BarChart3,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SocialHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'socials' | 'bulk' | 'bots' | 'analytics'>('socials');

  const platforms = [
    { id: 'twitter', name: 'Twitter', icon: Twitter, status: 'Connected', followers: '12.4K', color: 'text-blue-400' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, status: 'Connected', followers: '8.2K', color: 'text-blue-700' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, status: 'Connected', followers: '24.1K', color: 'text-[#58a6ff]' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, status: 'Disconnected', followers: '-', color: 'text-pink-600' },
  ];

  const bulkCampaigns = [
    { id: '1', name: 'Holiday Special', type: 'SMS', status: 'Sent', sentTo: '1,200', openRate: '98%' },
    { id: '2', name: 'Newsletter Q1', type: 'Email', status: 'Draft', sentTo: '5,000', openRate: '-' },
    { id: '3', name: 'Product Launch', type: 'WhatsApp', status: 'Scheduled', sentTo: '850', openRate: '-' },
  ];

  const bots = [
    { id: '1', name: 'Customer Support', platform: 'WhatsApp', status: 'Active', sessions: '142', success: '94%' },
    { id: '2', name: 'Sales Assistant', platform: 'Telegram', status: 'Active', sessions: '85', success: '88%' },
    { id: '3', name: 'Lead Gen Bot', platform: 'Messenger', status: 'Paused', sessions: '0', success: '-' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter">Social Hub & Communication</h2>
          <p className="text-[#8b949e] font-medium">Manage all your socials, bulk messaging, and AI bots in one place.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#1f6feb] text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#30363d] transition-all shadow-lg shadow-[#c5d8ef]">
            <Plus size={18} /> New Campaign
          </button>
          <button className="bg-[#161b22] dark:bg-[#161b22] border border-[#30363d] dark:border-[#30363d] px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#0d1117] transition-all">
            <Bot size={18} /> AI Assistant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Reach', value: '44.7K', icon: Globe, color: 'text-[#58a6ff]', bg: 'bg-[#21262d]' },
          { label: 'Messages Sent', value: '12.8K', icon: Send, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Bot Sessions', value: '227', icon: Bot, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Avg. Engagement', value: '4.8%', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#161b22] dark:bg-[#161b22] p-6 rounded-3xl border border-[#21262d] dark:border-[#30363d] shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[#8b949e] text-xs font-black uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black tracking-tight">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#161b22] dark:bg-[#161b22] rounded-[2.5rem] border border-[#21262d] dark:border-[#30363d] shadow-sm overflow-hidden">
        <div className="flex border-b border-[#21262d] dark:border-[#30363d]">
          {[
            { id: 'socials', label: 'Social Media', icon: Share2 },
            { id: 'bulk', label: 'Bulk Messaging', icon: Send },
            { id: 'bots', label: 'AI Bots', icon: Bot },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-6 font-black text-sm uppercase tracking-widest transition-all relative flex items-center gap-2 ${
                activeTab === tab.id ? 'text-[#58a6ff]' : 'text-[#8b949e] hover:text-[#e6edf3]'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTabSocial" className="absolute bottom-0 left-0 right-0 h-1 bg-[#1f6feb]" />
              )}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'socials' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {platforms.map((platform) => (
                <div key={platform.id} className="p-6 rounded-3xl bg-[#0d1117] dark:bg-[#21262d]/50 border border-[#21262d] dark:border-[#30363d] space-y-4 group hover:border-[#1a5cad] transition-all">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl bg-[#161b22] dark:bg-[#21262d] shadow-sm ${platform.color}`}>
                      <platform.icon size={24} />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      platform.status === 'Connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {platform.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-lg">{platform.name}</h4>
                    <p className="text-xs text-[#8b949e] font-bold">{platform.followers} Followers</p>
                  </div>
                  <button className="w-full py-3 rounded-xl bg-[#161b22] dark:bg-[#21262d] text-xs font-black uppercase tracking-widest hover:bg-[#161b22] hover:text-white transition-all">
                    Manage Account
                  </button>
                </div>
              ))}
              <button className="p-6 rounded-3xl border-4 border-dashed border-[#21262d] dark:border-[#30363d] flex flex-col items-center justify-center gap-3 hover:border-[#1a5cad] transition-all group">
                <div className="p-3 rounded-2xl bg-[#0d1117] dark:bg-[#21262d] group-hover:bg-[#21262d] group-hover:text-[#58a6ff] transition-all">
                  <Plus size={24} />
                </div>
                <span className="font-black text-xs uppercase tracking-widest text-[#8b949e] group-hover:text-[#58a6ff] transition-all">Add Platform</span>
              </button>
            </div>
          )}

          {activeTab === 'bulk' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight">Recent Campaigns</h3>
                <div className="flex gap-2">
                  <button className="p-2 bg-[#0d1117] dark:bg-[#21262d] rounded-lg text-[#8b949e] hover:text-white"><Search size={18} /></button>
                  <button className="p-2 bg-[#0d1117] dark:bg-[#21262d] rounded-lg text-[#8b949e] hover:text-white"><Filter size={18} /></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-[#21262d] dark:border-[#30363d]">
                      <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-[#8b949e]">Campaign Name</th>
                      <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-[#8b949e]">Type</th>
                      <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-[#8b949e]">Status</th>
                      <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-[#8b949e]">Audience</th>
                      <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-[#8b949e]">Engagement</th>
                      <th className="pb-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-[#30363d]/50">
                    {bulkCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="group hover:bg-[#0d1117]/50 dark:hover:bg-[#21262d]/30 transition-all">
                        <td className="py-4 font-black text-sm">{campaign.name}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#8b949e]">
                            {campaign.type === 'SMS' && <Smartphone size={14} />}
                            {campaign.type === 'Email' && <Mail size={14} />}
                            {campaign.type === 'WhatsApp' && <MessageCircle size={14} />}
                            {campaign.type}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            campaign.status === 'Sent' ? 'bg-emerald-50 text-emerald-600' : 
                            campaign.status === 'Scheduled' ? 'bg-[#21262d] text-[#58a6ff]' : 'bg-[#0d1117] text-[#8b949e]'
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="py-4 text-sm font-bold text-[#8b949e]">{campaign.sentTo}</td>
                        <td className="py-4 text-sm font-bold text-emerald-500">{campaign.openRate}</td>
                        <td className="py-4 text-right">
                          <button className="p-2 hover:bg-[#161b22] dark:hover:bg-[#30363d] rounded-lg transition-all text-[#8b949e] hover:text-white">
                            <MoreVertical size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bots' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {bots.map((bot) => (
                <div key={bot.id} className="p-8 rounded-[2.5rem] bg-[#0d1117] dark:bg-[#21262d]/50 border border-[#21262d] dark:border-[#30363d] space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#161b22] dark:bg-[#21262d] rounded-3xl flex items-center justify-center shadow-sm text-[#58a6ff]">
                        <Bot size={32} />
                      </div>
                      <div>
                        <h4 className="font-black text-xl">{bot.name}</h4>
                        <p className="text-xs text-[#8b949e] font-bold">Platform: {bot.platform}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        bot.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0d1117] text-[#8b949e]'
                      }`}>
                        {bot.status}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500">
                        <Zap size={10} /> AI POWERED
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#161b22] dark:bg-[#21262d] p-4 rounded-2xl border border-[#21262d] dark:border-[#58a6ff]">
                      <p className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest mb-1">Sessions</p>
                      <p className="text-xl font-black">{bot.sessions}</p>
                    </div>
                    <div className="bg-[#161b22] dark:bg-[#21262d] p-4 rounded-2xl border border-[#21262d] dark:border-[#58a6ff]">
                      <p className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest mb-1">Success Rate</p>
                      <p className="text-xl font-black text-emerald-500">{bot.success}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 py-4 rounded-2xl bg-[#161b22] dark:bg-[#1f6feb] text-white font-black text-sm uppercase tracking-widest hover:scale-105 transition-all">
                      Configure Bot
                    </button>
                    <button className="px-6 py-4 rounded-2xl bg-[#161b22] dark:bg-[#21262d] border border-[#30363d] dark:border-[#58a6ff] text-[#8b949e] hover:text-white transition-all">
                      <BarChart3 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              <button className="rounded-[2.5rem] border-4 border-dashed border-[#21262d] dark:border-[#30363d] flex flex-col items-center justify-center gap-4 hover:border-[#1a5cad] transition-all group py-12">
                <div className="w-16 h-16 rounded-3xl bg-[#0d1117] dark:bg-[#21262d] group-hover:bg-[#21262d] group-hover:text-[#58a6ff] transition-all flex items-center justify-center">
                  <Plus size={32} />
                </div>
                <div className="text-center">
                  <p className="font-black text-lg">Create New AI Bot</p>
                  <p className="text-xs text-[#8b949e] font-bold uppercase tracking-widest">Deploy on any platform</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialHub;
