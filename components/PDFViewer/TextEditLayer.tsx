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

export function TextEditLayer({
  page,
  pageNumber,
  scale,
  rotation,
}: TextEditLayerProps) {
  const {
    mode,
    textBlocks,
    setTextBlocks,
    selectedBlockId,
    selectBlock,
    addTextEdit,
  } = useEditingStore();

  const [isLoading, setIsLoading] = useState(false);
  const [editingText, setEditingText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const pageBlocks = textBlocks.get(pageNumber) || [];

  // Load text blocks when entering text edit mode
  useEffect(() => {
    if (mode !== 'text') return;
    if (textBlocks.has(pageNumber)) return;

    setIsLoading(true);
    detectTextBlocks(page)
      .then((blocks) => {
        setTextBlocks(pageNumber, blocks);
      })
      .catch((err) => {
        console.error('Failed to detect text blocks:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [mode, page, pageNumber, textBlocks, setTextBlocks]);

  // Focus input when a block is selected
  useEffect(() => {
    if (selectedBlockId && inputRef.current) {
      const block = pageBlocks.find((b) => b.id === selectedBlockId);
      if (block) {
        setEditingText(block.text);
        inputRef.current.focus();
        // Move cursor to end
        inputRef.current.setSelectionRange(block.text.length, block.text.length);
      }
    }
  }, [selectedBlockId, pageBlocks]);

  // Transform rect based on rotation
  const transformRect = useCallback(
    (block: TextBlock) => {
      const viewport = page.getViewport({ scale: 1, rotation: 0 });
      const pageWidth = viewport.width;
      const pageHeight = viewport.height;

      let { x, y, width, height } = block.rect;

      switch (rotation) {
        case 90:
          [x, y] = [y, pageWidth - x - width];
          [width, height] = [height, width];
          break;
        case 180:
          x = pageWidth - x - width;
          y = pageHeight - y - height;
          break;
        case 270:
          [x, y] = [pageHeight - y - height, x];
          [width, height] = [height, width];
          break;
      }

      return {
        left: x * scale,
        top: y * scale,
        width: width * scale,
        height: height * scale,
        fontSize: block.style.fontSize * scale,
        fontFamily: block.style.fontName,
        color: block.style.fontColor || 'black',
      };
    },
    [page, rotation, scale]
  );

  const handleBlockClick = useCallback(
    (block: TextBlock, e: React.MouseEvent) => {
      e.stopPropagation();
      selectBlock(block.id);
    },
    [selectBlock]
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditingText(e.target.value);
    },
    []
  );

  const handleBlur = useCallback(() => {
    if (!selectedBlockId) return;

    const block = pageBlocks.find((b) => b.id === selectedBlockId);
    if (block && block.text !== editingText) {
      addTextEdit({
        blockId: selectedBlockId,
        originalText: block.text,
        newText: editingText,
        timestamp: Date.now(),
      });
    }

    selectBlock(null);
  }, [selectedBlockId, editingText, pageBlocks, addTextEdit, selectBlock]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        selectBlock(null);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        inputRef.current?.blur(); // Triggers handleBlur
      }
    },
    [selectBlock]
  );

  const handleLayerClick = useCallback(() => {
    selectBlock(null);
  }, [selectBlock]);

  // Don't render if not in text edit mode
  if (mode !== 'text') return null;

  return (
    <div className="text-edit-layer" onClick={handleLayerClick}>
      {isLoading && (
        <div className="text-edit-loading">
          <span>Detecting text blocks...</span>
        </div>
      )}

      {pageBlocks.map((block) => {
        const style = transformRect(block);
        const isSelected = selectedBlockId === block.id;

        return (
          <div
            key={block.id}
            className={`text-block-box ${isSelected ? 'editing' : ''}`}
            style={{
              left: style.left,
              top: style.top,
              width: style.width,
              height: style.height,
            }}
            onClick={(e) => handleBlockClick(block, e)}
          >
            {isSelected ? (
              <textarea
                ref={inputRef}
                className="text-edit-input"
                style={{
                  fontSize: style.fontSize,
                  fontFamily: style.fontFamily,
                  color: style.color,
                  lineHeight: `${style.height}px`,
                }}
                value={editingText}
                onChange={handleTextChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
              />
            ) : (
              <div
                className="text-original"
                style={{
                  fontSize: style.fontSize,
                  fontFamily: style.fontFamily,
                  color: style.color,
                  lineHeight: `${style.height}px`,
                }}
              >
                {block.text}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
