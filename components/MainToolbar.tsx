
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
  Search
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

interface PendingImageData {
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
}

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
}: MainToolbarProps) {
  const [showDocumentMenu, setShowDocumentMenu] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [showFormMenu, setShowFormMenu] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside the toolbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setShowDocumentMenu(false);
        setShowInsertMenu(false);
        setShowFormMenu(false);
        setShowEditMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const { isFormPDF, isDirty: formIsDirty } = useFormStore();
  const { mode: editingMode, setMode: setEditingMode, hasChanges, redactions } = useEditingStore();
  const pendingRedactions = redactions.filter(r => !r.applied);

  const {
    currentTool,
    setCurrentTool,
    toolSettings,
    setToolSettings,
  } = useAnnotationStore();

  const pagesToOperate = selectedPages.length > 0 ? selectedPages : [currentPage];
  const pageLabel = selectedPages.length > 1
    ? `${selectedPages.length} pages`
    : `page ${currentPage}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenFile(file);
    }
    e.target.value = '';
  };

  // Page operation handlers
  const handleRotateCW = () => onRotatePages(pagesToOperate, 90);
  const handleRotateCCW = () => onRotatePages(pagesToOperate, -90);

  const handleDelete = () => {
    if (totalPages <= pagesToOperate.length) {
      alert('Cannot delete all pages');
      return;
    }
    const confirmMsg = selectedPages.length > 1
      ? `Delete ${selectedPages.length} selected pages?`
      : `Delete page ${currentPage}?`;
    if (window.confirm(confirmMsg)) {
      onDeletePages(pagesToOperate);
    }
  };

  const handleInsertBlankBefore = () => {
    onInsertBlankPage(currentPage);
    setShowInsertMenu(false);
  };

  const handleInsertBlankAfter = () => {
    onInsertBlankPage(currentPage + 1);
    setShowInsertMenu(false);
  };

  const handleInsertBlankAtEnd = () => {
    onInsertBlankPage(0);
    setShowInsertMenu(false);
  };

  const handleInsertFromFileBefore = () => {
    onInsertFromFile(currentPage);
    setShowInsertMenu(false);
  };

  const handleInsertFromFileAfter = () => {
    onInsertFromFile(currentPage + 1);
    setShowInsertMenu(false);
  };

  // Image insertion handler
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
    setShowInsertMenu(false);
  };

  const handleInsertImageClick = () => {
    imageInputRef.current?.click();
  };

  // Annotation tool handlers
  const handleToolClick = (tool: AnnotationTool) => {
    if (editingMode !== 'none') {
      setEditingMode('none');
    }
    setCurrentTool(currentTool === tool ? 'select' : tool);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToolSettings({ color: e.target.value });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToolSettings({ opacity: parseFloat(e.target.value) });
  };

  // Editing mode handlers
  const handleEditingModeChange = (mode: EditingMode) => {
    setEditingMode(editingMode === mode ? 'none' : mode);
    setShowEditMenu(false);
    if (mode !== 'none') {
      setCurrentTool('select');
    }
  };

  return (
    <header ref={toolbarRef} className="main-toolbar">
      {/* Left section - File operations */}
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Open PDF (Ctrl+O)"
        >
          <FileUp size={18} />
          <span className="btn-label">Open</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          className="toolbar-btn toolbar-btn-primary"
          onClick={onExport}
          disabled={!hasDocument}
          title="Export / Download PDF (Ctrl+S)"
        >
          <Download size={18} />
          <span className="btn-label">Export</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Sidebar toggle */}
      {hasDocument && (
        <>
          <div className="toolbar-group">
            <button
              className={`toolbar-btn icon-only ${sidebarOpen ? 'active' : ''}`}
              onClick={onToggleSidebar}
              title="Toggle Sidebar"
            >
              <PanelLeft size={18} />
            </button>
          </div>

          <div className="toolbar-divider" />
        </>
      )}

      {/* Center section - Navigation */}
      {hasDocument && (
        <>
          <div className="toolbar-group navigation">
            <button
              className="toolbar-btn icon-only"
              onClick={onPreviousPage}
              disabled={currentPage <= 1}
              title="Previous Page (←)"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="page-indicator">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => onGoToPage(parseInt(e.target.value, 10))}
                className="page-input"
              />
              <span className="page-separator">/</span>
              <span className="page-total">{totalPages}</span>
            </div>

            <button
              className="toolbar-btn icon-only"
              onClick={onNextPage}
              disabled={currentPage >= totalPages}
              title="Next Page (→)"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* Zoom controls */}
          <div className="toolbar-group zoom">
            <button
              className="toolbar-btn icon-only"
              onClick={onZoomOut}
              title="Zoom Out (-)"
            >
              <ZoomOut size={18} />
            </button>

            <select
              value={zoomMode === 'manual' ? zoom : zoomMode}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'fit-page') {
                  onFitToPage();
                } else if (value === 'fit-width') {
                  onFitToWidth();
                } else {
                  onSetZoom(parseFloat(value));
                }
              }}
              className="zoom-select"
            >
              <option value="fit-page">
                {zoomMode === 'fit-page' ? `Fit Page (${Math.round(zoom * 100)}%)` : 'Fit Page'}
              </option>
              <option value="fit-width">
                {zoomMode === 'fit-width' ? `Fit Width (${Math.round(zoom * 100)}%)` : 'Fit Width'}
              </option>
              <optgroup label="Zoom">
                {ZOOM_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {Math.round(preset * 100)}%
                  </option>
                ))}
              </optgroup>
            </select>

            <button
              className="toolbar-btn icon-only"
              onClick={onZoomIn}
              title="Zoom In (+)"
            >
              <ZoomIn size={18} />
            </button>

            <button
              className={`toolbar-btn icon-only ${zoomMode === 'fit-page' ? 'active' : ''}`}
              onClick={onFitToPage}
              title="Fit to Page"
            >
              <Maximize size={18} />
            </button>

            <button
              className={`toolbar-btn icon-only ${zoomMode === 'fit-width' ? 'active' : ''}`}
              onClick={onFitToWidth}
              title="Fit to Width"
            >
              <MoveHorizontal size={18} />
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* View mode */}
          <div className="toolbar-group view-mode">
            <button
              className={`toolbar-btn icon-only ${viewMode === 'single' ? 'active' : ''}`}
              onClick={() => onSetViewMode('single')}
              title="Single Page View"
            >
              <File size={18} />
            </button>
            <button
              className={`toolbar-btn icon-only ${viewMode === 'continuous' ? 'active' : ''}`}
              onClick={() => onSetViewMode('continuous')}
              title="Continuous View"
            >
              <Files size={18} />
            </button>
            <button
              className={`toolbar-btn icon-only ${viewMode === 'two-page' ? 'active' : ''}`}
              onClick={() => onSetViewMode('two-page')}
              title="Two Page View"
            >
              <Columns size={18} />
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* Advanced Actions (Merged from CombinedToolbar) */}
          <div className="toolbar-group">
            <div className="toolbar-dropdown">
              <button
                className="toolbar-btn"
                onClick={() => setShowDocumentMenu(!showDocumentMenu)}
              >
                <FileText size={18} />
                <span className="btn-label">Document</span>
              </button>
              {showDocumentMenu && (
                <div className="toolbar-menu">
                  <button onClick={() => { onMerge(); setShowDocumentMenu(false); }}>
                    Merge PDFs
                  </button>
                  <button onClick={() => { onSplit(); setShowDocumentMenu(false); }}>
                    Split PDF
                  </button>
                  <div className="menu-divider" />
                  <button onClick={() => { onResetToOriginal(); setShowDocumentMenu(false); }} disabled={!canResetToOriginal}>
                    ⟲ Reset to Original
                  </button>
                  <button
                    className="menu-item-danger"
                    onClick={() => { onCloseDocument(); setShowDocumentMenu(false); }}
                  >
                    ✕ Close Document
                  </button>
                </div>
              )}
            </div>

            {isFormPDF && (
              <div className="toolbar-dropdown">
                <button
                  className={`toolbar-btn ${formIsDirty ? 'active' : ''}`}
                  onClick={() => setShowFormMenu(!showFormMenu)}
                >
                  <span className="btn-label">Form {formIsDirty ? '•' : ''}</span>
                </button>
                {showFormMenu && (
                  <div className="toolbar-menu">
                    <span className="menu-section-label">Export Form Data</span>
                    <button onClick={() => { onExportFormData?.('json'); setShowFormMenu(false); }}>
                      Export as JSON
                    </button>
                    <button onClick={() => { onExportFormData?.('fdf'); setShowFormMenu(false); }}>
                      Export as FDF
                    </button>
                    <button onClick={() => { onExportFormData?.('xfdf'); setShowFormMenu(false); }}>
                      Export as XFDF
                    </button>
                    <div className="menu-divider" />
                    <button onClick={() => { onImportFormData?.(); setShowFormMenu(false); }}>
                      Import Form Data...
                    </button>
                    <div className="menu-divider" />
                    <button onClick={() => { onResetForm?.(); setShowFormMenu(false); }} disabled={!formIsDirty}>
                      Reset Form Values
                    </button>
                    <button onClick={() => { onFlattenForm?.(); setShowFormMenu(false); }}>
                      Flatten Form (Make Static)
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="toolbar-dropdown">
              <button
                className={`toolbar-btn ${editingMode !== 'none' ? 'active' : ''}`}
                onClick={() => setShowEditMenu(!showEditMenu)}
              >
                <span className="btn-label">Edit {hasChanges() ? '•' : ''}</span>
              </button>
              {showEditMenu && (
                <div className="toolbar-menu">
                  <button
                    className={editingMode === 'text' ? 'active' : ''}
                    onClick={() => handleEditingModeChange('text')}
                  >
                    ✎ Edit Text
                  </button>
                  <button
                    className={editingMode === 'image' ? 'active' : ''}
                    onClick={() => handleEditingModeChange('image')}
                  >
                    🖼 Edit Images
                  </button>
                  <div className="menu-divider" />
                  <button
                    className={`${editingMode === 'redact' ? 'active' : ''} menu-item-warning`}
                    onClick={() => handleEditingModeChange('redact')}
                  >
                    ■ Redact Content
                  </button>
                  {pendingRedactions.length > 0 && (
                    <>
                      <div className="menu-divider" />
                      <button
                        className="menu-item-danger"
                        onClick={() => {
                          onApplyRedactions?.();
                          setShowEditMenu(false);
                        }}
                      >
                        ⚠ Apply {pendingRedactions.length} Redaction{pendingRedactions.length !== 1 ? 's' : ''}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="toolbar-divider" />

          {/* Undo/Redo */}
          <div className="toolbar-group">
            <button
              className="toolbar-btn icon-only"
              onClick={onUndo}
              disabled={!canUndo}
              title={undoActionName ? `Undo ${undoActionName} (Ctrl+Z)` : 'Undo (Ctrl+Z)'}
            >
              <Undo2 size={18} />
            </button>
            <button
              className="toolbar-btn icon-only"
              onClick={onRedo}
              disabled={!canRedo}
              title={redoActionName ? `Redo ${redoActionName} (Ctrl+Shift+Z)` : 'Redo (Ctrl+Shift+Z)'}
            >
              <Redo2 size={18} />
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* Right section - Tools */}
          <div className="toolbar-group">
            <button
              className="toolbar-btn icon-only"
              onClick={handleRotateCW}
              title="Rotate Clockwise (Ctrl+R)"
            >
              <RotateCw size={18} />
            </button>
            <button
              className="toolbar-btn icon-only"
              onClick={handleDelete}
              disabled={totalPages <= 1}
              title={`Delete ${pageLabel}`}
            >
              <Trash2 size={18} />
            </button>

            <div className="toolbar-dropdown">
              <button
                className="toolbar-btn"
                onClick={() => setShowInsertMenu(!showInsertMenu)}
              >
                <Plus size={18} />
                <span className="btn-label">Insert</span>
              </button>
              {showInsertMenu && (
                <div className="toolbar-menu">
                  <span className="menu-section-label">Content</span>
                  <button onClick={handleInsertImageClick}>
                    🖼 Image
                  </button>
                  <div className="menu-divider" />
                  <span className="menu-section-label">Blank Page</span>
                  <button onClick={handleInsertBlankBefore}>Before current</button>
                  <button onClick={handleInsertBlankAfter}>After current</button>
                  <button onClick={handleInsertBlankAtEnd}>At end</button>
                  <div className="menu-divider" />
                  <span className="menu-section-label">From File</span>
                  <button onClick={handleInsertFromFileBefore}>Before current</button>
                  <button onClick={handleInsertFromFileAfter}>After current</button>
                </div>
              )}
            </div>
          </div>

          <div className="toolbar-divider" />

          {/* Annotation Tools */}
          <div className="toolbar-group">
            <button
              className={`toolbar-btn icon-only ${currentTool === 'select' ? 'active' : ''}`}
              onClick={() => handleToolClick('select')}
              title="Select (V)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4L10 22L13 13L22 10L4 4Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className={`toolbar-btn icon-only ${currentTool === 'text' ? 'active' : ''}`}
              onClick={() => handleToolClick('text')}
              title="Text (T)"
            >
              <Type size={18} />
            </button>
            <button
              className={`toolbar-btn icon-only ${currentTool === 'highlight' ? 'active' : ''}`}
              onClick={() => handleToolClick('highlight')}
              title="Highlight"
            >
              <div className="w-4 h-4 bg-yellow-300 rounded-sm" />
            </button>
          </div>

          {currentTool !== 'select' && (
            <>
              <div className="toolbar-divider" />
              <div className="tool-settings">
                <div className="setting-item">
                  <input 
                    type="color" 
                    className="color-input"
                    value={toolSettings.color}
                    onChange={handleColorChange}
                  />
                </div>
                <div className="setting-item">
                  <input 
                    type="range" 
                    className="range-input"
                    min="0.1" 
                    max="1" 
                    step="0.1"
                    value={toolSettings.opacity}
                    onChange={handleOpacityChange}
                  />
                </div>
              </div>
            </>
          )}

          <div className="toolbar-spacer" />

          {/* Search */}
          <div className="toolbar-group">
            <button
              className={`toolbar-btn icon-only ${searchOpen ? 'active' : ''}`}
              onClick={onToggleSearch}
              title="Search (Ctrl+F)"
            >
              <Search size={18} />
            </button>
          </div>
        </>
      )}

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
