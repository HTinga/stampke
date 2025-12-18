
import React from 'react';
import { Shield, Lock, FileText, Mail, Phone, Globe, Scale, Book, ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  t: any;
  onBack: () => void;
}

const LegalPage: React.FC<LegalPageProps> = ({ t, onBack }) => {
  const { legalPage } = t;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto px-4 py-16 lg:py-24">
        {/* Header */}
        <div className="mb-20 text-center lg:text-left">
          <button 
            onClick={onBack}
            className="mb-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 hover:gap-4 transition-all"
          >
            <ArrowLeft size={16} /> Return to Home
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-blue-100 dark:border-blue-800">
             Compliance & Safety Registry
          </div>
          <h1 className="text-5xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[0.9]">
            {legalPage.title}
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
            {legalPage.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-16">
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600">
                <Scale size={24} />
                <h2 className="text-2xl font-black tracking-tight dark:text-white">{legalPage.sections.legal.title}</h2>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {legalPage.sections.legal.content}
              </p>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 text-emerald-600">
                <Lock size={24} />
                <h2 className="text-2xl font-black tracking-tight dark:text-white">{legalPage.sections.privacy.title}</h2>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {legalPage.sections.privacy.content}
              </p>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 text-amber-600">
                <Book size={24} />
                <h2 className="text-2xl font-black tracking-tight dark:text-white">{legalPage.sections.terms.title}</h2>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {legalPage.sections.terms.content}
              </p>
            </section>
          </div>

          {/* Contact Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 dark:bg-slate-900/50 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="text-2xl font-black mb-8 tracking-tight">{legalPage.contactTitle}</h3>
                 <div className="space-y-6">
                    <a href={`mailto:${legalPage.email}`} className="flex items-center gap-4 group">
                      <div className="p-3 bg-white/10 rounded-2xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><Mail size={20} /></div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Email Support</p>
                        <p className="font-bold text-sm truncate">{legalPage.email}</p>
                      </div>
                    </a>
                    <a href={`tel:${legalPage.phone.replace(/\s/g, '')}`} className="flex items-center gap-4 group">
                      <div className="p-3 bg-white/10 rounded-2xl text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all"><Phone size={20} /></div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Phone / WhatsApp</p>
                        <p className="font-bold text-sm">{legalPage.phone}</p>
                      </div>
                    </a>
                    <div className="flex items-center gap-4 group">
                      <div className="p-3 bg-white/10 rounded-2xl text-amber-400"><Globe size={20} /></div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Jurisdiction</p>
                        <p className="font-bold text-sm">Nairobi, Kenya</p>
                      </div>
                    </div>
                 </div>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>
            </div>

            <div className="p-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[48px] text-center">
               <Shield className="mx-auto text-blue-600 mb-4" size={32} />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Stamp Verification Service</p>
               <button className="mt-6 w-full py-4 bg-slate-50 dark:bg-slate-800 dark:text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                 Validate Digital Seal
               </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
