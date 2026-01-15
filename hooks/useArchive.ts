
import { useState, useEffect, useCallback, useRef } from 'react';
import { ArchiveState, Book, AuthorPulse, NavigationTab, Theme, AuthorFilterMode, SortOption, BookStatus, SystemTask } from '../types';
import { persistenceService } from '../services/persistence';
import { geminiService } from '../services/gemini';

export function useArchive() {
  const [state, setState] = useState<ArchiveState>(persistenceService.load());
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.LIBRARY);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingAuthors, setSyncingAuthors] = useState<Set<string>>(new Set());
  const [activeTasks, setActiveTasks] = useState<SystemTask[]>([]);
  const enrichmentQueue = useRef<Set<string>>(new Set());

  useEffect(() => {
    persistenceService.save(state);
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state]);

  const startTask = useCallback((label: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setActiveTasks(prev => [...prev, { id, label }]);
    return id;
  }, []);

  const endTask = useCallback((id: string) => {
    setActiveTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateBook = useCallback((updatedBook: Book) => {
    setState(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === updatedBook.id ? updatedBook : b)
    }));
  }, []);

  const deleteBook = useCallback((bookId: string) => {
    setState(prev => ({
      ...prev,
      books: prev.books.filter(b => b.id !== bookId)
    }));
  }, []);

  const createManualBook = useCallback(() => {
    const newBook: Book = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Untitled Volume',
      author: 'Unknown Scribe',
      scannedAt: new Date().toISOString(),
      status: 'tbr',
      rating: 0,
      userNotes: '',
      tropes: []
    };
    setState(prev => ({ ...prev, books: [newBook, ...prev.books] }));
    setSelectedBookId(newBook.id);
  }, []);

  const enrichVolume = useCallback(async (book: Book) => {
    if (enrichmentQueue.current.has(book.id)) return;
    enrichmentQueue.current.add(book.id);
    const taskId = startTask(`Enriching ${book.title}`);
    
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
      endTask(taskId);
    }
  }, [startTask, endTask]);

  const addBooks = useCallback((newBooks: any[]) => {
    const initializedBooks: Book[] = newBooks.map(b => ({
      id: Math.random().toString(36).substr(2, 9),
      status: 'tbr',
      rating: 0,
      ...b,
      scannedAt: new Date().toISOString()
    }));

    setState(prev => {
      const updatedPulses = { ...prev.authorPulses };
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
    const taskId = startTask(`Researching ${name}`);
    try {
      const fullRecord = await geminiService.syncAuthorFullRecord(name);
      const updateData = { ...fullRecord, lastChecked: new Date().toISOString() };
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
      endTask(taskId);
    }
  }, [startTask, endTask]);

  const bulkUpdateAuthors = useCallback((newPulses: Record<string, AuthorPulse>) => {
    setState(prev => ({
      ...prev,
      authorPulses: { ...prev.authorPulses, ...newPulses }
    }));
  }, []);

  // Shelf Management
  const createShelf = useCallback((title: string) => {
    const newShelf = { id: Math.random().toString(36).substr(2, 9), title, description: 'Custom Collection' };
    setState(prev => ({ ...prev, shelves: [...prev.shelves, newShelf] }));
  }, []);

  const deleteShelf = useCallback((id: string) => {
    setState(prev => ({ ...prev, shelves: prev.shelves.filter(s => s.id !== id) }));
  }, []);

  // View Controls
  const setSortMode = useCallback((mode: SortOption) => {
    setState(prev => ({ ...prev, sortMode: mode }));
  }, []);

  const setStatusFilter = useCallback((status: BookStatus | 'all') => {
    setState(prev => ({ ...prev, statusFilter: status }));
  }, []);

  // Legacy support for toggleBookStatus
  const toggleBookStatus = useCallback((authorName: string, bookTitle: string, type: 'read' | 'wishlist') => {
     setState(prev => {
        const key = `${authorName}|${bookTitle}`;
        // @ts-ignore
        const current = prev.bookStatuses?.[key] || { read: false, wishlist: false };
        return {
          ...prev,
          bookStatuses: {
            // @ts-ignore
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

  const updateSettings = useCallback((newSettings: Partial<ArchiveState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  }, []);

  const importArchive = useCallback(async (file: File) => {
      try {
          const newState = await persistenceService.importArchive(file);
          if (newState) setState(newState);
          return true;
      } catch (e) {
          console.error(e);
          return false;
      }
  }, []);

  const resetArchive = useCallback(() => {
      persistenceService.reset();
  }, []);

  // Lexicon Favorites Logic
  const addLexiconFavorite = useCallback((tag: string) => {
    setState(prev => {
        if (prev.lexiconFavorites.includes(tag)) return prev;
        return { ...prev, lexiconFavorites: [...prev.lexiconFavorites, tag] };
    });
  }, []);

  const removeLexiconFavorite = useCallback((tag: string) => {
    setState(prev => ({
        ...prev,
        lexiconFavorites: prev.lexiconFavorites.filter(t => t !== tag)
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
    deleteBook,
    createManualBook,
    addBooks,
    updateAuthor,
    enrichVolume,
    syncAuthorPulse,
    syncingAuthors,
    activeTasks, // Expose active tasks
    startTask,   // Expose for manual task tracking
    endTask,     // Expose for manual task tracking
    bulkUpdateAuthors,
    toggleBookStatus,
    setAuthorFilter,
    setAuthorSearchTerm,
    toggleTheme,
    updateSettings,
    createShelf,
    deleteShelf,
    setSortMode,
    setStatusFilter,
    importArchive,
    resetArchive,
    addLexiconFavorite,
    removeLexiconFavorite
  };
}