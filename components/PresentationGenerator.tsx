
import React, { useState, useRef } from 'react';
import { 
  Monitor, 
  Plus, 
  Trash2, 
  Download, 
  Layout, 
  Type, 
  Image as ImageIcon, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Settings,
  Zap,
  Layers,
  Presentation,
  X,
  Save,
  Share2,
  MoreVertical,
  Palette,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

interface Slide {
  id: string;
  type: 'title' | 'content' | 'chart' | 'image';
  title: string;
  content: string;
  chartData?: { label: string; value: number }[];
  imageUrl?: string;
  theme?: string;
}

export default function PresentationGenerator() {
  const [slides, setSlides] = useState<Slide[]>([
    { id: '1', type: 'title', title: 'Corporate Strategy 2026', content: 'Quarterly Performance Review & Future Outlook', theme: 'Corporate' }
  ]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const addSlide = () => {
    const newSlide: Slide = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'content',
      title: 'New Slide',
      content: 'Add your content here...',
      theme: 'Corporate'
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const removeSlide = (index: number) => {
    if (slides.length === 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    setActiveSlideIndex(Math.max(0, index - 1));
  };

  const updateSlide = (updates: Partial<Slide>) => {
    const newSlides = [...slides];
    newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], ...updates };
    setSlides(newSlides);
  };

  const insertElement = (type: 'chart' | 'image' | 'table') => {
    if (type === 'chart') {
      updateSlide({ 
        type: 'chart', 
        chartData: [
          { label: 'Q1', value: 400 },
          { label: 'Q2', value: 600 },
          { label: 'Q3', value: 800 },
          { label: 'Q4', value: 1200 }
        ] 
      });
    } else if (type === 'image') {
      updateSlide({ 
        type: 'image', 
        imageUrl: 'https://picsum.photos/seed/corporate/1280/720' 
      });
    } else if (type === 'table') {
      updateSlide({
        content: slides[activeSlideIndex].content + "\n\n| Metric | Target | Actual |\n|--------|--------|--------|\n| Growth | 20%    | 24%    |"
      });
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1280, 720]
    });

    slides.forEach((slide, index) => {
      if (index > 0) doc.addPage();
      
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 1280, 720, 'F');
      
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 1280, 40, 'F');

      doc.setFontSize(60);
      doc.setTextColor(30, 41, 59);
      doc.text(slide.title, 80, 150);

      doc.setFontSize(30);
      doc.setTextColor(71, 85, 105);
      const splitText = doc.splitTextToSize(slide.content, 1100);
      doc.text(splitText, 80, 250);

      doc.setFontSize(14);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${index + 1} | FreeStamps KE Slide Architect`, 80, 680);
    });

    doc.save('presentation.pdf');
    setIsExporting(false);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Canva-style Sidebar */}
      <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-8 z-20">
        <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
          <Monitor size={24} />
        </div>
        
        <div className="flex flex-col gap-4">
          <SidebarItem icon={<Layout size={20} />} label="Layouts" onClick={() => {}} />
          <SidebarItem icon={<Type size={20} />} label="Text" onClick={() => {}} />
          <SidebarItem icon={<ImageIcon size={20} />} label="Images" onClick={() => insertElement('image')} />
          <SidebarItem icon={<BarChart3 size={20} />} label="Charts" onClick={() => insertElement('chart')} />
          <SidebarItem icon={<Palette size={20} />} label="Design" onClick={() => {}} />
        </div>

        <div className="mt-auto pb-4">
          <SidebarItem icon={<Settings size={20} />} label="Settings" onClick={() => {}} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
              <Presentation size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter">Slide Architect</h2>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all">
              <Play size={18} /> Present
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all">
              <Share2 size={18} /> Share
            </button>
            <button 
              onClick={exportToPDF}
              disabled={isExporting}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
            >
              {isExporting ? 'Exporting...' : <><Download size={18} /> Export PDF</>}
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Slide List (Filmstrip) */}
          <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slides</h3>
              <button onClick={addSlide} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all">
                <Plus size={16} />
              </button>
            </div>
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                onClick={() => setActiveSlideIndex(index)}
                className={`w-full aspect-video rounded-2xl border-2 transition-all p-4 text-left relative group cursor-pointer ${
                  activeSlideIndex === index 
                    ? 'border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-500/10' 
                    : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                }`}
              >
                <span className="absolute top-2 left-2 text-[10px] font-black text-slate-300">{index + 1}</span>
                <p className="text-[10px] font-black text-slate-900 truncate mt-2">{slide.title}</p>
                <div className="mt-2 h-1 w-1/2 bg-slate-200 rounded-full"></div>
                <div className="mt-1 h-1 w-1/3 bg-slate-200 rounded-full"></div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); removeSlide(index); }}
                  className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Editor Canvas */}
          <main className="flex-1 overflow-y-auto p-12 flex flex-col items-center bg-slate-100 custom-scrollbar">
            <div className="w-full max-w-5xl aspect-video bg-white shadow-2xl rounded-sm p-20 flex flex-col justify-center relative group/canvas">
              <input 
                type="text"
                value={slides[activeSlideIndex].title}
                onChange={(e) => updateSlide({ title: e.target.value })}
                className="text-6xl font-black text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-200 w-full mb-10 text-center"
                placeholder="Slide Title"
              />
              <textarea 
                value={slides[activeSlideIndex].content}
                onChange={(e) => updateSlide({ content: e.target.value })}
                className="text-2xl text-slate-500 bg-transparent border-none outline-none placeholder:text-slate-200 w-full h-64 resize-none font-medium leading-relaxed text-center"
                placeholder="Start typing your corporate insights..."
              />

              {/* Slide Overlay Controls */}
              <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover/canvas:opacity-100 transition-all">
                <button className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50"><Layers size={18} /></button>
                <button className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50"><Settings size={18} /></button>
              </div>
            </div>

            {/* Slide Properties (Floating) */}
            <div className="mt-12 flex gap-8">
              <div className="bg-white px-8 py-4 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layout</span>
                  <select 
                    value={slides[activeSlideIndex].type}
                    onChange={(e) => updateSlide({ type: e.target.value as any })}
                    className="bg-slate-50 border-none rounded-xl py-2 px-4 text-xs font-bold outline-none"
                  >
                    <option value="title">Title</option>
                    <option value="content">Content</option>
                    <option value="chart">Chart</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Theme</span>
                  <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest">Corporate Minimal</button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Fullscreen Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950 z-[200] flex flex-col"
          >
            <div className="p-8 flex justify-between items-center">
              <p className="text-white font-black tracking-tighter text-2xl">FreeStamps <span className="text-indigo-500">KE</span></p>
              <button onClick={() => setShowPreview(false)} className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-20">
              <div className="w-full max-w-6xl aspect-video bg-white rounded-sm shadow-2xl p-20 flex flex-col justify-center">
                <h2 className="text-7xl font-black text-slate-900 mb-10 text-center">{slides[activeSlideIndex].title}</h2>
                <p className="text-3xl text-slate-500 font-medium leading-relaxed text-center">{slides[activeSlideIndex].content}</p>
              </div>
            </div>

            <div className="p-12 flex justify-center gap-8">
              <button 
                disabled={activeSlideIndex === 0}
                onClick={() => setActiveSlideIndex(prev => prev - 1)}
                className="p-6 bg-white/10 text-white rounded-full hover:bg-white/20 disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={32} />
              </button>
              <div className="flex items-center text-white font-black text-xl">
                {activeSlideIndex + 1} / {slides.length}
              </div>
              <button 
                disabled={activeSlideIndex === slides.length - 1}
                onClick={() => setActiveSlideIndex(prev => prev + 1)}
                className="p-6 bg-white/10 text-white rounded-full hover:bg-white/20 disabled:opacity-20 transition-all"
              >
                <ChevronRight size={32} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="group relative flex items-center justify-center w-12 h-12 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all"
    >
      {icon}
      <span className="absolute left-full ml-4 px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
        {label}
      </span>
    </button>
  );
}
