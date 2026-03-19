
import React, { useState, useRef, useEffect } from 'react';
import { 
  RotateCw, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  FileUp, 
  Undo2, 
  Redo2, 
  FileText, 
  Settings, 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Type,
  Square,
  Eraser,
  Layers,
  Scissors,
  Check,
  Zap,
  PanelLeft,
  Columns,
  File,
  Files,
  Maximize,
  MoveHorizontal,
  ZoomIn,
  ZoomOut,
  Search,
  Save,
  FileCode,
  RefreshCw,
  Stamp,
  PenTool as Pen
} from 'lucide-react';
import { 
  useFormStore, 
  useEditingStore, 
  useAnnotationStore, 
  AnnotationTool, 
  EditingMode,
  ZoomMode,
  ViewMode,
  useUIStore
} from '../src/store';

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
}

type ToolbarTab = 'file' | 'home' | 'insert' | 'draw' | 'layout' | 'review' | 'form' | 'view';

const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const SUPPORTED_IMAGE_EXTENSIONS = 'image/*';

export function MainToolbar({
  currentPage,
  totalPages,
  selectedPages,
  zoom,
  zoomMode,
  viewMode,
  sidebarOpen,
  searchOpen,
  onOpenFile,
  onExport,
  onPreviousPage,
  onNextPage,
  onGoToPage,
  onZoomIn,
  onZoomOut,
  onSetZoom,
  onFitToPage,
  onFitToWidth,
  onRotatePages,
  onDeletePages,
  onInsertBlankPage,
  onInsertFromFile,
  onMerge,
  onSplit,
  hasDocument,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  undoActionName,
  redoActionName,
  onResetToOriginal,
  onCloseDocument,
  canResetToOriginal,
  onToggleSidebar,
  onSetViewMode,
  onToggleSearch,
  onExportFormData,
  onImportFormData,
  onFlattenForm,
  onResetForm,
  onApplyRedactions,
  onInsertImage,
  onSaveAsTemplate,
  onInsertStamp,
  onSignDocument,
}: MainToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const insertFileInputRef = useRef<HTMLInputElement>(null);

  const { currentTool, setCurrentTool } = useAnnotationStore();
  const { mode: editingMode, setMode: setEditingMode } = useEditingStore();
  const [activeTab, setActiveTab] = useState<ToolbarTab>('home');
  const [pendingInsertPosition, setPendingInsertPosition] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenFile(file);
    }
    e.target.value = '';
  };

  const handleInsertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && pendingInsertPosition !== null) {
      onInsertFromFile(pendingInsertPosition);
    }
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

      imagePromises.push(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const img = new Image();
            img.onload = () => {
              resolve({
                imageData: reader.result as string,
                originalWidth: img.naturalWidth,
                originalHeight: img.naturalHeight,
                filename: file.name,
                fileSize: file.size,
                mimeType: file.type,
              });
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
            img.src = reader.result as string;
          };
          reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
          reader.readAsDataURL(file);
        })
      );
    }

    try {
      const images = await Promise.all(imagePromises);
      if (images.length > 0 && onInsertImage) {
        onInsertImage(images);
      }
    } catch (error) {
      console.error('Error loading images:', error);
    }

    e.target.value = '';
  };

  const handleToolClick = (tool: AnnotationTool) => {
    if (editingMode !== 'none') setEditingMode('none');
    setCurrentTool(currentTool === tool ? 'select' : tool);
  };

  return (
    <header className="main-toolbar flex flex-col bg-white border-b border-slate-200 shadow-sm z-30">
      {/* Tabs */}
      <div className="flex items-center px-4 border-b border-slate-100 bg-slate-50/50">
        {(['file', 'home', 'insert', 'layout', 'review', 'form', 'view'] as ToolbarTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-600 bg-white' 
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Toolbar Actions */}
      <div className="flex items-center h-14 px-4 gap-2 overflow-x-auto no-scrollbar">
        {/* Common Actions (Always Visible) */}
        <div className="flex items-center gap-1 pr-2 border-r border-slate-100">
          <button className="toolbar-btn icon-only" onClick={() => fileInputRef.current?.click()} title="Open File">
            <FileUp size={18} />
          </button>
          <button className="toolbar-btn icon-only" onClick={onUndo} disabled={!canUndo} title={undoActionName || "Undo"}>
            <Undo2 size={18} />
          </button>
          <button className="toolbar-btn icon-only" onClick={onRedo} disabled={!canRedo} title={redoActionName || "Redo"}>
            <Redo2 size={18} />
          </button>
        </div>

        {/* Tab Specific Actions */}
        <div className="flex items-center gap-1">
          {activeTab === 'file' && (
            <>
              <button className="toolbar-btn flex items-center gap-2 px-3" onClick={() => fileInputRef.current?.click()} title="Open PDF">
                <FileUp size={18} />
                <span className="text-xs font-bold">Open</span>
              </button>
              <button className="toolbar-btn flex items-center gap-2 px-3" onClick={onExport} disabled={!hasDocument} title="Export PDF">
                <Save size={18} />
                <span className="text-xs font-bold">Export</span>
              </button>
              <button className="toolbar-btn flex items-center gap-2 px-3 text-red-500 hover:bg-red-50" onClick={onCloseDocument} disabled={!hasDocument} title="Close Document">
                <X size={18} />
                <span className="text-xs font-bold">Close</span>
              </button>
            </>
          )}

          {activeTab === 'home' && (
            <>
              <button 
                className={`toolbar-btn icon-only ${currentTool === 'select' ? 'active' : ''}`}
                onClick={() => handleToolClick('select')}
                disabled={!hasDocument}
                title="Select Tool"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4L10 22L13 13L22 10L4 4Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                className={`toolbar-btn icon-only ${currentTool === 'highlight' ? 'active' : ''}`}
                onClick={() => handleToolClick('highlight')}
                disabled={!hasDocument}
                title="Highlight Tool"
              >
                <div className="w-4 h-4 bg-yellow-300 rounded-sm border border-gray-400" />
              </button>
              <button 
                className={`toolbar-btn icon-only ${currentTool === 'text' ? 'active' : ''}`}
                onClick={() => handleToolClick('text')}
                disabled={!hasDocument}
                title="Text Tool"
              >
                <Type size={18} />
              </button>
              <div className="toolbar-divider" />
              <button className="toolbar-btn icon-only" onClick={() => onRotatePages([currentPage], 90)} disabled={!hasDocument} title="Rotate Clockwise 90°">
                <RotateCw size={18} />
              </button>
              <button className="toolbar-btn icon-only" onClick={() => onRotatePages([currentPage], -90)} disabled={!hasDocument} title="Rotate Counter-Clockwise 90°">
                <RotateCcw size={18} />
              </button>
              <button className="toolbar-btn icon-only" onClick={() => onRotatePages([currentPage], 180)} disabled={!hasDocument} title="Rotate 180°">
                <RefreshCw size={18} className="rotate-180" />
              </button>
              <button className="toolbar-btn icon-only" onClick={() => onDeletePages([currentPage])} disabled={!hasDocument || totalPages <= 1} title="Delete Page">
                <Trash2 size={18} />
              </button>
              <div className="toolbar-divider" />
              <button className="toolbar-btn icon-only" onClick={onResetToOriginal} disabled={!canResetToOriginal} title="Reset to Original">
                <RefreshCw size={18} />
              </button>
              <button className="toolbar-btn icon-only" onClick={() => onSaveAsTemplate?.('New Template')} disabled={!hasDocument} title="Save as Template">
                <Save size={18} />
              </button>
              <div className="toolbar-divider" />
              <button className="toolbar-btn icon-only" onClick={onInsertStamp} disabled={!hasDocument} title="Insert Stamp">
                <Stamp size={18} />
              </button>
              <button className="toolbar-btn icon-only" onClick={onSignDocument} disabled={!hasDocument} title="Sign Document">
                <Pen size={18} />
              </button>
            </>
          )}

          {activeTab === 'insert' && (
            <>
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-1">
                  <button className="toolbar-btn icon-only h-7 w-7" onClick={() => onInsertBlankPage(currentPage)} disabled={!hasDocument} title="Insert Blank Page Before">
                    <Plus size={14} className="mr-0.5" /> <ChevronLeft size={10} />
                  </button>
                  <button className="toolbar-btn icon-only h-7 w-7" onClick={() => onInsertBlankPage(currentPage + 1)} disabled={!hasDocument} title="Insert Blank Page After">
                    <Plus size={14} className="mr-0.5" /> <ChevronRight size={10} />
                  </button>
                  <button className="toolbar-btn icon-only h-7 w-7" onClick={() => onInsertBlankPage(0)} disabled={!hasDocument} title="Insert Blank Page At End">
                    <Plus size={14} className="mr-0.5" /> <Maximize size={10} />
                  </button>
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase text-center">Blank Page</span>
              </div>
              <div className="toolbar-divider" />
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-1">
                  <button className="toolbar-btn icon-only h-7 w-7" onClick={() => {
                    setPendingInsertPosition(currentPage);
                    insertFileInputRef.current?.click();
                  }} disabled={!hasDocument} title="Insert From File Before">
                    <Files size={14} className="mr-0.5" /> <ChevronLeft size={10} />
                  </button>
                  <button className="toolbar-btn icon-only h-7 w-7" onClick={() => {
                    setPendingInsertPosition(currentPage + 1);
                    insertFileInputRef.current?.click();
                  }} disabled={!hasDocument} title="Insert From File After">
                    <Files size={14} className="mr-0.5" /> <ChevronRight size={10} />
                  </button>
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase text-center">From File</span>
              </div>
              <div className="toolbar-divider" />
              <button className="toolbar-btn icon-only" onClick={() => imageInputRef.current?.click()} disabled={!hasDocument} title="Insert Image">
                <ImageIcon size={18} />
              </button>
              <div className="toolbar-divider" />
              <button className="toolbar-btn icon-only" onClick={onInsertStamp} disabled={!hasDocument} title="Insert Stamp">
                <Stamp size={18} />
              </button>
              <button className="toolbar-btn icon-only" onClick={onSignDocument} disabled={!hasDocument} title="Sign Document">
                <Pen size={18} />
              </button>
            </>
          )}

          {activeTab === 'layout' && (
            <>
              <button className="toolbar-btn icon-only" onClick={onMerge} disabled={!hasDocument} title="Merge PDFs">
                <Layers size={18} />
              </button>
              <button className="toolbar-btn icon-only" onClick={onSplit} disabled={!hasDocument} title="Split PDF">
                <Scissors size={18} />
              </button>
            </>
          )}

          {activeTab === 'review' && (
            <>
              <button className="toolbar-btn icon-only" onClick={onApplyRedactions} disabled={!hasDocument} title="Apply Redactions">
                <Eraser size={18} />
              </button>
            </>
          )}

          {activeTab === 'form' && (
            <>
              <button className="toolbar-btn icon-only" onClick={onFlattenForm} disabled={!hasDocument} title="Flatten Form">
                <Zap size={18} />
              </button>
              <button className="toolbar-btn icon-only" onClick={onResetForm} disabled={!hasDocument} title="Reset Form">
                <RefreshCw size={18} />
              </button>
              <div className="toolbar-divider" />
              <button className="toolbar-btn icon-only" onClick={() => onExportFormData?.('json')} disabled={!hasDocument} title="Export Form Data (JSON)">
                <FileCode size={18} />
              </button>
              <button className="toolbar-btn icon-only" onClick={() => onExportFormData?.('fdf')} disabled={!hasDocument} title="Export Form Data (FDF)">
                <FileText size={18} />
              </button>
              <button className="toolbar-btn icon-only" onClick={() => onExportFormData?.('xfdf')} disabled={!hasDocument} title="Export Form Data (XFDF)">
                <FileUp size={18} className="rotate-180" />
              </button>
              <button className="toolbar-btn icon-only" onClick={onImportFormData} disabled={!hasDocument} title="Import Form Data">
                <FileUp size={18} />
              </button>
            </>
          )}

          {activeTab === 'view' && (
            <>
              <button className={`toolbar-btn icon-only ${viewMode === 'single' ? 'active' : ''}`} onClick={() => onSetViewMode('single')} disabled={!hasDocument} title="Single Page View">
                <File size={18} />
              </button>
              <button className={`toolbar-btn icon-only ${viewMode === 'continuous' ? 'active' : ''}`} onClick={() => onSetViewMode('continuous')} disabled={!hasDocument} title="Continuous View">
                <Columns size={18} />
              </button>
              <div className="toolbar-divider" />
              <button className="toolbar-btn icon-only" onClick={onZoomOut} disabled={!hasDocument} title="Zoom Out">
                <ZoomOut size={18} />
              </button>
              <select 
                value={zoomMode === 'manual' ? zoom : zoomMode} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'fit-page') onFitToPage();
                  else if (val === 'fit-width') onFitToWidth();
                  else onSetZoom(parseFloat(val));
                }}
                className="zoom-select h-8 bg-slate-50 border border-slate-200 rounded px-2 text-xs font-bold outline-none"
                disabled={!hasDocument}
              >
                <option value="fit-page">Fit Page</option>
                <option value="fit-width">Fit Width</option>
                {ZOOM_PRESETS.map(p => <option key={p} value={p}>{Math.round(p * 100)}%</option>)}
              </select>
              <button className="toolbar-btn icon-only" onClick={onZoomIn} disabled={!hasDocument} title="Zoom In">
                <ZoomIn size={18} />
              </button>
            </>
          )}
        </div>

        <div className="toolbar-spacer flex-1" />

        {/* Navigation & Search */}
        <div className="flex items-center gap-2">
          <div className="page-indicator flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 h-9">
            <button className="p-1 hover:bg-slate-200 rounded disabled:opacity-30" onClick={onPreviousPage} disabled={!hasDocument || currentPage <= 1}>
              <ChevronLeft size={16} />
            </button>
            <input 
              type="number" 
              className="w-10 bg-transparent text-center text-xs font-black outline-none" 
              value={currentPage} 
              onChange={(e) => onGoToPage(parseInt(e.target.value))}
              min={1}
              max={totalPages}
              disabled={!hasDocument}
            />
            <span className="text-[10px] font-black text-slate-400 mx-1">/</span>
            <span className="text-xs font-black text-slate-600 min-w-[20px]">{totalPages || 0}</span>
            <button className="p-1 hover:bg-slate-200 rounded disabled:opacity-30" onClick={onNextPage} disabled={!hasDocument || currentPage >= totalPages}>
              <ChevronRight size={16} />
            </button>
          </div>

          <button className={`toolbar-btn icon-only ${searchOpen ? 'active' : ''}`} onClick={onToggleSearch} disabled={!hasDocument} title="Search">
            <Search size={18} />
          </button>
          <button className={`toolbar-btn icon-only ${sidebarOpen ? 'active' : ''}`} onClick={onToggleSidebar} disabled={!hasDocument} title="Toggle Sidebar">
            <PanelLeft size={18} />
          </button>
          <button className="toolbar-btn icon-only text-red-500 hover:bg-red-50" onClick={onCloseDocument} disabled={!hasDocument} title="Close Document">
            <X size={18} />
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={insertFileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleInsertFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept={SUPPORTED_IMAGE_EXTENSIONS}
        multiple
        onChange={handleImageFileChange}
        style={{ display: 'none' }}
      />
    </header>
  );
}
