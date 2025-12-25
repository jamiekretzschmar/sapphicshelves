
import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { geminiService } from '../services/gemini';

interface BookDetailProps {
  book: Book;
  onUpdate: (book: Book) => void;
  onClose: () => void;
}

const BookDetail: React.FC<BookDetailProps> = ({ book, onUpdate, onClose }) => {
  const [isEnriching, setIsEnriching] = useState(false);

  const enrichData = async () => {
    setIsEnriching(true);
    try {
      const enrichment = await geminiService.enrichBook(book.title, book.author);
      onUpdate({ ...book, ...enrichment });
    } catch (error) {
      console.error("Enrichment failed", error);
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <div className="mica-surface border border-ink/10 rounded-3xl p-6 space-y-6 shadow-2xl relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-ink/40 hover:text-ink">✕</button>
      
      <div className="flex gap-6 items-start">
        <div className="w-32 h-48 bg-ink/5 rounded-lg border border-ink/10 shrink-0 shadow-inner flex items-center justify-center">
          {book.coverUrl ? <img src={book.coverUrl} className="w-full h-full object-cover" /> : <span className="text-xs text-ink/20 italic">Archival Folio</span>}
        </div>
        <div className="flex-1 space-y-2">
          <h2 className="font-header text-3xl leading-tight">{book.title}</h2>
          <p className="text-xl italic text-ink/70">{book.author}</p>
          {book.isbn && <p className="text-[10px] tracking-widest uppercase text-ink/40">ISBN: {book.isbn}</p>}
        </div>
      </div>

      <div className="space-y-4">
        {!book.synopsis && !isEnriching && (
          <button 
            onClick={enrichData}
            className="w-full py-3 bg-celeste/20 border border-celeste/40 text-ink text-sm font-semibold rounded-xl hover:bg-celeste/30 transition-colors"
          >
            ✦ Enrich Metadata from Global Archive
          </button>
        )}

        {isEnriching && (
          <div className="text-center py-4 animate-pulse italic text-gold text-sm">Consulting the literary grounding metadata...</div>
        )}

        {book.synopsis && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink/30 border-b border-ink/5 pb-1">Historical Significance</h4>
            <p className="text-sm leading-relaxed italic">{book.synopsis}</p>
          </div>
        )}

        {book.tropes && book.tropes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink/30 border-b border-ink/5 pb-1">Literary Tropes</h4>
            <div className="flex flex-wrap gap-2">
              {book.tropes.map(t => (
                <span key={t} className="text-xs px-3 py-1 bg-ink/5 rounded-full border border-ink/10">{t}</span>
              ))}
            </div>
          </div>
        )}

        {book.sourceUrls && book.sourceUrls.length > 0 && (
          <div className="space-y-2 pt-4">
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink/30">Grounding References</h4>
            <div className="space-y-1">
              {book.sourceUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener" className="block text-[10px] text-gold hover:underline truncate italic">
                  Ref: {new URL(url).hostname}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetail;
