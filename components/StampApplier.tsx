import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StampConfig } from '../types';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { Upload, Download, Trash2, CheckCircle2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Move, MousePointer, RotateCcw } from 'lucide-react';
import SVGPreview from './SVGPreview';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface StampApplierProps {
  config: StampConfig;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

interface PlacedStamp {
  id: string;
  x: number;   // pixels from left of canvas
  y: number;   // pixels from top of canvas
  size: number; // px width/height
  page: number;
}

const StampApplier: React.FC<StampApplierProps> = ({ config, svgRef }) => {
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
  const buildStampUrl = useCallback(async () => {
    const el = internalSvgRef.current || svgRef.current;
    if (!el) return;
    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('width', '600'); clone.setAttribute('height', '600');
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    await new Promise<void>(res => {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, 600, 600); URL.revokeObjectURL(url); res(); };
      img.onerror = () => { URL.revokeObjectURL(url); res(); };
      img.src = url;
    });
    setStampUrl(canvas.toDataURL('image/png'));
  }, [config, svgRef]);

  useEffect(() => { buildStampUrl(); }, [config]);

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
    if (!pdfFile || placedStamps.length === 0) return;
    setIsProcessing(true);
    try {
      const existingBytes = await pdfFile.arrayBuffer();
      const doc = await PDFDocument.load(existingBytes);
      const b64 = stampUrl.split(',')[1];
      const img = await doc.embedPng(b64);

      for (const s of placedStamps) {
        const page = doc.getPage(s.page - 1);
        const { width, height } = page.getSize();
        // Scale from canvas pixels back to PDF points
        const scaleX = width / canvasSize.w;
        const scaleY = height / canvasSize.h;
        const pdfX = s.x * scaleX;
        const pdfY = height - (s.y + s.size) * scaleY;
        page.drawImage(img, {
          x: pdfX, y: pdfY,
          width: s.size * scaleX,
          height: s.size * scaleY,
        });
      }

      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob),
        download: `stamped_${pdfFile.name}`,
      });
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error(err);
      alert('Export failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const pageStamps = placedStamps.filter(s => s.page === currentPage);
  const selected = placedStamps.find(s => s.id === selectedId);

  return (
    <div className="flex flex-col h-full bg-[#020b18] -m-5 md:-m-8" style={{ minHeight: 'calc(100vh - 56px)' }}>

      {/* Hidden SVG renderer */}
      <div className="fixed -left-[9999px] opacity-0 pointer-events-none">
        <SVGPreview config={config} ref={internalSvgRef} />
      </div>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[#0e3a72] bg-[#020b18] flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#134589] rounded-xl flex items-center justify-center">
            <Upload size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Stamp Applier</p>
            <p className="text-[10px] text-[#4d7291]">{pdfFile ? pdfFile.name : 'Upload a PDF to begin'}</p>
          </div>
        </div>

        {pdfFile && (
          <>
            {/* Page navigation */}
            <div className="flex items-center gap-1 bg-[#041628] border border-[#0e3a72] rounded-xl px-2 py-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
                className="p-1 disabled:opacity-30 hover:text-white text-[#7ab3e8] transition-colors">
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-bold text-white px-1">{currentPage} / {numPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages}
                className="p-1 disabled:opacity-30 hover:text-white text-[#7ab3e8] transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-[#041628] border border-[#0e3a72] rounded-xl px-2 py-1">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1 text-[#7ab3e8] hover:text-white">
                <ZoomOut size={14} />
              </button>
              <span className="text-xs font-bold text-white px-1">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2.5, z + 0.25))} className="p-1 text-[#7ab3e8] hover:text-white">
                <ZoomIn size={14} />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="flex bg-[#041628] border border-[#0e3a72] rounded-xl p-1 gap-1">
              <button onClick={() => setMode('place')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'place' ? 'bg-[#134589] text-white' : 'text-[#7ab3e8] hover:text-white'}`}>
                <MousePointer size={13} /> Place
              </button>
              <button onClick={() => setMode('select')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'select' ? 'bg-[#134589] text-white' : 'text-[#7ab3e8] hover:text-white'}`}>
                <Move size={13} /> Move
              </button>
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {!pdfFile ? (
            <label className="flex items-center gap-2 px-4 py-2 bg-[#134589] hover:bg-[#1a5cad] text-white rounded-xl text-sm font-bold cursor-pointer transition-colors">
              <Upload size={15} /> Select PDF
              <input type="file" accept="application/pdf" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
          ) : (
            <button onClick={exportPDF} disabled={isProcessing || placedStamps.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors">
              {isProcessing ? <span className="animate-spin">⏳</span> : <Download size={15} />}
              {isProcessing ? 'Processing…' : `Export (${placedStamps.length})`}
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar — stamp list + controls */}
        {pdfFile && (
          <div className="w-56 md:w-64 flex-shrink-0 border-r border-[#0e3a72] bg-[#020b18] flex flex-col overflow-hidden">
            {/* Stamp preview */}
            <div className="p-4 border-b border-[#0e3a72]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4d7291] mb-3">Current Stamp</p>
              <div className="w-full aspect-square bg-[#041628] border border-[#0e3a72] rounded-xl flex items-center justify-center overflow-hidden">
                {stampUrl ? (
                  <img src={stampUrl} alt="stamp" className="w-4/5 h-4/5 object-contain" />
                ) : (
                  <div className="text-[#0e3a72] text-xs">Loading…</div>
                )}
              </div>
            </div>

            {/* Placed stamps list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#4d7291]">Placed ({placedStamps.length})</p>
                {placedStamps.length > 0 && (
                  <button onClick={() => { setPlacedStamps([]); setSelectedId(null); }}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors">
                    Clear all
                  </button>
                )}
              </div>

              {placedStamps.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-[#0e3a72] rounded-xl">
                  <MousePointer size={20} className="mx-auto text-[#0e3a72] mb-2" />
                  <p className="text-[10px] text-[#365874] font-medium">
                    {mode === 'place' ? 'Click the document to place' : 'Switch to Place mode first'}
                  </p>
                </div>
              ) : (
                placedStamps.map((s, i) => (
                  <div key={s.id} onClick={() => { setSelectedId(s.id); setMode('select'); }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedId === s.id ? 'border-[#134589] bg-[#041628]' : 'border-[#0e3a72] bg-[#020b18] hover:border-[#134589]/50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#134589]/20 rounded-lg flex items-center justify-center">
                          <span className="text-[9px] font-bold text-[#4d93d9]">S{i + 1}</span>
                        </div>
                        <span className="text-xs font-semibold text-white">Page {s.page}</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setPlacedStamps(ps => ps.filter(p => p.id !== s.id)); if (selectedId === s.id) setSelectedId(null); }}
                        className="p-1 hover:text-red-400 text-[#4d7291] transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {selectedId === s.id && (
                      <div className="mt-2.5 space-y-2">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] text-[#4d7291] font-medium">Size</span>
                            <span className="text-[10px] font-bold text-white">{Math.round(s.size)}px</span>
                          </div>
                          <input type="range" min={40} max={400} value={s.size}
                            onChange={e => setPlacedStamps(ps => ps.map(p => p.id === s.id ? { ...p, size: +e.target.value } : p))}
                            className="w-full h-1.5 appearance-none rounded-full cursor-pointer"
                            style={{ accentColor: '#134589' }} />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#4d7291]">
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
            <div className="p-3 border-t border-[#0e3a72]">
              <div className="bg-[#041628] rounded-xl p-3 border border-[#0e3a72]">
                <div className="flex items-center gap-1.5 text-[#4d93d9] mb-1.5">
                  <CheckCircle2 size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Tip</span>
                </div>
                <p className="text-[10px] text-[#4d7291] leading-relaxed">
                  {mode === 'place'
                    ? 'Click anywhere on the document to place a stamp. Switch to Move mode to reposition.'
                    : 'Drag stamps to reposition. Use the size slider to resize. Click Place to add more.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PDF canvas area */}
        <div ref={wrapRef} className="flex-1 overflow-auto bg-[#041628] flex items-start justify-center p-6 md:p-10"
          style={{ cursor: pdfFile ? (mode === 'place' ? 'crosshair' : 'default') : 'default' }}>
          {!pdfFile ? (
            <label className="flex flex-col items-center justify-center w-full max-w-md aspect-[3/4] border-2 border-dashed border-[#0e3a72] hover:border-[#134589] rounded-3xl cursor-pointer transition-all group bg-[#020b18] hover:bg-[#041628]">
              <input type="file" accept="application/pdf" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="w-16 h-16 bg-[#041628] border border-[#134589] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Upload size={28} className="text-[#4d93d9]" />
              </div>
              <p className="text-lg font-bold text-white mb-1">Drop PDF here</p>
              <p className="text-sm text-[#4d7291]">or click to browse</p>
              <p className="text-[11px] text-[#224260] mt-4">Supports PDF files only</p>
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
                        <div className="w-1.5 h-1.5 bg-[#020b18] rounded-full" />
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
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-[#020b18]/80 backdrop-blur-sm rounded-xl border border-[#0e3a72] pointer-events-none">
                {mode === 'place' ? (
                  <>
                    <MousePointer size={12} className="text-[#4d93d9]" />
                    <span className="text-[10px] font-bold text-[#4d93d9]">Click to place stamp</span>
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
    </div>
  );
};

export default StampApplier;
