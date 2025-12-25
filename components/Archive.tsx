
import React from 'react';
import { Book } from '../types';

interface ArchiveProps {
  books: Book[];
  onBookClick: (book: Book) => void;
}

const Archive: React.FC<ArchiveProps> = ({ books, onBookClick }) => {
  if (books.length === 0) {
    return (
      <div className="text-center py-20 px-8 border-2 border-dashed border-ink/10 rounded-3xl opacity-30">
        <div className="font-header text-3xl mb-4 italic">An Untouched Folio</div>
        <p className="text-xs">Populate your monograph via Shelf Sync.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {books.map((book) => (
        <div 
          key={book.id} 
          onClick={() => onBookClick(book)}
          className="bg-mica-surface border border-ink/5 p-4 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex gap-4 overflow-hidden relative"
        >
          {book.isCanadian && (
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100 uppercase tracking-tighter">True North</span>
            </div>
          )}
          
          <div className="w-20 h-28 bg-ink/5 rounded-lg border border-ink/10 shrink-0 overflow-hidden shadow-inner group-hover:rotate-1 transition-transform">
            {book.coverUrl ? (
              <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                 <span className="text-[7px] font-black text-ink/10 uppercase leading-none">Archival Record</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="font-header text-xl font-bold truncate group-hover:text-gold transition-colors">{book.title}</h3>
            <p className="text-xs text-ink/50 italic">{book.author}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {(book.tropes || []).slice(0, 2).map(trope => (
                <span key={trope} className="text-[8px] px-2 py-0.5 bg-gold/10 text-gold rounded-full border border-gold/20 font-bold uppercase">{trope}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Archive;
