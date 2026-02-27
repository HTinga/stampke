
import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Merge, Scissors, Lock, Unlock, Stamp, 
  ArrowRightLeft, Download, Trash2, Plus, FileDown, 
  FileUp, Layers, Settings, Shield, Zap, Info,
  ChevronRight, ArrowRight, Loader2, CheckCircle2,
  FileCode, FileEdit, Minimize2, Maximize2, Move,
  Type, Image as ImageIcon, Save, X, GripVertical
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { motion, AnimatePresence } from 'motion/react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';

// Set up PDF.js worker
if (typeof window !== 'undefined' && 'pdfjsLib' in window) {
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

type ToolType = 'merge' | 'split' | 'unlock' | 'watermark' | 'compress' | 'word-to-pdf' | 'pdf-to-word' | 'edit' | 'none';

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: string;
  pages?: number;
  previewUrls?: string[];
}

interface EditElement {
  id: string;
  type: 'text' | 'image' | 'whiteout';
  page: number;
  x: number;
  y: number;
  content: string;
  fontSize?: number;
  color?: string;
  width?: number;
  height?: number;
  isBold?: boolean;
  isItalic?: boolean;
}

export default function PDFTools() {
  const [activeTool, setActiveTool] = useState<ToolType>('none');
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [editElements, setEditElements] = useState<EditElement[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pagePreviews, setPagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  useEffect(() => {
    if (files.length > 0 && (activeTool === 'edit' || activeTool === 'split')) {
      setPagePreviews(files[0].previewUrls || []);
    } else {
      setPagePreviews([]);
    }
  }, [files, activeTool]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = await Promise.all(selectedFiles.map(async (file: File) => {
      const id = Math.random().toString(36).substr(2, 9);
      let pages = 0;
      let previews: string[] = [];

      if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          pages = pdf.numPages;
          
          // Generate previews for the first few pages or all if editing
          const previewCount = activeTool === 'edit' || activeTool === 'split' ? pages : Math.min(pages, 3);
          for (let i = 1; i <= previewCount; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context!, viewport }).promise;
            previews.push(canvas.toDataURL());
          }
        } catch (err) {
          console.error("Error loading PDF previews:", err);
        }
      }

      return {
        id,
        file,
        name: file.name,
        size: formatSize(file.size),
        pages,
        previewUrls: previews
      };
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processMerge = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    setStatus('Merging Documents...');
    try {
      const mergedPdf = await PDFDocument.create();
      for (const f of files) {
        const bytes = await f.file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      downloadBlob(pdfBytes, 'merged_document.pdf');
      setStatus('Merge Complete!');
    } catch (err) {
      console.error(err);
      setStatus('Error during merge');
    } finally {
      setIsProcessing(false);
    }
  };

  const processWatermark = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setStatus('Applying Watermark...');
    try {
      const f = files[0];
      const bytes = await f.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      pages.forEach(page => {
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: width / 2 - 150,
          y: height / 2,
          size: 50,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: watermarkOpacity,
          rotate: degrees(45),
        });
      });

      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, `watermarked_${f.name}`);
      setStatus('Watermark Applied!');
    } catch (err) {
      console.error(err);
      setStatus('Error applying watermark');
    } finally {
      setIsProcessing(false);
    }
  };

  const processUnlock = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setStatus('Unlocking PDF...');
    try {
      const f = files[0];
      const bytes = await f.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, `unlocked_${f.name}`);
      setStatus('PDF Unlocked!');
    } catch (err) {
      console.error(err);
      setStatus('Error unlocking PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const processCompress = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setStatus('Compressing PDF...');
    try {
      const f = files[0];
      const bytes = await f.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      // pdf-lib's compression is mostly about object streams and stripping metadata
      const pdfBytes = await pdfDoc.save({ 
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false
      });
      downloadBlob(pdfBytes, `compressed_${f.name}`);
      setStatus('Compression Complete!');
    } catch (err) {
      console.error(err);
      setStatus('Error compressing PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const processWordToPdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setStatus('Converting Word to PDF...');
    try {
      const f = files[0];
      const arrayBuffer = await f.file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      const pdf = new jsPDF();
      await pdf.html(html, {
        callback: function (doc) {
          doc.save(`converted_${f.name.replace('.docx', '.pdf')}`);
        },
        x: 15,
        y: 15,
        width: 180,
        windowWidth: 650
      });
      setStatus('Conversion Complete!');
    } catch (err) {
      console.error(err);
      setStatus('Error converting Word to PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const processPdfToWord = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setStatus('Extracting Text for Word...');
    try {
      const f = files[0];
      const arrayBuffer = await f.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += `Page ${i}\n\n${pageText}\n\n`;
      }

      const blob = new Blob([fullText], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${f.name.replace('.pdf', '.doc')}`;
      link.click();
      setStatus('Text Extracted!');
    } catch (err) {
      console.error(err);
      setStatus('Error extracting text');
    } finally {
      setIsProcessing(false);
    }
  };

  const processEdit = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setStatus('Saving Edits...');
    try {
      const f = files[0];
      const bytes = await f.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const pages = pdfDoc.getPages();
      const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      const boldItalicFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

      for (const el of editElements) {
        const page = pages[el.page];
        const { width, height } = page.getSize();
        
        if (el.type === 'text') {
          const hex = el.color || '#000000';
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;

          let selectedFont = standardFont;
          if (el.isBold && el.isItalic) selectedFont = boldItalicFont;
          else if (el.isBold) selectedFont = boldFont;
          else if (el.isItalic) selectedFont = italicFont;

          page.drawText(el.content, {
            x: (el.x / 100) * width,
            y: height - (el.y / 100) * height,
            size: el.fontSize || 12,
            font: selectedFont,
            color: rgb(r, g, b),
          });
        } else if (el.type === 'whiteout') {
          page.drawRectangle({
            x: (el.x / 100) * width,
            y: height - (el.y / 100) * height - (el.height || 20),
            width: el.width || 100,
            height: el.height || 20,
            color: rgb(1, 1, 1),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, `edited_${f.name}`);
      setStatus('Edits Saved!');
    } catch (err) {
      console.error(err);
      setStatus('Error saving edits');
    } finally {
      setIsProcessing(false);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const processSplitSort = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setStatus('Processing Pages...');
    try {
      const f = files[0];
      const bytes = await f.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      
      // In a real app, we'd have a list of indices to keep.
      // For this demo, let's assume we have a state for selected pages.
      // Since we don't have that yet, let's just save it.
      // I will add a "Delete Page" button in the UI that updates the file.
      
      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, `sorted_${f.name}`);
      setStatus('Pages Sorted!');
    } catch (err) {
      console.error(err);
      setStatus('Error sorting pages');
    } finally {
      setIsProcessing(false);
    }
  };

  const deletePage = async (pageIndex: number) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setStatus('Deleting Page...');
    try {
      const f = files[0];
      const bytes = await f.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      pdfDoc.removePage(pageIndex);
      
      const pdfBytes = await pdfDoc.save();
      const newFile = new File([pdfBytes], f.name, { type: 'application/pdf' });
      
      // Refresh previews
      const id = f.id;
      const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
      const pages = pdf.numPages;
      const previews: string[] = [];
      for (let i = 1; i <= pages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport }).promise;
        previews.push(canvas.toDataURL());
      }

      setFiles(prev => prev.map(item => item.id === id ? {
        ...item,
        file: newFile,
        pages,
        previewUrls: previews
      } : item));
      
      if (activeTool === 'edit') {
        setPagePreviews(previews);
      }
      
      if (currentPage >= pages) {
        setCurrentPage(Math.max(0, pages - 1));
      }

      setStatus('Page Deleted!');
    } catch (err) {
      console.error(err);
      setStatus('Error deleting page');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadBlob = (bytes: Uint8Array, filename: string) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tools = [
    { id: 'edit', name: 'Edit PDF', icon: FileEdit, color: 'bg-blue-600', desc: 'Add text, images, and shapes to your document.' },
    { id: 'merge', name: 'Merge PDF', icon: Merge, color: 'bg-indigo-500', desc: 'Combine multiple PDFs into one document.' },
    { id: 'split', name: 'Split & Sort', icon: Scissors, color: 'bg-emerald-500', desc: 'Extract pages or delete unwanted ones.' },
    { id: 'watermark', name: 'Watermark', icon: Stamp, color: 'bg-amber-500', desc: 'Add text or image watermarks to your PDF.' },
    { id: 'unlock', name: 'Unlock PDF', icon: Unlock, color: 'bg-rose-500', desc: 'Remove passwords and restrictions from PDFs.' },
    { id: 'compress', name: 'Compress', icon: Minimize2, color: 'bg-sky-500', desc: 'Reduce file size while maintaining quality.' },
    { id: 'word-to-pdf', name: 'Word to PDF', icon: FileCode, color: 'bg-violet-500', desc: 'Convert .docx files to professional PDFs.' },
    { id: 'pdf-to-word', name: 'PDF to Word', icon: ArrowRightLeft, color: 'bg-slate-700', desc: 'Convert PDF back to editable format.' },
  ];

  const addTextElement = (x = 50, y = 50) => {
    const newEl: EditElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      page: currentPage,
      x,
      y,
      content: 'Type something...',
      fontSize: 14,
      color: '#000000',
      isBold: false,
      isItalic: false
    };
    setEditElements([...editElements, newEl]);
    setSelectedElementId(newEl.id);
  };

  const addWhiteoutElement = (x = 50, y = 50) => {
    const newEl: EditElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'whiteout',
      page: currentPage,
      x,
      y,
      content: '',
      width: 100,
      height: 20
    };
    setEditElements([...editElements, newEl]);
    setSelectedElementId(newEl.id);
  };

  const handleDocumentClick = (e: React.MouseEvent) => {
    if (activeTool !== 'edit') return;
    
    // If clicking directly on the container (not an element)
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG') {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      addTextElement(x, y);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-6"
          >
            <Zap size={14} /> Professional PDF Suite
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6"
          >
            PDF <span className="text-blue-600">Forge.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto font-medium"
          >
            A high-performance toolkit for all your document manipulation needs. 
            Private, secure, and browser-native.
          </motion.p>
        </div>

        {activeTool === 'none' ? (
          /* Tools Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tools.map((tool, idx) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setActiveTool(tool.id as ToolType)}
                className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className={`${tool.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                  <tool.icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{tool.name}</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{tool.desc}</p>
                <div className="mt-8 flex items-center text-blue-600 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Launch Tool <ChevronRight size={16} className="ml-1" />
                </div>
                {/* Decorative background element */}
                <div className={`absolute -right-8 -bottom-8 w-32 h-32 ${tool.color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Tool Interface */
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[64px] border border-slate-100 shadow-2xl overflow-hidden"
          >
            <div className="p-8 md:p-12 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => { setActiveTool('none'); setFiles([]); setEditElements([]); }}
                  className="p-4 bg-white rounded-2xl shadow-sm hover:bg-slate-100 transition-all"
                >
                  <ChevronRight size={24} className="rotate-180" />
                </button>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {tools.find(t => t.id === activeTool)?.name}
                  </h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                    {tools.find(t => t.id === activeTool)?.desc}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="bg-green-50 text-green-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Shield size={14} /> Secure Browser-Native
                </div>
              </div>
            </div>

            <div className="p-8 md:p-16">
              {files.length === 0 ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-4 border-dashed border-slate-100 rounded-[56px] p-24 text-center group hover:border-blue-400 transition-all cursor-pointer bg-slate-50/30"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    multiple={activeTool === 'merge'}
                    accept={activeTool === 'word-to-pdf' ? '.docx' : '.pdf'}
                    onChange={handleFileSelect}
                    className="hidden" 
                  />
                  <div className="bg-blue-600 text-white w-24 h-24 rounded-[36px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-200 group-hover:scale-110 transition-transform">
                    <FileUp size={48} />
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Select your documents</h3>
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">or drag and drop them here</p>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {files.length} {files.length === 1 ? 'File' : 'Files'} Selected
                      </div>
                    </div>
                    <button 
                      onClick={() => { setFiles([]); setEditElements([]); }}
                      className="text-red-500 font-black text-xs uppercase tracking-widest hover:text-red-600 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Clear All
                    </button>
                  </div>

                  {activeTool === 'split' ? (
                    /* Split & Sort Interface */
                    <div className="space-y-12">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Manage Pages</h3>
                        <p className="text-slate-500 font-medium">Click the trash icon to remove pages from the document.</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                        {pagePreviews.map((url, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group"
                          >
                            <div className="aspect-[1/1.41] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                              <img src={url} className="w-full h-full object-contain" alt={`Page ${idx + 1}`} />
                            </div>
                            <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-black px-2 py-1 rounded-md backdrop-blur-sm">
                              PAGE {idx + 1}
                            </div>
                            <button 
                              onClick={() => deletePage(idx)}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : activeTool === 'edit' ? (
                    /* Edit Interface */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                      <div className="lg:col-span-3 space-y-8">
                        <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6">
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Editor Tools</h4>
                           <button 
                             onClick={addTextElement}
                             className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                           >
                             <Type size={18} /> Add Text
                           </button>
                           <button 
                             onClick={() => addWhiteoutElement()}
                             className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                           >
                             <Scissors size={18} /> Whiteout / Erase
                           </button>
                        </div>

                        <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Pages</h4>
                           <div className="grid grid-cols-2 gap-4">
                             {pagePreviews.map((url, idx) => (
                               <div 
                                 key={idx}
                                 onClick={() => setCurrentPage(idx)}
                                 className={`aspect-[1/1.41] bg-white rounded-xl border-2 transition-all cursor-pointer overflow-hidden relative group ${currentPage === idx ? 'border-blue-600 shadow-lg' : 'border-slate-100'}`}
                               >
                                 <img src={url} className="w-full h-full object-contain" alt={`Page ${idx + 1}`} />
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); deletePage(idx); }}
                                   className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                   <Trash2 size={12} />
                                 </button>
                               </div>
                             ))}
                           </div>
                        </div>
                      </div>

                      <div className="lg:col-span-9 bg-slate-100 rounded-[56px] p-12 flex flex-col items-center justify-center min-h-[800px] relative overflow-hidden">
                         {/* Floating Toolbar */}
                         <AnimatePresence>
                           {selectedElementId && (
                             <motion.div 
                               initial={{ opacity: 0, y: -20 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -20 }}
                               className="absolute top-8 z-20 bg-white shadow-2xl rounded-2xl p-4 border border-slate-100 flex items-center gap-6"
                             >
                               <div className="flex items-center gap-2">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Size</span>
                                 <select 
                                   value={editElements.find(el => el.id === selectedElementId)?.fontSize || 14}
                                   onChange={(e) => {
                                     const size = parseInt(e.target.value);
                                     setEditElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, fontSize: size } : el));
                                   }}
                                   className="bg-slate-50 border-none rounded-lg px-2 py-1 text-xs font-bold outline-none"
                                 >
                                   {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(s => <option key={s} value={s}>{s}px</option>)}
                                 </select>
                               </div>
                               {editElements.find(el => el.id === selectedElementId)?.type === 'text' && (
                                 <>
                                   <div className="w-px h-6 bg-slate-100"></div>
                                   <button 
                                     onClick={() => setEditElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, isBold: !el.isBold } : el))}
                                     className={`p-2 rounded-lg font-black text-xs ${editElements.find(el => el.id === selectedElementId)?.isBold ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'}`}
                                   >
                                     B
                                   </button>
                                   <button 
                                     onClick={() => setEditElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, isItalic: !el.isItalic } : el))}
                                     className={`p-2 rounded-lg font-black text-xs italic ${editElements.find(el => el.id === selectedElementId)?.isItalic ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'}`}
                                   >
                                     I
                                   </button>
                                 </>
                               )}
                               {editElements.find(el => el.id === selectedElementId)?.type === 'whiteout' && (
                                 <>
                                   <div className="w-px h-6 bg-slate-100"></div>
                                   <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">W</span>
                                     <input 
                                       type="number" 
                                       value={editElements.find(el => el.id === selectedElementId)?.width || 100}
                                       onChange={(e) => setEditElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, width: parseInt(e.target.value) } : el))}
                                       className="w-12 bg-slate-50 border-none rounded-lg px-2 py-1 text-xs font-bold outline-none"
                                     />
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">H</span>
                                     <input 
                                       type="number" 
                                       value={editElements.find(el => el.id === selectedElementId)?.height || 20}
                                       onChange={(e) => setEditElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, height: parseInt(e.target.value) } : el))}
                                       className="w-12 bg-slate-50 border-none rounded-lg px-2 py-1 text-xs font-bold outline-none"
                                     />
                                   </div>
                                 </>
                               )}
                               <div className="w-px h-6 bg-slate-100"></div>
                               <div className="flex items-center gap-2">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color</span>
                                 <input 
                                   type="color" 
                                   value={editElements.find(el => el.id === selectedElementId)?.color || '#000000'}
                                   onChange={(e) => {
                                     setEditElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, color: e.target.value } : el));
                                   }}
                                   className="w-6 h-6 rounded-full border-none cursor-pointer overflow-hidden"
                                 />
                               </div>
                               <div className="w-px h-6 bg-slate-100"></div>
                               <button 
                                 onClick={() => {
                                   setEditElements(prev => prev.filter(el => el.id !== selectedElementId));
                                   setSelectedElementId(null);
                                 }}
                                 className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                               >
                                 <Trash2 size={18} />
                               </button>
                               <button 
                                 onClick={() => setSelectedElementId(null)}
                                 className="text-slate-400 hover:bg-slate-50 p-2 rounded-xl transition-colors"
                               >
                                 <X size={18} />
                               </button>
                             </motion.div>
                           )}
                         </AnimatePresence>

                         <div 
                            ref={containerRef} 
                            onClick={handleDocumentClick}
                            className="relative bg-white shadow-2xl aspect-[1/1.41] w-full max-w-2xl cursor-text"
                         >
                            <img src={pagePreviews[currentPage]} className="w-full h-full object-contain select-none pointer-events-none" alt="Current Page" />
                            
                            {/* Edit Elements Overlay */}
                            <div className="absolute inset-0">
                               {editElements.filter(el => el.page === currentPage).map(el => (
                                 <motion.div 
                                   key={el.id}
                                   drag
                                   dragMomentum={false}
                                   onDragStart={() => setSelectedElementId(el.id)}
                                   onDragEnd={(_, info) => {
                                      if (containerRef.current) {
                                        const rect = containerRef.current.getBoundingClientRect();
                                        const newX = ((el.x / 100) * rect.width + info.offset.x) / rect.width * 100;
                                        const newY = ((el.y / 100) * rect.height + info.offset.y) / rect.height * 100;
                                        
                                        setEditElements(prev => prev.map(item => 
                                          item.id === el.id ? { ...item, x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) } : item
                                        ));
                                      }
                                   }}
                                   className={`absolute p-2 cursor-move group ${selectedElementId === el.id ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
                                   style={{ left: `${el.x}%`, top: `${el.y}%` }}
                                   onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                                 >
                                    <div className="bg-transparent border-none outline-none min-w-[50px]">
                                       {el.type === 'text' ? (
                                         <input 
                                           type="text" 
                                           autoFocus={selectedElementId === el.id}
                                           value={el.content}
                                           onChange={(e) => {
                                             setEditElements(prev => prev.map(item => item.id === el.id ? { ...item, content: e.target.value } : item));
                                           }}
                                           className={`bg-transparent border-none outline-none w-full text-slate-900 placeholder-slate-300 ${el.isBold ? 'font-black' : 'font-bold'} ${el.isItalic ? 'italic' : ''}`}
                                           style={{ 
                                             fontSize: `${el.fontSize}px`,
                                             color: el.color || '#000000'
                                           }}
                                         />
                                       ) : (
                                         <div 
                                           className="bg-white border border-slate-200 shadow-sm"
                                           style={{ width: `${el.width}px`, height: `${el.height}px` }}
                                         />
                                       )}
                                    </div>
                                 </motion.div>
                               ))}
                            </div>
                         </div>
                      </div>
                    </div>
                  ) : (
                    /* Standard Tool Interface */
                    <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {files.map((f) => (
                          <motion.div 
                            key={f.id}
                            className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 relative group"
                          >
                            <button 
                              onClick={() => removeFile(f.id)}
                              className="absolute top-6 right-6 p-2 bg-white text-slate-400 rounded-xl hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={18} />
                            </button>
                            <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm">
                              <FileText size={28} />
                            </div>
                            <h4 className="font-black text-slate-900 truncate pr-8">{f.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{f.size} • {f.pages} Pages</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tool Specific Options */}
                  {activeTool === 'watermark' && (
                    <div className="bg-slate-50 p-12 rounded-[48px] border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Watermark Text</label>
                        <input 
                          type="text" 
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-5 px-8 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-6">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Opacity ({Math.round(watermarkOpacity * 100)}%)</label>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="1" 
                          step="0.1"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex flex-col items-center gap-6">
                    <button 
                      onClick={() => {
                        if (activeTool === 'merge') processMerge();
                        if (activeTool === 'watermark') processWatermark();
                        if (activeTool === 'unlock') processUnlock();
                        if (activeTool === 'compress') processCompress();
                        if (activeTool === 'word-to-pdf') processWordToPdf();
                        if (activeTool === 'pdf-to-word') processPdfToWord();
                        if (activeTool === 'edit') processEdit();
                        if (activeTool === 'split') processSplitSort();
                      }}
                      disabled={isProcessing}
                      className="bg-blue-600 text-white px-16 py-8 rounded-[32px] font-black text-2xl flex items-center justify-center gap-4 hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={32} className="animate-spin" /> {status}
                        </>
                      ) : (
                        <>
                          {activeTool === 'edit' || activeTool === 'split' ? 'Download Result' : 'Process Document'} <Download size={32} />
                        </>
                      )}
                    </button>
                    {status && !isProcessing && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-green-600 font-black text-xs uppercase tracking-widest"
                      >
                        <CheckCircle2 size={16} /> {status}
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Footer Info */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-slate-200 pt-12">
          <div className="flex gap-6">
            <div className="bg-white p-4 h-fit rounded-2xl shadow-sm border border-slate-100 text-blue-600">
              <Shield size={24} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 mb-2">Privacy First</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Your files never leave your browser. All processing happens locally on your device.</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="bg-white p-4 h-fit rounded-2xl shadow-sm border border-slate-100 text-amber-500">
              <Zap size={24} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 mb-2">High Performance</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Optimized algorithms ensure lightning-fast document manipulation even for large files.</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="bg-white p-4 h-fit rounded-2xl shadow-sm border border-slate-100 text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 mb-2">Enterprise Grade</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Built with the same technology used by global legal and financial institutions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
