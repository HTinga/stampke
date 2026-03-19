import { useEffect, useCallback } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { useAnnotationStore } from '../../src/store';
import { getEffectiveRotation } from '../../src/utils/pdfUtils';

interface TextSelectionHandlerProps {
  page: PDFPageProxy;
  pageNumber: number;
  scale: number;
  rotation: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function TextSelectionHandler({
  page,
  pageNumber,
  scale,
  rotation,
  containerRef,
}: TextSelectionHandlerProps) {
  const { currentTool, addAnnotation, toolSettings } = useAnnotationStore();

  const handleSelection = useCallback(() => {
    // Only handle selection for markup tools
    if (!['highlight', 'underline', 'strikeout'].includes(currentTool)) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const container = containerRef.current;
    if (!container) return;

    // Check if selection is within this page
    if (!container.contains(selection.anchorNode) || !container.contains(selection.focusNode)) {
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rects = Array.from(range.getClientRects());
      const containerRect = container.getBoundingClientRect();

      // Calculate effective rotation
      const effectiveRotation = getEffectiveRotation(page, rotation);
      const viewport = page.getViewport({ scale, rotation: effectiveRotation });

      // Convert client rects to PDF coordinates
      const pdfRects = rects.map((rect) => {
        // Convert to viewport coordinates (relative to container)
        const viewportX = rect.left - containerRect.left;
        const viewportY = rect.top - containerRect.top;
        const width = rect.width;
        const height = rect.height;

        // Convert to PDF coordinates based on rotation
        let pdfX = viewportX / scale;
        let pdfY = viewportY / scale;
        let pdfWidth = width / scale;
        let pdfHeight = height / scale;

        const pageWidth = viewport.width / scale;
        const pageHeight = viewport.height / scale;

        switch (effectiveRotation) {
          case 90:
            [pdfX, pdfY] = [pageWidth - pdfY - pdfHeight, pdfX];
            [pdfWidth, pdfHeight] = [pdfHeight, pdfWidth];
            break;
          case 180:
            pdfX = pageWidth - pdfX - pdfWidth;
            pdfY = pageHeight - pdfY - pdfHeight;
            break;
          case 270:
            [pdfX, pdfY] = [pdfY, pageHeight - pdfX - pdfWidth];
            [pdfWidth, pdfHeight] = [pdfHeight, pdfWidth];
            break;
        }

        return {
          x: pdfX,
          y: pdfY,
          width: pdfWidth,
          height: pdfHeight,
        };
      });

      if (pdfRects.length > 0) {
        // Create annotation
        const annotation = {
          id: `markup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: currentTool,
          page: pageNumber,
          x: pdfRects[0].x,
          y: pdfRects[0].y,
          rects: pdfRects,
          color: toolSettings.color,
          opacity: toolSettings.opacity,
          text: selection.toString(),
        };

        addAnnotation(annotation);

        // Clear selection
        selection.removeAllRanges();
      }
    } catch (error) {
      console.error('Error handling text selection:', error);
    }
  }, [currentTool, page, pageNumber, scale, rotation, containerRef, addAnnotation, toolSettings]);

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
    };
  }, [handleSelection]);

  return null;
}
