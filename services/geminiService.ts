
import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY directly as per guidelines
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

export const analyzeStampImage = async (base64Image: string) => {
  // Mock response when no API key is configured
  if (!apiKey) {
    console.log("AI Scan: Using mock data (no API key configured)");
    return {
      shape: "ROUND",
      primaryText: "CERTIFIED",
      secondaryText: "OFFICIAL STAMP",
      centerText: "APPROVED",
      color: "#000000",
      fontStyle: "SANS"
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: "image/png",
            },
          },
          {
            text: "Extract information from this rubber stamp image. Identify the shape, primary text (often circular), secondary text, center text, and main color. Return in JSON format.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shape: { type: Type.STRING, description: "ROUND, OVAL, RECTANGLE, or SQUARE" },
            primaryText: { type: Type.STRING },
            secondaryText: { type: Type.STRING },
            centerText: { type: Type.STRING },
            color: { type: Type.STRING, description: "HEX code or color name" },
            fontStyle: { type: Type.STRING, description: "SERIF or SANS" },
          },
          required: ["shape", "primaryText", "color"],
        },
      },
    });

    // Directly access .text property from GenerateContentResponse
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Return mock data on API failure too
    return {
      shape: "ROUND",
      primaryText: "CERTIFIED",
      secondaryText: "OFFICIAL STAMP",
      centerText: "APPROVED",
      color: "#000000",
      fontStyle: "SANS"
    };
  }
};

// Analyze an invoice/receipt image using AI to extract structured data
export const analyzeInvoiceImage = async (base64Image: string): Promise<{
  type: string; invoiceNumber?: string; date?: string; dueDate?: string;
  businessName?: string; businessAddress?: string;
  clientName?: string; clientAddress?: string;
  items: Array<{ description: string; qty: number; unitPrice: number }>;
  subtotal?: number; tax?: number; total?: number; currency?: string; notes?: string;
} | null> => {
  if (!apiKey) {
    // Mock for dev without API key
    return {
      type: 'invoice', invoiceNumber: 'INV-001', date: new Date().toISOString().slice(0,10),
      businessName: 'Scanned Business', clientName: 'Scanned Client',
      items: [{ description: 'Services rendered', qty: 1, unitPrice: 5000 }],
      total: 5800, tax: 800, subtotal: 5000, currency: 'KES',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { inlineData: { data: base64Image.replace(/^data:[^;]+;base64,/, ''), mimeType: 'image/jpeg' } },
          { text: `Extract all invoice/receipt/quotation data from this image. Return JSON with these fields:
type (invoice/receipt/quotation), invoiceNumber, date (YYYY-MM-DD), dueDate (YYYY-MM-DD),
businessName, businessAddress, clientName, clientAddress,
items (array of {description, qty, unitPrice}),
subtotal, tax, total, currency (default KES if Kenya context), notes.
If a field is not visible, omit it. Return valid JSON only.` },
        ],
      },
      config: { responseMimeType: 'application/json' },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(clean);
    data.items = Array.isArray(data.items) ? data.items : [];
    return data;
  } catch (e) {
    console.error('[AI Invoice Scan]', e);
    return null;
  }
};
