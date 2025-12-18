
import React, { useState } from 'react';
import { Layers, FileSpreadsheet, Zap, CheckCircle, Download } from 'lucide-react';

const BulkStamping: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulateBulk = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto py-20 px-4 animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex flex-col lg:flex-row gap-20 items-center">
        <div className="flex-1 space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-black uppercase tracking-widest border border-emerald-100">
            <Layers size={14} /> Efficiency Pro
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter">
            Bulk Stamping <br/><span className="text-emerald-600">for Enterprises.</span>
          </h2>
          <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
            Upload a CSV of document IDs or names, and our system will generate thousands of unique, serialized stamps in seconds. Perfect for exam certificates and large-scale invoicing.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: <FileSpreadsheet className="text-blue-500" />, title: 'CSV Import', desc: 'Sync your data' },
              { icon: <Zap className="text-amber-500" />, title: 'Instant Batch', desc: '1000+ stamps/sec' },
              { icon: <CheckCircle className="text-emerald-500" />, title: 'Serialized', desc: 'Unique tracking IDs' },
              { icon: <Download className="text-purple-500" />, title: 'ZIP Export', desc: 'All files in one pack' }
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0">{feature.icon}</div>
                <div>
                  <h4 className="font-black text-slate-900">{feature.title}</h4>
                  <p className="text-xs text-slate-400 font-medium">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 w-full max-w-xl">
           <div className="bg-slate-900 rounded-[48px] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10 space-y-8 text-center">
                <div className="w-20 h-20 bg-emerald-600 rounded-[28px] flex items-center justify-center mx-auto shadow-xl shadow-emerald-900/40 animate-pulse">
                   <Layers size={40} />
                </div>
                <h3 className="text-3xl font-black">Interactive Bulk Tool</h3>
                <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] space-y-6">
                   <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase tracking-widest">
                      <span>Records Loaded</span>
                      <span className="text-emerald-400">0 Items</span>
                   </div>
                   <button className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                      <FileSpreadsheet size={20} /> Select CSV File
                   </button>
                   <div className="h-[1px] bg-white/10"></div>
                   <button 
                    disabled={isProcessing}
                    onClick={handleSimulateBulk}
                    className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                   >
                     {isProcessing ? 'Processing 5,000 Seals...' : 'Start Bulk Run'}
                   </button>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Available for Business Tier only</p>
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px]"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BulkStamping;
