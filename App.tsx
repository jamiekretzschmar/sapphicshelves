
import React, { useMemo, useRef } from 'react';
import { NavigationTab } from './types';
import { useArchive } from './hooks/useArchive';
import Layout from './components/Layout';
import Scanner from './components/Scanner';
import Archive from './components/Archive';
import BookDetail from './components/BookDetail';
import AuthorsView from './components/AuthorsView';
import { geminiService } from './services/gemini';

const App: React.FC = () => {
  const {
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
  } = useArchive();

  const importFileRef = useRef<HTMLInputElement>(null);

  const filteredBooks = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return state.books.filter(b => 
      b.title.toLowerCase().includes(query) || 
      b.author.toLowerCase().includes(query) ||
      b.tropes?.some(t => t.toLowerCase().includes(query))
    );
  }, [state.books, searchQuery]);

  const selectedBook = state.books.find(b => b.id === selectedBookId);

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      archivistIcon={state.archivistIcon}
      theme={state.theme}
      onToggleTheme={toggleTheme}
    >
      {selectedBookId && selectedBook ? (
        <BookDetail 
          book={selectedBook} 
          onUpdate={updateBook} 
          onClose={() => setSelectedBookId(null)} 
        />
      ) : (
        <>
          {activeTab === NavigationTab.LIBRARY && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <section className="bg-mica-surface border border-ink/5 p-6 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="font-header text-3xl">The Monograph</h2>
                  <p className="text-[10px] text-ink/40 uppercase tracking-widest">{state.books.length} Volumes Curated</p>
                </div>
              </section>

              <div className="relative group">
                <input 
                  type="text"
                  placeholder="Filter the archive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-mica-surface border border-ink/10 px-5 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all italic"
                />
                <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block text-[10px] bg-ink/5 px-2 py-1 rounded border border-ink/10 opacity-40">⌘K</kbd>
              </div>

              <Archive books={filteredBooks} onBookClick={(b) => setSelectedBookId(b.id)} />
            </div>
          )}

          {activeTab === NavigationTab.SCANNER && (
            <Scanner onBooksFound={addBooks} onScanningStateChange={() => {}} />
          )}

          {activeTab === NavigationTab.PULSES && (
            <AuthorsView 
              authorPulses={state.authorPulses} 
              onUpdateAuthor={updateAuthor}
              onAddAuthor={(name) => updateAuthor(name, { name, biography: 'Initiated...' })}
            />
          )}

          {activeTab === NavigationTab.SETTINGS && (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
              <section className="bg-mica-surface border border-ink/5 p-8 rounded-3xl space-y-6">
                <h2 className="font-header text-3xl border-b border-ink/5 pb-4">Folio Protocol</h2>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-sm">Visual Theme</h4>
                    <p className="text-[10px] text-ink/50">Current: {state.theme.toUpperCase()}</p>
                  </div>
                  <button onClick={toggleTheme} className="px-4 py-2 border border-ink rounded-lg text-[10px] uppercase font-bold tracking-widest hover:bg-ink hover:text-parchment transition-all">
                    Cycle Appearance
                  </button>
                </div>
              </section>
              
              <section className="bg-ink text-parchment p-8 rounded-3xl text-center space-y-4 shadow-xl">
                 <p className="font-header text-xl italic">"Your library is a map of your soul."</p>
                 <div className="text-[8px] tracking-[0.3em] uppercase opacity-40">Sapphic Shelves v4.5 | Production Build</div>
              </section>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default App;
