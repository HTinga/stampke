
import React from 'react';
import { UserAccount, SubscriptionTier } from '../types';
import { CreditCard, Calendar, Shield, BadgeCheck, Phone, Mail, Clock } from 'lucide-react';

interface ProfilePageProps {
  user: UserAccount;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="bg-blue-600 p-12 text-white relative">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-black">
              {user.email?.[0].toUpperCase() || user.whatsapp?.[0]}
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tighter mb-2">Member Profile</h2>
              <div className="flex flex-wrap gap-4">
                <span className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{user.role}</span>
                <span className="bg-emerald-400 text-emerald-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{user.tier} Plan</span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        </div>

        <div className="p-10 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest border-b pb-4 dark:border-slate-800">Account Details</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400"><Mail size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                  <p className="font-bold dark:text-slate-300">{user.email || 'Not Linked'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400"><Phone size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp ID</p>
                  <p className="font-bold dark:text-slate-300">{user.whatsapp || 'Not Linked'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400"><Clock size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Since</p>
                  <p className="font-bold dark:text-slate-300">{user.joinedDate}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest border-b pb-4 dark:border-slate-800">Subscription Status</h3>
            <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[32px] space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Current Plan</span>
                <span className="text-blue-600 font-black">{user.tier}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Expiry Date</span>
                <span className="text-slate-900 dark:text-slate-200 font-black">{user.expiryDate || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Account Status</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {user.status}
                </span>
              </div>
              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/10">
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>

        <div className="px-10 md:px-16 pb-16">
          <button onClick={onLogout} className="text-red-500 font-black uppercase text-xs tracking-[0.2em] hover:text-red-600 transition-all">Sign Out of All Sessions</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
