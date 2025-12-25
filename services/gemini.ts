
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

    try {
      const data = JSON.parse(response.text || '{}');
      return data.books || [];
    } catch (e) {
      console.error("Failed to parse shelf scan response", e);
      return [];
    }
  },

  async enrichBook(title: string, author: string): Promise<any> {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: PROMPTS.METADATA_ENRICH(title, author),
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isbn: { type: Type.STRING },
            synopsis: { type: Type.STRING },
            tropes: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    let metadata = {};
    try {
      metadata = JSON.parse(response.text || '{}');
    } catch (e) {
      console.warn("Enrichment fallback parsing");
    }

    const sourceUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter(Boolean) || [];

    return { ...metadata, sourceUrls };
  },

  async getAuthorPulse(authorName: string): Promise<any> {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: PROMPTS.AUTHOR_PULSE(authorName),
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            biography: { type: Type.STRING },
            historicalContext: { type: Type.STRING },
            bibliography: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    let pulseData = {};
    try {
      pulseData = JSON.parse(response.text || '{}');
    } catch (e) {
      console.warn("Pulse fallback parsing");
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || 'Resource',
        uri: chunk.web?.uri
      }))
      .filter((s: any) => s.uri) || [];

    return { ...pulseData, name: authorName, sources };
  },

  async checkAuthorReleases(authorName: string): Promise<any[]> {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: PROMPTS.AUTHOR_RELEASES(authorName),
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            releases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  releaseDate: { type: Type.STRING },
                  synopsis: { type: Type.STRING }
                },
                required: ['title', 'releaseDate']
              }
            }
          }
        }
      }
    });

    try {
      const data = JSON.parse(response.text || '{}');
      const now = new Date();
      return (data.releases || []).map((r: any) => {
        const releaseDate = new Date(r.releaseDate);
        return {
          ...r,
          isUpcoming: releaseDate > now
        };
      });
    } catch (e) {
      console.error("Failed to parse releases response", e);
      return [];
    }
  },

  async discoverBooks(currentTropes: string[], options: { canadianFocus: boolean }): Promise<any[]> {
    const ai = getAIClient();
    const prompt = `Recommend 5 sapphic or queer books based on these interests: ${currentTropes.join(', ')}. ${options.canadianFocus ? "Prioritize Canadian authors." : ""} Return as JSON array of objects with 'title', 'author', 'reason'. Use Google Search to find current trending titles.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
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
                  reason: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    try {
      const data = JSON.parse(response.text || '{}');
      return data.recommendations || [];
    } catch (e) {
      return [];
    }
  },

  async generateArchivistIcon(prompt: string): Promise<string | undefined> {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A minimalist, elegant "Archivist" icon for a book curation app. Style: Fine line art, gold foil texture on white parchment. Concept: ${prompt}` }]
      },
      config: {
        imageConfig: { aspectRatio: '1:1' }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  }
};
