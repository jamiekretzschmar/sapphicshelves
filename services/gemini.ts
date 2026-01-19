
import { GoogleGenAI, Type } from "@google/genai";
import { PROMPTS } from '../constants';
import { Opportunity, Book } from '../types';

const getAIClient = () => {
  // Try common vite/process env patterns
  const apiKey = (typeof process !== 'undefined' && process.env.VITE_GEMINI_API_KEY) || 
                 (typeof process !== 'undefined' && process.env.API_KEY) ||
                 // @ts-ignore
                 (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
                 '';
  
  return new GoogleGenAI({ apiKey });
};

// Utility to clean AI output
export const cleanAndParseJSON = (text: string | undefined): any => {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (e) {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      console.warn("Failed to parse JSON even after cleaning:", text);
      return {};
    }
  }
};

export const geminiService = {
  async scanShelf(imagesBase64: string[]): Promise<any[]> {
    const ai = getAIClient();
    const imageParts = imagesBase64.map(data => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: data.split(',')[1] || data,
      },
    }));

    try {
      const response = await ai.getGenerativeModel({ model: 'gemini-2.0-flash-preview' }).generateContent({
        contents: [{
          role: 'user',
          parts: [
            ...imageParts,
            { text: PROMPTS.SHELF_SCAN }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              books: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    author: { type: Type.STRING }
                  },
                  required: ['title', 'author']
                }
              }
            }
          }
        }
      });

      const data = cleanAndParseJSON(response.response.text());
      return data.books || [];
    } catch (e) {
      console.error("Failed to parse shelf scan response", e);
      throw e;
    }
  },

  async enrichBook(title: string, author: string): Promise<any> {
    const ai = getAIClient();
    const prompt = `Find the ISBN-13, the primary publication year (number), a 2-sentence synopsis, and 3-5 primary tropes for the book "${title}" by ${author}. 
    Focus on its significance in queer/sapphic literature.
    Also, determine a "Mood Color" (hex code) that fits the book's vibe (e.g. dark red for gothic, pastel for rom-com).
    
    COVER IMAGE PROTOCOL:
    1. Find the accurate ISBN-13.
    2. Set coverUrl to https://covers.openlibrary.org/b/isbn/[ISBN]-L.jpg
    
    Return as JSON.`;

    try {
      const response = await ai.getGenerativeModel({ model: 'gemini-2.0-flash-preview' }).generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          // @ts-ignore
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isbn: { type: Type.STRING },
              publicationYear: { type: Type.NUMBER },
              synopsis: { type: Type.STRING },
              coverUrl: { type: Type.STRING },
              tropes: { type: Type.ARRAY, items: { type: Type.STRING } },
              moodColor: { type: Type.STRING }
            }
          }
        }
      });

      const data = cleanAndParseJSON(response.response.text());
      const sources = response.response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => ({
          title: chunk.web?.title || 'Resource',
          uri: chunk.web?.uri
        }))
        .filter((s: any) => s.uri) || [];

      return { ...data, sources };
    } catch (e) {
      console.error("Enrichment failed", e);
      return {};
    }
  },

  async recommendBooksByTropes(included: string[], excluded: string[]): Promise<any[]> {
    const ai = getAIClient();
    const prompt = `Suggest 5 high-quality sapphic/queer books that match ALL of these tropes: [${included.join(', ')}] and explicitly DO NOT contain these tropes: [${excluded.join(', ')}].
    For each book, provide the title, author, publication year (number), a very brief 1-sentence synopsis, and list the relevant tropes.
    Use Google Search to find real, highly-rated books. Return as JSON.`;

    try {
      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-preview' });
      const response = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          // @ts-ignore
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    author: { type: Type.STRING },
                    publicationYear: { type: Type.NUMBER },
                    synopsis: { type: Type.STRING },
                    tropes: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['title', 'author']
                }
              }
            }
          }
        }
      });
      
      const data = cleanAndParseJSON(response.response.text());
      return data.recommendations || [];
    } catch (e) {
      console.error("Book recommendation failed", e);
      return [];
    }
  },

  async suggestLexiconTags(currentTags: string[]): Promise<string[]> {
    const ai = getAIClient();
    const prompt = `Based on these literary tropes found in a queer archive: ${currentTags.join(', ')}, suggest 8 more niche, sophisticated sapphic/queer tropes or thematic signifiers. Return as a JSON array of strings.`;
    
    try {
      const response = await ai.getGenerativeModel({ model: 'gemini-2.0-flash-preview' }).generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      
      const data = cleanAndParseJSON(response.response.text());
      return data.suggestions || [];
    } catch {
      return [];
    }
  }
};
