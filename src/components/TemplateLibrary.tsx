import React, { useState } from 'react';
import { StampTemplate } from '../types';
import { Pen, Plus, Trash2, Calendar, Layout, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmationDialog } from './dialogs/ConfirmationDialog';

interface TemplateLibraryProps {
  onSelect: (template: StampTemplate) => void;
  onRemove?: (id: string) => void;
  customTemplates?: StampTemplate[];
  onCreateNew?: () => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelect,
  onRemove,
  customTemplates = [],
  onCreateNew
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (customTemplates.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-[#1f6feb]/20 to-[#58a6ff]/10 border border-[#1f6feb]/30 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(31,111,235,0.15)]">
          <Pen size={40} className="text-[#58a6ff]" />
        </div>
        <h3 className="text-2xl font-black text-white mb-3">No saved templates yet</h3>
        <p className="text-[#8b949e] text-sm max-w-sm mb-10 leading-relaxed">
          Design a professional stamp in the Stamp Studio and save it as a template to build your library.
        </p>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="group flex items-center gap-3 px-8 py-4 bg-[#1f6feb] text-white rounded-2xl font-bold hover:bg-[#388bfd] hover:shadow-[0_0_20px_rgba(56,139,253,0.4)] transition-all duration-300"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> 
            <span>Create your first stamp</span>
            <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
          </button>
        )}
      </motion.div>
    );
  }
  const samples = customTemplates.filter(t => !t.templateType || t.templateType === 'sample');
  const completed = customTemplates.filter(t => t.templateType === 'completed');

  const renderGrid = (items: StampTemplate[], title: string) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#30363d]" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b949e]">{title}</h4>
          <div className="h-px flex-1 bg-[#30363d]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          <AnimatePresence mode="popLayout">
            {items.map((tpl, idx) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-col group relative"
              >
                {/* Card Body */}
                <div 
                  className="w-full aspect-square bg-white rounded-[2.5rem] mb-5 flex items-center justify-center border border-[#30363d] group-hover:border-[#58a6ff]/60 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_15px_rgba(88,166,255,0.2)] transition-all duration-500 overflow-hidden p-8 relative"
                >
                  {/* Categorization Badge */}
                  <div className={`absolute top-5 left-5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest z-10 ${tpl.templateType === 'completed' ? 'bg-emerald-500 text-white' : 'bg-[#1f6feb] text-white'}`}>
                    {tpl.templateType === 'completed' ? 'Ready' : 'Sample'}
                  </div>

                  {/* SVG Preview */}
                  {tpl.svgPreview ? (
                    <img 
                      src={tpl.svgPreview} 
                      alt={tpl.name} 
                      className="w-full h-full object-contain filter drop-shadow-[0_5px_15px_rgba(0,0,0,0.2)] group-hover:scale-110 group-hover:rotate-2 transition-transform duration-700" 
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center text-[10px] font-black text-center p-4 uppercase tracking-tighter leading-tight opacity-40 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        width: '100%',
                        height: tpl.shape === 'ROUND' || tpl.shape === 'SQUARE' ? '100%' : '70%',
                        borderRadius: tpl.shape === 'ROUND' || tpl.shape === 'OVAL' ? '50%' : '1.5rem',
                        border: `6px solid ${tpl.borderColor}`,
                        color: tpl.borderColor,
                      }}
                    >
                      {tpl.primaryText}
                    </div>
                  )}

                  {/* Hover Action Bar */}
                  <div className="absolute inset-x-4 bottom-4 flex gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                    <button
                      onClick={() => onSelect(tpl)}
                      className="flex-1 bg-[#0d1117] text-white text-[11px] font-black py-2.5 rounded-xl hover:bg-[#58a6ff] transition-colors uppercase tracking-widest shadow-lg"
                    >
                      {tpl.templateType === 'completed' ? 'Use Now' : 'Edit Design'}
                    </button>
                    {onRemove && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(tpl.id);
                        }}
                        className="w-10 h-10 bg-white border border-[#30363d] flex items-center justify-center rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="px-3">
                  <h3 className="font-black text-white text-base truncate group-hover:text-[#58a6ff] transition-colors mb-2 leading-tight">
                    {tpl.name}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Layout size={12} className="text-[#8b949e] flex-shrink-0" />
                      <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider truncate">
                        {tpl.shape?.toLowerCase()}
                      </span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-[#30363d] flex-shrink-0" />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Calendar size={12} className="text-[#1f6feb]/60" />
                      <span className="text-[10px] text-[#58a6ff] font-black uppercase tracking-widest">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      {renderGrid(completed, 'Completed Stamps')}
      {renderGrid(samples, 'Sample Templates')}

      <ConfirmationDialog
        isOpen={!!deletingId}
        title="Delete Template?"
        message="This design will be permanently removed from your library. This action cannot be undone."
        confirmLabel="Delete Forever"
        onConfirm={() => {
          if (deletingId && onRemove) {
            onRemove(deletingId);
            setDeletingId(null);
          }
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};

export default TemplateLibrary;
