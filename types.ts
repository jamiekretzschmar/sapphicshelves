
export type Theme = 'light' | 'dark' | 'sepia';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  synopsis?: string;
  tropes?: string[];
  coverUrl?: string;
  scannedAt: string;
  rating?: number;
  personalNotes?: string;
  sourceUrls?: string[];
  isCanadian?: boolean;
}

export interface AuthorRelease {
  title: string;
  releaseDate: string;
  isUpcoming: boolean;
  synopsis?: string;
}

export interface AuthorPulse {
  name: string;
  biography: string;
  historicalContext: string;
  bibliography: string[];
  sources: Array<{ title: string; uri: string }>;
  lastPulse?: string;
  isFavorite?: boolean;
  releases?: AuthorRelease[];
  lastChecked?: string;
}

export interface ArchiveState {
  version: string;
  books: Book[];
  authorPulses: Record<string, AuthorPulse>;
  apiKeyReady: boolean;
  archivistIcon?: string;
  theme: Theme;
  settings: {
    canadianFocus: boolean;
    autoEnrich: boolean;
  };
}

export enum NavigationTab {
  SCANNER = 'scanner',
  LIBRARY = 'library',
  PULSES = 'pulses',
  DISCOVER = 'discover',
  SETTINGS = 'settings'
}
