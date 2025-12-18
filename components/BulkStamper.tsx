
import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Upload, X, Check, MousePointer2, Settings2, 
  ShieldCheck, Zap, PenTool, Plus, UserPlus, Trash2,
  Eraser, Save
} from 'lucide-react';
import { BulkDocument, StampConfig, StampPosition } from '../types';
import SVGPreview from './SVGPreview';

interface Signer {
  id: string;
  name: string;
  role: string;
  signatureUrl: string | null;
  isDrawing: boolean;
}

interface BulkStamperProps {
  config: StampConfig;
  onStartBulk: () => void;
}

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
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL('image/png'));
    }
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
        <button onClick={clear} className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
          <Eraser size={18} /> Clear Pad
        </button>
        <button onClick={save} className="bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
          <Save size={18} /> Apply Signature
        </button>
      </div>
    </div>
  );
};

const BulkStamper: React.FC<BulkStamperProps> = ({ config, onStartBulk }) => {
  const [mode, setMode] = useState<'stamp' | 'sign'>('stamp');
  const [files, setFiles] = useState<BulkDocument[]>([]);
  const [position, setPosition] = useState<StampPosition>('bottom-right');
  const [opacity, setOpacity] = useState(0.8);
  const [scale, setScale] = useState(0.3);
  const [signers, setSigners] = useState<Signer[]>([
    { id: '1', name: 'Authorizer 1', role: 'Director', signatureUrl: null, isDrawing: false }
  ]);
  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []) as File[];
    const newDocs: BulkDocument[] = uploadedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      previewUrl: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...newDocs]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const addSigner = () => {
    if (signers.length >= 4) return;
    setSigners([...signers, { 
      id: Math.random().toString(36).substr(2, 9), 
      name: `Signer ${signers.length + 1}`, 
      role: 'Partner/Manager', 
      signatureUrl: null, 
      isDrawing: false 
    }]);
  };

  const removeSigner = (id: string) => {
    if (signers.length <= 1) return;
    setSigners(signers.filter(s => s.id !== id));
  };

  const handleSignatureUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateSignerSignature(id, url);
    }
  };

  const updateSignerSignature = (id: string, url: string) => {
    setSigners(prev => prev.map(s => s.id === id ? { ...s, signatureUrl: url, isDrawing: false } : s));
    setActiveDrawingId(null);
  };

  const positions: { id: StampPosition; label: string }[] = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'center', label: 'Center' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-700">
      {/* Sidebar */}
      <div className="lg:col-span-4 space-y-8">
        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
          <header>
            <div className="flex p-1.5 bg-slate-200 rounded-[28px] mb-8">
              <button onClick={() => setMode('stamp')} className={`flex-1 py-4 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all ${mode === 'stamp' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-500'}`}>Bulk Stamp</button>
              <button onClick={() => setMode('sign')} className={`flex-1 py-4 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all ${mode === 'sign' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-500'}`}>Bulk Sign</button>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <Settings2 size={28} className="text-blue-600" /> {mode === 'stamp' ? 'Stamp Specs' : 'Workflow'}
            </h3>
          </header>

          <div className="space-y-8">
            {mode === 'sign' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signers ({signers.length}/4)</label>
                  <button onClick={addSigner} className="text-xs font-black text-blue-600 flex items-center gap-1"><Plus size={14} /> Add Signer</button>
                </div>
                <div className="space-y-4">
                  {signers.map((s, idx) => (
                    <div key={s.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4 group">
                      <div className="flex items-center gap-3">
                        <span className="bg-white text-slate-400 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-slate-100">{idx + 1}</span>
                        <input value={s.name} onChange={(e) => setSigners(prev => prev.map(it => it.id === s.id ? {...it, name: e.target.value} : it))} className="bg-transparent border-none p-0 text-sm font-black text-slate-900 focus:ring-0 w-full" />
                        {signers.length > 1 && <button onClick={() => removeSigner(s.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative h-24 bg-white border border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-all">
                           {s.signatureUrl ? <img src={s.signatureUrl} alt="Sig" className="max-h-full p-2" /> : <div className="text-center"><Upload size={16} className="mx-auto text-slate-200 mb-1" /><span className="text-[10px] font-bold text-slate-400 uppercase">Upload</span></div>}
                           <input type="file" accept="image/*" onChange={(e) => handleSignatureUpload(s.id, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <button onClick={() => setActiveDrawingId(s.id)} className="h-24 bg-white border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all group">
                           <PenTool size={16} className="text-slate-200 mb-1 group-hover:text-blue-500" />
                           <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-blue-600">Draw Directly</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Placement Position</label>
              <div className="grid grid-cols-3 gap-2">
                {positions.map(p => (
                  <button key={p.id} onClick={() => setPosition(p.id)} className={`text-[10px] font-black py-3 rounded-xl border transition-all ${position === p.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white'}`}>{p.label}</button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-center"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impression Scale</label><span className="text-xs font-black text-blue-600">{Math.round(scale * 100)}%</span></div>
               <input type="range" min="0.1" max="0.8" step="0.05" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <button onClick={onStartBulk} disabled={files.length === 0} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3">
              <Zap size={24} className="text-blue-400" /> Execute Bulk Run
            </button>
            <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-widest mt-6 flex items-center justify-center gap-2"><ShieldCheck size={14} /> End-to-End Encrypted</p>
          </div>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="lg:col-span-8 space-y-12">
        <div className="bg-white border-4 border-dashed border-slate-100 rounded-[64px] p-20 text-center relative group hover:border-blue-400 transition-all shadow-sm">
          <input type="file" multiple accept=".pdf,.doc,.docx,image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
          <Upload size={48} className="mx-auto text-slate-100 mb-6 group-hover:text-blue-500 transition-all" />
          <h4 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Queue Documents</h4>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Drop PDF, Word or Image files here</p>
        </div>

        {files.length > 0 && (
          <div className="bg-slate-900 rounded-[64px] p-16 md:p-24 overflow-hidden relative shadow-2xl">
            <div className="relative z-10 text-center">
              <h4 className="text-white font-black text-3xl mb-12 tracking-tighter">Live Document Preview</h4>
              <div className="aspect-[3/4] max-w-sm mx-auto bg-white rounded-xl shadow-2xl relative overflow-hidden p-12">
                <div className="w-full h-full border-2 border-slate-50 rounded p-6 space-y-4 opacity-10">
                  <div className="h-6 w-3/4 bg-slate-200 rounded-full"></div>
                  <div className="h-4 w-1/2 bg-slate-200 rounded-full"></div>
                  <div className="h-60 w-full bg-slate-100 rounded-[32px]"></div>
                  <div className="h-6 w-full bg-slate-200 rounded-full"></div>
                  <div className="h-6 w-5/6 bg-slate-200 rounded-full"></div>
                </div>

                {/* Layer Overlay */}
                <div 
                  className={`absolute transition-all duration-700 ease-in-out pointer-events-none ${mode === 'sign' ? 'flex flex-col gap-6 items-center' : ''}`}
                  style={{
                    transform: `scale(${scale})`,
                    opacity: opacity,
                    ...(position === 'top-left' && { top: '40px', left: '40px' }),
                    ...(position === 'top-right' && { top: '40px', right: '40px' }),
                    ...(position === 'bottom-left' && { bottom: '40px', left: '40px' }),
                    ...(position === 'bottom-right' && { bottom: '40px', right: '40px' }),
                    ...(position === 'center' && { top: '50%', left: '50%', marginTop: '-300px', marginLeft: '-300px' }),
                  }}
                >
                  {mode === 'stamp' ? (
                    <SVGPreview config={config} className="!p-0 !bg-transparent border-none shadow-none" />
                  ) : (
                    <div className="space-y-10">
                      {signers.map(s => (
                        <div key={s.id} className="text-center">
                          {s.signatureUrl ? <img src={s.signatureUrl} className="h-48 mx-auto grayscale contrast-150" alt="Sig" /> : <div className="w-80 h-48 border-4 border-dashed border-blue-200 rounded-[48px] flex items-center justify-center text-blue-200 font-black uppercase text-sm tracking-widest">Awaiting Signer: {s.name}</div>}
                          <div className="mt-6 text-slate-900 font-black uppercase text-xs tracking-widest border-t-4 border-slate-900 pt-4">{s.name} • {s.role}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signature Pad Modal */}
      {activeDrawingId && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-[150] flex items-center justify-center p-4">
          <SignaturePad 
            onSave={(url) => updateSignerSignature(activeDrawingId, url)} 
            onCancel={() => setActiveDrawingId(null)} 
          />
        </div>
      )}
    </div>
  );
};

export default BulkStamper;
