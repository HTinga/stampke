
import React from 'react';
import { FileText, Download, Eye, FileSpreadsheet, FileCheck, FileClock } from 'lucide-react';

interface DocTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  fileUrl: string;
}

const DOCUMENT_TEMPLATES: DocTemplate[] = [
  {
    id: 'inv-01',
    name: 'Standard Commercial Invoice',
    description: 'Professional invoice template for business transactions.',
    icon: FileText,
    category: 'Financial',
    fileUrl: '#'
  },
  {
    id: 'quo-01',
    name: 'Service Quotation',
    description: 'Detailed quotation template for service providers.',
    icon: FileSpreadsheet,
    category: 'Sales',
    fileUrl: '#'
  },
  {
    id: 'rec-01',
    name: 'Official Cash Receipt',
    description: 'Standard receipt for cash and digital payments.',
    icon: FileCheck,
    category: 'Financial',
    fileUrl: '#'
  },
  {
    id: 'del-01',
    name: 'Delivery Note',
    description: 'Logistics template for goods delivery and tracking.',
    icon: FileClock,
    category: 'Logistics',
    fileUrl: '#'
  },
  {
    id: 'pur-01',
    name: 'Purchase Order',
    description: 'Formal document for ordering goods from suppliers.',
    icon: FileText,
    category: 'Procurement',
    fileUrl: '#'
  },
  {
    id: 'con-01',
    name: 'Employment Contract',
    description: 'Standard legal template for hiring staff.',
    icon: FileCheck,
    category: 'Legal',
    fileUrl: '#'
  }
];

const DocumentTemplates: React.FC = () => {
  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-[#041628] dark:text-white">Professional Document Templates</h2>
          <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">{DOCUMENT_TEMPLATES.length} Available</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DOCUMENT_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="flex flex-col p-6 bg-white dark:bg-[#041628] border border-[#eaf2fc] dark:border-[#0e3a72] rounded-[32px] hover:border-blue-500 hover:shadow-2xl transition-all group relative overflow-hidden"
            >
              <div className="w-full aspect-video bg-[#f0f6ff] dark:bg-[#062040]/50 rounded-2xl mb-4 flex items-center justify-center border border-[#eaf2fc] dark:border-[#0e3a72] overflow-hidden relative">
                 <tpl.icon size={48} className="text-[#7ab3e8] dark:text-[#224260] group-hover:text-blue-500 transition-colors" />
                 <div className="absolute top-4 right-4 bg-[#c5d8ef] dark:bg-[#0a2d5a] text-[#224260] dark:text-[#7ab3e8] text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                   {tpl.category}
                 </div>
              </div>
              <h3 className="font-black text-[#041628] dark:text-white group-hover:text-blue-600 truncate w-full text-lg tracking-tight">{tpl.name}</h3>
              <p className="text-xs text-[#365874] dark:text-[#4d7291] font-medium mt-2 line-clamp-2">{tpl.description}</p>
              
              <div className="mt-6 flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                  <Download size={14} /> Download
                </button>
                <button className="p-2.5 bg-[#eaf2fc] dark:bg-[#062040] text-[#224260] dark:text-[#4d7291] rounded-xl hover:bg-[#c5d8ef] dark:hover:bg-[#0a2d5a] transition-all">
                  <Eye size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-blue-600 rounded-[40px] p-12 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-3xl font-black tracking-tighter mb-4">Need a Custom Document?</h3>
          <p className="text-blue-100 font-medium mb-8">Our AI can generate any legal or business document tailored to your specific needs in seconds.</p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl">
            Open AI Architect
          </button>
        </div>
        <FileText size={200} className="absolute -right-10 -bottom-10 text-blue-500 opacity-20 rotate-12" />
      </div>
    </div>
  );
};

export default DocumentTemplates;
