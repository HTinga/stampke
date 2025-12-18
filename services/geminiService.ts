
import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeStampImage = async (base64Image: string) => {
  try {
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
    return null;
  }
};
