import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.js?url';
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export { pdfjsLib };

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  color: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
}

export interface BoxStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  opacity?: number;
}

export interface RichTextSegment {
  text: string;
  style: Partial<TextStyle>;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface Outline {
  title: string;
  pageNumber: number;
  children?: Outline[];
}

export interface PageRange {
  start: number;
  end: number;
}

export interface SplitOptions {
  mode: 'ranges' | 'every-n-pages' | 'extract-pages';
  ranges?: PageRange[];
  everyN?: number;
  pages?: number[];
}

export interface InsertOptions {
  position: number;
  count?: number;
  width?: number;
  height?: number;
}

export interface RenderOptions {
  scale: number;
  rotation: number;
  canvasContext: CanvasRenderingContext2D;
}

export interface PageDimensions {
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

export interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
  transform: number[];
}

export interface TextLine {
  items: TextItem[];
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseline: number;
}

export interface TextBlock {
  id: string;
  pageNumber: number;
  lines: TextLine[];
  text: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    fontName: string;
    fontSize: number;
    fontColor?: string;
    alignment: 'left' | 'center' | 'right' | 'justify';
    lineHeight: number;
  };
  editable: boolean;
}

export interface PDFImage {
  id: string;
  pageNumber: number;
  objectName: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  originalRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface RedactionArea {
  id: string;
  pageNumber: number;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  overlayText?: string;
  overlayColor: string;
  applied: boolean;
}

// ============================================================================
// Errors
// ============================================================================

export class PDFLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PDFLoadError';
  }
}

export class PDFRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PDFRenderError';
  }
}

// ============================================================================
// Color Utilities
// ============================================================================

export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function rgbaToString(rgba: RGBA): string {
  return `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}, ${rgba.a})`;
}

export function parseRgba(color: string): RGBA | null {
  if (!color) return null;
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[4] ? parseFloat(match[4]) : 1,
    };
  }
  // Fallback for hex
  const rgb = hexToRgb(color);
  if (rgb) return { ...rgb, a: 1 };
  return null;
}

export function adjustBrightness(rgb: RGB, amount: number): RGB {
  return {
    r: Math.max(0, Math.min(255, rgb.r + amount)),
    g: Math.max(0, Math.min(255, rgb.g + amount)),
    b: Math.max(0, Math.min(255, rgb.b + amount)),
  };
}

// ============================================================================
// PDF.js Utilities
// ============================================================================

export async function loadPDFDocument(
  source: string | ArrayBuffer | Uint8Array
): Promise<PDFDocumentProxy> {
  try {
    const loadingTask = typeof source === 'string' 
      ? pdfjsLib.getDocument(source)
      : pdfjsLib.getDocument({ 
          data: source instanceof Uint8Array ? source.slice() : new Uint8Array(source).slice() 
        });
    return await loadingTask.promise;
  } catch (error) {
    throw new PDFLoadError(
      error instanceof Error ? error.message : 'Failed to load PDF document'
    );
  }
}

export async function getPDFMetadata(doc: PDFDocumentProxy): Promise<PDFMetadata> {
  const metadata = await doc.getMetadata();
  const info = metadata.info as Record<string, unknown>;

  return {
    title: info.Title as string | undefined,
    author: info.Author as string | undefined,
    subject: info.Subject as string | undefined,
    keywords: info.Keywords as string | undefined,
    creator: info.Creator as string | undefined,
    producer: info.Producer as string | undefined,
    creationDate: info.CreationDate ? new Date(info.CreationDate as string) : undefined,
    modificationDate: info.ModDate ? new Date(info.ModDate as string) : undefined,
  };
}

