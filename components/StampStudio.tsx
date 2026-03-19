import React, { useRef } from 'react';
import { useStampStore } from '../src/store';
import TemplateLibrary from './TemplateLibrary';
import EditorControls from './EditorControls';
import SVGPreview from './SVGPreview';
import { X } from 'lucide-react';

interface StampStudioProps {
  onClose: () => void;
  onApply?: (svgData: string) => void;
}

const StampStudio: React.FC<StampStudioProps> = ({ onClose, onApply }) => {
  const { config, setConfig } = useStampStore();
  const svgRef = useRef<SVGSVGElement>(null);

  const handleApply = () => {
    if (onApply && svgRef.current) {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const base64Data = btoa(unescape(encodeURIComponent(svgData)));
      const dataUrl = `data:image/svg+xml;base64,${base64Data}`;
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          onApply(pngUrl);
        }
        onClose();
      };
      img.src = dataUrl;
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="px-6 py-4 border-bottom border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Stamp Studio</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Design and customize your professional stamp</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
              <TemplateLibrary onSelect={setConfig} />
              <EditorControls config={config} onChange={setConfig} />
            </div>
            <div className="lg:sticky lg:top-0 h-fit">
              <SVGPreview config={config} ref={svgRef} />
              <div className="mt-8 flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Apply to Document
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StampStudio;
