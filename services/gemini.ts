
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
      contents: `Find the ISBN, a 2-sentence synopsis, 3-5 primary tropes, and a direct URL to a high-quality book cover image for "${title}" by ${author}. Focus on sapphic/queer literary significance. Return as JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isbn: { type: Type.STRING },
            synopsis: { type: Type.STRING },
            coverUrl: { type: Type.STRING, description: 'URL to the book cover image' },
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

    const sourceUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter(Boolean) || [];

    return { ...metadata, sourceUrls };
  },

  async fetchByExternalId(type: string, id: string): Promise<any> {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Identify the book with ${type} ID: ${id}. Provide the title, author, and a brief synopsis. Use Google Search to ensure accurate metadata. Return as JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            synopsis: { type: Type.STRING }
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      return null;
    }
  },

  async syncAuthorFullRecord(authorName: string): Promise<any> {
    const ai = getAIClient();
    const prompt = `Research the author ${authorName} for a queer literature archive.
    1. Biography: 3-paragraph summary of their life and queer identity impact.
    2. Context: Historical era/literary movement.
    3. Bibliography: List of their major books.
    4. Releases: Any books released in the last 60 days or announced for the future.
    Use Google Search for ground truth. Return as a JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2000 },
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
                  synopsis: { type: Type.STRING }
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

    const now = new Date();
    const processedReleases = (data.releases || []).map((r: any) => ({
      ...r,
      isUpcoming: new Date(r.releaseDate) > now
    }));

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || 'Resource',
        uri: chunk.web?.uri
      }))
      .filter((s: any) => s.uri) || [];

    return {
      ...data,
      releases: processedReleases,
      sources,
      name: authorName
    };
  },

  async discoverBooks(currentTropes: string[], options: { canadianFocus: boolean }): Promise<any[]> {
    const ai = getAIClient();
    const prompt = `Recommend 5 sapphic or queer books based on these interests: ${currentTropes.join(', ')}. ${options.canadianFocus ? "Prioritize Canadian authors." : ""} Return as JSON array of objects with 'title', 'author', 'reason'. Use Google Search to find current trending titles.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
