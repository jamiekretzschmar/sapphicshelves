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
    <div className="animate-fade-in pb-24">
      <div className="px-4 py-4">
        <TropeAnalytics books={books} />
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-30 -mx-2 px-6 py-3 bg-parchment/95 backdrop-blur-xl border-b border-ink/5 shadow-sm mb-4 transition-all">
        <div className="flex items-center justify-between mb-3">
           <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/40">Active Filter Protocol</h2>
           <button onClick={onManualAdd} className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan hover:text-brand-deep">
             + Add Entry
           </button>
        </div>
        
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
        {books.map((book) => (
          <BookCard 
            key={book.id} 
            book={book} 
            onClick={() => onBookClick(book)} 
          />
        ))}
        
        {books.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center opacity-50">
             <span className="text-4xl mb-2">🧐</span>
             <p className="text-xs font-bold uppercase tracking-widest text-ink/60">No matching volumes found.</p>
             <button onClick={() => onFilterChange('all')} className="mt-4 text-xs text-brand-cyan underline">Clear Filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;