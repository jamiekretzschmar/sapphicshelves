import { ArchiveState } from '../types';

const STORAGE_KEY = 'sapphic_shelves_archive_v4';
const CURRENT_VERSION = '4.0.0';

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
      bookStatuses: {},
      theme: 'light',
      authorFilter: 'all',
      authorSearchTerm: '',
      settings: {
        canadianFocus: false,
        autoEnrich: true,
        hapticsEnabled: true
      }
    };

    if (!data) return defaults;

    try {
      const parsed = JSON.parse(data);
      // Version Migration Logic
      if (parsed.version !== CURRENT_VERSION) {
        console.log(`Migrating archive from ${parsed.version} to ${CURRENT_VERSION}`);
        return { ...defaults, ...parsed, version: CURRENT_VERSION };
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
  }
};