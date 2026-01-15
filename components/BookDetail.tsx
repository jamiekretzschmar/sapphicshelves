import React, { useState, useEffect, useMemo } from 'react';
import { Book, BookStatus, Shelf } from '../types';
import { geminiService } from '../services/gemini';
import { useHaptics } from '../hooks/useHaptics';

interface BookDetailProps {
  book: Book;
  shelves: Shelf[];
  isAuthorTracked: boolean;
  isAuthorSyncing: boolean;
  onTrackAuthor: (name: string) => void;
  onSyncAuthor: (name: string) => void;
  onUpdate: (book: Book) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onKeyError: () => void;
}

const BookDetail: React.FC<BookDetailProps> = ({ 
  book, 
  shelves,
  isAuthorTracked, 
  isAuthorSyncing,
  onTrackAuthor, 
  onSyncAuthor,
  onUpdate, 
  onDelete,
  onClose, 
  onKeyError 
}) => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imageErrorLevel, setImageErrorLevel] = useState(0);
  const [editValues, setEditValues] = useState({ title: book.title, author: book.author });
  const haptics = useHaptics();
  
  const [notes, setNotes] = useState(book.userNotes || '');

  useEffect(() => {
    setNotes(book.userNotes || '');
    setEditValues({ title: book.title, author: book.author });
  }, [book.id]);

  const handleSaveNotes = () => {
    if (notes !== book.userNotes) {
      onUpdate({ ...book, userNotes: notes });
    }
  };

  const enrichData = async () => {
    if (isEnriching) return;
    setIsEnriching(true);
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
      if (error.message?.includes('403') || error.message?.includes('leaked')) {
        onKeyError();
      }
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSaveMeta = () => {
    onUpdate({ ...book, title: editValues.title, author: editValues.author });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to burn this volume from the archive?")) {
      haptics.trigger('heavy');
      onDelete(book.id);
      onClose();
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

  const statusColors: Record<BookStatus, string> = {
    tbr: 'bg-ink/10 text-ink',
    reading: 'bg-gold/20 text-gold',
    read: 'bg-emerald-500/20 text-emerald-700',
    dnf: 'bg-rose/10 text-rose'
  };

  return (
    <div 
      className="bg-parchment/95 backdrop-blur-xl border border-ink/10 rounded-[2rem] shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh] w-full max-w-2xl mx-auto"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-ink/5 shrink-0">
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-cyan">Archival Folio</span>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-ink/5 hover:bg-rose hover:text-white transition-all">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 overscroll-contain">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover & Actions */}
          <div className="flex flex-col gap-4 w-full md:w-48 shrink-0">
             <div className="aspect-[2/3] w-48 mx-auto bg-white rounded-lg shadow-xl border border-ink/5 overflow-hidden relative group">
                {currentCoverUrl ? (
                  <img 
                    src={currentCoverUrl} 
                    className="w-full h-full object-cover" 
                    alt={book.title} 
                    onError={() => setImageErrorLevel(prev => prev + 1)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-deep/5 p-4 text-center">
                    <span className="text-[10px] text-ink/30 italic">No Cover</span>
                  </div>
                )}
                {isEnriching && (
                  <div className="absolute inset-0 bg-brand-deep/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
             </div>

             <select 
               value={book.status}
               onChange={(e) => onUpdate({ ...book, status: e.target.value as BookStatus })}
               className={`w-full appearance-none text-center py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none focus:ring-2 focus:ring-offset-2 ring-offset-parchment focus:ring-brand-cyan/50 ${statusColors[book.status]}`}
             >
               <option value="tbr">To Be Read</option>
               <option value="reading">Reading</option>
               <option value="read">Finished</option>
               <option value="dnf">DNF</option>
             </select>

             <div className="flex justify-center gap-1">
               {[1, 2, 3, 4, 5].map(star => (
                 <button 
                   key={star}
                   onClick={() => onUpdate({ ...book, rating: star })}
                   className={`text-2xl transition-all hover:scale-110 ${book.rating && book.rating >= star ? 'text-gold' : 'text-ink/10 hover:text-gold/50'}`}
                 >
                   ★
                 </button>
               ))}
             </div>
          </div>

          {/* Metadata */}
          <div className="flex-1 space-y-6">
             {isEditing ? (
               <div className="space-y-4 bg-white/50 p-4 rounded-2xl border border-ink/10">
                 <input 
                   className="w-full bg-transparent text-3xl font-header italic border-b border-ink/20 focus:border-brand-cyan outline-none"
                   value={editValues.title}
                   onChange={e => setEditValues({...editValues, title: e.target.value})}
                 />
                 <input 
                   className="w-full bg-transparent text-xl font-header text-ink/70 border-b border-ink/20 focus:border-brand-cyan outline-none"
                   value={editValues.author}
                   onChange={e => setEditValues({...editValues, author: e.target.value})}
                 />
                 <div className="flex gap-2">
                   <button onClick={handleSaveMeta} className="px-4 py-2 bg-brand-cyan text-white text-xs rounded-lg uppercase tracking-wider font-bold">Save</button>
                   <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-ink/5 text-ink text-xs rounded-lg uppercase tracking-wider font-bold">Cancel</button>
                 </div>
               </div>
             ) : (
               <div className="group relative">
                 <h2 className="font-header text-4xl leading-none text-brand-deep italic">{book.title}</h2>
                 <p className="text-2xl font-header italic text-ink/70 mt-2">by {book.author}</p>
                 <button onClick={() => setIsEditing(true)} className="absolute -right-2 top-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-ink/20 hover:text-brand-cyan">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                 </button>
               </div>
             )}

             {/* Shelf Mover */}
             <div className="flex items-center gap-2">
               <span className="text-[9px] font-bold uppercase tracking-widest text-ink/40">Location:</span>
               <select 
                 value={book.shelfId || ''}
                 onChange={(e) => onUpdate({ ...book, shelfId: e.target.value || undefined })}
                 className="bg-ink/5 border-none rounded-lg text-xs py-1 px-3 text-brand-deep font-bold cursor-pointer hover:bg-ink/10 outline-none"
               >
                 <option value="">Unsorted / Stack</option>
                 {shelves.map(s => (
                   <option key={s.id} value={s.id}>{s.title}</option>
                 ))}
               </select>
             </div>

             <div className="flex flex-wrap gap-2">
               <button onClick={enrichData} disabled={isEnriching} className="px-4 py-2 bg-brand-deep text-parchment rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-ink">
                 {isEnriching ? 'Syncing...' : '✦ Sync Metadata'}
               </button>
               {isAuthorTracked ? (
                 <button onClick={() => onSyncAuthor(book.author)} disabled={isAuthorSyncing} className="px-4 py-2 bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 rounded-xl text-[9px] font-black uppercase tracking-widest">
                   {isAuthorSyncing ? 'Pulse Active' : 'Update Author'}
                 </button>
               ) : (
                 <button onClick={() => onTrackAuthor(book.author)} className="px-4 py-2 bg-plum/10 text-plum border border-plum/20 rounded-xl text-[9px] font-black uppercase tracking-widest">
                   Track Author
                 </button>
               )}
             </div>

             <div className="space-y-2">
               <label className="text-[9px] font-black uppercase tracking-[0.3em] text-ink/30">Marginalia (Notes)</label>
               <textarea 
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 onBlur={handleSaveNotes}
                 placeholder="Add your personal observations..."
                 className="w-full h-32 bg-white/40 border border-ink/10 rounded-xl p-4 text-sm italic focus:bg-white focus:ring-1 focus:ring-brand-cyan/30 outline-none transition-all resize-none"
               />
             </div>
          </div>
        </div>

        {book.synopsis && (
          <div className="bg-white/40 p-6 rounded-2xl border border-white">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-ink/30 mb-2">Abstract</h3>
            <p className="text-sm italic leading-relaxed text-ink/80">{book.synopsis}</p>
          </div>
        )}
        
        {book.tropes && (
          <div className="flex flex-wrap gap-2">
            {book.tropes.map(t => (
              <span key={t} className="px-3 py-1 bg-white border border-ink/5 rounded-full text-[9px] font-bold text-ink/60">{t}</span>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-ink/5 bg-mica-surface flex justify-between items-center shrink-0">
        <span className="text-[8px] font-mono text-ink/30">ID: {book.id}</span>
        <button 
          onClick={handleDelete}
          className="px-4 py-2 text-rose hover:bg-rose/5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors"
        >
          Burn Volume
        </button>
      </div>
    </div>
  );
};

export default BookDetail;