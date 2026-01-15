
import React, { useState, useMemo, useEffect } from 'react';
import { NavigationTab } from './types';
import { useArchive } from './hooks/useArchive';
import { useHaptics } from './hooks/useHaptics';
import Layout from './components/Layout';
import Scanner from './components/Scanner';
import Archive from './components/Archive';
import BookDetail from './components/BookDetail';
import AuthorsView from './components/AuthorsView';
import ResourceHunter from './components/ResourceHunter';
import BeholdView from './components/BeholdView';
import LexiconView from './components/LexiconView';
import SettingsView from './components/SettingsView';
import CommandPalette from './components/CommandPalette';
import { geminiService } from './services/gemini';
import { persistenceService } from './services/persistence';
import { UrlNormalizer } from './adapters/UrlIngestor';

const App: React.FC = () => {
  const {
    state,
    activeTab,
    setActiveTab,
    selectedBookId,
    setSelectedBookId,
    searchQuery,
    setSearchQuery,
    updateBook,
    bulkUpdateBooks,
    deleteBook,
    createManualBook,
    addBooks,
    updateAuthor,
    deleteAuthor,
    syncAuthorPulse,
    syncingAuthors,
    activeTasks,
    startTask,
    endTask,
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
  } = useArchive();

  const haptics = useHaptics();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isIngestingUrl, setIsIngestingUrl] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Global Command Palette Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredBooks = useMemo(() => {
    let result = state.books;
    
    // 1. Text Search
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(b => 
        b.title.toLowerCase().includes(query) || 
        b.author.toLowerCase().includes(query) ||
        b.tropes?.some(t => t.toLowerCase().includes(query))
      );
    }

    // 2. Status Filter
    if (state.statusFilter !== 'all') {
      result = result.filter(b => b.status === state.statusFilter);
    }

    // 3. Sorting (Prevent Mutation with spread)
    return [...result].sort((a, b) => {
      switch (state.sortMode) {
        case 'date_asc': return new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime();
        case 'date_desc': return new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime();
        case 'title': return a.title.localeCompare(b.title);
        case 'author': return a.author.localeCompare(b.author);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        default: return 0;
      }
    });
  }, [state.books, searchQuery, state.statusFilter, state.sortMode]);

  const selectedBook = state.books.find(b => b.id === selectedBookId);

  const handleTabChange = (tab: NavigationTab) => {
    if (state.settings.hapticsEnabled) haptics.trigger('light');
    setActiveTab(tab);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  const handleAddAuthor = (name: string) => {
    if (!name.trim()) return;
    updateAuthor(name, { name, biography: 'Initiated...' });
    showToast(`${name} Tracked`);
  };

  const handleSyncAuthor = async (name: string) => {
    showToast(`Syncing ${name}...`);
    const result = await syncAuthorPulse(name);
    if (result.success) {
      showToast(`Archive Updated`);
    } else {
      showToast(`Failed`, "error");
    }
  };

  const handleUrlIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    
    setIsIngestingUrl(true);
    const taskId = startTask('Ingesting URL');
    try {
      const normalized = UrlNormalizer.normalize(urlInput);
      showToast(`Ingesting ${normalized.type}...`);
      
      const details = await geminiService.fetchByExternalId(normalized.type, normalized.id);
      if (details) {
        addBooks([details]);
        setUrlInput('');
        showToast(`"${details.title}" Acquired`);
      } else {
        showToast("Metadata not found", "warning");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsIngestingUrl(false);
      endTask(taskId);
    }
  };

  const handleExport = () => {
    persistenceService.exportArchive(state);
    showToast("Exporting...");
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
      theme={state.theme}
      onToggleTheme={toggleTheme}
      onOpenSettings={() => handleTabChange(NavigationTab.SETTINGS)}
      settings={state.settings}
      onExport={handleExport}
      onImport={importArchive}
      onReset={resetArchive}
      activeTasks={activeTasks}
    >
      <CommandPalette 
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onNavigate={handleTabChange}
        books={state.books}
        authorPulses={state.authorPulses}
        syncingAuthors={syncingAuthors}
        onSyncAuthor={handleSyncAuthor}
        onSelectBook={(id) => {
          setSelectedBookId(id);
          setIsPaletteOpen(false);
        }}
      />

      {/* Simulated Toast within Screen Viewport */}
      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[150] px-4 py-2 bg-brand-deep/90 backdrop-blur-md text-parchment text-[10px] font-bold uppercase tracking-widest rounded-full shadow-2xl border border-parchment/10 animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${toast.type === 'error' ? 'bg-rose-500' : 'bg-brand-cyan shadow-[0_0_8px_rgba(18,130,162,0.6)]'}`} />
            {toast.message}
          </div>
        </div>
      )}

      {selectedBookId && selectedBook ? (
        <div className="fixed inset-0 bg-parchment z-[100] p-4 overflow-y-auto">
          <BookDetail 
            book={selectedBook} 
            shelves={state.shelves}
            isAuthorTracked={!!state.authorPulses[selectedBook.author]}
            isAuthorSyncing={syncingAuthors.has(selectedBook.author)}
            onTrackAuthor={handleAddAuthor}
            onSyncAuthor={handleSyncAuthor}
            onUpdate={(b) => {
              updateBook(b);
            }} 
            onDelete={(id) => {
              deleteBook(id);
              showToast("Volume Burned", "warning");
            }}
            onClose={() => setSelectedBookId(null)}
            onKeyError={() => showToast("Key Error", "error")}
          />
        </div>
      ) : (
        <>
          {activeTab === NavigationTab.LIBRARY && (
            <div className="space-y-6 px-2 pb-24">
              <section className="bg-md-sys-secondaryContainer/10 p-5 rounded-[2rem] border border-md-sys-secondaryContainer/20 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-md-sys-primary">Acquisition Bridge</h3>
                  <span className="text-[8px] font-bold opacity-30 italic">URL Protocols Active</span>
                </div>
                <form onSubmit={handleUrlIngest} className="relative group">
                  <input 
                    type="text"
                    placeholder="Amazon or Goodreads URL..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full bg-parchment border border-brand-deep/10 px-4 py-3 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-md-sys-primary/10 transition-all italic"
                  />
                  <button 
                    disabled={isIngestingUrl}
                    className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-md-sys-primary text-parchment rounded-lg text-[8px] font-bold uppercase tracking-widest disabled:opacity-30"
                  >
                    {isIngestingUrl ? '...' : 'Ingest'}
                  </button>
                </form>
              </section>

              <Archive 
                books={filteredBooks} 
                shelves={state.shelves}
                sortMode={state.sortMode}
                statusFilter={state.statusFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSortChange={setSortMode}
                onFilterChange={setStatusFilter}
                onBookClick={(b) => setSelectedBookId(b.id)}
                onUpdateBook={updateBook}
                onManualAdd={() => {
                   createManualBook();
                   showToast("Manual Folio Created");
                }}
                onBulkUpdate={(ids, updates) => {
                  bulkUpdateBooks(ids, updates);
                  showToast(`Updated ${ids.length} Volumes`);
                }}
                onBulkDelete={(ids) => {
                  ids.forEach(id => deleteBook(id));
                  showToast(`${ids.length} Volumes Burned`, "warning");
                }}
              />
            </div>
          )}

          {activeTab === NavigationTab.BEHOLD && (
            <div className="px-4">
              <BeholdView 
                books={state.books} 
                shelves={state.shelves} 
                onBookClick={(b) => setSelectedBookId(b.id)} 
                onCreateShelf={(name) => {
                  createShelf(name);
                  showToast("Shelf Constructed");
                }}
                onDeleteShelf={(id) => {
                   deleteShelf(id);
                   showToast("Shelf Dismantled");
                }}
              />
            </div>
          )}

          {activeTab === NavigationTab.LEXICON && (
            <div className="px-4">
              <LexiconView 
                books={state.books}
                lexiconFavorites={state.lexiconFavorites}
                onBookClick={(b) => setSelectedBookId(b.id)}
                onUpdateBook={updateBook}
                onAcquireBook={(b) => {
                  addBooks([b]);
                  showToast(`${b.title} Inscribed`);
                }}
                onAddFavorite={addLexiconFavorite}
                onRemoveFavorite={removeLexiconFavorite}
                canadianFocus={state.settings.canadianFocus}
                startTask={startTask}
                endTask={endTask}
              />
            </div>
          )}

          {activeTab === NavigationTab.SCANNER && (
            <div className="px-4">
              <Scanner 
                onBooksFound={(books) => {
                  addBooks(books);
                  showToast(`Acquired ${books.length} Books`);
                  setActiveTab(NavigationTab.LIBRARY);
                }} 
                onScanningStateChange={() => {}} 
                onKeyError={() => showToast("Invalid Key", "error")}
              />
            </div>
          )}

          {activeTab === NavigationTab.PULSES && (
            <div className="px-4">
              <AuthorsView 
                authorPulses={state.authorPulses} 
                bookStatuses={state.bookStatuses}
                authorFilter={state.authorFilter}
                authorSearchTerm={state.authorSearchTerm}
                onUpdateAuthor={updateAuthor}
                onBulkUpdateAuthors={bulkUpdateAuthors}
                onToggleBookStatus={(a, b, t) => {
                  toggleBookStatus(a, b, t);
                  showToast(`Marked as ${t}`);
                }}
                onSetAuthorFilter={setAuthorFilter}
                onSetAuthorSearchTerm={setAuthorSearchTerm}
                onAddAuthor={handleAddAuthor}
                onDeleteAuthor={(name) => {
                  deleteAuthor(name);
                  showToast("Scribe Untracked", "warning");
                }}
                libraryBooks={state.books}
              />
            </div>
          )}

          {activeTab === NavigationTab.DISCOVER && (
            <div className="px-4">
              <ResourceHunter />
            </div>
          )}

          {activeTab === NavigationTab.SETTINGS && (
            <div className="px-4">
              <SettingsView 
                settings={state.settings}
                onUpdateSettings={updateSettings}
                onExport={handleExport}
                onImport={importArchive}
                onReset={resetArchive}
                theme={state.theme}
                onToggleTheme={toggleTheme}
              />
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default App;
