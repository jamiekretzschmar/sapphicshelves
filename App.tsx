
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
    addBooks,
    updateAuthor,
    syncAuthorPulse,
    syncingAuthors,
    bulkUpdateAuthors,
    toggleBookStatus,
    setAuthorFilter,
    setAuthorSearchTerm,
    toggleTheme
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
    const query = searchQuery.toLowerCase().trim();
    if (!query) return state.books;
    return state.books.filter(b => 
      b.title.toLowerCase().includes(query) || 
      b.author.toLowerCase().includes(query) ||
      b.tropes?.some(t => t.toLowerCase().includes(query))
    );
  }, [state.books, searchQuery]);

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
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[150] px-4 py-2 bg-brand-deep/90 backdrop-blur-md text-parchment text-[10px] font-bold uppercase tracking-widest rounded-full shadow-2xl border border-parchment/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
            isAuthorTracked={!!state.authorPulses[selectedBook.author]}
            isAuthorSyncing={syncingAuthors.has(selectedBook.author)}
            onTrackAuthor={handleAddAuthor}
            onSyncAuthor={handleSyncAuthor}
            onUpdate={(b) => {
              updateBook(b);
              showToast("Folio Updated");
            }} 
            onClose={() => setSelectedBookId(null)}
            onKeyError={() => showToast("Key Error", "error")}
          />
        </div>
      ) : (
        <>
          {activeTab === NavigationTab.LIBRARY && (
            <div className="space-y-6 px-2">
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

              <div className="px-2">
                <input 
                  type="text"
                  placeholder="Search Monograph..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-md-sys-surface border border-brand-deep/10 px-5 py-4 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-md-sys-primary/10 transition-all italic shadow-sm"
                />
              </div>

              <Archive 
                books={filteredBooks} 
                onBookClick={(b) => setSelectedBookId(b.id)} 
                onTrackAuthor={handleAddAuthor}
                isAuthorTracked={(name) => !!state.authorPulses[name]}
              />
            </div>
          )}

          {activeTab === NavigationTab.BEHOLD && (
            <div className="px-4">
              <BeholdView 
                books={state.books} 
                shelves={state.shelves} 
                onBookClick={(b) => setSelectedBookId(b.id)} 
              />
            </div>
          )}

          {activeTab === NavigationTab.LEXICON && (
            <div className="px-4">
              <LexiconView 
                books={state.books}
                onBookClick={(b) => setSelectedBookId(b.id)}
                onUpdateBook={updateBook}
                onAcquireBook={(b) => {
                  addBooks([b]);
                  showToast(`${b.title} Inscribed`);
                }}
                canadianFocus={state.settings.canadianFocus}
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
            <div className="space-y-6 p-4 text-center py-20">
               <div className="w-20 h-20 bg-brand-deep rounded-full flex items-center justify-center text-parchment font-header italic text-3xl mx-auto border-4 border-brand-cyan/20">A</div>
               <h2 className="font-header text-3xl italic text-brand-deep mt-4">Archivist Protocols</h2>
               <p className="text-xs text-ink/40 max-w-xs mx-auto">Access the side navigation drawer (top left) for full monograph settings and archival exports.</p>
               <button 
                 onClick={() => { haptics.trigger('medium'); setActiveTab(NavigationTab.LIBRARY); }}
                 className="mt-8 px-8 py-3 bg-brand-deep text-parchment rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl"
               >
                 Return to Monograph
               </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default App;