export async function getPDFOutline(doc: PDFDocumentProxy): Promise<Outline[]> {
  const outline = await doc.getOutline();
  if (!outline) return [];

  const processOutline = async (items: any[]): Promise<Outline[]> => {
    const result: Outline[] = [];
    for (const item of items) {
      const dest = item.dest;
      let pageNumber = 1;

      if (typeof dest === 'string') {
        const destination = await doc.getDestination(dest);
        if (destination) {
          const pageIndex = await doc.getPageIndex(destination[0]);
          pageNumber = pageIndex + 1;
        }
      } else if (Array.isArray(dest)) {
        const pageIndex = await doc.getPageIndex(dest[0]);
        pageNumber = pageIndex + 1;
      }

      result.push({
        title: item.title,
        pageNumber,
        children: item.items ? await processOutline(item.items) : undefined,
      });
    }
    return result;
  };

  return processOutline(outline);
}

export async function getPage(
  doc: PDFDocumentProxy,
  pageNumber: number
): Promise<PDFPageProxy> {
  if (pageNumber < 1 || pageNumber > doc.numPages) {
    throw new PDFRenderError(`Invalid page number: ${pageNumber}`);
  }
  return doc.getPage(pageNumber);
}

// ============================================================================
// pdf-lib Utilities
// ============================================================================

export async function mergePDFs(files: (ArrayBuffer | Uint8Array)[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const pdf = await PDFDocument.load(file);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }

  return mergedPdf.save();
}

export async function splitPDF(
  source: ArrayBuffer | Uint8Array,
  options: SplitOptions
): Promise<Uint8Array[]> {
  const sourcePdf = await PDFDocument.load(source);
  const totalPages = sourcePdf.getPageCount();
  const results: Uint8Array[] = [];

  if (options.mode === 'ranges' && options.ranges) {
    for (const range of options.ranges) {
      const newPdf = await PDFDocument.create();
      const startIdx = Math.max(0, range.start - 1);
      const endIdx = Math.min(totalPages - 1, range.end - 1);

      const pageIndices: number[] = [];
      for (let i = startIdx; i <= endIdx; i++) {
        pageIndices.push(i);
      }

      const pages = await newPdf.copyPages(sourcePdf, pageIndices);
      pages.forEach(page => newPdf.addPage(page));
      results.push(await newPdf.save());
    }
  } else if (options.mode === 'every-n-pages' && options.everyN) {
    const n = options.everyN;
    for (let i = 0; i < totalPages; i += n) {
      const newPdf = await PDFDocument.create();
      const pageIndices: number[] = [];
      for (let j = i; j < Math.min(i + n, totalPages); j++) {
        pageIndices.push(j);
      }
      const pages = await newPdf.copyPages(sourcePdf, pageIndices);
      pages.forEach(page => newPdf.addPage(page));
      results.push(await newPdf.save());
    }
  } else if (options.mode === 'extract-pages' && options.pages) {
    const newPdf = await PDFDocument.create();
    const pageIndices = options.pages
      .map(p => p - 1)
      .filter(i => i >= 0 && i < totalPages);
    const pages = await newPdf.copyPages(sourcePdf, pageIndices);
    pages.forEach(page => newPdf.addPage(page));
    results.push(await newPdf.save());
  }

  return results;
}

export async function reorderPages(
  source: ArrayBuffer | Uint8Array,
  newOrder: number[]
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(source);
  const newPdf = await PDFDocument.create();

  const pageIndices = newOrder.map(p => p - 1);
  const pages = await newPdf.copyPages(sourcePdf, pageIndices);
  pages.forEach(page => newPdf.addPage(page));

  return newPdf.save();
}

export async function rotatePages(
  source: ArrayBuffer | Uint8Array,
  pageNumbers: number[],
  rotationDegrees: 90 | 180 | 270 | -90
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(source);
  const normalizedRotation = rotationDegrees < 0 ? 360 + rotationDegrees : rotationDegrees;

  for (const pageNum of pageNumbers) {
    const pageIndex = pageNum - 1;
    if (pageIndex >= 0 && pageIndex < pdf.getPageCount()) {
      const page = pdf.getPage(pageIndex);
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + normalizedRotation) % 360));
    }
  }

  return pdf.save();
}

