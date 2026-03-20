import { useCallback, useEffect, useState, useRef } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { useEditingStore } from '../../src/store';
import { detectImages } from '../../src/utils/pdfUtils';
import type { PDFImage } from '../../src/editing/types';
import './ImageEditLayer.css';

interface ImageEditLayerProps {
  page: PDFPageProxy;
  pageNumber: number;
  scale: number;
  rotation: number;
}

// ── Background removal via canvas ──────────────
async function removeBackground(dataUrl: string, tolerance = 30): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Sample corner pixels as background candidates
      const corners = [0, 3, (canvas.width - 1) * 4, (canvas.height - 1) * canvas.width * 4];
      const bgSamples = corners.map(i => ({ r: data[i], g: data[i + 1], b: data[i + 2] }));

      const isBackground = (r: number, g: number, b: number) => {
        return bgSamples.some(s =>
          Math.abs(r - s.r) < tolerance &&
          Math.abs(g - s.g) < tolerance &&
          Math.abs(b - s.b) < tolerance
        );
      };

      // Flood-fill from edges
      const visited = new Uint8Array(canvas.width * canvas.height);
      const queue: number[] = [];

      const enqueue = (x: number, y: number) => {
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;
        const idx = y * canvas.width + x;
        if (visited[idx]) return;
        const pi = idx * 4;
        if (isBackground(data[pi], data[pi + 1], data[pi + 2])) {
          visited[idx] = 1;
          queue.push(x, y);
        }
      };

      // Seed from all 4 edges
      for (let x = 0; x < canvas.width; x++) { enqueue(x, 0); enqueue(x, canvas.height - 1); }
      for (let y = 0; y < canvas.height; y++) { enqueue(0, y); enqueue(canvas.width - 1, y); }

      while (queue.length > 0) {
        const y = queue.pop()!;
        const x = queue.pop()!;
        const pi = (y * canvas.width + x) * 4;
        data[pi + 3] = 0; // Make transparent
        enqueue(x + 1, y); enqueue(x - 1, y);
        enqueue(x, y + 1); enqueue(x, y - 1);
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ── Rasterize an image from the PDF page ──────
async function rasterizeImage(page: PDFPageProxy, img: PDFImage): Promise<string | null> {
  try {
    const scale = 2; // High-res capture
    const viewport = page.getViewport({ scale, rotation: 0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport, canvas: null as any }).promise;

    // Crop to image rect
    const pageHeight = page.getViewport({ scale: 1 }).height;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = Math.round(img.rect.width * scale);
    cropCanvas.height = Math.round(img.rect.height * scale);
    const cropCtx = cropCanvas.getContext('2d')!;
    cropCtx.drawImage(
      canvas,
      img.rect.x * scale, img.rect.y * scale,
      img.rect.width * scale, img.rect.height * scale,
      0, 0, cropCanvas.width, cropCanvas.height
    );
    return cropCanvas.toDataURL('image/png');
  } catch { return null; }
}

export function ImageEditLayer({ page, pageNumber, scale, rotation }: ImageEditLayerProps) {
  const { mode, images, setImages, selectedImageId, selectImage, addImageEdit } = useEditingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());
  const [showToast, setShowToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageImages = images.get(pageNumber) || [];

  useEffect(() => {
    if (mode !== 'image') return;
    if (images.has(pageNumber)) return;
    setIsLoading(true);
    detectImages(page)
      .then(detected => setImages(pageNumber, detected))
      .catch(err => console.error('Failed to detect images:', err))
      .finally(() => setIsLoading(false));
  }, [mode, page, pageNumber, images, setImages]);

  const toast = (msg: string) => { setShowToast(msg); setTimeout(() => setShowToast(null), 2500); };

  const getRect = useCallback((img: PDFImage) => {
    const viewport = page.getViewport({ scale: 1, rotation: 0 });
    const pageW = viewport.width, pageH = viewport.height;
    let { x, y, width, height } = img.rect;
    switch (rotation) {
      case 90: { const nx = y; const ny = pageW - x - width; [x, y] = [nx, ny]; [width, height] = [height, width]; break; }
      case 180: x = pageW - x - width; y = pageH - y - height; break;
      case 270: { const nx2 = pageH - y - height; const ny2 = x; [x, y] = [nx2, ny2]; [width, height] = [height, width]; break; }
    }
    return { left: x * scale, top: y * scale, width: width * scale, height: height * scale };
  }, [page, rotation, scale]);

  const handleClick = useCallback((img: PDFImage, e: React.MouseEvent) => {
    e.stopPropagation();
    selectImage(selectedImageId === img.id ? null : img.id);
  }, [selectImage, selectedImageId]);

  const handleReplace = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedImageId) return;
    const selectedImage = pageImages.find(img => img.id === selectedImageId);
    if (!selectedImage) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Also create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => new Map(prev).set(selectedImageId, url));
      addImageEdit({ imageId: selectedImageId, type: 'replace', newImageData: arrayBuffer, timestamp: Date.now() });
      toast('Image replaced successfully');
    } catch (err) { console.error('Failed to read image file:', err); toast('Failed to replace image'); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedImageId, pageImages, addImageEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedImageId) return;
    addImageEdit({ imageId: selectedImageId, type: 'delete', timestamp: Date.now() });
    selectImage(null);
    toast('Image removed');
  }, [selectedImageId, addImageEdit, selectImage]);

  const handleRemoveBg = useCallback(async (img: PDFImage, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(img.id);
    try {
      // Rasterize the image from the PDF, then remove background
      const dataUrl = await rasterizeImage(page, img);
      if (!dataUrl) { toast('Could not extract image'); return; }
      const result = await removeBackground(dataUrl);
      // Convert back to ArrayBuffer for edit
      const res = await fetch(result);
      const buf = await res.arrayBuffer();
      addImageEdit({ imageId: img.id, type: 'replace', newImageData: buf, timestamp: Date.now() });
      setPreviewUrls(prev => new Map(prev).set(img.id, result));
      toast('Background removed ✓');
    } catch { toast('Background removal failed'); }
    finally { setProcessingId(null); }
  }, [page, addImageEdit]);

  const handleLayerClick = useCallback(() => selectImage(null), [selectImage]);

  if (mode !== 'image') return null;

  return (
    <div className="image-edit-layer" onClick={handleLayerClick}>
      {isLoading && (
        <div className="image-edit-loading">
          <div className="image-edit-spinner" />
          <span>Detecting images…</span>
        </div>
      )}

      {!isLoading && pageImages.length === 0 && (
        <div className="image-edit-empty">No images detected on this page</div>
      )}

      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFileChange} style={{ display: 'none' }} />

      {/* Toast */}
      {showToast && <div className="image-toast">{showToast}</div>}

      {pageImages.map(img => {
        const s = getRect(img);
        const isSelected = selectedImageId === img.id;
        const isProcessing = processingId === img.id;
        const preview = previewUrls.get(img.id);

        return (
          <div
            key={img.id}
            className={`image-box${isSelected ? ' selected' : ''}`}
            style={s}
            onClick={e => handleClick(img, e)}
          >
            {/* Image preview if replaced */}
            {preview && <img src={preview} alt="" className="image-preview-overlay" />}

            {/* Label when not selected */}
            {!isSelected && <span className="image-label">IMAGE</span>}

            {/* Selection controls */}
            {isSelected && (
              <div className="image-controls-panel" onClick={e => e.stopPropagation()}>
                <div className="image-controls-header">
                  <span>Image</span>
                  <button className="image-ctrl-close" onClick={() => selectImage(null)}>✕</button>
                </div>
                <div className="image-controls-btns">
                  <button className="image-btn accent" onClick={handleReplace} title="Replace with another image">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Replace
                  </button>
                  <button
                    className={`image-btn${isProcessing ? ' processing' : ' primary'}`}
                    onClick={e => handleRemoveBg(img, e)}
                    disabled={isProcessing}
                    title="Remove background"
                  >
                    {isProcessing ? (
                      <><div className="btn-spinner" />Processing…</>
                    ) : (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3l18 18M10.5 10.677a2 2 0 1 0 2.823 2.823"/><path d="M7.362 7.561C5.68 8.74 4.279 10.42 3 12c1.889 2.991 5.282 6 9 6 1.55 0 3.043-.523 4.395-1.35M12 3c3.6 0 6.8 2.7 9 5.4"/></svg>Remove BG</>
                    )}
                  </button>
                  <button className="image-btn danger" onClick={handleDelete} title="Delete image">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                    Delete
                  </button>
                </div>
                <div className="image-ctrl-info">
                  {Math.round(img.rect.width)}×{Math.round(img.rect.height)}px
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
