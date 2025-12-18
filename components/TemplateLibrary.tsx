
import React, { useState, useMemo } from 'react';
import { TEMPLATES } from '../constants';
import { StampTemplate, SubscriptionTier } from '../types';
import { Search, Filter, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface TemplateLibraryProps {
  onSelect: (template: StampTemplate) => void;
  userTier: SubscriptionTier;
  onUpgrade: () => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onSelect, userTier, onUpgrade }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Legal', 'Official', 'Business', 'Financial'];

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(tpl => {
      const matchesSearch = tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           tpl.primaryText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tpl.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || tpl.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search and Filter UI - Highly Responsive */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white p-4 lg:p-6 rounded-[32px] border border-slate-100 shadow-sm sticky top-20 lg:top-24 z-40 backdrop-blur-md bg-white/90">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search 30+ official templates (e.g. Carison, Advocate)..." 
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar scroll-smooth">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout - Responsive 1 to 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
        {filteredTemplates.map((tpl) => (
          <div 
            key={tpl.id}
            onClick={() => onSelect(tpl)}
            className="group relative flex flex-col bg-white border border-slate-100 rounded-[40px] p-4 transition-all hover:border-blue-500 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] cursor-pointer overflow-hidden"
          >
            {/* Visual Preview */}
            <div className="aspect-square bg-slate-50 rounded-[32px] mb-6 flex items-center justify-center relative overflow-hidden">
               <div 
                 className="w-44 h-44 rounded-full border-[6px] flex flex-col items-center justify-center p-6 text-center transition-transform duration-500 group-hover:scale-110"
                 style={{ 
                   borderColor: tpl.borderColor, 
                   color: tpl.borderColor, 
                   fontFamily: tpl.fontFamily,
                   borderStyle: 'solid'
                 }}
               >
                 <div className="text-[10px] font-black leading-tight uppercase mb-1">{tpl.primaryText.substring(0, 20)}...</div>
                 <div className="w-full h-[1px] bg-current opacity-20 my-2"></div>
                 <div className="text-[11px] font-black">{tpl.centerText}</div>
                 <div className="text-[7px] opacity-60 mt-1">{tpl.secondaryText?.substring(0, 15)}</div>
               </div>

               {/* Lock Overlay for Premium/Corporate */}
               {tpl.isPremium && userTier === SubscriptionTier.FREE && (
                 <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-white/95 p-5 rounded-[28px] shadow-2xl flex flex-col items-center gap-3 border border-slate-100">
                       <Lock size={24} className="text-amber-500" />
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900">Corporate Stamp</span>
                       <button onClick={(e) => { e.stopPropagation(); onUpgrade(); }} className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[8px] font-black">UNLOCK</button>
                    </div>
                 </div>
               )}

               <div className="absolute top-5 right-5 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-500 border border-slate-100">
                  {tpl.shape}
               </div>
            </div>

            {/* Template Info */}
            <div className="px-3 pb-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{tpl.category}</span>
                {tpl.isPremium && <div className="flex items-center gap-1"><ShieldCheck size={14} className="text-amber-500" /><span className="text-[7px] font-black text-amber-500 uppercase">PRO</span></div>}
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{tpl.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{tpl.fontFamily} Classic</p>
            </div>

            {/* Action Bar */}
            <div className="mt-auto pt-6 flex items-center justify-between px-3">
               <div className="flex -space-x-2">
                 {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white"></div>)}
               </div>
               <button className="bg-slate-50 text-slate-400 p-2.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <ArrowRight size={18} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="py-32 text-center bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
          <p className="text-2xl font-black text-slate-400 mb-4">No stamps found for "{searchTerm}"</p>
          <button 
            onClick={() => {setSearchTerm(''); setSelectedCategory('All');}}
            className="text-blue-600 font-bold hover:underline"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
