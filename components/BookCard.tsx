import React, { useState, useMemo } from 'react';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
  onClick: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
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
      case 'reading': return { label: 'In Progress', color: 'bg-gold text-white', dot: 'bg-white' };
      case 'read': return { label: 'Finished', color: 'bg-emerald-600 text-white', dot: 'bg-emerald-200' };
      case 'dnf': return { label: 'DNF', color: 'bg-rose text-white', dot: 'bg-rose-200' };
      default: return { label: 'TBR', color: 'bg-ink/10 text-ink', dot: 'bg-ink/40' };
    }
  };

  const statusConfig = getStatusConfig(book.status);

  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-row items-start p-4 gap-4 bg-mica-surface border border-ink/5 rounded-2xl mb-3 active:scale-[0.98] transition-transform duration-200 shadow-sm overflow-hidden"
    >
      {/* Dynamic Cover */}
      <div 
        className="shrink-0 w-[60px] h-[90px] rounded-lg shadow-md overflow-hidden relative"
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
            <span className="text-[9px] font-header font-bold text-parchment text-center leading-tight line-clamp-4">
              {book.title}
            </span>
          </div>
        )}
        {/* Spine overlay effect */}
        <div className="absolute inset-y-0 left-0 w-1 bg-white/20 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between h-[90px] py-0.5">
        <div>
          <h3 className="text-base font-header font-bold italic text-brand-deep leading-tight line-clamp-2 mb-1">
            {book.title}
          </h3>
          <p className="text-xs font-sans text-ink/60 truncate font-medium uppercase tracking-wide">
            {book.author}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-auto">
          {/* Status Pill */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${statusConfig.color}`}>
            <span className={`w-1 h-1 rounded-full ${statusConfig.dot} animate-pulse`}></span>
            {statusConfig.label}
          </div>

          {/* Trope Pills (Limit 1) */}
          {book.tropes && book.tropes.length > 0 && (
             <span className="text-[8px] px-2 py-1 bg-ink/5 text-ink/50 rounded-full font-bold uppercase tracking-wide truncate max-w-[100px]">
               {book.tropes[0]}
             </span>
          )}
        </div>
      </div>
      
      {/* Interaction Hint */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 transition-opacity">
        <svg className="w-5 h-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default BookCard;