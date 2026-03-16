
import React, { useState } from 'react';
import { 
  FileText, 
  Table, 
  Type, 
  Layout, 
  Save, 
  Share2, 
  Download, 
  History,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Grid,
  Plus,
  Search,
  ChevronDown,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function EditorSuite() {
  const [activeEditor, setActiveEditor] = useState<'word' | 'sheets'>('word');
  const [content, setContent] = useState('');

  const documents = [
    { id: '1', name: 'Legal_Agreement_Draft.docx', type: 'word', updated: '2h ago' },
    { id: '2', name: 'Q1_Financial_Projections.xlsx', type: 'sheets', updated: '5h ago' },
    { id: '3', name: 'Company_Bylaws_Final.docx', type: 'word', updated: '1d ago' },
  ];

  return (
    <div className="h-full flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">Editor Suite</h2>
          <p className="text-slate-500 font-medium">Professional Word and Spreadsheet editors for your firm.</p>
        </div>
        <div className="flex gap-3">
          <button className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:text-blue-600 transition-all">
            <History size={20} />
          </button>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            <Plus size={18} /> New Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Sidebar: Document List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Recent Files</h3>
              <Search size={16} className="text-slate-300" />
            </div>
            <div className="space-y-2">
              {documents.map(doc => (
                <button 
                  key={doc.id}
                  onClick={() => setActiveEditor(doc.type as any)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${doc.type === 'word' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {doc.type === 'word' ? <FileText size={20} /> : <FileSpreadsheet size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{doc.name}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400">{doc.updated}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {/* Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-1 border-r border-slate-100 dark:border-slate-800 pr-4 mr-4">
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"><Bold size={18} /></button>
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"><Italic size={18} /></button>
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"><Underline size={18} /></button>
            </div>
            <div className="flex items-center gap-1 border-r border-slate-100 dark:border-slate-800 pr-4 mr-4">
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"><AlignLeft size={18} /></button>
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"><AlignCenter size={18} /></button>
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"><AlignRight size={18} /></button>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"><List size={18} /></button>
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"><Grid size={18} /></button>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                <Share2 size={14} /> Share
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                <Save size={14} /> Save
              </button>
            </div>
          </div>

          {/* Editor Canvas */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-inner p-12 overflow-y-auto min-h-[600px]">
            {activeEditor === 'word' ? (
              <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                  <h1 className="text-4xl font-black mb-4 outline-none" contentEditable>Untitled Document</h1>
                  <div className="h-1 w-20 bg-blue-600 rounded-full" />
                </div>
                <div 
                  className="prose prose-slate dark:prose-invert max-w-none outline-none min-h-[400px]" 
                  contentEditable
                  onInput={(e) => setContent(e.currentTarget.innerHTML)}
                >
                  <p>Start typing your professional document here...</p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="w-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2"></th>
                      {['A', 'B', 'C', 'D', 'E', 'F'].map(col => (
                        <th key={col} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-[10px] font-black uppercase text-slate-400">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(row => (
                      <tr key={row}>
                        <td className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-[10px] font-black text-center text-slate-400">{row}</td>
                        {[1, 2, 3, 4, 5, 6].map(col => (
                          <td key={col} className="border border-slate-100 dark:border-slate-800 p-2 min-w-[120px] outline-none focus:bg-blue-50/50" contentEditable></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
