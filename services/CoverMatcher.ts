
import { Book } from '../types';

export class CoverMatcher {
  /**
   * Implements a weighted Levenshtein-based confidence scorer.
   * Score = (TitleMatch * 0.4) + (AuthorMatch * 0.3) + (PublisherMatch * 0.3)
   */
  static calculateMatchScore(local: Partial<Book>, remote: any): number {
    const fuzzyMatch = (s1: string, s2: string): number => {
      if (!s1 || !s2) return 0;
      const a = s1.toLowerCase().trim();
      const b = s2.toLowerCase().trim();
      if (a === b) return 100;
      
      const matrix = Array.from({ length: a.length + 1 }, () => 
        Array.from({ length: b.length + 1 }, () => 0)
      );

      for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
      for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }

      const distance = matrix[a.length][b.length];
      const maxLength = Math.max(a.length, b.length);
      return Math.round((1 - distance / maxLength) * 100);
    };

    const titleScore = fuzzyMatch(local.title || '', remote.title || '') * 0.4;
    // Fix: access author property correctly and check for common remote field names
    const authorScore = fuzzyMatch(local.author || '', remote.authors?.[0] || remote.author || '') * 0.3;
    // Fix: access metadata through optional chaining
    const publisherScore = (local.metadata?.publisher === remote.publisher ? 100 : 0) * 0.3;

    return Math.min(100, Math.round(titleScore + authorScore + publisherScore));
  }
}
