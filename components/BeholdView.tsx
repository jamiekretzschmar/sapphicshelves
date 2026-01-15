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

  const result = Array.from(shelfMap.values());
  // Always add orphans if they exist
  if (orphans.length > 0) {
    result.push({
      id: 'uncategorized',
      title: 'The Stack',
      description: 'Unsorted Acquisitions',
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
        <div className="absolute inset-y-0 -left-4 w-4 bg-brand-deep/80 origin-right transform rotate-y-90 z-0 shadow-2xl group-hover:bg-brand-deep transition-colors" />
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
               <span className="text-[10px] font-header italic text-ink/60 leading-tight line-clamp-3">{book.title}</span>
            </div>
          )}
          {book.status === 'reading' && (
             <div className="absolute top-2 right-2 w-2 h-2 bg-gold rounded-full shadow-[0_0_8px_rgba(18,130,162,0.8)] animate-pulse" />
          )}
        </div>
        <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity bg-gradient-to-tr from-transparent via-white to-transparent" />
      </div>
      <div className="mt-4 px-1 space-y-1">
        <h4 className="text-xs font-bold leading-tight group-hover:text-brand-cyan transition-colors line-clamp-2">{book.title}</h4>
      </div>
    </div>
  );
};

const BeholdView: React.FC<{ 
  books: Book[]; 
  shelves: Shelf[]; 
  onBookClick: (b: Book) => void;
  onCreateShelf: (name: string) => void;
  onDeleteShelf: (id: string) => void;
}> = ({ books, shelves, onBookClick, onCreateShelf, onDeleteShelf }) => {
  const [curatorNotes, setCuratorNotes] = useState<Record<string, string>>({});
  const [isSynthesizing, setIsSynthesizing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const haptics = useHaptics();

  const reconciled = useMemo(() => reconcileBooksToShelves(books, shelves), [books, shelves]);

  const handleSynthesize = async (shelfId: string, title: string, bookList: readonly Book[]) => {
    if (bookList.length === 0) return;
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newShelfName.trim()) {
      onCreateShelf(newShelfName);
      setNewShelfName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-12 pb-32 px-4 animate-in fade-in duration-1000">
      <header className="bg-mica-surface p-10 rounded-[3rem] archival-shadow border border-brand-cyan/10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-3">
          <h2 className="font-header text-5xl italic tracking-tight text-brand-deep">Behold</h2>
          <p className="text-sm text-ink/70 italic leading-relaxed max-w-sm">
            Latent structural visualization.
          </p>
        </div>
        
        {isCreating ? (
          <form onSubmit={handleCreate} className="flex gap-2 w-full md:w-auto">
            <input 
              autoFocus
              placeholder="Shelf Name..."
              className="bg-parchment px-4 py-3 rounded-xl text-sm border border-brand-deep/20 outline-none w-full"
              value={newShelfName}
              onChange={e => setNewShelfName(e.target.value)}
            />
            <button type="submit" className="px-5 py-3 bg-brand-deep text-parchment rounded-xl text-xs font-bold uppercase">Add</button>
            <button type="button" onClick={() => setIsCreating(false)} className="px-5 py-3 text-ink/50 text-xs font-bold uppercase">X</button>
          </form>
        ) : (
          <button 
            onClick={() => setIsCreating(true)}
            className="px-8 py-4 bg-ink/5 hover:bg-brand-deep hover:text-parchment rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
          >
            + Construct Shelf
          </button>
        )}
      </header>

      <div className="space-y-20">
        {reconciled.map((shelf) => (
          <section key={shelf.id} className="space-y-10">
            <header className="flex items-end justify-between border-b border-ink/5 pb-4 group">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-header text-4xl italic text-brand-deep">{shelf.title}</h3>
                  <span className="text-xs font-mono text-ink/40">({shelf.books.length})</span>
                </div>
                {shelf.description && <p className="text-xs text-ink/60 uppercase tracking-[0.2em]">{shelf.description}</p>}
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 {!shelf.isVirtual && (
                   <button 
                     onClick={() => onDeleteShelf(shelf.id)}
                     className="text-xs font-bold text-rose hover:underline uppercase tracking-widest px-4 py-2"
                   >
                     Dismantle
                   </button>
                 )}
                 {shelf.books.length > 0 && (
                   <button 
                     onClick={() => handleSynthesize(shelf.id, shelf.title, shelf.books)}
                     disabled={isSynthesizing === shelf.id}
                     className="text-xs font-black uppercase tracking-widest text-brand-cyan hover:text-brand-deep transition-all px-4 py-2 bg-brand-cyan/5 rounded-xl"
                   >
                     {isSynthesizing === shelf.id ? 'Synthesizing...' : 'Consult Curator'}
                   </button>
                 )}
              </div>
            </header>

            {curatorNotes[shelf.id] && (
              <div className="bg-brand-deep text-parchment p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-4 duration-700 relative overflow-hidden group border border-brand-cyan/20">
                <h4 className="text-xs font-black uppercase tracking-[0.4em] mb-4 text-brand-cyan">Curator's Monograph Synthesis</h4>
                <p className="font-header text-xl italic leading-relaxed opacity-90 whitespace-pre-wrap">{curatorNotes[shelf.id]}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
              {shelf.books.map((book) => (
                <BookItem key={book.id} book={book} onClick={onBookClick} />
              ))}
              {shelf.books.length === 0 && (
                <div className="col-span-full py-12 text-center border border-dashed border-ink/10 rounded-2xl opacity-60 text-sm italic">
                  This shelf is currently vacant. Move volumes here from their folios.
                </div>
              )}
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