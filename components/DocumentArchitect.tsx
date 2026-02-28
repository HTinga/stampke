import React, { useState, useRef, useEffect } from 'react';
import { 
  Type, 
  Table as TableIcon, 
  Image as ImageIcon, 
  PenTool, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  Layout,
  Maximize2,
  FileText,
  Save,
  Share2,
  MoreVertical,
  GripVertical,
  PlusCircle,
  MinusCircle,
  Search,
  Filter,
  Zap,
  Grid,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DOCUMENT_TEMPLATES, DocTemplate } from '../constants/documentTemplates';

interface Block {
  id: string;
  type: 'text' | 'table' | 'image' | 'signature' | 'stamp' | 'header' | 'footer';
  content: any;
  style?: React.CSSProperties;
}

interface Page {
  id: string;
  blocks: Block[];
}

const INITIAL_PAGE: Page = {
  id: 'page-1',
  blocks: [
    { id: 'header-1', type: 'header', content: { title: 'OFFICIAL DOCUMENT', subtitle: 'Business Workspace' } },
    { id: 'text-1', type: 'text', content: 'Start typing your professional content here...' },
    { id: 'footer-1', type: 'footer', content: { pageNumber: 1, text: 'FreeStamps KE - Digital Authority' } }
  ]
};

export default function DocumentArchitect() {
  const [pages, setPages] = useState<Page[]>([INITIAL_PAGE]);
  const [activePageId, setActivePageId] = useState('page-1');
  const [docTitle, setDocTitle] = useState('Untitled Document');
  const [isExporting, setIsExporting] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [history, setHistory] = useState<any[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('doc_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (title: string, type: string) => {
    const newDoc = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      recipient: 'Internal',
      date: new Date().toLocaleDateString(),
      status: 'Draft'
    };
    const newHistory = [newDoc, ...history];
    setHistory(newHistory);
    localStorage.setItem('doc_history', JSON.stringify(newHistory));
  };

  const categories = ['All', 'Financial', 'Administrative', 'Legal', 'HR', 'Academic', 'Compliance'];

  const filteredTemplates = DOCUMENT_TEMPLATES.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectTemplate = (template: DocTemplate) => {
    const blocks: Block[] = [
      { id: 'header-1', type: 'header', content: { title: template.name.toUpperCase(), subtitle: 'Business Workspace' } }
    ];

    // Add specific fields based on template
    template.fields.forEach((field, idx) => {
      const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      
      if (field === 'items') {
        blocks.push({ 
          id: `block-table-${idx}`, 
          type: 'table', 
          content: { rows: [['Item', 'Qty', 'Price', 'Total'], ['', '', '', '']] } 
        });
      } else if (field === 'total' || field === 'amount') {
        blocks.push({ 
          id: `block-text-${idx}`, 
          type: 'text', 
          content: `TOTAL AMOUNT: KES 0.00`,
          style: { fontWeight: 'bold', textAlign: 'right' }
        });
      } else {
        blocks.push({ 
          id: `block-text-${idx}`, 
          type: 'text', 
          content: `${label}: [Enter ${label}]` 
        });
      }
    });

    // Add Signature and Footer
    blocks.push({ id: 'sig-1', type: 'signature', content: { name: 'Authorized Signatory', date: new Date().toLocaleDateString() } });
    blocks.push({ id: 'footer-1', type: 'footer', content: { pageNumber: 1, text: 'FreeStamps KE - Digital Authority' } });

    setPages([{ id: 'page-1', blocks }]);
    setDocTitle(template.name);
    setShowTemplatePicker(false);
    setActivePageId('page-1');
  };

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: type === 'table' ? { rows: [['Item', 'Qty', 'Price', 'Total'], ['', '', '', '']] } : 
               type === 'text' ? 'New text block...' : 
               type === 'image' ? 'https://picsum.photos/seed/doc/400/200' : 
               type === 'signature' ? { name: 'Authorized Signatory', date: new Date().toLocaleDateString() } :
               type === 'stamp' ? { text: 'OFFICIAL STAMP' } : '',
    };

    setPages(pages.map(p => p.id === activePageId ? { ...p, blocks: [...p.blocks, newBlock] } : p));
  };

  const updateBlock = (pageId: string, blockId: string, content: any) => {
    setPages(pages.map(p => p.id === pageId ? {
      ...p,
      blocks: p.blocks.map(b => b.id === blockId ? { ...b, content } : b)
    } : p));
  };

  const removeBlock = (pageId: string, blockId: string) => {
    setPages(pages.map(p => p.id === pageId ? {
      ...p,
      blocks: p.blocks.filter(b => b.id !== blockId)
    } : p));
  };

  const addPage = () => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      blocks: [
        { id: `header-${Date.now()}`, type: 'header', content: { title: docTitle, subtitle: 'Page ' + (pages.length + 1) } },
        { id: `footer-${Date.now()}`, type: 'footer', content: { pageNumber: pages.length + 1, text: 'FreeStamps KE' } }
      ]
    };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
  };

  const exportPDF = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pageElements = canvasRef.current.querySelectorAll('.a4-page');
    
    for (let i = 0; i < pageElements.length; i++) {
      const canvas = await html2canvas(pageElements[i] as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }
    
    pdf.save(`${docTitle.replace(/\s+/g, '_')}.pdf`);
    setIsExporting(false);
    saveToHistory(docTitle, 'architect');
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <AnimatePresence>
        {showTemplatePicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-100 overflow-y-auto py-12 px-4 md:px-8"
          >
            <div className="max-w-7xl mx-auto">
              <div className="mb-16 text-center">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-6"
                >
                  <Zap size={14} /> Smart Document Engine
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6">
                  Select a <span className="text-blue-600">Template.</span>
                </h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                  Choose from our library of professional business documents to start your project.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm mb-12">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-16 pr-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                  />
                </div>
                <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                  <Filter size={18} className="text-slate-400 shrink-0" />
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 ${
                        selectedCategory === cat 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-20">
                {filteredTemplates.map((t, idx) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => selectTemplate(t)}
                    className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className={`${t.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                      <t.icon size={28} />
                    </div>
                    <div className="mb-2">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">{t.category}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">{t.name}</h3>
                    <p className="text-slate-500 font-medium text-xs leading-relaxed line-clamp-2">{t.desc}</p>
                    <div className="mt-6 flex items-center text-blue-600 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Use Template <ChevronRight size={14} className="ml-1" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* History Section */}
              <div className="bg-white p-12 rounded-[64px] border border-slate-100 shadow-xl">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-900 text-white p-4 rounded-2xl">
                      <Grid size={24} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">Recent Activity</h3>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Track your document usage</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-slate-50">
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document</th>
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient</th>
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="pb-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {history.length > 0 ? history.map((doc) => (
                        <tr key={doc.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <FileText size={18} />
                              </div>
                              <span className="font-black text-slate-900">{doc.title}</span>
                            </div>
                          </td>
                          <td className="py-6 text-slate-500 font-bold text-sm">{doc.recipient}</td>
                          <td className="py-6 text-slate-500 font-bold text-sm">{doc.date}</td>
                          <td className="py-6">
                            <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-6 text-right">
                            <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                              <Download size={20} />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No documents generated yet</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-8 z-20">
        <div 
          onClick={() => setShowTemplatePicker(true)}
          className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-200 mb-4 cursor-pointer hover:scale-110 transition-transform"
        >
          <Grid size={24} />
        </div>
        
        <div className="flex flex-col gap-4">
          <SidebarItem icon={<Type size={20} />} label="Text" onClick={() => addBlock('text')} />
          <SidebarItem icon={<Calendar size={20} />} label="Date" onClick={() => {
            const newBlock: Block = {
              id: `block-${Date.now()}`,
              type: 'text',
              content: `Date: ${new Date().toLocaleDateString()}`,
              style: { textAlign: 'right', color: '#64748b' }
            };
            setPages(pages.map(p => p.id === activePageId ? { ...p, blocks: [...p.blocks, newBlock] } : p));
          }} />
          <SidebarItem icon={<TableIcon size={20} />} label="Table" onClick={() => addBlock('table')} />
          <SidebarItem icon={<ImageIcon size={20} />} label="Image" onClick={() => addBlock('image')} />
          <SidebarItem icon={<PenTool size={20} />} label="Sign" onClick={() => addBlock('signature')} />
          <SidebarItem icon={<ShieldCheck size={20} />} label="Stamp" onClick={() => addBlock('stamp')} />
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
            <div className="bg-slate-100 p-2 rounded-xl text-slate-400">
              <FileText size={20} />
            </div>
            <input 
              type="text" 
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="text-xl font-black text-slate-900 bg-transparent border-none outline-none focus:ring-0 w-64"
              placeholder="Untitled Document"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all">
              <Save size={18} /> Save
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all">
              <Share2 size={18} /> Share
            </button>
            <button 
              onClick={exportPDF}
              disabled={isExporting}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : <><Download size={18} /> Export PDF</>}
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <main className="flex-1 overflow-y-auto p-12 flex flex-col items-center gap-12 bg-slate-100 scroll-smooth custom-scrollbar">
          <div ref={canvasRef} className="flex flex-col items-center gap-12">
            {pages.map((page, index) => (
              <div 
                key={page.id}
                onClick={() => setActivePageId(page.id)}
                className={`a4-page relative bg-white shadow-2xl border transition-all duration-300 ${activePageId === page.id ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200'}`}
                style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}
              >
                {/* Page Number Badge */}
                <div className="absolute -left-16 top-0 bg-white border border-slate-200 px-4 py-2 rounded-xl font-black text-slate-400 shadow-sm">
                  {index + 1}
                </div>

                {/* Blocks Rendering */}
                <div className="flex flex-col gap-8 h-full">
                  {page.blocks.map(block => (
                    <BlockRenderer 
                      key={block.id} 
                      block={block} 
                      onUpdate={(content) => updateBlock(page.id, block.id, content)}
                      onRemove={() => removeBlock(page.id, block.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Add Page Button */}
          <button 
            onClick={addPage}
            className="group flex flex-col items-center gap-4 py-8"
          >
            <div className="w-12 h-12 bg-white border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 group-hover:border-blue-500 group-hover:text-blue-500 transition-all">
              <Plus size={24} />
            </div>
            <span className="text-sm font-black text-slate-400 group-hover:text-blue-500 uppercase tracking-widest">Add New Page</span>
          </button>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="group relative flex items-center justify-center w-12 h-12 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all"
    >
      {icon}
      <span className="absolute left-full ml-4 px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
        {label}
      </span>
    </button>
  );
}

function BlockRenderer({ block, onUpdate, onRemove }: { block: Block, onUpdate: (content: any) => void, onRemove: () => void, key?: any }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group/block"
    >
      {/* Block Controls */}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute -right-12 top-0 flex flex-col gap-2"
          >
            <button onClick={onRemove} className="p-2 bg-white border border-slate-200 text-red-500 rounded-lg shadow-sm hover:bg-red-50 transition-all">
              <Trash2 size={14} />
            </button>
            <button className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg shadow-sm cursor-grab active:cursor-grabbing">
              <GripVertical size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Rendering */}
      <div style={block.style}>
        {block.type === 'header' && (
          <div className="border-b-2 border-slate-900 pb-4 mb-8">
            <input 
              type="text" 
              value={block.content.title}
              onChange={(e) => onUpdate({ ...block.content, title: e.target.value })}
              className="text-2xl font-black text-slate-900 bg-transparent border-none outline-none focus:ring-0 w-full"
            />
            <input 
              type="text" 
              value={block.content.subtitle}
              onChange={(e) => onUpdate({ ...block.content, subtitle: e.target.value })}
              className="text-sm font-bold text-slate-400 bg-transparent border-none outline-none focus:ring-0 w-full uppercase tracking-widest"
            />
          </div>
        )}

        {block.type === 'text' && (
          <textarea 
            value={block.content}
            onChange={(e) => onUpdate(e.target.value)}
            className="w-full bg-transparent border-none outline-none focus:ring-0 text-slate-700 leading-relaxed min-h-[50px] resize-none overflow-hidden"
            style={{ height: 'auto', ...block.style }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
            placeholder="Start typing..."
          />
        )}

      {block.type === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                {block.content.rows[0].map((cell: string, i: number) => (
                  <th key={i} className="p-3 text-left">
                    <input 
                      type="text" 
                      value={cell}
                      onChange={(e) => {
                        const newRows = [...block.content.rows];
                        newRows[0][i] = e.target.value;
                        onUpdate({ ...block.content, rows: newRows });
                      }}
                      className="w-full bg-transparent border-none outline-none focus:ring-0 font-black text-[10px] uppercase tracking-widest text-slate-500"
                    />
                  </th>
                ))}
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {block.content.rows.slice(1).map((row: string[], rowIndex: number) => (
                <tr key={rowIndex} className="border-b border-slate-100">
                  {row.map((cell: string, colIndex: number) => (
                    <td key={colIndex} className="p-3">
                      <input 
                        type="text" 
                        value={cell}
                        onChange={(e) => {
                          const newRows = [...block.content.rows];
                          newRows[rowIndex + 1][colIndex] = e.target.value;
                          onUpdate({ ...block.content, rows: newRows });
                        }}
                        className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-medium text-slate-600"
                      />
                    </td>
                  ))}
                  <td className="p-3">
                    <button 
                      onClick={() => {
                        const newRows = block.content.rows.filter((_: any, i: number) => i !== rowIndex + 1);
                        onUpdate({ ...block.content, rows: newRows });
                      }}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <MinusCircle size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button 
            onClick={() => {
              const newRow = Array(block.content.rows[0].length).fill('');
              onUpdate({ ...block.content, rows: [...block.content.rows, newRow] });
            }}
            className="mt-4 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
          >
            <PlusCircle size={14} /> Add Row
          </button>
        </div>
      )}

      {block.type === 'image' && (
        <div className="relative group/img">
          <img src={block.content} alt="Document element" className="w-full rounded-xl" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center gap-4">
            <button className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-xs">Change Image</button>
          </div>
        </div>
      )}

      {block.type === 'signature' && (
        <div className="mt-12 pt-8 border-t border-slate-200 w-64">
          <div className="h-16 flex items-end justify-center mb-2">
            <p className="font-serif italic text-2xl text-slate-400">Signature</p>
          </div>
          <input 
            type="text" 
            value={block.content.name}
            onChange={(e) => onUpdate({ ...block.content, name: e.target.value })}
            className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-black text-slate-900 text-center uppercase tracking-widest"
          />
          <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest mt-1">
            {block.content.date}
          </p>
        </div>
      )}

      {block.type === 'stamp' && (
        <div className="w-32 h-32 border-4 border-blue-600/30 rounded-full flex items-center justify-center p-4 rotate-[-15deg] opacity-60">
          <p className="text-center text-[10px] font-black text-blue-600 uppercase tracking-widest leading-tight">
            {block.content.text}
          </p>
        </div>
      )}

      {block.type === 'footer' && (
        <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>{block.content.text}</span>
          <span>Page {block.content.pageNumber}</span>
        </div>
      )}
      </div>
    </div>
  );
}