export async function deletePages(
  source: ArrayBuffer | Uint8Array,
  pageNumbers: number[]
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(source);
  const totalPages = sourcePdf.getPageCount();
  const newPdf = await PDFDocument.create();

  const pagesToDelete = new Set(pageNumbers.map(p => p - 1));
  const pageIndicesToKeep: number[] = [];

  for (let i = 0; i < totalPages; i++) {
    if (!pagesToDelete.has(i)) {
      pageIndicesToKeep.push(i);
    }
  }

  if (pageIndicesToKeep.length === 0) {
    throw new Error('Cannot delete all pages');
  }

  const pages = await newPdf.copyPages(sourcePdf, pageIndicesToKeep);
  pages.forEach(page => newPdf.addPage(page));

  return newPdf.save();
}

export async function insertBlankPages(
  source: ArrayBuffer | Uint8Array,
  options: InsertOptions
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(source);
  const count = options.count || 1;
  const width = options.width || 612;
  const height = options.height || 792;

  let insertIndex = options.position === 0
    ? pdf.getPageCount()
    : options.position - 1;

  insertIndex = Math.max(0, Math.min(insertIndex, pdf.getPageCount()));

  for (let i = 0; i < count; i++) {
    pdf.insertPage(insertIndex + i, [width, height]);
  }

  return pdf.save();
}

export async function insertPagesFromPDF(
  targetSource: ArrayBuffer | Uint8Array,
  insertSource: ArrayBuffer | Uint8Array,
  position: number,
  pageNumbers?: number[]
): Promise<Uint8Array> {
  const targetPdf = await PDFDocument.load(targetSource);
  const sourcePdf = await PDFDocument.load(insertSource);

  const pageIndices = pageNumbers
    ? pageNumbers.map(p => p - 1).filter(i => i >= 0 && i < sourcePdf.getPageCount())
    : sourcePdf.getPageIndices();

  const pages = await targetPdf.copyPages(sourcePdf, pageIndices);

  let insertIndex = position === 0
    ? targetPdf.getPageCount()
    : position - 1;

  insertIndex = Math.max(0, Math.min(insertIndex, targetPdf.getPageCount()));

  pages.forEach((page, i) => {
    targetPdf.insertPage(insertIndex + i, page);
  });

  return targetPdf.save();
}

