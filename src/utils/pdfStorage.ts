export async function loadCurrentPDF() {
  const data = localStorage.getItem('pdfData');
  if (!data) return null;
  return {
    data: new Uint8Array(JSON.parse(data)).buffer as ArrayBuffer,
    fileName: localStorage.getItem('pdfFileName') || 'document.pdf'
  };
}

export async function saveCurrentPDF(data: ArrayBuffer, fileName: string) {
  localStorage.setItem('pdfData', JSON.stringify(Array.from(new Uint8Array(data))));
  localStorage.setItem('pdfFileName', fileName);
}

export interface PDFTemplate {
  id: string;
  name: string;
  data: number[];
  fileName: string;
  createdAt: string;
}

export function savePDFAsTemplate(data: ArrayBuffer, fileName: string, name: string) {
  const templates: PDFTemplate[] = JSON.parse(localStorage.getItem('pdfTemplates') || '[]');
  const newTemplate: PDFTemplate = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    data: Array.from(new Uint8Array(data)),
    fileName,
    createdAt: new Date().toISOString()
  };
  templates.push(newTemplate);
  localStorage.setItem('pdfTemplates', JSON.stringify(templates));
  return newTemplate;
}

export function getPDFTemplates(): PDFTemplate[] {
  return JSON.parse(localStorage.getItem('pdfTemplates') || '[]');
}

export function deletePDFTemplate(id: string) {
  const templates: PDFTemplate[] = JSON.parse(localStorage.getItem('pdfTemplates') || '[]');
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem('pdfTemplates', JSON.stringify(filtered));
}
