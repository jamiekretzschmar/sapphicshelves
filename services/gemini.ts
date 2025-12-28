
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
    const prompt = `Find the ISBN-13, a 2-sentence synopsis, and 3-5 primary tropes for the book "${title}" by ${author}. 
    Focus on its significance in queer/sapphic literature. 
    
    COVER IMAGE PROTOCOL:
    1. Find the accurate ISBN-13 for this book.
    2. If an ISBN is found, set coverUrl to exactly: https://covers.openlibrary.org/b/isbn/[ISBN_WITHOUT_DASHES]-M.jpg
    3. If no ISBN is found, provide a direct hotlinkable URL to a book cover image from a reliable source like Google Books or Open Library.
    
    Return as JSON.`;

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
            coverUrl: { type: Type.STRING, description: 'Direct hotlinkable URL to the book cover image' },
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
      ?.map((chunk: any) => ({
        uri: chunk.web?.uri,
        title: chunk.web?.title
      }))
      .filter((s: any) => s.uri) || [];

    return { ...metadata, sourceUrls };
  },

  /**
   * Fetches book metadata from external IDs (Amazon, Goodreads, etc.)
   * Uses search grounding to verify the volume against global literary databases.
   */
  async fetchByExternalId(type: string, id: string): Promise<any> {
    const ai = getAIClient();
    const prompt = `Research the book with ${type} ID: ${id}. 
    Provide the title, author, ISBN-13, a 2-sentence synopsis, and 3-5 primary tropes. 
    Focus on its significance in queer/sapphic literature. Use Google Search for accuracy. Return as JSON.`;

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

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.warn("External fetch fallback parsing");
      return null;
    }
  },

  async summarizeShelf(shelfTitle: string, bookList: {title: string, author: string}[]): Promise<string> {
    const ai = getAIClient();
    const prompt = `You are a high-end curator of queer literature. Provide a beautiful, 2-paragraph "Curator's Note" for a shelf titled "${shelfTitle}" which contains: ${bookList.map(b => `"${b.title}" by ${b.author}`).join(', ')}. Analyze the hidden thematic connections and historical weight of this sub-collection. Use a sophisticated, archival tone.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1000 }
      }
    });
    return response.text || "Archival synthesis pending...";
  },

  async suggestLexiconTags(currentTags: string[]): Promise<string[]> {
    const ai = getAIClient();
    const prompt = `Based on these literary tropes found in a queer archive: ${currentTags.join(', ')}, suggest 8 more niche, sophisticated sapphic/queer tropes or thematic signifiers. Return as a JSON array of strings.`;
    
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
    
    try {
      const data = JSON.parse(response.text || '{}');
      return data.suggestions || [];
    } catch {
      return [];
    }
  },

  /**
   * Scouts for new literary acquisitions based on a set of Lexicon signifiers.
   * Leverages search grounding to find real-world books matching niche tropes.
   */
  async discoverBooks(tags: string[], options: { canadianFocus: boolean }): Promise<any[]> {
    const ai = getAIClient();
    const prompt = `Discover 5 niche sapphic/queer books that feature these tropes: ${tags.join(', ')}.
    ${options.canadianFocus ? 'Prioritize Canadian authors.' : ''}
    For each book, provide the title, author, and a 1-sentence synopsis.
    Use Google Search to find real, published books. Return as JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
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
                  author: { type: Type.STRING },
                  synopsis: { type: Type.STRING }
                },
                required: ['title', 'author']
              }
            }
          }
        }
      }
    });

    try {
      const data = JSON.parse(response.text || '{"books": []}');
      return data.books || [];
    } catch (e) {
      console.warn("Discovery fallback parsing");
      return [];
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
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
  }
};
