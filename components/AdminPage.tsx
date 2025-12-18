
import React, { useState } from 'react';
import { MOCK_USERS } from '../constants';
import { UserAccount } from '../types';
import { Search, Ban, CheckCircle2, ShieldAlert, Monitor, Users } from 'lucide-react';

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleStatus = (id: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE' };
      }
      return u;
    }));
  };

  const filtered = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.whatsapp?.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
        <div>
          <h2 className="text-5xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Command <br/><span className="text-blue-600">Center.</span></h2>
          <p className="text-xl text-slate-500 font-medium max-w-xl">Privileged access for account monitoring, licensing, and security auditing.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-[32px] border border-blue-100 dark:border-blue-800 text-center">
             <div className="text-3xl font-black text-blue-600">{users.length}</div>
             <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Registrations</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-8 border-b dark:border-slate-800 flex items-center gap-4">
          <Search className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by ID, Email, or WhatsApp..."
            className="flex-1 bg-transparent border-none outline-none font-bold text-slate-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-8">User Identity</th>
                <th className="p-8">License Tier</th>
                <th className="p-8">Role</th>
                <th className="p-8">Status</th>
                <th className="p-8">Last Seen</th>
                <th className="p-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                  <td className="p-8">
                    <div className="font-black text-slate-900 dark:text-white">{user.email || user.whatsapp}</div>
                    <div className="text-[9px] text-slate-400 font-bold">UID: {user.id}</div>
                  </td>
                  <td className="p-8">
                    <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black">{user.tier}</span>
                  </td>
                  <td className="p-8 text-xs font-bold dark:text-slate-400">{user.role}</td>
                  <td className="p-8">
                    <div className={`flex items-center gap-2 text-[10px] font-black ${user.status === 'ACTIVE' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {user.status === 'ACTIVE' ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                      {user.status}
                    </div>
                  </td>
                  <td className="p-8 text-xs font-medium text-slate-400">{user.joinedDate}</td>
                  <td className="p-8 text-right">
                    <button 
                      onClick={() => toggleStatus(user.id)}
                      className={`p-3 rounded-xl transition-all ${user.status === 'ACTIVE' ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                    >
                      {user.status === 'ACTIVE' ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
