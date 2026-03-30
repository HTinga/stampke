import React, { useState, useRef, useCallback, useEffect, Suspense, lazy } from 'react';
import {
  FileText, Plus, Presentation, File, Download, Trash2, Search,
  ChevronRight, Sparkles, Loader2, X, Check, Edit3, Eye, Copy,
  ArrowLeft, RefreshCw, BookOpen, Layout, BarChart2, Quote,
  Users, Table, Image as ImageIcon, List, Hash, Layers,
  Star, Zap, ChevronDown, ChevronUp, Move, Grid3X3,
  FileType, FileCode, Maximize2, GalleryHorizontal,
} from 'lucide-react';
import WordEditor from './WordEditor';
import { TEMPLATE_REGISTRY, TEMPLATE_FAMILIES, type TemplateInfo } from './presentation-templates/registry';

// ── Types ────────────────────────────────────────────────────────
type DocType = 'presentation' | 'word' | 'pdf';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content: string[];
  notes?: string;
  layout: 'title' | 'bullets' | 'two-col' | 'quote' | 'image' | 'blank' | 'metrics';
  theme: string;
  metrics?: { label: string; value: string; change?: string }[];
  quote?: string;
  author?: string;
}

interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: string;
  createdAt: string;
}

interface DocItem {
  id: string;
  type: DocType;
  title: string;
  createdAt: string;
  slides?: Slide[];
  content?: string;
  theme?: string;
}

// ── Themes ───────────────────────────────────────────────────────
const THEMES: Record<string, { bg: string; accent: string; text: string; slide: string; card: string; name: string }> = {
  midnight: { bg: '#0f172a', accent: '#6366f1', text: '#e2e8f0', slide: '#1e293b', card: '#1e293b', name: 'Midnight' },
  ocean:    { bg: '#0c1a2e', accent: '#0ea5e9', text: '#e0f2fe', slide: '#132035', card: '#132035', name: 'Ocean' },
  forest:   { bg: '#0f1f0f', accent: '#22c55e', text: '#dcfce7', slide: '#162016', card: '#162016', name: 'Forest' },
  sunset:   { bg: '#1c0a00', accent: '#f97316', text: '#fed7aa', slide: '#2d1200', card: '#2d1200', name: 'Sunset' },
  royal:    { bg: '#1a0533', accent: '#a855f7', text: '#f3e8ff', slide: '#25074a', card: '#25074a', name: 'Royal' },
  slate:    { bg: '#0f172a', accent: '#94a3b8', text: '#f1f5f9', slide: '#1e293b', card: '#1e293b', name: 'Slate' },
  crimson:  { bg: '#1c0a0a', accent: '#ef4444', text: '#fee2e2', slide: '#2d1010', card: '#2d1010', name: 'Crimson' },
  clean:    { bg: '#ffffff', accent: '#3b82f6', text: '#1e293b', slide: '#f8fafc', card: '#f1f5f9', name: 'Clean' },
};

const SLIDE_TEMPLATES = [
  { layout: 'title', icon: Layout, label: 'Title Slide' },
  { layout: 'bullets', icon: List, label: 'Bullets' },
  { layout: 'two-col', icon: Layers, label: 'Two Column' },
  { layout: 'metrics', icon: BarChart2, label: 'Metrics' },
  { layout: 'quote', icon: Quote, label: 'Quote' },
  { layout: 'image', icon: ImageIcon, label: 'Image' },
  { layout: 'blank', icon: File, label: 'Blank' },
];

const DB_KEY = 'documents_hub_v1';
const load = () => { try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]'); } catch { return []; } };
const save = (d: DocItem[]) => localStorage.setItem(DB_KEY, JSON.stringify(d));

// ── AI call ──────────────────────────────────────────────────────
async function callAI(prompt: string, system?: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: system || 'You are a professional presentation and document creator.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  return data.content?.find((b: any) => b.type === 'text')?.text || '';
}

