
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
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.js?url';
import { MainToolbar } from './MainToolbar';
import { OutlinePanel } from './PDFViewer/OutlinePanel';
import { ThumbnailPanel } from './PDFViewer/ThumbnailPanel';
import StampStudio from './StampStudio';
import { SignaturePad } from './DigitalSignCenter';
import { 
  useUIStore, 
  useSearchStore, 
  useAnnotationStore, 
  useAnnotationHistoryStore, 
  useFormStore, 
  useEditingStore, 
  useHistoryStore,
  useStampStore,
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
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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
  const { query, results, currentResultIndex, setQuery, setResults, nextResult, previousResult, clearSearch } = useSearchStore();
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
  const [showStampStudio, setShowStampStudio] = useState(false);
  const [showSignCenter, setShowSignCenter] = useState(false);
  const { config: stampConfig } = useStampStore();
  const [inlineEditingBlockId, setInlineEditingBlockId] = useState<string | null>(null);
  const [inlineEditContent, setInlineEditContent] = useState<string>('');
  const [activePanel, setActivePanel] = useState<'outline' | 'thumbnails'>('thumbnails');

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load PDF
  const loadFromFile = useCallback(async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      setPdfData(data);
      setFileName(file.name);
      setOriginalDocument(data, file.name);
      
      const pdf = await loadPDFDocument(data);
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      
      // Clear state
      setEditElements([]);
      clearForm();
      clearSearch();
    } catch (error) {
      console.error('Failed to load PDF:', error);
      // You could add a toast or alert here
    }
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
        const container = canvasContainerRef.current;
        if (container) {
          container.innerHTML = '';
          container.appendChild(canvas);
          container.style.width = `${viewport.width}px`;
          container.style.height = `${viewport.height}px`;
        }
        if (containerRef.current) {
          containerRef.current.style.width = `${viewport.width}px`;
          containerRef.current.style.height = `${viewport.height}px`;
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

  const handleSaveInlineEdit = useCallback((block: TextBlock) => {
    if (!pdfData || !inlineEditContent.trim()) {
      setInlineEditingBlockId(null);
      return;
    }

    // Create whiteout to hide original text
    const whiteout: EditElement = {
      id: `whiteout-${block.id}`,
      type: 'whiteout',
      page: currentPage,
      x: block.rect.x,
      y: block.rect.y,
      width: block.rect.width,
      height: block.rect.height
    };

    // Create new text element
    const newText: EditElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      page: currentPage,
      x: block.rect.x,
      y: block.rect.y,
      width: block.rect.width,
      height: block.rect.height,
      content: inlineEditContent,
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      color: '#000000'
    };

    const newElements = [...editElements, whiteout, newText];
    setEditElements(newElements);
    pushState(pdfData, fileName, 'Edit Text', newElements);
    setInlineEditingBlockId(null);
  }, [pdfData, currentPage, editElements, fileName, pushState, inlineEditContent]);

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
      const newElements = [...editElements, newElement];
      setEditElements(newElements);
      pushState(pdfData!, fileName, 'Insert Image', newElements);
      setSelectedElementId(newElement.id);
    };
    reader.readAsDataURL(file);
  }, [currentPage, editElements, pdfData, fileName, pushState]);

  const handleApplyRedactions = useCallback(async () => {
    if (!pdfData) return;
    const pdfDoc = await PDFLib.PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();
    
    // In a real app, we'd apply actual redactions here
    // For now, we'll just simulate it by adding whiteout elements
    const newData = await pdfDoc.save();
    setPdfData(newData);
    pushState(newData, fileName, 'Apply Redactions');
    
    const newPdf = await loadPDFDocument(newData);
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
    
    const newPdf = await loadPDFDocument(newData);
    setPdfDoc(newPdf);
  }, [pdfData, fileName, pushState]);

  const handleResetToOriginal = useCallback(() => {
    const original = getOriginalDocument();
    if (original) {
      setPdfData(original.data);
      setFileName(original.fileName);
      loadPDFDocument(original.data).then(setPdfDoc);
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

  const handleUndo = useCallback(() => {
    if (!canUndoHistory() || undoRedoInProgress) return;
    setUndoRedoInProgress(true);
    try {
      const state = undoHistory();
      if (state) {
        setPdfData(state.data);
        if (state.editElements) setEditElements(state.editElements);
        loadPDFDocument(state.data).then(setPdfDoc);
      }
    } finally {
      setUndoRedoInProgress(false);
    }
  }, [undoHistory, canUndoHistory, undoRedoInProgress, setUndoRedoInProgress]);

  const handleRedo = useCallback(() => {
    if (!canRedoHistory() || undoRedoInProgress) return;
    setUndoRedoInProgress(true);
    try {
      const state = redoHistory();
      if (state) {
        setPdfData(state.data);
        if (state.editElements) setEditElements(state.editElements);
        loadPDFDocument(state.data).then(setPdfDoc);
      }
    } finally {
      setUndoRedoInProgress(false);
    }
  }, [redoHistory, canRedoHistory, undoRedoInProgress, setUndoRedoInProgress]);

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
            if (event.shiftKey) handleRedo();
            else handleUndo();
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
          case 'Delete':
          case 'Backspace':
            if (selectedElementId) {
              const newElements = editElements.filter(item => item.id !== selectedElementId);
              setEditElements(newElements);
              pushState(pdfData!, fileName, 'Delete Element', newElements);
              setSelectedElementId(null);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages, setCurrentPage, toggleSearch, handleUndo, handleRedo, setCurrentTool, handleExport, selectedElementId, editElements, pdfData, fileName, pushState]);

  const handleMerge = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0 && pdfData) {
        const buffers: (ArrayBuffer | Uint8Array)[] = [pdfData];
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
      const splitResults = await splitPDF(pdfData, { mode: 'every-n-pages', everyN: 1 });
      if (splitResults.length > 0) {
        await downloadPDF(splitResults[0], `split_page_1.pdf`);
      }
    } catch (err) {
      console.error('Failed to split PDF:', err);
    }
  }, [pdfData]);

  const handleInsertFromFile = useCallback(async (position: number) => {
    if (!pdfData) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const buffer = await file.arrayBuffer();
          const updatedPdf = await insertPagesFromPDF(pdfData, buffer, position);
          setPdfData(updatedPdf);
          pushState(updatedPdf, fileName, 'Insert PDF');
          const newDoc = await loadPDFDocument(updatedPdf);
          setPdfDoc(newDoc);
          setNumPages(newDoc.numPages);
        } catch (err) {
          console.error('Failed to insert PDF:', err);
        }
      }
    };
    input.click();
  }, [pdfData, fileName, pushState]);

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
    const newElements = [...editElements, newElement];
    setEditElements(newElements);
    pushState(pdfData!, fileName, 'Insert Image', newElements);
    setSelectedElementId(newElement.id);
  }, [currentPage, editElements, pdfData, fileName, pushState]);

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
      const newElements = editElements.map(el => {
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
      });
      setEditElements(newElements);
      pushState(pdfData!, fileName, 'Format Text', newElements);
    }
  }, [selectedElementId, editElements, pdfData, fileName, pushState]);

  const selectedElement = editElements.find(el => el.id === selectedElementId);

  // UI Components
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
        onInsertFromFile={handleInsertFromFile}
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
        onInsertStamp={() => setShowStampStudio(true)}
        onSignDocument={() => setShowSignCenter(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {!pdfData ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8">
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
        ) : (
          <>
            {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && !!pdfDoc && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white border-r border-slate-200 flex flex-col overflow-hidden z-20 shadow-xl"
            >
              <div className="flex items-center p-4 border-b border-slate-100 bg-slate-50/50 gap-2">
                <button
                  onClick={() => setActivePanel('thumbnails')}
                  title="Thumbnails"
                  className={`flex-1 flex items-center justify-center py-2 transition-all rounded-lg ${
                    activePanel === 'thumbnails' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Layers size={18} />
                </button>
                <button
                  onClick={() => setActivePanel('outline')}
                  title="Outline"
                  className={`flex-1 flex items-center justify-center py-2 transition-all rounded-lg ${
                    activePanel === 'outline' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activePanel === 'thumbnails' ? (
                  <ThumbnailPanel 
                    document={pdfDoc!} 
                    currentPage={currentPage}
                    onPageSelect={(page) => setCurrentPage(page)}
                  />
                ) : (
                  <OutlinePanel 
                    document={pdfDoc!}
                    onPageSelect={(page) => setCurrentPage(page)}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  const newElements = [...editElements, newElement];
                  setEditElements(newElements);
                  pushState(pdfData!, fileName, 'Add Text', newElements);
                  setSelectedElementId(newElement.id);
                  setCurrentTool('select');
                }
              }
            }}
          >
            {/* Dedicated container for the PDF canvas to avoid React NotFoundError */}
            <div ref={canvasContainerRef} className="absolute inset-0 pointer-events-none" />

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
              <React.Fragment key={block.id}>
                {/* Inline Editor */}
                {inlineEditingBlockId === block.id ? (
                  <div
                    className="absolute border-2 border-blue-500 bg-white shadow-xl rounded z-50"
                    style={{
                      left: block.rect.x * zoom,
                      top: block.rect.y * zoom,
                      width: Math.max(block.rect.width * zoom, 200),
                      minHeight: Math.max(block.rect.height * zoom, 60),
                      zIndex: 100
                    }}
                  >
                    <div className="p-2 flex flex-col h-full">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-blue-600">Editing Text</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSaveInlineEdit(block)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setInlineEditingBlockId(null)}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={inlineEditContent}
                        onChange={(e) => setInlineEditContent(e.target.value)}
                        className="flex-1 w-full p-2 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleSaveInlineEdit(block);
                          }
                          if (e.key === 'Escape') {
                            setInlineEditingBlockId(null);
                          }
                        }}
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        Press Ctrl+Enter to save, Esc to cancel
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Normal text block overlay */
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      // Start inline editing instead of opening modal
                      setInlineEditingBlockId(block.id);
                      // Extract text from block
                      const blockText = block.lines.map(line => 
                        line.items.map(item => item.str).join('')
                      ).join('\n');
                      setInlineEditContent(blockText);
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
                )}
              </React.Fragment>
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
                    const newElements = editElements.map(item => 
                      item.id === el.id 
                        ? { ...item, x: item.x + info.offset.x / zoom, y: item.y + info.offset.y / zoom }
                        : item
                    );
                    setEditElements(newElements);
                    pushState(pdfData!, fileName, 'Move Element', newElements);
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
                        const newElements = editElements.filter(item => item.id !== el.id);
                        setEditElements(newElements);
                        pushState(pdfData!, fileName, 'Delete Element', newElements);
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

        </div>
        </>
        )}
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

      {/* Stamp Studio Modal */}
      {showStampStudio && (
        <StampStudio 
          onClose={() => setShowStampStudio(false)} 
          onApply={(svgData) => {
            const newElement: EditElement = {
              id: Math.random().toString(36).substr(2, 9),
              type: 'image',
              page: currentPage,
              x: 50,
              y: 50,
              width: 200,
              height: 200,
              content: svgData
            };
            const newElements = [...editElements, newElement];
            setEditElements(newElements);
            pushState(pdfData!, fileName, 'Insert Stamp', newElements);
            setSelectedElementId(newElement.id);
            setShowStampStudio(false);
          }}
        />
      )}

      {/* Digital Sign Center Modal */}
      {showSignCenter && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-bottom border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Digital Signature Center</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Capture and apply your professional signature</p>
              </div>
              <button 
                onClick={() => setShowSignCenter(false)}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <SignaturePad 
                onSave={(signature) => {
                  const newElement: EditElement = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'image',
                    page: currentPage,
                    x: 50,
                    y: 50,
                    width: 200,
                    height: 100,
                    content: signature
                  };
                  const newElements = [...editElements, newElement];
                  setEditElements(newElements);
                  pushState(pdfData!, fileName, 'Insert Signature', newElements);
                  setSelectedElementId(newElement.id);
                  setShowSignCenter(false);
                }} 
                onCancel={() => setShowSignCenter(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
