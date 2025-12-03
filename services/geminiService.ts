import { GoogleGenAI, Type } from "@google/genai";
import { FieldDefinition } from "../types";

const generateColor = (index: number): string => {
  const colors = [
    'bg-red-200 text-red-900 border-red-300',
    'bg-orange-200 text-orange-900 border-orange-300',
    'bg-amber-200 text-amber-900 border-amber-300',
    'bg-yellow-200 text-yellow-900 border-yellow-300',
    'bg-lime-200 text-lime-900 border-lime-300',
    'bg-green-200 text-green-900 border-green-300',
    'bg-emerald-200 text-emerald-900 border-emerald-300',
    'bg-teal-200 text-teal-900 border-teal-300',
    'bg-cyan-200 text-cyan-900 border-cyan-300',
    'bg-sky-200 text-sky-900 border-sky-300',
    'bg-blue-200 text-blue-900 border-blue-300',
    'bg-indigo-200 text-indigo-900 border-indigo-300',
    'bg-violet-200 text-violet-900 border-violet-300',
    'bg-purple-200 text-purple-900 border-purple-300',
    'bg-fuchsia-200 text-fuchsia-900 border-fuchsia-300',
    'bg-pink-200 text-pink-900 border-pink-300',
    'bg-rose-200 text-rose-900 border-rose-300',
  ];
  return colors[index % colors.length];
};

export const analyzeSchemaWithGemini = async (input: string): Promise<FieldDefinition[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analyze the following text input to determine a fixed-width file schema. 
    The input might be a description of fields (e.g., "ID is 5 chars, Name is 10") 
    OR it might be a raw sample line of data (e.g., "12345John Doe  2023").
    
    If it is sample data, try to infer the fields and their likely lengths based on whitespace or data types.
    If it is a description, parse the names and lengths.
    
    Return a JSON array where each object has "name" (string) and "length" (integer).
    
    Input Text:
    """
    ${input}
    """
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              length: { type: Type.INTEGER }
            },
            required: ["name", "length"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const rawFields = JSON.parse(text) as { name: string, length: number }[];

    return rawFields.map((f, i) => ({
      id: `field-${Date.now()}-${i}`,
      name: f.name,
      length: f.length,
      color: generateColor(i)
    }));

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};
