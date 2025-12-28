
import React, { useState, useEffect, useMemo } from 'react';
import { Book, Shelf } from '../types';
import { geminiService } from '../services/gemini';
import { useHaptics } from '../hooks/useHaptics';

interface ShelfWithBooks extends Shelf {
  books: readonly Book[];
  curatorNote?: string;
}

export function reconcileBooksToShelves(allBooks: Book[], allShelves: Shelf[]): ShelfWithBooks[] {
  const shelfMap = new Map<string, ShelfWithBooks>(
    allShelves.map(s => [s.id, { ...s, books: [] }])
  );
  const orphans: Book[] = [];

  allBooks.forEach(book => {
    if (book.shelfId && shelfMap.has(book.shelfId)) {
      const target = shelfMap.get(book.shelfId)!;
      (target.books as Book[]).push(book);
    } else {
      orphans.push(book);
    }
  });

  const result = Array.from(shelfMap.values()).filter(s => s.books.length > 0);
  if (orphans.length > 0 || (allShelves.length === 0 && allBooks.length > 0)) {
    result.push({
      id: 'uncategorized-001',
      title: 'Monograph Recovery',
      description: 'Volumes synthesized via latent thematic clustering.',
      isVirtual: true,
      books: orphans
    });
  }
  return result;
}

const BookItem: React.FC<{ book: Book; onClick: (b: Book) => void }> = ({ book, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const haptics = useHaptics();

  const handleClick = () => {
    haptics.trigger('light');
    onClick(book);
  };

  return (
    <div 
      onClick={handleClick}
      className="group cursor-pointer perspective-1000"
    >
      <div className="relative w-full aspect-[2/3] transform-gpu transition-all duration-700 ease-out group-hover:rotate-y-12 group-hover:scale-105 group-hover:-translate-x-2">
        {/* Spine Side (3D Effect) */}
        <div className="absolute inset-y-0 -left-4 w-4 bg-brand-deep/80 origin-right transform rotate-y-90 z-0 shadow-2xl group-hover:bg-brand-deep transition-colors" />
        
        {/* Front Cover */}
        <div className="w-full h-full bg-ink/5 rounded-r-md overflow-hidden border border-ink/10 archival-shadow relative z-10 bg-gradient-to-br from-white/10 to-transparent">
          {book.coverUrl && !imageError ? (
            <img 
              src={book.coverUrl} 
              className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700" 
              alt={book.title} 
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-parchment">
               <span className="text-[9px] font-header italic text-ink/40 leading-tight line-clamp-3">{book.title}</span>
               <div className="mt-2 w-4 h-[1px] bg-ink/10"></div>
            </div>
          )}
          {/* Subtle paper texture overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
        </div>
        
        {/* Gloss Overlay */}
        <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity bg-gradient-to-tr from-transparent via-white to-transparent" />
      </div>
      <div className="mt-4 px-1 space-y-1">
        <h4 className="text-[11px] font-bold leading-tight group-hover:text-brand-cyan transition-colors line-clamp-2">{book.title}</h4>
        <p className="text-[9px] text-ink/40 italic font-medium truncate">{book.author}</p>
      </div>
    </div>
  );
};

const BeholdView: React.FC<{ books: Book[]; shelves: Shelf[]; onBookClick: (b: Book) => void }> = ({ books, shelves, onBookClick }) => {
  const [loading, setLoading] = useState(true);
  const [curatorNotes, setCuratorNotes] = useState<Record<string, string>>({});
  const [isSynthesizing, setIsSynthesizing] = useState<string | null>(null);
  const haptics = useHaptics();

  const reconciled = useMemo(() => reconcileBooksToShelves(books, shelves), [books, shelves]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSynthesize = async (shelfId: string, title: string, bookList: readonly Book[]) => {
    haptics.trigger('medium');
    setIsSynthesizing(shelfId);
    try {
      const booksForPrompt = bookList.map(b => ({ title: b.title, author: b.author }));
      const note = await geminiService.summarizeShelf(title, booksForPrompt);
      setCuratorNotes(prev => ({ ...prev, [shelfId]: note }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSynthesizing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-12 py-8 px-4">
        {[1, 2].map(i => (
          <div key={i} className="space-y-6 animate-pulse">
            <div className="h-10 bg-ink/5 w-1/2 rounded-full" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="aspect-[2/3] bg-ink/5 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 px-4 animate-in fade-in duration-1000">
      <header className="bg-mica-surface p-10 rounded-[3rem] archival-shadow border border-brand-cyan/10">
        <div className="space-y-3">
          <h2 className="font-header text-5xl italic tracking-tight text-brand-deep">Behold</h2>
          <p className="text-xs text-ink/50 italic leading-relaxed max-w-sm">
            Forensic structural visualization of your monograph, mapped via latent cluster protocols.
          </p>
        </div>
      </header>

      <div className="space-y-20">
        {reconciled.map((shelf) => (
          <section key={shelf.id} className="space-y-10">
            <header className="flex items-end justify-between border-b border-ink/5 pb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-header text-3xl italic text-brand-deep">{shelf.title}</h3>
                  {shelf.isVirtual && <span className="text-[7px] font-black uppercase tracking-widest text-brand-cyan px-2 py-0.5 bg-brand-cyan/5 rounded-full border border-brand-cyan/10">Virtual Protocol</span>}
                </div>
                {shelf.description && <p className="text-[9px] text-ink/30 uppercase tracking-[0.2em]">{shelf.description}</p>}
              </div>
              
              <button 
                onClick={() => handleSynthesize(shelf.id, shelf.title, shelf.books)}
                disabled={isSynthesizing === shelf.id}
                className="text-[9px] font-black uppercase tracking-widest text-brand-cyan hover:text-brand-deep transition-all flex items-center gap-2 px-3 py-1 bg-brand-cyan/5 rounded-lg border border-brand-cyan/20"
              >
                {isSynthesizing === shelf.id ? (
                  <div className="flex items-center gap-1">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Synthesizing...
                  </div>
                ) : curatorNotes[shelf.id] ? 'Re-Synthesize' : '✦ Consult Curator'}
              </button>
            </header>

            {curatorNotes[shelf.id] && (
              <div className="bg-brand-deep text-parchment p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-4 duration-700 relative overflow-hidden group border border-brand-cyan/20">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L9 9L1 12L9 15L12 23L15 15L23 12L15 9L12 1Z"/></svg>
                </div>
                <h4 className="text-[8px] font-black uppercase tracking-[0.4em] mb-4 text-brand-cyan">Curator's Monograph Synthesis</h4>
                <p className="font-header text-lg italic leading-relaxed opacity-90 whitespace-pre-wrap">{curatorNotes[shelf.id]}</p>
                <div className="mt-4 w-8 h-[1px] bg-brand-cyan/30" />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
              {shelf.books.map((book) => (
                <BookItem key={book.id} book={book} onClick={onBookClick} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .rotate-y-12 { transform: rotateY(-12deg); }
        .rotate-y-90 { transform: rotateY(90deg); }
        .archival-shadow { box-shadow: 10px 10px 20px rgba(1, 29, 77, 0.1), -1px -1px 2px rgba(255, 255, 255, 0.5); }
      `}</style>
    </div>
  );
};

export default BeholdView;
