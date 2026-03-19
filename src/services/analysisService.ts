import { GoogleGenAI, Type } from "@google/genai";
import { VERDA_PROTOCOL } from "../constants";

export interface AnalysisResult {
  isComparison: boolean;
  products: {
    productName: string;
    verdict: 'KUPUJ' | 'UNIKAJ' | 'Z ROZWAGĄ';
    healthScore: number;
    summary: string;
    pros: string[];
    cons: string[];
    ingredientsAnalysis: string;
    protocolFit: string;
    detailedRisks: {
      ingredient: string;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'BENEFICIAL';
      reason: string;
    }[];
  }[];
  comparisonSummary?: string;
  recommendation?: string;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  console.error("BŁĄD KRYTYCZNY: Brak klucza VITE_GEMINI_API_KEY w ustawieniach Vercel");
}

export const performProductAnalysis = async (
  apiKeyOverride?: string,
  imageData?: string,
  description?: string
): Promise<AnalysisResult> => {
  const apiKey = apiKeyOverride || API_KEY;
  if (!apiKey) throw new Error("API Key is required");

  const genAI = new GoogleGenAI({ apiKey });
  const model = "gemini-1.5-flash";

  const currentTime = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('pl-PL');

  const prompt = `
    ${VERDA_PROTOCOL}
    
    AKTUALNY CZAS: ${currentDate}, ${currentTime}
    
    PRZEPROWADŹ SZCZEGÓŁOWĄ ANALIZĘ.
  `;

  const parts: any[] = [{ text: prompt }];

  if (imageData) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageData.split(',')[1]
      }
    });
  }

  if (description) {
    parts.push({ text: `DANE OD UŻYTKOWNIKA: ${description}` });
  }

  const response = await genAI.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ['isComparison', 'products'],
        properties: {
          isComparison: { type: Type.BOOLEAN },
          products: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ['productName', 'verdict', 'healthScore', 'summary', 'pros', 'cons', 'ingredientsAnalysis', 'protocolFit', 'detailedRisks'],
              properties: {
                productName: { type: Type.STRING },
                verdict: { type: Type.STRING, enum: ['KUPUJ', 'UNIKAJ', 'Z ROZWAGĄ'] },
                healthScore: { type: Type.NUMBER },
                summary: { type: Type.STRING },
                pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                ingredientsAnalysis: { type: Type.STRING },
                protocolFit: { type: Type.STRING },
                detailedRisks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ['ingredient', 'riskLevel', 'reason'],
                    properties: {
                      ingredient: { type: Type.STRING },
                      riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'BENEFICIAL'] },
                      reason: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          },
          comparisonSummary: { type: Type.STRING },
          recommendation: { type: Type.STRING }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from AI");
  return JSON.parse(text);
};