async function generatePresentation(topic: string, slideCount: number, theme: string): Promise<Slide[]> {
  const prompt = `Create a professional presentation about: "${topic}"
Generate exactly ${slideCount} slides. Return ONLY a valid JSON array, no markdown, no explanation.
Each slide object must have: id (string), title, subtitle (optional), content (array of 2-4 bullet points), layout, notes (speaker notes)
Layouts to use creatively: "title" (first slide only), "bullets", "two-col", "metrics", "quote", "image"
For metrics layout add: metrics array with [{label, value, change}] (3-4 metrics)
For quote layout add: quote (inspiring quote) and author fields
Make it professional, engaging, and comprehensive.
Example structure:
[{"id":"1","title":"Title Here","subtitle":"Subtitle","content":[],"layout":"title","notes":"Speaker note"},
{"id":"2","title":"Overview","content":["Point 1","Point 2","Point 3"],"layout":"bullets","notes":"Discuss..."},
{"id":"3","title":"Key Metrics","content":[],"layout":"metrics","metrics":[{"label":"Growth","value":"47%","change":"+12%"}],"notes":"Show data"}]`;

  const text = await callAI(prompt);
  const clean = text.replace(/```json|```/g, '').trim();
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Invalid response format');
  const slides = JSON.parse(match[0]);
  return slides.map((s: any, i: number) => ({
    ...s,
    id: s.id || String(i + 1),
    theme,
    content: Array.isArray(s.content) ? s.content : [],
    layout: s.layout || 'bullets',
  }));
}

