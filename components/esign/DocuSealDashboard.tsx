import React, { useState } from 'react';
import { 
  FileText, Layout, Users, Clock, CheckCircle2, 
  Trash2, Plus, Search, Settings, Filter, MoreVertical,
  ChevronRight, Send, AlertCircle
} from 'lucide-react';
import { Envelope } from '../../types';

interface DocuSealDashboardProps {
  envelopes: Envelope[];
  onSelectEnvelope: (envelope: Envelope) => void;
  onCreateNew: () => void;
  onViewTemplates: () => void;
}

export default function DocuSealDashboard({ 
  envelopes, 
  onSelectEnvelope, 
  onCreateNew,
  onViewTemplates 
}: DocuSealDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEnvelopes = envelopes.filter(env => {
    const matchesFilter = filter === 'all' || env.status === filter;
    const matchesSearch = env.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: envelopes.length,
    completed: envelopes.filter(e => e.status === 'completed').length,
    pending: envelopes.filter(e => e.status === 'sent').length,
    drafts: envelopes.filter(e => e.status === 'draft').length
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Document Dashboard</h1>
          <p className="text-slate-500 font-medium">Manage and track your digital authorizations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onViewTemplates}
            className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm bg-white dark:bg-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Layout size={18} className="text-slate-400" />
            Templates
          </button>
          <button 
            onClick={onCreateNew}
            className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2"
          >
            <Plus size={18} />
            Create New
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-600', bg: 'bg-white' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          { label: 'Pending', value: stats.pending, color: 'text-blue-600', bg: 'bg-blue-50/50' },
          { label: 'Drafts', value: stats.drafts, color: 'text-amber-600', bg: 'bg-amber-50/50' }
        ].map((s, i) => (
          <div key={i} className={`${s.bg} p-6 rounded-3xl border border-slate-100 dark:border-slate-800 dark:bg-slate-900`}>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</div>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
            {['all', 'sent', 'completed', 'draft'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`flex-1 md:px-6 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all ${
                  filter === f 
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-white' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-left border-b border-slate-50 dark:border-slate-800">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Document</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Recipients</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredEnvelopes.length > 0 ? filteredEnvelopes.map((env) => (
                <tr 
                  key={env.id} 
                  onClick={() => onSelectEnvelope(env)}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 dark:text-white">{env.title}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                          {env.documents[0]?.pages} Pages • {env.fields.length} Fields
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex -space-x-2">
                      {env.signers.map((s, idx) => (
                        <div 
                          key={s.id}
                          className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black"
                          title={s.name || s.email}
                        >
                          {s.name?.charAt(0) || s.email?.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      env.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      env.status === 'sent' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {env.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="text-sm font-bold text-slate-500">
                      {new Date(env.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-[24px] flex items-center justify-center mx-auto">
                        <Search size={24} className="text-slate-300" />
                      </div>
                      <div>
                        <p className="text-lg font-black tracking-tight">No Documents Found</p>
                        <p className="text-xs text-slate-400 font-bold px-4">Refine your search or create a new document to begin.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
