
import React from 'react';
import { Book, SortOption, BookStatus } from '../types';
import BookCard from './BookCard';
import TropeAnalytics from './TropeAnalytics';

interface ArchiveProps {
  books: Book[];
  sortMode: SortOption;
  statusFilter: BookStatus | 'all';
  onBookClick: (book: Book) => void;
  onSortChange: (mode: SortOption) => void;
  onFilterChange: (status: BookStatus | 'all') => void;
  onManualAdd: () => void;
}

const Archive: React.FC<ArchiveProps> = ({ 
  books, 
  sortMode,
  statusFilter,
  onBookClick,
  onSortChange,
  onFilterChange,
  onManualAdd
}) => {
  if (books.length === 0 && statusFilter === 'all') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-40 px-6">
        <div className="font-header text-3xl italic">An Empty Folio</div>
        <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">Add your first volume via the floating acquisition icon or manual inscription.</p>
        <button onClick={onManualAdd} className="mt-4 px-6 py-2 border border-ink/20 rounded-xl text-[10px] uppercase font-bold hover:bg-ink/5">
          Manual Inscription
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-32">
      <div className="px-4 py-4">
        <TropeAnalytics books={books} />
      </div>

      <div className="sticky top-0 z-20 bg-parchment/95 backdrop-blur-md px-4 py-3 border-b border-black/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
           <h2 className="text-[12px] font-bold uppercase tracking-widest text-md-sys-primary">Monograph</h2>
           <button onClick={onManualAdd} className="text-[9px] font-bold uppercase tracking-widest text-brand-cyan hover:underline">
             + Manual Entry
           </button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
           {/* Sort Dropdown */}
           <select 
             value={sortMode}
             onChange={(e) => onSortChange(e.target.value as SortOption)}
             className="bg-black/5 border-none rounded-lg text-[9px] font-bold uppercase tracking-widest py-1.5 px-3 outline-none"
           >
             <option value="date_desc">Recent</option>
             <option value="date_asc">Oldest</option>
             <option value="title">Title</option>
             <option value="author">Author</option>
             <option value="rating">Rating</option>
           </select>

           {/* Status Filters */}
           {(['all', 'tbr', 'reading', 'read', 'dnf'] as const).map(s => (
             <button
               key={s}
               onClick={() => onFilterChange(s)}
               className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                 statusFilter === s 
                   ? 'bg-brand-deep text-parchment shadow-md' 
                   : 'bg-black/5 text-ink/40 hover:bg-black/10'
               }`}
             >
               {s === 'tbr' ? 'TBR' : s.charAt(0).toUpperCase() + s.slice(1)}
             </button>
           ))}
        </div>
      </div>
        
      <div className="px-4 py-2 space-y-2">
        {books.map((book) => (
          <BookCard 
            key={book.id} 
            book={book} 
            onClick={() => onBookClick(book)} 
          />
        ))}
        {books.length === 0 && (
          <div className="py-12 text-center text-ink/30 italic text-xs">
            No volumes match the current protocol.
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;
