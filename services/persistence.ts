
import { ArchiveState } from '../types';

const STORAGE_KEY = 'sapphic_shelves_archive_v2';

export const persistenceService = {
  async save(state: ArchiveState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  load(): ArchiveState {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // Fix: Add missing 'version' and 'theme' properties to satisfy ArchiveState interface
      return {
        version: '2.0.0',
        books: [],
        authorPulses: {},
        apiKeyReady: false,
        theme: 'light',
        settings: {
          canadianFocus: false,
          autoEnrich: true
        }
      };
    }
    const parsed = JSON.parse(data);
    // Ensure settings exist for legacy data
    if (!parsed.settings) {
      parsed.settings = { canadianFocus: false, autoEnrich: true };
    }
    // Fix: Ensure 'version' and 'theme' exist for legacy data consistency with the ArchiveState type
    if (!parsed.version) {
      parsed.version = '2.0.0';
    }
    if (!parsed.theme) {
      parsed.theme = 'light';
    }
    return parsed;
  },

  async clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
};
