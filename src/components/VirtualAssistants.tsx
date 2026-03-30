import React, { useState } from 'react';
import { Search, Plus, Clock, CheckCircle2, MapPin, Star, ChevronRight, X, Send, Bot, Briefcase, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ServiceRequest {
  id: string; title: string; category: string; description: string;
  location: string; budget: string; urgency: 'normal' | 'urgent' | 'asap';
  status: 'pending' | 'matched' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string; assignedTo?: string;
}

const CATS = [
  { id: 'legal-errands', label: '⚖️ Law Firm Errands', desc: 'Court filings, document delivery, land search', services: ['Court filing submissions', 'Document delivery & collection', 'Land search at registry', 'Company registration (BRS)', 'KRA PIN applications', 'Title deed verification'] },
  { id: 'physical-errands', label: '🏃 Physical Errands', desc: 'Deliveries, pickups, personal tasks', services: ['Document delivery', 'Package pickup & drop-off', 'Bank deposits & transactions', 'Government office tasks', 'Passport collection'] },
  { id: 'office-support', label: '🏢 Office Support', desc: 'Reception, filing, data entry', services: ['Document scanning & filing', 'Data entry & typing', 'Reception & front desk', 'Mail sorting & dispatch'] },
  { id: 'research', label: '🔍 Research & Investigation', desc: 'Due diligence, background checks', services: ['Company due diligence', 'Background verification', 'Asset tracing', 'Property verification'] },
  { id: 'process-serving', label: '📬 Process Serving', desc: 'Legal document service', services: ['Summons delivery', 'Demand letters', 'Statutory notices', 'Court orders service'] },
  { id: 'translation', label: '🌍 Translation', desc: 'Swahili, English, local languages', services: ['Legal document translation', 'Court interpretation', 'Sworn translations'] },
];

interface Props { initialView?: 'browse' | 'requests' | 'active' | 'history'; onUpgrade?: () => void; }

export default function VirtualAssistants({ initialView = 'browse', onUpgrade }: Props) {
  const [tab, setTab] = useState(initialView);
  const [selCat, setSelCat] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reqs, setReqs] = useState<ServiceRequest[]>(() => { try { return JSON.parse(localStorage.getItem('va_requests') || '[]'); } catch { return []; } });
  const [q, setQ] = useState('');
  const [fTitle, setFTitle] = useState(''); const [fCat, setFCat] = useState(''); const [fDesc, setFDesc] = useState('');
  const [fLoc, setFLoc] = useState(''); const [fBud, setFBud] = useState(''); const [fUrg, setFUrg] = useState<'normal'|'urgent'|'asap'>('normal');

  const save = (r: ServiceRequest[]) => { setReqs(r); localStorage.setItem('va_requests', JSON.stringify(r)); };
  const submit = () => {
    if (!fTitle.trim() || !fCat) return;
    save([{ id: `r-${Date.now()}`, title: fTitle, category: fCat, description: fDesc, location: fLoc || 'Nairobi', budget: fBud || 'TBD', urgency: fUrg, status: 'pending', createdAt: new Date().toISOString() }, ...reqs]);
    setShowForm(false); setFTitle(''); setFCat(''); setFDesc(''); setFLoc(''); setFBud(''); setFUrg('normal'); setTab('requests');
  };

  const pend = reqs.filter(r => r.status === 'pending' || r.status === 'matched');
  const active = reqs.filter(r => r.status === 'in-progress');
  const done = reqs.filter(r => r.status === 'completed' || r.status === 'cancelled');
  const uc: Record<string,string> = { normal:'bg-[#30363d] text-[#8b949e]', urgent:'bg-orange-500/15 text-orange-400', asap:'bg-red-500/15 text-red-400' };
  const sc: Record<string,string> = { pending:'bg-yellow-500/15 text-yellow-400', matched:'bg-blue-500/15 text-blue-400', 'in-progress':'bg-violet-500/15 text-violet-400', completed:'bg-emerald-500/15 text-emerald-400', cancelled:'bg-[#30363d] text-[#8b949e]' };
  const fCats = CATS.filter(c => c.label.toLowerCase().includes(q.toLowerCase()) || c.services.some(s => s.toLowerCase().includes(q.toLowerCase())));

  const renderList = (list: ServiceRequest[]) => list.length === 0 ? (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-12 text-center">
      <Briefcase size={40} className="text-[#30363d] mx-auto mb-3" />
      <p className="text-white font-bold mb-1">No requests here</p>
      <p className="text-sm text-[#8b949e]">Browse services and submit a request to get started</p>
    </div>
  ) : list.map(r => (
    <div key={r.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#58a6ff] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div><h3 className="font-bold text-white text-sm">{r.title}</h3><p className="text-xs text-[#8b949e]">{CATS.find(c=>c.id===r.category)?.label}</p></div>
        <div className="flex gap-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${uc[r.urgency]}`}>{r.urgency.toUpperCase()}</span><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${sc[r.status]}`}>{r.status}</span></div>
      </div>
      {r.description && <p className="text-xs text-[#8b949e] mb-2">{r.description}</p>}
      <div className="flex gap-4 text-xs text-[#8b949e]"><span className="flex items-center gap-1"><MapPin size={11}/>{r.location}</span><span className="flex items-center gap-1"><Clock size={11}/>{new Date(r.createdAt).toLocaleDateString('en-KE')}</span><span>Budget: {r.budget}</span></div>
      {r.status === 'pending' && <div className="mt-3 pt-3 border-t border-[#30363d]"><button onClick={()=>save(reqs.map(x=>x.id===r.id?{...x,status:'cancelled' as const}:x))} className="text-xs font-bold text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg">Cancel</button></div>}
    </div>
  ));

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg"><Bot size={26} className="text-white"/></div>
          <div><h1 className="text-2xl font-black text-white">Virtual Assistants</h1><p className="text-sm text-[#8b949e]">Request physical errands, legal services & office support</p></div>
        </div>
        <button onClick={()=>setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-sm font-bold transition-colors"><Plus size={16}/>New Request</button>
      </div>

      <div className="flex gap-1 bg-[#161b22] p-1 rounded-xl border border-[#30363d] mb-6 w-fit">
        {([['browse','🔍 Browse'],['requests',`📋 Pending (${pend.length})`],['active',`⚡ Active (${active.length})`],['history','✅ History']] as const).map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab===id?'bg-[#1f6feb] text-white':'text-[#8b949e] hover:text-white'}`}>{l}</button>
        ))}
      </div>

      {tab==='browse' && <div className="space-y-4">
        <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 gap-2">
          <Search size={16} className="text-[#8b949e]"/><input type="text" placeholder="Search services..." value={q} onChange={e=>setQ(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-[#8b949e]"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fCats.map(cat=>(
            <div key={cat.id} className={`bg-[#161b22] border rounded-2xl overflow-hidden cursor-pointer transition-all ${selCat===cat.id?'border-[#1f6feb] ring-1 ring-[#1f6feb]/20':'border-[#30363d] hover:border-[#58a6ff]'}`} onClick={()=>setSelCat(selCat===cat.id?null:cat.id)}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-white">{cat.label}</h3><ChevronRight size={16} className={`text-[#8b949e] transition-transform ${selCat===cat.id?'rotate-90':''}`}/></div>
                <p className="text-xs text-[#8b949e] mb-3">{cat.desc}</p>
                <div className="flex flex-wrap gap-1.5">{cat.services.slice(0,3).map((s,i)=><span key={i} className="text-[10px] px-2 py-0.5 bg-[#21262d] border border-[#30363d] rounded-full text-[#8b949e]">{s}</span>)}{cat.services.length>3&&<span className="text-[10px] px-2 py-0.5 text-[#58a6ff]">+{cat.services.length-3}</span>}</div>
              </div>
              <AnimatePresence>{selCat===cat.id&&<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="border-t border-[#30363d] bg-[#0d1117]">
                <div className="p-4 space-y-2">{cat.services.map((s,i)=><button key={i} onClick={e=>{e.stopPropagation();setFCat(cat.id);setFTitle(s);setShowForm(true);}} className="w-full flex items-center justify-between px-3 py-2.5 bg-[#161b22] border border-[#30363d] rounded-xl hover:border-[#1f6feb] transition-colors text-left"><span className="text-sm text-[#e6edf3]">{s}</span><span className="text-xs text-[#1f6feb] font-bold">Request →</span></button>)}</div>
              </motion.div>}</AnimatePresence>
            </div>
          ))}
        </div>
      </div>}

      {tab==='requests'&&<div className="space-y-3">{renderList(pend)}</div>}
      {tab==='active'&&<div className="space-y-3">{renderList(active)}</div>}
      {tab==='history'&&<div className="space-y-3">{renderList(done)}</div>}

      <AnimatePresence>{showForm&&<div className="fixed inset-0 bg-[#0d1117]/95 z-[700] flex items-center justify-center p-4">
        <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-[#30363d]"><h2 className="text-lg font-bold text-white">New Service Request</h2><button onClick={()=>setShowForm(false)} className="p-1 text-[#8b949e] hover:text-white"><X size={18}/></button></div>
          <div className="p-5 space-y-4">
            <div><label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest block mb-1.5">Title *</label><input value={fTitle} onChange={e=>setFTitle(e.target.value)} placeholder="e.g. Court filing at Milimani" className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#58a6ff]"/></div>
            <div><label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest block mb-1.5">Category *</label><div className="grid grid-cols-2 gap-2">{CATS.map(c=><button key={c.id} onClick={()=>setFCat(c.id)} className={`p-2 rounded-xl border text-left text-xs font-bold ${fCat===c.id?'border-[#1f6feb] bg-[#1f6feb]/10 text-white':'border-[#30363d] text-[#8b949e] hover:border-[#58a6ff]'}`}>{c.label}</button>)}</div></div>
            <div><label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest block mb-1.5">Description</label><textarea value={fDesc} onChange={e=>setFDesc(e.target.value)} rows={3} placeholder="Describe what you need..." className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#58a6ff] resize-none"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest block mb-1.5">Location</label><input value={fLoc} onChange={e=>setFLoc(e.target.value)} placeholder="Nairobi CBD" className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#58a6ff]"/></div>
              <div><label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest block mb-1.5">Budget (KES)</label><input value={fBud} onChange={e=>setFBud(e.target.value)} placeholder="500 - 1,000" className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#58a6ff]"/></div>
            </div>
            <div><label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest block mb-1.5">Urgency</label><div className="grid grid-cols-3 gap-2">{([['normal','Normal','2-3 days'],['urgent','Urgent','Same day'],['asap','ASAP','Within hours']] as const).map(([id,l,d])=><button key={id} onClick={()=>setFUrg(id)} className={`p-2.5 rounded-xl border text-center ${fUrg===id?'border-[#1f6feb] bg-[#1f6feb]/10':'border-[#30363d] hover:border-[#58a6ff]'}`}><p className="text-xs font-bold text-white">{l}</p><p className="text-[10px] text-[#8b949e]">{d}</p></button>)}</div></div>
            <button onClick={submit} disabled={!fTitle.trim()||!fCat} className="w-full py-3 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"><Send size={16}/>Submit Request</button>
          </div>
        </motion.div>
      </div>}</AnimatePresence>
    </div>
  );
}
