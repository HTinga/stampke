import { useEffect, useRef, useState, useCallback } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { useAnnotationStore } from '../../store';
import type { AnnotationTool } from '../../store';
import type { PendingImageData } from '../MainToolbar';
import { getEffectiveRotation } from '../../utils/pdfUtils';
import './DrawingAnnotationLayer.css';

interface DrawingAnnotationLayerProps {
  page: PDFPageProxy;
  pageNumber: number;
  scale: number;
  rotation: number;
  pendingImages?: PendingImageData[];
  onImagePlaced?: () => void;
}

export function DrawingAnnotationLayer({
  page,
  pageNumber,
  scale,
  rotation,
  pendingImages,
  onImagePlaced,
}: DrawingAnnotationLayerProps) {
  const {
    currentTool,
    toolSettings,
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectedAnnotationId,
    selectAnnotation,
  } = useAnnotationStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Get annotations for this page
  const pageAnnotations = Object.values(annotations).filter(
    (a) => a.page === pageNumber
  );

  // Set up canvas dimensions
  useEffect(() => {
    if (!page) return;

    const effectiveRotation = getEffectiveRotation(page, rotation);
    const viewport = page.getViewport({ scale, rotation: effectiveRotation });

    setDimensions({
      width: viewport.width,
      height: viewport.height,
    });
  }, [page, scale, rotation]);

  // Draw all annotations
  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved annotations
    pageAnnotations.forEach((annotation) => {
      ctx.save();

      // Apply styles
      ctx.strokeStyle = annotation.color || '#000000';
      ctx.fillStyle = annotation.fillColor || 'transparent';
      ctx.lineWidth = (annotation.strokeWidth || 2) * scale;
      ctx.globalAlpha = annotation.opacity || 1;

      // Draw based on type
      switch (annotation.type) {
        case 'ink':
          if (annotation.path && annotation.path.length > 0) {
            ctx.beginPath();
            ctx.moveTo(annotation.path[0].x * scale, annotation.path[0].y * scale);
            for (let i = 1; i < annotation.path.length; i++) {
              ctx.lineTo(annotation.path[i].x * scale, annotation.path[i].y * scale);
            }
            ctx.stroke();
          }
          break;
        case 'rectangle':
          if (annotation.rect) {
            ctx.strokeRect(
              annotation.rect.x * scale,
              annotation.rect.y * scale,
              annotation.rect.width * scale,
              annotation.rect.height * scale
            );
            if (annotation.fillColor) {
              ctx.fillRect(
                annotation.rect.x * scale,
                annotation.rect.y * scale,
                annotation.rect.width * scale,
                annotation.rect.height * scale
              );
            }
          }
          break;
        case 'ellipse':
          if (annotation.rect) {
            const centerX = (annotation.rect.x + annotation.rect.width / 2) * scale;
            const centerY = (annotation.rect.y + annotation.rect.height / 2) * scale;
            const radiusX = (annotation.rect.width / 2) * scale;
            const radiusY = (annotation.rect.height / 2) * scale;

            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            ctx.stroke();
            if (annotation.fillColor) {
              ctx.fill();
            }
          }
          break;
        case 'line':
        case 'arrow':
          if (annotation.points && annotation.points.length >= 2) {
            const startX = annotation.points[0].x * scale;
            const startY = annotation.points[0].y * scale;
            const endX = annotation.points[1].x * scale;
            const endY = annotation.points[1].y * scale;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            if (annotation.type === 'arrow') {
              // Draw arrow head
              const angle = Math.atan2(endY - startY, endX - startX);
              const headLength = 10 * scale;
              
              ctx.beginPath();
              ctx.moveTo(endX, endY);
              ctx.lineTo(
                endX - headLength * Math.cos(angle - Math.PI / 6),
                endY - headLength * Math.sin(angle - Math.PI / 6)
              );
              ctx.moveTo(endX, endY);
              ctx.lineTo(
                endX - headLength * Math.cos(angle + Math.PI / 6),
                endY - headLength * Math.sin(angle + Math.PI / 6)
              );
              ctx.stroke();
            }
          }
          break;
        case 'highlight':
          if (annotation.rects) {
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = annotation.color || '#ffff00';
            ctx.globalAlpha = annotation.opacity || 0.5;
            
            annotation.rects.forEach((rect: any) => {
              ctx.fillRect(
                rect.x * scale,
                rect.y * scale,
                rect.width * scale,
                rect.height * scale
              );
            });
            
            ctx.globalCompositeOperation = 'source-over';
          }
          break;
        case 'image':
        case 'stamp':
        case 'signature':
          if (annotation.image && annotation.rect) {
            try {
              const img = new Image();
              img.src = annotation.image;
              // We'd normally wait for load, but for synchronous drawing in React
              // we rely on the browser having cached the data URL
              if (img.complete) {
                ctx.drawImage(
                  img,
                  annotation.rect.x * scale,
                  annotation.rect.y * scale,
                  annotation.rect.width * scale,
                  annotation.rect.height * scale
                );
              }
            } catch (e) {
              console.error('Failed to draw image annotation', e);
            }
          }
          break;
      }

      // Draw selection highlight
      if (selectedAnnotationId === annotation.id) {
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        let bounds = { x: 0, y: 0, width: 0, height: 0 };
        
        if (annotation.rect) {
          bounds = annotation.rect;
        } else if (annotation.path && annotation.path.length > 0) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          annotation.path.forEach((p: any) => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          });
          bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        } else if (annotation.points && annotation.points.length >= 2) {
          const minX = Math.min(annotation.points[0].x, annotation.points[1].x);
          const minY = Math.min(annotation.points[0].y, annotation.points[1].y);
          const maxX = Math.max(annotation.points[0].x, annotation.points[1].x);
          const maxY = Math.max(annotation.points[0].y, annotation.points[1].y);
          bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }
        
        if (bounds.width > 0 && bounds.height > 0) {
          const padding = 4 / scale;
          ctx.strokeRect(
            (bounds.x - padding) * scale,
            (bounds.y - padding) * scale,
            (bounds.width + padding * 2) * scale,
            (bounds.height + padding * 2) * scale
          );
        }
        
        ctx.setLineDash([]);
      }

      ctx.restore();
    });

    // Draw current drawing path
    if (isDrawing && currentPath.length > 0) {
      ctx.save();
      ctx.strokeStyle = toolSettings.color;
      ctx.lineWidth = toolSettings.strokeWidth * scale;
      ctx.globalAlpha = toolSettings.opacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (currentTool === 'ink') {
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x * scale, currentPath[0].y * scale);
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x * scale, currentPath[i].y * scale);
        }
        ctx.stroke();
      } else if (startPoint && currentPath.length > 0) {
        const endPoint = currentPath[currentPath.length - 1];
        
        if (currentTool === 'rectangle') {
          ctx.strokeRect(
            Math.min(startPoint.x, endPoint.x) * scale,
            Math.min(startPoint.y, endPoint.y) * scale,
            Math.abs(endPoint.x - startPoint.x) * scale,
            Math.abs(endPoint.y - startPoint.y) * scale
          );
        } else if (currentTool === 'ellipse') {
          const centerX = (startPoint.x + endPoint.x) / 2 * scale;
          const centerY = (startPoint.y + endPoint.y) / 2 * scale;
          const radiusX = Math.abs(endPoint.x - startPoint.x) / 2 * scale;
          const radiusY = Math.abs(endPoint.y - startPoint.y) / 2 * scale;
          
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (currentTool === 'line' || currentTool === 'arrow') {
          ctx.beginPath();
          ctx.moveTo(startPoint.x * scale, startPoint.y * scale);
          ctx.lineTo(endPoint.x * scale, endPoint.y * scale);
          ctx.stroke();
          
          if (currentTool === 'arrow') {
            const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
            const headLength = 10 * scale;
            
            ctx.beginPath();
            ctx.moveTo(endPoint.x * scale, endPoint.y * scale);
            ctx.lineTo(
              (endPoint.x - headLength * Math.cos(angle - Math.PI / 6) / scale) * scale,
              (endPoint.y - headLength * Math.sin(angle - Math.PI / 6) / scale) * scale
            );
            ctx.moveTo(endPoint.x * scale, endPoint.y * scale);
            ctx.lineTo(
              (endPoint.x - headLength * Math.cos(angle + Math.PI / 6) / scale) * scale,
              (endPoint.y - headLength * Math.sin(angle + Math.PI / 6) / scale) * scale
            );
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    }
  }, [pageAnnotations, isDrawing, currentPath, startPoint, currentTool, toolSettings, scale, selectedAnnotationId]);

  // Redraw when dependencies change
  useEffect(() => {
    drawAnnotations();
  }, [drawAnnotations]);

  // Handle pointer events for drawing
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (currentTool === 'select' || currentTool === 'pan') {
      // Handle selection logic here if needed
      return;
    }

    // Don't draw if it's a markup tool (handled by TextSelectionHandler)
    if (['highlight', 'underline', 'strikeout'].includes(currentTool)) return;

    // Handle image placement
    if (currentTool === 'image' && pendingImages && pendingImages.length > 0) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const pendingImage = pendingImages[0];
      
      // Default size, could be based on actual image dimensions
      const width = 100;
      const height = 100;

      addAnnotation({
        id: `image-${Date.now()}`,
        type: 'image',
        page: pageNumber,
        x,
        y,
        rect: { x, y, width, height },
        image: pendingImage.imageData,
      });

      if (onImagePlaced) {
        onImagePlaced();
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentPath([{ x, y }]);
    selectAnnotation(null);
    
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [currentTool, scale, pendingImages, pageNumber, addAnnotation, onImagePlaced, selectAnnotation]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setCurrentPath((prev) => [...prev, { x, y }]);
  }, [isDrawing, scale]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDrawing || !startPoint) return;

    setIsDrawing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    const endPoint = currentPath[currentPath.length - 1];
    if (!endPoint) return;

    // Only save if there's actual movement
    const hasMoved = Math.abs(endPoint.x - startPoint.x) > 1 || Math.abs(endPoint.y - startPoint.y) > 1;
    
    if (hasMoved || currentTool === 'ink') {
      const baseAnnotation = {
        id: `${currentTool}-${Date.now()}`,
        type: currentTool,
        page: pageNumber,
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        color: toolSettings.color,
        opacity: toolSettings.opacity,
        strokeWidth: toolSettings.strokeWidth,
      };

      if (currentTool === 'ink') {
        addAnnotation({
          ...baseAnnotation,
          path: currentPath,
        });
      } else if (['rectangle', 'ellipse'].includes(currentTool)) {
        addAnnotation({
          ...baseAnnotation,
          rect: {
            x: Math.min(startPoint.x, endPoint.x),
            y: Math.min(startPoint.y, endPoint.y),
            width: Math.abs(endPoint.x - startPoint.x),
            height: Math.abs(endPoint.y - startPoint.y),
          },
          fillColor: 'transparent', // Could add fill color to settings
        });
      } else if (['line', 'arrow'].includes(currentTool)) {
        addAnnotation({
          ...baseAnnotation,
          points: [startPoint, endPoint],
        });
      }
    }

    setStartPoint(null);
    setCurrentPath([]);
  }, [isDrawing, startPoint, currentPath, currentTool, pageNumber, toolSettings, addAnnotation]);

  return (
    <div
      ref={containerRef}
      className={`drawing-annotation-layer ${currentTool !== 'select' && currentTool !== 'pan' ? 'drawing-mode' : ''}`}
      data-tool={currentTool}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <canvas
        ref={canvasRef}
        className="annotation-canvas"
        width={dimensions.width}
        height={dimensions.height}
        style={{ width: dimensions.width, height: dimensions.height }}
      />
    </div>
  );
}
