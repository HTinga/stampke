
import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Upload, X, Check, MousePointer2, Settings2, 
  ShieldCheck, Zap, PenTool, Plus, UserPlus, Trash2,
  Eraser, Save, Layers, Layout, ChevronRight, ChevronLeft,
  DollarSign, Download, Lock, CheckCircle2, RefreshCw,
  Eye, Edit3, CreditCard
} from 'lucide-react';
import { BulkDocument, StampConfig, StampPosition, StampTemplate } from '../types';
import SVGPreview from './SVGPreview';
import EditorControls from './EditorControls';
import { TEMPLATES } from '../constants';

interface Signer {
  id: string;
  name: string;
  role: string;
  signatureUrl: string | null;
  isDrawing: boolean;
}

interface BulkStamperProps {
  config: StampConfig;
  onStartBulk: (totalCost: number) => void;
  isPremium?: boolean;
}

type BulkStep = 'setup' | 'edit-stamp' | 'position' | 'preview';

const SignaturePad: React.FC<{ onSave: (url: string) => void, onCancel: () => void }> = ({ onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  return (
    <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 max-w-md w-full animate-in zoom-in duration-200">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-2xl font-black tracking-tight">Draw Signature</h4>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
      </div>
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden mb-8 touch-none">
        <canvas 
          ref={canvasRef}
          width={400}
          height={250}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="w-full h-auto cursor-crosshair"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }} className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
          <Eraser size={18} /> Clear
        </button>
        <button onClick={() => {
          const canvas = canvasRef.current;
          if (canvas) onSave(canvas.toDataURL('image/png'));
        }} className="bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
          <Save size={18} /> Apply
        </button>
      </div>
    </div>
  );
};

