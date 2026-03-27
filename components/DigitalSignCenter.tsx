import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Upload, Plus, Send, ShieldCheck, Clock, CheckCircle2, 
  Trash2, PenTool, Calendar, Type, History, X, Save, Zap, 
  Eraser, MousePointer2, Loader2, Stamp, Image as ImageIcon, 
  ChevronRight, UserPlus, GripHorizontal, Maximize2, FileCode,
  FileDown, Share2, Mail, Edit3, Check, Layers
} from 'lucide-react';
import { Envelope, SignField, FieldType, BulkDocument, StampConfig, SignerInfo } from '../types';
import SVGPreview from './SVGPreview';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.js?url';
import { PDFDocument, rgb } from 'pdf-lib';
import { loadPDFDocument } from '../src/utils/pdfUtils';
import mammoth from 'mammoth';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// @ts-ignore
const loadMammoth = async () => mammoth;

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

export const SignaturePad: React.FC<{ 
  onSave: (url: string) => void, 
  onCancel: () => void,
  title?: string
}> = ({ onSave, onCancel, title = "Sign Document" }) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[1].family);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isBold, setIsBold] = useState(false);

  useEffect(() => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = '#000080';
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [activeTab, strokeWidth]);

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
      canvas.width = 800;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `${isBold ? 'bold ' : ''}70px ${selectedFont}`;
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
    <div className="bg-[#161b22] p-6 md:p-10 rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-[#21262d] max-w-xl w-full animate-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <h4 className="text-3xl font-black text-white tracking-tighter">{title}</h4>
        <button onClick={onCancel} className="p-2 hover:bg-[#21262d] rounded-full transition-all text-[#8b949e]"><X size={24} /></button>
      </div>

      <div className="flex bg-[#21262d] p-1.5 rounded-2xl mb-8">
        {['draw', 'type', 'upload'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-[#161b22] shadow-md text-[#58a6ff]' : 'text-[#8b949e] hover:text-[#e6edf3]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-[#0d1117] border-2 border-dashed border-[#30363d] rounded-[32px] overflow-hidden mb-10 h-72 flex items-center justify-center relative shadow-inner">
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
            className="w-full h-full cursor-crosshair bg-[#161b22] touch-none"
          />
        )}
        {activeTab === 'type' && (
          <div className="w-full p-10 text-center space-y-8">
            <input
              type="text"
              placeholder="Your Name Here"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className={`w-full bg-transparent border-b-2 border-[#30363d] py-6 px-4 text-center text-4xl outline-none focus:border-[#1a5cad] transition-colors ${isBold ? 'font-bold' : ''}`}
              style={{ fontFamily: selectedFont }}
            />
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => setIsBold(!isBold)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all flex items-center gap-2 ${isBold ? 'border-[#58a6ff] bg-[#1f6feb] text-white' : 'border-[#30363d] text-[#8b949e]'}`}
              >
                {isBold ? <Check size={14} /> : null} Bold Text
              </button>
              <div className="h-8 w-px bg-[#30363d] mx-2"></div>
              {SIGNATURE_FONTS.map((font) => (
                <button
                  key={font.family}
                  onClick={() => setSelectedFont(font.family)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                    selectedFont === font.family ? 'border-[#58a6ff] bg-[#21262d] text-[#58a6ff]' : 'border-[#30363d] text-[#8b949e]'
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
            <div className="bg-[#1f6feb] text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black">
              <Upload size={32} />
            </div>
            <p className="text-white font-black text-lg">Upload Transparent PNG</p>
            <p className="text-[#8b949e] text-xs mt-2 uppercase font-bold tracking-widest">Recommended for best quality</p>
          </div>
        )}
      </div>

      {(activeTab === 'draw' || activeTab === 'type') && (
        <div className="mb-8 p-6 bg-[#0d1117] rounded-3xl border border-[#21262d]">
          <div className="flex justify-between items-center mb-4">
            <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Stroke Thickness</label>
            <span className="text-xs font-bold text-[#58a6ff]">{strokeWidth}px</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="12" 
            step="1" 
            value={strokeWidth} 
            onChange={e => setStrokeWidth(parseInt(e.target.value))}
            className="w-full h-1.5 bg-[#30363d] rounded-lg accent-[#1f6feb] cursor-pointer"
          />
        </div>
      )}

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
          className="bg-[#21262d] text-[#e6edf3] py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-[#30363d]"
        >
          <Eraser size={20} /> Reset
        </button>
        <button
          onClick={handleApply}
          className="bg-[#1f6feb] text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-[#30363d] shadow-2xl shadow-[#c5d8ef]"
        >
          <Save size={20} /> Apply
        </button>
      </div>
    </div>
  );
};

export default function DigitalSignCenter({ 
  stampConfig, 
  onOpenStudio, 
  pendingStampFieldId, 
  onClearPendingField, 
  isActive
}: DigitalSignCenterProps) {
  const [view, setView] = useState<'dashboard' | 'create' | 'signer-view'>('dashboard');
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [activeEnvelope, setActiveEnvelope] = useState<Envelope | null>(null);
  const [showSignPad, setShowSignPad] = useState<{ fieldId?: string, isDesignerPlacement?: boolean, type?: FieldType } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newSigner, setNewSigner] = useState({ name: '', email: '', role: 'signer' as const });
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
  const [draggedField, setDraggedField] = useState<FieldType | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

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

  const addSigner = () => {
    if (!activeEnvelope || !newSigner.name || !newSigner.email) return;
    
    const signer: SignerInfo = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSigner.name,
      email: newSigner.email,
      role: newSigner.role,
      order: activeEnvelope.signers.length + 1,
      status: 'pending'
    };

    setActiveEnvelope({
      ...activeEnvelope,
      signers: [...activeEnvelope.signers, signer]
    });
    setNewSigner({ name: '', email: '', role: 'signer' });
    setShowInviteModal(false);
    setShowToast({ message: `${signer.name} added to document`, type: 'success' });
  };

  const removeSigner = (id: string) => {
    if (!activeEnvelope) return;
    setActiveEnvelope({
      ...activeEnvelope,
      signers: activeEnvelope.signers.filter(s => s.id !== id),
      fields: activeEnvelope.fields.filter(f => f.signerId !== id)
    });
  };

  const handleSendEnvelope = () => {
    if (!activeEnvelope) return;
    setIsLoadingDoc(true);
    setProcessingStatus('Distributing Documents...');
    
    setTimeout(() => {
      setActiveEnvelope({ ...activeEnvelope, status: 'sent' });
      setEnvelopes(prev => prev.map(e => e.id === activeEnvelope.id ? { ...activeEnvelope, status: 'sent' } : e));
      setIsLoadingDoc(false);
      setShowToast({ message: 'Documents dispatched to all signers', type: 'success' });
      setView('dashboard');
    }, 2000);
  };

  const downloadDocument = async (envelope: Envelope): Promise<boolean> => {
    setIsLoadingDoc(true);
    setProcessingStatus('Finalizing Document...');
    try {
      const doc = envelope.documents?.[0];
      if (!doc) {
        throw new Error("No document found");
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
        const fields = envelope.fields || [];
        for (const field of fields) {
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
      return true;
    } catch (err) {
      console.error("Download failed:", err);
      setShowToast({ message: `Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'info' });
      return false;
    } finally {
      setIsLoadingDoc(false);
      setProcessingStatus('');
    }
  };

  const shareDocument = (envelope: Envelope) => {
    const mockLink = `https://sahihi.ke/verify/${envelope.id}`;
    if (navigator.share) {
      navigator.share({
        title: envelope.title,
        text: `Verify this document on Sahihi: ${envelope.title}`,
        url: mockLink,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(mockLink);
      setShowToast({ message: 'Verification link copied to clipboard', type: 'success' });
    }
  };

  const archiveDocument = (id: string) => {
    setEnvelopes(prev => prev.map(e => e.id === id ? { ...e, status: 'archived' } : e));
    setShowToast({ message: 'Document archived successfully', type: 'success' });
  };

  const sendDocument = (envelope: Envelope) => {
    setShowToast({ message: `Document dispatched to ${envelope.signers.length} recipients`, type: 'success' });
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
  const [globalScale, setGlobalScale] = useState<number>(1.0);
  const [capturedSignature, setCapturedSignature] = useState<string | null>(null);
  const [capturedStamp, setCapturedStamp] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isMoving, setIsMoving] = useState<string | null>(null);

  const convertDocToPdf = async (file: File) => {
    setIsLoadingDoc(true);
    setProcessingStatus('Initializing Conversion...');
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
      const pdf = await loadPDFDocument(pdfData.slice());
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
    const baseWidth = draggedFieldType === 'stamp' ? 15 : 10;
    const baseHeight = draggedFieldType === 'stamp' ? 10 : 5;
    
    const newField: SignField = {
      id: fieldId,
      type: draggedFieldType,
      x,
      y,
      width: baseWidth * globalScale,
      height: baseHeight * globalScale,
      page: pageNum,
      signerId: selectedSignerId,
      value: capturedValue || undefined,
      isCompleted: !!capturedValue
    };
    
    setNewEnv(prev => ({ ...prev, fields: [...(prev.fields || []), newField] }));
    
    if (!capturedValue && selectedSignerId === 's-1') {
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

  const cloneFieldToAllPages = (fieldId: string) => {
    const field = newEnv.fields?.find(f => f.id === fieldId);
    const activeDoc = newEnv.documents?.[0];
    if (!field || !activeDoc?.pages) return;

    const newFields: SignField[] = [];
    for (let i = 1; i <= activeDoc.pages; i++) {
      if (i === field.page) continue; // Skip current page
      newFields.push({
        ...field,
        id: `f-${Math.random().toString(36).substr(2, 5)}`,
        page: i
      });
    }

    setNewEnv(prev => ({
      ...prev,
      fields: [...(prev.fields || []), ...newFields]
    }));
    setShowToast({ message: `Cloned to all ${activeDoc.pages} pages`, type: 'success' });
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
        action: 'Document Dispatched', 
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
        if (showSignPad?.type === 'signature') setCapturedSignature(url);
        if (showSignPad?.type === 'stamp') setCapturedStamp(url);
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
      setShowToast({ message: `${showSignPad?.type === 'stamp' ? 'Stamp' : 'Signature'} applied successfully`, type: 'success' });
    }
    setShowSignPad(null);
  };

  const renderLanding = () => (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 animate-in fade-in duration-1000">
      <div className="max-w-4xl w-full text-center space-y-12 px-4">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#21262d] dark:bg-[#21262d] text-[#58a6ff] rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-bounce">
          <ShieldCheck size={14} /> Legally Binding in Kenya
        </div>
        
        <h2 className="text-7xl md:text-8xl font-black text-white dark:text-white tracking-tighter leading-[0.85]">
          Sign & Stamp <br/> <span className="text-[#58a6ff]">Instantly.</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-[#8b949e] dark:text-[#8b949e] font-medium max-w-2xl mx-auto leading-relaxed">
          Upload your document, place your signature or stamp, and download. Simple, secure, and professional.
        </p>

        <div className="flex flex-col items-center justify-center gap-8 pt-10">
          <div className="relative group">
            <input 
              type="file" 
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
              accept=".pdf,.doc,.docx"
            />
            <button 
              className="bg-[#161b22] dark:bg-[#1f6feb] text-white px-16 py-8 rounded-[40px] font-black text-3xl hover:scale-105 transition-all shadow-2xl flex items-center gap-6"
            >
              <Upload size={40} /> Upload Document
            </button>
          </div>
          
          <button 
            onClick={() => setView('dashboard')}
            className="text-[#8b949e] dark:text-[#8b949e] font-black text-lg hover:text-[#58a6ff] transition-all flex items-center gap-2"
          >
            <History size={20} /> View Past Documents
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-24">
          {[
            { icon: ShieldCheck, title: 'KICA Compliant', desc: 'Fully adheres to Section 83G of the Kenya Information and Communications Act.' },
            { icon: Zap, title: 'Instant Execution', desc: 'Deploy complex multi-signer workflows in seconds, not hours.' },
            { icon: PenTool, title: 'Vector Precision', desc: 'High-fidelity SVG impressions that remain sharp at any scale.' }
          ].map((feature, i) => (
            <div key={i} className="p-10 bg-[#161b22] dark:bg-[#161b22] rounded-[48px] border border-[#21262d] dark:border-[#30363d] text-left space-y-4 hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="w-14 h-14 bg-[#21262d] dark:bg-[#21262d] text-[#58a6ff] rounded-2xl flex items-center justify-center">
                <feature.icon size={28} />
              </div>
              <h4 className="text-xl font-black tracking-tight">{feature.title}</h4>
              <p className="text-sm text-[#8b949e] dark:text-[#8b949e] font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCreateStep2 = () => {
    const activeDoc = newEnv.documents?.[0];

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-700 fixed inset-0 z-[100] bg-[#161b22] dark:bg-[#0d1117] flex flex-col overflow-hidden">
         {/* Top Header Bar */}
         <div className="bg-[#161b22] dark:bg-[#161b22] border-b border-[#30363d] dark:border-[#30363d] px-6 md:px-12 py-4 flex items-center justify-between z-[110] shadow-sm">
            <div className="flex items-center gap-6">
               <div className="bg-[#1f6feb] text-white p-3 rounded-2xl shadow-xl flex-shrink-0"><FileText size={24} /></div>
               <div className="min-w-0">
                  <h3 className="text-2xl font-black text-white dark:text-white truncate leading-none tracking-tight">{newEnv.title || 'Untitled Document'}</h3>
                  <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mt-2 flex items-center gap-2">
                     <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                     Ready to Place Tags
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-8">
               <div className="hidden md:flex items-center gap-4 bg-[#0d1117] dark:bg-[#21262d] border border-[#30363d] dark:border-[#58a6ff] rounded-2xl px-6 py-3">
                  <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Active Signer:</span>
                  <select 
                    value={selectedSignerId} 
                    onChange={e => setSelectedSignerId(e.target.value)}
                    className="bg-transparent text-sm font-black text-white dark:text-white outline-none min-w-[160px] cursor-pointer"
                  >
                    {newEnv.signers?.map(s => (
                      <option key={s.id} value={s.id} className="dark:bg-[#161b22]">{s.name || s.email}</option>
                    ))}
                  </select>
               </div>

               <button 
                 onClick={() => setShowInviteModal(true)}
                 className="flex items-center gap-3 px-6 py-3 bg-[#21262d] dark:bg-[#21262d] text-[#58a6ff] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#d4e6f9] transition-all border border-[#d4e6f9] dark:border-blue-800"
               >
                 <UserPlus size={18} /> Invite Others
               </button>

               <button onClick={() => setView('dashboard')} className="p-3 hover:bg-[#21262d] dark:hover:bg-[#21262d] rounded-full transition-all text-[#8b949e]"><X size={32} /></button>
            </div>
         </div>

         {/* Main Workspace */}
         <div className="flex-1 flex overflow-hidden relative">
            {/* Preparation Tool Dock - Vertical Left */}
             <div className="w-64 md:w-72 bg-[#161b22] dark:bg-[#161b22] border-r border-[#30363d] dark:border-[#30363d] flex flex-col z-[120] shadow-2xl shrink-0">
                <div className="p-8 border-b border-[#21262d] dark:border-[#30363d]">
                   <h4 className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest mb-6">Tools & Actions</h4>
                   <button 
                     onClick={() => {
                       const firstField = newEnv.fields?.[0];
                       if (firstField) {
                         cloneFieldToAllPages(firstField.id);
                       } else {
                         setShowToast({ message: 'Place at least one tag first', type: 'info' });
                       }
                     }}
                     className="w-full bg-[#1f6feb] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#30363d] transition-all shadow-xl shadow-[#c5d8ef] dark:shadow-none flex items-center justify-center gap-2 mb-4"
                   >
                     <Layers size={14} /> Bulk Sign All Pages
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest px-2">Document Tags</label>
                      <div className="grid grid-cols-2 gap-3">
                         {[
                           { type: 'signature', label: 'Sign', icon: <PenTool size={20}/>, color: 'text-[#58a6ff]', bg: 'bg-[#21262d] dark:bg-[#21262d]' },
                           { type: 'stamp', label: 'Stamp', icon: <Stamp size={20}/>, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                           { type: 'date', label: 'Date', icon: <Calendar size={20}/>, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                           { type: 'text', label: 'Text', icon: <Type size={20}/>, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' }
                         ].map(tag => (
                           <div 
                             key={tag.type}
                             onClick={() => {
                               if ((tag.type === 'signature' || tag.type === 'stamp') && selectedSignerId === 's-1') {
                                 const existing = tag.type === 'signature' ? capturedSignature : capturedStamp;
                                 if (existing) {
                                   setCapturedValue(existing);
                                   setDraggedFieldType(tag.type as FieldType);
                                 } else {
                                   setShowSignPad({ isDesignerPlacement: true, type: tag.type as FieldType });
                                 }
                               } else {
                                 setDraggedFieldType(tag.type as FieldType);
                               }
                             }}
                             className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                               draggedFieldType === tag.type 
                                 ? 'border-[#58a6ff] bg-[#21262d] dark:bg-[#21262d] shadow-lg' 
                                 : 'border-transparent bg-[#0d1117] dark:bg-[#21262d]/50 hover:border-[#30363d] dark:hover:border-[#58a6ff]'
                             }`}
                           >
                              <div className={`${tag.color}`}>{tag.icon}</div>
                              <span className="font-black text-[9px] uppercase tracking-widest text-[#8b949e]">{tag.label}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-[#21262d] dark:border-[#30363d]">
                      <div className="flex justify-between items-center px-2">
                        <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Global Scale</label>
                        <span className="text-[10px] font-bold text-[#8b949e]">{Math.round(globalScale * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="2.5" 
                        step="0.1" 
                        value={globalScale} 
                        onChange={e => setGlobalScale(parseFloat(e.target.value))} 
                        className="w-full h-1.5 bg-[#21262d] dark:bg-[#21262d] rounded-lg accent-[#1f6feb] cursor-pointer" 
                      />
                   </div>
                </div>

                <div className="p-8 border-t border-[#21262d] dark:border-[#30363d]">
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        disabled={newEnv.fields?.length === 0}
                        onClick={() => downloadDocument(newEnv as Envelope)}
                        className="bg-[#21262d] dark:bg-[#21262d] text-[#e6edf3] dark:text-[#8b949e] py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1f6feb] hover:text-white transition-all shadow-lg flex flex-col items-center justify-center gap-2 active:scale-95 disabled:opacity-20"
                      >
                        <FileDown size={18} /> Download
                      </button>
                      <button 
                        disabled={newEnv.fields?.length === 0}
                        onClick={() => handleSend()} 
                        className="bg-[#161b22] dark:bg-[#1f6feb] text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-2xl disabled:opacity-20 flex flex-col items-center justify-center gap-2 active:scale-95"
                      >
                        <Send size={18} /> Finish & Send
                      </button>
                   </div>
                </div>
             </div>

            {/* Document Canvas - Maximized Focus */}
            <div className="flex-1 bg-[#21262d] dark:bg-[#161b22] relative overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col items-center py-12 md:py-24 px-6 scroll-smooth gap-16">
               {isLoadingDoc && (
                 <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#161b22]/80 backdrop-blur-xl">
                   <div className="relative">
                     <Loader2 size={80} className="text-[#58a6ff] animate-spin mb-8" />
                     <div className="absolute inset-0 flex items-center justify-center">
                       <FileCode size={32} className="text-blue-200 animate-pulse" />
                     </div>
                   </div>
                   <p className="text-white font-black uppercase tracking-[0.3em] text-xl mb-2">Universal Document Processing</p>
                   <p className="text-blue-400 font-bold uppercase tracking-widest text-xs animate-pulse">{processingStatus}</p>
                 </div>
               )}
               
               {activeDoc?.pagePreviews?.map((preview, idx) => (
                 <div 
                   key={idx}
                   onClick={(e) => handlePageClick(e, idx + 1)}
                   onPointerMove={handlePointerMove}
                   className="pdf-page-container w-full max-w-5xl bg-[#161b22] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] relative aspect-[1/1.41] shrink-0 cursor-crosshair overflow-visible border border-[#30363d] dark:border-[#30363d]"
                 >
                    {/* High-Resolution Document Rendering */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden bg-[#161b22]">
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
                             className={`absolute -translate-x-1/2 -translate-y-1/2 p-4 rounded-2xl flex flex-col items-center justify-center group cursor-move transition-all active:scale-110 ${
                               field.isCompleted 
                                 ? 'border-none shadow-none' 
                                 : `border-2 border-dashed shadow-2xl ${field.signerId === selectedSignerId ? 'border-[#1a5cad] bg-[#21262d]/10' : 'border-[#aaccf2] opacity-50'}`
                             }`}
                             style={{ 
                               left: `${field.x}%`, 
                               top: `${field.y}%`, 
                               width: field.width ? `${field.width}%` : 'auto',
                               height: field.height ? `${field.height}%` : 'auto',
                               pointerEvents: 'auto', 
                               minWidth: '140px', 
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
                                 {field.type === 'date' && field.signerId === selectedSignerId && (
                                   <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#161b22]/80 backdrop-blur-sm rounded-2xl">
                                     <input 
                                       type="date" 
                                       className="bg-[#161b22] p-2 rounded-lg border-2 border-[#1a5cad] shadow-lg text-xs font-black uppercase"
                                       onChange={(e) => {
                                         const date = new Date(e.target.value);
                                         if (!isNaN(date.getTime())) {
                                           const formatted = date.toLocaleDateString('en-GB', {
                                             day: '2-digit',
                                             month: 'short',
                                             year: 'numeric'
                                           }).toUpperCase();
                                           setNewEnv(prev => ({
                                             ...prev,
                                             fields: prev.fields?.map(f => f.id === field.id ? { ...f, value: formatted, isCompleted: true } : f)
                                           }));
                                         }
                                       }}
                                     />
                                   </div>
                                 )}
                                 <div className={`p-3 rounded-xl mb-2 ${field.signerId === selectedSignerId ? 'bg-[#1f6feb] text-white shadow-lg' : 'bg-[#30363d] text-[#8b949e]'}`}>
                                   {field.type === 'signature' && <PenTool size={20} />}
                                   {field.type === 'stamp' && <Stamp size={20} />}
                                   {field.type === 'date' && <Calendar size={20} />}
                                   {field.type === 'text' && <Type size={20} />}
                                 </div>
                                 <div className="text-center">
                                   <span className={`text-xs font-black uppercase tracking-tight truncate block ${field.signerId === selectedSignerId ? 'text-blue-800' : 'text-[#e6edf3]'}`}>{signer?.name || 'Signer'}</span>
                                   <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest text-[#8b949e]">{field.type} Area</span>
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
                                 className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize bg-[#21262d]0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                               >
                                 <Maximize2 size={12} />
                               </div>
                             )}
                             
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 cloneFieldToAllPages(field.id);
                               }}
                               title="Clone to all pages"
                               className="absolute -top-5 -right-14 bg-[#1f6feb] text-white p-2.5 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                             >
                               <Layers size={14} />
                             </button>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setNewEnv(prev => ({ ...prev, fields: prev.fields?.filter(f => f.id !== field.id) }));
                               }}
                               className="absolute -top-5 -right-5 bg-red-500 text-white p-2.5 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                             >
                               <X size={14} />
                             </button>
                           </div>
                         );
                       })}
                    </div>
                 </div>
               ))}
            </div>

            {/* Signers Sidebar - Right */}
            <div className="hidden lg:flex w-80 bg-[#161b22] dark:bg-[#161b22] border-l border-[#30363d] dark:border-[#30363d] flex-col z-[120] shadow-2xl">
               <div className="p-8 border-b border-[#21262d] dark:border-[#30363d] flex items-center justify-between">
                  <h4 className="text-xs font-black text-white dark:text-white uppercase tracking-widest">Signers</h4>
                  <button onClick={() => setShowInviteModal(true)} className="text-[#58a6ff] hover:scale-110 transition-transform"><UserPlus size={20} /></button>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                  {newEnv.signers?.map((signer, idx) => (
                    <div 
                      key={signer.id}
                      onClick={() => setSelectedSignerId(signer.id)}
                      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer group ${
                        selectedSignerId === signer.id 
                          ? 'bg-[#21262d] dark:bg-[#21262d] border-[#58a6ff] shadow-lg' 
                          : 'bg-[#0d1117] dark:bg-[#21262d]/50 border-transparent hover:border-[#30363d] dark:hover:border-[#58a6ff]'
                      }`}
                    >
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${
                            selectedSignerId === signer.id ? 'bg-[#1f6feb] text-white' : 'bg-[#161b22] dark:bg-[#161b22] text-[#8b949e]'
                          }`}>
                            {signer.name.charAt(0) || idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                             <p className={`font-black text-sm truncate ${selectedSignerId === signer.id ? 'text-blue-900 dark:text-blue-100' : 'text-white dark:text-white'}`}>{signer.name || 'Unnamed Recipient'}</p>
                             <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest truncate mt-1">{signer.email || 'No email provided'}</p>
                             <p className="text-[9px] font-medium text-[#8b949e] uppercase tracking-widest mt-0.5">{signer.role}</p>
                          </div>
                          {selectedSignerId === signer.id && <div className="w-2 h-2 bg-[#1f6feb] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>}
                       </div>
                    </div>
                  ))}
               </div>
               <div className="p-8 border-t border-[#21262d] dark:border-[#30363d]">

                  <button 
                    onClick={() => downloadDocument(newEnv as Envelope)}
                    className="w-full bg-[#21262d] dark:bg-[#21262d] text-[#e6edf3] dark:text-[#8b949e] py-4 rounded-[20px] font-black text-xs hover:bg-[#1f6feb] hover:text-white transition-all shadow-lg flex items-center justify-center gap-3 mb-4"
                  >
                    <FileDown size={20} /> Download PDF
                  </button>
                  <button 
                    onClick={() => handleSend()}
                    className="w-full bg-[#161b22] dark:bg-[#1f6feb] text-white py-6 rounded-[24px] font-black text-sm hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-3"
                  >
                    Finish & Send Document <Send size={20} />
                  </button>
               </div>
            </div>
         </div>

         {/* Immediate Prompting Pad */}
         {showSignPad && (
           <div className="fixed inset-0 bg-[#161b22]/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-6">
              {(showSignPad.type === 'stamp' || (showSignPad.fieldId && newEnv.fields?.find(f => f.id === showSignPad.fieldId)?.type === 'stamp')) ? (
                 <div className="bg-[#161b22] p-12 rounded-[64px] shadow-2xl max-w-5xl w-full animate-in zoom-in overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                      {/* Left Side: Preview */}
                      <div className="bg-[#0d1117] p-12 rounded-[48px] border border-[#21262d] flex items-center justify-center shadow-inner min-h-[400px]" id="stamp-preview-container">
                         <div className="scale-[1.5] origin-center">
                           <SVGPreview config={localStampConfig} />
                         </div>
                      </div>

                      {/* Right Side: Controls */}
                      <div className="flex flex-col justify-center space-y-8">
                        <div>
                          <h4 className="text-5xl font-black text-white tracking-tighter leading-none mb-4">Apply Stamp</h4>
                          <p className="text-[#8b949e] font-bold uppercase text-[11px] tracking-widest">Place your official seal</p>
                        </div>

                        {isEditingStamp ? (
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest mb-2 block">Primary Text</label>
                              <input 
                                type="text" 
                                value={localStampConfig.primaryText} 
                                onChange={e => setLocalStampConfig(prev => ({ ...prev, primaryText: e.target.value }))}
                                className="w-full bg-[#0d1117] p-4 rounded-2xl border border-[#21262d] outline-none focus:ring-4 focus:ring-[#1f6feb]/10 font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-[#8b949e] tracking-widest mb-2 block">Center Text</label>
                              <input 
                                type="text" 
                                value={localStampConfig.centerText} 
                                onChange={e => setLocalStampConfig(prev => ({ ...prev, centerText: e.target.value }))}
                                className="w-full bg-[#0d1117] p-4 rounded-2xl border border-[#21262d] outline-none focus:ring-4 focus:ring-[#1f6feb]/10 font-bold"
                              />
                            </div>
                            <button 
                              onClick={() => setIsEditingStamp(false)}
                              className="w-full py-4 bg-[#161b22] text-white rounded-2xl font-black text-sm shadow-xl hover:bg-[#1f6feb] transition-all"
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
                              className="w-full py-6 rounded-3xl font-black text-white bg-[#1f6feb] shadow-2xl hover:bg-[#30363d] transition-all flex items-center justify-center gap-3 text-lg"
                            >
                              <Check size={24} /> Apply to Document
                            </button>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => onOpenStudio ? onOpenStudio(showSignPad?.fieldId) : setIsEditingStamp(true)}
                                className="py-5 rounded-3xl font-black text-[#58a6ff] bg-[#21262d] hover:bg-[#d4e6f9] transition-all flex items-center justify-center gap-2"
                              >
                                <Edit3 size={18} /> {onOpenStudio ? 'Open Studio' : 'Customize'}
                              </button>
                              <button 
                                onClick={() => setShowSignPad(null)}
                                className="py-5 rounded-3xl font-black text-[#8b949e] bg-[#21262d] hover:bg-[#30363d] transition-all flex items-center justify-center gap-2"
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
      <div className="animate-in fade-in duration-700 px-4 md:px-8 pb-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
           <div>
              <h2 className="text-4xl md:text-6xl font-black text-white dark:text-white tracking-tighter leading-none">{activeEnvelope.title}</h2>
              <p className="text-[#8b949e] font-bold uppercase text-[11px] tracking-widest mt-4 flex items-center gap-2">
                 <ShieldCheck size={16} className="text-green-500" />
                 Secure Document Signing Enabled
              </p>
           </div>
           <button onClick={() => setView('dashboard')} className="p-5 bg-[#21262d] dark:bg-[#21262d] hover:bg-[#30363d] dark:hover:bg-[#30363d] rounded-[24px] transition-all text-[#8b949e] self-start md:self-center"><X size={28} /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16">
           <div className="lg:col-span-8 bg-[#161b22] rounded-[48px] md:rounded-[64px] p-4 md:p-16 flex flex-col items-center gap-8 md:gap-12 overflow-y-auto max-h-[70vh] md:max-h-[90vh] custom-scrollbar shadow-2xl">
              {activeDoc?.pagePreviews?.map((preview, idx) => (
                <div key={idx} className="w-full max-w-4xl bg-[#161b22] aspect-[1/1.41] relative shadow-2xl overflow-hidden shrink-0">
                   <div className="absolute inset-0 w-full h-full bg-[#161b22]">
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
                             <span className="font-bold text-white text-xl px-6 py-3">{field.value}</span>
                           )
                         ) : (
                           <div className="bg-[#1f6feb]/95 text-white px-8 py-6 rounded-[32px] border-2 border-[#30363d] border-dashed shadow-2xl flex flex-col items-center gap-3 hover:bg-[#30363d] transition-all animate-pulse">
                              <div className="bg-[#161b22]/20 p-3 rounded-2xl"><PenTool size={24} /></div>
                              <span className="text-xs font-black uppercase tracking-widest text-white/90">Touch to {field.type}</span>
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                </div>
              ))}
           </div>

           <div className="lg:col-span-4 space-y-8 md:space-y-10">
              <div className="bg-[#161b22] dark:bg-[#161b22] p-8 md:p-12 rounded-[40px] md:rounded-[56px] border border-[#21262d] dark:border-[#30363d] shadow-xl space-y-8 md:space-y-10">
                 <div className="space-y-4 text-center">
                    <h4 className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Completion Ratio</h4>
                    <div className="w-full bg-[#0d1117] dark:bg-[#21262d] h-4 rounded-full overflow-hidden border border-[#21262d] dark:border-[#30363d] shadow-inner">
                       <div className="bg-[#1f6feb] h-full transition-all duration-1000 ease-out shadow-lg" style={{ width: `${(activeEnvelope.fields.filter(f => f.isCompleted).length / activeEnvelope.fields.length) * 100}%` }}></div>
                    </div>
                    <p className="text-sm font-black text-white dark:text-white tracking-tight">{activeEnvelope.fields.filter(f => f.isCompleted).length} of {activeEnvelope.fields.length} Fields Completed</p>
                 </div>
                 
                 <div className="pt-6 border-t border-[#21262d] dark:border-[#30363d] space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <button 
                          onClick={() => downloadDocument(activeEnvelope)}
                          className="bg-[#1f6feb] text-white py-5 rounded-3xl font-black text-[10px] flex flex-col items-center justify-center gap-2 hover:bg-[#30363d] shadow-xl transition-all active:scale-95"
                        >
                          <FileDown size={16} /> Download
                        </button>
                        <button 
                          onClick={() => shareDocument(activeEnvelope)}
                          className="bg-[#21262d] dark:bg-[#21262d] text-[#e6edf3] dark:text-[#8b949e] py-5 rounded-3xl font-black text-[10px] flex flex-col items-center justify-center gap-2 hover:bg-[#30363d] dark:hover:bg-[#30363d] transition-all active:scale-95"
                        >
                          <Share2 size={16} /> Share
                        </button>
                        <button 
                          onClick={() => sendDocument(activeEnvelope)}
                          className="bg-[#21262d] dark:bg-[#21262d] text-[#e6edf3] dark:text-[#8b949e] py-5 rounded-3xl font-black text-[10px] flex flex-col items-center justify-center gap-2 hover:bg-[#30363d] dark:hover:bg-[#30363d] transition-all active:scale-95"
                        >
                          <Mail size={16} /> Send
                        </button>
                      </div>
                    <button 
                      disabled={!allSigned}
                      onClick={async () => {
                        const success = await downloadDocument(activeEnvelope);
                        if (success) {
                          const updated = envelopes.map(e => e.id === activeEnvelope.id ? { ...e, status: 'completed' } as Envelope : e);
                          setEnvelopes(updated);
                          setView('dashboard');
                        }
                      }}
                      className="w-full bg-[#161b22] dark:bg-[#1f6feb] text-white py-6 md:py-7 rounded-[24px] md:rounded-[32px] font-black text-xl md:text-2xl hover:bg-[#1f6feb] transition-all shadow-2xl active:scale-95 disabled:opacity-20 flex items-center justify-center gap-4"
                    >
                      Finish & Download <CheckCircle2 size={28} className="md:size-[32px]" />
                    </button>
                    {!allSigned && <p className="text-center text-[10px] text-[#8b949e] font-bold uppercase mt-6 tracking-widest leading-relaxed">Please sign all required fields <br/> to complete the document.</p>}
                 </div>
              </div>

              <div className="bg-[#0d1117] dark:bg-[#21262d]/50 p-8 md:p-12 rounded-[40px] md:rounded-[56px] border border-[#21262d] dark:border-[#30363d] hidden md:block shadow-inner">
                 <h4 className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest mb-10 text-center">System Audit Log</h4>
                 <div className="space-y-10 relative">
                    <div className="absolute top-4 left-[25px] bottom-0 w-px bg-[#30363d] dark:bg-[#30363d]"></div>
                    {activeEnvelope.auditLog.map(log => (
                      <div key={log.id} className="flex gap-6 relative z-10">
                         <div className="bg-[#161b22] dark:bg-[#161b22] p-3 h-fit rounded-2xl shadow-sm border border-[#21262d] dark:border-[#30363d]"><History size={20} className="text-[#8b949e]"/></div>
                         <div className="flex-1">
                            <p className="text-sm font-black text-white dark:text-white leading-none">{log.action}</p>
                            <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mt-2">{log.user} • {log.ip}</p>
                            <p className="text-[10px] text-[#8b949e] font-medium mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {showSignPad && (
          <div className="fixed inset-0 bg-[#161b22]/90 backdrop-blur-3xl z-[200] flex items-center justify-center p-4">
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
             className="w-16 h-16 bg-[#1f6feb] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#30363d] hover:scale-110 transition-all group relative"
           >
             <FileDown size={28} />
             <span className="absolute right-20 bg-[#161b22] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Download Document</span>
           </button>
           <button 
             onClick={() => shareDocument(activeEnvelope)}
             className="w-16 h-16 bg-[#161b22] text-[#e6edf3] rounded-full shadow-2xl flex items-center justify-center hover:bg-[#0d1117] hover:scale-110 transition-all group relative border border-[#21262d]"
           >
             <Share2 size={28} />
             <span className="absolute right-20 bg-[#161b22] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Share Link</span>
           </button>
           <button 
             onClick={() => {
               setNewEnv(activeEnvelope);
               setCurrentStep(1);
               setView('create');
             }}
             className="w-16 h-16 bg-[#161b22] text-[#e6edf3] rounded-full shadow-2xl flex items-center justify-center hover:bg-[#0d1117] hover:scale-110 transition-all group relative border border-[#21262d]"
           >
             <UserPlus size={28} />
             <span className="absolute right-20 bg-[#161b22] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Invite Others</span>
           </button>
           <button 
             onClick={() => {
               archiveDocument(activeEnvelope.id);
               setView('dashboard');
             }}
             className="w-16 h-16 bg-[#161b22] text-red-600 rounded-full shadow-2xl flex items-center justify-center hover:bg-red-50 hover:scale-110 transition-all group relative border border-red-100"
           >
             <Trash2 size={28} />
             <span className="absolute right-20 bg-[#161b22] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Archive Document</span>
           </button>
           <button 
             onClick={() => {
               setNewEnv(activeEnvelope);
               setCurrentStep(2);
               setView('create');
             }}
             className="w-16 h-16 bg-[#161b22] text-[#e6edf3] rounded-full shadow-2xl flex items-center justify-center hover:bg-[#0d1117] hover:scale-110 transition-all group relative border border-[#21262d]"
           >
             <Edit3 size={28} />
             <span className="absolute right-20 bg-[#161b22] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Edit Fields</span>
           </button>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="animate-in fade-in duration-500 px-4 md:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div>
          <h2 className="text-5xl md:text-7xl font-black text-white dark:text-white tracking-tighter leading-none">Sign Center</h2>
          <p className="text-[#8b949e] dark:text-[#8b949e] font-medium text-lg mt-4">Upload documents to sign, stamp, or send for signature.</p>
        </div>
        <div className="relative group w-full md:w-auto">
          <input 
            type="file" 
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            accept=".pdf,.doc,.docx"
          />
          <button className="w-full md:w-auto bg-[#1f6feb] text-white px-12 py-6 rounded-[32px] font-black text-xl shadow-2xl shadow-[#c5d8ef] dark:shadow-none hover:bg-[#30363d] transition-all flex items-center justify-center gap-3 active:scale-95">
            <Upload size={28} /> Upload & Sign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
        <div className="bg-[#161b22] dark:bg-[#161b22] p-8 md:p-10 rounded-[40px] md:rounded-[48px] border border-[#21262d] dark:border-[#30363d] shadow-sm hover:shadow-xl transition-all group">
          <div className="w-14 h-14 bg-[#21262d] dark:bg-[#21262d] text-[#58a6ff] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ShieldCheck size={28} />
          </div>
          <h4 className="text-xl font-black tracking-tight mb-2">Legal Compliance</h4>
          <p className="text-sm text-[#8b949e] dark:text-[#8b949e] font-medium leading-relaxed">Fully compliant with Kenyan Information and Communications Act (KICA).</p>
        </div>
        <div className="bg-[#161b22] dark:bg-[#161b22] p-8 md:p-10 rounded-[40px] md:rounded-[48px] border border-[#21262d] dark:border-[#30363d] shadow-sm hover:shadow-xl transition-all group">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Layers size={28} />
          </div>
          <h4 className="text-xl font-black tracking-tight mb-2">Bulk Processing</h4>
          <p className="text-sm text-[#8b949e] dark:text-[#8b949e] font-medium leading-relaxed">Sign or stamp hundreds of pages in seconds with our multi-page engine.</p>
        </div>
        <div className="bg-[#161b22] dark:bg-[#161b22] p-8 md:p-10 rounded-[40px] md:rounded-[48px] border border-[#21262d] dark:border-[#30363d] shadow-sm hover:shadow-xl transition-all group">
          <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <UserPlus size={28} />
          </div>
          <h4 className="text-xl font-black tracking-tight mb-2">Multi-Signer</h4>
          <p className="text-sm text-[#8b949e] dark:text-[#8b949e] font-medium leading-relaxed">Incorporate multiple signers with secure email-based authentication.</p>
        </div>
      </div>

      <div className="bg-[#161b22] dark:bg-[#161b22] border border-[#21262d] dark:border-[#30363d] rounded-[40px] md:rounded-[56px] overflow-hidden shadow-xl">
        {envelopes.filter(e => e.status !== 'archived').length === 0 ? (
          <div className="p-20 md:p-40 text-center">
            <div className="bg-[#0d1117] dark:bg-[#21262d] w-24 h-24 md:w-32 md:h-32 rounded-[32px] md:rounded-[48px] flex items-center justify-center mx-auto mb-10">
               <FileText size={48} className="text-[#e6edf3] dark:text-white md:size-[56px]" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-white dark:text-white mb-4">No active documents</h3>
            <p className="text-[#8b949e] dark:text-[#8b949e] mb-10 max-w-sm mx-auto">Your document list is empty. Upload a document to begin.</p>
            <div className="relative inline-block group">
              <input 
                type="file" 
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                accept=".pdf,.doc,.docx"
              />
              <button className="text-[#58a6ff] font-black uppercase text-sm tracking-widest hover:underline decoration-2 underline-offset-8">Start Your First Document</button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-[#0d1117] dark:bg-[#21262d]/50 border-b border-[#21262d] dark:border-[#30363d]">
                  <th className="px-8 md:px-12 py-8 md:py-10 text-[11px] font-black text-[#8b949e] uppercase tracking-widest">Document Name</th>
                  <th className="px-8 md:px-12 py-8 md:py-10 text-[11px] font-black text-[#8b949e] uppercase tracking-widest">Status</th>
                  <th className="px-8 md:px-12 py-8 md:py-10 text-[11px] font-black text-[#8b949e] uppercase tracking-widest text-right">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-[#30363d]">
                {envelopes.filter(e => e.status !== 'archived').map(env => (
                  <tr key={env.id} className="hover:bg-[#0d1117]/50 dark:hover:bg-[#21262d]/30 transition-colors group">
                    <td className="px-8 md:px-12 py-8 md:py-10">
                      <div className="flex items-center gap-4 md:gap-6 cursor-pointer" onClick={() => { setActiveEnvelope(env); setView('signer-view'); }}>
                        <div className="bg-[#21262d] dark:bg-[#21262d] text-[#58a6ff] p-4 md:p-5 rounded-2xl md:rounded-3xl flex-shrink-0"><FileText size={24} className="md:size-[28px]" /></div>
                        <div className="min-w-0">
                          <div className="font-black text-white dark:text-white text-lg md:text-xl truncate max-w-[200px] md:max-w-md">{env.title}</div>
                          <div className="text-[10px] md:text-xs text-[#8b949e] font-bold mt-1">ID: {env.id.toUpperCase()} • {new Date(env.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 md:px-12 py-8 md:py-10">
                      <div className="flex items-center gap-3">
                        <span className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest border ${
                          env.status === 'sent' ? 'bg-[#21262d] text-[#58a6ff] border-[#d4e6f9] dark:bg-[#21262d] dark:border-blue-800' : 
                          env.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-800' :
                          'bg-[#0d1117] text-[#8b949e] border-[#21262d] dark:bg-[#21262d] dark:border-[#58a6ff]'
                        }`}>
                          {env.status}
                        </span>
                        <div className="hidden sm:flex -space-x-3">
                          {env.signers.map((s, i) => (
                            <div key={s.id} className="w-8 h-8 rounded-full bg-[#161b22] dark:bg-[#21262d] border-2 border-[#21262d] dark:border-[#020b18] flex items-center justify-center text-[10px] font-black text-[#8b949e]" title={s.name}>
                              {s.name.charAt(0)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 md:px-12 py-8 md:py-10 text-right">
                      <div className="flex items-center justify-end gap-2 md:gap-4">
                        <button 
                          onClick={() => { setActiveEnvelope(env); setView('create'); setCurrentStep(2); setNewEnv(env); }}
                          className="p-3 md:p-4 bg-[#21262d] dark:bg-[#21262d] text-[#e6edf3] dark:text-[#8b949e] rounded-xl md:rounded-2xl hover:bg-[#1f6feb] hover:text-white transition-all"
                          title="Edit Tags"
                        >
                          <Edit3 size={18} className="md:size-[20px]" />
                        </button>
                        <button 
                          onClick={() => downloadDocument(env)}
                          className="p-3 md:p-4 bg-[#21262d] dark:bg-[#21262d] text-[#e6edf3] dark:text-[#8b949e] rounded-xl md:rounded-2xl hover:bg-[#1f6feb] hover:text-white transition-all"
                          title="Download PDF"
                        >
                          <FileDown size={18} className="md:size-[20px]" />
                        </button>
                        <button 
                          onClick={() => archiveDocument(env.id)}
                          className="p-3 md:p-4 bg-[#21262d] dark:bg-[#21262d] text-[#e6edf3] dark:text-[#8b949e] rounded-xl md:rounded-2xl hover:bg-red-600 hover:text-white transition-all"
                          title="Archive"
                        >
                          <Trash2 size={18} className="md:size-[20px]" />
                        </button>
                        <button onClick={() => { setActiveEnvelope(env); setView('signer-view'); }} className="hidden sm:block bg-[#161b22] dark:bg-[#1f6feb] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95">Open</button>
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
      <div className="bg-[#161b22] dark:bg-[#161b22] p-14 rounded-[64px] border border-[#21262d] dark:border-[#30363d] shadow-2xl space-y-12">
        <div className="text-center space-y-4">
          <h3 className="text-4xl font-black text-white dark:text-white tracking-tighter">Document Details</h3>
          <p className="text-[#8b949e] font-medium">Give your document a name and add any other signers if needed.</p>
        </div>

        <div className="space-y-6">
          <label className="text-[11px] font-black text-[#8b949e] uppercase tracking-widest flex items-center gap-2">
            Document Title
          </label>
          <input 
            type="text" 
            placeholder="e.g., Partnership Agreement"
            value={newEnv.title}
            onChange={e => setNewEnv(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-[#0d1117] dark:bg-[#21262d] border-2 border-[#21262d] dark:border-[#30363d] rounded-3xl py-7 px-10 outline-none focus:ring-8 focus:ring-[#1f6feb]/10 text-2xl font-black transition-all dark:text-white"
          />
        </div>

        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black text-[#8b949e] uppercase tracking-widest">Signers</label>
            <button 
              onClick={() => setNewEnv(prev => ({ ...prev, signers: [...(prev.signers || []), { id: `s-${Date.now()}`, name: '', email: '', role: 'signer', order: (prev.signers?.length || 0) + 1, status: 'pending' }] }))} 
              className="text-[#58a6ff] font-black text-xs uppercase tracking-widest flex items-center gap-3 bg-[#21262d] dark:bg-[#21262d] px-6 py-4 rounded-[28px] hover:bg-[#d4e6f9] transition-all shadow-sm"
            >
              <UserPlus size={20} /> Add Another Signer
            </button>
          </div>
          <div className="space-y-6">
            {newEnv.signers?.map((signer, i) => (
              <div key={signer.id} className="flex flex-col md:flex-row gap-6 p-8 bg-[#0d1117] dark:bg-[#21262d]/50 rounded-[40px] items-center group border border-[#21262d] dark:border-[#30363d] transition-all hover:bg-[#161b22] dark:hover:bg-[#21262d] hover:shadow-xl">
                <div className="w-12 h-12 bg-[#161b22] dark:bg-[#161b22] rounded-2xl flex items-center justify-center font-black text-[#8b949e] border border-[#21262d] dark:border-[#30363d] flex-shrink-0 shadow-md">{i + 1}</div>
                <input 
                  type="text" placeholder="Full Name" value={signer.name}
                  onChange={e => {
                    const updated = [...(newEnv.signers || [])];
                    updated[i].name = e.target.value;
                    setNewEnv(prev => ({ ...prev, signers: updated }));
                  }}
                  className="w-full md:flex-1 bg-[#161b22] dark:bg-[#161b22] border border-[#30363d] dark:border-[#58a6ff] rounded-2xl py-4 px-6 outline-none font-bold text-lg shadow-sm focus:ring-4 focus:ring-[#1f6feb]/10 dark:text-white" 
                />
                <input 
                  type="email" placeholder="Email Address" value={signer.email}
                  onChange={e => {
                    const updated = [...(newEnv.signers || [])];
                    updated[i].email = e.target.value;
                    setNewEnv(prev => ({ ...prev, signers: updated }));
                  }}
                  className="w-full md:flex-1 bg-[#161b22] dark:bg-[#161b22] border border-[#30363d] dark:border-[#58a6ff] rounded-2xl py-4 px-6 outline-none font-bold text-lg shadow-sm focus:ring-4 focus:ring-[#1f6feb]/10 dark:text-white" 
                />
                {i > 0 && (
                  <button 
                    onClick={() => setNewEnv(prev => ({ ...prev, signers: prev.signers?.filter(s => s.id !== signer.id) }))} 
                    className="text-[#8b949e] hover:text-red-500 transition-colors p-4 bg-[#161b22] dark:bg-[#161b22] rounded-2xl shadow-sm border border-[#21262d] dark:border-[#30363d]"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
         <button 
          onClick={() => setCurrentStep(2)}
          className="bg-[#161b22] dark:bg-[#1f6feb] text-white px-16 py-8 rounded-[40px] font-black text-2xl hover:scale-105 transition-all shadow-2xl active:scale-95 flex items-center gap-5"
        >
          Continue to Studio <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[80vh] flex flex-col">
      {showInviteModal && (
        <div className="fixed inset-0 bg-[#161b22]/90 backdrop-blur-2xl z-[300] flex items-center justify-center p-6">
          <div className="bg-[#161b22] dark:bg-[#161b22] w-full max-w-2xl rounded-[64px] shadow-2xl overflow-hidden animate-in zoom-in duration-500 border border-[#21262d] dark:border-[#30363d]">
            <div className="p-16 space-y-12">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-5xl font-black text-white dark:text-white tracking-tighter leading-none">Invite Signer</h4>
                  <p className="text-[#8b949e] dark:text-[#8b949e] font-bold uppercase text-[10px] tracking-widest mt-4">Expand the Signing Session</p>
                </div>
                <button onClick={() => setShowInviteModal(false)} className="p-4 bg-[#21262d] dark:bg-[#21262d] rounded-full text-[#8b949e] hover:text-white dark:hover:text-white transition-all"><X size={32} /></button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    value={newSigner.name}
                    onChange={e => setNewSigner(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#0d1117] dark:bg-[#21262d] border-2 border-[#21262d] dark:border-[#30363d] rounded-3xl py-6 px-8 outline-none focus:ring-8 focus:ring-[#1f6feb]/10 font-bold text-lg dark:text-white"
                    placeholder="e.g., Jane Doe"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    value={newSigner.email}
                    onChange={e => setNewSigner(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[#0d1117] dark:bg-[#21262d] border-2 border-[#21262d] dark:border-[#30363d] rounded-3xl py-6 px-8 outline-none focus:ring-8 focus:ring-[#1f6feb]/10 font-bold text-lg dark:text-white"
                    placeholder="e.g., jane@firm.ke"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Role</label>
                  <select 
                    value={newSigner.role}
                    onChange={e => setNewSigner(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full bg-[#0d1117] dark:bg-[#21262d] border-2 border-[#21262d] dark:border-[#30363d] rounded-3xl py-6 px-8 outline-none focus:ring-8 focus:ring-[#1f6feb]/10 font-bold text-lg dark:text-white appearance-none"
                  >
                    <option value="signer">Signer</option>
                    <option value="viewer">Viewer</option>
                    <option value="approver">Approver</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={() => addSigner()}
                className="w-full bg-[#161b22] dark:bg-[#1f6feb] text-white py-8 rounded-[32px] font-black text-2xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-4"
              >
                Add to Document <UserPlus size={28} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[400] animate-in slide-in-from-top-10 duration-500">
          <div className={`px-10 py-5 rounded-[40px] shadow-2xl flex items-center gap-5 border ${
            showToast.type === 'success' ? 'bg-green-600 text-white border-green-500' : 'bg-[#1f6feb] text-white border-[#1a5cad]'
          }`}>
            <CheckCircle2 size={28} />
            <span className="font-black uppercase tracking-[0.2em] text-xs">{showToast.message}</span>
          </div>
        </div>
      )}
      {view === 'dashboard' && renderDashboard()}
      {view === 'create' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentStep === 1 && renderCreateStep1()}
          {currentStep === 2 && renderCreateStep2()}
          {currentStep === 3 && (
            <div className="animate-in zoom-in-95 duration-1000 max-w-2xl mx-auto py-24 px-4">
               <div className="bg-[#161b22] p-14 md:p-20 rounded-[72px] border border-[#21262d] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.3)] space-y-16 text-center">
                  <div className="bg-green-50 text-green-600 w-28 h-28 rounded-[48px] flex items-center justify-center mx-auto shadow-2xl shadow-green-100 animate-bounce border border-green-100">
                     <ShieldCheck size={64} />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-5xl md:text-7xl font-black text-white tracking-tighter">Ready to Deploy</h3>
                    <p className="text-2xl text-[#8b949e] font-medium leading-relaxed">Secure authentication workflow finalized and ready for immediate registry.</p>
                  </div>
                  
                  <div className="bg-[#0d1117] p-12 rounded-[56px] text-left space-y-8 border border-[#21262d] shadow-inner">
                     <div className="flex items-center justify-between border-b border-[#30363d] pb-6">
                        <span className="text-[11px] font-black text-[#8b949e] uppercase tracking-widest">Document</span>
                        <span className="font-black text-white text-lg truncate max-w-[250px]">{newEnv.title}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-[#8b949e] uppercase tracking-widest">Identifiers</span>
                        <div className="flex items-center gap-3 text-green-600">
                           <ShieldCheck size={20} /> <span className="text-xs font-black uppercase tracking-widest">Audit Active • {newEnv.fields?.length} Tags</span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button onClick={() => setCurrentStep(2)} className="bg-[#21262d] text-[#e6edf3] py-8 rounded-[36px] font-black text-xl hover:bg-[#30363d] transition-all">Refine Tags</button>
                    <button 
                      onClick={handleSend}
                      className="bg-[#1f6feb] text-white py-8 rounded-[36px] font-black text-2xl hover:bg-[#30363d] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] flex items-center justify-center gap-5 transition-all active:scale-95"
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
