
import React, { useState } from 'react';
import { BLOG_POSTS, BUSINESS_TEMPLATES } from '../constants';
import { BlogPost } from '../types';
import { Calendar, MapPin, Download, ArrowRight, FileText, ChevronLeft, Share2 } from 'lucide-react';

const BlogPage: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  if (selectedPost) {
    return (
      <div className="bg-white min-h-screen animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <button 
            onClick={() => setSelectedPost(null)}
            className="mb-10 flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-colors"
          >
            <ChevronLeft size={20} /> Back to Resources
          </button>
          
          <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-96 object-cover rounded-[48px] mb-12 shadow-2xl" />
          
          <div className="flex items-center gap-6 text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {selectedPost.date}</span>
            <span className="flex items-center gap-1.5 text-blue-600"><MapPin size={14} /> {selectedPost.location}</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter">
            {selectedPost.title}
          </h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-xl text-slate-600 font-medium leading-relaxed mb-8">
              {selectedPost.content}
            </p>
            <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 mt-12">
               <h3 className="text-2xl font-black mb-4">Official Stamp Services in {selectedPost.location}</h3>
               <p className="font-medium text-slate-500 leading-relaxed mb-6">
                 We provide local support for businesses and legal practitioners in {selectedPost.location} looking for high-quality digital seals and rubber stamps. Our platform is optimized for the specific administrative standards of Kenyan counties.
               </p>
               <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl transition-all">Create {selectedPost.location} Seal Now</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20 animate-in fade-in duration-500">
      <section className="bg-slate-50 py-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6 leading-none">The Official <span className="text-blue-600">KE Registry.</span></h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            20+ Expert guides on Kenyan administrative stamping, business templates, and legal requirements for all 47 counties.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-12 gap-16 mt-16">
        <div className="lg:col-span-8 space-y-20">
          {BLOG_POSTS.map(post => (
            <article key={post.id} className="group cursor-pointer" onClick={() => setSelectedPost(post)}>
              <div className="aspect-[16/9] md:aspect-video w-full rounded-[40px] overflow-hidden bg-slate-100 mb-8 relative shadow-lg">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-6 left-6 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                  {post.category}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {post.date}</span>
                  {post.location && <span className="flex items-center gap-1.5 text-blue-600"><MapPin size={14} /> {post.location}</span>}
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors leading-tight">{post.title}</h2>
                <p className="text-lg text-slate-500 leading-relaxed font-medium line-clamp-2">{post.excerpt}</p>
                <button className="inline-flex items-center gap-2 text-blue-600 font-black uppercase text-xs tracking-widest group-hover:gap-4 transition-all">
                  Read Full Guide <ArrowRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="lg:col-span-4 space-y-12 h-fit lg:sticky lg:top-28">
          <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl">
            <h3 className="text-2xl font-black mb-6 tracking-tight">Digital Templates</h3>
            <p className="text-slate-400 text-sm mb-8 font-medium">Free downloadable resources for Kenyan enterprises. Perfectly sized for our digital stamps.</p>
            <div className="space-y-4">
              {BUSINESS_TEMPLATES.map(tpl => (
                <div key={tpl.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase text-blue-400 tracking-widest">{tpl.type}</span>
                    <Download size={14} className="text-slate-500 group-hover:text-white" />
                  </div>
                  <h4 className="font-bold text-white mb-1">{tpl.name}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{tpl.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-[40px] p-8 border border-blue-100 shadow-sm">
             <div className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-200">
                <FileText size={24} />
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-none">Bulk Stamping <br/>Request</h3>
             <p className="text-slate-600 text-sm mb-6 leading-relaxed font-medium">
               Need thousands of seals for reporting or bulk certificates? We offer enterprise-grade automated stamping services.
             </p>
             <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
                Talk to Sales <Share2 size={16} />
             </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BlogPage;
