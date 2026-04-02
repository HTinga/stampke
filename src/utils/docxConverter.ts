import mammoth from 'mammoth';

/**
 * Converts a .docx file (ArrayBuffer) to HTML for signing/preview.
 * @param arrayBuffer The DOCX file as an ArrayBuffer
 * @returns The converted HTML string
 */
export const convertDocxToHtml = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value; // The generated HTML
  } catch (err) {
    console.error('[DocxConverter] Failed to convert DOCX:', err);
    throw new Error('Failed to convert .docx file. Please ensure it is a valid document.');
  }
};

/**
 * Converts a .docx file (ArrayBuffer) to plain text.
 * @param arrayBuffer The DOCX file as an ArrayBuffer
 * @returns The extracted plain text
 */
export const convertDocxToText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (err) {
    console.error('[DocxConverter] Failed to extract text:', err);
    throw new Error('Failed to extract text from .docx file.');
  }
};
