
import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { geminiService } from '../services/gemini';

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
  const [errorStatus, setErrorStatus] = useState<'NONE' | 'KEY_REVOKED'>('NONE');
  
  const [editSynopsis, setEditSynopsis] = useState(book.synopsis || '');
  const [editTropes, setEditTropes] = useState<string[]>(book.tropes || []);
  const [newTrope, setNewTrope] = useState('');

  const enrichData = async () => {
    setIsEnriching(true);
    setErrorStatus('NONE');
    try {
      const enrichment = await geminiService.enrichBook(book.title, book.author);
      onUpdate({ 
        ...book, 
        ...enrichment,
        synopsis: editSynopsis || enrichment.synopsis,
        tropes: Array.from(new Set([...editTropes, ...(enrichment.tropes || [])]))
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

  const handleManualSave = () => {
    onUpdate({
      ...book,
      synopsis: editSynopsis,
      tropes: editTropes
    });
    setIsEditing(false);
  };

  const addTrope = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTrope.trim() && !editTropes.includes(newTrope.trim())) {
      setEditTropes(prev => [...prev, newTrope.trim()]);
      setNewTrope('');
    }
  };

  const removeTrope = (trope: string) => {
    setEditTropes(prev => prev.filter(t => t !== trope));
  };

  const handleRotateKey = async () => {
    if (typeof window.aistudio?.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setErrorStatus('NONE');
    }
  };

  return (
    <div className="mica-surface border border-ink/10 rounded-3xl p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center">
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-plum opacity-40">Folio Registry</span>
        <button onClick={onClose} className="text-ink/40 hover:text-ink transition-colors p-2">✕</button>
      </div>
      
      <div className="flex gap-6 items-start">
        <div className="w-32 h-48 bg-ink/5 rounded-lg border border-ink/10 shrink-0 shadow-inner flex items-center justify-center overflow-hidden">
          {book.coverUrl ? (
            <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} />
          ) : (
            <div className="text-center p-4">
               <span className="text-[8px] font-header italic text-ink/20 uppercase tracking-widest">Uncovered Folio</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <h2 className="font-header text-3xl leading-tight italic">{book.title}</h2>
          <div className="flex items-center gap-3 group/author">
            <p className="text-xl italic text-ink/70">by {book.author}</p>
            {isAuthorTracked ? (
              <button 
                onClick={() => onSyncAuthor(book.author)}
                disabled={isAuthorSyncing}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${
                  isAuthorSyncing 
                    ? 'bg-rose/10 text-rose border-rose/20 animate-pulse' 
                    : 'bg-plum/5 text-plum border-plum/10 hover:bg-plum hover:text-parchment'
                }`}
                title="Resync Author Pulse"
              >
                {isAuthorSyncing ? (
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                )}
                <span className="text-[8px] font-black uppercase tracking-widest">Resync Pulse</span>
              </button>
            ) : (
              <button 
                onClick={() => onTrackAuthor(book.author)}
                className="text-[9px] font-black uppercase tracking-widest text-plum hover:text-rose transition-colors bg-plum/5 px-2 py-1 rounded-lg border border-plum/10 opacity-0 group-hover/author:opacity-100 transition-opacity"
              >
                ✦ Track Scribe
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 pt-2">
            {book.isbn && <span className="text-[9px] tracking-widest uppercase text-ink/40 font-mono">ISBN: {book.isbn}</span>}
            {book.isCanadian && <span className="px-2 py-0.5 bg-sunset/10 text-sunset text-[7px] font-black uppercase tracking-tighter border border-sunset/20 rounded">True North</span>}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {errorStatus === 'KEY_REVOKED' && (
          <div className="bg-rose/10 border border-rose/20 p-4 rounded-xl space-y-3">
            <p className="text-[10px] font-bold text-rose uppercase tracking-widest text-center">Protocol Interrupted: Key Compromised</p>
            <button 
              onClick={handleRotateKey}
              className="w-full py-2 bg-rose text-parchment text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md"
            >
              Rotate Key
            </button>
          </div>
        )}

        <div className="flex gap-2">
          {!isEditing && (
            <button 
              onClick={enrichData}
              disabled={isEnriching}
              className="flex-1 py-3 bg-plum/5 border border-plum/20 text-plum text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-plum/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isEnriching ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Syncing...</span>
                </>
              ) : '✦ Consult Archive'}
            </button>
          )}
          
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`flex-1 py-3 border rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              isEditing ? 'bg-ink text-parchment border-ink' : 'bg-transparent border-ink/20 text-ink/60 hover:border-ink/40'
            }`}
          >
            {isEditing ? 'Cancel Annotation' : '✎ Annotate Folio'}
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-6 p-6 bg-ink/[0.02] border border-ink/5 rounded-3xl animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-header text-xl italic text-plum">Archivist's Annotation</h3>
            
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-ink/30">Thematic Abstract</label>
              <textarea 
                value={editSynopsis}
                onChange={(e) => setEditSynopsis(e.target.value)}
                placeholder="Inscribe your synopsis or personal notes here..."
                className="w-full bg-mica-surface border border-ink/10 rounded-xl p-4 text-sm italic min-h-[120px] focus:ring-1 focus:ring-plum/20 outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[8px] font-black uppercase tracking-widest text-ink/30">Thematic Tropes</label>
              <form onSubmit={addTrope} className="flex gap-2">
                <input 
                  type="text"
                  value={newTrope}
                  onChange={(e) => setNewTrope(e.target.value)}
                  placeholder="Add trope (e.g. Rivals to Lovers)"
                  className="flex-1 bg-mica-surface border border-ink/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-plum/30"
                />
                <button type="submit" className="px-4 bg-plum text-parchment rounded-xl text-[9px] font-black uppercase tracking-widest">Add</button>
              </form>
              <div className="flex flex-wrap gap-2">
                {editTropes.map(t => (
                  <span key={t} className="flex items-center gap-2 text-[10px] px-3 py-1 bg-plum/5 text-plum rounded-full border border-plum/10">
                    {t}
                    <button onClick={() => removeTrope(t)} className="hover:text-rose">✕</button>
                  </span>
                ))}
              </div>
            </div>

            <button 
              onClick={handleManualSave}
              className="w-full py-4 bg-plum text-parchment rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-rose transition-all active:scale-95"
            >
              Commit to Monograph
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            {isEnriching && (
              <div className="text-center py-8 space-y-3">
                <div className="flex justify-center gap-1">
                  {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-plum animate-bounce" style={{animationDelay: `${i*0.2}s`}} />)}
                </div>
                <p className="italic text-plum/60 text-xs">The Scribes are consulting historical records...</p>
              </div>
            )}

            {(book.synopsis || book.tropes?.length) ? (
              <>
                {book.synopsis && (
                  <div className="space-y-2">
                    <h4 className="text-[8px] font-black tracking-[0.3em] uppercase text-ink/30 border-b border-ink/5 pb-1">Archival Abstract</h4>
                    <p className="text-sm leading-relaxed italic text-ink/80">{book.synopsis}</p>
                  </div>
                )}

                {book.tropes && book.tropes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[8px] font-black tracking-[0.3em] uppercase text-ink/30 border-b border-ink/5 pb-1">Literary Signifiers</h4>
                    <div className="flex flex-wrap gap-2">
                      {book.tropes.map(t => (
                        <span key={t} className="text-[10px] px-3 py-1 bg-mica-surface rounded-full border border-plum/10 text-plum italic shadow-sm">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {book.sourceUrls && book.sourceUrls.length > 0 && (
                  <div className="space-y-2 pt-4">
                    <h4 className="text-[8px] font-black tracking-[0.3em] uppercase text-ink/30">Archival Grounding</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {book.sourceUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener" className="flex items-center gap-2 text-[10px] text-plum hover:text-rose transition-colors truncate italic">
                          <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          {new URL(url).hostname.replace('www.', '')}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : !isEnriching && (
              <div className="text-center py-12 border-2 border-dashed border-ink/5 rounded-[2.5rem] opacity-30">
                <p className="text-xs italic">Folio currently unannotated.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetail;
