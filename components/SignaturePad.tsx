
import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Check, X } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black">Draw Your Signature</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
        </div>
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="w-full h-48 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseUp={endDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={endDrawing}
          onTouchMove={draw}
        />
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button onClick={clear} className="py-4 border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50">
            <Trash2 size={18} /> Clear
          </button>
          <button onClick={save} className="py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700">
            <Check size={18} /> Apply
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">Digital Signatures for Official KE Use</p>
      </div>
    </div>
  );
};

export default SignaturePad;
