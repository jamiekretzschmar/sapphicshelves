import React, { useState, useEffect, useMemo } from 'react';
import { Book, Shelf } from '../types';

/**
 * ARCHITECT: Lead System Architect
 * PROTOCOL: Zero-Failure
 * SUBJECT: Forensic Orphan Reconciliation & Shelf Integrity Engine
 */

interface ShelfWithBooks extends Shelf {
  books: readonly Book[];
}

/**
 * Logic Flow: The Forensic Loop
 * Pure function with idempotent grouping.
 */
export function reconcileBooksToShelves(allBooks: Book[], allShelves: Shelf[]): ShelfWithBooks[] {
  // Step 1: Normalization (O(M) lookup map generation)
  const shelfMap = new Map<string, ShelfWithBooks>(
    allShelves.map(s => [s.id, { ...s, books: [] }])
  );

  const orphans: Book[] = [];

  // Step 2: The Filter Gate (O(N) iteration)
  allBooks.forEach(book => {
    // Check: Does shelfId exist and mapping exist?
    if (book.shelfId && shelfMap.has(book.shelfId)) {
      // Idempotent assembly using bucket dispatch
      const target = shelfMap.get(book.shelfId)!;
      // Note: In a strictly immutable environment we would spread, 
      // but for performance during iteration we push to the mutable reference of the new map object.
      (target.books as Book[]).push(book);
    } else {
      orphans.push(book);
    }
  });

  // Step 3: Virtual Shelf Injection (Chaos Fallback)
  const result = Array.from(shelfMap.values()).filter(s => s.books.length > 0);

  if (orphans.length > 0 || (allShelves.length === 0 && allBooks.length > 0)) {
    result.push({
      id: 'uncategorized-001',
      title: 'Recovered Items',
      description: 'Orphaned volumes reconciled via referential integrity check.',
      isVirtual: true,
      books: orphans
    });
  }

  return result;
}

const ShelfRenderer: React.FC<{ shelves: ShelfWithBooks[]; onBookClick: (b: Book) => void }> = ({ shelves, onBookClick }) => {
  return (
    <div className="space-y-16 pb-20">
      {shelves.map((shelf) => (
        <section key={shelf.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <header className="flex items-end justify-between border-b border-ink/10 pb-4 sticky top-0 bg-parchment/80 backdrop-blur-md z-10 py-4 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="font-header text-4xl italic font-semibold">{shelf.title}</h3>
                {shelf.isVirtual && (
                  <span className="px-3 py-1 bg-lavender-500/10 text-lavender-500 text-[9px] font-black uppercase tracking-[0.2em] border border-lavender-500/20 rounded-full animate-pulse">
                    Archival Recovery
                  </span>
                )}
              </div>
              {shelf.description && <p className="text-[10px] text-ink/40 uppercase tracking-[0.15em] font-medium">{shelf.description}</p>}
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-ink/30 italic">{shelf.books.length} Volumes</span>
            </div>
          </header>

          {/* Zero-Layout-Shift: Grid container with pre-calculated reserve space */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 min-h-[320px]">
            {shelf.books.map((book) => (
              <div 
                key={book.id} 
                onClick={() => onBookClick(book)}
                className="group cursor-pointer space-y-3"
              >
                <div className="aspect-[2/3] bg-ink/5 rounded-xl overflow-hidden border border-ink/10 archival-shadow group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500 ease-out relative ring-offset-2 ring-lavender-500/0 group-hover:ring-2 group-hover:ring-lavender-500/20">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" alt={book.title} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-parchment to-lavender-100">
                       <span className="text-[10px] font-header italic text-ink/40 leading-tight">{book.title}</span>
                       <div className="mt-4 w-8 h-[1px] bg-ink/10"></div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="px-1 space-y-1">
                  <h4 className="text-[12px] font-bold leading-tight group-hover:text-lavender-500 transition-colors line-clamp-2">{book.title}</h4>
                  <p className="text-[10px] text-ink/40 italic font-medium truncate">{book.author}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const BeholdView: React.FC<{ books: Book[]; shelves: Shelf[]; onBookClick: (b: Book) => void }> = ({ books, shelves, onBookClick }) => {
  const [loading, setLoading] = useState(true);
  const reconciled = useMemo(() => reconcileBooksToShelves(books, shelves), [books, shelves]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-16 py-8">
        {[1, 2].map(i => (
          <div key={i} className="space-y-8 animate-pulse">
            <div className="h-12 bg-ink/5 w-64 rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map(j => (
                <div key={j} className="space-y-3">
                  <div className="aspect-[2/3] bg-ink/5 rounded-xl" />
                  <div className="h-4 bg-ink/5 w-full rounded-lg" />
                  <div className="h-3 bg-ink/5 w-2/3 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reconciled.length === 0) {
    return (
      <div className="text-center py-48 glass-surface rounded-[3rem] border-2 border-dashed border-ink/5 opacity-40">
        <h2 className="font-header text-4xl italic text-ink/40">The Monograph remains Vacant</h2>
        <p className="text-[10px] uppercase tracking-[0.3em] mt-4 font-black">Initiate Acquisition Protocol</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <header className="glass-surface p-12 rounded-[3rem] archival-shadow flex flex-col md:flex-row md:items-end justify-between gap-8 border-lavender-200">
        <div className="space-y-2">
          <h2 className="font-header text-6xl font-semibold foil-stamping tracking-tight">Behold</h2>
          <p className="text-sm text-ink/50 italic leading-relaxed max-w-sm">
            High-fidelity visualization of archival structural integrity, mapped by referential acquisition.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-parchment rounded-2xl border border-ink/5 flex flex-col items-center justify-center">
            <span className="text-[8px] font-black uppercase tracking-widest text-ink/30 mb-1">Shelves</span>
            <span className="font-header text-2xl italic font-bold text-lavender-500">{reconciled.length}</span>
          </div>
          <div className="px-6 py-3 bg-parchment rounded-2xl border border-ink/5 flex flex-col items-center justify-center">
            <span className="text-[8px] font-black uppercase tracking-widest text-ink/30 mb-1">Volumes</span>
            <span className="font-header text-2xl italic font-bold text-lavender-500">{books.length}</span>
          </div>
        </div>
      </header>

      <ShelfRenderer shelves={reconciled} onBookClick={onBookClick} />
    </div>
  );
};

export default BeholdView;