
import React from 'react';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
  onClick: () => void;
  onTrackAuthor?: (name: string) => void;
  isTracked?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  // Generate a random stable color for the CSS cover using the new palette
  const getCoverColor = (title: string) => {
    const colors = ['#011D4D', '#034078', '#1282A2', '#63372C', '#E4DFDA'];
    const index = title.length % colors.length;
    return colors[index];
  };

  const coverBg = book.coverUrl ? 'transparent' : getCoverColor(book.title);
  const textColor = coverBg === '#E4DFDA' ? '#011D4D' : 'white';

  return (
    <div 
      onClick={onClick}
      className="flex flex-row items-center p-3 gap-4 hover:bg-black/5 active:bg-black/10 transition-colors ripple border-b border-black/5 last:border-0"
    >
      {/* CSS-Generated Book Cover */}
      <div 
        className="book-thumb shrink-0" 
        style={{ 
          backgroundColor: coverBg,
          color: textColor
        }}
      >
        {book.coverUrl ? (
          <img src={book.coverUrl} className="w-full h-full object-cover rounded-[2px]" alt="" />
        ) : (
          <span className="font-bold">{book.title}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-bold text-md-sys-onSurface truncate leading-tight">
          {book.title}
        </h3>
        <p className="text-[12px] text-md-sys-outline truncate font-medium">
          {book.author}
        </p>
        <div className="flex gap-1 mt-1">
          {book.isCanadian && (
            <span className="text-[8px] font-bold text-md-sys-primary bg-md-sys-secondaryContainer px-1 rounded">True North</span>
          )}
          {book.tropes && book.tropes.slice(0, 1).map(t => (
            <span key={t} className="text-[8px] font-bold text-md-sys-onSecondaryContainer bg-md-sys-secondaryContainer px-1 rounded truncate">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0 text-md-sys-primary opacity-30">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default BookCard;
