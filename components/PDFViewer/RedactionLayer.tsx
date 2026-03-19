import { useCallback, useState, useRef } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { useEditingStore } from '../../src/store';
import type { RedactionArea } from '../../src/editing/types';
import './RedactionLayer.css';

interface RedactionLayerProps {
  page: PDFPageProxy;
  pageNumber: number;
  scale: number;
  rotation: number;
}

export function RedactionLayer({
  page,
  pageNumber,
  scale,
  rotation,
}: RedactionLayerProps) {
  const {
    mode,
    redactions,
    addRedaction,
    removeRedaction,
    markRedactionApplied,
  } = useEditingStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRedactions = redactions.filter((r) => r.pageNumber === pageNumber);

  // Transform rect based on rotation
  const transformRect = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) => {
      const viewport = page.getViewport({ scale: 1, rotation: 0 });
      const pageWidth = viewport.width;
      const pageHeight = viewport.height;

      let { x, y, width, height } = rect;

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
      };
    },
    [page, rotation, scale]
  );

  // Inverse transform for drawing
  const inverseTransformPoint = useCallback(
    (x: number, y: number) => {
      const viewport = page.getViewport({ scale: 1, rotation: 0 });
      const pageWidth = viewport.width;
      const pageHeight = viewport.height;

      let pdfX = x / scale;
      let pdfY = y / scale;

      switch (rotation) {
        case 90:
          [pdfX, pdfY] = [pageWidth - pdfY, pdfX];
          break;
        case 180:
          pdfX = pageWidth - pdfX;
          pdfY = pageHeight - pdfY;
          break;
        case 270:
          [pdfX, pdfY] = [pdfY, pageHeight - pdfX];
          break;
      }

      return { x: pdfX, y: pdfY };
    },
    [page, rotation, scale]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (mode !== 'redact') return;
      if (e.button !== 0) return; // Only left click

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDrawing(true);
      setStartPoint({ x, y });
      setCurrentPoint({ x, y });
      setSelectedId(null);
      
      // Capture pointer to continue drawing even if mouse leaves container
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [mode]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing || !startPoint) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      setCurrentPoint({ x, y });
    },
    [isDrawing, startPoint]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing || !startPoint || !currentPoint) return;

      setIsDrawing(false);
      e.currentTarget.releasePointerCapture(e.pointerId);

      // Require a minimum size
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.y - startPoint.y);

      if (width > 5 && height > 5) {
        const left = Math.min(startPoint.x, currentPoint.x);
        const top = Math.min(startPoint.y, currentPoint.y);

        // Convert to PDF coordinates
        const pdfStart = inverseTransformPoint(left, top);
        const pdfEnd = inverseTransformPoint(left + width, top + height);

        const pdfLeft = Math.min(pdfStart.x, pdfEnd.x);
        const pdfTop = Math.min(pdfStart.y, pdfEnd.y);
        const pdfWidth = Math.abs(pdfEnd.x - pdfStart.x);
        const pdfHeight = Math.abs(pdfEnd.y - pdfStart.y);

        addRedaction({
          id: crypto.randomUUID(),
          pageNumber,
          rect: {
            x: pdfLeft,
            y: pdfTop,
            width: pdfWidth,
            height: pdfHeight,
          },
          overlayColor: 'black',
          applied: false,
        });
      }

      setStartPoint(null);
      setCurrentPoint(null);
    },
    [isDrawing, startPoint, currentPoint, pageNumber, addRedaction, inverseTransformPoint]
  );

  const handleAreaClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (mode !== 'redact') return;
      setSelectedId(id);
    },
    [mode]
  );

  const handleApplyClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      markRedactionApplied(id);
      setSelectedId(null);
    },
    [markRedactionApplied]
  );

  const handleDeleteClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      removeRedaction(id);
      setSelectedId(null);
    },
    [removeRedaction]
  );

  if (mode !== 'redact' && pageRedactions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`redaction-layer ${mode === 'redact' ? 'redaction-mode' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Render existing redactions */}
      {pageRedactions.map((redaction) => {
        const style = transformRect(redaction.rect);
        const isSelected = selectedId === redaction.id;
        const isApplied = redaction.applied === true;

        return (
          <div
            key={redaction.id}
            className={`redaction-area ${isApplied ? 'applied' : 'pending'} ${isSelected ? 'selected' : ''}`}
            style={style}
            onClick={(e) => !isApplied && handleAreaClick(redaction.id, e)}
          >
            {!isApplied && <span className="redaction-label">REDACT</span>}
            
            {isSelected && !isApplied && (
              <div className="redaction-controls">
                <button
                  className="redaction-btn apply"
                  onClick={(e) => handleApplyClick(redaction.id, e)}
                  title="Apply redaction (cannot be undone)"
                >
                  Apply
                </button>
                <button
                  className="redaction-btn delete"
                  onClick={(e) => handleDeleteClick(redaction.id, e)}
                  title="Remove redaction mark"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Render active drawing */}
      {isDrawing && startPoint && currentPoint && (
        <div
          className="redaction-drawing"
          style={{
            left: Math.min(startPoint.x, currentPoint.x),
            top: Math.min(startPoint.y, currentPoint.y),
            width: Math.abs(currentPoint.x - startPoint.x),
            height: Math.abs(currentPoint.y - startPoint.y),
          }}
        />
      )}
    </div>
  );
}
