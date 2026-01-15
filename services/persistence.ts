
import { ArchiveState, Book } from '../types';

const STORAGE_KEY = 'sapphic_shelves_archive_v5';
const CURRENT_VERSION = '5.0.0';

export const persistenceService = {
  save(state: ArchiveState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Archive persistence failure:", e);
    }
  },

  load(): ArchiveState {
    const data = localStorage.getItem(STORAGE_KEY);
    const defaults: ArchiveState = {
      version: CURRENT_VERSION,
      books: [],
      shelves: [],
      authorPulses: {},
      lexiconFavorites: [],
      theme: 'light',
      authorFilter: 'all',
      authorSearchTerm: '',
      sortMode: 'date_desc',
      statusFilter: 'all',
      settings: {
        canadianFocus: false,
        autoEnrich: true,
        hapticsEnabled: true,
        largeText: false
      }
    };

    if (!data) return defaults;

    try {
      const parsed = JSON.parse(data);
      
      // Version Migration Logic
      if (parsed.version !== CURRENT_VERSION) {
        console.log(`Migrating archive from ${parsed.version} to ${CURRENT_VERSION}`);
        
        // Migrate books to include new fields if missing
        const migratedBooks = (parsed.books || []).map((b: any) => ({
          ...b,
          status: b.status || 'tbr',
          rating: b.rating || 0,
          userNotes: b.userNotes || '',
          userTags: b.userTags || []
        }));

        return { 
          ...defaults, 
          ...parsed, 
          books: migratedBooks,
          lexiconFavorites: parsed.lexiconFavorites || [],
          version: CURRENT_VERSION 
        };
      }
      return { ...defaults, ...parsed };
    } catch (e) {
      console.warn("Archive corruption detected. Resetting to defaults.");
      return defaults;
    }
  },

  exportArchive(state: ArchiveState) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archive_protocol_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  },

  async importArchive(file: File): Promise<ArchiveState | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          // Basic validation
          if (!parsed.books || !Array.isArray(parsed.books)) {
             reject(new Error("Invalid archive format"));
             return;
          }
          // Force version update on import
          resolve({ ...parsed, version: CURRENT_VERSION });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
};