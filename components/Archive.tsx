
import React, { useState, useMemo } from 'react';
import { Book, SortOption, BookStatus, Shelf } from '../types';
import BookCard from './BookCard';
import TropeAnalytics from './TropeAnalytics';
import TheLibrarian from './TheLibrarian';

interface ArchiveProps {
  books: Book[];
  shelves?: Shelf[];
  sortMode: SortOption;
  statusFilter: BookStatus | 'all';
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onBookClick: (book: Book) => void;
  onSortChange: (mode: SortOption) => void;
  onFilterChange: (status: BookStatus | 'all') => void;
  onManualAdd: () => void;
  onBulkUpdate?: (bookIds: string[], updates: Partial<Book>) => void;
  onBulkDelete?: (bookIds: string[]) => void;
  onUpdateBook?: (book: Book) => void;
}

const Archive: React.FC<ArchiveProps> = ({ 
  books, 
  shelves = [],
  sortMode,
  statusFilter,
  searchQuery = '',
  onSearchChange,
  onBookClick,
  onSortChange,
  onFilterChange,
  onManualAdd,
  onBulkUpdate,
  onBulkDelete,
  onUpdateBook
}) => {
  // Batch State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showLibrarian, setShowLibrarian] = useState(false);
  
  // Advanced Filter State
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    author: '',
    tag: '',
    year: ''
  });

  // Filter Logic including Advanced Filters
  const displayedBooks = useMemo(() => {
    let result = books;

    // Advanced Filters
    if (advFilters.author) {
      result = result.filter(b => b.author.toLowerCase().includes(advFilters.author.toLowerCase()));
    }
    if (advFilters.tag) {
      result = result.filter(b => b.tropes?.some(t => t.toLowerCase().includes(advFilters.tag.toLowerCase())));
    }
    if (advFilters.year) {
      result = result.filter(b => {
        const year = b.publicationYear?.toString() || b.scannedAt?.substring(0, 4);
        if (!year) return false;
        return year.includes(advFilters.year);
      });
    }

    return result;
  }, [books, advFilters]);

  // Selection Handlers
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkStatus = (status: BookStatus) => {
    if (onBulkUpdate) {
      onBulkUpdate(Array.from(selectedIds), { status });
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  const handleBulkShelf = (shelfId: string) => {
    if (onBulkUpdate) {
      onBulkUpdate(Array.from(selectedIds), { shelfId: shelfId || undefined });
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && confirm(`Are you sure you want to delete ${selectedIds.size} volumes?`)) {
      onBulkDelete(Array.from(selectedIds));
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  if (books.length === 0 && statusFilter === 'all' && !searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8 animate-fade-in">
        <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mb-6 border border-ink/5 shadow-glass-sm">
           <svg className="w-10 h-10 text-ink/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
           </svg>
        </div>
        <h2 className="font-header text-4xl text-ink mb-3 tracking-tight">The Folio is Empty</h2>
        <p className="text-sm font-sans text-ink/60 max-w-xs leading-relaxed mb-8">
          Begin your archival journey by acquiring a volume via the scanner or manual inscription.
        </p>
        <button 
          onClick={onManualAdd} 
          className="px-8 py-4 bg-ink text-parchment rounded-xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-transform"
        >
          Inscribe First Volume
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-32 relative">
      <div className="px-4 py-4">
        <TropeAnalytics books={books} />
      </div>

      {/* Professional Glass Toolbar */}
      <div className="sticky top-0 z-30 mb-6 mx-2">
        <div className="glass-panel rounded-2xl p-3 shadow-glass transition-all flex flex-col gap-3">
          
          {/* Top Row: Search & Actions */}
          <div className="flex items-center gap-3">
            {onSearchChange && (
              <div className="relative flex-1 group">
                <input 
                  type="text"
                  placeholder="Search Monograph..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-white/60 border border-ink/5 pl-10 pr-10 py-2.5 rounded-xl text-sm font-header text-lg text-ink focus:outline-none focus:ring-1 focus:ring-brand-cyan/30 transition-all placeholder:text-ink/30 placeholder:italic"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 group-focus-within:text-brand-cyan transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-rose transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            )}
            
            <button 
              onClick={() => setShowLibrarian(prev => !prev)} 
              className={`p-2.5 rounded-xl border transition-all ${showLibrarian ? 'bg-brand-deep text-brand-cyan border-brand-deep' : 'bg-white/60 text-ink/60 border-ink/5 hover:text-brand-deep'}`}
              title="Ask The Librarian"
            >
              <span className="font-header italic font-bold text-lg">L</span>
            </button>
            
            <button 
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)} 
              className={`p-2.5 rounded-xl border transition-all ${showAdvancedSearch ? 'bg-brand-cyan text-white border-brand-cyan' : 'bg-white/60 text-ink/60 border-ink/5 hover:text-brand-cyan'}`}
              title="Advanced Filters"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            </button>
            
            <button 
              onClick={() => { setIsSelectionMode(!isSelectionMode); if(isSelectionMode) setSelectedIds(new Set()); }}
              className={`p-2.5 rounded-xl border transition-all ${isSelectionMode ? 'bg-brand-deep text-white border-brand-deep' : 'bg-white/60 text-ink/60 border-ink/5 hover:text-brand-deep'}`}
              title="Batch Edit"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </button>
          </div>

          {/* Bottom Row: Filters & Sort */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-1">
             {/* Sort Dropdown */}
             <div className="relative shrink-0">
               <select 
                 value={sortMode}
                 onChange={(e) => onSortChange(e.target.value as SortOption)}
                 className="appearance-none bg-white/60 border border-ink/5 rounded-lg text-xs font-bold text-ink uppercase tracking-wider py-2 pl-3 pr-8 focus:outline-none"
               >
                 <option value="date_desc">Recent</option>
                 <option value="date_asc">Oldest</option>
                 <option value="title">A-Z</option>
                 <option value="rating">Rating</option>
               </select>
               <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-ink/40">
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
               </div>
             </div>

             <div className="w-px h-6 bg-ink/10 shrink-0 mx-1" />

             {/* Status Pills */}
             {(['all', 'tbr', 'reading', 'read', 'dnf'] as const).map(s => (
               <button
                 key={s}
                 onClick={() => onFilterChange(s)}
                 className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                   statusFilter === s 
                     ? 'bg-ink text-parchment shadow-md' 
                     : 'text-ink/50 hover:bg-white/40 hover:text-ink'
                 }`}
               >
                 {s === 'tbr' ? 'To Read' : s === 'dnf' ? 'DNF' : s.charAt(0).toUpperCase() + s.slice(1)}
               </button>
             ))}
          </div>

          {/* Advanced Drawer inside Glass Panel */}
          {showAdvancedSearch && (
            <div className="pt-3 mt-1 border-t border-ink/5 grid grid-cols-3 gap-2 animate-in slide-in-from-top-2">
               <input 
                 placeholder="Author..."
                 value={advFilters.author}
                 onChange={e => setAdvFilters({...advFilters, author: e.target.value})}
                 className="bg-white/40 px-3 py-2 rounded-lg text-xs border border-ink/5 outline-none focus:bg-white/80 transition-colors"
               />
               <input 
                 placeholder="Tag..."
                 value={advFilters.tag}
                 onChange={e => setAdvFilters({...advFilters, tag: e.target.value})}
                 className="bg-white/40 px-3 py-2 rounded-lg text-xs border border-ink/5 outline-none focus:bg-white/80 transition-colors"
               />
               <div className="relative">
                 <input 
                   placeholder="Year..."
                   value={advFilters.year}
                   onChange={e => setAdvFilters({...advFilters, year: e.target.value})}
                   className="w-full bg-white/40 px-3 py-2 rounded-lg text-xs border border-ink/5 outline-none focus:bg-white/80 transition-colors"
                 />
                 <button 
                  onClick={() => { setAdvFilters({author:'', tag:'', year:''}); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-rose uppercase"
                 >
                   Clear
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
      
      {showLibrarian && (
        <TheLibrarian books={books} onClose={() => setShowLibrarian(false)} />
      )}
        
      <div className="px-4 space-y-1 min-h-[50vh]">
        {displayedBooks.map((book) => (
          <BookCard 
            key={book.id} 
            book={book} 
            shelves={shelves}
            onClick={() => onBookClick(book)}
            onUpdate={onUpdateBook}
            selectionMode={isSelectionMode}
            isSelected={selectedIds.has(book.id)}
            onToggleSelect={() => toggleSelection(book.id)}
          />
        ))}
        
        {displayedBooks.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center opacity-50">
             <span className="text-4xl mb-2">🧐</span>
             <p className="text-xs font-bold uppercase tracking-widest text-ink/60">No matching volumes found.</p>
             <button onClick={() => { onFilterChange('all'); if(onSearchChange) onSearchChange(''); setAdvFilters({author:'', tag:'', year:''}); }} className="mt-4 text-xs text-brand-cyan underline">Reset</button>
          </div>
        )}
      </div>

      {/* Floating Batch Action Dock */}
      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-40 animate-in slide-in-from-bottom-6">
          <div className="glass-panel text-ink p-4 rounded-3xl shadow-2xl flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-ink/5 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-deep">{selectedIds.size} Selected</span>
              <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="text-rose text-[9px] font-bold uppercase">Close</button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
               {/* Bulk Status */}
               <div className="relative group shrink-0">
                  <button className="px-4 py-3 bg-brand-cyan text-white rounded-xl text-[9px] font-bold uppercase tracking-wider">Set Status</button>
                  <div className="absolute bottom-full left-0 mb-2 w-32 bg-white rounded-xl shadow-xl overflow-hidden hidden group-focus-within:block group-hover:block border border-ink/5">
                     <button onClick={() => handleBulkStatus('tbr')} className="block w-full text-left px-4 py-2 text-ink text-[10px] hover:bg-ink/5">To Read</button>
                     <button onClick={() => handleBulkStatus('reading')} className="block w-full text-left px-4 py-2 text-ink text-[10px] hover:bg-ink/5">Reading</button>
                     <button onClick={() => handleBulkStatus('read')} className="block w-full text-left px-4 py-2 text-ink text-[10px] hover:bg-ink/5">Finished</button>
                  </div>
               </div>

               {/* Bulk Shelf Move */}
               {shelves.length > 0 && (
                 <div className="relative group shrink-0">
                    <button className="px-4 py-3 bg-brand-deep text-white border border-white/20 rounded-xl text-[9px] font-bold uppercase tracking-wider">Move Shelf</button>
                     <div className="absolute bottom-full left-0 mb-2 w-48 max-h-48 overflow-y-auto bg-white rounded-xl shadow-xl hidden group-focus-within:block group-hover:block border border-ink/5">
                       <button onClick={() => handleBulkShelf('')} className="block w-full text-left px-4 py-2 text-ink text-[10px] border-b border-ink/5 hover:bg-ink/5">Unshelf (Stack)</button>
                       {shelves.map(s => (
                         <button key={s.id} onClick={() => handleBulkShelf(s.id)} className="block w-full text-left px-4 py-2 text-ink text-[10px] hover:bg-ink/5 truncate">{s.title}</button>
                       ))}
                     </div>
                 </div>
               )}

               <button onClick={handleBulkDelete} className="ml-auto px-4 py-3 bg-rose text-white rounded-xl text-[9px] font-bold uppercase tracking-wider shrink-0">Burn</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;
