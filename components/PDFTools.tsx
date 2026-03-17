
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileText, 
  PenTool,
  Search, 
  Layout, 
  Undo2, 
  Redo2, 
  Download, 
  Plus, 
  Trash2, 
  RotateCw, 
  RotateCcw, 
  Image as ImageIcon, 
  Type, 
  Square, 
  Eraser, 
  Save, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Minimize2,
  MoreVertical,
  GripVertical,
  Settings,
  Layers,
  FileCode,
  Zap,
  Printer,
  Share2,
  Lock,
  Unlock,
  FileUp,
  FileDown,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TextFormatToolbar } from './TextFormatToolbar';
import * as PDFLib from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import TiptapEditor from './TiptapEditor';
import { MainToolbar } from './MainToolbar';
import { PageToolbar } from './PageToolbar';
import { 
  useUIStore, 
  useSearchStore, 
  useAnnotationStore, 
  useAnnotationHistoryStore, 
  useFormStore, 
  useEditingStore, 
  useHistoryStore,
  Annotation,
  EditingMode,
  ZoomMode,
  ViewMode
} from '../src/store';
import { 
  hexToRgb, 
  rgbToHex, 
  rgbaToString, 
  parseRgba, 
  parseTipTapHTML, 
  RichTextSegment, 
  TextStyle, 
  BoxStyle,
  adjustBrightness,
  rotatePoint,
  loadPDFDocument,
  getPDFMetadata,
  getPDFOutline,
  mergePDFs,
  splitPDF,
  reorderPages,
  rotatePages,
  deletePages,
  insertBlankPages,
  insertPagesFromPDF,
  downloadPDF,
  detectTextBlocks,
  TextBlock,
  segmentsToTipTapHTML
} from '../src/utils/pdfUtils';

// Set up PDF.js worker
const pdfjsVersion = (pdfjsLib as any).version || '3.11.174';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

interface EditElement {
  id: string;
  type: 'text' | 'image' | 'whiteout';
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  richText?: RichTextSegment[];
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  boxStyle?: BoxStyle;
}

