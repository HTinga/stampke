
import React from 'react';
import { ShieldCheck, CheckCircle, FileText, Download, QrCode } from 'lucide-react';

const StampCertificate: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-24 px-4 animate-in slide-in-from-bottom-8 duration-500">
      <div className="text-center mb-16">
        <div className="bg-emerald-100 text-emerald-600 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-50">
           <ShieldCheck size={40} strokeWidth={2.5} />
        </div>
        <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">Verified <br/><span className="text-emerald-600">Seal Authority.</span></h2>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Every stamp generated through FreeStamps Pro comes with a digital certificate of authenticity to prevent forgery and ensure legal validity.
        </p>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-[56px] p-8 md:p-16 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between gap-12 relative z-10">
           <div className="flex-1 space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><CheckCircle size={20} /></div>
                 <div>
                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Global Unique ID</h4>
                    <p className="text-sm text-slate-500 font-medium">Serialized tracking for every export.</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><QrCode size={20} /></div>
                 <div>
                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Verification QR</h4>
                    <p className="text-sm text-slate-500 font-medium">Scan to verify seal metadata instantly.</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><FileText size={20} /></div>
                 <div>
                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">LSK/Judiciary Ready</h4>
                    <p className="text-sm text-slate-500 font-medium">Aligned with Kenyan judicial standards.</p>
                 </div>
              </div>
           </div>
           
           <div className="flex-1 bg-slate-50 rounded-[40px] p-8 border-2 border-dashed border-slate-200">
              <div className="flex justify-between items-start mb-6">
                 <div className="bg-slate-900 text-white p-2 rounded-lg"><ShieldCheck size={24} /></div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: #FS-99812-KE</p>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">VERIFIED</p>
                 </div>
              </div>
              <h5 className="text-xl font-black text-slate-900 mb-2">Authenticity Report</h5>
              <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">Issued to: JijiTechy Solutions</p>
              <div className="space-y-3">
                 <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"><div className="w-full h-full bg-emerald-500"></div></div>
                 <div className="h-2 w-3/4 bg-slate-200 rounded-full"></div>
                 <div className="h-2 w-1/2 bg-slate-200 rounded-full"></div>
              </div>
              <button className="w-full bg-white border border-slate-200 mt-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                 <Download size={14} /> Download PDF
              </button>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
};

export default StampCertificate;
