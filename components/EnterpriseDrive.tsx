
import React, { useState } from 'react';
import { 
  Folder, 
  File, 
  Search, 
  Plus, 
  MoreVertical, 
  Download, 
  Share2, 
  Trash2, 
  Clock, 
  Star, 
  Shield, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  Cloud,
  HardDrive,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DriveItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  extension?: string;
  size?: string;
  updated: string;
  owner: string;
  category: 'Common' | 'Legal' | 'Finance' | 'Personal';
  isStarred?: boolean;
}

export default function EnterpriseDrive() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Common' | 'Legal' | 'Finance'>('All');
  
  const items: DriveItem[] = [
    { id: '1', name: 'Standard_Contracts', type: 'folder', updated: '2h ago', owner: 'Legal Dept', category: 'Common' },
    { id: '2', name: 'Q1_Financial_Templates', type: 'folder', updated: '5h ago', owner: 'Finance Dept', category: 'Finance' },
    { id: '3', name: 'Employee_Handbook.pdf', type: 'file', extension: 'pdf', size: '2.4 MB', updated: '1d ago', owner: 'HR Dept', category: 'Common', isStarred: true },
    { id: '4', name: 'Firm_Logo_Assets.zip', type: 'file', extension: 'zip', size: '45 MB', updated: '3d ago', owner: 'Marketing', category: 'Common' },
    { id: '5', name: 'Court_Filing_Template.docx', type: 'file', extension: 'docx', size: '120 KB', updated: 'Yesterday', owner: 'Legal Dept', category: 'Legal' },
  ];

  const filteredItems = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">Enterprise Drive</h2>
          <p className="text-slate-500 font-medium">Centralized repository for firm documents and common templates.</p>
        </div>
        <div className="flex gap-3">
          <button className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:text-blue-600 transition-all">
            <Cloud size={20} />
          </button>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            <Plus size={18} /> Upload File
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* Sidebar: Navigation */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm h-full overflow-y-auto">
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Storage Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Used Space</span>
                    <span>45.2 GB / 100 GB</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-[45%] h-full bg-blue-600" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Quick Access</h3>
                {[
                  { label: 'All Files', icon: HardDrive, id: 'All' },
                  { label: 'Common Templates', icon: Users, id: 'Common' },
                  { label: 'Legal Vault', icon: Shield, id: 'Legal' },
                  { label: 'Finance Records', icon: FileSpreadsheet, id: 'Finance' },
                ].map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeCategory === cat.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <cat.icon size={18} /> {cat.label}
                  </button>
                ))}
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-sm">
                  <Star size={18} /> Starred Items
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-sm">
                  <Trash2 size={18} /> Trash
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Drive Area */}
        <div className="lg:col-span-9 flex flex-col gap-6 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 w-full max-w-md">
                <Search size={16} className="text-slate-400" />
                <input type="text" placeholder="Search in Drive..." className="bg-transparent border-none outline-none text-xs font-bold w-full" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-400'}`}
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-400'}`}
              >
                <List size={20} />
              </button>
              <div className="h-6 w-px bg-slate-100 dark:bg-slate-800 mx-2" />
              <button className="p-2 text-slate-400 hover:text-slate-600"><Filter size={20} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-200 transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.type === 'folder' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                        {item.type === 'folder' ? <Folder size={28} /> : <FileText size={28} />}
                      </div>
                      <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400"><MoreVertical size={18} /></button>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black truncate">{item.name}</h4>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.updated} • {item.size || 'Folder'}</p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black">{item.owner.charAt(0)}</div>
                        <span className="text-[10px] font-bold text-slate-500">{item.owner}</span>
                      </div>
                      {item.isStarred && <Star size={14} className="text-amber-400 fill-amber-400" />}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50 dark:border-slate-800">
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Name</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Owner</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Updated</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Size</th>
                      <th className="px-8 py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group cursor-pointer">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            {item.type === 'folder' ? <Folder size={18} className="text-blue-600" /> : <FileText size={18} className="text-slate-400" />}
                            <span className="text-sm font-bold">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-sm font-medium text-slate-500">{item.owner}</td>
                        <td className="px-8 py-4 text-sm font-medium text-slate-500">{item.updated}</td>
                        <td className="px-8 py-4 text-sm font-medium text-slate-500">{item.size || '--'}</td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-slate-400 hover:text-blue-600"><Download size={16} /></button>
                            <button className="p-2 text-slate-400 hover:text-blue-600"><Share2 size={16} /></button>
                            <button className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                          </div>
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
    </div>
  );
}
