export class UrlNormalizer {
  /**
   * Universal URL Adapter Protocol: 
   * Transforms raw ingestion links into normalized archival identifiers.
   */
  static normalize(url: string): { type: 'AMAZON' | 'GOODREADS' | 'PLAYBOOKS', id: string } {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();

      // Amazon Acquisition Protocol
      if (hostname.includes('amazon.')) {
        const asinMatch = parsedUrl.pathname.match(/\/(dp|gp\/product)\/([A-Z0-9]{10})/);
        if (asinMatch && asinMatch[2]) {
          return { type: 'AMAZON', id: asinMatch[2] };
        }
      }

      // Goodreads Archival Protocol
      if (hostname.includes('goodreads.com')) {
        const gdMatch = parsedUrl.pathname.match(/\/book\/show\/(\d+)/);
        if (gdMatch && gdMatch[1]) {
          return { type: 'GOODREADS', id: gdMatch[1] };
        }
      }

      // Google Playbooks Protocol
      if (hostname.includes('play.google.com')) {
        const idParam = parsedUrl.searchParams.get('id');
        if (idParam) {
          return { type: 'PLAYBOOKS', id: idParam };
        }
      }

      throw new Error("The provided link does not map to a recognized volume.");
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "The provided link does not map to a recognized volume.");
    }
  }
}