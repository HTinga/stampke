import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  X, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Type, Download, FileText, Undo2, Redo2, ChevronDown,
  Link, Image as ImageIcon, Minus, Plus, Table, Maximize2, Minimize2,
  Strikethrough, Superscript, Subscript, Highlighter, IndentIncrease, IndentDecrease,
  Palette, Check
} from 'lucide-react';

interface WordEditorProps {
  initialContent?: string;
  fileName?: string;
  onClose: () => void;
}

const FONTS = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Calibri', 'Garamond', 'Trebuchet MS'];
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72];
const COLORS = ['#000000','#1f2937','#374151','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#ffffff','#f8fafc'];

const Div = () => <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 3px', flexShrink: 0 }} />;

export default function WordEditor({ initialContent = '<p><br></p>', fileName = 'document', onClose }: WordEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [docName, setDocName] = useState(fileName.replace(/\.(pdf|docx|doc)$/i, ''));
  const [fontSize, setFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState('Calibri');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<'text' | 'bg' | null>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
      editorRef.current.focus();
      countWords();
    }
  }, [initialContent]);

  const countWords = useCallback(() => {
    const text = editorRef.current?.innerText || '';
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  }, []);

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    countWords();
  }, [countWords]);

  const insertTable = useCallback((rows: number, cols: number) => {
    const table = document.createElement('table');
    table.style.cssText = 'border-collapse:collapse;width:100%;margin:8px 0;';
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < cols; c++) {
        const td = document.createElement(r === 0 ? 'th' : 'td');
        td.style.cssText = 'border:1px solid #d1d5db;padding:6px 10px;min-width:60px;';
        td.innerHTML = r === 0 ? `<strong>Col ${c + 1}</strong>` : '&nbsp;';
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    exec('insertHTML', table.outerHTML);
  }, [exec]);

  const exportDocx = async () => {
    try {
      const { Document, Paragraph, TextRun, HeadingLevel, Packer, Table: DocxTable, TableRow, TableCell, WidthType, BorderStyle } = await import('docx');
      const html = editorRef.current?.innerHTML || '';
      const parser = new DOMParser();
      const doc2 = parser.parseFromString(html, 'text/html');
      const paras: any[] = [];

      const processNode = (node: Element): any => {
        const tag = node.tagName?.toLowerCase();
        const text = (node as HTMLElement).innerText || node.textContent || '';

        if (tag === 'table') {
          const rows = Array.from(node.querySelectorAll('tr'));
          return new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: rows.map(tr => new TableRow({
              children: Array.from(tr.querySelectorAll('td, th')).map(td => new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: (td as HTMLElement).innerText || '' })] })],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }))
            })),
          });
        }

        const runs = [new TextRun({
          text,
          bold: tag === 'b' || tag === 'strong' || node.closest('b,strong') !== null,
          italics: tag === 'i' || tag === 'em' || node.closest('i,em') !== null,
          underline: tag === 'u' ? {} : undefined,
          size: fontSize * 2,
          font: fontFamily,
        })];

        if (tag === 'h1') return new Paragraph({ children: runs, heading: HeadingLevel.HEADING_1 });
        if (tag === 'h2') return new Paragraph({ children: runs, heading: HeadingLevel.HEADING_2 });
        if (tag === 'h3') return new Paragraph({ children: runs, heading: HeadingLevel.HEADING_3 });
        return new Paragraph({ children: runs });
      };

      const children = Array.from(doc2.body.children).map(el => processNode(el as Element));
      const wordDoc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(wordDoc);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${docName}.docx`;
      link.click();
      URL.revokeObjectURL(url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('DOCX export error:', err);
    }
  };

  const ToolBtn = ({ icon: Icon, cmd, val, title, active }: { icon: React.ElementType; cmd?: string; val?: string; title: string; active?: boolean; onClick?: () => void }) => (
    <button
      onMouseDown={e => { e.preventDefault(); if (cmd) exec(cmd, val); }}
      title={title}
      style={{
        width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 5, border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'all 0.1s',
        background: active ? 'rgba(59,130,246,0.2)' : 'transparent',
        color: active ? '#3b82f6' : '#374151',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <Icon size={13} />
    </button>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: isFullscreen ? '#f3f4f6' : 'rgba(0,0,0,0.7)',
      display: 'flex', flexDirection: 'column',
      ...(isFullscreen ? {} : { padding: 24, alignItems: 'center', justifyContent: 'center' }),
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: isFullscreen ? 0 : 16,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column',
        width: isFullscreen ? '100%' : '92vw',
        height: isFullscreen ? '100%' : '92vh',
        overflow: 'hidden',
        maxWidth: isFullscreen ? '100%' : 1100,
      }}>

        {/* ── Title bar ── */}
        <div style={{ background: '#1e3a5f', display: 'flex', alignItems: 'center', padding: '8px 14px', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#2b579a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={14} color="white" />
          </div>
          <input
            value={docName}
            onChange={e => setDocName(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontWeight: 700, fontSize: 13, fontFamily: 'Segoe UI, system-ui, sans-serif' }}
          />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginRight: 4 }}>.docx</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={exportDocx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, border: 'none', background: '#2b579a', color: 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              {saved ? <><Check size={12} /> Saved!</> : <><Download size={12} /> Download</>}
            </button>
            <button onClick={() => setIsFullscreen(f => !f)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* ── Ribbon toolbar ── */}
        <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e5e7eb', padding: '6px 12px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, flexShrink: 0 }}>
          {/* Undo/Redo */}
          <ToolBtn icon={Undo2} cmd="undo" title="Undo" />
          <ToolBtn icon={Redo2} cmd="redo" title="Redo" />
          <Div />

          {/* Font */}
          <select value={fontFamily} onChange={e => { setFontFamily(e.target.value); exec('fontName', e.target.value); }}
            style={{ height: 26, border: '1px solid #d1d5db', borderRadius: 5, fontSize: 11, fontWeight: 600, padding: '0 6px', background: 'white', color: '#374151', outline: 'none', maxWidth: 110 }}>
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {/* Font size */}
          <select value={fontSize} onChange={e => { setFontSize(parseInt(e.target.value)); exec('fontSize', '3'); /* approximate */ }}
            style={{ height: 26, border: '1px solid #d1d5db', borderRadius: 5, fontSize: 11, fontWeight: 600, padding: '0 4px', background: 'white', color: '#374151', outline: 'none', width: 50 }}>
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Div />

          {/* Text formatting */}
          <ToolBtn icon={Bold} cmd="bold" title="Bold (Ctrl+B)" />
          <ToolBtn icon={Italic} cmd="italic" title="Italic (Ctrl+I)" />
          <ToolBtn icon={Underline} cmd="underline" title="Underline (Ctrl+U)" />
          <ToolBtn icon={Strikethrough} cmd="strikeThrough" title="Strikethrough" />
          <Div />

          {/* Alignment */}
          <ToolBtn icon={AlignLeft} cmd="justifyLeft" title="Align Left" />
          <ToolBtn icon={AlignCenter} cmd="justifyCenter" title="Center" />
          <ToolBtn icon={AlignRight} cmd="justifyRight" title="Align Right" />
          <ToolBtn icon={AlignJustify} cmd="justifyFull" title="Justify" />
          <Div />

          {/* Lists */}
          <ToolBtn icon={List} cmd="insertUnorderedList" title="Bullet List" />
          <ToolBtn icon={ListOrdered} cmd="insertOrderedList" title="Numbered List" />
          <ToolBtn icon={IndentIncrease} cmd="indent" title="Indent" />
          <ToolBtn icon={IndentDecrease} cmd="outdent" title="Outdent" />
          <Div />

          {/* Headings */}
          <select onChange={e => { exec('formatBlock', e.target.value); e.target.value = 'p'; }}
            defaultValue="p"
            style={{ height: 26, border: '1px solid #d1d5db', borderRadius: 5, fontSize: 11, fontWeight: 600, padding: '0 6px', background: 'white', color: '#374151', outline: 'none' }}>
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="blockquote">Quote</option>
            <option value="pre">Code</option>
          </select>
          <Div />

          {/* Color pickers */}
          <div style={{ position: 'relative' }}>
            <button onMouseDown={e => { e.preventDefault(); setShowColorPicker(showColorPicker === 'text' ? null : 'text'); }}
              style={{ width: 26, height: 26, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }} title="Text Color">
              <span style={{ fontWeight: 900, fontSize: 14, textDecoration: 'underline', textDecorationColor: '#ef4444' }}>A</span>
            </button>
            {showColorPicker === 'text' && (
              <div style={{ position: 'absolute', top: 30, left: 0, zIndex: 100, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', display: 'grid', gridTemplateColumns: 'repeat(6,24px)', gap: 4 }}>
                {COLORS.map(c => (
                  <button key={c} onMouseDown={e => { e.preventDefault(); exec('foreColor', c); setShowColorPicker(null); }}
                    style={{ width: 24, height: 24, borderRadius: 4, background: c, border: c === '#ffffff' ? '1px solid #d1d5db' : 'none', cursor: 'pointer' }} />
                ))}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button onMouseDown={e => { e.preventDefault(); setShowColorPicker(showColorPicker === 'bg' ? null : 'bg'); }}
              style={{ width: 26, height: 26, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }} title="Highlight">
              <Highlighter size={13} />
            </button>
            {showColorPicker === 'bg' && (
              <div style={{ position: 'absolute', top: 30, left: 0, zIndex: 100, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', display: 'grid', gridTemplateColumns: 'repeat(6,24px)', gap: 4 }}>
                {['#fef08a','#bbf7d0','#bfdbfe','#fecaca','#e9d5ff','#fed7aa','transparent'].map(c => (
                  <button key={c} onMouseDown={e => { e.preventDefault(); exec('hiliteColor', c); setShowColorPicker(null); }}
                    style={{ width: 24, height: 24, borderRadius: 4, background: c === 'transparent' ? 'white' : c, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 9, fontWeight: 700, color: '#374151' }}>
                    {c === 'transparent' ? '✕' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Div />

          {/* Insert */}
          <button onMouseDown={e => { e.preventDefault(); exec('createLink', prompt('Enter URL:') || ''); }}
            style={{ width: 26, height: 26, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'transparent', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Insert Link">
            <Link size={13} />
          </button>

          {/* Insert table 3x3 */}
          <button onMouseDown={e => { e.preventDefault(); insertTable(4, 3); }}
            style={{ width: 26, height: 26, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'transparent', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Insert Table (4×3)">
            <Table size={13} />
          </button>

          {/* Insert image */}
          <label style={{ width: 26, height: 26, borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }} title="Insert Image">
            <ImageIcon size={13} />
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader();
              r.onload = () => exec('insertImage', r.result as string);
              r.readAsDataURL(f);
            }} />
          </label>
          <Div />

          {/* Zoom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            <button onMouseDown={e => { e.preventDefault(); setZoom(z => Math.max(50, z - 10)); }} style={{ width: 22, height: 22, border: '1px solid #d1d5db', borderRadius: 4, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}><Minus size={11} /></button>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', minWidth: 36, textAlign: 'center' }}>{zoom}%</span>
            <button onMouseDown={e => { e.preventDefault(); setZoom(z => Math.min(200, z + 10)); }} style={{ width: 22, height: 22, border: '1px solid #d1d5db', borderRadius: 4, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}><Plus size={11} /></button>
          </div>
        </div>

        {/* ── Document canvas ── */}
        <div style={{ flex: 1, overflow: 'auto', background: '#e5e7eb', display: 'flex', justifyContent: 'center', padding: '32px 16px' }}
          onClick={() => setShowColorPicker(null)}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={countWords}
            spellCheck
            style={{
              width: `${(794 * zoom) / 100}px`,
              minHeight: `${(1123 * zoom) / 100}px`,
              background: 'white',
              boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
              padding: `${(96 * zoom) / 100}px`,
              fontSize: `${(fontSize * zoom) / 100}px`,
              fontFamily,
              lineHeight: 1.6,
              color: '#111827',
              outline: 'none',
              boxSizing: 'border-box',
              transform: 'none',
            }}
          />
        </div>

        {/* ── Status bar ── */}
        <div style={{ background: '#2b579a', display: 'flex', alignItems: 'center', padding: '4px 16px', gap: 16, flexShrink: 0 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Words: {wordCount}</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Font: {fontFamily} {fontSize}pt</span>
          <span style={{ flex: 1 }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Press Ctrl+Z to undo · Ctrl+Y to redo</span>
        </div>
      </div>
    </div>
  );
}
