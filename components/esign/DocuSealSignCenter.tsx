import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Upload, Plus, Send, ShieldCheck, Clock, CheckCircle2, 
  Trash2, PenTool, Calendar, Type, History, X, Save, Zap, 
  Eraser, MousePointer2, Loader2, Stamp, Image as ImageIcon, 
  ChevronRight, UserPlus, GripHorizontal, Maximize2, FileCode,
  FileDown, Share2, Mail, Edit3, Check, Layers, Layout, ChevronLeft
} from 'lucide-react';
import { Envelope, SignField, FieldType, BulkDocument, StampConfig, SignerInfo } from '../../types';
import DocuSealDashboard from './DocuSealDashboard';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface DocuSealSignCenterProps {
  stampConfig: StampConfig;
  onOpenStudio?: (fieldId?: string) => void;
  pendingStampFieldId?: string | null;
  onClearPendingField?: () => void;
  isActive?: boolean;
}

export default function DocuSealSignCenter({ 
  stampConfig, 
  onOpenStudio, 
  pendingStampFieldId, 
  onClearPendingField, 
  isActive
}: DocuSealSignCenterProps) {
  const [view, setView] = useState<'dashboard' | 'builder' | 'signer-view'>('dashboard');
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [activeEnvelope, setActiveEnvelope] = useState<Envelope | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize with some dummy data if empty
  useEffect(() => {
    if (envelopes.length === 0) {
      const dummy: Envelope = {
        id: '1',
        title: 'Employment Contract - John Doe',
        status: 'sent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documents: [{ id: 'd1', name: 'Contract.pdf', type: 'application/pdf', size: 1024, pages: 3 }],
        signers: [{ id: 's1', name: 'John Doe', email: 'john@example.com', role: 'signer', order: 1, status: 'pending' }],
        fields: [{ id: 'f1', type: 'signature', x: 50, y: 80, page: 3, signerId: 's1' }],
        auditLog: []
      };
      setEnvelopes([dummy]);
    }
  }, []);

  const handleCreateNew = () => {
    const newEnv: Envelope = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Document Package',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [],
      signers: [],
      fields: [],
      auditLog: []
    };
    setActiveEnvelope(newEnv);
    setView('builder');
  };

  const handleSelectEnvelope = (env: Envelope) => {
    setActiveEnvelope(env);
    setView(env.status === 'draft' ? 'builder' : 'signer-view');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col transition-colors duration-500">
      {/* Navigation Header */}
      <nav className="h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView('dashboard')}>
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
                <CheckCircle2 size={22} />
              </div>
              <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">DocuSeal</h2>
           </div>
           
           <div className="hidden md:flex h-8 w-px bg-slate-100 dark:bg-slate-800"></div>
           
           <div className="hidden md:flex items-center gap-1">
              {['Dashboard', 'Templates', 'Settings'].map((item) => (
                <button 
                  key={item}
                  onClick={() => setView(item.toLowerCase() as any)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    (view === 'dashboard' && item === 'Dashboard') 
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {item}
                </button>
              ))}
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">HT</div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none">HTinga</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise Admin</p>
              </div>
           </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {view === 'dashboard' && (
          <DocuSealDashboard 
            envelopes={envelopes}
            onSelectEnvelope={handleSelectEnvelope}
            onCreateNew={handleCreateNew}
            onViewTemplates={() => {}}
          />
        )}

        {view === 'builder' && activeEnvelope && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 p-8 pt-12">
            <button 
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest mb-8 transition-colors"
            >
              <ChevronLeft size={16} /> Back to Documents
            </button>
            
            <div className="max-w-4xl mx-auto space-y-12">
               <div className="text-center space-y-4">
                 <h2 className="text-4xl font-black tracking-tight flex items-center justify-center gap-4">
                    Setup Document Template
                 </h2>
                 <p className="text-slate-500 font-medium">Upload a file, add signers, and place fields where they need to sign.</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-slate-900 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[48px] p-16 text-center group hover:border-blue-400 transition-all cursor-pointer relative overflow-hidden">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <Upload size={48} className="mx-auto text-slate-200 mb-6 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                    <p className="text-2xl font-black text-slate-900 dark:text-white">Upload File</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Support PDF, Word, PNG</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[48px] p-10 space-y-8">
                     <div className="flex items-center justify-between">
                        <h3 className="font-black text-lg">Recipients</h3>
                        <button className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                           <UserPlus size={18} />
                        </button>
                     </div>
                     
                     <div className="space-y-4">
                        <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center justify-between ring-2 ring-blue-500/20">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center font-black text-blue-600 shadow-sm">1</div>
                              <div>
                                 <p className="font-black text-sm text-slate-900 dark:text-white">New Signer</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Signer role</p>
                              </div>
                           </div>
                           <Settings size={16} className="text-slate-300" />
                        </div>
                     </div>
                     
                     <button className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-3xl font-black text-sm hover:bg-slate-800 active:scale-95 transition-all shadow-xl">
                        Continue to Editor
                     </button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
