
import React, { useState, useMemo } from 'react';
// Added TRANSLATIONS to the import list from constants.ts
import { TEMPLATES, TRANSLATIONS } from '../constants';
import { StampTemplate, SubscriptionTier } from '../types';
import { Search, Filter, Lock, ArrowRight, ShieldCheck, Download } from 'lucide-react';

interface TemplateLibraryProps {
  onSelect: (template: StampTemplate) => void;
  userTier: SubscriptionTier;
  onUpgrade: () => void;
  t: any;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onSelect, userTier, onUpgrade, t }) => {
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
      {/* Search and Filter UI */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900 p-4 lg:p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm sticky top-16 lg:top-24 z-40 backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900 dark:text-white"
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
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t.categories[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-[32px] border border-blue-100 dark:border-blue-800 flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-4 text-left">
           <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><Download size={24} /></div>
           <div>
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.freeToEdit}</p>
              <p className="text-xs text-slate-500 font-medium">{t.highResHint}</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex -space-x-3">
             {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200"></div>)}
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">10,000+ Business Users</p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
        {filteredTemplates.map((tpl) => (
          <div 
            key={tpl.id}
            onClick={() => onSelect(tpl)}
            className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] p-4 transition-all hover:border-blue-500 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] cursor-pointer overflow-hidden"
          >
            {/* Visual Preview */}
            <div className="aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-[32px] mb-6 flex items-center justify-center relative overflow-hidden">
               <div 
                 className={`w-44 h-44 border-[6px] flex flex-col items-center justify-center p-6 text-center transition-transform duration-500 group-hover:scale-110 ${tpl.shape === 'ROUND' ? 'rounded-full' : tpl.shape === 'OVAL' ? 'rounded-[100px] scale-x-125' : 'rounded-lg'}`}
                 style={{ 
                   borderColor: tpl.borderColor, 
                   color: tpl.borderColor, 
                   fontFamily: tpl.fontFamily,
                   borderStyle: 'solid'
                 }}
               >
                 <div className={`text-[10px] font-black leading-tight uppercase mb-1 ${tpl.shape === 'OVAL' ? 'scale-x-75' : ''}`}>{tpl.primaryText.substring(0, 18)}...</div>
                 <div className="w-full h-[1px] bg-current opacity-20 my-2"></div>
                 <div className={`text-[11px] font-black ${tpl.shape === 'OVAL' ? 'scale-x-75' : ''}`}>{tpl.centerText}</div>
                 <div className={`text-[7px] opacity-60 mt-1 ${tpl.shape === 'OVAL' ? 'scale-x-75' : ''}`}>{tpl.centerSubText?.substring(0, 15)}</div>
               </div>

               <div className="absolute top-5 right-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                  {tpl.shape}
               </div>
            </div>

            {/* Template Info */}
            <div className="px-3 pb-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{t.categories[tpl.category] || tpl.category}</span>
                {tpl.isPremium && <div className="flex items-center gap-1"><ShieldCheck size={14} className="text-amber-500" /><span className="text-[7px] font-black text-amber-500 uppercase">OFFICIAL</span></div>}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight">{tpl.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{tpl.fontFamily} Classic</p>
            </div>

            {/* Action Bar */}
            <div className="mt-auto pt-6 flex items-center justify-between px-3">
               {/* Fix: Added TRANSLATIONS to the import list from constants.ts above to resolve the error on line 120 */}
               <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{t.sw === TRANSLATIONS.sw ? 'Bure Kuhariri' : 'Free to Edit'}</span>
               <button className="bg-slate-50 dark:bg-slate-800 text-slate-400 p-2.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <ArrowRight size={18} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="py-32 text-center bg-slate-50 dark:bg-slate-900 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-2xl font-black text-slate-400 dark:text-slate-600 mb-4">No stamps found for "{searchTerm}"</p>
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
