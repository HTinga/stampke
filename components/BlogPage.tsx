
import React, { useState } from 'react';
import { BLOG_POSTS, BUSINESS_TEMPLATES } from '../constants';
import { BlogPost } from '../types';
import { Calendar, MapPin, Download, ArrowRight, FileText, ChevronLeft, Share2, BookOpen, Layers } from 'lucide-react';

const BlogPage: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  if (selectedPost) {
    return (
      <div className="bg-white min-h-screen animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto px-4 py-12 lg:py-24">
          <button 
            onClick={() => setSelectedPost(null)}
            className="mb-12 flex items-center gap-3 text-slate-500 font-black uppercase text-xs tracking-widest hover:text-blue-600 transition-colors"
          >
            <ChevronLeft size={16} /> Return to Resources
          </button>
          
          <img 
            src={selectedPost.image} 
            alt={selectedPost.title} 
            className="w-full h-[350px] lg:h-[550px] object-cover rounded-[64px] mb-16 shadow-2xl border-4 border-white" 
          />
          
          <div className="space-y-8">
            <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full"><Calendar size={14} /> {selectedPost.date}</span>
              <span className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full"><MapPin size={14} /> {selectedPost.location}, Kenya</span>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-black text-slate-900 leading-[0.95] tracking-tighter">
              {selectedPost.title}
            </h1>
            
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-xl text-slate-600 font-medium leading-[1.7] space-y-10 first-letter:text-8xl first-letter:font-black first-letter:text-blue-600 first-letter:mr-4 first-letter:float-left first-letter:mt-2">
                {selectedPost.content}
              </div>
              
              {/* Contextual CTA inside the blog */}
              <div className="mt-20 p-12 bg-slate-900 rounded-[64px] text-white flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
                 <div className="flex-1 space-y-6 relative z-10">
                    <h3 className="text-3xl font-black tracking-tight leading-tight">Authentic {selectedPost.location} Stamps?</h3>
                    <p className="text-slate-400 font-medium leading-relaxed">
                       Our administrative engine is optimized for high-court and school board standards. Join 10,000+ businesses using our digital assets.
                    </p>
                    <button className="bg-blue-600 text-white px-10 py-5 rounded-[28px] font-black hover:bg-blue-500 transition-all shadow-2xl shadow-blue-900/40 active:scale-95">
                       Create Stamp for {selectedPost.location}
                    </button>
                 </div>
                 <div className="w-64 h-64 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/10">
                    <BookOpen size={80} className="text-blue-500 opacity-20" />
                 </div>
                 <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20 animate-in fade-in duration-500">
      <section className="bg-slate-50 py-24 lg:py-32 px-4 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-blue-200">
             Official KE Administrative Registry
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.9]">Insights on <br/><span className="text-blue-600">Administrative Trust.</span></h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Legal guides, high-court standards, and business stamp templates for the Silicon Savannah.
          </p>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-[0.05]"></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-12 gap-16 mt-16 lg:-mt-16 relative z-20">
        {/* Blog Feed */}
        <div className="lg:col-span-8 space-y-16">
          {BLOG_POSTS.map(post => (
            <article 
              key={post.id} 
              className="group cursor-pointer bg-white rounded-[64px] p-6 lg:p-10 border border-slate-100 hover:border-blue-500 shadow-2xl shadow-slate-200/40 transition-all flex flex-col md:flex-row gap-8 lg:gap-14"
              onClick={() => setSelectedPost(post)}
            >
              <div className="w-full md:w-80 h-72 md:h-auto rounded-[48px] overflow-hidden bg-slate-100 shrink-0">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-5">
                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">{post.category}</span>
                  <span className="bg-slate-50 px-4 py-1.5 rounded-full">{post.date}</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors tracking-tight">{post.title}</h2>
                <p className="text-lg text-slate-500 leading-relaxed font-medium line-clamp-3">{post.excerpt}</p>
                <div className="pt-4">
                  <span className="inline-flex items-center gap-3 text-slate-900 font-black uppercase text-[10px] tracking-[0.3em] group-hover:gap-6 transition-all">
                    Read Analysis <ArrowRight size={18} className="text-blue-600" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-12 h-fit lg:sticky lg:top-32">
          {/* Templates Box */}
          <div className="bg-slate-900 rounded-[64px] p-10 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="bg-white/10 w-16 h-16 rounded-[24px] flex items-center justify-center mb-10"><FileText size={32} /></div>
            <h3 className="text-3xl font-black mb-6 tracking-tight">Legal Assets</h3>
            <p className="text-slate-400 text-sm mb-12 font-medium leading-relaxed">Download official letterheads and invoice formats standardized for Kenyan trade.</p>
            <div className="space-y-6 relative z-10">
              {BUSINESS_TEMPLATES.map(tpl => (
                <div key={tpl.id} className="p-6 bg-white/5 rounded-[32px] border border-white/10 hover:bg-white/15 transition-all flex items-center justify-between group">
                  <div>
                    <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest block mb-1">{tpl.type}</span>
                    <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{tpl.name}</h4>
                  </div>
                  <Download size={22} className="text-slate-600 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
            <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
          </div>

          {/* Ad/Promo */}
          <div className="bg-blue-600 rounded-[64px] p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
             <div className="relative z-10">
               <h3 className="text-3xl font-black mb-5 tracking-tight leading-none">Bulk Stamping <br/>Engine</h3>
               <p className="text-blue-100 text-sm mb-10 font-medium leading-relaxed">
                 Are you a Cyber Cafe owner? Scale your administrative services. Automate 1000s of report cards instantly.
               </p>
               <button className="w-full bg-white text-blue-600 py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-50 transition-all shadow-xl active:scale-95">
                  Access Bulk Tool <Layers size={18} />
               </button>
             </div>
             <div className="absolute top-0 right-0 w-48 h-48 bg-white/15 rounded-full blur-3xl translate-x-10 translate-y-[-10px]"></div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BlogPage;
