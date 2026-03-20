import React from 'react';
import { StampTemplate } from '../types';
import { PenTool, Plus } from 'lucide-react';

interface TemplateLibraryProps {
  onSelect: (template: StampTemplate) => void;
  customTemplates?: StampTemplate[];
  onCreateNew?: () => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelect,
  customTemplates = [],
  onCreateNew
}) => {
  if (customTemplates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-[#21262d] border border-[#58a6ff] rounded-3xl flex items-center justify-center mb-6">
          <PenTool size={32} className="text-[#58a6ff]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No saved templates yet</h3>
        <p className="text-[#8b949e] text-sm max-w-xs mb-8">
          Design a stamp in the Stamp Studio and save it as a template to find it here.
        </p>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-[#1f6feb] text-white rounded-xl font-semibold hover:bg-[#388bfd] transition-colors"
          >
            <Plus size={18} /> Create your first stamp
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Templates</h2>
          <p className="text-sm text-[#8b949e] mt-0.5">{customTemplates.length} saved design{customTemplates.length !== 1 ? 's' : ''}</p>
        </div>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-[#1f6feb] text-white rounded-xl text-sm font-semibold hover:bg-[#388bfd] transition-colors"
          >
            <Plus size={16} /> New Stamp
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {customTemplates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl)}
            className="flex flex-col text-left p-5 bg-[#161b22] border border-[#30363d] rounded-2xl hover:border-[#58a6ff] hover:bg-[#21262d] transition-all group"
          >
            <div className="w-full aspect-square bg-[#0d1117] rounded-xl mb-4 flex items-center justify-center border border-[#30363d] group-hover:border-[#58a6ff] transition-colors overflow-hidden">
              <div
                className="flex items-center justify-center text-[8px] font-bold text-center p-3 uppercase tracking-tighter leading-tight"
                style={{
                  width: tpl.shape === 'ROUND' || tpl.shape === 'OVAL' ? '80px' : '90px',
                  height: tpl.shape === 'ROUND' || tpl.shape === 'SQUARE' ? '80px' : '60px',
                  borderRadius: tpl.shape === 'ROUND' || tpl.shape === 'OVAL' ? '50%' : '8px',
                  border: `3px solid ${tpl.borderColor}`,
                  color: tpl.borderColor,
                }}
              >
                {tpl.primaryText.substring(0, 20)}
              </div>
            </div>
            <h3 className="font-semibold text-white text-sm truncate group-hover:text-[#58a6ff] transition-colors">{tpl.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-[#8b949e] capitalize">{tpl.category}</span>
              <span className="w-1 h-1 rounded-full bg-[#1f6feb]" />
              <span className="text-[10px] text-[#8b949e] capitalize">{tpl.shape?.toLowerCase()}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TemplateLibrary;
