
import React, { useState } from 'react';
import { 
  Megaphone, 
  Bell, 
  Clock, 
  User, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter, 
  Tag, 
  MessageSquare, 
  Heart, 
  Share2,
  Bookmark,
  TrendingUp,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: 'General' | 'Policy' | 'Event' | 'Urgent';
  likes: number;
  comments: number;
  isRead: boolean;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'New Remote Work Policy 2024',
      content: 'We are excited to announce our updated remote work policy, providing more flexibility for our legal teams...',
      author: 'HR Director',
      date: '2h ago',
      category: 'Policy',
      likes: 24,
      comments: 5,
      isRead: false
    },
    {
      id: '2',
      title: 'Firm-wide Town Hall Meeting',
      content: 'Please join us for our monthly town hall meeting this Friday at 3 PM in the main conference room or via Zoom.',
      author: 'Operations Manager',
      date: '5h ago',
      category: 'Event',
      likes: 15,
      comments: 2,
      isRead: true
    },
    {
      id: '3',
      title: 'URGENT: Server Maintenance Tonight',
      content: 'All systems will be down for maintenance starting at 11 PM tonight. Please save all your work before then.',
      author: 'IT Support',
      date: 'Yesterday',
      category: 'Urgent',
      likes: 8,
      comments: 12,
      isRead: true
    }
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">Announcements</h2>
          <p className="text-[#365874] font-medium">Stay updated with the latest firm news, policies, and events.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#041628] dark:bg-[#134589] text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:opacity-90 transition-all">
            <Plus size={18} /> New Post
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-4 mb-2 overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'Policy', 'Events', 'Urgent', 'General'].map(cat => (
              <button key={cat} className="px-6 py-2 bg-white dark:bg-[#041628] border border-[#eaf2fc] dark:border-[#0e3a72] rounded-xl text-xs font-black uppercase tracking-widest hover:border-[#aaccf2] transition-all whitespace-nowrap">
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {announcements.map(ann => (
              <motion.div 
                key={ann.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#041628] p-10 rounded-[56px] border border-[#eaf2fc] dark:border-[#0e3a72] shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${ann.category === 'Urgent' ? 'bg-rose-50 text-rose-600' : ann.category === 'Policy' ? 'bg-[#eaf2fc] text-[#134589]' : 'bg-[#f0f6ff] text-[#224260]'}`}>
                      {ann.category === 'Urgent' ? <ShieldAlert size={24} /> : ann.category === 'Policy' ? <Zap size={24} /> : <Megaphone size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black tracking-tight">{ann.title}</h3>
                        {!ann.isRead && <div className="w-2 h-2 rounded-full bg-[#134589]" />}
                      </div>
                      <p className="text-[10px] font-black uppercase text-[#4d7291] tracking-widest">{ann.author} • {ann.date}</p>
                    </div>
                  </div>
                  <button className="p-2 text-[#7ab3e8] hover:text-[#134589] transition-all"><Bookmark size={20} /></button>
                </div>

                <p className="text-[#224260] dark:text-[#7ab3e8] font-medium leading-relaxed mb-8">
                  {ann.content}
                </p>

                <div className="flex items-center justify-between pt-8 border-t border-[#f0f6ff] dark:border-[#0e3a72]">
                  <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-xs font-black text-[#4d7291] hover:text-rose-500 transition-all">
                      <Heart size={16} /> {ann.likes}
                    </button>
                    <button className="flex items-center gap-2 text-xs font-black text-[#4d7291] hover:text-[#134589] transition-all">
                      <MessageSquare size={16} /> {ann.comments}
                    </button>
                    <button className="flex items-center gap-2 text-xs font-black text-[#4d7291] hover:text-[#224260] transition-all">
                      <Share2 size={16} /> Share
                    </button>
                  </div>
                  <button className="flex items-center gap-2 text-xs font-black text-[#134589] uppercase tracking-widest group">
                    Read More <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#041628] text-white p-10 rounded-[56px] shadow-2xl relative overflow-hidden">
            <h3 className="text-2xl font-black tracking-tight mb-6 relative z-10">Trending Topics</h3>
            <div className="space-y-4 relative z-10">
              {[
                { tag: '#RemoteWork', count: '45 posts' },
                { tag: '#Q1Results', count: '32 posts' },
                { tag: '#OfficeCoffee', count: '28 posts' },
              ].map((topic, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                  <span className="text-sm font-bold">{topic.tag}</span>
                  <span className="text-[10px] font-black uppercase text-white/60">{topic.count}</span>
                </div>
              ))}
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#134589]/10 rounded-full blur-3xl" />
          </div>

          <div className="bg-white dark:bg-[#041628] p-10 rounded-[56px] border border-[#eaf2fc] dark:border-[#0e3a72] shadow-sm">
            <h3 className="text-xl font-black mb-6">Upcoming Events</h3>
            <div className="space-y-6">
              {[
                { title: 'Town Hall Meeting', date: 'Mar 20, 3:00 PM' },
                { title: 'Compliance Workshop', date: 'Mar 22, 10:00 AM' },
                { title: 'Team Building', date: 'Mar 25, All Day' },
              ].map((event, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 bg-[#f0f6ff] dark:bg-[#062040] rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-[#134589] uppercase">{event.date.split(' ')[0]}</span>
                    <span className="text-sm font-black">{event.date.split(' ')[1].replace(',', '')}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{event.title}</h4>
                    <p className="text-[10px] font-black uppercase text-[#4d7291] tracking-widest">{event.date.split(',')[1].trim()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
