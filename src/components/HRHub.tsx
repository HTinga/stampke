
import React, { useState } from 'react';
import { 
  UserPlus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Users, 
  Briefcase,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Coffee,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LeaveRequest {
  id: string;
  employee: string;
  type: 'Annual' | 'Sick' | 'Personal' | 'Short Break';
  startDate: string;
  endDate?: string;
  duration: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
}

interface OnboardingTask {
  id: string;
  title: string;
  status: 'Completed' | 'Pending';
  category: 'Legal' | 'IT' | 'HR' | 'Operations';
}

export default function HRHub() {
  const [activeTab, setActiveTab] = useState<'onboarding' | 'leave' | 'staff'>('onboarding');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    { id: '1', employee: 'John Doe', type: 'Annual', startDate: '2024-04-01', endDate: '2024-04-10', duration: '10 days', status: 'Pending', reason: 'Family vacation' },
    { id: '2', employee: 'Jane Smith', type: 'Sick', startDate: '2024-03-16', duration: '1 day', status: 'Approved', reason: 'Medical appointment' },
    { id: '3', employee: 'Mike Ross', type: 'Short Break', startDate: '2024-03-16', duration: '15 mins', status: 'Approved', reason: 'Coffee break' },
  ]);

  const onboardingTasks: OnboardingTask[] = [
    { id: '1', title: 'Sign Employment Contract', status: 'Completed', category: 'Legal' },
    { id: '2', title: 'IT Asset Allocation', status: 'Pending', category: 'IT' },
    { id: '3', title: 'Compliance Training', status: 'Pending', category: 'Legal' },
    { id: '4', title: 'Benefits Enrollment', status: 'Pending', category: 'HR' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">HR & Talent Hub</h2>
          <p className="text-[#8b949e] font-medium">Manage onboarding, leave requests, and staff operations.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#161b22] dark:bg-[#1f6feb] text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:opacity-90 transition-all">
            <Plus size={18} /> New Request
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#21262d] dark:bg-[#21262d] p-1.5 rounded-2xl w-fit">
        {[
          { id: 'onboarding', label: 'Onboarding', icon: UserPlus },
          { id: 'leave', label: 'Leave & Breaks', icon: Calendar },
          { id: 'staff', label: 'Staff Directory', icon: Users },
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeTab === 'onboarding' && (
              <motion.div 
                key="onboarding"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#161b22] dark:bg-[#161b22] p-10 rounded-[56px] border border-[#21262d] dark:border-[#30363d] shadow-sm"
              >
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-black tracking-tight">New Hire Onboarding</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-[#8b949e]">Progress</span>
                    <div className="w-32 h-2 bg-[#21262d] dark:bg-[#21262d] rounded-full overflow-hidden">
                      <div className="w-1/4 h-full bg-[#1f6feb]" />
                    </div>
                    <span className="text-xs font-black text-[#58a6ff]">25%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {onboardingTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-6 bg-[#0d1117] dark:bg-[#21262d] rounded-3xl border border-[#21262d] dark:border-[#58a6ff] group hover:border-[#aaccf2] transition-all">
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#161b22] dark:bg-[#161b22] text-[#8b949e] shadow-sm'}`}>
                          {task.status === 'Completed' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                        </div>
                        <div>
                          <h4 className="font-black text-white dark:text-white">{task.title}</h4>
                          <p className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest">{task.category} Department</p>
                        </div>
                      </div>
                      <button className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#1f6feb] text-white hover:scale-105'}`}>
                        {task.status === 'Completed' ? 'Verified' : 'Complete Task'}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'leave' && (
              <motion.div 
                key="leave"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'Annual Leave', balance: '18 Days', color: 'text-[#58a6ff]', bg: 'bg-[#21262d]' },
                    { label: 'Sick Leave', balance: '12 Days', color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Short Breaks', balance: 'Unlimited', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#161b22] dark:bg-[#161b22] p-8 rounded-[40px] border border-[#21262d] dark:border-[#30363d]">
                      <p className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest mb-1">{stat.label}</p>
                      <p className={`text-2xl font-black ${stat.color}`}>{stat.balance}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#161b22] dark:bg-[#161b22] p-10 rounded-[56px] border border-[#21262d] dark:border-[#30363d] shadow-sm">
                  <h3 className="text-2xl font-black tracking-tight mb-8">Recent Requests</h3>
                  <div className="space-y-4">
                    {leaveRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-6 bg-[#0d1117] dark:bg-[#21262d] rounded-3xl border border-[#21262d] dark:border-[#58a6ff]">
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${req.type === 'Short Break' ? 'bg-amber-50 text-amber-600' : 'bg-[#21262d] text-[#58a6ff]'}`}>
                            {req.type === 'Short Break' ? <Coffee size={24} /> : <Calendar size={24} />}
                          </div>
                          <div>
                            <h4 className="font-black text-white dark:text-white">{req.employee}</h4>
                            <p className="text-xs text-[#8b949e] font-medium">{req.type} • {req.duration} • {req.startDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'}`}>
                            {req.status}
                          </span>
                          <button className="p-2 hover:bg-[#161b22] dark:hover:bg-[#161b22] rounded-xl transition-all text-[#8b949e]"><ChevronRight size={20} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar: Stats & Actions */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#161b22] text-white p-10 rounded-[56px] shadow-2xl relative overflow-hidden">
            <h3 className="text-2xl font-black tracking-tight mb-6 relative z-10">Quick Actions</h3>
            <div className="space-y-4 relative z-10">
              <button className="w-full flex items-center justify-between p-4 bg-[#161b22]/10 backdrop-blur-md rounded-2xl border border-[#30363d]/10 hover:bg-[#161b22]/20 transition-all group">
                <div className="flex items-center gap-3">
                  <Coffee size={20} className="text-amber-400" />
                  <span className="text-sm font-bold">Request Short Break</span>
                </div>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-[#161b22]/10 backdrop-blur-md rounded-2xl border border-[#30363d]/10 hover:bg-[#161b22]/20 transition-all group">
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-blue-400" />
                  <span className="text-sm font-bold">Apply for Leave</span>
                </div>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#1f6feb]/10 rounded-full blur-3xl" />
          </div>

          <div className="bg-[#161b22] dark:bg-[#161b22] p-10 rounded-[56px] border border-[#21262d] dark:border-[#30363d] shadow-sm">
            <h3 className="text-xl font-black mb-6">Staff Status</h3>
            <div className="space-y-4">
              {[
                { name: 'Alice Wangari', status: 'On Leave', color: 'text-rose-500' },
                { name: 'Bob Omondi', status: 'Short Break', color: 'text-amber-500' },
                { name: 'Charlie Kimani', status: 'Active', color: 'text-emerald-500' },
              ].map((staff, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#21262d] dark:bg-[#21262d] flex items-center justify-center text-[10px] font-black">{staff.name.charAt(0)}</div>
                    <span className="text-sm font-bold">{staff.name}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${staff.color}`}>{staff.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
