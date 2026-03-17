
import React from 'react';
import { TEMPLATES } from '../constants';
import { StampTemplate } from '../types';

interface TemplateLibraryProps {
  onSelect: (template: StampTemplate) => void;
  customTemplates?: StampTemplate[];
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onSelect, customTemplates = [] }) => {
  const allTemplates = [...TEMPLATES, ...customTemplates];

  return (
    <div className="space-y-12">
      {customTemplates.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Your Custom Templates</h2>
            <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">{customTemplates.length} Saved</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {customTemplates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => onSelect(tpl)}
                className="flex flex-col text-left p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] hover:border-blue-500 hover:shadow-2xl transition-all group relative overflow-hidden"
              >
                <div className="w-full aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-4 flex items-center justify-center border border-slate-100 dark:border-slate-800 overflow-hidden relative">
                   <div 
                     className="w-24 h-24 rounded-full border-4 flex items-center justify-center text-[8px] font-black text-center p-2 uppercase tracking-tighter"
                     style={{ borderColor: tpl.borderColor, color: tpl.borderColor }}
                   >
                     {tpl.primaryText.substring(0, 15)}...
                   </div>
                   <div className="absolute top-4 right-4 bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                     {tpl.shape}
                   </div>
                </div>
                <h3 className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 truncate w-full text-lg tracking-tight">{tpl.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{tpl.category}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Authentic Library</h2>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{TEMPLATES.length} Designs</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              className="flex flex-col text-left p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] hover:border-blue-500 hover:shadow-2xl transition-all group relative overflow-hidden"
            >
              <div className="w-full aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-4 flex items-center justify-center border border-slate-100 dark:border-slate-800 overflow-hidden relative">
                 <div 
                   className="w-24 h-24 rounded-full border-4 flex items-center justify-center text-[8px] font-black text-center p-2 uppercase tracking-tighter"
                   style={{ borderColor: tpl.borderColor, color: tpl.borderColor }}
                 >
                   {tpl.primaryText.substring(0, 15)}...
                 </div>
                 <div className="absolute top-4 right-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                   {tpl.shape}
                 </div>
              </div>
              <h3 className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 truncate w-full text-lg tracking-tight">{tpl.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{tpl.category}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TemplateLibrary;
