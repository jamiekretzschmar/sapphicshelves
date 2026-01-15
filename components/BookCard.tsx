
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Book, BookStatus, Shelf } from '../types';
import { useHaptics } from '../hooks/useHaptics';

interface BookCardProps {
  book: Book;
  shelves?: Shelf[];
  onClick: () => void;
  onUpdate?: (book: Book) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ 
  book, 
  shelves = [],
  onClick, 
  onUpdate,
  selectionMode = false, 
  isSelected = false, 
  onToggleSelect 
}) => {
  const [imageErrorLevel, setImageErrorLevel] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Swipe State
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const haptics = useHaptics();
  const SWIPE_THRESHOLD = 100;

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && !(event.target as Element).closest('.quick-menu-container')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Generative color based on title string hash
  const getCoverColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
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
  
  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'reading': return { label: 'Reading', color: 'bg-gold/10 text-gold border-gold/20', dot: 'bg-gold' };
      case 'read': return { label: 'Finished', color: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20', dot: 'bg-emerald-600' };
      case 'dnf': return { label: 'DNF', color: 'bg-rose/10 text-rose border-rose/20', dot: 'bg-rose' };
      default: return { label: 'TBR', color: 'bg-ink/5 text-ink/60 border-ink/10', dot: 'bg-ink/30' };
    }
  };

  const statusConfig = getStatusConfig(book.status);

  // --- Touch/Swipe Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (selectionMode || isMenuOpen) return;
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || selectionMode || isMenuOpen) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Resistance logic
    const dampedDiff = diff > 0 
      ? Math.min(diff, 150) // Cap right swipe
      : Math.max(diff, -150); // Cap left swipe

    setDragX(dampedDiff);
  };

  const handleTouchEnd = () => {
    if (!isDragging || selectionMode) return;
    
    if (dragX > SWIPE_THRESHOLD && onUpdate) {
      // Swipe Right -> Read
      haptics.trigger('medium');
      onUpdate({ ...book, status: 'read' });
    } else if (dragX < -SWIPE_THRESHOLD && onUpdate) {
      // Swipe Left -> Reading
      haptics.trigger('medium');
      onUpdate({ ...book, status: 'reading' });
    }

    // Reset
    setIsDragging(false);
    setDragX(0);
  };

  const handleInteraction = (e: React.MouseEvent) => {
    if (selectionMode && onToggleSelect) {
      e.stopPropagation();
      onToggleSelect();
    } else if (!isMenuOpen) {
      onClick();
    }
  };

  const handleQuickStatus = (status: BookStatus) => {
    onUpdate?.({ ...book, status });
    setIsMenuOpen(false);
  };

  const handleQuickShelf = (shelfId: string) => {
    onUpdate?.({ ...book, shelfId: shelfId || undefined });
    setIsMenuOpen(false);
  };

  return (
    <div className="relative mb-3 touch-pan-y">
      {/* Background Layers for Swipe Actions */}
      <div className={`absolute inset-0 rounded-2xl flex items-center justify-between px-6 transition-colors ${
        dragX > 0 ? 'bg-emerald-500' : dragX < 0 ? 'bg-gold' : 'bg-transparent'
      }`}>
        <span className={`text-parchment font-black uppercase tracking-widest text-xs flex items-center gap-2 ${dragX > 0 ? 'opacity-100' : 'opacity-0'}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          Mark Read
        </span>
        <span className={`text-parchment font-black uppercase tracking-widest text-xs flex items-center gap-2 ${dragX < 0 ? 'opacity-100' : 'opacity-0'}`}>
          Reading
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </span>
      </div>

      <div 
        onClick={handleInteraction}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${dragX}px)` }}
        className={`group relative flex flex-row items-start p-3 gap-4 bg-mica-surface border rounded-2xl transition-transform duration-200 shadow-sm overflow-visible z-10 ${
          isSelected ? 'border-brand-cyan bg-brand-cyan/5' : 'border-ink/5'
        } ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
      >
        {/* Selection Indicator */}
        {selectionMode && (
          <div className="absolute top-3 right-3 z-20">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              isSelected ? 'bg-brand-cyan border-brand-cyan' : 'border-ink/20 bg-parchment'
            }`}>
              {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
            </div>
          </div>
        )}

        {/* Quick Menu Button (Visible on Desktop/No-Swipe) */}
        {!selectionMode && (
          <div className="absolute top-2 right-2 z-20 quick-menu-container">
             <button 
               onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
               className="p-1.5 rounded-full text-ink/20 hover:bg-ink/5 hover:text-ink/60 transition-colors"
             >
               <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="12" r="2"/></svg>
             </button>

             {isMenuOpen && (
               <div className="absolute right-0 top-full mt-1 w-48 bg-parchment border border-ink/10 rounded-xl shadow-xl z-30 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col py-1">
                 <div className="px-3 py-1 text-[8px] font-black uppercase tracking-widest text-ink/30 border-b border-ink/5 mb-1">Quick Actions</div>
                 
                 {/* Status Options */}
                 <button onClick={(e) => { e.stopPropagation(); handleQuickStatus('reading'); }} className="text-left px-4 py-2 text-xs hover:bg-gold/10 hover:text-gold transition-colors flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold" /> Reading
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); handleQuickStatus('read'); }} className="text-left px-4 py-2 text-xs hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Finished
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); handleQuickStatus('tbr'); }} className="text-left px-4 py-2 text-xs hover:bg-ink/5 hover:text-ink transition-colors flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-ink/30" /> TBR
                 </button>

                 <div className="h-px bg-ink/5 my-1" />

                 {/* Shelf Options */}
                 {shelves && shelves.length > 0 && (
                   <div className="px-2">
                     <p className="px-2 py-1 text-[8px] font-bold text-ink/40">Move to...</p>
                     {shelves.slice(0, 3).map(s => (
                        <button key={s.id} onClick={(e) => { e.stopPropagation(); handleQuickShelf(s.id); }} className="block w-full text-left px-2 py-1.5 text-xs text-ink/70 hover:bg-ink/5 rounded-lg truncate">
                          {s.title}
                        </button>
                     ))}
                   </div>
                 )}
               </div>
             )}
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
            <h3 className="text-sm font-header font-bold italic text-brand-deep leading-tight line-clamp-2 pr-6">
              {book.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] font-sans text-ink/50 truncate font-medium uppercase tracking-wide">
                {book.author}
              </p>
              {book.publicationYear && (
                <span className="text-[9px] font-mono text-ink/30">({book.publicationYear})</span>
              )}
            </div>
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

            {/* Trope Pills */}
            {!selectionMode && book.tropes && book.tropes.length > 0 && (
               <span className="hidden sm:inline-block text-[8px] px-2 py-0.5 bg-ink/5 text-ink/50 rounded-full font-bold uppercase tracking-wide truncate max-w-[100px]">
                 {book.tropes[0]}
               </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
