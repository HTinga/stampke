
import React, { useState, useRef, useEffect } from 'react';
import { StampConfig } from '../types';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { Upload, Download, MousePointer, Maximize, Move, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface StampApplierProps {
  config: StampConfig;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

interface PlacedStamp {
  id: string;
  x: number; // percentage
  y: number; // percentage
  scale: number;
  page: number;
}

const StampApplier: React.FC<StampApplierProps> = ({ config, svgRef }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [placedStamps, setPlacedStamps] = useState<PlacedStamp[]>([]);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      setPlacedStamps([]);
    }
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    setPageDimensions({ width: viewport.width, height: viewport.height });

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    await page.render(renderContext).promise;
  };

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage]);

  const addStamp = (e: React.MouseEvent) => {
    if (!containerRef.current || !pdfDoc) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newStamp: PlacedStamp = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      scale: 0.5,
      page: currentPage
    };

    setPlacedStamps([...placedStamps, newStamp]);
    setSelectedStampId(newStamp.id);
  };

  const updateStamp = (id: string, updates: Partial<PlacedStamp>) => {
    setPlacedStamps(placedStamps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeStamp = (id: string) => {
    setPlacedStamps(placedStamps.filter(s => s.id !== id));
    setSelectedStampId(null);
  };

  const svgToImage = async (): Promise<string> => {
    if (!svgRef.current) return '';
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Set high resolution for the stamp
    canvas.width = 1000;
    canvas.height = 1000;
    
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, 1000, 1000);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = url;
    });
  };

  const applyAndDownload = async () => {
    if (!pdfFile || placedStamps.length === 0) return;
    setIsProcessing(true);

    try {
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const stampImageUrl = await svgToImage();
      const stampImage = await pdfDoc.embedPng(stampImageUrl);

      for (const placed of placedStamps) {
        const page = pdfDoc.getPage(placed.page - 1);
        const { width, height } = page.getSize();
        
        const stampWidth = 150 * placed.scale;
        const stampHeight = 150 * placed.scale;
        
        // Convert percentage to PDF coordinates (y is from bottom in pdf-lib)
        const xPos = (placed.x / 100) * width - (stampWidth / 2);
        const yPos = height - ((placed.y / 100) * height) - (stampHeight / 2);

        page.drawImage(stampImage, {
          x: xPos,
          y: yPos,
          width: stampWidth,
          height: stampHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stamped_${pdfFile.name}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error applying stamps:', error);
      alert('Failed to apply stamps. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 rounded-[40px] overflow-hidden border border-slate-200 dark:border-slate-800">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <Upload size={20} />
          </div>
          <div>
            <h3 className="font-black text-lg">Apply Stamp to Document</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Upload PDF & Place Stamp</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!pdfFile ? (
            <label className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm cursor-pointer hover:bg-blue-700 transition-all flex items-center gap-2">
              <Upload size={18} /> Select PDF
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 disabled:opacity-30"
                >
                  <MousePointer size={16} className="rotate-180" />
                </button>
                <span className="text-xs font-black">PAGE {currentPage} / {numPages}</span>
                <button 
                  onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                  disabled={currentPage === numPages}
                  className="p-1 disabled:opacity-30"
                >
                  <MousePointer size={16} />
                </button>
              </div>
              <button 
                onClick={applyAndDownload}
                disabled={isProcessing || placedStamps.length === 0}
                className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : <><Download size={18} /> Download Stamped PDF</>}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar Controls */}
        {pdfFile && (
          <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 overflow-y-auto">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Placed Stamps</h4>
            <div className="space-y-3">
              {placedStamps.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                  <MousePointer size={32} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-xs font-bold text-slate-400">Click on the document to place your stamp.</p>
                </div>
              ) : (
                placedStamps.map((s) => (
                  <div 
                    key={s.id} 
                    onClick={() => setSelectedStampId(s.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedStampId === s.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase text-blue-600">Stamp #{s.id.slice(0, 4)}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeStamp(s.id); }} className="text-red-500 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-[10px] font-bold text-slate-500">Size</label>
                          <span className="text-[10px] font-bold text-slate-400">{Math.round(s.scale * 100)}%</span>
                        </div>
                        <input 
                          type="range" min="0.1" max="2" step="0.05"
                          value={s.scale}
                          onChange={(e) => updateStamp(s.id, { scale: parseFloat(e.target.value) })}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400">Page: {s.page}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-10 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <CheckCircle2 size={16} />
                <span className="text-[10px] font-black uppercase">Pro Tip</span>
              </div>
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed">
                You can place multiple stamps across different pages. They will all be embedded in the final PDF.
              </p>
            </div>
          </div>
        )}

        {/* PDF Preview Area */}
        <div className="flex-1 bg-slate-200 dark:bg-slate-900 p-8 overflow-auto flex justify-center items-start custom-scrollbar">
          {!pdfFile ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[32px] flex items-center justify-center text-slate-300 mb-6 shadow-xl">
                <Upload size={40} />
              </div>
              <h3 className="text-2xl font-black mb-2">No Document Selected</h3>
              <p className="text-slate-500 font-medium mb-8">Upload a PDF document to start applying your professional stamp.</p>
              <label className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-lg cursor-pointer hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200">
                Select PDF File
                <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          ) : (
            <div 
              ref={containerRef}
              className="relative bg-white shadow-2xl cursor-crosshair"
              style={{ width: pageDimensions.width, height: pageDimensions.height }}
              onClick={addStamp}
            >
              <canvas ref={canvasRef} className="block" />
              
              {/* Placed Stamps Overlay */}
              {placedStamps.filter(s => s.page === currentPage).map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`absolute group ${selectedStampId === s.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                  style={{ 
                    left: `${s.x}%`, 
                    top: `${s.y}%`, 
                    transform: 'translate(-50%, -50%)',
                    width: 150 * s.scale,
                    height: 150 * s.scale,
                    pointerEvents: 'auto'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStampId(s.id);
                  }}
                >
                  <div className="w-full h-full pointer-events-none opacity-80">
                    {/* Simplified SVG preview for the overlay */}
                    <div className="w-full h-full bg-blue-600/10 border-2 border-blue-600/30 rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-black text-blue-600 uppercase">STAMP</span>
                    </div>
                  </div>
                  
                  {/* Controls Overlay */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-full shadow-xl z-20">
                    <button onClick={(e) => { e.stopPropagation(); removeStamp(s.id); }} className="p-1 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                    <div className="w-px h-3 bg-slate-700" />
                    <button onClick={(e) => { e.stopPropagation(); updateStamp(s.id, { scale: Math.min(2, s.scale + 0.1) }); }} className="p-1 hover:text-blue-400">
                      <Maximize size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StampApplier;
