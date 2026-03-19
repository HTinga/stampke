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
