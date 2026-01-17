
import { GoogleGenAI, Type } from "@google/genai";
import { MealAnalysis } from "../types";

export const analyzeFoodImage = async (base64Image: string): Promise<MealAnalysis> => {
  // Fix: Initializing GoogleGenAI with exactly the required named parameter process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: "Analyze this food image. Identify the dish and its ingredients. Provide estimated calories, protein (g), carbs (g), and fats (g). Return the data in JSON format."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the dish" },
          totalCalories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                serving: { type: Type.STRING },
                calories: { type: Type.NUMBER },
                match: { type: Type.NUMBER, description: "Confidence percentage (0-100)" }
              },
              required: ["name", "serving", "calories", "match"]
            }
          }
        },
        required: ["name", "totalCalories", "protein", "carbs", "fats", "ingredients"]
      }
    }
  });

  const analysis = JSON.parse(response.text || '{}') as MealAnalysis;
  return analysis;
};
