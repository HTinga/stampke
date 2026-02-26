import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Upload, Plus, Send, ShieldCheck, Clock, CheckCircle2, 
  Trash2, PenTool, Calendar, Type, History, X, Save, Zap, 
  Eraser, MousePointer2, Loader2, Stamp, Image as ImageIcon, 
  ChevronRight, UserPlus, GripHorizontal, Maximize2, FileCode,
  FileDown, Share2, Mail, Edit3, Check
} from 'lucide-react';
import { Envelope, SignField, FieldType, BulkDocument, StampConfig } from '../types';
import SVGPreview from './SVGPreview';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';

// @ts-ignore
if (typeof window !== 'undefined' && 'pdfjsLib' in window) {
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
} else {
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

// @ts-ignore
const loadMammoth = () => import('https://esm.sh/mammoth@1.6.0');

interface DigitalSignCenterProps {
  stampConfig: StampConfig;
  onOpenStudio?: (fieldId?: string) => void;
  pendingStampFieldId?: string | null;
  onClearPendingField?: () => void;
  isActive?: boolean;
}

const SIGNATURE_FONTS = [
  { name: 'Classic', family: "'Crimson Pro', serif" },
  { name: 'Artistic', family: "'Dancing Script', cursive" },
  { name: 'Modern', family: "'Great Vibes', cursive" },
  { name: 'Formal', family: "'Alex Brush', cursive" }
];

const SignaturePad: React.FC<{ 
  onSave: (url: string) => void, 
  onCancel: () => void,
  title?: string
}> = ({ onSave, onCancel, title = "Sign Document" }) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[1].family);

  useEffect(() => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = '#000080';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
    }
  }, [activeTab]);

  const getPointerPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const pos = getPointerPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const pos = getPointerPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const handleApply = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) onSave(canvas.toDataURL('image/png'));
    } else if (activeTab === 'type') {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `60px ${selectedFont}`;
        ctx.fillStyle = '#000080';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
        onSave(canvas.toDataURL('image/png'));
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => onSave(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-slate-100 max-w-xl w-full animate-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{title}</h4>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={24} /></button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
        {['draw', 'type', 'upload'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] overflow-hidden mb-10 h-72 flex items-center justify-center relative shadow-inner">
        {activeTab === 'draw' && (
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            onMouseDown={startDrawing}
            onMouseUp={() => setIsDrawing(false)}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={() => setIsDrawing(false)}
            onTouchMove={draw}
            className="w-full h-full cursor-crosshair bg-white touch-none"
          />
        )}
        {activeTab === 'type' && (
          <div className="w-full p-10 text-center space-y-8">
            <input
              type="text"
              placeholder="Your Name Here"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className="w-full bg-transparent border-b-2 border-slate-200 py-6 px-4 text-center text-4xl outline-none focus:border-blue-500 transition-colors"
              style={{ fontFamily: selectedFont }}
            />
            <div className="flex flex-wrap justify-center gap-2">
              {SIGNATURE_FONTS.map((font) => (
                <button
                  key={font.family}
                  onClick={() => setSelectedFont(font.family)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                    selectedFont === font.family ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-400'
                  }`}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'upload' && (
          <div className="text-center p-10">
            <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="bg-blue-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
              <Upload size={32} />
            </div>
            <p className="text-slate-900 font-black text-lg">Upload Transparent PNG</p>
            <p className="text-slate-400 text-xs mt-2 uppercase font-bold tracking-widest">Recommended for best quality</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => {
            if (activeTab === 'draw') {
              const canvas = canvasRef.current;
              const ctx = canvas?.getContext('2d');
              if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
              setTypedName('');
            }
          }}
          className="bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-slate-200"
        >
          <Eraser size={20} /> Reset
        </button>
        <button
          onClick={handleApply}
          className="bg-blue-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-blue-700 shadow-2xl shadow-blue-100"
        >
          <Save size={20} /> Apply
        </button>
      </div>
    </div>
  );
};

export default function DigitalSignCenter({ stampConfig, onOpenStudio, pendingStampFieldId, onClearPendingField, isActive }: DigitalSignCenterProps) {
  const [view, setView] = useState<'landing' | 'dashboard' | 'create' | 'signer-view'>('landing');
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [activeEnvelope, setActiveEnvelope] = useState<Envelope | null>(null);
  const [showSignPad, setShowSignPad] = useState<{ fieldId?: string, isDesignerPlacement?: boolean, type?: FieldType } | null>(null);
  const [capturedValue, setCapturedValue] = useState<string | null>(null);
  const [isAuthDockOpen, setIsAuthDockOpen] = useState(true);
  const [wordHtml, setWordHtml] = useState<string | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [showToast, setShowToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const pdfDataCache = useRef<Record<string, Uint8Array>>({});
  const [localStampConfig, setLocalStampConfig] = useState<StampConfig>(stampConfig);
  const [isEditingStamp, setIsEditingStamp] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);

  // Sync local config with prop when it changes (e.g. from Studio)
  useEffect(() => {
    setLocalStampConfig(stampConfig);
    
    // If we have a pending field and we just returned from Studio, apply it
    if (isActive && pendingStampFieldId && onClearPendingField) {
      const applyPendingStamp = async () => {
        // Wait a bit for the SVG to render
        setTimeout(async () => {
          const pngData = await captureStampAsPng();
          if (pngData) {
            handleSignatureCaptured(pngData, pendingStampFieldId);
            onClearPendingField();
            setShowToast({ message: 'Professional Seal Applied Successfully', type: 'success' });
          }
        }, 500);
      };
      applyPendingStamp();
    }
  }, [stampConfig, pendingStampFieldId, isActive]);

  const captureStampAsPng = async (): Promise<string | null> => {
    const svg = document.querySelector('#stamp-preview-container svg');
    if (!svg) return null;

    return new Promise((resolve) => {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Set dimensions to ensure high quality
      canvas.width = 800;
      canvas.height = 800;

      img.onload = () => {
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Use white background for the stamp if needed, but usually transparent is better for PDFs
          // However, some PDF viewers handle transparency poorly. Let's keep it transparent for now.
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    });
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const downloadDocument = async (envelope: Envelope) => {
    setIsLoadingDoc(true);
    setProcessingStatus('Finalizing Authenticated Protocol...');
    try {
      const doc = envelope.documents[0];
      if (!doc) {
        throw new Error("No document found in protocol");
      }

      let sourceBytes: ArrayBuffer | Uint8Array;
      
      // Try cache first
      if (pdfDataCache.current[doc.id]) {
        sourceBytes = pdfDataCache.current[doc.id];
      } else if (doc.previewUrl) {
        const response = await fetch(doc.previewUrl);
        if (!response.ok) throw new Error("Failed to fetch original document");
        sourceBytes = await response.arrayBuffer();
      } else {
        throw new Error("Document source not found");
      }

      const existingPdfBytes = sourceBytes instanceof Uint8Array 
        ? sourceBytes.slice() 
        : new Uint8Array(sourceBytes).slice();
      
      const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      
      // Create a new PDF forced to A4 size
      const newPdfDoc = await PDFDocument.create();
      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;

      for (let i = 0; i < pages.length; i++) {
        const [embeddedPage] = await newPdfDoc.embedPdf(pdfDoc, [i]);
        const newPage = newPdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        
        // Calculate scaling to fit A4
        const scale = Math.min(A4_WIDTH / embeddedPage.width, A4_HEIGHT / embeddedPage.height);
        const xOffset = (A4_WIDTH - embeddedPage.width * scale) / 2;
        const yOffset = (A4_HEIGHT - embeddedPage.height * scale) / 2;
        
        newPage.drawPage(embeddedPage, {
          x: xOffset,
          y: yOffset,
          width: embeddedPage.width * scale,
          height: embeddedPage.height * scale,
        });

        // Draw fields for this page
        for (const field of envelope.fields) {
          if (!field.isCompleted || !field.value || field.page !== i + 1) continue;
          
          // Field coordinates are relative to the original page size
          // We need to map them to the scaled page on A4
          const fieldX = xOffset + (field.x / 100) * (embeddedPage.width * scale);
          const fieldY = yOffset + (1 - field.y / 100) * (embeddedPage.height * scale);

          if (field.type === 'signature' || field.type === 'stamp') {
            try {
              let imageBytes: ArrayBuffer;
              if (field.value.startsWith('data:')) {
                const base64Data = field.value.split(',')[1];
                const binaryString = window.atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let j = 0; j < binaryString.length; j++) {
                  bytes[j] = binaryString.charCodeAt(j);
                }
                imageBytes = bytes.buffer;
              } else {
                const imgRes = await fetch(field.value);
                imageBytes = await imgRes.arrayBuffer();
              }

              let image;
              if (field.value.includes('image/png') || field.value.startsWith('data:image/png')) {
                image = await newPdfDoc.embedPng(imageBytes);
              } else {
                image = await newPdfDoc.embedJpg(imageBytes);
              }
              
              const targetWidth = field.width ? (field.width / 100) * (embeddedPage.width * scale) : (field.type === 'signature' ? 100 : 120);
              const targetHeight = field.height ? (field.height / 100) * (embeddedPage.height * scale) : (image.height * targetWidth) / image.width;
              
              newPage.drawImage(image, {
                x: fieldX - targetWidth / 2,
                y: fieldY - targetHeight / 2,
                width: targetWidth,
                height: targetHeight,
              });
            } catch (imgErr) {
              console.error("Image embedding failed for field:", field.id, imgErr);
            }
          } else {
            newPage.drawText(field.value, {
              x: fieldX - 30,
              y: fieldY - 5,
              size: 12,
              color: rgb(0, 0, 0),
            });
          }
        }
      }

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${envelope.title}_Signed.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowToast({ message: 'Document downloaded successfully', type: 'success' });
    } catch (err) {
      console.error("Download failed:", err);
      setShowToast({ message: `Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'info' });
    } finally {
      setIsLoadingDoc(false);
      setProcessingStatus('');
    }
  };

  const shareDocument = (envelope: Envelope) => {
    const mockLink = `https://firm.ke/verify/${envelope.id}`;
    navigator.clipboard.writeText(mockLink);
    setShowToast({ message: 'Verification link copied to clipboard', type: 'success' });
  };

  const sendDocument = (envelope: Envelope) => {
    setShowToast({ message: `Protocol dispatched to ${envelope.signers.length} recipients`, type: 'success' });
  };

  const [newEnv, setNewEnv] = useState<Partial<Envelope>>({
    title: '',
    signers: [{ id: 's-1', name: 'Me (Self)', email: 'user@firm.ke', role: 'signer', order: 1, status: 'pending' }],
    documents: [],
    fields: []
  });
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedSignerId, setSelectedSignerId] = useState<string>('s-1');
  const [draggedFieldType, setDraggedFieldType] = useState<FieldType | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isMoving, setIsMoving] = useState<string | null>(null);

  const convertDocToPdf = async (file: File) => {
    setIsLoadingDoc(true);
    setProcessingStatus('Initializing Protocol Conversion...');
    try {
      let pdfData: Uint8Array;

      if (file.type.includes('word') || file.name.endsWith('.docx')) {
        setProcessingStatus('Parsing Word Structure...');
        const mammothModule: any = await loadMammoth();
        const mammoth = mammothModule.default || mammothModule;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        setWordHtml(html);

        // Create a hidden container to render HTML for PDF conversion
        setProcessingStatus('Generating High-Resolution PDF...');
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '800px';
        container.style.padding = '40px';
        container.style.background = 'white';
        container.style.fontFamily = 'serif';
        container.innerHTML = html;
        document.body.appendChild(container);

        const canvas = await html2canvas(container, { scale: 2 });
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdfData = new Uint8Array(pdf.output('arraybuffer'));
        document.body.removeChild(container);
      } else if (file.type.includes('image')) {
        setProcessingStatus('Wrapping Image in PDF Container...');
        const pdf = new jsPDF();
        const imgData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = imgData;
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (img.height * pdfWidth) / img.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdfData = new Uint8Array(pdf.output('arraybuffer'));
      } else {
        pdfData = new Uint8Array(await file.arrayBuffer());
      }

      // Now render pages to images for tagging
      setProcessingStatus('Rendering Document Pages...');
      // Use a slice to prevent detachment of the original buffer if pdfjs transfers it to a worker
      const loadingTask = pdfjsLib.getDocument({ data: pdfData.slice() });
      const pdf = await loadingTask.promise;
      const pagePreviews: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setProcessingStatus(`Rendering Page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          pagePreviews.push(canvas.toDataURL('image/jpeg', 0.8));
        }
      }

      return {
        url: URL.createObjectURL(new Blob([pdfData], { type: 'application/pdf' })),
        previews: pagePreviews,
        pages: pdf.numPages,
        pdfData: pdfData
      };
    } catch (err) {
      console.error("Conversion failed:", err);
      return null;
    } finally {
      setIsLoadingDoc(false);
      setProcessingStatus('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []) as File[];
    if (uploaded.length === 0) return;

    const file = uploaded[0];
    const result = await convertDocToPdf(file);
    if (!result) return;

    const docId = Math.random().toString(36).substr(2, 9);
    if (result.pdfData) {
      pdfDataCache.current[docId] = result.pdfData;
    }

    const docs: BulkDocument[] = [{
      id: docId,
      name: file.name,
      pages: result.pages,
      type: 'application/pdf',
      size: file.size,
      previewUrl: result.url,
      pagePreviews: result.previews
    }];

    setNewEnv(prev => ({ 
      ...prev, 
      title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      documents: docs 
    }));

    setView('create');
    setCurrentStep(2);
  };

  const handlePointerDown = (e: React.PointerEvent, fieldId: string) => {
    e.stopPropagation();
    setIsMoving(fieldId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isMoving) {
      const fieldElement = document.getElementById(isMoving);
      if (!fieldElement) return;
      const pageElement = fieldElement.closest('.pdf-page-container');
      if (!pageElement) return;

      const rect = pageElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const constrainedX = Math.max(0, Math.min(100, x));
      const constrainedY = Math.max(0, Math.min(100, y));

      setNewEnv(prev => ({
        ...prev,
        fields: prev.fields?.map(f => f.id === isMoving ? { ...f, x: constrainedX, y: constrainedY } : f)
      }));
    } else if (isResizing) {
      const fieldElement = document.getElementById(isResizing);
      if (!fieldElement) return;
      const pageElement = fieldElement.closest('.pdf-page-container');
      if (!pageElement) return;
      const field = newEnv.fields?.find(f => f.id === isResizing);
      if (!field) return;

      const rect = pageElement.getBoundingClientRect();
      const currentX = ((e.clientX - rect.left) / rect.width) * 100;
      const currentY = ((e.clientY - rect.top) / rect.height) * 100;

      const newWidth = Math.max(5, (currentX - field.x) * 2);
      const newHeight = Math.max(5, (currentY - field.y) * 2);

      setNewEnv(prev => ({
        ...prev,
        fields: prev.fields?.map(f => f.id === isResizing ? { ...f, width: newWidth, height: newHeight } : f)
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsMoving(null);
    setIsResizing(null);
  };

  const handlePageClick = (e: React.MouseEvent, pageNum: number) => {
    if (!draggedFieldType) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const fieldId = `f-${Math.random().toString(36).substr(2, 5)}`;
    const newField: SignField = {
      id: fieldId,
      type: draggedFieldType,
      x,
      y,
      width: draggedFieldType === 'stamp' ? 15 : 10,
      height: draggedFieldType === 'stamp' ? 10 : 5,
      page: pageNum,
      signerId: selectedSignerId,
      value: capturedValue || undefined,
      isCompleted: !!capturedValue
    };
    
    setNewEnv(prev => ({ ...prev, fields: [...(prev.fields || []), newField] }));
    
    if (!capturedValue && (draggedFieldType === 'date' || draggedFieldType === 'text') && selectedSignerId === 's-1') {
      if (draggedFieldType === 'date') {
        const dateStr = new Date().toLocaleDateString();
        setNewEnv(prev => ({
          ...prev,
          fields: prev.fields?.map(f => f.id === fieldId ? { ...f, value: dateStr, isCompleted: true } : f)
        }));
      }
    }
    
    setDraggedFieldType(null);
    setCapturedValue(null);
  };

  const handleSend = () => {
    const envelope: Envelope = {
      ...newEnv as Envelope,
      id: `env-${Date.now()}`,
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditLog: [{ 
        id: 'a-1', 
        timestamp: new Date().toISOString(), 
        action: 'Protocol Dispatched', 
        user: 'System Admin', 
        ip: '197.248.33.102', 
        details: `Ready for ${newEnv.signers?.length} signers` 
      }]
    };
    setEnvelopes([envelope, ...envelopes]);
    setView('dashboard');
    setCurrentStep(1);
  };

  const handleSignatureCaptured = (url: string, specificFieldId?: string) => {
    const targetFieldId = specificFieldId || showSignPad?.fieldId;

    if (showSignPad?.isDesignerPlacement || specificFieldId) {
      if (targetFieldId) {
        // Legacy path for existing fields
        setNewEnv(prev => ({
          ...prev,
          fields: prev.fields?.map(f => f.id === targetFieldId ? { ...f, value: url, isCompleted: true } : f)
        }));
      } else {
        // New immediate capture path
        setCapturedValue(url);
        setDraggedFieldType(showSignPad?.type || 'signature');
      }
    } else if (activeEnvelope) {
      // Signer view mode
      const updatedFields = activeEnvelope.fields.map(f => f.id === targetFieldId ? { ...f, isCompleted: true, value: url } : f);
      const updatedEnvelope = { 
        ...activeEnvelope, 
        fields: updatedFields,
        updatedAt: new Date().toISOString()
      };
      setActiveEnvelope(updatedEnvelope);
      setEnvelopes(envelopes.map(e => e.id === activeEnvelope.id ? updatedEnvelope : e));
    }
    setShowSignPad(null);
  };

  const renderLanding = () => (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 py-12">
      <div className="max-w-4xl mx-auto text-center space-y-12 px-4">
        <div className="space-y-6">
          <h2 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-tight">Seal. Sign. <span className="text-blue-600">Succeed.</span></h2>
          <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">The enterprise gateway for Kenyan legal and corporate document authentication.</p>
        </div>

        <div className="bg-white p-1 rounded-[64px] shadow-2xl shadow-blue-100 group relative border border-slate-100">
          <div className="bg-slate-50 border-4 border-dashed border-white rounded-[62px] p-16 md:p-32 text-center cursor-pointer transition-all hover:bg-white">
            <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <div className="bg-blue-600 text-white w-24 h-24 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-200 group-hover:scale-110 transition-transform">
              <Upload size={48} />
            </div>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Start Authentication</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Drop PDF, Word or Image to begin</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreateStep2 = () => {
    const activeDoc = newEnv.documents?.[0];

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-700 fixed inset-0 z-[100] bg-slate-900 flex flex-col overflow-hidden">
         {/* Top Header Bar */}
         <div className="bg-white border-b border-slate-200 px-6 md:px-12 py-4 flex items-center justify-between z-[110]">
            <div className="flex items-center gap-4">
               <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl flex-shrink-0"><FileText size={20} /></div>
               <div className="min-w-0">
                  <h3 className="text-xl font-black text-slate-900 truncate leading-none">{newEnv.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                     Preparation Mode • Assigning Tags
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Signer:</span>
                  <select 
                    value={selectedSignerId} 
                    onChange={e => setSelectedSignerId(e.target.value)}
                    className="bg-transparent text-xs font-black text-slate-900 outline-none min-w-[120px]"
                  >
                    {newEnv.signers?.map(s => (
                      <option key={s.id} value={s.id}>{s.name || s.email}</option>
                    ))}
                  </select>
               </div>
               <button onClick={() => setView('landing')} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={28} /></button>
            </div>
         </div>

         {/* Main Workspace */}
         <div className="flex-1 flex overflow-hidden relative">
            {/* Preparation Tool Dock - Vertical Left */}
            <div className="w-24 md:w-32 bg-white border-r border-slate-200 flex flex-col items-center py-10 z-[120] shadow-2xl shrink-0">
               <div className="flex flex-col items-center gap-10 w-full overflow-y-auto custom-scrollbar px-2">
                  {[
                    { type: 'signature', label: 'Sign', icon: <PenTool size={24}/>, color: 'text-blue-600' },
                    { type: 'stamp', label: 'Stamp', icon: <Stamp size={24}/>, color: 'text-orange-600' },
                    { type: 'date', label: 'Date', icon: <Calendar size={24}/>, color: 'text-green-600' },
                    { type: 'text', label: 'Text', icon: <Type size={24}/>, color: 'text-purple-600' }
                  ].map(tag => (
                    <div 
                      key={tag.type}
                      onClick={() => {
                        if ((tag.type === 'signature' || tag.type === 'stamp') && selectedSignerId === 's-1') {
                          setShowSignPad({ isDesignerPlacement: true, type: tag.type as FieldType });
                        } else {
                          setDraggedFieldType(tag.type as FieldType);
                        }
                      }}
                      className={`flex flex-col items-center gap-2 cursor-pointer transition-all w-full ${draggedFieldType === tag.type ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                    >
                       <div className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-center ${draggedFieldType === tag.type ? 'border-blue-600 bg-white ring-8 ring-blue-50 shadow-inner' : 'bg-slate-50 border-transparent shadow-sm'} ${tag.color}`}>
                          {tag.icon}
                       </div>
                       <span className="font-black text-[9px] uppercase tracking-widest text-slate-500 text-center">{tag.label}</span>
                    </div>
                  ))}

                  <div className="w-12 h-px bg-slate-100 my-4"></div>

                  <button 
                    disabled={newEnv.fields?.length === 0}
                    onClick={() => setCurrentStep(3)} 
                    className="bg-slate-900 text-white p-5 rounded-3xl font-black text-xs hover:bg-blue-600 transition-all shadow-xl disabled:opacity-20 flex flex-col items-center gap-2 active:scale-95 mt-auto"
                  >
                    <ChevronRight size={24} />
                    <span>DONE</span>
                  </button>
               </div>
            </div>

            {/* Document Canvas - Maximized Focus */}
            <div className="flex-1 bg-slate-800 relative overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col items-center py-12 md:py-24 px-6 scroll-smooth gap-12">
               {isLoadingDoc && (
                 <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xl">
                   <div className="relative">
                     <Loader2 size={80} className="text-blue-500 animate-spin mb-8" />
                     <div className="absolute inset-0 flex items-center justify-center">
                       <FileCode size={32} className="text-blue-200 animate-pulse" />
                     </div>
                   </div>
                   <p className="text-white font-black uppercase tracking-[0.3em] text-xl mb-2">Universal Protocol Processing</p>
                   <p className="text-blue-400 font-bold uppercase tracking-widest text-xs animate-pulse">{processingStatus}</p>
                 </div>
               )}
               
               {activeDoc?.pagePreviews?.map((preview, idx) => (
                 <div 
                   key={idx}
                   onClick={(e) => handlePageClick(e, idx + 1)}
                   onPointerMove={handlePointerMove}
                   className="pdf-page-container w-full max-w-5xl bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative aspect-[1/1.41] shrink-0 cursor-crosshair overflow-visible border border-white/5"
                 >
                    {/* High-Resolution Document Rendering */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden bg-white">
                       <img src={preview} className="w-full h-full object-contain" alt={`Page ${idx + 1}`} />
                    </div>

                    {/* Interaction Tag Layer */}
                    <div className="absolute inset-0 z-10 w-full h-full bg-transparent">
                       {newEnv.fields?.filter(f => f.page === idx + 1).map(field => {
                         const signer = newEnv.signers?.find(s => s.id === field.signerId);
                         return (
                           <div 
                             key={field.id}
                             id={field.id}
                             onPointerDown={(e) => {
                               e.stopPropagation();
                               setIsMoving(field.id);
                             }}
                             onPointerUp={handlePointerUp}
                             className={`absolute -translate-x-1/2 -translate-y-1/2 p-3 rounded-2xl flex flex-col items-center justify-center group cursor-move transition-transform active:scale-110 ${
                               field.isCompleted 
                                 ? 'border-none shadow-none' 
                                 : `border-2 border-dashed shadow-2xl ${field.signerId === selectedSignerId ? 'border-blue-500' : 'border-slate-300 opacity-50'}`
                             }`}
                             style={{ 
                               left: `${field.x}%`, 
                               top: `${field.y}%`, 
                               width: field.width ? `${field.width}%` : 'auto',
                               height: field.height ? `${field.height}%` : 'auto',
                               pointerEvents: 'auto', 
                               minWidth: '120px', 
                               touchAction: 'none' 
                             }}
                           >
                             {field.isCompleted ? (
                               <div className="flex flex-col items-center gap-1 w-full h-full justify-center">
                                  {field.type === 'signature' ? (
                                    <img src={field.value} className="max-w-full max-h-full object-contain mix-blend-multiply" alt="Sig" />
                                  ) : field.type === 'stamp' ? (
                                    <div className="w-full h-full flex items-center justify-center mix-blend-multiply">
                                      <div className="scale-[0.5] origin-center"><SVGPreview config={localStampConfig} /></div>
                                    </div>
                                  ) : (
                                    <span className="font-bold text-blue-800 text-sm">{field.value}</span>
                                  )}
                               </div>
                             ) : (
                               <>
                                 <div className={`p-2 rounded-xl mb-1.5 ${field.signerId === selectedSignerId ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                                   {field.type === 'signature' && <PenTool size={18} />}
                                   {field.type === 'stamp' && <Stamp size={18} />}
                                   {field.type === 'date' && <Calendar size={18} />}
                                   {field.type === 'text' && <Type size={18} />}
                                 </div>
                                 <div className="text-center">
                                   <span className={`text-[11px] font-black uppercase tracking-tight truncate block ${field.signerId === selectedSignerId ? 'text-blue-800' : 'text-slate-600'}`}>{signer?.name || 'Signer'}</span>
                                   <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest text-slate-500">{field.type} Area</span>
                                 </div>
                               </>
                             )}
                             
                             {!field.isCompleted && (
                               <div 
                                 onPointerDown={(e) => {
                                   e.stopPropagation();
                                   setIsResizing(field.id);
                                   (e.target as HTMLElement).setPointerCapture(e.pointerId);
                                 }}
                                 className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize bg-blue-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                               >
                                 <Maximize2 size={10} />
                               </div>
                             )}
                             
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setNewEnv(prev => ({ ...prev, fields: prev.fields?.filter(f => f.id !== field.id) }));
                               }}
                               className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                               <X size={12} />
                             </button>
                           </div>
                         );
                       })}
                    </div>
                 </div>
               ))}
               
               {draggedFieldType && (
                 <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[130] flex items-center gap-3 text-blue-600 animate-pulse bg-white/90 backdrop-blur-md px-8 py-4 rounded-full border border-blue-100 shadow-2xl">
                   <MousePointer2 size={20} />
                   <p className="text-sm font-black uppercase tracking-widest">Click on document to place {draggedFieldType}</p>
                   <button onClick={() => setDraggedFieldType(null)} className="ml-4 p-2 hover:bg-slate-100 rounded-full transition-all"><X size={18}/></button>
                 </div>
               )}

               {newEnv.fields && newEnv.fields.length > 0 && (
                 <div className="fixed bottom-10 right-10 z-[130] flex flex-col gap-4 animate-in slide-in-from-right-10 duration-500">
                    <button 
                      onClick={() => downloadDocument(newEnv as Envelope)}
                      className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all group relative"
                    >
                      <FileDown size={28} />
                      <span className="absolute right-20 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Download Signed PDF</span>
                    </button>
                    <button 
                      onClick={() => shareDocument(newEnv as Envelope)}
                      className="w-16 h-16 bg-white text-slate-600 rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-50 hover:scale-110 transition-all group relative border border-slate-100"
                    >
                      <Share2 size={28} />
                      <span className="absolute right-20 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Copy Share Link</span>
                    </button>
                    <button 
                      onClick={() => setCurrentStep(1)}
                      className="w-16 h-16 bg-white text-slate-600 rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-50 hover:scale-110 transition-all group relative border border-slate-100"
                    >
                      <Edit3 size={28} />
                      <span className="absolute right-20 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Edit Recipients</span>
                    </button>
                 </div>
               )}
            </div>
         </div>

         {/* Immediate Prompting Pad */}
         {showSignPad && (
           <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-6">
              {(showSignPad.type === 'stamp' || (showSignPad.fieldId && newEnv.fields?.find(f => f.id === showSignPad.fieldId)?.type === 'stamp')) ? (
                 <div className="bg-white p-12 rounded-[64px] shadow-2xl max-w-5xl w-full animate-in zoom-in overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                      {/* Left Side: Preview */}
                      <div className="bg-slate-50 p-12 rounded-[48px] border border-slate-100 flex items-center justify-center shadow-inner min-h-[400px]" id="stamp-preview-container">
                         <div className="scale-[1.5] origin-center">
                           <SVGPreview config={localStampConfig} />
                         </div>
                      </div>

                      {/* Right Side: Controls */}
                      <div className="flex flex-col justify-center space-y-8">
                        <div>
                          <h4 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4">Apply Seal</h4>
                          <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">Professional Authentication Protocol</p>
                        </div>

                        {isEditingStamp ? (
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Primary Text</label>
                              <input 
                                type="text" 
                                value={localStampConfig.primaryText} 
                                onChange={e => setLocalStampConfig(prev => ({ ...prev, primaryText: e.target.value }))}
                                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Center Text</label>
                              <input 
                                type="text" 
                                value={localStampConfig.centerText} 
                                onChange={e => setLocalStampConfig(prev => ({ ...prev, centerText: e.target.value }))}
                                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                              />
                            </div>
                            <button 
                              onClick={() => setIsEditingStamp(false)}
                              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-600 transition-all"
                            >
                              Done Customizing
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            <button 
                              onClick={async () => {
                                const pngData = await captureStampAsPng();
                                if (pngData) {
                                  handleSignatureCaptured(pngData);
                                }
                              }} 
                              className="w-full py-6 rounded-3xl font-black text-white bg-blue-600 shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-lg"
                            >
                              <Check size={24} /> Use This Seal
                            </button>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => onOpenStudio ? onOpenStudio(showSignPad?.fieldId) : setIsEditingStamp(true)}
                                className="py-5 rounded-3xl font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                              >
                                <Edit3 size={18} /> {onOpenStudio ? 'Open Studio' : 'Customize'}
                              </button>
                              <button 
                                onClick={() => setShowSignPad(null)}
                                className="py-5 rounded-3xl font-black text-slate-400 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                              >
                                <X size={18} /> Discard
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                 </div>
              ) : (
                <SignaturePad 
                  onCancel={() => setShowSignPad(null)}
                  onSave={handleSignatureCaptured}
                />
              )}
           </div>
         )}
      </div>
    );
  };

  const renderSignerView = () => {
    if (!activeEnvelope) return null;
    const allSigned = activeEnvelope.fields.every(f => f.isCompleted);
    const activeDoc = activeEnvelope.documents[0];

    return (
      <div className="animate-in fade-in duration-700 px-4 md:px-0 pb-24">
        <div className="flex items-center justify-between gap-6 mb-16">
           <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{activeEnvelope.title}</h2>
              <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-2 flex items-center gap-2">
                 <ShieldCheck size={16} className="text-green-500" />
                 Secure Authentication Protocol Enabled
              </p>
           </div>
           <button onClick={() => setView('dashboard')} className="p-4 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={28} /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
           <div className="lg:col-span-8 bg-slate-900 rounded-[64px] p-6 md:p-16 flex flex-col items-center gap-12 overflow-y-auto max-h-[80vh] md:max-h-[90vh] custom-scrollbar shadow-2xl">
              {activeDoc?.pagePreviews?.map((preview, idx) => (
                <div key={idx} className="w-full max-w-4xl bg-white aspect-[1/1.41] relative shadow-2xl overflow-hidden shrink-0">
                   <div className="absolute inset-0 w-full h-full bg-white">
                      <img src={preview} className="w-full h-full object-contain" alt={`Page ${idx + 1}`} />
                   </div>

                   <div className="absolute inset-0 z-10 w-full h-full bg-transparent">
                     {activeEnvelope.fields.filter(f => f.page === idx + 1).map(field => (
                       <div 
                         key={field.id}
                         onClick={() => !field.isCompleted && setShowSignPad({ fieldId: field.id })}
                         className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer flex flex-col items-center justify-center group ${
                           field.isCompleted ? '' : 'hover:scale-105'
                         }`}
                         style={{ left: `${field.x}%`, top: `${field.y}%`, minWidth: field.type === 'stamp' ? '200px' : '160px' }}
                       >
                         {field.isCompleted ? (
                           field.type === 'signature' ? (
                             <img src={field.value} className="max-h-24 mix-blend-multiply drop-shadow-sm" alt="Signature" />
                           ) : field.type === 'stamp' ? (
                             <div className="scale-[0.3] md:scale-[0.5] origin-center mix-blend-multiply"><SVGPreview config={stampConfig} /></div>
                           ) : (
                             <span className="font-bold text-slate-900 text-xl px-6 py-3">{field.value}</span>
                           )
                         ) : (
                           <div className="bg-blue-600/95 text-white px-8 py-6 rounded-[32px] border-2 border-white border-dashed shadow-2xl flex flex-col items-center gap-3 hover:bg-blue-700 transition-all animate-pulse">
                              <div className="bg-white/20 p-3 rounded-2xl"><PenTool size={24} /></div>
                              <span className="text-xs font-black uppercase tracking-widest text-white/90">Touch to {field.type}</span>
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                </div>
              ))}
           </div>

           <div className="lg:col-span-4 space-y-10">
              <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-xl space-y-10">
                 <div className="space-y-4 text-center">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion Ratio</h4>
                    <div className="w-full bg-slate-50 h-4 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                       <div className="bg-blue-600 h-full transition-all duration-1000 ease-out shadow-lg" style={{ width: `${(activeEnvelope.fields.filter(f => f.isCompleted).length / activeEnvelope.fields.length) * 100}%` }}></div>
                    </div>
                    <p className="text-sm font-black text-slate-900 tracking-tight">{activeEnvelope.fields.filter(f => f.isCompleted).length} of {activeEnvelope.fields.length} Tasks Finalized</p>
                 </div>
                 
                 <div className="pt-6 border-t border-slate-100 space-y-6">
                    {allSigned && (
                      <div className="grid grid-cols-3 gap-4">
                        <button 
                          onClick={() => downloadDocument(activeEnvelope)}
                          className="bg-blue-600 text-white py-5 rounded-3xl font-black text-[10px] flex flex-col items-center justify-center gap-2 hover:bg-blue-700 shadow-xl transition-all active:scale-95"
                        >
                          <FileDown size={16} /> Download
                        </button>
                        <button 
                          onClick={() => shareDocument(activeEnvelope)}
                          className="bg-slate-100 text-slate-600 py-5 rounded-3xl font-black text-[10px] flex flex-col items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95"
                        >
                          <Share2 size={16} /> Share
                        </button>
                        <button 
                          onClick={() => sendDocument(activeEnvelope)}
                          className="bg-slate-100 text-slate-600 py-5 rounded-3xl font-black text-[10px] flex flex-col items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95"
                        >
                          <Mail size={16} /> Send
                        </button>
                      </div>
                    )}
                    <button 
                      disabled={!allSigned}
                      onClick={() => {
                        const updated = envelopes.map(e => e.id === activeEnvelope.id ? { ...e, status: 'completed' } as Envelope : e);
                        setEnvelopes(updated);
                        setView('dashboard');
                      }}
                      className="w-full bg-slate-900 text-white py-7 rounded-[32px] font-black text-2xl hover:bg-blue-600 transition-all shadow-2xl active:scale-95 disabled:opacity-20 flex items-center justify-center gap-4"
                    >
                      Finish Document <CheckCircle2 size={32} />
                    </button>
                    {!allSigned && <p className="text-center text-[10px] text-slate-400 font-bold uppercase mt-6 tracking-widest leading-relaxed">Please address all assigned identifiers <br/> to archive the protocol.</p>}
                 </div>
              </div>

              <div className="bg-slate-50 p-12 rounded-[56px] border border-slate-100 hidden md:block shadow-inner">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 text-center">System Audit Log</h4>
                 <div className="space-y-10 relative">
                    <div className="absolute top-4 left-[25px] bottom-0 w-px bg-slate-200"></div>
                    {activeEnvelope.auditLog.map(log => (
                      <div key={log.id} className="flex gap-6 relative z-10">
                         <div className="bg-white p-3 h-fit rounded-2xl shadow-sm border border-slate-100"><History size={20} className="text-slate-400"/></div>
                         <div className="flex-1">
                            <p className="text-sm font-black text-slate-900 leading-none">{log.action}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{log.user} • {log.ip}</p>
                            <p className="text-[10px] text-slate-300 font-medium mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {showSignPad && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-3xl z-[200] flex items-center justify-center p-4">
            <SignaturePad 
              onCancel={() => setShowSignPad(null)}
              onSave={handleSignatureCaptured}
            />
          </div>
        )}

        {/* Floating Action Menu for Signer View */}
        <div className="fixed bottom-10 right-10 z-[130] flex flex-col gap-4 animate-in slide-in-from-right-10 duration-500">
           <button 
             onClick={() => downloadDocument(activeEnvelope)}
             className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all group relative"
           >
             <FileDown size={28} />
             <span className="absolute right-20 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Download Protocol</span>
           </button>
           <button 
             onClick={() => shareDocument(activeEnvelope)}
             className="w-16 h-16 bg-white text-slate-600 rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-50 hover:scale-110 transition-all group relative border border-slate-100"
           >
             <Share2 size={28} />
             <span className="absolute right-20 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Share Link</span>
           </button>
           <button 
             onClick={() => {
               setNewEnv(activeEnvelope);
               setCurrentStep(2);
               setView('create');
             }}
             className="w-16 h-16 bg-white text-slate-600 rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-50 hover:scale-110 transition-all group relative border border-slate-100"
           >
             <Edit3 size={28} />
             <span className="absolute right-20 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Edit Tags</span>
           </button>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="animate-in fade-in duration-500 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Protocol Hub</h2>
          <p className="text-slate-500 font-medium text-lg">Manage, track, and download your firm's authenticated records.</p>
        </div>
        <button onClick={() => setView('landing')} className="bg-blue-600 text-white px-10 py-5 rounded-[32px] font-black text-xl shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95">
          <Plus size={28} /> Create Workflow
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-[56px] overflow-hidden shadow-xl">
        {envelopes.length === 0 ? (
          <div className="p-32 text-center">
            <div className="bg-slate-50 w-24 h-24 rounded-[40px] flex items-center justify-center mx-auto mb-8">
               <FileText size={48} className="text-slate-200" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4">No active protocols</h3>
            <button onClick={() => setView('landing')} className="text-blue-600 font-black uppercase text-sm tracking-widest hover:underline decoration-2 underline-offset-8">Initialize First Signing Session</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Document Registry</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Signer Status</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {envelopes.map(env => (
                  <tr key={env.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5 cursor-pointer" onClick={() => { setActiveEnvelope(env); setView('signer-view'); }}>
                        <div className="bg-blue-50 text-blue-600 p-4 rounded-3xl flex-shrink-0"><FileText size={24} /></div>
                        <div className="min-w-0 flex-1 font-black text-slate-900 text-lg truncate">{env.title}</div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest ${
                        env.status === 'sent' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-green-50 text-green-600 border border-green-100'
                      }`}>
                        {env.status}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => { setActiveEnvelope(env); setView('create'); setCurrentStep(2); setNewEnv(env); }}
                          className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                          title="Edit Tags"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => downloadDocument(env)}
                          className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                          title="Download PDF"
                        >
                          <FileDown size={18} />
                        </button>
                        <button 
                          onClick={() => shareDocument(env)}
                          className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                          title="Share Link"
                        >
                          <Share2 size={18} />
                        </button>
                        <button 
                          onClick={() => sendDocument(env)}
                          className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                          title="Send Email"
                        >
                          <Mail size={18} />
                        </button>
                        <button onClick={() => { setActiveEnvelope(env); setView('signer-view'); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase hover:bg-blue-600 transition-all shadow-lg active:scale-95">View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateStep1 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700 max-w-4xl mx-auto py-16 px-4">
      <div className="bg-white p-14 rounded-[64px] border border-slate-100 shadow-2xl space-y-12">
        <div className="space-y-6">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <GripHorizontal size={14} /> Workflow Identifier
          </label>
          <input 
            type="text" 
            placeholder="e.g., Partnership Agreement - JijiTechy"
            value={newEnv.title}
            onChange={e => setNewEnv(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-7 px-10 outline-none focus:ring-8 focus:ring-blue-50 text-2xl font-black transition-all"
          />
        </div>

        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Recipient Configuration</label>
            <button 
              onClick={() => setNewEnv(prev => ({ ...prev, signers: [...(prev.signers || []), { id: `s-${Date.now()}`, name: '', email: '', role: 'signer', order: (prev.signers?.length || 0) + 1, status: 'pending' }] }))} 
              className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-3 bg-blue-50 px-6 py-4 rounded-[28px] hover:bg-blue-100 transition-all shadow-sm"
            >
              <UserPlus size={20} /> Add Recipient
            </button>
          </div>
          <div className="space-y-6">
            {newEnv.signers?.map((signer, i) => (
              <div key={signer.id} className="flex flex-col md:flex-row gap-6 p-10 bg-slate-50 rounded-[48px] items-center group border border-slate-100 transition-all hover:bg-white hover:shadow-2xl">
                <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center font-black text-slate-400 border border-slate-100 flex-shrink-0 shadow-lg">{i + 1}</div>
                <input 
                  type="text" placeholder="Full Name" value={signer.name}
                  onChange={e => {
                    const updated = [...(newEnv.signers || [])];
                    updated[i].name = e.target.value;
                    setNewEnv(prev => ({ ...prev, signers: updated }));
                  }}
                  className="w-full md:flex-1 bg-white border border-slate-200 rounded-3xl py-5 px-8 outline-none font-bold text-lg shadow-sm focus:ring-4 focus:ring-blue-50" 
                />
                <input 
                  type="email" placeholder="Email Address" value={signer.email}
                  onChange={e => {
                    const updated = [...(newEnv.signers || [])];
                    updated[i].email = e.target.value;
                    setNewEnv(prev => ({ ...prev, signers: updated }));
                  }}
                  className="w-full md:flex-1 bg-white border border-slate-200 rounded-3xl py-5 px-8 outline-none font-bold text-lg shadow-sm focus:ring-4 focus:ring-blue-50" 
                />
                <button 
                  onClick={() => setNewEnv(prev => ({ ...prev, signers: prev.signers?.filter(s => s.id !== signer.id) }))} 
                  className="text-slate-300 hover:text-red-500 transition-colors p-5 bg-white rounded-3xl shadow-sm border border-slate-100"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
         <button 
          onClick={() => setCurrentStep(2)}
          className="bg-slate-900 text-white px-16 py-8 rounded-[40px] font-black text-2xl hover:bg-blue-600 transition-all shadow-2xl active:scale-95 flex items-center gap-5"
        >
          Initialize Studio <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[80vh] flex flex-col">
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-10 duration-500">
          <div className={`px-8 py-4 rounded-[32px] shadow-2xl flex items-center gap-4 border ${
            showToast.type === 'success' ? 'bg-green-600 text-white border-green-500' : 'bg-blue-600 text-white border-blue-500'
          }`}>
            <CheckCircle2 size={24} />
            <span className="font-black uppercase tracking-widest text-xs">{showToast.message}</span>
          </div>
        </div>
      )}
      {view === 'landing' && renderLanding()}
      {view === 'dashboard' && renderDashboard()}
      {view === 'create' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentStep === 1 && renderCreateStep1()}
          {currentStep === 2 && renderCreateStep2()}
          {currentStep === 3 && (
            <div className="animate-in zoom-in-95 duration-1000 max-w-2xl mx-auto py-24 px-4">
               <div className="bg-white p-14 md:p-20 rounded-[72px] border border-slate-100 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.3)] space-y-16 text-center">
                  <div className="bg-green-50 text-green-600 w-28 h-28 rounded-[48px] flex items-center justify-center mx-auto shadow-2xl shadow-green-100 animate-bounce border border-green-100">
                     <ShieldCheck size={64} />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">Ready to Deploy</h3>
                    <p className="text-2xl text-slate-500 font-medium leading-relaxed">Secure authentication workflow finalized and ready for immediate registry.</p>
                  </div>
                  
                  <div className="bg-slate-50 p-12 rounded-[56px] text-left space-y-8 border border-slate-100 shadow-inner">
                     <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Protocol</span>
                        <span className="font-black text-slate-900 text-lg truncate max-w-[250px]">{newEnv.title}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Identifiers</span>
                        <div className="flex items-center gap-3 text-green-600">
                           <ShieldCheck size={20} /> <span className="text-xs font-black uppercase tracking-widest">Audit Active • {newEnv.fields?.length} Tags</span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button onClick={() => setCurrentStep(2)} className="bg-slate-100 text-slate-600 py-8 rounded-[36px] font-black text-xl hover:bg-slate-200 transition-all">Refine Tags</button>
                    <button 
                      onClick={handleSend}
                      className="bg-blue-600 text-white py-8 rounded-[36px] font-black text-2xl hover:bg-blue-700 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] flex items-center justify-center gap-5 transition-all active:scale-95"
                    >
                      <Send size={32} /> Dispatch All
                    </button>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}
      {view === 'signer-view' && renderSignerView()}
    </div>
  );
}
