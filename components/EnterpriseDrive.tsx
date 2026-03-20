
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
          <p className="text-[#365874] font-medium">Centralized repository for firm documents and common templates.</p>
        </div>
        <div className="flex gap-3">
          <button className="p-3 bg-white dark:bg-[#041628] rounded-xl border border-[#eaf2fc] dark:border-[#0e3a72] shadow-sm hover:text-[#134589] transition-all">
            <Cloud size={20} />
          </button>
          <button className="bg-[#134589] text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#0e3a72] transition-all shadow-lg shadow-[#c5d8ef]">
            <Plus size={18} /> Upload File
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* Sidebar: Navigation */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-[#041628] p-8 rounded-[40px] border border-[#eaf2fc] dark:border-[#0e3a72] shadow-sm h-full overflow-y-auto">
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#4d7291] mb-6">Storage Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Used Space</span>
                    <span>45.2 GB / 100 GB</span>
                  </div>
                  <div className="w-full h-2 bg-[#eaf2fc] dark:bg-[#062040] rounded-full overflow-hidden">
                    <div className="w-[45%] h-full bg-[#134589]" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#4d7291] mb-4">Quick Access</h3>
                {[
                  { label: 'All Files', icon: HardDrive, id: 'All' },
                  { label: 'Common Templates', icon: Users, id: 'Common' },
                  { label: 'Legal Vault', icon: Shield, id: 'Legal' },
                  { label: 'Finance Records', icon: FileSpreadsheet, id: 'Finance' },
                ].map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeCategory === cat.id ? 'bg-[#eaf2fc] dark:bg-[#062040] text-[#134589]' : 'text-[#365874] hover:bg-[#f0f6ff] dark:hover:bg-[#062040]'}`}
                  >
                    <cat.icon size={18} /> {cat.label}
                  </button>
                ))}
              </div>

              <div className="pt-8 border-t border-[#eaf2fc] dark:border-[#0e3a72]">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#365874] hover:bg-[#f0f6ff] dark:hover:bg-[#062040] transition-all font-bold text-sm">
                  <Star size={18} /> Starred Items
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#365874] hover:bg-[#f0f6ff] dark:hover:bg-[#062040] transition-all font-bold text-sm">
                  <Trash2 size={18} /> Trash
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Drive Area */}
        <div className="lg:col-span-9 flex flex-col gap-6 overflow-hidden">
          <div className="bg-white dark:bg-[#041628] p-4 rounded-[32px] border border-[#eaf2fc] dark:border-[#0e3a72] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2 bg-[#f0f6ff] dark:bg-[#062040] px-4 py-2 rounded-xl border border-[#eaf2fc] dark:border-[#0e3a72] w-full max-w-md">
                <Search size={16} className="text-[#4d7291]" />
                <input type="text" placeholder="Search in Drive..." className="bg-transparent border-none outline-none text-xs font-bold w-full" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#eaf2fc] dark:bg-[#062040] text-[#134589]' : 'text-[#4d7291]'}`}
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#eaf2fc] dark:bg-[#062040] text-[#134589]' : 'text-[#4d7291]'}`}
              >
                <List size={20} />
              </button>
              <div className="h-6 w-px bg-[#eaf2fc] dark:bg-[#062040] mx-2" />
              <button className="p-2 text-[#4d7291] hover:text-[#224260]"><Filter size={20} /></button>
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
                    className="bg-white dark:bg-[#041628] p-6 rounded-[32px] border border-[#eaf2fc] dark:border-[#0e3a72] shadow-sm hover:border-[#aaccf2] transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.type === 'folder' ? 'bg-[#eaf2fc] text-[#134589]' : 'bg-[#f0f6ff] text-[#224260]'}`}>
                        {item.type === 'folder' ? <Folder size={28} /> : <FileText size={28} />}
                      </div>
                      <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#4d7291]"><MoreVertical size={18} /></button>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black truncate">{item.name}</h4>
                      <p className="text-[10px] font-black uppercase text-[#4d7291] tracking-widest">{item.updated} • {item.size || 'Folder'}</p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-[#f0f6ff] dark:border-[#0e3a72] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#eaf2fc] flex items-center justify-center text-[8px] font-black">{item.owner.charAt(0)}</div>
                        <span className="text-[10px] font-bold text-[#365874]">{item.owner}</span>
                      </div>
                      {item.isStarred && <Star size={14} className="text-amber-400 fill-amber-400" />}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#041628] rounded-[32px] border border-[#eaf2fc] dark:border-[#0e3a72] shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#f0f6ff] dark:border-[#0e3a72]">
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-[#4d7291] tracking-widest">Name</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-[#4d7291] tracking-widest">Owner</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-[#4d7291] tracking-widest">Last Updated</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-[#4d7291] tracking-widest">Size</th>
                      <th className="px-8 py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-[#f0f6ff] dark:hover:bg-[#062040] transition-all group cursor-pointer">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            {item.type === 'folder' ? <Folder size={18} className="text-[#134589]" /> : <FileText size={18} className="text-[#4d7291]" />}
                            <span className="text-sm font-bold">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-sm font-medium text-[#365874]">{item.owner}</td>
                        <td className="px-8 py-4 text-sm font-medium text-[#365874]">{item.updated}</td>
                        <td className="px-8 py-4 text-sm font-medium text-[#365874]">{item.size || '--'}</td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-[#4d7291] hover:text-[#134589]"><Download size={16} /></button>
                            <button className="p-2 text-[#4d7291] hover:text-[#134589]"><Share2 size={16} /></button>
                            <button className="p-2 text-[#4d7291] hover:text-rose-600"><Trash2 size={16} /></button>
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
