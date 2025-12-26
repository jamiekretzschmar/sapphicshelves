
import React, { useState, useEffect, useMemo } from 'react';
import { Book, NavigationTab, AuthorPulse } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
  books: Book[];
  authorPulses: Record<string, AuthorPulse>;
  syncingAuthors: Set<string>;
  onSyncAuthor: (name: string) => void;
  onSelectBook: (id: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate, 
  books, 
  authorPulses, 
  syncingAuthors,
  onSyncAuthor,
  onSelectBook 
}) => {
  const [query, setQuery] = useState('');
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose(); 
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (query.length < 2) return { books: [], authors: [] };
    const q = query.toLowerCase();
    
    return {
      books: books.filter(b => b.title.toLowerCase().includes(q)).slice(0, 5),
      // Fix: Explicitly cast Object.values to AuthorPulse[] to resolve the 'unknown' type error on 'name'
      authors: (Object.values(authorPulses) as AuthorPulse[]).filter(a => a.name.toLowerCase().includes(q)).slice(0, 3)
    };
  }, [query, books, authorPulses]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="mica-surface w-full max-w-xl rounded-2xl shadow-2xl border border-ink/10 overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-ink/5">
          <input 
            autoFocus
            type="text"
            placeholder="Search volumes or sync scribes..."
            className="w-full bg-transparent outline-none text-lg italic"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        <div className="p-2 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Authors Section */}
          {results.authors.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink/40 px-3 mb-1">Tracked Scribes</p>
              {results.authors.map(a => {
                const isSyncing = syncingAuthors.has(a.name);
                return (
                  <div key={a.name} className="flex items-center justify-between p-3 hover:bg-plum/5 rounded-xl transition-colors group">
                    <div className="flex flex-col">
                      <span className="font-header text-lg italic">{a.name}</span>
                      <span className="text-[8px] uppercase tracking-widest text-ink/30">Movement: {a.historicalContext || 'Unknown'}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onSyncAuthor(a.name); }}
                      disabled={isSyncing}
                      className={`p-2 rounded-lg transition-all ${isSyncing ? 'bg-ink/5 text-rose' : 'text-plum hover:bg-plum hover:text-parchment'}`}
                    >
                      {isSyncing ? (
                         <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Books Section */}
          {results.books.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink/40 px-3 mb-1">Monograph Volumes</p>
              {results.books.map(b => (
                <button 
                  key={b.id} 
                  onClick={() => { onSelectBook(b.id); onClose(); }}
                  className="w-full text-left p-3 hover:bg-rose/5 rounded-xl transition-colors flex justify-between items-center"
                >
                  <span className="font-header text-lg">{b.title}</span>
                  <span className="text-[10px] text-ink/30 italic">{b.author}</span>
                </button>
              ))}
            </div>
          )}

          {/* Navigation Section */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-ink/40 px-3 mb-1">Archival Navigation</p>
            <div className="grid grid-cols-2 gap-2">
              <NavButton label="Archive Library" onClick={() => onNavigate(NavigationTab.LIBRARY)} />
              <NavButton label="Scanner Input" onClick={() => onNavigate(NavigationTab.SCANNER)} />
              <NavButton label="Author Pulses" onClick={() => onNavigate(NavigationTab.PULSES)} />
              <NavButton label="Discovery Engine" onClick={() => onNavigate(NavigationTab.DISCOVER)} />
            </div>
          </div>
        </div>
        
        <div className="bg-ink/5 p-3 text-[8px] uppercase tracking-[0.2em] text-center opacity-40 border-t border-ink/5">
          Esc to close | ⌘K to toggle | Use arrows to traverse (v5.0 upcoming)
        </div>
      </div>
    </div>
  );
};

const NavButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button onClick={onClick} className="text-left p-3 hover:bg-plum/5 rounded-xl transition-colors text-[10px] font-bold uppercase tracking-wider text-ink/70">
    {label}
  </button>
);

export default CommandPalette;
