import React from 'react';
import { Book, Shelf } from './types';

interface BookDetailProps {
  book: Book;
  shelves: Shelf[];
  isAuthorTracked: boolean;
  isAuthorSyncing: boolean;
  onTrackAuthor: (author: string) => void;
  onSyncAuthor: (author: string) => void;
  onUpdate: (book: Book) => void;
  onClose: () => void;
}

export const BookDetail: React.FC<BookDetailProps> = ({
  book,
  isAuthorTracked,
  isAuthorSyncing,
  onTrackAuthor,
  onSyncAuthor,
  onClose,
}) => {
  return (
    <div className="flex flex-col h-full animate-slide-up">
      {/* Header / Close Button */}
      <div className="flex justify-between items-start mb-6">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 rounded-full text-ink/50 hover:bg-ink/5"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="flex gap-2">
           {/* Placeholder for Edit/Share buttons if needed later */}
        </div>
      </div>

      {/* Book Info */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-32 h-48 bg-brand-deep/10 rounded-lg shadow-lg mb-6 flex items-center justify-center">
             {/* If you have a real cover URL, use <img src={book.cover} ... /> here */}
             <span className="text-4xl">📖</span>
        </div>
        
        <h2 className="font-header text-3xl text-ink font-bold leading-tight mb-2">
          {book.title}
        </h2>
        <p className="text-brand-cyan text-lg font-medium mb-4">
          {book.author}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 w-full">
           <button 
             onClick={() => isAuthorTracked ? onSyncAuthor(book.author) : onTrackAuthor(book.author)}
             className={`px-6 py-3 rounded-xl font-medium transition-all w-full sm:w-auto flex items-center justify-center gap-2
               ${isAuthorTracked 
                 ? 'bg-input-surface text-ink border border-ink/10' 
                 : 'bg-brand-deep text-white shadow-lg shadow-brand-deep/30'
               }`}
           >
             {isAuthorSyncing ? (
               <span className="animate-pulse">Syncing...</span>
             ) : isAuthorTracked ? (
               <><span>✓</span> Author Tracked</>
             ) : (
               <><span>+</span> Track Author</>
             )}
           </button>
        </div>
      </div>

      {/* Description / Metadata */}
      <div className="bg-input-surface rounded-2xl p-6 mb-20">
        <h3 className="text-xs font-bold text-ink/40 uppercase tracking-wider mb-3">Description</h3>
        <p className="text-ink/80 leading-relaxed">
          {book.description || "No description available for this book yet."}
        </p>
        
        <div className="mt-6 pt-6 border-t border-ink/5 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-ink/40 uppercase">Published</div>
            <div className="text-ink font-medium">{book.publishDate || "Unknown"}</div>
          </div>
          <div>
            <div className="text-xs text-ink/40 uppercase">Pages</div>
            <div className="text-ink font-medium">{book.pageCount || "--"}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

