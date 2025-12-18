
import React from 'react';
import { TEMPLATES } from '../constants';
import { StampTemplate } from '../types';

interface TemplateLibraryProps {
  onSelect: (template: StampTemplate) => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onSelect }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Choose a Template</h2>
        <span className="text-sm text-slate-500">{TEMPLATES.length} Designs available</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl)}
            className="flex flex-col text-left p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="w-full aspect-square bg-slate-50 rounded-lg mb-3 flex items-center justify-center border border-slate-100 overflow-hidden relative">
               {/* Simplified Preview within library */}
               <div 
                 className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-[6px] font-bold text-center p-1"
                 style={{ borderColor: tpl.borderColor, color: tpl.borderColor }}
               >
                 {tpl.primaryText.substring(0, 10)}...
               </div>
               <div className="absolute top-2 right-2 bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
                 {tpl.shape}
               </div>
            </div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 truncate w-full">{tpl.name}</h3>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">{tpl.category}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TemplateLibrary;
