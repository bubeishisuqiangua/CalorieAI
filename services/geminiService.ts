
import { GoogleGenAI, Type } from "@google/genai";
import { MealAnalysis } from "../types";

export const analyzeFoodImage = async (base64Image: string): Promise<MealAnalysis> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey === '') {
    console.error("Gemini API Key is missing! Please set GEMINI_API_KEY in your environment variables.");
    return {
      name: "API Key Missing",
      totalCalories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      ingredients: []
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              text: "Determine what this food is. If it's a home-cooked meal, identify the components. Even if the image is slightly blurry or taken in poor lighting, use your high-level reasoning to make a 'Best Guess' based on typical meal compositions. Provide a nutritional breakdown."
            }
          ]
        }
      ],
      config: {
        systemInstruction: "You are an elite AI nutritionist. Your task is to identify meals from photos. IMPORTANT: Never return 'Unknown' unless the image is clearly not food (like a blank screen or a person). If the image is ambiguous, identify it as the most likely common food it resembles. Provide accurate estimations for calories, protein, carbs, and fats. Always list the ingredients found. Return valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Specific name of the dish or 'Best Guess' name" },
            totalCalories: { type: Type.NUMBER, description: "Total estimated calories" },
            protein: { type: Type.NUMBER, description: "Grams of protein" },
            carbs: { type: Type.NUMBER, description: "Grams of carbohydrates" },
            fats: { type: Type.NUMBER, description: "Grams of fat" },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  serving: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  match: { type: Type.NUMBER, description: "Confidence score 0-100" }
                },
                required: ["name", "serving", "calories", "match"]
              }
            }
          },
          required: ["name", "totalCalories", "protein", "carbs", "fats", "ingredients"]
        }
      }
    });

    let text = response.text || '{}';
    
    // Cleanup potential JSON formatting issues
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const analysis = JSON.parse(text) as MealAnalysis;
      return analysis;
    } catch (parseError) {
      console.error("Critical: Failed to parse AI response as JSON", text);
      throw parseError;
    }
  } catch (error) {
    console.error("Gemini Identification Failure:", error);
    // Return a structured error response that allows the user to edit
    return {
      name: "Needs Review",
      totalCalories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      ingredients: []
    };
  }
};
