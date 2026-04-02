import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCw, RotateCcw, Trash2, Plus, Image as ImageIcon, FileUp, Undo2, Redo2,
  FileText, X, ChevronLeft, ChevronRight, Type, Eraser, Layers, Scissors, Check,
  PanelLeft, Columns, File, Maximize, MoveHorizontal, ZoomIn, ZoomOut, Search,
  Save, FileCode, RefreshCw, Stamp, Pen, CheckSquare, Circle,
  ChevronDown, ChevronUp, Eye, EyeOff, Highlighter, Underline, AlignLeft,
  AlignCenter, AlignRight, Bold, Italic, Table, BarChart2, Link, Bookmark,
  Lock, Unlock, Shield, Printer, Share2, Copy, Clipboard, Hash, SlidersHorizontal,
  MousePointer, Move, Crop, Wand2, Palette, Grid3X3, Settings2, Minimize2,
  PanelTopClose, PanelTopOpen, Maximize2, ClipboardEdit, Languages, Sparkles,
  FileSearch, Calculator, Wrench, ShieldAlert, FileClock, History
} from 'lucide-react';
import {
  useFormStore, useEditingStore, useAnnotationStore, AnnotationTool, EditingMode,
  ZoomMode, ViewMode, useUIStore
} from '../store';

export interface PendingImageData {
  imageData: string;
  originalWidth: number;
  originalHeight: number;
  filename: string;
  fileSize: number;
  mimeType: string;
}

