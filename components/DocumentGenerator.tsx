
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Receipt, 
  Mail, 
  Download, 
  Plus, 
  Trash2, 
  Eye, 
  History, 
  TrendingUp, 
  CheckCircle2, 
  ChevronRight,
  Settings,
  Briefcase,
  User,
  Globe,
  Phone,
  Hash,
  Calendar,
  DollarSign,
  Copy,
  Layout,
  FileCode,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

type DocType = 'invoice' | 'letterhead' | 'contract' | 'accounting' | 'minutes' | 'none';

interface GeneratedDoc {
  id: string;
  type: DocType;
  title: string;
  recipient: string;
  date: string;
  amount?: string;
  status: 'Draft' | 'Sent' | 'Paid';
}

export default function DocumentGenerator() {
  const [activeType, setActiveType] = useState<DocType>('none');
  const [history, setHistory] = useState<GeneratedDoc[]>([]);
  const [formData, setFormData] = useState({
    invoiceNumber: 'INV-001',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    clientName: '',
    clientAddress: '',
    items: [{ desc: '', qty: 1, price: 0 }],
    notes: '',
    letterSubject: '',
    letterContent: '',
    senderName: 'Kenya Business Solutions',
    senderAddress: 'Nairobi, Kenya',
    senderPhone: '+254 700 000 000',
    senderEmail: 'info@business.ke',
    contractTitle: 'Service Agreement',
    contractTerms: '1. Scope of Work...\n2. Payment Terms...\n3. Termination...',
    minutesMeetingTitle: 'Weekly Strategy Sync',
    minutesAttendees: 'John, Jane, Bob',
    minutesActionItems: '1. Fix PDF Editor\n2. Update Booking System',
    accountingPeriod: 'February 2026',
    accountingEntries: [{ date: new Date().toISOString().split('T')[0], desc: 'Office Supplies', category: 'Expense', amount: 5000 }]
  });

  useEffect(() => {
    const saved = localStorage.getItem('doc_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (doc: GeneratedDoc) => {
    const newHistory = [doc, ...history];
    setHistory(newHistory);
    localStorage.setItem('doc_history', JSON.stringify(newHistory));
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { desc: '', qty: 1, price: 0 }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
  };

  const generateInvoicePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59);
    doc.text('INVOICE', 150, 25);
    
    doc.setFontSize(12);
    doc.text(formData.senderName, 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(formData.senderAddress, 20, 32);
    doc.text(formData.senderPhone, 20, 37);
    doc.text(formData.senderEmail, 20, 42);
    
    // Client Info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text('BILL TO:', 20, 60);
    doc.setFontSize(10);
    doc.text(formData.clientName, 20, 67);
    doc.setTextColor(100, 116, 139);
    doc.text(formData.clientAddress, 20, 72);
    
    // Invoice Details
    doc.setTextColor(30, 41, 59);
    doc.text(`Invoice #: ${formData.invoiceNumber}`, 150, 60);
    doc.text(`Date: ${formData.date}`, 150, 65);
    doc.text(`Due Date: ${formData.dueDate}`, 150, 70);
    
    // Table Header
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 85, 170, 10, 'F');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Description', 25, 92);
    doc.text('Qty', 120, 92);
    doc.text('Price', 145, 92);
    doc.text('Total', 175, 92);
    
    // Items
    let y = 105;
    formData.items.forEach(item => {
      doc.text(item.desc, 25, y);
      doc.text(item.qty.toString(), 120, y);
      doc.text(item.price.toFixed(2), 145, y);
      doc.text((item.qty * item.price).toFixed(2), 175, y);
      y += 10;
    });
    
    // Total
    doc.setDrawColor(226, 232, 240);
    doc.line(120, y, 190, y);
    y += 10;
    doc.setFontSize(14);
    doc.text('Total:', 145, y);
    doc.text(`KES ${calculateTotal().toFixed(2)}`, 175, y);
    
    doc.save(`${formData.invoiceNumber}.pdf`);
    
    saveToHistory({
      id: Math.random().toString(36).substr(2, 9),
      type: 'invoice',
      title: formData.invoiceNumber,
      recipient: formData.clientName,
      date: formData.date,
      amount: `KES ${calculateTotal().toFixed(2)}`,
      status: 'Sent'
    });
  };

  const generateAccountingPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('ACCOUNTING LOG', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Period: ${formData.accountingPeriod}`, 20, 35);
    doc.text(`Generated: ${formData.date}`, 150, 35);
    
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 45, 170, 10, 'F');
    doc.text('Date', 25, 52);
    doc.text('Description', 60, 52);
    doc.text('Category', 120, 52);
    doc.text('Amount (KES)', 160, 52);
    
    let y = 65;
    formData.accountingEntries.forEach(entry => {
      doc.text(entry.date, 25, y);
      doc.text(entry.desc, 60, y);
      doc.text(entry.category, 120, y);
      doc.text(entry.amount.toFixed(2), 160, y);
      y += 10;
    });
    
    doc.save(`accounting_${formData.accountingPeriod.replace(' ', '_')}.pdf`);
    saveToHistory({
      id: Math.random().toString(36).substr(2, 9),
      type: 'accounting',
      title: `Log: ${formData.accountingPeriod}`,
      recipient: 'Internal',
      date: formData.date,
      status: 'Sent'
    });
  };

  const generateMinutesPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('MEETING MINUTES', 20, 30);
    doc.setFontSize(14);
    doc.text(formData.minutesMeetingTitle, 20, 45);
    doc.setFontSize(10);
    doc.text(`Date: ${formData.date}`, 20, 55);
    doc.text(`Attendees: ${formData.minutesAttendees}`, 20, 62);
    
    doc.setFontSize(12);
    doc.text('Action Items:', 20, 80);
    doc.setFontSize(10);
    const splitItems = doc.splitTextToSize(formData.minutesActionItems, 170);
    doc.text(splitItems, 20, 90);
    
    doc.save(`minutes_${formData.date}.pdf`);
    saveToHistory({
      id: Math.random().toString(36).substr(2, 9),
      type: 'minutes',
      title: formData.minutesMeetingTitle,
      recipient: 'Internal',
      date: formData.date,
      status: 'Sent'
    });
  };

  const generateContractPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(formData.contractTitle, 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text('BETWEEN:', 20, 50);
    doc.text(formData.senderName, 20, 60);
    doc.text('AND:', 20, 75);
    doc.text(formData.clientName, 20, 85);
    
    doc.setFontSize(10);
    const splitTerms = doc.splitTextToSize(formData.contractTerms, 170);
    doc.text(splitTerms, 20, 105);
    
    doc.save(`contract_${formData.clientName.replace(' ', '_')}.pdf`);
    saveToHistory({
      id: Math.random().toString(36).substr(2, 9),
      type: 'contract',
      title: formData.contractTitle,
      recipient: formData.clientName,
      date: formData.date,
      status: 'Sent'
    });
  };

  const generateLetterheadPDF = () => {
    const doc = new jsPDF();
    
    // Letterhead Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 15, 'F');
    
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(formData.senderName, 20, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(formData.senderAddress, 20, 42);
    doc.text(`${formData.senderPhone} | ${formData.senderEmail}`, 20, 47);
    
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(20, 55, 190, 55);
    
    // Date
    doc.setTextColor(30, 41, 59);
    doc.text(formData.date, 160, 65);
    
    // Recipient
    doc.setFontSize(12);
    doc.text('To:', 20, 80);
    doc.text(formData.clientName, 20, 87);
    
    // Subject
    doc.setFontSize(14);
    doc.text(formData.letterSubject, 20, 105);
    
    // Content
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    const splitText = doc.splitTextToSize(formData.letterContent, 170);
    doc.text(splitText, 20, 120);
    
    // Footer
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.text('This is a digitally generated document.', 105, 285, { align: 'center' });
    
    doc.save(`letter_${formData.clientName.replace(' ', '_')}.pdf`);
    
    saveToHistory({
      id: Math.random().toString(36).substr(2, 9),
      type: 'letterhead',
      title: formData.letterSubject || 'Formal Letter',
      recipient: formData.clientName,
      date: formData.date,
      status: 'Sent'
    });
  };

  const templates = [
    { id: 'invoice', name: 'Professional Invoice', icon: Receipt, color: 'bg-blue-600', desc: 'Generate high-precision invoices with tax calculations.' },
    { id: 'letterhead', name: 'Official Letterhead', icon: Mail, color: 'bg-indigo-500', desc: 'Create branded corporate letters and formal notices.' },
    { id: 'contract', name: 'Legal Contract', icon: FileText, color: 'bg-emerald-500', desc: 'Standardized agreements for services and employment.' },
    { id: 'accounting', name: 'Accounting Log', icon: TrendingUp, color: 'bg-rose-500', desc: 'Track firm expenses, revenue, and petty cash logs.' },
    { id: 'minutes', name: 'Meeting Minutes', icon: FileCode, color: 'bg-amber-500', desc: 'Document firm meetings, attendees, and action items.' },
  ];

  const getGenerateFunction = () => {
    switch(activeType) {
      case 'invoice': return generateInvoicePDF;
      case 'letterhead': return generateLetterheadPDF;
      case 'contract': return generateContractPDF;
      case 'accounting': return generateAccountingPDF;
      case 'minutes': return generateMinutesPDF;
      default: return () => {};
    }
  };

  return (
    <div className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-6"
          >
            <Zap size={14} /> Smart Document Engine
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6"
          >
            Document <span className="text-blue-600">Architect.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto font-medium"
          >
            Generate, track, and manage your firm's essential paperwork with automated precision.
          </motion.p>
        </div>

        {activeType === 'none' ? (
          <div className="space-y-20">
            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {templates.map((t, idx) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setActiveType(t.id as DocType)}
                  className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className={`${t.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                    <t.icon size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{t.name}</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">{t.desc}</p>
                  <div className="mt-8 flex items-center text-blue-600 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Create <ChevronRight size={16} className="ml-1" />
                  </div>
                  <div className={`absolute -right-12 -bottom-12 w-48 h-48 ${t.color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
                </motion.div>
              ))}
            </div>

            {/* History Section */}
            <div className="bg-white p-12 rounded-[64px] border border-slate-100 shadow-xl">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-900 text-white p-4 rounded-2xl">
                    <History size={24} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Recent Activity</h3>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Track your document usage</p>
                  </div>
                </div>
                <div className="flex gap-4">
                   <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <TrendingUp size={18} className="text-blue-600" />
                      <span className="text-sm font-black text-slate-900">{history.length} Docs Generated</span>
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
                      <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
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
                              {doc.type === 'invoice' ? <Receipt size={18} /> : <Mail size={18} />}
                            </div>
                            <span className="font-black text-slate-900">{doc.title}</span>
                          </div>
                        </td>
                        <td className="py-6 text-slate-500 font-bold text-sm">{doc.recipient}</td>
                        <td className="py-6 text-slate-500 font-bold text-sm">{doc.date}</td>
                        <td className="py-6 font-black text-slate-900">{doc.amount || '-'}</td>
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
                        <td colSpan={6} className="py-20 text-center">
                          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No documents generated yet</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Editor Interface */
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[64px] border border-slate-100 shadow-2xl overflow-hidden"
          >
            <div className="p-8 md:p-12 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setActiveType('none')}
                  className="p-4 bg-white rounded-2xl shadow-sm hover:bg-slate-100 transition-all"
                >
                  <ChevronRight size={24} className="rotate-180" />
                </button>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {templates.find(t => t.id === activeType)?.name}
                  </h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                    Configure your document details
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={getGenerateFunction()}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
                >
                  <Download size={18} /> Generate PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Form Side */}
              <div className="p-12 md:p-16 border-r border-slate-50 space-y-12 max-h-[800px] overflow-y-auto">
                <div className="space-y-8">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={14} /> Sender Information
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                      <input 
                        type="text" 
                        value={formData.senderName}
                        onChange={e => setFormData({...formData, senderName: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                      <input 
                        type="email" 
                        value={formData.senderEmail}
                        onChange={e => setFormData({...formData, senderEmail: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={14} /> Recipient Information
                  </h4>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Name</label>
                      <input 
                        type="text" 
                        value={formData.clientName}
                        onChange={e => setFormData({...formData, clientName: e.target.value})}
                        placeholder="e.g. Acme Corp"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                      <textarea 
                        value={formData.clientAddress}
                        onChange={e => setFormData({...formData, clientAddress: e.target.value})}
                        placeholder="Nairobi, Kenya"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold h-24"
                      />
                    </div>
                  </div>
                </div>

                {activeType === 'invoice' && (
                  <div className="space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      <span className="flex items-center gap-2"><Layout size={14} /> Line Items</span>
                      <button onClick={addItem} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        <Plus size={14} /> Add Item
                      </button>
                    </h4>
                    <div className="space-y-4">
                      {formData.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-4 items-end">
                          <div className="col-span-6 space-y-2">
                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Description</label>
                            <input 
                              type="text" 
                              value={item.desc}
                              onChange={e => {
                                const newItems = [...formData.items];
                                newItems[idx].desc = e.target.value;
                                setFormData({...formData, items: newItems});
                              }}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                            />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Qty</label>
                            <input 
                              type="number" 
                              value={item.qty}
                              onChange={e => {
                                const newItems = [...formData.items];
                                newItems[idx].qty = parseInt(e.target.value) || 0;
                                setFormData({...formData, items: newItems});
                              }}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                            />
                          </div>
                          <div className="col-span-3 space-y-2">
                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Price</label>
                            <input 
                              type="number" 
                              value={item.price}
                              onChange={e => {
                                const newItems = [...formData.items];
                                newItems[idx].price = parseFloat(e.target.value) || 0;
                                setFormData({...formData, items: newItems});
                              }}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                            />
                          </div>
                          <div className="col-span-1 pb-3">
                            <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeType === 'letterhead' && (
                  <div className="space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} /> Letter Content
                    </h4>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Line</label>
                        <input 
                          type="text" 
                          value={formData.letterSubject}
                          onChange={e => setFormData({...formData, letterSubject: e.target.value})}
                          placeholder="RE: Service Agreement"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Body</label>
                        <textarea 
                          value={formData.letterContent}
                          onChange={e => setFormData({...formData, letterContent: e.target.value})}
                          placeholder="Write your letter here..."
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold h-64"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeType === 'accounting' && (
                  <div className="space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      <span className="flex items-center gap-2"><Layout size={14} /> Log Entries</span>
                      <button 
                        onClick={() => setFormData({...formData, accountingEntries: [...formData.accountingEntries, { date: new Date().toISOString().split('T')[0], desc: '', category: 'Expense', amount: 0 }]})}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Entry
                      </button>
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Period</label>
                        <input 
                          type="text" 
                          value={formData.accountingPeriod}
                          onChange={e => setFormData({...formData, accountingPeriod: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                        />
                      </div>
                      {formData.accountingEntries.map((entry, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-2xl">
                          <div className="col-span-4 space-y-2">
                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Description</label>
                            <input 
                              type="text" 
                              value={entry.desc}
                              onChange={e => {
                                const newEntries = [...formData.accountingEntries];
                                newEntries[idx].desc = e.target.value;
                                setFormData({...formData, accountingEntries: newEntries});
                              }}
                              className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 outline-none font-bold text-xs"
                            />
                          </div>
                          <div className="col-span-3 space-y-2">
                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Category</label>
                            <select 
                              value={entry.category}
                              onChange={e => {
                                const newEntries = [...formData.accountingEntries];
                                newEntries[idx].category = e.target.value;
                                setFormData({...formData, accountingEntries: newEntries});
                              }}
                              className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 outline-none font-bold text-xs"
                            >
                              <option>Expense</option>
                              <option>Revenue</option>
                              <option>Petty Cash</option>
                            </select>
                          </div>
                          <div className="col-span-4 space-y-2">
                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Amount</label>
                            <input 
                              type="number" 
                              value={entry.amount}
                              onChange={e => {
                                const newEntries = [...formData.accountingEntries];
                                newEntries[idx].amount = parseFloat(e.target.value) || 0;
                                setFormData({...formData, accountingEntries: newEntries});
                              }}
                              className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 outline-none font-bold text-xs"
                            />
                          </div>
                          <div className="col-span-1 pb-1">
                            <button 
                              onClick={() => setFormData({...formData, accountingEntries: formData.accountingEntries.filter((_, i) => i !== idx)})}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeType === 'minutes' && (
                  <div className="space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FileCode size={14} /> Meeting Details
                    </h4>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meeting Title</label>
                        <input 
                          type="text" 
                          value={formData.minutesMeetingTitle}
                          onChange={e => setFormData({...formData, minutesMeetingTitle: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attendees</label>
                        <input 
                          type="text" 
                          value={formData.minutesAttendees}
                          onChange={e => setFormData({...formData, minutesAttendees: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Action Items</label>
                        <textarea 
                          value={formData.minutesActionItems}
                          onChange={e => setFormData({...formData, minutesActionItems: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold h-48"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeType === 'contract' && (
                  <div className="space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} /> Contract Terms
                    </h4>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contract Title</label>
                        <input 
                          type="text" 
                          value={formData.contractTitle}
                          onChange={e => setFormData({...formData, contractTitle: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terms & Conditions</label>
                        <textarea 
                          value={formData.contractTerms}
                          onChange={e => setFormData({...formData, contractTerms: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold h-96"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Side */}
              <div className="p-12 md:p-16 bg-slate-50 flex items-center justify-center">
                <div className="w-full max-w-[500px] aspect-[1/1.41] bg-white shadow-2xl rounded-sm p-10 flex flex-col relative overflow-hidden">
                  {/* Branded Header */}
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <h5 className="font-black text-slate-900 text-lg">{formData.senderName}</h5>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{formData.senderAddress}</p>
                    </div>
                    <div className="text-right">
                      <h5 className="font-black text-blue-600 text-xl uppercase tracking-tighter">
                        {activeType === 'invoice' ? 'Invoice' : 'Official'}
                      </h5>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{formData.date}</p>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="flex-1">
                    <div className="mb-8">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Bill To:</p>
                      <p className="text-xs font-black text-slate-900">{formData.clientName || 'Recipient Name'}</p>
                      <p className="text-[10px] text-slate-500">{formData.clientAddress || 'Recipient Address'}</p>
                    </div>

                    {activeType === 'invoice' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 border-b border-slate-100 pb-2">
                          <span className="col-span-8 text-[8px] font-black text-slate-300 uppercase tracking-widest">Description</span>
                          <span className="col-span-4 text-[8px] font-black text-slate-300 uppercase tracking-widest text-right">Total</span>
                        </div>
                        {formData.items.map((item, i) => (
                          <div key={i} className="grid grid-cols-12 text-[10px]">
                            <span className="col-span-8 font-bold text-slate-700">{item.desc || 'Item description'}</span>
                            <span className="col-span-4 font-black text-slate-900 text-right">KES {(item.qty * item.price).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="mt-8 pt-4 border-t-2 border-slate-900 flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase tracking-widest">Total Amount</span>
                           <span className="text-lg font-black text-slate-900">KES {calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    ) : activeType === 'accounting' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 border-b border-slate-100 pb-2">
                          <span className="col-span-4 text-[7px] font-black text-slate-300 uppercase tracking-widest">Date</span>
                          <span className="col-span-5 text-[7px] font-black text-slate-300 uppercase tracking-widest">Desc</span>
                          <span className="col-span-3 text-[7px] font-black text-slate-300 uppercase tracking-widest text-right">Amount</span>
                        </div>
                        {formData.accountingEntries.map((entry, i) => (
                          <div key={i} className="grid grid-cols-12 text-[9px] py-1 border-b border-slate-50">
                            <span className="col-span-4 text-slate-500">{entry.date}</span>
                            <span className="col-span-5 font-bold text-slate-700 truncate">{entry.desc}</span>
                            <span className="col-span-3 font-black text-slate-900 text-right">KES {entry.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : activeType === 'minutes' ? (
                      <div className="space-y-4">
                        <h6 className="font-black text-slate-900 text-sm">{formData.minutesMeetingTitle}</h6>
                        <p className="text-[8px] font-bold text-slate-400">Attendees: {formData.minutesAttendees}</p>
                        <div className="mt-4">
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2">Action Items</p>
                           <p className="text-[10px] text-slate-600 whitespace-pre-wrap">{formData.minutesActionItems}</p>
                        </div>
                      </div>
                    ) : activeType === 'contract' ? (
                      <div className="space-y-4">
                        <h6 className="font-black text-slate-900 text-sm text-center uppercase underline">{formData.contractTitle}</h6>
                        <p className="text-[9px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                          This agreement is made between {formData.senderName} and {formData.clientName} on {formData.date}.
                          {"\n\n"}
                          {formData.contractTerms}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <h6 className="font-black text-slate-900 text-sm">{formData.letterSubject || 'Subject Line'}</h6>
                        <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {formData.letterContent || 'Your letter content will appear here...'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-8 border-t border-slate-50 text-center">
                    <p className="text-[7px] text-slate-300 font-bold uppercase tracking-widest">Generated by FreeStamps KE Document Architect</p>
                  </div>
                  
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
