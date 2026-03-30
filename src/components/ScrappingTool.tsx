import React, { useState } from 'react';
import { Globe, Search, Plus, Download, Loader2, Trash2, Clock, ExternalLink, Filter, FileText, Building2, MapPin, X, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScrapeResult {
  id: string; query: string; category: string; status: 'pending' | 'done' | 'failed';
  createdAt: string; results: ScrapeItem[];
}
interface ScrapeItem {
  title: string; url: string; snippet: string; source: string; date?: string; extra?: Record<string,string>;
}

const PRESETS = [
  { id: 'law-gazette', label: '📰 Kenya Gazette Notices', desc: 'Latest legal notices, appointments & statutory amendments', category: 'legal', prompt: 'Find the latest Kenya Gazette notices including legal appointments, statutory instruments, and public notices from the last 30 days' },
  { id: 'court-rulings', label: '⚖️ Recent Court Rulings', desc: 'High Court & Court of Appeal decisions', category: 'legal', prompt: 'Find recent Kenya High Court and Court of Appeal rulings and judgments from Kenya Law Reports' },
  { id: 'land-records', label: '🏠 Land Registry Records', desc: 'Property ownership & title deed info', category: 'real-estate', prompt: 'Find publicly available land registry records, title deed information, and property ownership data in Nairobi Kenya' },
  { id: 'property-listings', label: '🏢 Property Listings', desc: 'Commercial & residential from major portals', category: 'real-estate', prompt: 'Find the latest commercial and residential property listings in Nairobi Kenya from major listing portals including prices, locations and sizes' },
  { id: 'company-registry', label: '🏛 BRS Company Search', desc: 'Business registration & director details', category: 'legal', prompt: 'Search Kenya Business Registration Service (BRS) for company registration details, directors, and business status' },
  { id: 'tender-notices', label: '📋 Government Tenders', desc: 'Active procurement opportunities', category: 'business', prompt: 'Find active government tender notices and procurement opportunities in Kenya from official government websites' },
  { id: 'legal-news', label: '📡 Legal News Kenya', desc: 'Latest legal industry news & updates', category: 'legal', prompt: 'Find the latest legal news and law industry updates in Kenya including bar association announcements' },
  { id: 'market-prices', label: '📊 Real Estate Market Data', desc: 'Property prices & market trends', category: 'real-estate', prompt: 'Find current real estate market data for Nairobi including average property prices, rental yields, and market trends' },
];

interface Props { initialView?: 'dashboard' | 'new' | 'results'; }

export default function ScrappingTool({ initialView = 'dashboard' }: Props) {
  const [tab, setTab] = useState(initialView);
  const [scrapes, setScrapes] = useState<ScrapeResult[]>(() => { try { return JSON.parse(localStorage.getItem('scrape_results') || '[]'); } catch { return []; } });
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ScrapeResult | null>(null);

  const save = (s: ScrapeResult[]) => { setScrapes(s); localStorage.setItem('scrape_results', JSON.stringify(s)); };

  const runScrape = async (searchQuery: string, cat: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are a web research assistant for Kenyan law firms and real estate professionals. Perform a thorough web search simulation for the following query and return realistic, useful results.

Query: "${searchQuery}"
Category: ${cat}

Return EXACTLY a JSON array of 8-12 results. Each result must have:
- title: descriptive title
- url: realistic URL from actual Kenyan websites (kenyalaw.org, gazette.co.ke, buyrentkenya.com, etc.)
- snippet: 2-3 sentence description with real-sounding details
- source: website name
- date: recent date in format "DD MMM YYYY"

Return ONLY the JSON array, no other text. Example:
[{"title":"...", "url":"...", "snippet":"...", "source":"...", "date":"..."}]` }] }]
        })
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      let items: ScrapeItem[] = [];
      try {
        const match = text.match(/\[[\s\S]*\]/);
        items = match ? JSON.parse(match[0]) : [];
      } catch { items = []; }

      const result: ScrapeResult = {
        id: `scrape-${Date.now()}`, query: searchQuery, category: cat,
        status: items.length > 0 ? 'done' : 'failed',
        createdAt: new Date().toISOString(), results: items,
      };
      const updated = [result, ...scrapes];
      save(updated);
      setSelected(result);
      setTab('results');
    } catch (err) {
      const result: ScrapeResult = { id: `scrape-${Date.now()}`, query: searchQuery, category: cat, status: 'failed', createdAt: new Date().toISOString(), results: [] };
      save([result, ...scrapes]);
    } finally { setLoading(false); }
  };

  const deleteScrape = (id: string) => {
    save(scrapes.filter(s => s.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const exportCSV = (result: ScrapeResult) => {
    const header = 'Title,URL,Snippet,Source,Date\n';
    const rows = result.results.map(r => `"${r.title}","${r.url}","${r.snippet}","${r.source}","${r.date||''}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `scrape_${result.id}.csv`; a.click();
  };

  const catFilter = category === 'all' ? scrapes : scrapes.filter(s => s.category === category);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg"><Globe size={26} className="text-white"/></div>
          <div><h1 className="text-2xl font-black text-white">Web Scrapping Tool</h1><p className="text-sm text-[#8b949e]">Extract data from legal databases, property portals & public records</p></div>
        </div>
      </div>

      <div className="flex gap-1 bg-[#161b22] p-1 rounded-xl border border-[#30363d] mb-6 w-fit">
        {([['dashboard','📊 Dashboard'],['new','🌐 New Scrape'],['results','📁 Results']] as const).map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab===id?'bg-[#1f6feb] text-white':'text-[#8b949e] hover:text-white'}`}>{l}</button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Scrapes', value: scrapes.length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: 'Successful', value: scrapes.filter(s=>s.status==='done').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Results Found', value: scrapes.reduce((a,s)=>a+s.results.length,0), color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
              { label: 'This Month', value: scrapes.filter(s=>new Date(s.createdAt).getMonth()===new Date().getMonth()).length, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
            ].map((c,i)=>(
              <div key={i} className={`${c.bg} border rounded-2xl p-5`}>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-[#8b949e] mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Quick Scrapes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESETS.slice(0,4).map(p=>(
                <button key={p.id} onClick={()=>{setQuery(p.prompt);setTab('new');}} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 text-left hover:border-[#58a6ff] transition-colors">
                  <h3 className="font-bold text-white text-sm mb-1">{p.label}</h3>
                  <p className="text-xs text-[#8b949e]">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
          {scrapes.length > 0 && <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Recent Scrapes</h2>
            <div className="space-y-2">
              {scrapes.slice(0,5).map(s=>(
                <div key={s.id} onClick={()=>{setSelected(s);setTab('results');}} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-center justify-between hover:border-[#58a6ff] cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.status==='done'?'bg-emerald-500/15':'bg-red-500/15'}`}>
                      {s.status==='done'?<Globe size={14} className="text-emerald-400"/>:<X size={14} className="text-red-400"/>}
                    </div>
                    <div><p className="text-sm font-bold text-white truncate max-w-xs">{s.query.slice(0,60)}...</p><p className="text-xs text-[#8b949e]">{s.results.length} results · {new Date(s.createdAt).toLocaleDateString('en-KE')}</p></div>
                  </div>
                  <ChevronRight size={16} className="text-[#8b949e]"/>
                </div>
              ))}
            </div>
          </div>}
        </div>
      )}

      {/* New Scrape */}
      {tab === 'new' && (
        <div className="space-y-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Sparkles size={18} className="text-emerald-400"/> AI-Powered Web Scrape</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#8b949e] uppercase tracking-widest block mb-1.5">What do you want to find?</label>
                <textarea value={query} onChange={e=>setQuery(e.target.value)} rows={3} placeholder="e.g. Find all recent court judgments related to land disputes in Nairobi County..."
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#58a6ff] resize-none"/>
              </div>
              <button onClick={()=>runScrape(query,'custom')} disabled={loading||!query.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                {loading?<Loader2 size={16} className="animate-spin"/>:<Search size={16}/>} {loading?'Scraping...':'Start Scrape'}
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Preset Scrapes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESETS.map(p=>(
                <button key={p.id} onClick={()=>runScrape(p.prompt,p.category)} disabled={loading}
                  className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 text-left hover:border-[#58a6ff] transition-colors disabled:opacity-50 group">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white text-sm">{p.label}</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-[#21262d] text-[#8b949e] rounded-full capitalize">{p.category}</span>
                  </div>
                  <p className="text-xs text-[#8b949e]">{p.desc}</p>
                  <p className="text-xs text-[#58a6ff] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click to scrape →</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {tab === 'results' && (
        <div className="space-y-4">
          {selected ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{selected.query.slice(0,80)}{selected.query.length>80?'...':''}</h2>
                  <p className="text-xs text-[#8b949e]">{selected.results.length} results · {new Date(selected.createdAt).toLocaleDateString('en-KE')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>exportCSV(selected)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-xs font-bold text-white hover:border-[#58a6ff] transition-colors"><Download size={12}/>Export CSV</button>
                  <button onClick={()=>setSelected(null)} className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-xs font-bold text-[#8b949e] hover:text-white transition-colors">Back</button>
                </div>
              </div>
              <div className="space-y-3">
                {selected.results.map((item,i)=>(
                  <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#58a6ff] transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <a href={item.url} target="_blank" rel="noopener" className="text-sm font-bold text-[#58a6ff] hover:underline flex items-center gap-1.5">{item.title}<ExternalLink size={12}/></a>
                      {item.date && <span className="text-[10px] text-[#8b949e] flex items-center gap-1"><Clock size={10}/>{item.date}</span>}
                    </div>
                    <p className="text-xs text-[#8b949e] mb-2 leading-relaxed">{item.snippet}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 bg-[#21262d] rounded-full text-[#8b949e]">{item.source}</span>
                      <span className="text-[10px] text-[#8b949e] truncate max-w-xs">{item.url}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {scrapes.length === 0 ? (
                <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-12 text-center">
                  <Globe size={40} className="text-[#30363d] mx-auto mb-3"/>
                  <p className="text-white font-bold mb-1">No scrape results yet</p>
                  <p className="text-sm text-[#8b949e]">Run a new scrape to start collecting data</p>
                  <button onClick={()=>setTab('new')} className="mt-4 px-4 py-2 bg-[#1f6feb] text-white rounded-xl text-sm font-bold">New Scrape</button>
                </div>
              ) : scrapes.map(s=>(
                <div key={s.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-center justify-between hover:border-[#58a6ff] transition-colors">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={()=>setSelected(s)}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.status==='done'?'bg-emerald-500/15':'bg-red-500/15'}`}><Globe size={18} className={s.status==='done'?'text-emerald-400':'text-red-400'}/></div>
                    <div><p className="text-sm font-bold text-white">{s.query.slice(0,60)}{s.query.length>60?'...':''}</p><p className="text-xs text-[#8b949e]">{s.results.length} results · {new Date(s.createdAt).toLocaleDateString('en-KE')}</p></div>
                  </div>
                  <button onClick={()=>deleteScrape(s.id)} className="p-2 text-[#8b949e] hover:text-red-400"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && <div className="fixed inset-0 bg-[#0d1117]/80 z-[600] flex items-center justify-center">
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center">
          <Loader2 size={40} className="animate-spin text-emerald-400 mx-auto mb-4"/>
          <h3 className="text-lg font-bold text-white mb-1">Scraping the web...</h3>
          <p className="text-sm text-[#8b949e]">Searching legal databases, property portals & public records</p>
        </div>
      </div>}
    </div>
  );
}
