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
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-60 px-6">
        <div className="font-header text-4xl italic text-ink">An Empty Folio</div>
        <p className="text-sm font-bold uppercase tracking-widest leading-relaxed text-ink/70">Add your first volume via the floating acquisition icon or manual inscription.</p>
        <button onClick={onManualAdd} className="mt-6 px-8 py-3 border border-ink/20 rounded-xl text-xs uppercase font-bold hover:bg-ink/5 text-ink">
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

      <div className="sticky top-0 z-20 bg-parchment/95 backdrop-blur-md px-4 py-4 border-b border-ink/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <h2 className="text-sm font-black uppercase tracking-widest text-md-sys-primary">Monograph</h2>
           <button onClick={onManualAdd} className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan hover:underline p-2 -mr-2">
             + Manual Entry
           </button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
           {/* Sort Dropdown */}
           <div className="relative">
             <select 
               value={sortMode}
               onChange={(e) => onSortChange(e.target.value as SortOption)}
               className="bg-ink/5 border-none rounded-xl text-[10px] font-bold uppercase tracking-widest py-2.5 pl-4 pr-8 outline-none appearance-none text-ink cursor-pointer"
             >
               <option value="date_desc">Recent</option>
               <option value="date_asc">Oldest</option>
               <option value="title">Title</option>
               <option value="author">Author</option>
               <option value="rating">Rating</option>
             </select>
             <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-ink">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
             </div>
           </div>

           {/* Status Filters */}
           {(['all', 'tbr', 'reading', 'read', 'dnf'] as const).map(s => (
             <button
               key={s}
               onClick={() => onFilterChange(s)}
               className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                 statusFilter === s 
                   ? 'bg-ink text-parchment shadow-md' 
                   : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
               }`}
             >
               {s === 'tbr' ? 'TBR' : s.charAt(0).toUpperCase() + s.slice(1)}
             </button>
           ))}
        </div>
      </div>
        
      <div className="px-4 py-2 space-y-1">
        {books.map((book) => (
          <BookCard 
            key={book.id} 
            book={book} 
            onClick={() => onBookClick(book)} 
          />
        ))}
        {books.length === 0 && (
          <div className="py-12 text-center text-ink/40 italic text-sm">
            No volumes match the current protocol.
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;