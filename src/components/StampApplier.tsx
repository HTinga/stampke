import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, Trash2, CheckCircle2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Move, MousePointer, RotateCcw, PenTool, X, Layers } from 'lucide-react';
import SVGPreview from './SVGPreview';
import { useStampStore } from '../store';
import { renderStampToPng } from '../utils/stampRenderer';
import { StampConfig } from '../types';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface StampApplierProps {
  config: StampConfig;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onGoToStudio?: () => void;
  userStampCount?: number;
}

interface PlacedStamp {
  id: string;
  x: number;   // pixels from left of canvas
  y: number;   // pixels from top of canvas
  size: number; // px width/height
  page: number;
  config?: StampConfig; // Optional: specific config for this instance (e.g. with serial)
}

const StampApplier: React.FC<StampApplierProps> = ({ config, svgRef, onGoToStudio, userStampCount = 0 }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [placedStamps, setPlacedStamps] = useState<PlacedStamp[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stampUrl, setStampUrl] = useState<string>('');
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<'place' | 'select'>('place');
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startSize: number } | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [progress, setProgress] = useState(0);
  const { customTemplates, config: globalConfig, setConfig: setGlobalConfig, fetchTemplates, logAudit } = useStampStore();
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const internalSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ── Render PDF page ──────────────────────────────────────
  const renderPage = useCallback(async (pageNum: number, z = zoom) => {
    if (!pdfDoc || !canvasRef.current) return;
    const page = await pdfDoc.getPage(pageNum);
    const vp = page.getViewport({ scale: 1.5 * z });
    const canvas = canvasRef.current;
    canvas.width = vp.width;
    canvas.height = vp.height;
    setCanvasSize({ w: vp.width, h: vp.height });
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
  }, [pdfDoc, zoom]);

  useEffect(() => { if (pdfDoc) renderPage(currentPage); }, [pdfDoc, currentPage, zoom]);

  // ── Generate stamp PNG from SVG ──────────────────────────
  const buildStampUrl = useCallback(async (pageNum: number) => {
    const el = internalSvgRef.current || svgRef.current;
    if (!el) return;

    // Determine the text to show (handle automatic serial numbering)
    let tempConfig = { ...config };
    if (config.serialConfig?.enabled) {
      const year = new Date().getFullYear();
      const serialNum = userStampCount + pageNum; 
      const serialStr = `STP-${year}-${serialNum.toString().padStart(5, '0')}`;
      const placeholder = '[SN]';
      
      const fields: (keyof StampConfig)[] = ['primaryText', 'secondaryText', 'centerText', 'centerSubText', 'innerTopText', 'innerBottomText'];
      fields.forEach(f => {
        if (typeof tempConfig[f] === 'string' && (tempConfig[f] as string).includes(placeholder)) {
          (tempConfig[f] as any) = (tempConfig[f] as string).replace(new RegExp('\\[SN\\]', 'g'), serialStr);
        }
      });
      if (tempConfig.customElements) {
        tempConfig.customElements = tempConfig.customElements.map(el => {
          if (el.type === 'text' && el.content.includes(placeholder)) {
            return { ...el, content: el.content.replace(new RegExp('\\[SN\\]', 'g'), serialStr) };
          }
          return el;
        });
      }
    }

    const url = await renderStampToPng(tempConfig);
    setStampUrl(url);
  }, [config, userStampCount, svgRef]);

  useEffect(() => { buildStampUrl(currentPage); }, [config, currentPage, config.serialConfig?.enabled]);
  
  useEffect(() => { fetchTemplates(); }, []);

  // ── File upload ──────────────────────────────────────────
  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return;
    setPdfFile(file);
    const ab = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(ab).promise;
    setPdfDoc(pdf);
    setNumPages(pdf.numPages);
    setCurrentPage(1);
    setPlacedStamps([]);
    
    // Generate thumbnails
    const thumbs: string[] = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) { // Limit to 50 for performance
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: 0.2 });
      const canvas = document.createElement('canvas');
      canvas.width = vp.width;
      canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
      thumbs.push(canvas.toDataURL());
    }
    setThumbnails(thumbs);
  };

  // ── Place stamp on click ─────────────────────────────────
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'place') return;
    const rect = containerRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left - 75;
    const y = e.clientY - rect.top - 75;
    const stamp: PlacedStamp = {
      id: Math.random().toString(36).slice(2, 9),
      x: Math.max(0, Math.min(x, canvasSize.w - 150)),
      y: Math.max(0, Math.min(y, canvasSize.h - 150)),
      size: 150,
      page: currentPage,
    };
    setPlacedStamps(ps => [...ps, stamp]);
    setSelectedId(stamp.id);
  };

  // ── Drag to move ─────────────────────────────────────────
  const onStampMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (mode !== 'select') return;
    setSelectedId(id);
    const s = placedStamps.find(p => p.id === id)!;
    setDragging({ id, ox: e.clientX - s.x, oy: e.clientY - s.y });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      const rect = containerRef.current!.getBoundingClientRect();
      const s = placedStamps.find(p => p.id === dragging.id)!;
      setPlacedStamps(ps => ps.map(p => p.id === dragging.id ? {
        ...p,
        x: Math.max(0, Math.min(e.clientX - dragging.ox, canvasSize.w - p.size)),
        y: Math.max(0, Math.min(e.clientY - dragging.oy, canvasSize.h - p.size)),
      } : p));
    }
    if (resizing) {
      const delta = e.clientX - resizing.startX;
      const newSize = Math.max(40, Math.min(400, resizing.startSize + delta));
      setPlacedStamps(ps => ps.map(p => p.id === resizing.id ? { ...p, size: newSize } : p));
    }
  };

  const onMouseUp = () => { setDragging(null); setResizing(null); };

  // ── Export stamped PDF ───────────────────────────────────
  const exportPDF = async () => {
    if (!pdfFile || (placedStamps.length === 0)) return;
    setIsProcessing(true);
    setProgress(0);
    try {
      const existingBytes = await pdfFile.arrayBuffer();
      const doc = await PDFDocument.load(existingBytes);
      
      // Cache for embedded images to avoid redundant embedding
      const imageCache = new Map<string, any>();

      // Group stamps by page to process sequentially
      const stampsByPage = new Map<number, PlacedStamp[]>();
      placedStamps.forEach(s => {
        const list = stampsByPage.get(s.page) || [];
        list.push(s);
        stampsByPage.set(s.page, list);
      });

      const pages = doc.getPages();
      
      for (let i = 0; i < pages.length; i++) {
        const pageIdx = i;
        const pageNum = i + 1;
        const pageStamps = stampsByPage.get(pageNum) || [];
        if (pageStamps.length === 0) continue;

        const pdfPage = pages[pageIdx];
        const { width, height } = pdfPage.getSize();
        const scaleX = width / canvasSize.w;
        const scaleY = height / canvasSize.h;

        // Update progress
        setProgress(Math.round(((i + 1) / pages.length) * 100));

        for (const s of pageStamps) {
          let currentStampUrl = stampUrl;
          
          // Handle Automatic Sequential Numbering
          if (config.serialConfig?.enabled) {
            const now = new Date();
            const year = now.getFullYear().toString();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const serialNum = userStampCount + pageNum; 
            
            let serialStr = config.serialConfig.format || 'STP-{YYYY}-{NNNN}';
            serialStr = serialStr.replace(/\{YYYY\}/g, year);
            serialStr = serialStr.replace(/\{MM\}/g, month);
            serialStr = serialStr.replace(/\{DD\}/g, day);
            serialStr = serialStr.replace(/\{NNNN\}/g, serialNum.toString().padStart(4, '0'));
            serialStr = serialStr.replace(/\{NN\}/g, serialNum.toString().padStart(2, '0'));
            serialStr = serialStr.replace(/\{N\}/g, serialNum.toString());

            const placeholder = '[SN]';
            const tempConfig = { ...config };
            const fieldsToUpdate: (keyof StampConfig)[] = ['primaryText', 'secondaryText', 'centerText', 'centerSubText', 'innerTopText', 'innerBottomText'];
            
            // 1. Replace [SN] in specific target field or all fields if [SN] is present
            fieldsToUpdate.forEach(field => {
              if (typeof tempConfig[field] === 'string') {
                const val = tempConfig[field] as string;
                if (val.includes(placeholder)) {
                   (tempConfig[field] as any) = val.replace(new RegExp('\\[SN\\]', 'g'), serialStr);
                }
              }
            });

            // 2. Also handle if targetField is set but [SN] might be missing (append it?)
            const target = config.serialConfig.targetField === 'primary' ? 'primaryText' :
                           config.serialConfig.targetField === 'secondary' ? 'secondaryText' :
                           config.serialConfig.targetField === 'center' ? 'centerText' :
                           config.serialConfig.targetField === 'centerSub' ? 'centerSubText' :
                           config.serialConfig.targetField === 'innerTop' ? 'innerTopText' : 'innerBottomText';
            
            if (typeof tempConfig[target] === 'string' && !(tempConfig[target] as string).includes(serialStr)) {
               // If [SN] was NOT used, we might want to just append or replace?
               // The user is told to use [SN], so we'll stick to that for now to avoid overwriting wanted text.
            }

            if (tempConfig.customElements) {
              tempConfig.customElements = tempConfig.customElements.map(el => {
                if (el.type === 'text' && el.content.includes(placeholder)) {
                  return { ...el, content: el.content.replace(new RegExp('\\[SN\\]', 'g'), serialStr) };
                }
                return el;
              });
            }

            currentStampUrl = await renderStampToPng(tempConfig);
          }

          if (!currentStampUrl) continue;
          const b64 = currentStampUrl.split(',')[1];
          const img = await doc.embedPng(b64);
          
          const pdfX = s.x * scaleX;
          const pdfY = height - (s.y + s.size) * scaleY;
          
          pdfPage.drawImage(img, {
            x: pdfX, y: pdfY,
            width: s.size * scaleX,
            height: s.size * scaleY,
          });
        }
      }

      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob),
        download: `stamped_${pdfFile.name}`,
      });
      a.click();
      URL.revokeObjectURL(a.href);

      // Log to audit trail
      await logAudit('Document Stamped', `Stamped document: ${pdfFile.name} with ${placedStamps.length} stamps.`);
    } catch (err) {
      console.error(err);
      alert('Export failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyToAllPages = () => {
    if (!pdfFile || placedStamps.length === 0) {
      alert('Place at least one stamp first to use as a template.');
      return;
    }
    const lastStamp = placedStamps[placedStamps.length - 1];
    const newStamps: PlacedStamp[] = [];
    for (let p = 1; p <= numPages; p++) {
      if (p === lastStamp.page) continue;
      newStamps.push({
        ...lastStamp,
        id: Math.random().toString(36).slice(2, 9),
        page: p
      });
    }
    setPlacedStamps(prev => [...prev.filter(s => s.page === lastStamp.page), ...newStamps]);
  };

  const pageStamps = placedStamps.filter(s => s.page === currentPage);
  const selected = placedStamps.find(s => s.id === selectedId);

  return (
    <div className="flex flex-col bg-[#0d1117] relative">

      {/* Hidden SVG renderer */}
      <div className="fixed -left-[9999px] opacity-0 pointer-events-none">
        <SVGPreview config={config} ref={internalSvgRef} />
      </div>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[#30363d] bg-[#0d1117] flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1f6feb] rounded-xl flex items-center justify-center">
            <Upload size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Stamp Applier</p>
            <p className="text-[10px] text-[#8b949e]">{pdfFile ? pdfFile.name : 'Upload a PDF to begin'}</p>
          </div>
        </div>

        {pdfFile && (
          <>
            {/* Page navigation */}
            <div className="flex items-center gap-1 bg-[#161b22] border border-[#30363d] rounded-xl px-2 py-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
                className="p-1 disabled:opacity-30 hover:text-white text-[#8b949e] transition-colors">
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-bold text-white px-1">{currentPage} / {numPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages}
                className="p-1 disabled:opacity-30 hover:text-white text-[#8b949e] transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-[#161b22] border border-[#30363d] rounded-xl px-2 py-1">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1 text-[#8b949e] hover:text-white">
                <ZoomOut size={14} />
              </button>
              <span className="text-xs font-bold text-white px-1">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2.5, z + 0.25))} className="p-1 text-[#8b949e] hover:text-white">
                <ZoomIn size={14} />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="flex bg-[#161b22] border border-[#30363d] rounded-xl p-1 gap-1">
              <button onClick={() => setMode('place')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'place' ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-white'}`}>
                <MousePointer size={13} /> Place
              </button>
              <button onClick={() => setMode('select')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'select' ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-white'}`}>
                <Move size={13} /> Move
              </button>
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {pdfFile && (
             <button onClick={() => setShowGallery(true)}
               className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff] text-[#8b949e] hover:text-white rounded-xl text-xs font-bold transition-colors">
               <RotateCcw size={14} /> From Templates
             </button>
          )}
          {!pdfFile ? (
            <label className="flex items-center gap-2 px-4 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold cursor-pointer transition-colors">
              <Upload size={15} /> Select PDF
              <input type="file" accept="application/pdf" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
          ) : (
            <button onClick={exportPDF} disabled={isProcessing || placedStamps.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-all relative overflow-hidden min-w-[140px] justify-center">
              {isProcessing && (
                <div className="absolute inset-0 bg-emerald-800/50 transition-all" style={{ width: `${progress}%` }} />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {isProcessing ? <span className="animate-spin text-[10px]">⏳</span> : <Download size={15} />}
                {isProcessing ? `Processing ${progress}%` : `Export (${placedStamps.length})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Page Thumbnails Sidebar */}
        {pdfFile && thumbnails.length > 0 && (
          <div className="w-24 md:w-32 flex-shrink-0 border-r border-[#30363d] bg-[#0d1117] flex flex-col overflow-y-auto">
            <div className="p-2 border-b border-[#30363d]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] text-center">Pages</p>
            </div>
            <div className="flex flex-col gap-3 p-2">
              {thumbnails.map((thumb, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all ${currentPage === idx + 1 ? 'border-[#1f6feb] scale-95 shadow-[0_0_15px_rgba(31,111,235,0.4)]' : 'border-[#30363d] hover:border-[#8b949e]'}`}
                >
                  <img src={thumb} alt={`Page ${idx + 1}`} className="w-full aspect-[3/4] object-cover" />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white py-0.5 text-center font-bold">
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar — stamp list + controls */}
        {pdfFile && (
          <div className="w-56 md:w-64 flex-shrink-0 border-r border-[#30363d] bg-[#0d1117] flex flex-col overflow-y-auto h-[calc(100vh-120px)] sticky top-0">
            {/* Stamp preview */}
            <div className="p-4 border-b border-[#30363d]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">Current Stamp</p>
              </div>
              <div className="w-full aspect-square bg-[#161b22] border border-[#30363d] rounded-xl flex items-center justify-center overflow-hidden">
                {stampUrl ? (
                  <img src={stampUrl} alt="stamp" className="w-4/5 h-4/5 object-contain" />
                ) : (
                  <div className="text-[#0e3a72] text-xs">Loading…</div>
                )}
              </div>
              {/* Edit / Create stamp buttons */}
              <div className="mt-3 space-y-2">
                <button
                  onClick={onGoToStudio}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <PenTool size={13} /> Edit in Studio
                </button>
                <button onClick={applyToAllPages} disabled={placedStamps.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#161b22] border border-[#30363d] hover:border-[#1f6feb] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                  <Layers size={13} /> Apply to All Pages
                </button>
              </div>
            </div>

            {/* Sequential Numbering Section */}
            <div className="p-4 border-b border-[#30363d] bg-[#1c2128]/30">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">Serial Numbering</p>
                <button 
                  onClick={() => setGlobalConfig({ serialConfig: { ...config.serialConfig, enabled: !config.serialConfig?.enabled } })}
                  className={`w-8 h-4 rounded-full transition-colors relative ${config.serialConfig?.enabled ? 'bg-emerald-600' : 'bg-[#30363d]'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${config.serialConfig?.enabled ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
              
              {config.serialConfig?.enabled && (
                <div className="space-y-1">
                  <p className="text-[10px] text-[#8b949e] italic leading-tight">
                    Automatic numbering enabled. [SN] placeholders will be replaced with serials (e.g. STP-2024-00001).
                  </p>
                </div>
              )}
            </div>

            {/* Placed stamps list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">Placed ({placedStamps.length})</p>
                {placedStamps.length > 0 && (
                  <button onClick={() => { setPlacedStamps([]); setSelectedId(null); }}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors">
                    Clear all
                  </button>
                )}
              </div>

              {placedStamps.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-[#30363d] rounded-xl">
                  <MousePointer size={20} className="mx-auto text-[#0e3a72] mb-2" />
                  <p className="text-[10px] text-[#8b949e] font-medium">
                    {mode === 'place' ? 'Click the document to place' : 'Switch to Place mode first'}
                  </p>
                </div>
              ) : (
                placedStamps.map((s, i) => (
                  <div key={s.id} onClick={() => { setSelectedId(s.id); setMode('select'); }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedId === s.id ? 'border-[#58a6ff] bg-[#161b22]' : 'border-[#30363d] bg-[#0d1117] hover:border-[#58a6ff]/50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#1f6feb]/20 rounded-lg flex items-center justify-center">
                          <span className="text-[9px] font-bold text-[#58a6ff]">S{i + 1}</span>
                        </div>
                        <span className="text-xs font-semibold text-white">Page {s.page}</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setPlacedStamps(ps => ps.filter(p => p.id !== s.id)); if (selectedId === s.id) setSelectedId(null); }}
                        className="p-1 hover:text-red-400 text-[#8b949e] transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {selectedId === s.id && (
                      <div className="mt-2.5 space-y-2">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] text-[#8b949e] font-medium">Size</span>
                            <span className="text-[10px] font-bold text-white">{Math.round(s.size)}px</span>
                          </div>
                          <input type="range" min={40} max={400} value={s.size}
                            onChange={e => setPlacedStamps(ps => ps.map(p => p.id === s.id ? { ...p, size: +e.target.value } : p))}
                            className="w-full h-1.5 appearance-none rounded-full cursor-pointer"
                            style={{ accentColor: '#134589' }} />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#8b949e]">
                          <div>X: <span className="text-white font-bold">{Math.round(s.x)}</span></div>
                          <div>Y: <span className="text-white font-bold">{Math.round(s.y)}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Tips */}
            <div className="p-3 border-t border-[#30363d]">
              <div className="bg-[#161b22] rounded-xl p-3 border border-[#30363d]">
                <div className="flex items-center gap-1.5 text-[#58a6ff] mb-1.5">
                  <CheckCircle2 size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Tip</span>
                </div>
                <p className="text-[10px] text-[#8b949e] leading-relaxed">
                  {mode === 'place'
                    ? 'Click anywhere on the document to place a stamp. Switch to Move mode to reposition.'
                    : 'Drag stamps to reposition. Use the size slider to resize. Click Place to add more.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PDF canvas area */}
        <div ref={wrapRef} className="flex-1 overflow-auto bg-[#161b22] flex items-start justify-center p-6 md:p-10"
          style={{ cursor: pdfFile ? (mode === 'place' ? 'crosshair' : 'default') : 'default' }}>
          {!pdfFile ? (
            <label className="flex flex-col items-center justify-center w-full max-w-md aspect-[3/4] border-2 border-dashed border-[#30363d] hover:border-[#58a6ff] rounded-3xl cursor-pointer transition-all group bg-[#0d1117] hover:bg-[#161b22]">
              <input type="file" accept="application/pdf" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="w-16 h-16 bg-[#161b22] border border-[#58a6ff] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Upload size={28} className="text-[#58a6ff]" />
              </div>
              <p className="text-lg font-bold text-white mb-1">Drop PDF here</p>
              <p className="text-sm text-[#8b949e]">or click to browse</p>
              <p className="text-[11px] text-[#e6edf3] mt-4">Supports PDF files only</p>
            </label>
          ) : (
            <div
              ref={containerRef}
              className="relative shadow-2xl shadow-black/50 flex-shrink-0"
              style={{ width: canvasSize.w, height: canvasSize.h }}
              onClick={handleCanvasClick}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <canvas ref={canvasRef} className="block" />

              {/* Stamp overlays */}
              {pageStamps.map(s => (
                <div
                  key={s.id}
                  className={`absolute select-none ${mode === 'select' ? 'cursor-move' : 'cursor-crosshair'}`}
                  style={{ left: s.x, top: s.y, width: s.size, height: s.size, zIndex: selectedId === s.id ? 20 : 10 }}
                  onMouseDown={e => onStampMouseDown(e, s.id)}
                  onClick={e => e.stopPropagation()}
                >
                  {stampUrl && (
                    <img
                      src={stampUrl}
                      alt="stamp"
                      className="w-full h-full object-contain pointer-events-none"
                      style={{
                        filter: selectedId === s.id ? 'drop-shadow(0 0 8px rgba(0,200,255,0.6))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
                        transition: 'filter 0.15s',
                      }}
                      draggable={false}
                    />
                  )}
                  {/* Selection border */}
                  {selectedId === s.id && (
                    <>
                      <div className="absolute inset-0 border-2 border-[#00c8ff] rounded pointer-events-none" style={{ margin: -2 }} />
                      {/* Resize handle */}
                      <div
                        className="absolute -bottom-2 -right-2 w-5 h-5 bg-[#00c8ff] rounded-full cursor-se-resize z-30 flex items-center justify-center border-2 border-[#020b18]"
                        onMouseDown={e => { e.stopPropagation(); setResizing({ id: s.id, startX: e.clientX, startSize: s.size }); }}
                      >
                        <div className="w-1.5 h-1.5 bg-[#0d1117] rounded-full" />
                      </div>
                      {/* Delete button */}
                      <button
                        className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 hover:bg-red-400 rounded-full z-30 flex items-center justify-center text-white border-2 border-[#020b18] transition-colors"
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); setPlacedStamps(ps => ps.filter(p => p.id !== s.id)); setSelectedId(null); }}
                      >
                        <span className="text-[10px] font-bold">×</span>
                      </button>
                    </>
                  )}
                </div>
              ))}

              {/* Mode indicator */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117]/80 backdrop-blur-sm rounded-xl border border-[#30363d] pointer-events-none">
                {mode === 'place' ? (
                  <>
                    <MousePointer size={12} className="text-[#58a6ff]" />
                    <span className="text-[10px] font-bold text-[#58a6ff]">Click to place stamp</span>
                  </>
                ) : (
                  <>
                    <Move size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400">Drag to reposition</span>
                  </>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      {/* ── Template Gallery Modal ── */}
      {showGallery && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] w-full max-w-2xl rounded-3xl border border-[#30363d] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/50">
              <div>
                <h3 className="text-lg font-bold text-white">Template Gallery</h3>
                <p className="text-xs text-[#8b949e]">Select a saved stamp to apply</p>
              </div>
              <button onClick={() => setShowGallery(false)} className="ss-tool-icon bg-[#30363d] hover:bg-[#484f58]">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {customTemplates.length === 0 ? (
                <div className="text-center py-20">
                  <PenTool size={40} className="mx-auto text-[#30363d] mb-4" />
                  <p className="text-[#8b949e]">No saved templates found.</p>
                  <button onClick={() => { setShowGallery(false); if (onGoToStudio) onGoToStudio(); }} 
                    className="mt-4 text-[#58a6ff] font-bold text-sm hover:underline">
                    Go to Studio to design one
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {customTemplates.map(t => (
                    <button key={t.id} onClick={() => { setGlobalConfig(t.config); setShowGallery(false); }}
                      className="group flex flex-col items-center bg-[#0d1117] border border-[#30363d] hover:border-[#1f6feb] p-4 rounded-3xl transition-all hover:scale-[1.02]">
                      <div className="w-full aspect-square mb-3 relative flex items-center justify-center bg-[#161b22] rounded-2xl border border-[#30363d] group-hover:border-[#1f6feb]/30 overflow-hidden">
                         {(t as any).svgPreview ? (
                            <img src={(t as any).svgPreview} alt={t.name} className="w-full h-full object-contain" />
                         ) : (
                            <PenTool size={24} className="text-[#30363d] group-hover:text-[#1f6feb]" />
                         )}
                      </div>
                      <span className="text-xs font-bold text-white truncate w-full">{t.name}</span>
                      <span className="text-[10px] text-[#8b949e] uppercase mt-1">Template</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StampApplier;