export default function PDFTools() {
  // Stores
  const { 
    sidebarOpen, 
    searchOpen, 
    toggleSidebar, 
    toggleSearch,
    zoom,
    zoomMode,
    viewMode,
    setZoom,
    setZoomMode,
    setViewMode
  } = useUIStore();
  const { query, results, currentResultIndex, setQuery, setResults, nextResult, prevResult, clearSearch } = useSearchStore();
  const { annotations, addAnnotation, deleteAnnotation, updateAnnotation, currentTool, setCurrentTool, selectedAnnotationId, selectAnnotation, getAllAnnotations } = useAnnotationStore();
  const { push: pushAnnotationHistory, undo: undoAnnotation, redo: redoAnnotation, canUndo: canUndoAnnotation, canRedo: canRedoAnnotation } = useAnnotationHistoryStore();
  const { fields, setFields, resetToOriginal: resetForm, clearForm } = useFormStore();
  const { redactions, markRedactionApplied } = useEditingStore();
  const { pushState, undo: undoHistory, redo: redoHistory, canUndo: canUndoHistory, canRedo: canRedoHistory, getUndoActionName, getRedoActionName, setOriginalDocument, getOriginalDocument, undoRedoInProgress, setUndoRedoInProgress } = useHistoryStore();

  // Local State
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [fileName, setFileName] = useState('');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [editElements, setEditElements] = useState<EditElement[]>([]);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedTextBlockId, setSelectedTextBlockId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'pages' | 'edit' | 'actions'>('pages');
  const [isDetectingText, setIsDetectingText] = useState(false);
  const [editingTextBlock, setEditingTextBlock] = useState<TextBlock | null>(null);
  const [tiptapContent, setTiptapContent] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load PDF
  const loadFromFile = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    setPdfData(data);
    setFileName(file.name);
    setOriginalDocument(data, file.name);
    
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    setPdfDoc(pdf);
    setNumPages(pdf.numPages);
    setCurrentPage(1);
    
    // Clear state
    setEditElements([]);
    clearForm();
    clearSearch();
  }, [setOriginalDocument, clearForm, clearSearch]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFromFile(file);
  };

  // Handle file drop
  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.currentTarget.classList.remove('drag-over');
      const file = event.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        await loadFromFile(file);
      }
    },
    [loadFromFile]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.currentTarget.classList.remove('drag-over');
  }, []);

  const renderPage = useCallback(async (pageNumber: number) => {
    if (!pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: zoom });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        const container = containerRef.current;
        if (container) {
          container.innerHTML = '';
          container.appendChild(canvas);
          container.style.width = `${viewport.width}px`;
          container.style.height = `${viewport.height}px`;
        }
      }
    } catch (error) {
      console.error('Page rendering failed:', error);
    }
  }, [pdfDoc, zoom]);

  const handleDetectText = useCallback(async (pageNumber: number) => {
    if (!pdfDoc) return;
    setIsDetectingText(true);
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const blocks = await detectTextBlocks(page);
      setTextBlocks(blocks);
    } catch (err) {
      console.error('Failed to detect text blocks:', err);
    } finally {
      setIsDetectingText(false);
    }
  }, [pdfDoc]);

  // Rendering
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;
    renderPage(currentPage);
    handleDetectText(currentPage);
  }, [pdfDoc, currentPage, zoom, renderPage, handleDetectText]);

  // Page Manipulation
  const handleRotatePages = useCallback(async (pages: number[], degrees: number) => {
    if (!pdfData) return;
    try {
      const newData = await rotatePages(pdfData, pages, degrees as 90 | 180 | 270 | -90);
      setPdfData(newData);
      const actionName = `Rotate ${pages.length > 1 ? `${pages.length} pages` : `page ${pages[0]}`} ${degrees}°`;
      pushState(newData, fileName, actionName);
      
      const newPdf = await loadPDFDocument(newData);
      setPdfDoc(newPdf);
    } catch (err) {
      console.error('Failed to rotate pages:', err);
    }
  }, [pdfData, fileName, pushState]);

  const handleDeletePages = useCallback(async (pages: number[]) => {
    if (!pdfData) return;
    try {
      const newData = await deletePages(pdfData, pages);
      setPdfData(newData);
      const actionName = `Delete ${pages.length} pages`;
      pushState(newData, fileName, actionName);
      
      const newPdf = await loadPDFDocument(newData);
      setPdfDoc(newPdf);
      setNumPages(newPdf.numPages);
      if (currentPage > newPdf.numPages) setCurrentPage(newPdf.numPages);
      setSelectedPages([]);
    } catch (err) {
      console.error('Failed to delete pages:', err);
    }
  }, [pdfData, fileName, pushState, currentPage]);

  const handleInsertImage = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newElement: EditElement = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'image',
        page: currentPage,
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        content
      };
      setEditElements(prev => [...prev, newElement]);
      setSelectedElementId(newElement.id);
    };
    reader.readAsDataURL(file);
  }, [currentPage]);

  const handleApplyRedactions = useCallback(async () => {
    if (!pdfData) return;
    const pdfDoc = await PDFLib.PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();
    
    // In a real app, we'd apply actual redactions here
    // For now, we'll just simulate it by adding whiteout elements
    const newData = await pdfDoc.save();
    setPdfData(newData);
    pushState(newData, fileName, 'Apply Redactions');
    
    const loadingTask = pdfjsLib.getDocument({ data: newData });
    const newPdf = await loadingTask.promise;
    setPdfDoc(newPdf);
  }, [pdfData, fileName, pushState]);



  const handleFlattenForm = useCallback(async () => {
    if (!pdfData) return;
    const pdfDoc = await PDFLib.PDFDocument.load(pdfData);
    const form = pdfDoc.getForm();
    form.flatten();
    const newData = await pdfDoc.save();
    setPdfData(newData);
    pushState(newData, fileName, 'Flatten Form');
    
    const loadingTask = pdfjsLib.getDocument({ data: newData });
    const newPdf = await loadingTask.promise;
    setPdfDoc(newPdf);
  }, [pdfData, fileName, pushState]);

  const handleResetToOriginal = useCallback(() => {
    const original = getOriginalDocument();
    if (original) {
      setPdfData(original.data);
      setFileName(original.fileName);
      pdfjsLib.getDocument({ data: original.data }).promise.then(setPdfDoc);
      setEditElements([]);
      clearForm();
      clearSearch();
    }
  }, [getOriginalDocument, clearForm, clearSearch]);

  const handleCloseDocument = () => {
    setPdfData(null);
    setPdfDoc(null);
    setFileName('');
    setEditElements([]);
    clearForm();
    clearSearch();
  };

  const handleInsertBlankPage = useCallback(async () => {
    if (!pdfData) return;
    try {
      const newData = await insertBlankPages(pdfData, { position: currentPage + 1 });
      setPdfData(newData);
      pushState(newData, fileName, 'Insert Blank Page');
      
      const newPdf = await loadPDFDocument(newData);
      setPdfDoc(newPdf);
      setNumPages(newPdf.numPages);
    } catch (err) {
      console.error('Failed to insert blank page:', err);
    }
  }, [pdfData, fileName, pushState, currentPage]);

  // Utility Functions for PDF Manipulation
  const flattenTextBox = async (page: PDFLib.PDFPage, el: EditElement, pdfDoc: PDFLib.PDFDocument) => {
    const { height: pageHeight } = page.getSize();
    const x = el.x;
    const y = pageHeight - el.y - (el.height || 0);
    const width = el.width || 200;
    const height = el.height || 50;

    // Load fonts
    const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const helveticaOblique = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaOblique);
    const helveticaBoldOblique = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBoldOblique);

    // Draw background/border if boxStyle exists
    if (el.boxStyle) {
      const bgColor = el.boxStyle.backgroundColor ? parseRgba(el.boxStyle.backgroundColor) : null;
      const borderColor = el.boxStyle.borderColor ? parseRgba(el.boxStyle.borderColor) : null;

      page.drawRectangle({
        x,
        y,
        width,
        height,
        color: bgColor ? PDFLib.rgb(bgColor.r / 255, bgColor.g / 255, bgColor.b / 255) : undefined,
        borderColor: borderColor ? PDFLib.rgb(borderColor.r / 255, borderColor.g / 255, borderColor.b / 255) : undefined,
        borderWidth: el.boxStyle.borderWidth || 0,
        opacity: el.boxStyle.opacity !== undefined ? el.boxStyle.opacity : 1,
      });
    }

    // Draw text
    if (el.richText && el.richText.length > 0) {
      let currentX = x + (el.boxStyle?.padding || 0);
      let currentY = y + height - (el.boxStyle?.padding || 0) - (el.fontSize || 12);

      for (const segment of el.richText) {
        const segmentColor = segment.style.color ? parseRgba(segment.style.color) : (el.color ? parseRgba(el.color) : { r: 0, g: 0, b: 0, a: 1 });
        
        let font = helvetica;
        if (segment.style.fontWeight === 'bold' && segment.style.fontStyle === 'italic') font = helveticaBoldOblique;
        else if (segment.style.fontWeight === 'bold') font = helveticaBold;
        else if (segment.style.fontStyle === 'italic') font = helveticaOblique;

        const fontSize = segment.style.fontSize || el.fontSize || 12;

        page.drawText(segment.text, {
          x: currentX,
          y: currentY,
          size: fontSize,
          font,
          color: segmentColor ? PDFLib.rgb(segmentColor.r / 255, segmentColor.g / 255, segmentColor.b / 255) : PDFLib.rgb(0, 0, 0),
        });
        
        // Advance X based on text width
        currentX += font.widthOfTextAtSize(segment.text, fontSize);
      }
    } else if (el.content) {
      const textColor = el.color ? parseRgba(el.color) : { r: 0, g: 0, b: 0, a: 1 };
      page.drawText(el.content, {
        x: x + (el.boxStyle?.padding || 0),
        y: y + height - (el.boxStyle?.padding || 0) - (el.fontSize || 12),
        size: el.fontSize || 12,
        font: helvetica,
        color: textColor ? PDFLib.rgb(textColor.r / 255, textColor.g / 255, textColor.b / 255) : PDFLib.rgb(0, 0, 0),
      });
    }
  };

  const saveEditedPdf = useCallback(async () => {
    if (!pdfData) return null;
    const pdfDoc = await PDFLib.PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();

    // Apply editElements
    for (const el of editElements) {
      const page = pages[el.page - 1];
      const { width: pageWidth, height: pageHeight } = page.getSize();
      
      if (el.type === 'text') {
        await flattenTextBox(page, el, pdfDoc);
      } else if (el.type === 'image' && el.content) {
        const imageBytes = await fetch(el.content).then(res => res.arrayBuffer());
        let image;
        if (el.content.includes('png')) image = await pdfDoc.embedPng(imageBytes);
        else image = await pdfDoc.embedJpg(imageBytes);
        
        page.drawImage(image, {
          x: el.x,
          y: pageHeight - el.y - (el.height || 100),
          width: el.width || 100,
          height: el.height || 100,
        });
      } else if (el.type === 'whiteout') {
        page.drawRectangle({
          x: el.x,
          y: pageHeight - el.y - (el.height || 20),
          width: el.width || 100,
          height: el.height || 20,
          color: PDFLib.rgb(1, 1, 1),
        });
      }
    }

    // Apply annotations
    const allAnnotations = getAllAnnotations();
    for (const ann of allAnnotations) {
      const page = pages[ann.page - 1];
      const { height } = page.getSize();
      if (ann.type === 'text' && ann.content) {
        page.drawText(ann.content, {
          x: ann.x,
          y: height - ann.y - 12,
          size: 12,
          color: PDFLib.rgb(0, 0, 0),
        });
      }
    }

    return await pdfDoc.save();
  }, [pdfData, editElements, getAllAnnotations]);

  // Export
  const handleExport = useCallback(async () => {
    const editedData = await saveEditedPdf();
    if (!editedData) return;
    
    await downloadPDF(editedData, fileName || 'edited.pdf');
  }, [saveEditedPdf, fileName]);

  // Search Logic
  useEffect(() => {
    if (!query || !pdfDoc) {
      setResults([]);
      return;
    }

    const search = async () => {
      const newResults: any[] = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(' ');
        
        let index = text.toLowerCase().indexOf(query.toLowerCase());
        while (index !== -1) {
          newResults.push({ page: i, text: text.substr(index, query.length + 20), index });
          index = text.toLowerCase().indexOf(query.toLowerCase(), index + 1);
        }
      }
      setResults(newResults);
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query, pdfDoc, numPages, setResults]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'o':
            event.preventDefault();
            fileInputRef.current?.click();
            break;
          case 's':
            event.preventDefault();
            handleExport();
            break;
          case 'z':
            event.preventDefault();
            if (event.shiftKey) redoHistory();
            else undoHistory();
            break;
          case 'f':
            event.preventDefault();
            toggleSearch();
            break;
        }
      } else {
        switch (event.key) {
          case 'ArrowLeft':
          case 'p':
            setCurrentPage(p => Math.max(1, p - 1));
            break;
          case 'ArrowRight':
          case 'n':
            setCurrentPage(p => Math.min(numPages, p + 1));
            break;
          case 'v':
            setCurrentTool('select');
            break;
          case 't':
            setCurrentTool('text');
            break;
          case 'i':
            imageInputRef.current?.click();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages, setCurrentPage, toggleSearch, undoHistory, redoHistory, setCurrentTool, handleExport]);

  // UI Components
  const Sidebar = () => (
    <motion.div 
      initial={false}
      animate={{ width: sidebarOpen ? 320 : 0 }}
      className="bg-white border-r border-slate-200 overflow-hidden flex flex-col"
    >
      <div className="p-4 border-b border-slate-100 flex gap-2">
        <button 
          onClick={() => setActiveTab('pages')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'pages' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          Pages
        </button>
        <button 
          onClick={() => setActiveTab('edit')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'edit' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          Edit
        </button>
        <button 
          onClick={() => setActiveTab('actions')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'actions' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          Actions
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'pages' && (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: numPages }, (_, i) => i + 1).map(pNum => (
              <div 
                key={pNum}
                onClick={() => setCurrentPage(pNum)}
                className={`relative aspect-[3/4] bg-slate-100 rounded-lg border-2 cursor-pointer transition-all ${currentPage === pNum ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-slate-300'}`}
              >
                <div className="absolute top-2 left-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold">
                  {pNum}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'edit' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Content Tools</h4>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    const newElement: EditElement = {
                      id: Math.random().toString(36).substr(2, 9),
                      type: 'text',
                      page: currentPage,
                      x: 100,
                      y: 100,
                      width: 200,
                      height: 50,
                      content: 'New Text Block',
                      fontSize: 14,
                      color: 'rgba(0, 0, 0, 1)',
                      boxStyle: {
                        padding: 5
                      }
                    };
                    setEditElements(prev => [...prev, newElement]);
                    setSelectedElementId(newElement.id);
                  }}
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-bold"
                >
                  <Type size={16} /> Text
                </button>
                <button 
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-bold"
                >
                  <ImageIcon size={16} /> Image
                </button>
                <button className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-bold">
                  <Square size={16} /> Whiteout
                </button>
                <button className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-bold">
                  <Eraser size={16} /> Redact
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={async () => {
                  const newData = await saveEditedPdf();
                  if (newData) {
                    setPdfData(newData);
                    pushState(newData, fileName, 'Apply All Edits');
                    const newPdf = await loadPDFDocument(newData);
                    setPdfDoc(newPdf);
                    setEditElements([]);
                  }
                }}
                disabled={editElements.length === 0}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-30 flex items-center justify-center gap-2"
              >
                <Save size={18} /> Apply All Edits
              </button>
              <p className="mt-2 text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest">
                Permanently merge edits into PDF
              </p>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Page Actions</h4>
              <button 
                onClick={handleInsertBlankPage}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-blue-600">
                    <Plus size={18} />
                  </div>
                  <span className="text-sm font-bold">Insert Blank Page</span>
                </div>
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleRotatePages([currentPage], 90)}
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-bold"
                >
                  <RotateCw size={16} /> Rotate 90°
                </button>
                <button 
                  onClick={() => handleRotatePages([currentPage], -90)}
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-bold"
                >
                  <RotateCcw size={16} /> Rotate -90°
                </button>
              </div>

              <button 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf';
                  input.multiple = true;
                  input.onchange = async (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files.length > 0 && pdfData) {
                      const buffers = [pdfData.buffer];
                      for (let i = 0; i < files.length; i++) {
                        buffers.push(await files[i].arrayBuffer());
                      }
                      const merged = await mergePDFs(buffers);
                      setPdfData(merged);
                      pushState(merged, fileName, 'Merge PDFs');
                      const newPdf = await loadPDFDocument(merged);
                      setPdfDoc(newPdf);
                      setNumPages(newPdf.numPages);
                    }
                  };
                  input.click();
                }}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-blue-600">
                    <Layers size={18} />
                  </div>
                  <span className="text-sm font-bold">Merge with other PDFs</span>
                </div>
              </button>

              <button 
                onClick={async () => {
                  if (!pdfData) return;
                  const splitResults = await splitPDF(pdfData.buffer, { mode: 'every-n-pages', everyN: 1 });
                  // For now, just download the first split page as a demo
                  if (splitResults.length > 0) {
                    await downloadPDF(splitResults[0], `split_page_1.pdf`);
                  }
                }}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-blue-600">
                    <FileUp size={18} />
                  </div>
                  <span className="text-sm font-bold">Split into Pages</span>
                </div>
              </button>

              <button 
                onClick={() => handleDeletePages([currentPage])}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-red-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-red-600">
                    <Trash2 size={18} />
                  </div>
                  <span className="text-sm font-bold text-red-600">Delete Current Page</span>
                </div>
              </button>
            </div>



            <div className="space-y-2 pt-4 border-t border-slate-100">
              <button 
                onClick={handleResetToOriginal}
                className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-blue-600 transition-all text-sm font-bold"
              >
                <RefreshCw size={16} /> Reset to Original
              </button>
              <button 
                onClick={handleCloseDocument}
                className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-red-600 transition-all text-sm font-bold"
              >
                <X size={16} /> Close Document
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (!pdfData) {
    return (
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="h-full flex flex-col items-center justify-center bg-slate-50 p-8 transition-colors duration-200 [&.drag-over]:bg-blue-50"
      >
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-blue-200 rotate-3">
            <FileText size={48} className="text-white" />
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-black tracking-tighter">PDF Studio</h2>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">
              Professional PDF editing, annotation, and manipulation. All in your browser.
            </p>
          </div>
          <div className="pt-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept=".pdf" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
            >
              <Plus size={24} /> Select PDF File
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleMerge = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0 && pdfData) {
        const buffers = [pdfData.buffer];
        for (let i = 0; i < files.length; i++) {
          buffers.push(await files[i].arrayBuffer());
        }
        const merged = await mergePDFs(buffers);
        setPdfData(merged);
        pushState(merged, fileName, 'Merge PDFs');
        const newPdf = await loadPDFDocument(merged);
        setPdfDoc(newPdf);
        setNumPages(newPdf.numPages);
      }
    };
    input.click();
  }, [pdfData, fileName, pushState]);

  const handleSplit = useCallback(async () => {
    if (!pdfData) return;
    try {
      const splitResults = await splitPDF(pdfData.buffer, { mode: 'every-n-pages', everyN: 1 });
      if (splitResults.length > 0) {
        await downloadPDF(splitResults[0], `split_page_1.pdf`);
      }
    } catch (err) {
      console.error('Failed to split PDF:', err);
    }
  }, [pdfData]);

  const handleUndo = useCallback(() => {
    const state = undoHistory();
    if (state) {
      setPdfData(state.data);
      pdfjsLib.getDocument({ data: state.data }).promise.then(setPdfDoc);
    }
  }, [undoHistory]);

  const handleRedo = useCallback(() => {
    const state = redoHistory();
    if (state) {
      setPdfData(state.data);
      pdfjsLib.getDocument({ data: state.data }).promise.then(setPdfDoc);
    }
  }, [redoHistory]);

  const handleInsertImageFromToolbar = useCallback((images: any[]) => {
    if (images.length === 0) return;
    const img = images[0];
    const newElement: EditElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'image',
      page: currentPage,
      x: 50,
      y: 50,
      width: 200,
      height: 200,
      content: img.imageData
    };
    setEditElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  }, [currentPage]);

  const handleResetForm = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const handleExportFormData = useCallback((format: 'json' | 'fdf' | 'xfdf') => {
    // Implementation for exporting form data
    console.log(`Exporting form data as ${format}`);
  }, []);

  const handleImportFormData = useCallback(() => {
    // Implementation for importing form data
    console.log('Importing form data');
  }, []);

  const handleFitToPage = useCallback(() => {
    setZoomMode('fit-page');
    // Logic to calculate zoom to fit page
    if (pdfDoc && containerRef.current) {
      // This is a simplified version, real implementation would need page dimensions
      setZoom(0.8); 
    }
  }, [pdfDoc, setZoom, setZoomMode]);

  const handleFitToWidth = useCallback(() => {
    setZoomMode('fit-width');
    // Logic to calculate zoom to fit width
    setZoom(1.2);
  }, [setZoom, setZoomMode]);

  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(zoom + 0.1, 4.0));
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(zoom - 0.1, 0.1));
  }, [zoom, setZoom]);

  const handleTextFormatChange = useCallback((newStyle: Partial<TextStyle>) => {
    if (selectedElementId) {
      setEditElements(prev => prev.map(el => {
        if (el.id === selectedElementId) {
          const updatedEl = { ...el, ...newStyle };
          // If backgroundColor is provided, also update boxStyle for consistency
          if (newStyle.backgroundColor) {
            updatedEl.boxStyle = {
              ...(el.boxStyle || {}),
              backgroundColor: newStyle.backgroundColor
            };
          }
          return updatedEl;
        }
        return el;
      }));
    }
  }, [selectedElementId]);

  const selectedElement = editElements.find(el => el.id === selectedElementId);

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className="h-full flex flex-col bg-slate-100 overflow-hidden transition-colors duration-200 [&.drag-over]:bg-blue-50"
    >
      {/* Header */}
      <MainToolbar 
        currentPage={currentPage}
        totalPages={numPages}
        selectedPages={selectedPages}
        zoom={zoom}
        zoomMode={zoomMode}
        viewMode={viewMode}
        sidebarOpen={sidebarOpen}
        searchOpen={searchOpen}
        onOpenFile={loadFromFile}
        onExport={handleExport}
        onPreviousPage={() => setCurrentPage(p => Math.max(1, p - 1))}
        onNextPage={() => setCurrentPage(p => Math.min(numPages, p + 1))}
        onGoToPage={setCurrentPage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onSetZoom={setZoom}
        onFitToPage={handleFitToPage}
        onFitToWidth={handleFitToWidth}
        onRotatePages={handleRotatePages}
        onDeletePages={handleDeletePages}
        onInsertBlankPage={handleInsertBlankPage}
        onInsertFromFile={() => {}} // TODO: Implement insert from file
        onMerge={handleMerge}
        onSplit={handleSplit}
        hasDocument={!!pdfDoc}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndoHistory()}
        canRedo={canRedoHistory()}
        undoActionName={getUndoActionName()}
        redoActionName={getRedoActionName()}
        onResetToOriginal={handleResetToOriginal}
        onCloseDocument={handleCloseDocument}
        canResetToOriginal={!!getOriginalDocument()}
        onToggleSidebar={toggleSidebar}
        onSetViewMode={setViewMode}
        onToggleSearch={toggleSearch}
        onExportFormData={handleExportFormData}
        onImportFormData={handleImportFormData}
        onFlattenForm={handleFlattenForm}
        onResetForm={handleResetForm}
        onApplyRedactions={handleApplyRedactions}
        onInsertImage={handleInsertImageFromToolbar}
      />

      {!!pdfDoc && (
        <PageToolbar
          currentPage={currentPage}
          totalPages={numPages}
          selectedPages={selectedPages}
          onRotatePages={handleRotatePages}
          onDeletePages={handleDeletePages}
          onInsertBlankPage={handleInsertBlankPage}
          onInsertFromFile={() => {}} // TODO: Implement insert from file
          onMerge={handleMerge}
          onSplit={handleSplit}
          onExport={handleExport}
          hasDocument={!!pdfDoc}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndoHistory()}
          canRedo={canRedoHistory()}
          undoActionName={getUndoActionName()}
          redoActionName={getRedoActionName()}
          onResetToOriginal={handleResetToOriginal}
          onCloseDocument={handleCloseDocument}
          canResetToOriginal={!!getOriginalDocument()}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 relative overflow-auto bg-slate-200 p-8 flex justify-center items-start">
          <AnimatePresence>
            {searchOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-20"
              >
                <div className="flex items-center gap-3">
                  <Search size={18} className="text-slate-400" />
                  <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search document..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold"
                  />
                  <button onClick={toggleSearch} className="p-1 hover:bg-slate-100 rounded">
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div 
            ref={containerRef}
            className="bg-white shadow-2xl relative"
            onClick={(e) => {
              if (currentTool === 'text') {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                  const x = (e.clientX - rect.left) / zoom;
                  const y = (e.clientY - rect.top) / zoom;
                  const newElement: EditElement = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'text',
                    page: currentPage,
                    x,
                    y,
                    content: 'New Text',
                    fontSize: 12,
                    color: '#000000'
                  };
                  setEditElements(prev => [...prev, newElement]);
                  setSelectedElementId(newElement.id);
                  setCurrentTool('select');
                }
              }
            }}
          >
            {/* Text Formatting Toolbar */}
            <AnimatePresence>
              {selectedElement && selectedElement.type === 'text' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
                >
                  <TextFormatToolbar 
                    style={{
                      fontFamily: selectedElement.fontFamily || 'Arial',
                      fontSize: selectedElement.fontSize || 12,
                      fontWeight: selectedElement.fontWeight || 'normal',
                      fontStyle: selectedElement.fontStyle || 'normal',
                      textDecoration: selectedElement.textDecoration || 'none',
                      color: selectedElement.color || '#000000',
                      backgroundColor: selectedElement.boxStyle?.backgroundColor || 'transparent',
                      textAlign: selectedElement.textAlign || 'left',
                      lineHeight: selectedElement.lineHeight || 1.4,
                      letterSpacing: selectedElement.letterSpacing || 0
                    }}
                    onChange={handleTextFormatChange}
                    onClose={() => setSelectedElementId(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {isDetectingText && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-30 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw size={32} className="text-blue-600 animate-spin" />
                  <span className="text-sm font-black text-blue-600 uppercase tracking-widest">Detecting Text...</span>
                </div>
              </div>
            )}
            {/* Text Block Overlays (for editing existing text) */}
            {textBlocks.map(block => (
              <div
                key={block.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTextBlock(block);
                  setTiptapContent(segmentsToTipTapHTML(block.lines.flatMap(l => l.items.map(i => ({
                    text: i.str,
                    style: {
                      fontSize: i.fontSize,
                      fontFamily: i.fontName,
                      color: 'rgba(0,0,0,1)'
                    }
                  })))));
                }}
                className="absolute border border-transparent hover:border-blue-400 hover:bg-blue-400/10 cursor-text transition-all group"
                style={{
                  left: block.rect.x * zoom,
                  top: block.rect.y * zoom,
                  width: block.rect.width * zoom,
                  height: block.rect.height * zoom,
                  zIndex: 5
                }}
              >
                <div className="hidden group-hover:flex absolute -top-6 left-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap items-center gap-1">
                  <Type size={10} /> Edit Text
                </div>
              </div>
            ))}

            {/* Edit Elements */}
            {editElements.filter(el => el.page === currentPage).map(el => (
              <motion.div
                key={el.id}
                drag
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    setEditElements(prev => prev.map(item => 
                      item.id === el.id 
                        ? { ...item, x: item.x + info.offset.x / zoom, y: item.y + info.offset.y / zoom }
                        : item
                    ));
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(el.id);
                }}
                className={`absolute cursor-move group ${selectedElementId === el.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                style={{
                  left: el.x * zoom,
                  top: el.y * zoom,
                  zIndex: 10
                }}
              >
                {selectedElementId === el.id && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 p-1 flex items-center gap-1 z-20">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditElements(prev => prev.filter(item => item.id !== el.id));
                        setSelectedElementId(null);
                      }}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                    <button className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition-colors">
                      <Settings size={14} />
                    </button>
                  </div>
                )}

                {el.type === 'text' && (
                  <div 
                    style={{ 
                      fontSize: (el.fontSize || 12) * zoom, 
                      color: el.color,
                      fontFamily: el.fontFamily,
                      fontWeight: el.fontWeight,
                      fontStyle: el.fontStyle,
                      textDecoration: el.textDecoration,
                      textAlign: el.textAlign,
                      lineHeight: el.lineHeight,
                      letterSpacing: el.letterSpacing ? `${el.letterSpacing * zoom}px` : undefined,
                      backgroundColor: el.boxStyle?.backgroundColor,
                      borderColor: el.boxStyle?.borderColor,
                      borderWidth: (el.boxStyle?.borderWidth || 0) * zoom,
                      padding: (el.boxStyle?.padding || 0) * zoom,
                      borderRadius: (el.boxStyle?.borderRadius || 0) * zoom,
                      opacity: el.boxStyle?.opacity,
                      minWidth: '20px',
                      minHeight: '1em'
                    }}
                    dangerouslySetInnerHTML={{ __html: el.content || '' }}
                  />
                )}
                {el.type === 'image' && el.content && (
                  <img 
                    src={el.content} 
                    alt="edit" 
                    style={{ width: (el.width || 100) * zoom, height: (el.height || 100) * zoom }} 
                    referrerPolicy="no-referrer"
                  />
                )}
                {el.type === 'whiteout' && (
                  <div style={{ 
                    width: (el.width || 100) * zoom, 
                    height: (el.height || 20) * zoom, 
                    backgroundColor: 'white',
                    border: '1px dashed #ccc'
                  }} />
                )}
              </motion.div>
            ))}

            {/* Annotations */}
            {getAllAnnotations().filter(ann => ann.page === currentPage).map(ann => (
              <div
                key={ann.id}
                style={{
                  position: 'absolute',
                  left: ann.x * zoom,
                  top: ann.y * zoom,
                  pointerEvents: 'none'
                }}
              >
                {ann.type === 'text' && (
                  <span style={{ fontSize: 12 * zoom }}>{ann.content}</span>
                )}
              </div>
            ))}
          </div>

          {/* Text Block Editor Modal */}
          <AnimatePresence>
            {editingTextBlock && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
                >
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-xl text-white">
                        <Type size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black tracking-tight">Edit PDF Text</h3>
                        <p className="text-xs text-slate-500 font-bold">Rich text editing with Tiptap</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEditingTextBlock(null)}
                      className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6 flex-1">
                    <TiptapEditor 
                      content={tiptapContent} 
                      onChange={setTiptapContent} 
                    />
                    <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                      <Zap size={18} className="text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        Editing existing PDF text will hide the original text and place a new text layer on top. 
                        Formatting may vary slightly from the original document.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                      onClick={() => setEditingTextBlock(null)}
                      className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (editingTextBlock) {
                          // 1. Add whiteout to hide original text
                          const whiteout: EditElement = {
                            id: `whiteout-${editingTextBlock.id}`,
                            type: 'whiteout',
                            page: currentPage,
                            x: editingTextBlock.rect.x,
                            y: editingTextBlock.rect.y,
                            width: editingTextBlock.rect.width,
                            height: editingTextBlock.rect.height
                          };

                          // 2. Add new rich text element
                          const newText: EditElement = {
                            id: `edit-${editingTextBlock.id}`,
                            type: 'text',
                            page: currentPage,
                            x: editingTextBlock.rect.x,
                            y: editingTextBlock.rect.y,
                            width: editingTextBlock.rect.width,
                            height: editingTextBlock.rect.height,
                            content: tiptapContent,
                            richText: parseTipTapHTML(tiptapContent),
                            fontSize: editingTextBlock.style.fontSize,
                            color: editingTextBlock.style.fontColor || 'rgba(0,0,0,1)',
                            boxStyle: {
                              padding: 0
                            }
                          };

                          setEditElements(prev => [...prev, whiteout, newText]);
                          setEditingTextBlock(null);
                        }
                      }}
                      className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      Apply Changes
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <input 
        type="file" 
        ref={imageInputRef} 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleInsertImage(file);
        }} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
