
import React, { useState } from 'react';
import { 
  QrCode, 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  Clock, 
  UserCheck, 
  History,
  AlertCircle,
  CheckCircle2,
  Scan,
  LocateFixed
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TrackingLog {
  id: string;
  personnel: string;
  location: string;
  timestamp: string;
  status: 'Verified' | 'Flagged' | 'Pending';
  coordinates: { lat: number; lng: number };
}

export default function QRTracker() {
  const [logs, setLogs] = useState<TrackingLog[]>([
    { id: '1', personnel: 'John Kamau', location: 'Nairobi CBD Office', timestamp: '2024-03-16 08:30 AM', status: 'Verified', coordinates: { lat: -1.286389, lng: 36.817223 } },
    { id: '2', personnel: 'Sarah Wambui', location: 'Mombasa Port Site', timestamp: '2024-03-16 09:15 AM', status: 'Flagged', coordinates: { lat: -4.043477, lng: 39.668206 } },
  ]);

  const [activeView, setActiveView] = useState<'scan' | 'logs' | 'map'>('logs');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">GPS & QR Verification</h2>
          <p className="text-slate-500 font-medium">Personnel tracking and timesheet verification via GPS-tagged QR scans.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveView('scan')}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all"
          >
            <Scan size={18} /> Generate QR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Stats Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Real-time Status</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold">Active Personnel</span>
                  </div>
                  <span className="text-2xl font-black">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-sm font-bold">Verification Pending</span>
                  </div>
                  <span className="text-2xl font-black">3</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <Navigation size={160} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">QR Verification Logic</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <ShieldCheck className="text-blue-600 mt-1" size={20} />
                <div>
                  <p className="text-sm font-bold">Geofencing Active</p>
                  <p className="text-[10px] text-slate-500 font-medium">Scans only valid within 50m of designated site coordinates.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <LocateFixed className="text-emerald-600 mt-1" size={20} />
                <div>
                  <p className="text-sm font-bold">Biometric Sync</p>
                  <p className="text-[10px] text-slate-500 font-medium">Requires device biometric auth before GPS coordinate capture.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Column */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-8 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl self-start">
            <button 
              onClick={() => setActiveView('logs')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'logs' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
            >
              Activity Logs
            </button>
            <button 
              onClick={() => setActiveView('map')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'map' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
            >
              Live Map
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeView === 'logs' ? (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {logs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400">
                        <UserCheck size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white">{log.personnel}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <MapPin size={12} /> {log.location}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Clock size={12} /> {log.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        log.status === 'Verified' ? 'bg-green-50 text-green-600' : 
                        log.status === 'Flagged' ? 'bg-red-50 text-red-600' : 
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : activeView === 'map' ? (
              <motion.div 
                key="map"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-[500px] bg-slate-100 dark:bg-slate-800 rounded-[32px] flex items-center justify-center relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i12!2i2457!3i1638!2m3!1e0!2sm!3i353012734!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0')] bg-cover" />
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-2xl">
                    <MapPin size={32} />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-500">Live GPS Feed Active</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="scan"
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="p-10 bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl border border-slate-100 dark:border-slate-800 mb-8">
                  <QrCode size={200} className="text-slate-900 dark:text-white" />
                </div>
                <h3 className="text-2xl font-black mb-2">Site QR Code</h3>
                <p className="text-slate-500 font-medium mb-8">Nairobi CBD Office - Valid for 24 hours</p>
                <button className="bg-slate-900 dark:bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest">
                  Download QR for Printing
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
