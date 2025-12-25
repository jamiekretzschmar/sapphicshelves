
import { useState, useEffect, useCallback } from 'react';
import { ArchiveState, Book, AuthorPulse, NavigationTab, Theme } from '../types';
import { persistenceService } from '../services/persistence';

export function useArchive() {
  const [state, setState] = useState<ArchiveState>(persistenceService.load());
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.LIBRARY);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const addBooks = useCallback((newBooks: any[]) => {
    setState(prev => ({
      ...prev,
      books: [...newBooks.map(b => ({
        id: Math.random().toString(36).substr(2, 9),
        ...b,
        scannedAt: new Date().toISOString()
      })), ...prev.books]
    }));
  }, []);

  const updateAuthor = useCallback((name: string, data: Partial<AuthorPulse>) => {
    setState(prev => {
      const current = prev.authorPulses[name] || { name, biography: '', historicalContext: '', bibliography: [], sources: [] };
      return {
        ...prev,
        authorPulses: { ...prev.authorPulses, [name]: { ...current, ...data } }
      };
    });
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
    toggleTheme
  };
}
