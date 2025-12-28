
import React, { useState, useEffect, useMemo } from 'react';
import { Book } from '../types';
import { geminiService } from '../services/gemini';
import { useHaptics } from '../hooks/useHaptics';

interface BookDetailProps {
  book: Book;
  isAuthorTracked: boolean;
  isAuthorSyncing: boolean;
  onTrackAuthor: (name: string) => void;
  onSyncAuthor: (name: string) => void;
  onUpdate: (book: Book) => void;
  onClose: () => void;
  onKeyError: () => void;
}

const BookDetail: React.FC<BookDetailProps> = ({ 
  book, 
  isAuthorTracked, 
  isAuthorSyncing,
  onTrackAuthor, 
  onSyncAuthor,
  onUpdate, 
  onClose, 
  onKeyError 
}) => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imageErrorLevel, setImageErrorLevel] = useState(0);
  const [errorStatus, setErrorStatus] = useState<'NONE' | 'KEY_REVOKED'>('NONE');
  const haptics = useHaptics();
  
  const [editSynopsis, setEditSynopsis] = useState(book.synopsis || '');
  const [editTropes, setEditTropes] = useState<string[]>(book.tropes || []);

  useEffect(() => {
    if (!book.coverUrl || !book.synopsis || !book.tropes?.length) {
      enrichData();
    }
  }, [book.id]);

  const enrichData = async () => {
    if (isEnriching) return;
    setIsEnriching(true);
    setErrorStatus('NONE');
    setImageErrorLevel(0);
    haptics.trigger('medium');
    try {
      const enrichment = await geminiService.enrichBook(book.title, book.author);
      onUpdate({ 
        ...book, 
        ...enrichment,
        synopsis: book.synopsis || enrichment.synopsis,
        tropes: Array.from(new Set([...(book.tropes || []), ...(enrichment.tropes || [])]))
      });
    } catch (error: any) {
      console.error("Enrichment failed", error);
      if (error.message?.includes('403') || error.message?.includes('leaked')) {
        setErrorStatus('KEY_REVOKED');
        onKeyError();
      }
    } finally {
      setIsEnriching(false);
    }
  };

  const currentCoverUrl = useMemo(() => {
    if (imageErrorLevel === 0 && book.coverUrl) return book.coverUrl;
    if (imageErrorLevel <= 1 && book.isbn) {
      const cleanIsbn = book.isbn.replace(/[^0-9X]/gi, '');
      return `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
    }
    return null;
  }, [book.coverUrl, book.isbn, imageErrorLevel]);

  return (
    <div className="bg-parchment/95 backdrop-blur-xl border border-ink/10 rounded-[3rem] p-8 space-y-8 shadow-2xl relative animate-in zoom-in-95 duration-500 overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
      </div>

      <div className="flex justify-between items-center relative z-10">
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-cyan">Archival Folio Entry</span>
        <button onClick={() => { haptics.trigger('light'); onClose(); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-ink/5 text-ink/40 hover:bg-brand-deep hover:text-parchment transition-all">✕</button>
      </div>
      
      <div className="flex gap-8 items-start relative z-10">
        <div className="w-36 h-52 bg-white rounded-xl shadow-2xl border border-ink/5 shrink-0 overflow-hidden relative group">
          {currentCoverUrl ? (
            <img 
              src={currentCoverUrl} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              alt={book.title} 
              onError={() => setImageErrorLevel(prev => prev + 1)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center italic bg-brand-deep/5">
              <span className="text-[10px] text-ink/30">Cover Missing from Archive</span>
            </div>
          )}
          {isEnriching && (
            <div className="absolute inset-0 bg-brand-deep/40 backdrop-blur-sm flex items-center justify-center">
               <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        <div className="flex-1 space-y-3">
          <h2 className="font-header text-4xl leading-none text-brand-deep italic">{book.title}</h2>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-header italic text-ink/70">by {book.author}</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {book.isbn && <span className="text-[9px] font-mono px-2 py-1 bg-ink/5 rounded border border-ink/10 text-ink/60 uppercase">ISBN: {book.isbn}</span>}
            {book.isCanadian && <span className="text-[9px] font-black px-2 py-1 bg-brand-cyan/10 text-brand-cyan rounded border border-brand-cyan/20 uppercase tracking-tighter">True North</span>}
          </div>
        </div>
      </div>

      <div className="space-y-8 relative z-10">
        <div className="flex gap-3">
          <button 
            onClick={enrichData}
            disabled={isEnriching}
            className="flex-1 py-4 bg-brand-deep text-parchment rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-ink transition-all active:scale-95 disabled:opacity-50"
          >
            {isEnriching ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Syncing...
              </div>
            ) : '✦ Sync Metadata'}
          </button>
          {isAuthorTracked ? (
            <button 
              onClick={() => onSyncAuthor(book.author)}
              disabled={isAuthorSyncing}
              className={`flex items-center gap-3 px-6 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                isAuthorSyncing 
                ? 'bg-rose/10 border-rose/20 text-rose animate-pulse' 
                : 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/20'
              }`}
            >
              {isAuthorSyncing ? 'Pulse Active' : 'Scribe Pulse'}
            </button>
          ) : (
            <button 
              onClick={() => onTrackAuthor(book.author)}
              className="flex items-center gap-3 px-6 bg-plum/5 text-plum rounded-2xl border border-plum/20 text-[10px] font-black uppercase tracking-widest hover:bg-plum hover:text-white transition-all"
            >
              ✦ Track Scribe
            </button>
          )}
        </div>

        {book.synopsis && (
          <div className="space-y-3 bg-white/40 p-6 rounded-[2rem] border border-white">
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-ink/30 mb-2">Thematic Abstract</h3>
            <p className="text-base italic leading-relaxed text-ink/80">{book.synopsis}</p>
          </div>
        )}

        {book.tropes && book.tropes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-ink/30">Literary Signifiers</h3>
            <div className="flex flex-wrap gap-2">
              {book.tropes.map(t => (
                <span key={t} className="text-[10px] font-bold px-4 py-2 bg-white rounded-full border border-ink/5 shadow-sm text-brand-deep italic">{t}</span>
              ))}
            </div>
          </div>
        )}

        {book.sourceUrls && book.sourceUrls.length > 0 && (
          <div className="pt-8 border-t border-ink/5 space-y-4">
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-ink/30">Archival Grounding Citations</h3>
            <div className="grid grid-cols-1 gap-2">
              {book.sourceUrls.map((source: any, i: number) => (
                <a 
                  key={i} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener" 
                  className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-ink/5 hover:border-brand-cyan/20 hover:text-brand-cyan transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 opacity-30 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    <span className="text-[10px] font-bold italic truncate max-w-[200px]">{source.title || new URL(source.uri).hostname}</span>
                  </div>
                  <span className="text-[8px] font-mono opacity-40 group-hover:opacity-100">{new URL(source.uri).hostname.replace('www.', '')}</span>
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