export async function downloadPDF(data: Uint8Array, fileName: string): Promise<void> {
  const blob = new Blob([new Uint8Array(data)], { type: 'application/pdf' });

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'PDF Document',
          accept: { 'application/pdf': ['.pdf'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.warn('File System Access API failed, falling back to traditional download:', err);
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Page Caching
// ============================================================================

interface CachedPage {
  page: PDFPageProxy;
  canvas: HTMLCanvasElement;
  scale: number;
  rotation: number;
  timestamp: number;
}

interface CacheOptions {
  maxPages: number;
  maxMemoryMB: number;
}

export class PDFPageCache {
  private cache: Map<string, CachedPage> = new Map();
  private options: CacheOptions;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      maxPages: 10,
      maxMemoryMB: 100,
      ...options,
    };
  }

  private getCacheKey(pageNumber: number, scale: number, rotation: number): string {
    return `${pageNumber}-${scale.toFixed(2)}-${rotation}`;
  }

  get(pageNumber: number, scale: number, rotation: number): HTMLCanvasElement | null {
    const key = this.getCacheKey(pageNumber, scale, rotation);
    const cached = this.cache.get(key);
    if (cached) {
      cached.timestamp = Date.now();
      return cached.canvas;
    }
    return null;
  }

  set(
    pageNumber: number,
    scale: number,
    rotation: number,
    page: PDFPageProxy,
    canvas: HTMLCanvasElement
  ): void {
    const key = this.getCacheKey(pageNumber, scale, rotation);
    if (this.cache.size >= this.options.maxPages) {
      this.evictOldest();
    }
    this.cache.set(key, {
      page,
      canvas,
      scale,
      rotation,
      timestamp: Date.now(),
    });
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }
    if (oldestKey) this.cache.delete(oldestKey);
  }

  invalidate(pageNumber?: number): void {
    if (pageNumber === undefined) {
      this.cache.clear();
    } else {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${pageNumber}-`)) {
          this.cache.delete(key);
        }
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const pageCache = new PDFPageCache();

// ============================================================================
// Rendering Utilities
// ============================================================================

export function getEffectiveRotation(page: PDFPageProxy, viewRotation: number = 0): number {
  const pageRotation = page.rotate || 0;
  return ((pageRotation + viewRotation) % 360 + 360) % 360;
}

export function getPageDimensions(
  page: PDFPageProxy,
  scale: number,
  viewRotation: number = 0
): PageDimensions {
  const effectiveRotation = getEffectiveRotation(page, viewRotation);
  const viewport = page.getViewport({ scale, rotation: effectiveRotation });
  const originalViewport = page.getViewport({ scale: 1, rotation: effectiveRotation });

  return {
    width: viewport.width,
    height: viewport.height,
    originalWidth: originalViewport.width,
    originalHeight: originalViewport.height,
  };
}

export async function renderPage(
  page: PDFPageProxy,
  options: RenderOptions
): Promise<void> {
  const { scale, rotation: viewRotation, canvasContext } = options;
  const effectiveRotation = getEffectiveRotation(page, viewRotation);
  const viewport = page.getViewport({ scale, rotation: effectiveRotation });

  const canvas = canvasContext.canvas;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const renderContext = {
    canvasContext,
    viewport,
    canvas,
  };

  const renderTask: RenderTask = page.render(renderContext);
  await renderTask.promise;
}

// ============================================================================
// Image Detection
// ============================================================================

export async function detectImages(page: PDFPageProxy): Promise<PDFImage[]> {
  const images: PDFImage[] = [];
  const viewport = page.getViewport({ scale: 1, rotation: 0 });
  const pageHeight = viewport.height;

  try {
    const operatorList = await page.getOperatorList();
    const OPS = (pdfjsLib as any).OPS || {};

    let imageCounter = 0;
    let currentTransform: number[] = [1, 0, 0, 1, 0, 0];
    const transformStack: number[][] = [];

    for (let i = 0; i < operatorList.fnArray.length; i++) {
      const fn = operatorList.fnArray[i];
      const args = operatorList.argsArray[i];

      if (fn === OPS.save) {
        transformStack.push([...currentTransform]);
      } else if (fn === OPS.restore) {
        const prev = transformStack.pop();
        if (prev) currentTransform = prev;
      } else if (fn === OPS.transform) {
        currentTransform = multiplyTransforms(currentTransform, args as number[]);
      } else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
        const imageName = args[0] as string;
        const [a, b, c, d, e, f] = currentTransform;
        const width = Math.sqrt(a * a + b * b);
        const height = Math.sqrt(c * c + d * d);
        const x = e;
        const y = pageHeight - f - height;

        images.push({
          id: `img-${page.pageNumber}-${imageCounter++}`,
          pageNumber: page.pageNumber,
          objectName: imageName,
          rect: { x, y, width, height },
          originalRect: { x, y, width, height },
        });
      }
    }
  } catch (err) {
    console.error('Failed to detect images:', err);
  }
  return images;
}

function multiplyTransforms(t1: number[], t2: number[]): number[] {
  const [a1, b1, c1, d1, e1, f1] = t1;
  const [a2, b2, c2, d2, e2, f2] = t2;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

export function findImageAtPoint(images: PDFImage[], x: number, y: number): PDFImage | null {
  for (let i = images.length - 1; i >= 0; i--) {
    const img = images[i];
    const { rect } = img;
    if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
      return img;
    }
  }
  return null;
}

// ============================================================================
// Redaction
// ============================================================================

export async function applyRedactions(
  pdfBytes: ArrayBuffer | Uint8Array,
  redactions: RedactionArea[]
): Promise<{ success: boolean; appliedCount: number; modifiedPdf: Uint8Array | null; errors: string[] }> {
  const errors: string[] = [];
  let appliedCount = 0;
  if (redactions.length === 0) return { success: true, appliedCount: 0, modifiedPdf: new Uint8Array(pdfBytes), errors: [] };

  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const redactionsByPage = new Map<number, RedactionArea[]>();
    for (const redaction of redactions) {
      const pageRedactions = redactionsByPage.get(redaction.pageNumber) || [];
      pageRedactions.push(redaction);
      redactionsByPage.set(redaction.pageNumber, pageRedactions);
    }

    const pages = pdfDoc.getPages();
    for (const [pageNum, pageRedactions] of redactionsByPage) {
      const pageIndex = pageNum - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) {
        errors.push(`Invalid page number: ${pageNum}`);
        continue;
      }
      const page = pages[pageIndex];
      const { height } = page.getSize();
      for (const redaction of pageRedactions) {
        try {
          const pdfY = height - redaction.rect.y - redaction.rect.height;
          const overlayColor = parseColor(redaction.overlayColor);
          page.drawRectangle({
            x: redaction.rect.x,
            y: pdfY,
            width: redaction.rect.width,
            height: redaction.rect.height,
            color: overlayColor,
            opacity: 1,
          });
          if (redaction.overlayText) {
            const fontSize = Math.min(12, redaction.rect.height * 0.6);
            const textWidth = font.widthOfTextAtSize(redaction.overlayText, fontSize);
            const textX = redaction.rect.x + (redaction.rect.width - textWidth) / 2;
            const textY = pdfY + (redaction.rect.height - fontSize) / 2;
            page.drawText(redaction.overlayText, { x: textX, y: textY, size: fontSize, font, color: rgb(1, 1, 1) });
          }
          appliedCount++;
        } catch (err) {
          errors.push(`Failed to apply redaction on page ${pageNum}: ${err}`);
        }
      }
    }

    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    const modifiedPdf = await pdfDoc.save({ useObjectStreams: false });
    return { success: errors.length === 0, appliedCount, modifiedPdf, errors };
  } catch (err) {
    return { success: false, appliedCount: 0, modifiedPdf: null, errors: [`Failed to process PDF: ${err}`] };
  }
}

function parseColor(colorStr: string): any {
  const hex = colorStr.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

// ============================================================================
// Text Block Detection
// ============================================================================

export async function detectTextBlocks(page: PDFPageProxy): Promise<TextBlock[]> {
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1, rotation: 0 });
  const pageHeight = viewport.height;

  const rawItems: TextItem[] = textContent.items
    .filter((item: any) => 'str' in item && item.str.trim() !== '')
    .map((item: any) => {
      const tx = item.transform;
      const x = tx[4];
      const y = pageHeight - tx[5];
      const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
      const width = item.width ?? fontSize * item.str.length * 0.55;
      const height = item.height ?? Math.max(fontSize * 1.2, 4);
      const color = (item as any).color
        ? `rgb(${Math.round((item as any).color[0]*255)},${Math.round((item as any).color[1]*255)},${Math.round((item as any).color[2]*255)})`
        : '#000000';
      return { str: item.str, x, y: y - height, width, height, fontName: item.fontName ?? 'unknown', fontSize, transform: tx, color };
    });

  if (rawItems.length === 0) return [];

  // Sort top-to-bottom, left-to-right
  rawItems.sort((a, b) => Math.abs(a.y - b.y) > a.height * 0.5 ? a.y - b.y : a.x - b.x);

  // Group into lines with tight y-tolerance
  const lines = groupIntoLines(rawItems);

  // For tables/receipts/complex docs: use per-LINE blocks so each cell/row is independently editable
  // Detect if page has table-like structure (many items at different x positions on same y)
  const isComplexLayout = detectComplexLayout(lines);

  if (isComplexLayout) {
    // Fine-grained: each line becomes its own block
    return lines.map((line, i) => createBlock([line], page.pageNumber, i));
  }

  // Otherwise: group nearby lines into paragraph blocks
  return groupIntoBlocks(lines, page.pageNumber);
}

function detectComplexLayout(lines: TextLine[]): boolean {
  if (lines.length < 3) return false;
  // If many lines have multiple distinct x-columns, treat as complex
  let multiColumnCount = 0;
  for (const line of lines) {
    const xs = line.items.map(i => i.x);
    const uniqueX = new Set(xs.map(x => Math.round(x / 10)));
    if (uniqueX.size >= 2) multiColumnCount++;
  }
  return multiColumnCount > lines.length * 0.25;
}

function groupIntoLines(items: TextItem[]): TextLine[] {
  const lines: TextLine[] = [];
  let currentLine: TextItem[] = [];
  let currentLineY = -Infinity;
  let currentLineHeight = 0;

  for (const item of items) {
    if (currentLine.length === 0 || Math.abs(item.y - currentLineY) < currentLineHeight * 1.5) {
      currentLine.push(item);
      if (currentLine.length === 1) {
        currentLineY = item.y;
        currentLineHeight = item.height;
      }
    } else {
      lines.push(createLine(currentLine));
      currentLine = [item];
      currentLineY = item.y;
      currentLineHeight = item.height;
    }
  }
  if (currentLine.length > 0) lines.push(createLine(currentLine));
  return lines;
}

function createLine(items: TextItem[]): TextLine {
  items.sort((a, b) => a.x - b.x);
  let text = '';
  let prevItem: TextItem | null = null;
  for (const item of items) {
    if (prevItem) {
      const gap = item.x - (prevItem.x + prevItem.width);
      if (gap > (prevItem.width / Math.max(prevItem.str.length, 1)) * 0.3) text += ' ';
    }
    text += item.str;
    prevItem = item;
  }
  const minX = Math.min(...items.map(i => i.x));
  const maxX = Math.max(...items.map(i => i.x + i.width));
  const minY = Math.min(...items.map(i => i.y));
  const maxY = Math.max(...items.map(i => i.y + i.height));
  return { items, text: text.trim(), x: minX, y: minY, width: maxX - minX, height: maxY - minY, baseline: items[0]?.y + items[0]?.height || minY };
}

function groupIntoBlocks(lines: TextLine[], pageNumber: number): TextBlock[] {
  const blocks: TextBlock[] = [];
  let currentBlockLines: TextLine[] = [];
  let blockIdCounter = 0;

  for (const line of lines) {
    const prevLine = currentBlockLines[currentBlockLines.length - 1];
    const isSameBlock = currentBlockLines.length === 0 || (prevLine && line.y - (prevLine.y + prevLine.height) < prevLine.height * 2.0 && hasHorizontalOverlap(line, prevLine));
    if (isSameBlock) {
      currentBlockLines.push(line);
    } else {
      blocks.push(createBlock(currentBlockLines, pageNumber, blockIdCounter++));
      currentBlockLines = [line];
    }
  }
  if (currentBlockLines.length > 0) blocks.push(createBlock(currentBlockLines, pageNumber, blockIdCounter++));
  return blocks;
}

function hasHorizontalOverlap(line1: TextLine, line2: TextLine): boolean {
  const overlap = Math.min(line1.x + line1.width, line2.x + line2.width) - Math.max(line1.x, line2.x);
  return overlap > Math.min(line1.width, line2.width) * 0.3;
}

function createBlock(lines: TextLine[], pageNumber: number, id: number): TextBlock {
  const text = lines.map(l => l.text).join('\n');
  const minX = Math.min(...lines.map(l => l.x));
  const maxX = Math.max(...lines.map(l => l.x + l.width));
  const minY = Math.min(...lines.map(l => l.y));
  const maxY = Math.max(...lines.map(l => l.y + l.height));
  const firstItem = lines[0]?.items[0];
  // Try to get actual color from item
  const color = (firstItem as any)?.color || firstItem?.fontName ? undefined : '#000000';
  return {
    id: `block-${pageNumber}-${id}`,
    pageNumber,
    lines,
    text,
    rect: { x: minX, y: minY, width: Math.max(maxX - minX, 10), height: Math.max(maxY - minY, firstItem?.fontSize || 10) },
    style: {
      fontName: firstItem?.fontName || 'unknown',
      fontSize: firstItem?.fontSize || 12,
      fontColor: (firstItem as any)?.color || '#000000',
      alignment: 'left',
      lineHeight: lines.length > 1 ? (lines[1].y - lines[0].y) / (firstItem?.fontSize || 12) : 1.2
    },
    editable: true,
  };
}

// ============================================================================
// TipTap Utilities
// ============================================================================

export function parseTipTapHTML(html: string): RichTextSegment[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const segments: RichTextSegment[] = [];

  function traverse(node: Node, currentStyle: Partial<TextStyle>) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) {
        segments.push({
          text: node.textContent,
          style: { ...currentStyle },
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const newStyle = { ...currentStyle };

      switch (element.tagName.toLowerCase()) {
        case 'strong':
        case 'b':
          newStyle.fontWeight = 'bold';
          break;
        case 'em':
        case 'i':
          newStyle.fontStyle = 'italic';
          break;
        case 'u':
          newStyle.textDecoration = 'underline';
          break;
        case 's':
        case 'strike':
        case 'del':
          newStyle.textDecoration = 'line-through';
          break;
        case 'span':
          if (element.style.color) newStyle.color = element.style.color;
          if (element.style.fontSize) newStyle.fontSize = parseInt(element.style.fontSize);
          break;
      }

      element.childNodes.forEach(child => traverse(child, newStyle));
    }
  }

  doc.body.childNodes.forEach(child => traverse(child, {}));
  return segments;
}

export function segmentsToTipTapHTML(segments: RichTextSegment[]): string {
  if (segments.length === 0) return '<p></p>';
  let html = '<p>';
  for (const segment of segments) {
    let text = segment.text;
    if (segment.style.fontWeight === 'bold') text = `<strong>${text}</strong>`;
    if (segment.style.fontStyle === 'italic') text = `<em>${text}</em>`;
    if (segment.style.textDecoration === 'underline') text = `<u>${text}</u>`;
    if (segment.style.textDecoration === 'line-through') text = `<s>${text}</s>`;
    
    const styleAttrs: string[] = [];
    if (segment.style.color) styleAttrs.push(`color: ${segment.style.color}`);
    if (segment.style.fontSize) styleAttrs.push(`font-size: ${segment.style.fontSize}px`);
    
    if (styleAttrs.length > 0) {
      text = `<span style="${styleAttrs.join('; ')}">${text}</span>`;
    }
    html += text;
  }
  html += '</p>';
  return html;
}

// ============================================================================
// Geometric Utilities
// ============================================================================

export function rotatePoint(x: number, y: number, centerX: number, centerY: number, angleDegrees: number) {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  const dx = x - centerX;
  const dy = y - centerY;
  return {
    x: centerX + (dx * cos - dy * sin),
    y: centerY + (dx * sin + dy * cos),
  };
}

export async function searchDocument(document: PDFDocumentProxy, query: string, options: { caseSensitive: boolean, wholeWord: boolean }) {
  const results = [];
  for (let i = 1; i <= document.numPages; i++) {
    const page = await document.getPage(i);
    const textContent = await page.getTextContent();
    const text = (textContent.items as any[]).map((item: any) => item.str).join(' ');
    
    const flags = options.caseSensitive ? '' : 'i';
    const regex = new RegExp(options.wholeWord ? `\\b${query}\\b` : query, flags);
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({ pageNumber: i, text: text.substring(match.index, match.index + 20), index: match.index });
    }
  }
  return results;
}
