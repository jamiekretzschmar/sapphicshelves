
import React, { useState, useMemo } from 'react';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
  onClick: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ 
  book, 
  onClick, 
  selectionMode = false, 
  isSelected = false, 
  onToggleSelect 
}) => {
  const [imageErrorLevel, setImageErrorLevel] = useState(0);

  // Generative color based on title string hash
  const getCoverColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Brand palette colors
    const colors = ['#011D4D', '#034078', '#1282A2', '#63372C', '#9A463D', '#4A9EA6'];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const currentCoverUrl = useMemo(() => {
    if (imageErrorLevel === 0 && book.coverUrl) return book.coverUrl;
    if (imageErrorLevel <= 1 && book.isbn) {
      const cleanIsbn = book.isbn.replace(/[^0-9X]/gi, '');
      return `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`;
    }
    return null;
  }, [book.coverUrl, book.isbn, imageErrorLevel]);

  const coverBg = currentCoverUrl ? 'transparent' : getCoverColor(book.title);
  
  // Status Pill Configuration
  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'reading': return { label: 'Reading', color: 'bg-gold/10 text-gold border-gold/20', dot: 'bg-gold' };
      case 'read': return { label: 'Finished', color: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20', dot: 'bg-emerald-600' };
      case 'dnf': return { label: 'DNF', color: 'bg-rose/10 text-rose border-rose/20', dot: 'bg-rose' };
      default: return { label: 'TBR', color: 'bg-ink/5 text-ink/60 border-ink/10', dot: 'bg-ink/30' };
    }
  };

  const statusConfig = getStatusConfig(book.status);

  const handleInteraction = (e: React.MouseEvent) => {
    if (selectionMode && onToggleSelect) {
      e.stopPropagation();
      onToggleSelect();
    } else {
      onClick();
    }
  };

  return (
    <div 
      onClick={handleInteraction}
      className={`group relative flex flex-row items-start p-3 gap-4 bg-mica-surface border rounded-2xl mb-3 active:scale-[0.99] transition-all duration-200 shadow-sm overflow-hidden ${
        isSelected ? 'border-brand-cyan bg-brand-cyan/5' : 'border-ink/5'
      }`}
    >
      {/* Selection Overlay/Indicator */}
      {selectionMode && (
        <div className="absolute top-3 right-3 z-20">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected ? 'bg-brand-cyan border-brand-cyan' : 'border-ink/20 bg-parchment'
          }`}>
            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
          </div>
        </div>
      )}

      {/* Dynamic Cover */}
      <div 
        className="shrink-0 w-[50px] h-[75px] rounded-md shadow-sm overflow-hidden relative"
        style={{ backgroundColor: coverBg }}
      >
        {currentCoverUrl ? (
          <img 
            src={currentCoverUrl} 
            className="w-full h-full object-cover" 
            alt="" 
            onError={() => setImageErrorLevel(prev => prev + 1)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-1">
            <span className="text-[8px] font-header font-bold text-parchment text-center leading-tight line-clamp-3">
              {book.title}
            </span>
          </div>
        )}
        <div className="absolute inset-y-0 left-0 w-0.5 bg-white/20 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none"></div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col h-[75px] justify-between">
        <div>
          <h3 className="text-sm font-header font-bold italic text-brand-deep leading-tight line-clamp-2">
            {book.title}
          </h3>
          <p className="text-[10px] font-sans text-ink/50 truncate font-medium uppercase tracking-wide mt-0.5">
            {book.author}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-auto">
          {/* Status Pill */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border ${statusConfig.color}`}>
            {statusConfig.label}
          </div>

          {/* Rating */}
          {(book.rating || 0) > 0 && (
             <div className="flex text-[8px] text-gold gap-0.5">
               {Array.from({length: book.rating || 0}).map((_, i) => (
                 <span key={i}>★</span>
               ))}
             </div>
          )}

          {/* Trope Pills (Hidden on mobile if too crowded, or just one) */}
          {!selectionMode && book.tropes && book.tropes.length > 0 && (
             <span className="hidden sm:inline-block text-[8px] px-2 py-0.5 bg-ink/5 text-ink/50 rounded-full font-bold uppercase tracking-wide truncate max-w-[100px]">
               {book.tropes[0]}
             </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
