import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a description for a station based on uploaded images using Gemini.
 */
export const generateStationDescription = async (
  base64Images: string[],
  location: { lat: number; lng: number }
): Promise<string> => {
  try {
    if (base64Images.length === 0) {
      throw new Error("No images provided for analysis.");
    }

    // Prepare parts: Images + Prompt
    const parts = base64Images.map((img) => {
      // Extract base64 data if it contains the prefix
      const base64Data = img.includes("base64,") ? img.split("base64,")[1] : img;
      return {
        inlineData: {
          mimeType: "image/jpeg", // Assuming JPEG for simplicity, or detect from header
          data: base64Data,
        },
      };
    });

    const promptText = `
      Analyze these images of a station or facility at coordinates (${location.lat}, ${location.lng}).
      Provide a concise, professional description of the visual condition, visible equipment, 
      surrounding environment, and any notable features. 
      Keep it under 100 words.
    `;

    // Type casting to allow mixed content types in the array
    (parts as any[]).push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: parts as any[],
      },
    });

    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Could not generate description via AI. Please try again.";
  }
};