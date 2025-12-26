
export type Theme = 'light' | 'dark' | 'sepia';
export type AuthorFilterMode = 'all' | 'favorites' | 'batch';
export type BookStatus = 'DRAFT' | 'REVIEW_REQUIRED' | 'PUBLISHED';

export type TagState = 'include' | 'exclude' | 'neutral';

export interface Shelf {
  id: string;
  title: string;
  description?: string;
  isVirtual?: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  coverUrl?: string;
  tropes?: string[];
  synopsis?: string;
  scannedAt: string;
  shelfId?: string | null;
  isCanadian?: boolean;
  metadata?: {
    publisher?: string;
  };
}

export interface AuthorRelease {
  title: string;
  releaseDate: string;
  synopsis?: string;
  isUpcoming?: boolean;
}

export interface AuthorPulse {
  name: string;
  biography?: string;
  historicalContext?: string;
  bibliography?: string[];
  releases?: AuthorRelease[];
  sources?: { title: string; uri: string }[];
  lastChecked?: string;
  isFavorite?: boolean;
}

// --- Zero-Failure Opportunity Discriminated Unions ---
export type OpportunityType = 'Arc' | 'Contest' | 'Free Book';

export interface Opportunity {
  id: string;
  title: string;
  author: string;
  category: OpportunityType;
  description: string;
  source_link: string;
  timestamp: string; // ISO8601
  validity_score?: number;
}

export interface ArchiveState {
  version: string;
  books: Book[];
  shelves: Shelf[];
  authorPulses: Record<string, AuthorPulse>;
  bookStatuses: Record<string, { read: boolean; wishlist: boolean }>;
  theme: Theme;
  authorFilter: AuthorFilterMode;
  authorSearchTerm: string;
  settings: {
    canadianFocus: boolean;
    autoEnrich: boolean;
    hapticsEnabled: boolean;
  };
}

export enum NavigationTab {
  SCANNER = 'scanner',
  LIBRARY = 'library',
  BEHOLD = 'behold',
  PULSES = 'pulses',
  LEXICON = 'lexicon',
  DISCOVER = 'discover',
  SETTINGS = 'settings'
}
