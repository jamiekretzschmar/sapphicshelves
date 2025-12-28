
import { useState, useEffect, useCallback, useRef } from 'react';
import { ArchiveState, Book, AuthorPulse, NavigationTab, Theme, AuthorFilterMode } from '../types';
import { persistenceService } from '../services/persistence';
import { geminiService } from '../services/gemini';

export function useArchive() {
  const [state, setState] = useState<ArchiveState>(persistenceService.load());
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.LIBRARY);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingAuthors, setSyncingAuthors] = useState<Set<string>>(new Set());
  const enrichmentQueue = useRef<Set<string>>(new Set());

  useEffect(() => {
    persistenceService.save(state);
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state]);

  const updateBook = useCallback((updatedBook: Book) => {
    setState(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === updatedBook.id ? updatedBook : b)
    }));
  }, []);

  const enrichVolume = useCallback(async (book: Book) => {
    if (enrichmentQueue.current.has(book.id)) return;
    enrichmentQueue.current.add(book.id);
    
    try {
      const enrichment = await geminiService.enrichBook(book.title, book.author);
      setState(prev => ({
        ...prev,
        books: prev.books.map(b => b.id === book.id ? { ...b, ...enrichment } : b)
      }));
    } catch (e) {
      console.error(`Failed to enrich volume ${book.title}:`, e);
    } finally {
      enrichmentQueue.current.delete(book.id);
    }
  }, []);

  const addBooks = useCallback((newBooks: any[]) => {
    const initializedBooks: Book[] = newBooks.map(b => ({
      id: Math.random().toString(36).substr(2, 9),
      ...b,
      scannedAt: new Date().toISOString()
    }));

    setState(prev => {
      const updatedPulses = { ...prev.authorPulses };
      
      // Ensure every author is added to the pulse section immediately
      initializedBooks.forEach(book => {
        if (!updatedPulses[book.author]) {
          updatedPulses[book.author] = {
            name: book.author,
            biography: 'Initiated...',
            historicalContext: '',
            bibliography: [],
            sources: [],
            lastChecked: undefined,
            isFavorite: false
          };
        }
      });

      return {
        ...prev,
        books: [...initializedBooks, ...prev.books],
        authorPulses: updatedPulses
      };
    });

    // Trigger auto-enrichment for covers and tropes
    if (state.settings.autoEnrich) {
      initializedBooks.forEach(book => enrichVolume(book));
    }
  }, [state.settings.autoEnrich, enrichVolume]);

  const updateAuthor = useCallback((name: string, data: Partial<AuthorPulse>) => {
    setState(prev => {
      const current = prev.authorPulses[name] || { name, biography: '', historicalContext: '', bibliography: [], sources: [] };
      return {
        ...prev,
        authorPulses: { ...prev.authorPulses, [name]: { ...current, ...data } }
      };
    });
  }, []);

  const syncAuthorPulse = useCallback(async (name: string) => {
    setSyncingAuthors(prev => new Set(prev).add(name));
    try {
      const fullRecord = await geminiService.syncAuthorFullRecord(name);
      
      const updateData = { 
        ...fullRecord,
        lastChecked: new Date().toISOString() 
      };
      
      setState(prev => {
        const current = prev.authorPulses[name] || { name };
        return {
          ...prev,
          authorPulses: { ...prev.authorPulses, [name]: { ...current, ...updateData } }
        };
      });
      return { success: true };
    } catch (e: any) {
      console.error("Author sync failed:", e);
      return { success: false, error: e.message };
    } finally {
      setSyncingAuthors(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
  }, []);

  const bulkUpdateAuthors = useCallback((newPulses: Record<string, AuthorPulse>) => {
    setState(prev => ({
      ...prev,
      authorPulses: { ...prev.authorPulses, ...newPulses }
    }));
  }, []);

  const toggleBookStatus = useCallback((authorName: string, bookTitle: string, type: 'read' | 'wishlist') => {
    setState(prev => {
      const key = `${authorName}|${bookTitle}`;
      const current = prev.bookStatuses?.[key] || { read: false, wishlist: false };
      return {
        ...prev,
        bookStatuses: {
          ...prev.bookStatuses,
          [key]: { ...current, [type]: !current[type] }
        }
      };
    });
  }, []);

  const setAuthorFilter = useCallback((filter: AuthorFilterMode) => {
    setState(prev => ({ ...prev, authorFilter: filter }));
  }, []);

  const setAuthorSearchTerm = useCallback((term: string) => {
    setState(prev => ({ ...prev, authorSearchTerm: term }));
  }, []);

  const toggleTheme = useCallback(() => {
    const themes: Theme[] = ['light', 'dark', 'sepia'];
    setState(prev => ({
      ...prev,
      theme: themes[(themes.indexOf(prev.theme) + 1) % themes.length]
    }));
  }, []);

  return {
    state,
    setState,
    activeTab,
    setActiveTab,
    selectedBookId,
    setSelectedBookId,
    searchQuery,
    setSearchQuery,
    updateBook,
    addBooks,
    updateAuthor,
    enrichVolume,
    syncAuthorPulse,
    syncingAuthors,
    bulkUpdateAuthors,
    toggleBookStatus,
    setAuthorFilter,
    setAuthorSearchTerm,
    toggleTheme
  };
}