interface MainToolbarProps {
  currentPage: number;
  totalPages: number;
  selectedPages: number[];
  zoom: number;
  zoomMode: ZoomMode;
  viewMode: ViewMode;
  sidebarOpen: boolean;
  searchOpen: boolean;
  onOpenFile: (file: File) => void;
  onExport: () => void;
  onExportWithFormat?: (format: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetZoom: (zoom: number) => void;
  onFitToPage: () => void;
  onFitToWidth: () => void;
  onRotatePages: (pages: number[], degrees: number) => void;
  onDeletePages: (pages: number[]) => void;
  onInsertBlankPage: (position: number) => void;
  onInsertFromFile: (position: number) => void;
  onMerge: () => void;
  onSplit: () => void;
  hasDocument: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoActionName: string | null;
  redoActionName: string | null;
  onResetToOriginal: () => void;
  onCloseDocument: () => void;
  canResetToOriginal: boolean;
  onToggleSidebar: () => void;
  onSetViewMode: (mode: ViewMode) => void;
  onToggleSearch: () => void;
  onExportFormData?: (format: 'json' | 'fdf' | 'xfdf') => void;
  onImportFormData?: () => void;
  onFlattenForm?: () => void;
  onResetForm?: () => void;
  onApplyRedactions?: () => void;
  onInsertImage?: (images: PendingImageData[]) => void;
  onSaveAsTemplate?: (name: string) => void;
  onInsertStamp?: () => void;
  onSignDocument?: () => void;
  onInsertFormField?: (type: string) => void;
  onFillDocument?: () => void;
  onShowTemplates?: () => void;
}

type ToolbarTab = 'file' | 'home' | 'insert' | 'layout' | 'review' | 'form' | 'view' | 'security';

const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const SUPPORTED_IMAGE_EXTENSIONS = 'image/*';

// Divider
const Div = () => <div className="w-px h-8 bg-white/10 mx-1 flex-shrink-0" />;

// Tool button
const Btn = ({
  onClick, disabled, active, icon: Icon, label, title, accent, danger, size = 15
}: {
  onClick?: () => void; disabled?: boolean; active?: boolean; icon: React.ElementType;
  label?: string; title?: string; accent?: boolean; danger?: boolean; size?: number;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title || label}
    className={`
      group flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-lg
      text-[10px] font-bold tracking-wide transition-all duration-150 flex-shrink-0
      disabled:opacity-30 disabled:cursor-not-allowed min-w-[46px]
      ${active
        ? accent
          ? 'bg-[#1f6feb] text-white shadow-lg shadow-[#1f6feb]/30'
          : 'bg-white/15 text-white ring-1 ring-white/30'
        : danger
          ? 'text-rose-400 hover:bg-rose-500/15 hover:text-rose-300'
          : accent
            ? 'text-[#58a6ff] hover:bg-[#1f6feb]/20 hover:text-white'
            : 'text-[#94a3b8] hover:bg-white/10 hover:text-white'
      }
    `}
  >
    <Icon size={size} className="transition-transform group-hover:scale-110" />
    {label && <span className="leading-none mt-0.5 whitespace-nowrap">{label}</span>}
  </button>
);

export function MainToolbar({
  currentPage, totalPages, selectedPages, zoom, zoomMode, viewMode,
  sidebarOpen, searchOpen, onOpenFile, onExport, onPreviousPage, onNextPage,
  onGoToPage, onZoomIn, onZoomOut, onSetZoom, onFitToPage, onFitToWidth,
  onRotatePages, onDeletePages, onInsertBlankPage, onInsertFromFile, onMerge,
  onSplit, hasDocument, onUndo, onRedo, canUndo, canRedo, undoActionName,
  redoActionName, onResetToOriginal, onCloseDocument, canResetToOriginal,
  onToggleSidebar, onSetViewMode, onToggleSearch, onExportFormData,
  onImportFormData, onFlattenForm, onResetForm, onApplyRedactions, onInsertImage,
  onSaveAsTemplate, onInsertStamp, onSignDocument, onInsertFormField, onExportWithFormat, onFillDocument, onShowTemplates
}: MainToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const insertFileInputRef = useRef<HTMLInputElement>(null);

  const { currentTool, setCurrentTool } = useAnnotationStore();
  const { mode: editingMode, setMode: setEditingMode } = useEditingStore();
  const [activeTab, setActiveTab] = useState<ToolbarTab>('home');
  const [pendingInsertPosition, setPendingInsertPosition] = useState<number | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showPageInput, setShowPageInput] = useState(false);
  const [pageInputVal, setPageInputVal] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onOpenFile(file);
    e.target.value = '';
  };

  const handleInsertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && pendingInsertPosition !== null) onInsertFromFile(pendingInsertPosition);
    setPendingInsertPosition(null);
    e.target.value = '';
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const imagePromises: Promise<PendingImageData>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      imagePromises.push(new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => resolve({ imageData: reader.result as string, originalWidth: img.naturalWidth, originalHeight: img.naturalHeight, filename: file.name, fileSize: file.size, mimeType: file.type });
          img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
          img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
      }));
    }
    try {
      const images = await Promise.all(imagePromises);
      if (images.length > 0 && onInsertImage) onInsertImage(images);
    } catch (error) { console.error('Error loading images:', error); }
    e.target.value = '';
  };

  const handleToolClick = (tool: AnnotationTool) => {
    const newTool = currentTool === tool ? 'select' : tool;
    setCurrentTool(newTool);
    // Wire editing store modes
    if (newTool === 'text') setEditingMode('text');
    else if (newTool === 'image') setEditingMode('image');
    else setEditingMode('none');
  };

  const tabs: { id: ToolbarTab; label: string }[] = [
    { id: 'file', label: 'File' },
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'layout', label: 'Layout' },
    { id: 'review', label: 'Review' },
    { id: 'form', label: 'Form' },
    { id: 'security', label: 'Security' },
    { id: 'view', label: 'View' },
  ];

  return (
    <header className="flex flex-col flex-shrink-0 z-30" style={{ background: 'linear-gradient(180deg, #0f1520 0%, #111827 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

      {/* ── Top bar: tabs + nav + collapse ── */}
      <div className="flex items-center h-9 px-3 gap-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Logo mark */}
        <div className="flex items-center gap-2 pr-3 mr-1" style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1f6feb, #58a6ff)' }}>
            <FileText size={10} className="text-white" />
          </div>
          <span className="text-[11px] font-black tracking-widest text-white/70 uppercase">PDF</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center flex-1 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (collapsed) setCollapsed(false); }}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 h-9 ${
                activeTab === tab.id && !collapsed
                  ? 'border-[#58a6ff] text-[#58a6ff]'
                  : 'border-transparent text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right side: page nav + search + collapse */}
        <div className="flex items-center gap-1 pl-2" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Page navigation */}
          <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-lg px-1.5 h-7">
            <button onClick={onPreviousPage} disabled={!hasDocument || currentPage <= 1} className="p-0.5 text-white/50 hover:text-white disabled:opacity-20 transition-colors">
              <ChevronLeft size={12} />
            </button>
            <span
              className="text-[11px] font-black text-white/80 px-1 cursor-pointer hover:text-white min-w-[42px] text-center"
              onClick={() => setShowPageInput(true)}
            >
              {showPageInput ? (
                <input
                  autoFocus
                  type="number"
                  value={pageInputVal || currentPage}
                  onChange={e => setPageInputVal(e.target.value)}
                  onBlur={() => { if (pageInputVal) onGoToPage(parseInt(pageInputVal)); setShowPageInput(false); setPageInputVal(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') { if (pageInputVal) onGoToPage(parseInt(pageInputVal)); setShowPageInput(false); setPageInputVal(''); } }}
                  className="w-8 bg-transparent text-center outline-none text-[11px] font-black text-white"
                />
              ) : (
                <>{currentPage} <span className="text-white/30">/</span> {totalPages || 0}</>
              )}
            </span>
            <button onClick={onNextPage} disabled={!hasDocument || currentPage >= totalPages} className="p-0.5 text-white/50 hover:text-white disabled:opacity-20 transition-colors">
              <ChevronRight size={12} />
            </button>
          </div>

          <button onClick={onToggleSearch} disabled={!hasDocument} title="Search (Ctrl+F)"
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${searchOpen ? 'bg-[#1f6feb] text-white' : 'text-white/40 hover:text-white hover:bg-white/10'}`}>
            <Search size={13} />
          </button>
          <button onClick={onToggleSidebar} disabled={!hasDocument} title="Toggle sidebar"
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${sidebarOpen ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white hover:bg-white/10'}`}>
            <PanelLeft size={13} />
          </button>
          <button onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand toolbar' : 'Collapse toolbar'}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
            {collapsed ? <PanelTopOpen size={13} /> : <PanelTopClose size={13} />}
          </button>
        </div>
      </div>

      {/* ── Collapsible action bar ── */}
      {!collapsed && (
        <div className="flex items-center h-14 px-3 gap-1 overflow-x-auto no-scrollbar"
          style={{ background: 'rgba(255,255,255,0.02)' }}>

          {/* Always-visible: undo/redo + open */}
          <Btn icon={FileUp} label="Open" title="Open PDF (Ctrl+O)" onClick={() => fileInputRef.current?.click()} />
          <Btn icon={Undo2} title={undoActionName ? `Undo: ${undoActionName}` : 'Undo (Ctrl+Z)'} onClick={onUndo} disabled={!canUndo} />
          <Btn icon={Redo2} title={redoActionName ? `Redo: ${redoActionName}` : 'Redo (Ctrl+Shift+Z)'} onClick={onRedo} disabled={!canRedo} />
          <Div />

          {/* FILE TAB */}
          {activeTab === 'file' && (<>
            <div className="relative group">
              <Btn icon={Save} label="Export" accent onClick={onExport} disabled={!hasDocument} />
              {/* Hover dropdown — fixed z-[9999] to render above sidebar */}
              <div className="absolute top-full left-0 mt-1 w-56 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none group-hover:pointer-events-auto"
                style={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.15)', zIndex: 9999, boxShadow: '0 16px 48px rgba(0,0,0,0.8)' }}>
                <div className="py-1.5">
                  {[
                    { fmt: 'pdf', label: 'Save as PDF', icon: FileText, color: '#58a6ff' },
                    { fmt: 'word', label: 'Open in Word Editor', icon: FileText, color: '#60a5fa' },
                    { fmt: 'export-word', label: 'Export to Word (.docx)', icon: FileText, color: '#34d399' },
                    { fmt: 'excel', label: 'Export to Excel (.xlsx)', icon: FileText, color: '#f59e0b' },
                    { fmt: 'image', label: 'Export as Image (.png)', icon: ImageIcon, color: '#a78bfa' },
                  ].map(({ fmt, label, icon: Icon, color }) => (
                    <button key={fmt}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all hover:bg-white/8"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = color; (e.currentTarget as HTMLElement).style.background = `${color}12`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      onClick={() => { fmt === 'pdf' ? onExport() : onExportWithFormat?.(fmt); }}>
                      <Icon size={14} style={{ color }} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Btn icon={Printer} label="Print" disabled={!hasDocument} onClick={() => window.print()} />
            <Btn icon={Share2} label="Share" disabled={!hasDocument} />
            <Div />
            <Btn icon={RefreshCw} label="Reset" onClick={onResetToOriginal} disabled={!canResetToOriginal} />
            <Btn icon={X} label="Close" danger onClick={onCloseDocument} disabled={!hasDocument} />
          </>)}

          {/* HOME TAB */}
          {activeTab === 'home' && (<>
            <Btn icon={MousePointer} label="Select" active={currentTool === 'select'} onClick={() => handleToolClick('select')} disabled={!hasDocument} />
            <Btn icon={Type} label="Text" active={currentTool === 'text'} onClick={() => handleToolClick('text')} disabled={!hasDocument} accent />
            <Btn icon={Highlighter} label="Highlight" active={currentTool === 'highlight'} onClick={() => handleToolClick('highlight')} disabled={!hasDocument} />
            <Btn icon={Underline} label="Underline" active={currentTool === ('underline' as any)} onClick={() => handleToolClick('text')} disabled={!hasDocument} />
            <Btn icon={Eraser} label="Erase" active={currentTool === 'eraser'} onClick={() => handleToolClick('eraser')} disabled={!hasDocument} />
            <Div />
            <Btn icon={RotateCw} label="Rotate ↻" onClick={() => onRotatePages([currentPage], 90)} disabled={!hasDocument} />
            <Btn icon={RotateCcw} label="Rotate ↺" onClick={() => onRotatePages([currentPage], -90)} disabled={!hasDocument} />
            <Btn icon={Trash2} label="Delete Pg" onClick={() => onDeletePages([currentPage])} disabled={!hasDocument || totalPages <= 1} danger />
            <Div />
            <Btn icon={Stamp} label="Stamp" accent onClick={onInsertStamp} disabled={!hasDocument} />
            <Btn icon={Pen} label="Sign" accent onClick={onSignDocument} disabled={!hasDocument} />
            <Btn icon={Layers} label="Templates" onClick={onShowTemplates} disabled={!hasDocument} />
            <Btn icon={ClipboardEdit} label="Fill Doc" accent onClick={onFillDocument} disabled={!hasDocument} title="Fill Document — drag text fields onto document" />
          </>)}

          {/* INSERT TAB */}
          {activeTab === 'insert' && (<>
            <Btn icon={Plus} label="Blank Pg" onClick={() => onInsertBlankPage(currentPage + 1)} disabled={!hasDocument} />
            <Btn icon={FileUp} label="From PDF" onClick={() => { setPendingInsertPosition(currentPage + 1); insertFileInputRef.current?.click(); }} disabled={!hasDocument} />
            <Div />
            <Btn icon={ImageIcon} label="Image" onClick={() => imageInputRef.current?.click()} disabled={!hasDocument} accent />
            <Btn icon={Stamp} label="Stamp" accent onClick={onInsertStamp} disabled={!hasDocument} />
            <Btn icon={Pen} label="Signature" accent onClick={onSignDocument} disabled={!hasDocument} />
            <Btn icon={Layers} label="Templates" onClick={onShowTemplates} disabled={!hasDocument} />
            <Div />
            <Btn icon={Hash} label="Page Num" onClick={() => onExportWithFormat?.('page-numbers')} disabled={!hasDocument} />
            <Btn icon={Grid3X3} label="Watermark" onClick={() => onExportWithFormat?.('watermark')} disabled={!hasDocument} />
          </>)}

          {/* LAYOUT TAB (Merge, Split, Organize) */}
          {activeTab === 'layout' && (<>
            <Btn icon={Layers} label="Merge PDF" onClick={onMerge} disabled={!hasDocument} accent title="Combine multiple PDFs" />
            <Btn icon={Scissors} label="Split PDF" onClick={onSplit} disabled={!hasDocument} accent title="Separate pages into new files" />
            <Btn icon={RefreshCw} label="Compress" onClick={() => onExportWithFormat?.('compress')} disabled={!hasDocument} accent title="Reduce internal metadata size" />
            <Div />
            <Btn icon={RotateCw} label="Rotate All" onClick={() => onRotatePages(Array.from({ length: totalPages }, (_, i) => i + 1), 90)} disabled={!hasDocument} />
            <Btn icon={Crop} label="Crop PDF" onClick={() => onExportWithFormat?.('crop')} disabled={!hasDocument} />
            <Btn icon={MoveHorizontal} label="Organize" onClick={() => onExportWithFormat?.('organize')} disabled={!hasDocument} title="Reorder or delete pages" />
            <Div />
            <Btn icon={Plus} label="Add Pages" onClick={() => onInsertBlankPage(currentPage + 1)} disabled={!hasDocument} />
            <Btn icon={Trash2} label="Delete Pg" onClick={() => onDeletePages([currentPage])} disabled={!hasDocument || totalPages <= 1} danger />
          </>)}

          {/* REVIEW TAB (AI Tools, OCR, Compare) */}
          {activeTab === 'review' && (<>
            <Btn icon={Sparkles} label="AI Summarize" onClick={() => onExportWithFormat?.('ai-summarize')} disabled={!hasDocument} accent />
            <Btn icon={Languages} label="AI Translate" onClick={() => onExportWithFormat?.('ai-translate')} disabled={!hasDocument} accent />
            <Btn icon={Wand2} label="OCR PDF" disabled={!hasDocument} accent />
            <Div />
            <Btn icon={SlidersHorizontal} label="Compare PDF" disabled={!hasDocument} />
            <Btn icon={Shield} label="Redact PDF" onClick={onApplyRedactions} disabled={!hasDocument} danger />
            <Div />
            <Btn icon={Search} label="Find text" onClick={onToggleSearch} disabled={!hasDocument} active={searchOpen} />
            <Btn icon={History} label="Audit Log" disabled={!hasDocument} />
          </>)}

          {/* FORM TAB */}
          {activeTab === 'form' && (<>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/25 px-1 flex-shrink-0">Add Field</span>
            <Btn icon={Type} label="Text" onClick={() => onInsertFormField?.('text')} disabled={!hasDocument} accent />
            <Btn icon={CheckSquare} label="Checkbox" onClick={() => onInsertFormField?.('checkbox')} disabled={!hasDocument} accent />
            <Btn icon={Circle} label="Radio" onClick={() => onInsertFormField?.('radio')} disabled={!hasDocument} accent />
            <Btn icon={ChevronDown} label="Dropdown" onClick={() => onInsertFormField?.('dropdown')} disabled={!hasDocument} accent />
            <Btn icon={Pen} label="Signature" onClick={() => onInsertFormField?.('signature')} disabled={!hasDocument} accent />
            <Btn icon={Stamp} label="Stamp" onClick={() => onInsertFormField?.('stamp')} disabled={!hasDocument} accent />
            <Div />
            <Btn icon={Check} label="Flatten" onClick={onFlattenForm} disabled={!hasDocument} />
            <Btn icon={RefreshCw} label="Reset" onClick={onResetForm} disabled={!hasDocument} />
            <Div />
            <Btn icon={FileCode} label="JSON" onClick={() => onExportFormData?.('json')} disabled={!hasDocument} />
            <Btn icon={FileText} label="FDF" onClick={() => onExportFormData?.('fdf')} disabled={!hasDocument} />
            <Btn icon={FileUp} label="Import" onClick={onImportFormData} disabled={!hasDocument} />
          </>)}

          {/* VIEW TAB */}
          {activeTab === 'view' && (<>
            <Btn icon={File} label="Single" active={viewMode === 'single'} onClick={() => onSetViewMode('single')} disabled={!hasDocument} />
            <Btn icon={Columns} label="Scroll" active={viewMode === 'continuous'} onClick={() => onSetViewMode('continuous')} disabled={!hasDocument} />
            <Div />
            <Btn icon={ZoomOut} label="Zoom –" onClick={onZoomOut} disabled={!hasDocument} />
            <select
              value={zoomMode === 'manual' ? zoom : zoomMode}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'fit-page') onFitToPage();
                else if (val === 'fit-width') onFitToWidth();
                else onSetZoom(parseFloat(val));
              }}
              className="h-8 rounded-lg px-2 text-[11px] font-black outline-none flex-shrink-0 disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
              disabled={!hasDocument}
            >
              <option value="fit-page">Fit Page</option>
              <option value="fit-width">Fit Width</option>
              {ZOOM_PRESETS.map(p => <option key={p} value={p}>{Math.round(p * 100)}%</option>)}
            </select>
            <Btn icon={ZoomIn} label="Zoom +" onClick={onZoomIn} disabled={!hasDocument} />
            <Div />
            <Btn icon={Maximize} label="Fullscreen" onClick={() => document.documentElement.requestFullscreen?.()} disabled={!hasDocument} />
          </>)}

          {/* SECURITY TAB (Lock, Unlock, Repair) */}
          {activeTab === 'security' && (<>
            <Btn icon={Lock} label="Protect PDF" onClick={() => onExportWithFormat?.('protect')} disabled={!hasDocument} accent title="Set password protection" />
            <Btn icon={Unlock} label="Unlock PDF" onClick={() => onExportWithFormat?.('unlock')} disabled={!hasDocument} title="Remove password protection" />
            <Btn icon={Wrench} label="Repair PDF" onClick={() => onExportWithFormat?.('repair')} disabled={!hasDocument} title="Fix corrupted cross-reference tables" />
            <Div />
            <Btn icon={Shield} label="Sanitize" onClick={onApplyRedactions} disabled={!hasDocument} danger title="Remove hidden metadata & layers" />
            <Btn icon={Settings2} label="Permissions" onClick={() => onExportWithFormat?.('permissions')} disabled={!hasDocument} />
            <Btn icon={FileClock} label="PDF to PDF/A" onClick={() => onExportWithFormat?.('pdf-a')} disabled={!hasDocument} title="Long-term archiving" />
          </>)}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right: save shortcut */}
          <Btn icon={Save} label="Save" accent onClick={onExport} disabled={!hasDocument} />
        </div>
      )}

      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
      <input ref={insertFileInputRef} type="file" accept=".pdf" onChange={handleInsertFileChange} style={{ display: 'none' }} />
      <input ref={imageInputRef} type="file" accept={SUPPORTED_IMAGE_EXTENSIONS} multiple onChange={handleImageFileChange} style={{ display: 'none' }} />
    </header>
  );
}
