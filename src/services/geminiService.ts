import { GoogleGenAI, Type } from "@google/genai";
import type { RectangleRegion } from '../types';

// FIX: Per coding guidelines, API key must be obtained from process.env.API_KEY. This also resolves the TypeScript error.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // FIX: Updated error message to be more generic and not instruct user on how to set the key.
  throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      x: { type: Type.NUMBER, description: 'The x-coordinate of the top-left corner as a proportion of image width (0-1).' },
      y: { type: Type.NUMBER, description: 'The y-coordinate of the top-left corner as a proportion of image height (0-1).' },
      width: { type: Type.NUMBER, description: 'The width of the bounding box as a proportion of image width (0-1).' },
      height: { type: Type.NUMBER, description: 'The height of the bounding box as a proportion of image height (0-1).' },
    },
    required: ['x', 'y', 'width', 'height'],
  },
};

export const detectSensitiveAreas = async (imageFile: File): Promise<Omit<RectangleRegion, 'type'>[]> => {
  const imagePart = await fileToGenerativePart(imageFile);
  
  const prompt = `
    You are an expert privacy protection tool. Analyze this image and identify all areas that contain sensitive or personally identifiable information (PII). 
    This includes, but is not limited to: names, email addresses, phone numbers, physical addresses, faces, credit card numbers, social security numbers, license plates, and any other private data.
    For each identified sensitive area, provide its bounding box coordinates. The origin (0,0) is the top-left corner of the image.
    The response must be a JSON array of objects, where each object has 'x', 'y', 'width', and 'height' properties.
    The values must be numbers between 0 and 1, representing the proportional location and size relative to the image dimensions.
    Do not provide any other text or explanation in your response. Only return the JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    
    const jsonString = response.text;
    if (!jsonString) {
      console.error("Gemini API returned an empty response.");
      return [];
    }

    const detectedRegions = JSON.parse(jsonString);
    
    // Basic validation
    if (!Array.isArray(detectedRegions)) {
        throw new Error("Invalid response format from API: not an array.");
    }

    return detectedRegions.filter(region => 
        typeof region.x === 'number' &&
        typeof region.y === 'number' &&
        typeof region.width === 'number' &&
        typeof region.height === 'number'
    );
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to process image with Gemini API.");
  }
};