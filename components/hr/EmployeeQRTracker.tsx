import React, { useState, useEffect } from 'react';
import { 
  QrCode, MapPin, Users, Calendar, CheckCircle, 
  Clock, Shield, AlertTriangle, ChevronRight, 
  Download, Filter, Search, MoreVertical, Map as MapIcon,
  UserCheck, UserX, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  status: 'active' | 'absent' | 'remote';
  lastCheckIn?: string;
  lastLocation?: string;
}

const DUMMY_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Alvin Wanjala', department: 'Legal', role: 'Counsel', status: 'active', lastCheckIn: '08:15 AM', lastLocation: 'Nairobi Office' },
  { id: '2', name: 'Brenda Chepngetich', department: 'Finance', role: 'Auditor', status: 'remote', lastCheckIn: '09:00 AM', lastLocation: 'Mombasa Branch' },
  { id: '3', name: 'Catherine Mwangi', department: 'Admin', role: 'Manager', status: 'absent' },
  { id: '4', name: 'David Odhiambo', department: 'IT', role: 'Support', status: 'active', lastCheckIn: '08:45 AM', lastLocation: 'Nairobi Office' }
];

export default function EmployeeQRTracker() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'team' | 'map'>('attendance');
  const [employees, setEmployees] = useState<Employee[]>(DUMMY_EMPLOYEES);

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-12 h-12 bg-blue-600 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-blue-200">
                <QrCode size={24} />
             </div>
             <div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">QR Guard</h1>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Smart Employee Attendance & Geolocation</p>
             </div>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-700">
          {[
            { id: 'attendance', label: 'Attendance', icon: UserCheck },
            { id: 'team', label: 'Team', icon: Users },
            { id: 'map', label: 'Live Map', icon: MapIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-tight transition-all ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-slate-700 shadow-xl text-blue-600 dark:text-white scale-105' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-blue-600 rounded-[40px] p-8 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
            <Activity className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 group-hover:scale-110 transition-transform duration-1000" />
            <p className="text-blue-100 font-bold uppercase text-[10px] tracking-[0.2em] mb-4">Total Workforce</p>
            <h3 className="text-6xl font-black tracking-tighter mb-2">94%</h3>
            <p className="text-blue-100 text-sm font-medium">Daily attendance rate is higher than last week's average.</p>
         </div>

         <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
               <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl"><UserCheck size={20} /></div>
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">+12 Today</span>
            </div>
            <div>
               <h4 className="text-4xl font-black text-slate-900 dark:text-white mt-4">128</h4>
               <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Active Check-ins</p>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
               <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl"><MapPin size={20} /></div>
               <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Global Scan</span>
            </div>
            <div>
               <h4 className="text-4xl font-black text-slate-900 dark:text-white mt-4">8</h4>
               <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Remote Check-ins</p>
            </div>
         </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-[56px] border border-slate-100 dark:border-slate-800 p-10 shadow-sm overflow-hidden min-h-[500px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-50 dark:border-slate-800">
           <div>
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                 {activeTab === 'attendance' ? 'Daily Attendance' : activeTab === 'team' ? 'Employee Directory' : 'Real-time Geolocation'}
                 <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full text-[10px] font-black uppercase">Live Updates</div>
              </h3>
           </div>

           <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input 
                    type="text" 
                    placeholder="Quick search..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                 />
              </div>
              <button className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl hover:text-slate-900 transition-all">
                 <Filter size={20} />
              </button>
           </div>
        </div>

        <div className="space-y-4">
           {employees.map((emp) => (
              <div 
                key={emp.id}
                className="group p-6 bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 rounded-[32px] hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xl overflow-hidden shadow-inner">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                   </div>
                   <div>
                      <h5 className="font-black text-slate-900 dark:text-white text-lg">{emp.name}</h5>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.department} • {emp.role}</span>
                         <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-emerald-500 animate-pulse' : emp.status === 'remote' ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                      </div>
                   </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 md:gap-10 w-full md:w-auto">
                   {emp.status !== 'absent' ? (
                      <>
                        <div className="flex items-center gap-3">
                           <Clock size={16} className="text-slate-300" />
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Arrival</p>
                              <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{emp.lastCheckIn}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <MapPin size={16} className="text-slate-300" />
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Location</p>
                              <p className="text-sm font-black text-blue-600 mt-1">{emp.lastLocation}</p>
                           </div>
                        </div>
                      </>
                   ) : (
                      <div className="flex items-center gap-3 text-slate-400 italic text-sm">
                         <AlertTriangle size={16} /> No check-in data today
                      </div>
                   )}
                   
                   <button className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all group-hover:scale-105">
                      <ChevronRight size={20} />
                   </button>
                </div>
              </div>
           ))}
        </div>

        <div className="mt-12 flex items-center justify-center gap-4 pt-10 border-t border-slate-50 dark:border-slate-800">
           <button className="px-10 py-5 bg-slate-900 dark:bg-slate-800 text-white rounded-3xl font-black text-sm hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-3">
              <Download size={18} /> Export Attendance Report
           </button>
           <button className="px-10 py-5 bg-blue-600 text-white rounded-3xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 flex items-center gap-3">
              <Plus size={18} /> Add Employee
           </button>
        </div>
      </div>
    </div>
  );
}
