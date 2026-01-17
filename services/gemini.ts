
import { GoogleGenAI, Type } from "@google/genai";
import { PROMPTS } from '../constants';
import { Opportunity, Book } from '../types';

const getAIClient = () => {
  // @ts-ignore - process.env might not be defined in some environments
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  return new GoogleGenAI({ apiKey: apiKey || '' });
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
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview',
        contents: {
          role: 'user',
          parts: [
            ...imageParts,
            { text: PROMPTS.SHELF_SCAN }
          ]
        },
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
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview',
        contents: {
          role: 'user',
          parts: [{ text: prompt }]
        },
        generationConfig: {
          // @ts-ignore - googleSearch might be in a different location in types
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

  // NEW: Feature 2 - Series Gap Detection
  async analyzeSeries(title: string, author: string): Promise<any> {
    const ai = getAIClient();
    const prompt = `Is the book "${title}" by ${author} part of a series? 
    If yes, return the series name, index (e.g. 1 for first book), and the title of the next book.
    If it is a standalone, return null for name.
    Return JSON.`;

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
              name: { type: Type.STRING },
              index: { type: Type.NUMBER },
              total: { type: Type.NUMBER },
              isComplete: { type: Type.BOOLEAN },
              nextBookTitle: { type: Type.STRING }
            }
          }
        }
      });
      return cleanAndParseJSON(response.text);
    } catch {
      return null;
    }
  },

  // NEW: Feature 1 - The Librarian Chat
  async askLibrarian(query: string, libraryContext: Book[]): Promise<string> {
    const ai = getAIClient();
    
    // Create a lightweight context string to save tokens
    const context = libraryContext.map(b => 
      `${b.title} by ${b.author} (${b.tropes?.join(', ')}) [Status: ${b.status}]`
    ).join('\n');

    const prompt = `You are 'The Librarian', a witty, sophisticated archivist of a queer literature collection.
    
    USER QUERY: "${query}"
    
    ARCHIVE CONTEXT:
    ${context}
    
    Directives:
    1. Recommend specific books from the Archive Context if they fit.
    2. If the user asks for something not in the archive, suggest a real book they should add.
    3. Be brief, elegant, and helpful. Max 3 sentences.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 1024 }
        }
      });
      return response.text || "The Librarian is silent.";
    } catch (e) {
      return "I cannot access the stacks at this moment.";
    }
  },

  async summarizeShelf(shelfTitle: string, bookList: {title: string, author: string}[]): Promise<string> {
    const ai = getAIClient();
    const prompt = `You are a high-end curator of queer literature. Provide a beautiful, 2-paragraph "Curator's Note" for a shelf titled "${shelfTitle}" which contains: ${bookList.map(b => `"${b.title}" by ${b.author}`).join(', ')}. Analyze the hidden thematic connections and historical weight of this sub-collection. Use a sophisticated, archival tone.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview',
        contents: {
          role: 'user',
          parts: [{ text: prompt }]
        },
        generationConfig: {
          // @ts-ignore
          thinkingConfig: { thinkingBudget: 1024 }
        }
      });
      return response.response.text() || "Archival synthesis pending...";
    } catch (e) {
      return "The curator is currently unavailable.";
    }
  },

  async suggestLexiconTags(currentTags: string[]): Promise<string[]> {
    const ai = getAIClient();
    const prompt = `Based on these literary tropes found in a queer archive: ${currentTags.join(', ')}, suggest 8 more niche, sophisticated sapphic/queer tropes or thematic signifiers. Return as a JSON array of strings.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview',
        contents: {
          role: 'user',
          parts: [{ text: prompt }]
        },
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
  },

  async fetchByExternalId(type: string, id: string): Promise<any> {
    const ai = getAIClient();
    const prompt = `Research the book with ${type} ID: ${id}. 
    Provide the title, author, ISBN-13, publication year (number), a 2-sentence synopsis, and 3-5 primary tropes. 
    Focus on its significance in queer/sapphic literature. Use Google Search for accuracy. Return as JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview',
        contents: {
          role: 'user',
          parts: [{ text: prompt }]
        },
        generationConfig: {
          // @ts-ignore
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              isbn: { type: Type.STRING },
              publicationYear: { type: Type.NUMBER },
              synopsis: { type: Type.STRING },
              tropes: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['title', 'author']
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
    Use Google Search for ground truth. Return as a JSON object.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview',
        contents: {
          role: 'user',
          parts: [{ text: prompt }]
        },
        generationConfig: {
          // @ts-ignore
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

      const data = cleanAndParseJSON(response.response.text());

      const sources = response.response.candidates?.[0]?.groundingMetadata?.groundingChunks
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
  },

  async recommendBooksByTropes(included: string[], excluded: string[]): Promise<any[]> {
    const ai = getAIClient();
    const prompt = `Suggest 5 high-quality sapphic/queer books that match ALL of these tropes: [${included.join(', ')}] and explicitly DO NOT contain these tropes: [${excluded.join(', ')}].
    For each book, provide the title, author, publication year (number), a very brief 1-sentence synopsis, and list the relevant tropes.
    Use Google Search to find real, highly-rated books. Return as JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview',
        contents: {
          role: 'user',
          parts: [{ text: prompt }]
        },
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

  async discoverResources(criteria: { query: string; offset: number; limit?: number }): Promise<Opportunity[]> {
    const { query = 'Sapphic', offset = 0, limit = 5 } = criteria;
    const ai = getAIClient();
    
    const prompt = `### DIRECTIVE: Execute Asynchronous Opportunity Fetch [OSM-V1.0]
    
    LOGIC PARAMETERS:
    - Target: "${query}"
    - Types: ["Arc", "Contest", "Free Book"]
    - Pagination: OFFSET ${offset}, LIMIT ${limit}
    - Ordering: timestamp DESC
    
    QA VALIDATION:
    - Reject any result where "Sapphic" or "${query}" is not the primary descriptor.
    - Validate link plausibility.
    
    Return a JSON object with a 'resources' array.`;

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
              resources: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    author: { type: Type.STRING },
                    category: { type: Type.STRING, enum: ['Arc', 'Contest', 'Free Book'] },
                    description: { type: Type.STRING },
                    source_link: { type: Type.STRING },
                    timestamp: { type: Type.STRING },
                    validity_score: { type: Type.NUMBER }
                  },
                  required: ['id', 'title', 'category', 'source_link', 'timestamp']
                }
              }
            }
          }
        }
      });

      const data = cleanAndParseJSON(response.text);
      return (data.resources || []).filter((r: Opportunity) => 
        (r.title + r.description).toLowerCase().includes(query.toLowerCase()) || 
        (r.title + r.description).toLowerCase().includes('sapphic')
      );
    } catch (e) {
      console.error("Resource Discovery Failed:", e);
      return [];
    }
  }
};
