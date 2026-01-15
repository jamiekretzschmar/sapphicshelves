
import React, { useState, useMemo } from 'react';
import { Book, SortOption, BookStatus, Shelf } from '../types';
import BookCard from './BookCard';
import TropeAnalytics from './TropeAnalytics';

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
  onBulkDelete
}) => {
  // Batch State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
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
        <div className="w-24 h-24 bg-ink/5 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-ink/10">
           <svg className="w-10 h-10 text-ink/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
           </svg>
        </div>
        <h2 className="font-header text-3xl italic text-ink mb-2">The Folio is Empty</h2>
        <p className="text-xs font-sans text-ink/50 uppercase tracking-widest max-w-xs leading-relaxed mb-8">
          Begin your archival journey by acquiring a volume via the scanner or manual inscription.
        </p>
        <button 
          onClick={onManualAdd} 
          className="px-8 py-4 bg-brand-deep text-parchment rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-transform"
        >
          Inscribe First Volume
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-32">
      <div className="px-4 py-4">
        <TropeAnalytics books={books} />
      </div>

      {/* Advanced Search Drawer */}
      {showAdvancedSearch && (
        <div className="px-4 mb-4 animate-in slide-in-from-top-4">
           <div className="bg-mica-surface border border-ink/5 p-5 rounded-2xl shadow-inner space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-ink/40">Card Catalog Filters</h3>
                 <button onClick={() => { setAdvFilters({author:'', tag:'', year:''}); setShowAdvancedSearch(false); }} className="text-[9px] text-rose font-bold uppercase">Clear & Close</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                 <input 
                   placeholder="Filter by Author..."
                   value={advFilters.author}
                   onChange={e => setAdvFilters({...advFilters, author: e.target.value})}
                   className="bg-parchment px-3 py-2 rounded-lg text-xs border border-ink/5 outline-none focus:border-brand-cyan/50"
                 />
                 <input 
                   placeholder="Filter by Tag..."
                   value={advFilters.tag}
                   onChange={e => setAdvFilters({...advFilters, tag: e.target.value})}
                   className="bg-parchment px-3 py-2 rounded-lg text-xs border border-ink/5 outline-none focus:border-brand-cyan/50"
                 />
                 <input 
                   placeholder="Year (YYYY)..."
                   value={advFilters.year}
                   onChange={e => setAdvFilters({...advFilters, year: e.target.value})}
                   className="bg-parchment px-3 py-2 rounded-lg text-xs border border-ink/5 outline-none focus:border-brand-cyan/50"
                 />
              </div>
           </div>
        </div>
      )}

      {/* Sticky Filter & Search Bar */}
      <div className="sticky top-0 z-30 -mx-2 px-6 py-4 bg-parchment/95 backdrop-blur-xl border-b border-ink/5 shadow-sm mb-4 transition-all flex flex-col gap-3">
        <div className="flex items-center justify-between">
           <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/40">Active Filter Protocol</h2>
           <div className="flex gap-4">
             <button onClick={() => setShowAdvancedSearch(!showAdvancedSearch)} className="text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-brand-cyan">
               {showAdvancedSearch ? 'Hide Filters' : 'Adv. Search'}
             </button>
             {!isSelectionMode && (
               <button onClick={() => setIsSelectionMode(true)} className="text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-brand-deep">
                 Batch Edit
               </button>
             )}
             {isSelectionMode && (
               <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="text-[10px] font-bold uppercase tracking-widest text-rose">
                 Cancel Batch
               </button>
             )}
           </div>
        </div>

        {onSearchChange && (
          <input 
            type="text"
            placeholder="Search Monograph..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-ink/5 border border-ink/5 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all italic placeholder:text-ink/30"
          />
        )}
        
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
           {/* Sort Chip */}
           <div className="relative shrink-0 snap-start">
             <select 
               value={sortMode}
               onChange={(e) => onSortChange(e.target.value as SortOption)}
               className="appearance-none bg-ink/5 border border-ink/5 rounded-xl text-[10px] font-bold uppercase tracking-widest py-2 pl-3 pr-8 text-ink focus:outline-none focus:ring-1 focus:ring-brand-cyan"
             >
               <option value="date_desc">Recent</option>
               <option value="date_asc">Oldest</option>
               <option value="title">A-Z</option>
               <option value="rating">Rating</option>
             </select>
             <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink/40">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
             </div>
           </div>

           {/* Status Filters */}
           {(['all', 'tbr', 'reading', 'read', 'dnf'] as const).map(s => (
             <button
               key={s}
               onClick={() => onFilterChange(s)}
               className={`shrink-0 snap-start px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                 statusFilter === s 
                   ? 'bg-brand-deep text-parchment border-brand-deep shadow-md scale-105' 
                   : 'bg-white text-ink/60 border-ink/5 hover:border-ink/20'
               }`}
             >
               {s === 'tbr' ? 'To Read' : s === 'dnf' ? 'DNF' : s.charAt(0).toUpperCase() + s.slice(1)}
             </button>
           ))}
        </div>
      </div>
        
      <div className="px-4 space-y-1 min-h-[50vh]">
        {displayedBooks.map((book) => (
          <BookCard 
            key={book.id} 
            book={book} 
            onClick={() => onBookClick(book)}
            selectionMode={isSelectionMode}
            isSelected={selectedIds.has(book.id)}
            onToggleSelect={() => toggleSelection(book.id)}
          />
        ))}
        
        {displayedBooks.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center opacity-50">
             <span className="text-4xl mb-2">🧐</span>
             <p className="text-xs font-bold uppercase tracking-widest text-ink/60">No matching volumes found.</p>
             <button onClick={() => { onFilterChange('all'); if(onSearchChange) onSearchChange(''); setAdvFilters({author:'', tag:'', year:''}); }} className="mt-4 text-xs text-brand-cyan underline">Clear Filters</button>
          </div>
        )}
      </div>

      {/* Floating Batch Action Dock */}
      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-40 animate-in slide-in-from-bottom-6">
          <div className="bg-ink/95 backdrop-blur-md text-parchment p-4 rounded-3xl shadow-2xl flex flex-col gap-3 border border-white/10">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest">{selectedIds.size} Selected</span>
              <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="text-rose text-[9px] font-bold uppercase">Close</button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
               {/* Bulk Status */}
               <div className="relative group shrink-0">
                  <button className="px-4 py-3 bg-brand-cyan text-white rounded-xl text-[9px] font-bold uppercase tracking-wider">Set Status</button>
                  <div className="absolute bottom-full left-0 mb-2 w-32 bg-white rounded-xl shadow-xl overflow-hidden hidden group-focus-within:block group-hover:block">
                     <button onClick={() => handleBulkStatus('tbr')} className="block w-full text-left px-4 py-2 text-ink text-[10px] hover:bg-ink/5">To Read</button>
                     <button onClick={() => handleBulkStatus('reading')} className="block w-full text-left px-4 py-2 text-ink text-[10px] hover:bg-ink/5">Reading</button>
                     <button onClick={() => handleBulkStatus('read')} className="block w-full text-left px-4 py-2 text-ink text-[10px] hover:bg-ink/5">Finished</button>
                  </div>
               </div>

               {/* Bulk Shelf Move */}
               {shelves.length > 0 && (
                 <div className="relative group shrink-0">
                    <button className="px-4 py-3 bg-brand-deep text-white border border-white/20 rounded-xl text-[9px] font-bold uppercase tracking-wider">Move Shelf</button>
                     <div className="absolute bottom-full left-0 mb-2 w-48 max-h-48 overflow-y-auto bg-white rounded-xl shadow-xl hidden group-focus-within:block group-hover:block">
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
