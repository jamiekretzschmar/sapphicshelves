
import React from 'react';
import { Book } from '../types';
import BookCard from './BookCard';
import TropeAnalytics from './TropeAnalytics';

interface ArchiveProps {
  books: Book[];
  onBookClick: (book: Book) => void;
  onTrackAuthor: (name: string) => void;
  isAuthorTracked: (name: string) => boolean;
  isLoading?: boolean;
}

const Archive: React.FC<ArchiveProps> = ({ books, onBookClick, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4 py-4 px-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-4 p-3 animate-pulse">
            <div className="w-12 h-18 bg-black/5 rounded-lg" />
            <div className="flex-1 space-y-2 py-2">
              <div className="h-4 bg-black/5 rounded w-3/4" />
              <div className="h-3 bg-black/5 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-40 px-6">
        <div className="font-header text-3xl italic">An Empty Folio</div>
        <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">Add your first volume via the floating acquisition icon below.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-32">
      {/* Sovereign Syntax: Integrated Analytics Dashboard */}
      <div className="px-4 py-4">
        <TropeAnalytics books={books} />
      </div>

      <div className="px-4 py-4 mt-4 border-t border-black/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-md-sys-primary">Complete Monograph</h2>
          <span className="text-[9px] font-mono text-ink/30 italic">{books.length} Vol.</span>
        </div>
        
        <div className="divide-y divide-black/5 bg-mica-surface rounded-2xl overflow-hidden border border-black/5 shadow-inner">
          {books.map((book) => (
            <BookCard 
              key={book.id} 
              book={book} 
              onClick={() => onBookClick(book)} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Archive;
