
export type Theme = 'light' | 'dark' | 'sepia';
export type AuthorFilterMode = 'all' | 'favorites' | 'batch';
export type BookStatus = 'tbr' | 'reading' | 'read' | 'dnf';
export type SortOption = 'date_desc' | 'date_asc' | 'title' | 'author' | 'rating';

export type TagState = 'include' | 'exclude' | 'neutral';

// Global Window Extension for Project IDX / AI Studio
declare global {
  interface AIStudio {
    openSelectKey: () => Promise<void>;
    hasSelectedApiKey: () => Promise<boolean>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

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
  publicationYear?: number;
  tropes?: string[];
  userTags?: string[]; // Manual tags
  synopsis?: string;
  scannedAt: string;
  shelfId?: string | null;
  isCanadian?: boolean;
  
  // Metacognition
  status: BookStatus;
  rating?: number; // 0-5
  userNotes?: string;
  startedAt?: string;
  finishedAt?: string;
  
  metadata?: {
    publisher?: string;
    pageCount?: number;
  };
  sources?: { title: string; uri: string }[];
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

export interface SystemTask {
  id: string;
  label: string;
}

export interface ArchiveState {
  version: string;
  books: Book[];
  shelves: Shelf[];
  authorPulses: Record<string, AuthorPulse>;
  bookStatuses: Record<string, { read: boolean; wishlist: boolean }>; // Added missing field
  lexiconFavorites: string[]; // User defined trope favorites
  theme: Theme;
  authorFilter: AuthorFilterMode;
  authorSearchTerm: string;
  
  // View State Persistence
  sortMode: SortOption;
  statusFilter: BookStatus | 'all';

  settings: {
    canadianFocus: boolean;
    autoEnrich: boolean;
    hapticsEnabled: boolean;
    largeText: boolean;
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