const BulkStamper: React.FC<BulkStamperProps> = ({ config: initialConfig, onStartBulk, isPremium = false }) => {
  const [currentStep, setCurrentStep] = useState<BulkStep>('setup');
  const [mode, setMode] = useState<'stamp' | 'sign'>('stamp');
  const [files, setFiles] = useState<BulkDocument[]>([]);
  const [bulkConfig, setBulkConfig] = useState<StampConfig>(initialConfig);
  const [position, setPosition] = useState<StampPosition>('bottom-right');
  const [customPos, setCustomPos] = useState({ x: 80, y: 80 });
  const [scale, setScale] = useState(0.25);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null);
  const [signers, setSigners] = useState<Signer[]>([
    { id: '1', name: 'Authorizer 1', role: 'Director', signatureUrl: null, isDrawing: false }
  ]);

  // Fix: Define updateSignerSignature to handle signature state updates for specific signers
  const updateSignerSignature = (id: string, url: string) => {
    setSigners(prev => prev.map(s => s.id === id ? { ...s, signatureUrl: url } : s));
  };

  const previewRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const PRICE_PER_PAGE = 50;
  const totalPages = files.reduce((acc, f) => acc + f.pages, 0);
  const totalCost = totalPages * PRICE_PER_PAGE;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []) as File[];
    const newDocs: BulkDocument[] = uploadedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      pages: Math.floor(Math.random() * 8) + 1,
      previewUrl: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...newDocs]);
  };

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setCurrentStep('preview');
    }, 3000);
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-12">
      {[
        { id: 'setup', label: 'Upload' },
        { id: 'edit-stamp', label: 'Customize' },
        { id: 'position', label: 'Place' },
        { id: 'preview', label: 'Review' }
      ].map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
              currentStep === s.id ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 
              files.length > 0 && i < ['setup', 'edit-stamp', 'position', 'preview'].indexOf(currentStep) ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {i + 1}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep === s.id ? 'text-slate-900' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
          {i < 3 && <div className="w-8 h-px bg-slate-200"></div>}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <StepIndicator />

      {currentStep === 'setup' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white border-4 border-dashed border-slate-100 rounded-[64px] p-24 text-center group hover:border-blue-400 transition-all shadow-sm relative">
            <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <Upload size={64} className="mx-auto text-slate-100 mb-6 group-hover:text-blue-500 transition-all" />
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Start Bulk Run</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Upload your documents to begin</p>
          </div>
          
          {files.length > 0 && (
            <div className="mt-12 space-y-4 max-w-2xl mx-auto">
              {files.map(f => (
                <div key={f.id} className="bg-slate-50 p-6 rounded-[32px] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white p-3 rounded-2xl"><FileText size={20} /></div>
                    <div>
                      <p className="font-black text-slate-900 truncate max-w-xs">{f.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.pages} Pages</p>
                    </div>
                  </div>
                  <button onClick={() => setFiles(files.filter(it => it.id !== f.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={20} /></button>
                </div>
              ))}
              <button 
                onClick={() => setCurrentStep('edit-stamp')}
                className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl hover:bg-slate-800 transition-all mt-10 shadow-xl flex items-center justify-center gap-2"
              >
                Proceed to Customize <ChevronRight />
              </button>
            </div>
          )}
        </div>
      )}

      {currentStep === 'edit-stamp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-500">
          <div className="lg:col-span-5">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-6 flex items-center gap-2">
              <Edit3 className="text-blue-600" /> Refine Impression
            </h3>
            <EditorControls config={bulkConfig} onChange={(u) => setBulkConfig(prev => ({ ...prev, ...u }))} />
          </div>
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-50 rounded-[64px] p-12 relative">
            <div className="w-full max-w-md bg-white p-12 rounded-[48px] shadow-2xl mb-12">
               <SVGPreview config={bulkConfig} className="!p-0 border-none shadow-none !bg-transparent" />
            </div>
            <div className="flex gap-4 w-full max-w-md">
              <button onClick={() => setCurrentStep('setup')} className="flex-1 bg-white text-slate-900 py-6 rounded-3xl font-black border border-slate-200">Back</button>
              <button onClick={() => setCurrentStep('position')} className="flex-2 bg-blue-600 text-white py-6 rounded-3xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-100 px-12">Complete & Continue</button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'position' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-500">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
               <div className="flex p-1.5 bg-slate-100 rounded-[28px]">
                  <button onClick={() => setMode('stamp')} className={`flex-1 py-4 rounded-[22px] font-black text-xs uppercase transition-all ${mode === 'stamp' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-400'}`}>Stamp</button>
                  <button onClick={() => setMode('sign')} className={`flex-1 py-4 rounded-[22px] font-black text-xs uppercase transition-all ${mode === 'sign' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-400'}`}>Sign</button>
               </div>
               
               {mode === 'sign' && (
                 <div className="space-y-4">
                    {signers.map(s => (
                      <div key={s.id} className="p-4 bg-slate-50 rounded-3xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 overflow-hidden cursor-pointer relative">
                             {s.signatureUrl ? <img src={s.signatureUrl} className="max-h-full p-1" /> : <PenTool size={16} className="text-slate-300" />}
                             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                               const f = e.target.files?.[0];
                               if (f) updateSignerSignature(s.id, URL.createObjectURL(f));
                             }} />
                          </div>
                          <span className="font-black text-slate-900 text-xs">{s.name}</span>
                        </div>
                        <button onClick={() => setActiveDrawingId(s.id)} className="text-blue-600 hover:scale-110 transition-all"><PenTool size={16} /></button>
                      </div>
                    ))}
                 </div>
               )}

               <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Scale</label>
                    <span className="text-[10px] font-bold text-slate-400">{Math.round(scale * 100)}%</span>
                  </div>
                  <input type="range" min="0.05" max="0.8" step="0.01" value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg accent-blue-600" />
               </div>

               <div className="space-y-6 pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precise Positioning</h4>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold text-slate-500">Horizontal (X)</label>
                        <span className="text-[10px] font-bold text-slate-400">{Math.round(customPos.x)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="1"
                        value={customPos.x}
                        onChange={(e) => setCustomPos({ ...customPos, x: parseInt(e.target.value) })}
                        className="w-full h-1 bg-slate-100 rounded-lg accent-blue-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold text-slate-500">Vertical (Y)</label>
                        <span className="text-[10px] font-bold text-slate-400">{Math.round(customPos.y)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="1"
                        value={customPos.y}
                        onChange={(e) => setCustomPos({ ...customPos, y: parseInt(e.target.value) })}
                        className="w-full h-1 bg-slate-100 rounded-lg accent-blue-600"
                      />
                    </div>
                  </div>
               </div>

               <div className="pt-8 border-t border-slate-100">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Cost</p>
                      <p className="text-3xl font-black text-slate-900">KES {totalCost.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black">{totalPages} Pages</div>
                  </div>
                  <button 
                    disabled={isExecuting}
                    onClick={handleExecute}
                    className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl hover:bg-slate-800 shadow-2xl flex items-center justify-center gap-3"
                  >
                    {isExecuting ? <RefreshCw className="animate-spin" /> : <Zap size={24} className="text-blue-400" />}
                    {isExecuting ? 'Processing...' : 'Run Bulk Task'}
                  </button>
               </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-slate-900 rounded-[64px] p-20 flex flex-col items-center">
               <h4 className="text-white font-black text-2xl mb-8 tracking-tighter">Placement Preview (Page 1 Sync)</h4>
               <div 
                 ref={previewRef}
                 onMouseMove={e => {
                   if (!isDragging || !previewRef.current) return;
                   const r = previewRef.current.getBoundingClientRect();
                   setCustomPos({ 
                     x: Math.min(Math.max(((e.clientX - r.left) / r.width) * 100, 0), 90),
                     y: Math.min(Math.max(((e.clientY - r.top) / r.height) * 100, 0), 90)
                   });
                 }}
                 onMouseUp={() => setIsDragging(false)}
                 onMouseLeave={() => setIsDragging(false)}
                 className="aspect-[3/4] bg-white rounded-xl shadow-2xl relative overflow-hidden cursor-crosshair w-full max-w-md group"
               >
                  <div className="absolute inset-0 p-12 space-y-4 opacity-5 pointer-events-none">
                    <div className="h-6 w-3/4 bg-slate-900 rounded-full"></div>
                    <div className="h-4 w-1/2 bg-slate-900 rounded-full"></div>
                    <div className="h-72 w-full bg-slate-200 rounded-[32px]"></div>
                    <div className="h-4 w-full bg-slate-900 rounded-full"></div>
                    <div className="h-4 w-5/6 bg-slate-900 rounded-full"></div>
                  </div>

                  <div 
                    onMouseDown={() => { setPosition('custom'); setIsDragging(true); }}
                    className="absolute"
                    style={{
                      left: `${customPos.x}%`,
                      top: `${customPos.y}%`,
                      transform: `scale(${scale * 4})`,
                    }}
                  >
                    {mode === 'stamp' ? (
                      <SVGPreview config={bulkConfig} className="!p-0 border-none shadow-none !bg-transparent w-40 h-40" />
                    ) : (
                      <div className="space-y-2">
                        {signers.filter(s => s.signatureUrl).map(s => (
                          <div key={s.id} className="bg-white/50 p-1 border border-black/10 rounded">
                            <img src={s.signatureUrl!} className="h-10 grayscale contrast-150" />
                            <div className="text-[5px] font-black border-t border-black pt-0.5 uppercase">{s.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'preview' && (
        <div className="animate-in zoom-in-95 duration-700">
           <div className="text-center mb-16">
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Results Preview</h3>
              <p className="text-xl text-slate-500 font-medium">Verify your processed documents before unlocking download.</p>
           </div>

           <div className="bg-slate-900 rounded-[64px] p-12 md:p-24 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-h-[700px] overflow-y-auto custom-scrollbar pr-4">
                 {files.map(f => (
                   Array.from({ length: f.pages }).map((_, i) => (
                     <div key={`${f.id}-${i}`} className="space-y-4 group">
                        <div className="aspect-[3/4] bg-white rounded-2xl shadow-lg relative overflow-hidden transition-transform group-hover:scale-[1.02]">
                           <div className="absolute top-4 left-4 bg-slate-100 text-[8px] font-black px-2 py-1 rounded-full uppercase z-20">Pg {i+1} • {f.name.substring(0, 10)}...</div>
                           <div className="absolute inset-0 p-8 space-y-2 opacity-5 pointer-events-none">
                             <div className="h-1 w-full bg-slate-900"></div>
                             <div className="h-24 w-full bg-slate-100 rounded-lg"></div>
                           </div>
                           <div 
                              className="absolute pointer-events-none"
                              style={{
                                left: `${customPos.x}%`,
                                top: `${customPos.y}%`,
                                transform: `scale(${scale * 4})`,
                              }}
                           >
                              {mode === 'stamp' ? <SVGPreview config={bulkConfig} className="!p-0 border-none shadow-none !bg-transparent w-40 h-40" /> : <div className="w-10 h-10 border border-black"></div>}
                           </div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase text-center">{f.name} (Page {i+1})</p>
                     </div>
                   ))
                 )).flat()}
              </div>
           </div>

           <div className="mt-20 max-w-lg mx-auto bg-white p-12 rounded-[56px] border border-slate-100 shadow-2xl text-center space-y-8">
              <div className="bg-blue-50 text-blue-600 p-6 rounded-[36px] w-24 h-24 flex items-center justify-center mx-auto shadow-xl shadow-blue-100"><Lock size={40} /></div>
              <h4 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">Secure Your Processed <br/> High-Res Documents.</h4>
              <p className="text-slate-500 font-medium">Processing fee covers all {totalPages} pages across {files.length} documents.</p>
              <div className="bg-slate-50 p-8 rounded-[36px] flex items-center justify-between">
                 <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                 <span className="text-4xl font-black text-blue-600">KES {totalCost.toLocaleString()}</span>
              </div>
              <div className="space-y-4">
                <button 
                  onClick={() => onStartBulk(totalCost)}
                  className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-3"
                >
                  <CreditCard /> Pay to Download All
                </button>
                <button onClick={() => setCurrentStep('position')} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600">Go Back & Adjust</button>
              </div>
           </div>
        </div>
      )}

      {/* Drawing Pad */}
      {activeDrawingId && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-3xl z-[150] flex items-center justify-center p-4">
           <SignaturePad 
             onSave={url => {
               setSigners(signers.map(s => s.id === activeDrawingId ? { ...s, signatureUrl: url } : s));
               setActiveDrawingId(null);
             }} 
             onCancel={() => setActiveDrawingId(null)} 
           />
        </div>
      )}
    </div>
  );
};

export default BulkStamper;
