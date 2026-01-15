import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PROMPTS } from '../constants';

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            ...imageParts,
            { text: PROMPTS.SHELF_SCAN }
          ]
        },
        config: {
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

      const data = JSON.parse(response.text || '{}');
      return data.books || [];
    } catch (e) {
      console.error("Failed to parse shelf scan response", e);
      throw e;
    }
  },

  async enrichBook(title: string, author: string): Promise<any> {
    const ai = getAIClient();
    const prompt = `Find the ISBN-13, a 2-sentence synopsis, and 3-5 primary tropes for the book "${title}" by ${author}. 
    Focus on its significance in queer/sapphic literature. 
    
    COVER IMAGE PROTOCOL:
    1. Find the accurate ISBN-13.
    2. Set coverUrl to https://covers.openlibrary.org/b/isbn/[ISBN]-L.jpg
    
    Return as JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isbn: { type: Type.STRING },
              synopsis: { type: Type.STRING },
              coverUrl: { type: Type.STRING },
              tropes: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      let metadata: any = {};
      try {
        metadata = JSON.parse(response.text || '{}');
      } catch (e) {
        console.warn("Enrichment fallback parsing");
      }

      return metadata;
    } catch (e) {
      console.error("Enrichment failed", e);
      return {};
    }
  },

  async summarizeShelf(shelfTitle: string, bookList: {title: string, author: string}[]): Promise<string> {
    const ai = getAIClient();
    const prompt = `You are a high-end curator of queer literature. Provide a beautiful, 2-paragraph "Curator's Note" for a shelf titled "${shelfTitle}" which contains: ${bookList.map(b => `"${b.title}" by ${b.author}`).join(', ')}. Analyze the hidden thematic connections and historical weight of this sub-collection. Use a sophisticated, archival tone.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Using Flash for speed, or Pro if Thinking needed
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 1024 } // Enable thinking for deeper analysis
        }
      });
      return response.text || "Archival synthesis pending...";
    } catch (e) {
      return "The curator is currently unavailable.";
    }
  },

  async suggestLexiconTags(currentTags: string[]): Promise<string[]> {
    const ai = getAIClient();
    const prompt = `Based on these literary tropes found in a queer archive: ${currentTags.join(', ')}, suggest 8 more niche, sophisticated sapphic/queer tropes or thematic signifiers. Return as a JSON array of strings.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      
      const data = JSON.parse(response.text || '{}');
      return data.suggestions || [];
    } catch {
      return [];
    }
  },

  async fetchByExternalId(type: string, id: string): Promise<any> {
    const ai = getAIClient();
    const prompt = `Research the book with ${type} ID: ${id}. 
    Provide the title, author, ISBN-13, a 2-sentence synopsis, and 3-5 primary tropes. 
    Focus on its significance in queer/sapphic literature. Use Google Search for accuracy. Return as JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              isbn: { type: Type.STRING },
              synopsis: { type: Type.STRING },
              tropes: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['title', 'author']
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (e) {
      return null;
    }
  },

  async syncAuthorFullRecord(authorName: string): Promise<any> {
    const ai = getAIClient();
    const prompt = `Deeply research the author ${authorName} for a queer literature archive.
    1. Biography: 3-paragraph summary of their life and queer identity impact.
    2. Context: Historical era/literary movement.
    3. Bibliography: List of their major books.
    4. Releases: Any books released in the last 60 days or announced for the future.
    Use Google Search for ground truth. Use thinking for deep historical context. Return as a JSON object.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 4096 }, // Deep thinking for author analysis
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              biography: { type: Type.STRING },
              historicalContext: { type: Type.STRING },
              bibliography: { type: Type.ARRAY, items: { type: Type.STRING } },
              releases: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    releaseDate: { type: Type.STRING },
                    synopsis: { type: Type.STRING },
                    isUpcoming: { type: Type.BOOLEAN }
                  },
                  required: ['title', 'releaseDate']
                }
              }
            }
          }
        }
      });

      let data: any = {};
      try {
        data = JSON.parse(response.text || '{}');
      } catch (e) {
        console.warn("Unified Sync fallback parsing");
      }

      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => ({
          title: chunk.web?.title || 'Resource',
          uri: chunk.web?.uri
        }))
        .filter((s: any) => s.uri) || [];

      return {
        ...data,
        sources,
        name: authorName
      };
    } catch (e) {
      console.error("Author Sync Failed", e);
      throw e;
    }
  }
};