import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
const pdfjsVersion = (pdfjsLib as any).version || '3.11.174';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

export { pdfjsLib };
