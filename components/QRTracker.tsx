import React, { useState } from 'react';
import { QrCode, MapPin, User, CheckCircle2, Clock, Shield, Smartphone, Camera, Search, Filter, MoreVertical, Download } from 'lucide-react';
import { motion } from 'motion/react';

const QRTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'employees'>('live');

  const employees = [
    { id: '1', name: 'John Doe', role: 'Field Agent', status: 'Active', lastScan: '10:30 AM', location: 'Nairobi CBD', battery: '85%' },
    { id: '2', name: 'Jane Smith', role: 'Site Supervisor', status: 'Active', lastScan: '09:45 AM', location: 'Westlands', battery: '92%' },
    { id: '3', name: 'Mike Johnson', role: 'Delivery Driver', status: 'Inactive', lastScan: 'Yesterday', location: 'Mombasa Road', battery: '12%' },
    { id: '4', name: 'Sarah Wilson', role: 'Sales Rep', status: 'Active', lastScan: '11:15 AM', location: 'Kilimani', battery: '64%' },
  ];

  const recentScans = [
    { id: '1', employee: 'John Doe', type: 'Check-in', time: '10:30:15 AM', location: 'Nairobi CBD', coordinates: '-1.286389, 36.817223' },
    { id: '2', employee: 'Sarah Wilson', type: 'Check-in', time: '11:15:22 AM', location: 'Kilimani', coordinates: '-1.2921, 36.7846' },
    { id: '3', employee: 'Jane Smith', type: 'Checkpoint', time: '09:45:10 AM', location: 'Westlands', coordinates: '-1.2633, 36.8021' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter">QR & GPS Tracker</h2>
          <p className="text-[#365874] font-medium">Real-time employee monitoring and location verification.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#134589] text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#0e3a72] transition-all shadow-lg shadow-[#c5d8ef]">
            <QrCode size={18} /> Generate New QR
          </button>
          <button className="bg-white dark:bg-[#041628] border border-[#c5d8ef] dark:border-[#0e3a72] px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#f0f6ff] transition-all">
            <Download size={18} /> Export Reports
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Now', value: '24', icon: User, color: 'text-[#134589]', bg: 'bg-[#eaf2fc]' },
          { label: 'Total Scans Today', value: '142', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg. Response', value: '12m', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#041628] p-6 rounded-3xl border border-[#eaf2fc] dark:border-[#0e3a72] shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[#365874] text-xs font-black uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black tracking-tight">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#041628] rounded-[2.5rem] border border-[#eaf2fc] dark:border-[#0e3a72] shadow-sm overflow-hidden">
        <div className="flex border-b border-[#eaf2fc] dark:border-[#0e3a72]">
          {['live', 'history', 'employees'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-6 font-black text-sm uppercase tracking-widest transition-all relative ${
                activeTab === tab ? 'text-[#134589]' : 'text-[#4d7291] hover:text-[#224260]'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#134589]" />
              )}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'live' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight">Real-time Activity Feed</h3>
                <div className="flex items-center gap-2 text-emerald-500 font-black text-xs">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  LIVE UPDATING
                </div>
              </div>
              <div className="space-y-4">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#f0f6ff] dark:bg-[#062040]/50 border border-[#eaf2fc] dark:border-[#0e3a72]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white dark:bg-[#041628] rounded-xl flex items-center justify-center shadow-sm">
                        <QrCode size={20} className="text-[#134589]" />
                      </div>
                      <div>
                        <p className="font-black text-sm">{scan.employee}</p>
                        <p className="text-xs text-[#365874] font-bold">{scan.type} at {scan.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-[#4d7291]">{scan.time}</p>
                      <p className="text-[10px] font-mono text-[#1a5cad]">{scan.coordinates}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-[#eaf2fc] dark:border-[#0e3a72]">
                    <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-[#4d7291]">Employee</th>
                    <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-[#4d7291]">Status</th>
                    <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-[#4d7291]">Last Location</th>
                    <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-[#4d7291]">Last Scan</th>
                    <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-[#4d7291]">Device</th>
                    <th className="pb-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-[#0e3a72]/50">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="group hover:bg-[#f0f6ff]/50 dark:hover:bg-[#062040]/30 transition-all">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#eaf2fc] dark:bg-[#062040] rounded-full flex items-center justify-center font-black text-[#134589]">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-sm">{emp.name}</p>
                            <p className="text-xs text-[#365874] font-bold">{emp.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          emp.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#f0f6ff] text-[#4d7291]'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <MapPin size={14} className="text-[#4d7291]" />
                          {emp.location}
                        </div>
                      </td>
                      <td className="py-4 text-sm font-bold text-[#365874]">{emp.lastScan}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#4d7291]">
                          <Smartphone size={14} />
                          {emp.battery}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <button className="p-2 hover:bg-white dark:hover:bg-[#0a2d5a] rounded-lg transition-all text-[#4d7291] hover:text-[#041628]">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRTracker;
