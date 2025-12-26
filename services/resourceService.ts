
import { Opportunity, OpportunityType } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

export class ResourceHunterService {
  /**
   * ACTOR: System Core (Sapphic Shelves Architecture)
   * TASK: Execute Asynchronous Opportunity Fetch (OSM-V1.0)
   */
  async discoverResources(criteria: { query: string; offset: number; limit?: number }): Promise<Opportunity[]> {
    const { query = 'Sapphic', offset = 0, limit = 5 } = criteria;
    
    // Logic Parameters: 100% Thematic Relevance
    const prompt = `### DIRECTIVE: Execute Asynchronous Opportunity Fetch [OSM-V1.0]
    
    LOGIC PARAMETERS:
    - Target: "Sapphic"
    - Types: ["Arc", "Contest", "Free Book"]
    - Pagination: OFFSET ${offset}, LIMIT ${limit}
    - Ordering: timestamp DESC
    
    QA VALIDATION:
    - Reject any result where "Sapphic" is not the primary descriptor.
    - Validate link plausibility.
    
    Return a JSON object with a 'resources' array.`;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    try {
      const data = JSON.parse(response.text || '{"resources": []}');
      // Ruthless QA: Second pass filtering
      return (data.resources || []).filter((r: Opportunity) => 
        (r.title + r.description).toLowerCase().includes('sapphic')
      );
    } catch (e) {
      console.error("OSM-V1.0 Execution Failure:", e);
      return [];
    }
  }
}

export const resourceHunterService = new ResourceHunterService();