// ── Slide Renderer ───────────────────────────────────────────────
function SlideView({ slide, theme: themeKey, scale = 1, onClick, isSelected }: {
  slide: Slide; theme: string; scale?: number; onClick?: () => void; isSelected?: boolean;
}) {
  const t = THEMES[themeKey] || THEMES.midnight;
  const isClean = themeKey === 'clean';

  const base: React.CSSProperties = {
    width: 960 * scale, height: 540 * scale,
    background: t.slide,
    border: isSelected ? `${2/scale}px solid ${t.accent}` : `${1/scale}px solid rgba(255,255,255,0.08)`,
    borderRadius: 8 * scale, overflow: 'hidden', position: 'relative',
    cursor: onClick ? 'pointer' : 'default', flexShrink: 0,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    boxShadow: isSelected ? `0 0 0 ${3*scale}px ${t.accent}40` : '0 4px 24px rgba(0,0,0,0.3)',
    transition: 'box-shadow 0.15s',
  };

  const accent: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, right: 0, height: 4 * scale,
    background: `linear-gradient(90deg, ${t.accent}, ${t.accent}80)`,
  };

  const titleStyle: React.CSSProperties = {
    color: t.text, fontWeight: 800, lineHeight: 1.15,
  };

  const subtitleStyle: React.CSSProperties = {
    color: `${t.text}90`, fontWeight: 500,
  };

  const bulletStyle: React.CSSProperties = {
    color: `${t.text}cc`, display: 'flex', alignItems: 'flex-start', gap: 8 * scale,
    fontWeight: 500,
  };

  if (slide.layout === 'title') return (
    <div style={base} onClick={onClick}>
      <div style={accent} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 30% 60%, ${t.accent}15 0%, transparent 60%)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 80 * scale, textAlign: 'center',
      }}>
        <div style={{ width: 40 * scale, height: 4 * scale, background: t.accent, borderRadius: 2, marginBottom: 24 * scale }} />
        <div style={{ ...titleStyle, fontSize: 42 * scale, marginBottom: 16 * scale }}>{slide.title}</div>
        {slide.subtitle && <div style={{ ...subtitleStyle, fontSize: 18 * scale }}>{slide.subtitle}</div>}
      </div>
    </div>
  );

  if (slide.layout === 'metrics') return (
    <div style={base} onClick={onClick}>
      <div style={accent} />
      <div style={{ position: 'absolute', inset: 0, padding: 48 * scale }}>
        <div style={{ ...titleStyle, fontSize: 26 * scale, marginBottom: 32 * scale }}>{slide.title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${(slide.metrics || []).length}, 1fr)`, gap: 16 * scale }}>
          {(slide.metrics || []).map((m, i) => (
            <div key={i} style={{
              background: `${t.accent}15`, borderRadius: 12 * scale,
              padding: 20 * scale, border: `1px solid ${t.accent}30`,
            }}>
              <div style={{ color: `${t.text}70`, fontSize: 11 * scale, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 * scale }}>{m.label}</div>
              <div style={{ color: t.accent, fontSize: 32 * scale, fontWeight: 900, marginBottom: 4 * scale }}>{m.value}</div>
              {m.change && <div style={{ color: m.change.startsWith('+') ? '#22c55e' : '#ef4444', fontSize: 13 * scale, fontWeight: 600 }}>{m.change}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (slide.layout === 'quote') return (
    <div style={base} onClick={onClick}>
      <div style={accent} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 80 * scale, textAlign: 'center',
      }}>
        <div style={{ color: t.accent, fontSize: 64 * scale, lineHeight: 1, marginBottom: 16 * scale, fontFamily: 'Georgia, serif' }}>"</div>
        <div style={{ color: t.text, fontSize: 20 * scale, fontWeight: 500, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 24 * scale }}>
          {slide.quote || slide.title}
        </div>
        {slide.author && (
          <div style={{ color: t.accent, fontSize: 13 * scale, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            — {slide.author}
          </div>
        )}
      </div>
    </div>
  );

  if (slide.layout === 'two-col') {
    const half = Math.ceil((slide.content || []).length / 2);
    const left = (slide.content || []).slice(0, half);
    const right = (slide.content || []).slice(half);
    return (
      <div style={base} onClick={onClick}>
        <div style={accent} />
        <div style={{ position: 'absolute', inset: 0, padding: 48 * scale }}>
          <div style={{ ...titleStyle, fontSize: 26 * scale, marginBottom: 24 * scale }}>{slide.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 * scale }}>
            {[left, right].map((col, ci) => (
              <div key={ci} style={{ background: `${t.accent}08`, borderRadius: 8 * scale, padding: 16 * scale, border: `1px solid ${t.accent}20` }}>
                {col.map((b, i) => (
                  <div key={i} style={{ ...bulletStyle, fontSize: 14 * scale, marginBottom: 10 * scale }}>
                    <span style={{ color: t.accent, fontSize: 18 * scale, lineHeight: 1 }}>›</span>
                    {b}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default: bullets
  return (
    <div style={base} onClick={onClick}>
      <div style={accent} />
      <div style={{ position: 'absolute', inset: 0, padding: 48 * scale }}>
        <div style={{ ...titleStyle, fontSize: 28 * scale, marginBottom: 8 * scale }}>{slide.title}</div>
        {slide.subtitle && <div style={{ ...subtitleStyle, fontSize: 14 * scale, marginBottom: 20 * scale }}>{slide.subtitle}</div>}
        <div style={{ marginTop: 20 * scale, display: 'flex', flexDirection: 'column', gap: 12 * scale }}>
          {(slide.content || []).map((b, i) => (
            <div key={i} style={{ ...bulletStyle, fontSize: 16 * scale }}>
              <span style={{ width: 6 * scale, height: 6 * scale, borderRadius: '50%', background: t.accent, flexShrink: 0, marginTop: 7 * scale }} />
              {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DocumentsHub() {
  const [view, setView] = useState<'hub' | 'create' | 'editor' | 'preview' | 'word'>('hub');
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [creating, setCreating] = useState<DocType | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const [slideCount, setSlideCount] = useState(8);
  const [selectedTheme, setSelectedTheme] = useState('midnight');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [activeDoc, setActiveDoc] = useState<DocItem | null>(null);
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(0);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [search, setSearch] = useState('');
  const [showWordEditor, setShowWordEditor] = useState(false);
  const [wordContent, setWordContent] = useState('');
  const [wordFileName, setWordFileName] = useState('New Document');
  const [presentationMode, setPresentationMode] = useState(false);
  const [genStep, setGenStep] = useState('');
  const [selectedTemplateFamily, setSelectedTemplateFamily] = useState('all');
  const [selectedPrestonTemplate, setSelectedPrestonTemplate] = useState<string | null>(null);

  useEffect(() => { setDocs(load()); }, []);
  const persist = (d: DocItem[]) => { setDocs(d); save(d); };

  const deleteDoc = (id: string) => persist(docs.filter(d => d.id !== id));

  // ── Generate AI Presentation ──────────────────────────────────
  const generateAI = async () => {
    if (!aiTopic.trim()) return;
    setGenerating(true); setGenError('');
    setGenStep('Generating outline...');
    try {
      setGenStep('Creating slides with AI...');
      const slides = await generatePresentation(aiTopic, slideCount, selectedTheme);
      setGenStep('Finalizing...');
      const doc: DocItem = {
        id: Date.now().toString(),
        type: 'presentation',
        title: aiTopic,
        slides,
        theme: selectedTheme,
        createdAt: new Date().toISOString(),
      };
      const updated = [doc, ...docs];
      persist(updated);
      setActiveDoc(doc);
      setSelectedSlideIdx(0);
      setView('editor');
    } catch (err: any) {
      setGenError(err.message || 'Generation failed');
    } finally { setGenerating(false); setGenStep(''); }
  };

  // ── Create blank presentation ─────────────────────────────────
  const createBlankPresentation = () => {
    const blankSlide: Slide = {
      id: '1', title: 'Click to edit title', subtitle: 'Your subtitle here',
      content: [], layout: 'title', theme: selectedTheme, notes: '',
    };
    const doc: DocItem = {
      id: Date.now().toString(), type: 'presentation',
      title: 'New Presentation', slides: [blankSlide],
      theme: selectedTheme, createdAt: new Date().toISOString(),
    };
    const updated = [doc, ...docs];
    persist(updated);
    setActiveDoc(doc);
    setSelectedSlideIdx(0);
    setView('editor');
  };

  // ── Open Word Editor ─────────────────────────────────────────
  const openWordEditor = (doc?: DocItem) => {
    setWordContent(doc?.content || '<h1>New Document</h1><p></p>');
    setWordFileName(doc?.title || 'New Document');
    setShowWordEditor(true);
  };

  // ── Update slide ────────────────────────────────────────────
  const updateSlide = (updated: Slide) => {
    if (!activeDoc?.slides) return;
    const newSlides = activeDoc.slides.map(s => s.id === updated.id ? updated : s);
    const newDoc = { ...activeDoc, slides: newSlides };
    setActiveDoc(newDoc);
    setEditingSlide(null);
    persist(docs.map(d => d.id === newDoc.id ? newDoc : d));
  };

  const addSlide = (layout: string) => {
    if (!activeDoc?.slides) return;
    const newSlide: Slide = {
      id: Date.now().toString(), title: 'New Slide',
      content: ['Add your content here'], layout: layout as any,
      theme: activeDoc.theme || 'midnight', notes: '',
    };
    const newSlides = [...activeDoc.slides, newSlide];
    const newDoc = { ...activeDoc, slides: newSlides };
    setActiveDoc(newDoc);
    persist(docs.map(d => d.id === newDoc.id ? newDoc : d));
    setSelectedSlideIdx(newSlides.length - 1);
  };

  const deleteSlide = (idx: number) => {
    if (!activeDoc?.slides || activeDoc.slides.length <= 1) return;
    const newSlides = activeDoc.slides.filter((_, i) => i !== idx);
    const newDoc = { ...activeDoc, slides: newSlides };
    setActiveDoc(newDoc);
    persist(docs.map(d => d.id === newDoc.id ? newDoc : d));
    setSelectedSlideIdx(Math.min(idx, newSlides.length - 1));
  };

  const filteredDocs = docs.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  const S = {
    dark: { background: '#0a0f1a', minHeight: '100%', fontFamily: "'Segoe UI', system-ui, sans-serif" } as React.CSSProperties,
    card: { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 } as React.CSSProperties,
    input: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', padding: '10px 14px', width: '100%', fontSize: 14, outline: 'none', fontFamily: 'inherit' } as React.CSSProperties,
    label: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)', marginBottom: 6, display: 'block' } as React.CSSProperties,
    btn: (accent = false, sm = false) => ({
      display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
      padding: sm ? '6px 12px' : '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: sm ? 11 : 13,
      background: accent ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.07)',
      color: 'white', boxShadow: accent ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
    } as React.CSSProperties),
  };

  // ─── PRESENTATION MODE ───────────────────────────────────────
  if (presentationMode && activeDoc?.slides) {
    const t = THEMES[activeDoc.theme || 'midnight'] || THEMES.midnight;
    const slide = activeDoc.slides[selectedSlideIdx];
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#000', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 10 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, alignSelf: 'center' }}>
            {selectedSlideIdx + 1} / {activeDoc.slides.length}
          </span>
          <button onClick={() => setPresentationMode(false)} style={{ ...S.btn(), padding: '6px 12px', fontSize: 11 }}>
            <X size={13} /> Exit
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SlideView slide={slide} theme={activeDoc.theme || 'midnight'} scale={Math.min(window.innerWidth / 960, window.innerHeight / 540) * 0.9} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: 16 }}>
          <button onClick={() => setSelectedSlideIdx(i => Math.max(0, i - 1))} style={{ ...S.btn(), opacity: selectedSlideIdx === 0 ? 0.3 : 1 }}>← Prev</button>
          <button onClick={() => setSelectedSlideIdx(i => Math.min(activeDoc.slides!.length - 1, i + 1))} style={{ ...S.btn(true), opacity: selectedSlideIdx === activeDoc.slides.length - 1 ? 0.3 : 1 }}>Next →</button>
        </div>
      </div>
    );
  }

  // ─── SLIDE EDITOR ───────────────────────────────────────────
  if (view === 'editor' && activeDoc?.slides) {
    const t = THEMES[activeDoc.theme || 'midnight'] || THEMES.midnight;
    const currentSlide = activeDoc.slides[selectedSlideIdx];

    return (
      <div style={{ ...S.dark, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Editor toolbar */}
        <div style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <button onClick={() => setView('hub')} style={{ ...S.btn(false, true) }}><ArrowLeft size={13} /> Docs</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input value={activeDoc.title} onChange={e => {
              const nd = { ...activeDoc, title: e.target.value };
              setActiveDoc(nd);
              persist(docs.map(d => d.id === nd.id ? nd : d));
            }} style={{ ...S.input, padding: '5px 10px', fontSize: 13, fontWeight: 700, width: 'auto', minWidth: 200, background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(THEMES).map(([k, v]) => (
              <button key={k} onClick={() => {
                const nd = { ...activeDoc, theme: k, slides: activeDoc.slides!.map(s => ({ ...s, theme: k })) };
                setActiveDoc(nd);
                persist(docs.map(d => d.id === nd.id ? nd : d));
              }}
                style={{ width: 20, height: 20, borderRadius: '50%', background: v.accent, border: activeDoc.theme === k ? '2px solid white' : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }}
                title={v.name} />
            ))}
          </div>
          <button onClick={() => setPresentationMode(true)} style={{ ...S.btn(true, true) }}><Maximize2 size={12} /> Present</button>
          <button onClick={() => {
            // Export as PPTX placeholder - download as HTML
            const html = `<!DOCTYPE html><html><head><title>${activeDoc.title}</title><style>body{margin:0;background:#000;font-family:sans-serif;}.slide{width:960px;height:540px;margin:20px auto;position:relative;background:${t.slide};border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;color:${t.text};font-size:24px;font-weight:700;text-align:center;padding:40px;box-sizing:border-box;}</style></head><body>${activeDoc.slides!.map(s => `<div class="slide"><div><div style="font-size:32px;font-weight:800;margin-bottom:16px;">${s.title}</div>${(s.content || []).map(b => `<div style="font-size:16px;margin:8px 0;opacity:0.8">• ${b}</div>`).join('')}</div></div>`).join('')}</body></html>`;
            const a = document.createElement('a');
            a.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
            a.download = `${activeDoc.title}.html`;
            a.click();
          }} style={{ ...S.btn(false, true) }}><Download size={12} /> Export</button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Slide thumbnails */}
          <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', background: '#0d1117', padding: 8 }}>
            {/* Add slide buttons */}
            <div style={{ marginBottom: 8 }}>
              <p style={S.label}>Add Slide</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {SLIDE_TEMPLATES.map(({ layout, icon: Icon, label }) => (
                  <button key={layout} onClick={() => addSlide(layout)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 4px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700 }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.15)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}>
                    <Icon size={14} />{label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
            {activeDoc.slides.map((slide, i) => (
              <div key={slide.id} style={{ marginBottom: 8, position: 'relative' }}
                onClick={() => setSelectedSlideIdx(i)}>
                <div style={{ transform: 'scale(0.155)', transformOrigin: 'top left', width: 960, height: 540, pointerEvents: 'none' }}>
                  <SlideView slide={slide} theme={activeDoc.theme || 'midnight'} isSelected={i === selectedSlideIdx} />
                </div>
                <div style={{ height: 540 * 0.155, borderRadius: 4, border: i === selectedSlideIdx ? '2px solid #6366f1' : '2px solid transparent', position: 'absolute', inset: 0, top: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700 }}>{i + 1}</span>
                  {activeDoc.slides.length > 1 && (
                    <button onClick={ev => { ev.stopPropagation(); deleteSlide(i); }}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,0,0,0.5)', cursor: 'pointer', padding: '1px 3px', fontSize: 10 }}>✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Main slide area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1a1a2e' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, overflow: 'auto' }}>
              <SlideView
                slide={editingSlide || currentSlide}
                theme={activeDoc.theme || 'midnight'}
                scale={0.75}
                onClick={() => setEditingSlide(currentSlide)}
                isSelected={!!editingSlide}
              />
            </div>
          </div>

          {/* Right panel: slide properties */}
          <div style={{ width: 260, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', background: '#0d1117', padding: 16 }}>
            <p style={{ color: 'white', fontWeight: 800, fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Slide Properties</p>

            {currentSlide && (<>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Title</label>
                <input style={S.input} value={currentSlide.title} onChange={e => updateSlide({ ...currentSlide, title: e.target.value })} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Subtitle</label>
                <input style={S.input} value={currentSlide.subtitle || ''} onChange={e => updateSlide({ ...currentSlide, subtitle: e.target.value })} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Layout</label>
                <select style={S.input} value={currentSlide.layout} onChange={e => updateSlide({ ...currentSlide, layout: e.target.value as any })}>
                  {SLIDE_TEMPLATES.map(t => <option key={t.layout} value={t.layout}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Bullets (one per line)</label>
                <textarea
                  style={{ ...S.input, height: 120, resize: 'vertical' } as React.CSSProperties}
                  value={(currentSlide.content || []).join('\n')}
                  onChange={e => updateSlide({ ...currentSlide, content: e.target.value.split('\n').filter(Boolean) })}
                />
              </div>
              {currentSlide.layout === 'quote' && (<>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Quote Text</label>
                  <textarea style={{ ...S.input, height: 80, resize: 'vertical' } as React.CSSProperties} value={currentSlide.quote || ''} onChange={e => updateSlide({ ...currentSlide, quote: e.target.value })} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Author</label>
                  <input style={S.input} value={currentSlide.author || ''} onChange={e => updateSlide({ ...currentSlide, author: e.target.value })} />
                </div>
              </>)}
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Speaker Notes</label>
                <textarea style={{ ...S.input, height: 80, resize: 'vertical' } as React.CSSProperties} value={currentSlide.notes || ''} onChange={e => updateSlide({ ...currentSlide, notes: e.target.value })} />
              </div>
            </>)}
          </div>
        </div>
      </div>
    );
  }

  // ─── CREATE FLOW ─────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div style={{ ...S.dark, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 10 }}>
          <button onClick={() => setView('hub')} style={{ ...S.btn(false, true) }}><ArrowLeft size={13} /> Back</button>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>
            {creating === 'presentation' ? 'Create Presentation' : creating === 'word' ? 'Create Word Document' : 'Create PDF'}
          </span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 32, display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: 600, width: '100%' }}>
            {creating === 'presentation' && (<>
              {/* AI Generation */}
              <div style={{ ...S.card, padding: 24, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={16} color="white" />
                  </div>
                  <div>
                    <p style={{ color: 'white', fontWeight: 800, fontSize: 15, margin: 0 }}>AI Generate</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>Describe your topic and AI builds the whole deck</p>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Topic / Prompt</label>
                  <textarea
                    style={{ ...S.input, height: 80, resize: 'vertical' } as React.CSSProperties}
                    placeholder="e.g. Q3 financial results for board of directors, including revenue growth, cost analysis, and 2025 roadmap"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={S.label}>Number of Slides</label>
                    <select style={S.input} value={slideCount} onChange={e => setSlideCount(parseInt(e.target.value))}>
                      {[5, 8, 10, 12, 15, 20].map(n => <option key={n} value={n}>{n} slides</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Theme</label>
                    <select style={S.input} value={selectedTheme} onChange={e => setSelectedTheme(e.target.value)}>
                      {Object.entries(THEMES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                    </select>
                  </div>
                </div>
                {/* Theme preview dots */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {Object.entries(THEMES).map(([k, v]) => (
                    <div key={k} onClick={() => setSelectedTheme(k)}
                      style={{ width: 32, height: 32, borderRadius: 8, background: v.slide, border: selectedTheme === k ? `2px solid white` : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: v.accent }} />
                    </div>
                  ))}
                </div>
                {genError && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: 13, marginBottom: 12 }}>{genError}</div>}
                <button onClick={generateAI} disabled={generating || !aiTopic.trim()}
                  style={{ ...S.btn(true), width: '100%', justifyContent: 'center', padding: '12px', opacity: generating || !aiTopic.trim() ? 0.6 : 1 }}>
                  {generating ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {genStep || 'Generating...'}</> : <><Sparkles size={15} /> Generate Presentation</>}
                </button>
              </div>

              {/* Blank */}
              <div style={{ ...S.card, padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>Start from Blank</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>Empty canvas — build your own slides</p>
                  </div>
                  <button onClick={createBlankPresentation} style={S.btn(false, true)}><Plus size={13} /> Create</button>
                </div>
              </div>

              {/* Presenton Template Gallery */}
              <div style={{ ...S.card, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <GalleryHorizontal size={16} style={{ color: '#6366f1' }} />
                  <p style={{ color: 'white', fontWeight: 800, fontSize: 15, margin: 0 }}>Slide Templates Gallery</p>
                  <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.15)', color: '#6366f1', borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>{TEMPLATE_REGISTRY.length} layouts</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 14 }}>Professional slide templates from the Presenton library — click any to use in your deck</p>
                {/* Family filters */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {['all', ...TEMPLATE_FAMILIES].map(fam => (
                    <button key={fam} onClick={() => setSelectedTemplateFamily(fam)}
                      style={{ padding: '4px 10px', borderRadius: 16, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', background: selectedTemplateFamily === fam ? '#6366f1' : 'rgba(255,255,255,0.07)', color: selectedTemplateFamily === fam ? 'white' : 'rgba(255,255,255,0.4)', transition: 'all 0.12s' }}>
                      {fam}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
                  {TEMPLATE_REGISTRY
                    .filter(t => selectedTemplateFamily === 'all' || t.family === selectedTemplateFamily)
                    .map(tmpl => (
                    <div key={tmpl.id}
                      style={{ background: 'rgba(255,255,255,0.04)', border: `2px solid ${selectedPrestonTemplate === tmpl.id ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.12s' }}
                      onClick={() => setSelectedPrestonTemplate(tmpl.id === selectedPrestonTemplate ? null : tmpl.id)}
                      onMouseEnter={e => { if (selectedPrestonTemplate !== tmpl.id) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)'; }}
                      onMouseLeave={e => { if (selectedPrestonTemplate !== tmpl.id) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                      <div style={{ height: 80, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <Layout size={24} style={{ color: 'rgba(99,102,241,0.4)' }} />
                        <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 8, background: 'rgba(99,102,241,0.2)', color: '#6366f1', padding: '1px 5px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>{tmpl.family.replace('neo-','')}</span>
                        {selectedPrestonTemplate === tmpl.id && <div style={{ position: 'absolute', inset: 0, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={20} style={{ color: '#6366f1' }} /></div>}
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: 11, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tmpl.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tmpl.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedPrestonTemplate && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 600 }}>✓ Template selected: {TEMPLATE_REGISTRY.find(t => t.id === selectedPrestonTemplate)?.name}</span>
                    <button onClick={() => { createBlankPresentation(); }} style={{ ...S.btn(true, false), padding: '6px 14px', fontSize: 11 }}><Sparkles size={12} /> Use Template</button>
                  </div>
                )}
              </div>
            </>)}

            {(creating === 'word') && (
              <div style={{ ...S.card, padding: 24 }}>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 15, marginBottom: 16 }}>New Word Document</p>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Document Title</label>
                  <input style={S.input} value={wordFileName} onChange={e => setWordFileName(e.target.value)} placeholder="Untitled Document" />
                </div>
                <button onClick={() => { openWordEditor(); setView('hub'); }} style={{ ...S.btn(true), width: '100%', justifyContent: 'center' }}>
                  <Edit3 size={14} /> Open Word Editor
                </button>
              </div>
            )}

            {creating === 'pdf' && (
              <div style={{ ...S.card, padding: 24 }}>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Create PDF</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 20 }}>Create a document in the Word editor and export it as PDF.</p>
                <button onClick={() => { openWordEditor(); setView('hub'); }} style={{ ...S.btn(true), width: '100%', justifyContent: 'center' }}>
                  <FileText size={14} /> Open Editor
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── HUB (main view) ─────────────────────────────────────────
  return (
    <div style={S.dark}>
      {/* Word editor overlay */}
      {showWordEditor && (
        <WordEditor initialContent={wordContent} fileName={wordFileName} onClose={() => setShowWordEditor(false)} />
      )}

      {/* Header */}
      <div style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '12px 24px', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 12, paddingRight: 12, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={14} color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 14, color: 'white' }}>Documents</span>
        </div>

        <div style={{ flex: 1, position: 'relative', maxWidth: 320 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input style={{ ...S.input, paddingLeft: 32, fontSize: 13, padding: '7px 12px 7px 32px' }} placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[
            { type: 'presentation', label: 'Presentation', icon: Presentation, color: '#6366f1' },
            { type: 'word', label: 'Word Doc', icon: FileText, color: '#2563eb' },
            { type: 'pdf', label: 'PDF', icon: FileType, color: '#dc2626' },
          ].map(({ type, label, icon: Icon, color }) => (
            <button key={type} onClick={() => { setCreating(type as DocType); setView('create'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: `${color}20`, color, transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${color}35`}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${color}20`}>
              <Plus size={12} /><Icon size={12} />{label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {/* Quick create tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { type: 'presentation', label: 'AI Presentation', desc: 'Generate a full deck with AI in seconds', icon: Sparkles, color: '#6366f1', bg: 'linear-gradient(135deg,#312e81,#4c1d95)' },
            { type: 'word', label: 'Word Document', desc: 'Full Word editor with formatting tools', icon: FileText, color: '#60a5fa', bg: 'linear-gradient(135deg,#1e3a5f,#1e40af)' },
            { type: 'pdf', label: 'PDF / Export', desc: 'Create and export as PDF', icon: FileType, color: '#f87171', bg: 'linear-gradient(135deg,#7f1d1d,#991b1b)' },
          ].map(({ type, label, desc, icon: Icon, color, bg }) => (
            <div key={type} onClick={() => { setCreating(type as DocType); setView('create'); }}
              style={{ background: bg, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon size={20} color={color} />
              </div>
              <p style={{ color: 'white', fontWeight: 800, fontSize: 15, margin: '0 0 6px' }}>{label}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Documents list */}
        {filteredDocs.length === 0 ? (
          <div style={{ ...S.card, padding: 60, textAlign: 'center' }}>
            <BookOpen size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>No documents yet. Create your first document above.</p>
          </div>
        ) : (
          <>
            <p style={S.label}>{filteredDocs.length} Document{filteredDocs.length !== 1 ? 's' : ''}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12 }}>
              {filteredDocs.map(doc => {
                const isPresentation = doc.type === 'presentation';
                const firstSlide = doc.slides?.[0];
                const t = THEMES[doc.theme || 'midnight'] || THEMES.midnight;
                return (
                  <div key={doc.id} style={{ ...S.card, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                    {/* Preview */}
                    <div style={{ height: 120, background: isPresentation ? t.slide : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
                      onClick={() => { if (isPresentation) { setActiveDoc(doc); setSelectedSlideIdx(0); setView('editor'); } else { openWordEditor(doc); } }}>
                      {isPresentation && firstSlide ? (
                        <div style={{ transform: 'scale(0.22)', transformOrigin: 'center', pointerEvents: 'none', position: 'absolute' }}>
                          <SlideView slide={firstSlide} theme={doc.theme || 'midnight'} />
                        </div>
                      ) : (
                        <FileText size={32} style={{ color: 'rgba(255,255,255,0.15)' }} />
                      )}
                      {isPresentation && (
                        <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                          {doc.slides?.length || 0} slides
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4, marginBottom: 4 }}>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{doc.title}</p>
                        <button onClick={e => { e.stopPropagation(); deleteDoc(doc.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,0,0,0.4)', padding: '0 2px', flexShrink: 0, fontSize: 14 }}>✕</button>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, margin: 0 }}>
                        {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)} · {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
