import { useCallback, useEffect, useState, useRef } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { useEditingStore } from '../../src/store';
import { detectTextBlocks } from '../../src/utils/pdfUtils';
import type { TextBlock } from '../../src/editing/types';
import './TextEditLayer.css';

interface TextEditLayerProps {
  page: PDFPageProxy;
  pageNumber: number;
  scale: number;
  rotation: number;
}

export function TextEditLayer({ page, pageNumber, scale, rotation }: TextEditLayerProps) {
  const { mode, textBlocks, setTextBlocks, selectedBlockId, selectBlock, addTextEdit } = useEditingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pageBlocks = textBlocks.get(pageNumber) || [];

  // Load text blocks when entering text edit mode
  useEffect(() => {
    if (mode !== 'text') return;
    if (textBlocks.has(pageNumber)) return;
    setIsLoading(true);
    detectTextBlocks(page)
      .then(blocks => setTextBlocks(pageNumber, blocks))
      .catch(err => console.error('Failed to detect text blocks:', err))
      .finally(() => setIsLoading(false));
  }, [mode, page, pageNumber, textBlocks, setTextBlocks]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (editingBlockId && textareaRef.current) {
      textareaRef.current.focus();
      const len = editingText.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [editingBlockId]);

  // Get precise rect for a block, covering ALL its lines exactly
  const getBlockRect = useCallback((block: TextBlock) => {
    const viewport = page.getViewport({ scale: 1, rotation: 0 });
    const pageW = viewport.width;
    const pageH = viewport.height;

    // Calculate tight bounding box from all items in all lines
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const line of block.lines) {
      for (const item of line.items) {
        minX = Math.min(minX, item.x);
        minY = Math.min(minY, item.y);
        maxX = Math.max(maxX, item.x + item.width);
        maxY = Math.max(maxY, item.y + item.height);
      }
    }

    // Add a small padding so textarea overlaps text perfectly
    const padX = 2, padY = 1;
    let x = minX - padX, y = minY - padY;
    let w = (maxX - minX) + padX * 2;
    let h = (maxY - minY) + padY * 2;

    // Apply rotation transform
    switch (rotation) {
      case 90: { const nx = y; const ny = pageW - x - w; [x, y] = [nx, ny]; [w, h] = [h, w]; break; }
      case 180: x = pageW - x - w; y = pageH - y - h; break;
      case 270: { const nx2 = pageH - y - h; const ny2 = x; [x, y] = [nx2, ny2]; [w, h] = [h, w]; break; }
    }

    // Get dominant font size from block
    const fontSize = block.style.fontSize * scale;

    return {
      left: x * scale,
      top: y * scale,
      width: Math.max(w * scale, 40),
      height: Math.max(h * scale, fontSize + 4),
      fontSize,
      fontFamily: block.style.fontName || 'inherit',
      color: block.style.fontColor || '#000000',
      lineHeight: block.style.lineHeight || 1.2,
    };
  }, [page, rotation, scale]);

  const startEdit = useCallback((block: TextBlock, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingBlockId === block.id) return;
    // Save previous if any
    if (editingBlockId) {
      const prev = pageBlocks.find(b => b.id === editingBlockId);
      if (prev && prev.text !== editingText) {
        addTextEdit({ blockId: editingBlockId, originalText: prev.text, newText: editingText, timestamp: Date.now() });
      }
    }
    selectBlock(block.id);
    setEditingBlockId(block.id);
    setEditingText(block.text);
  }, [editingBlockId, editingText, pageBlocks, addTextEdit, selectBlock]);

  const commitEdit = useCallback(() => {
    if (!editingBlockId) return;
    const block = pageBlocks.find(b => b.id === editingBlockId);
    if (block && block.text !== editingText) {
      addTextEdit({ blockId: editingBlockId, originalText: block.text, newText: editingText, timestamp: Date.now() });
    }
    selectBlock(null);
    setEditingBlockId(null);
    setEditingText('');
  }, [editingBlockId, editingText, pageBlocks, addTextEdit, selectBlock]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') { commitEdit(); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commitEdit(); }
  }, [commitEdit]);

  const handleLayerClick = useCallback(() => { if (editingBlockId) commitEdit(); }, [editingBlockId, commitEdit]);

  if (mode !== 'text') return null;

  return (
    <div className="text-edit-layer" onClick={handleLayerClick}>
      {isLoading && (
        <div className="text-edit-loading">
          <div className="text-edit-spinner" />
          <span>Analysing document…</span>
        </div>
      )}

      {!isLoading && pageBlocks.length === 0 && (
        <div className="text-edit-empty">
          <span>No editable text detected on this page</span>
        </div>
      )}

      {pageBlocks.map(block => {
        const s = getBlockRect(block);
        const isEditing = editingBlockId === block.id;
        const isHovered = hoveredId === block.id;

        return (
          <div
            key={block.id}
            className={`text-block-box${isEditing ? ' editing' : ''}${isHovered && !isEditing ? ' hovered' : ''}`}
            style={{ left: s.left, top: s.top, width: s.width, height: s.height }}
            onClick={e => startEdit(block, e)}
            onMouseEnter={() => setHoveredId(block.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Hover tooltip */}
            {isHovered && !isEditing && (
              <div className="text-block-tooltip">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit text
              </div>
            )}

            {isEditing ? (
              <>
                {/* White-out behind textarea so text is fully visible */}
                <div className="text-block-whiteout" />
                <textarea
                  ref={textareaRef}
                  className="text-edit-input"
                  style={{
                    fontSize: s.fontSize,
                    fontFamily: s.fontFamily,
                    color: s.color,
                    lineHeight: s.lineHeight,
                  }}
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleKeyDown}
                  onClick={e => e.stopPropagation()}
                />
                <div className="text-edit-hint">Esc or Ctrl+Enter to save</div>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
