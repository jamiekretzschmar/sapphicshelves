
import React, { useState, useMemo } from 'react';
import { AuthorPulse, AuthorFilterMode, Book } from '../types';
import { geminiService } from '../services/gemini';

interface AuthorsViewProps {
  authorPulses: Record<string, AuthorPulse>;
  bookStatuses: Record<string, { read: boolean; wishlist: boolean }>;
  authorFilter: AuthorFilterMode;
  authorSearchTerm: string;
  onUpdateAuthor: (name: string, data: Partial<AuthorPulse>) => void;
  onBulkUpdateAuthors: (newPulses: Record<string, AuthorPulse>) => void;
  onToggleBookStatus: (authorName: string, bookTitle: string, type: 'read' | 'wishlist') => void;
  onSetAuthorFilter: (filter: AuthorFilterMode) => void;
  onSetAuthorSearchTerm: (term: string) => void;
  onAddAuthor: (name: string) => void;
  libraryBooks: Book[];
}

const AuthorsView: React.FC<AuthorsViewProps> = ({ 
  authorPulses, 
  bookStatuses,
  authorFilter,
  authorSearchTerm = '',
  onUpdateAuthor, 
  onToggleBookStatus,
  onSetAuthorFilter,
  onSetAuthorSearchTerm,
  onAddAuthor,
  libraryBooks
}) => {
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingAuthors, setSyncingAuthors] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<{ current: number, total: number } | null>(null);
  const [newAuthorName, setNewAuthorName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedBios, setExpandedBios] = useState<Set<string>>(new Set());

  const authors = useMemo(() => Object.values(authorPulses) as AuthorPulse[], [authorPulses]);

  // Fix: Explicitly type Sets and filter parameter to resolve 'Argument of type unknown is not assignable to string' error
  const potentialScribes = useMemo(() => {
    const libraryAuthors = new Set<string>(libraryBooks.map(b => b.author));
    const trackedAuthors = new Set<string>(Object.keys(authorPulses));
    return Array.from(libraryAuthors).filter((name: string) => !trackedAuthors.has(name));
  }, [libraryBooks, authorPulses]);

  const isFuzzyMatch = (target: string, query: string): boolean => {
    if (!query) return true;
    const t = target.toLowerCase();
    const q = query.toLowerCase();
    if (t.includes(q)) return true;

    const distance = (s1: string, s2: string): number => {
      const costs: number[] = [];
      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
          if (i === 0) costs[j] = j;
          else {
            if (j > 0) {
              let newValue = costs[j - 1];
              if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                newValue = Math.min(Math.min(newValue, lastValue), (costs[j] || 0)) + 1;
              }
              costs[j - 1] = lastValue;
              lastValue = newValue;
            }
          }
        }
        if (i > 0) costs[s2.length] = lastValue;
      }
      return costs[s2.length];
    };

    const threshold = Math.max(1, Math.floor(q.length / 4));
    return distance(t, q) <= threshold;
  };

  const filteredAuthors = useMemo(() => {
    let result = authors;
    if (authorFilter === 'favorites') {
      result = result.filter(a => a.isFavorite);
    }
    const query = (authorSearchTerm || '').trim();
    if (query) {
      result = result.filter(a => 
        isFuzzyMatch(a.name, query) || 
        (a.historicalContext && isFuzzyMatch(a.historicalContext, query)) ||
        a.bibliography?.some(b => isFuzzyMatch(b, query))
      );
    }
    return result;
  }, [authors, authorFilter, authorSearchTerm]);

  const recentReleases = useMemo(() => {
    return authors.flatMap(a => (a.releases || []).map(r => ({ ...r, author: a.name })))
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
  }, [authors]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const syncAuthor = async (name: string) => {
    setSyncingAuthors(prev => {
      const next = new Set(prev);
      next.add(name);
      return next;
    });
    setError(null);
    try {
      const fullRecord = await geminiService.syncAuthorFullRecord(name);
      onUpdateAuthor(name, { 
        ...fullRecord,
        lastChecked: new Date().toISOString() 
      });
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('403') || e.message?.includes('leaked')) {
        setError("Archival Key Compromised. Please rotate via Settings.");
      } else {
        setError(`Archival sync failed for ${name}. Verify connection.`);
      }
    } finally {
      setSyncingAuthors(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
  };

  const syncBatch = async () => {
    const targets = authorFilter === 'batch' ? Array.from(selectedNames) : filteredAuthors.map(a => a.name);
    if (targets.length === 0) return;

    setIsSyncing(true);
    setBatchProgress({ current: 0, total: targets.length });

    for (let i = 0; i < targets.length; i++) {
      const name = targets[i];
      setBatchProgress({ current: i, total: targets.length });
      await syncAuthor(name);
    }

    setBatchProgress({ current: targets.length, total: targets.length });
    setTimeout(() => {
      setIsSyncing(false);
      setBatchProgress(null);
    }, 1000);
    setSelectedNames(new Set());
  };

  return (
    <div className="space-y-8 pb-20 selection:bg-rose/10">
      {potentialScribes.length > 0 && authorFilter === 'all' && (
        <section className="bg-mica-surface border border-ink/5 p-6 rounded-[2.5rem] shadow-sm animate-in fade-in duration-500">
           <div className="flex items-center gap-3 mb-4">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-plum opacity-40">Potential Scribes</span>
             <div className="flex-1 h-[1px] bg-ink/5" />
           </div>
           <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2">
             {potentialScribes.map(name => (
               <button 
                key={name}
                onClick={() => onAddAuthor(name)}
                className="flex-none px-4 py-2 bg-plum/5 hover:bg-plum hover:text-parchment rounded-xl border border-plum/10 transition-all text-[11px] font-bold italic flex items-center gap-2 whitespace-nowrap"
               >
                 ✦ {name}
               </button>
             ))}
           </div>
        </section>
      )}

      {recentReleases.length > 0 && (
        <section className="bg-ink text-parchment p-6 rounded-3xl animate-in slide-in-from-top duration-700 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose/10 blur-3xl -mr-10 -mt-10 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-rose opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose"></span>
              </span>
              <h2 className="font-header text-xl italic tracking-wide">Fresh Intelligence</h2>
            </div>
            <div className="space-y-2">
              {recentReleases.slice(0, 3).map((alert, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] border-b border-parchment/10 pb-2 last:border-0">
                  <div className="flex flex-col">
                    <span className="font-bold text-rose uppercase tracking-tighter">{alert.author}</span>
                    <span className="italic opacity-80">{alert.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.isUpcoming ? (
                      <span className="px-2 py-0.5 bg-gold/20 text-gold rounded-full font-bold uppercase text-[7px] tracking-widest">Future</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose/20 text-rose rounded-full font-bold uppercase text-[7px] tracking-widest">Released</span>
                    )}
                    <span className="opacity-40 font-mono text-[8px]">{alert.releaseDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-mica-surface border border-ink/5 p-8 rounded-[2.5rem] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="font-header text-3xl">The Monograph</h2>
          <div className="flex bg-ink/5 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {(['all', 'favorites', 'batch'] as AuthorFilterMode[]).map(m => (
              <button
                key={m}
                onClick={() => { onSetAuthorFilter(m); setSelectedNames(new Set()); }}
                className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                  authorFilter === m ? 'bg-ink text-parchment shadow-md' : 'text-ink/40 hover:text-ink/60'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="relative group">
            <input 
              type="text"
              placeholder="Fuzzy Search by scribe, movement, or bibliography..."
              value={authorSearchTerm}
              onChange={(e) => onSetAuthorSearchTerm(e.target.value)}
              className="w-full bg-ink/5 border border-ink/5 px-5 py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose/20 transition-all italic pr-12 font-light"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/20 group-focus-within:text-rose transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Inscribe new scribe..."
              value={newAuthorName}
              onChange={e => setNewAuthorName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (onAddAuthor(newAuthorName), setNewAuthorName(''))}
              className="flex-1 bg-plum/5 border border-plum/10 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-rose/30 transition-colors italic font-light text-plum"
            />
            <button 
              onClick={() => { onAddAuthor(newAuthorName); setNewAuthorName(''); }}
              className="px-8 bg-plum text-parchment rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose transition-colors shadow-lg active:scale-95"
            >
              Inscribe
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose/10 border border-rose/20 text-rose text-[10px] rounded-xl italic font-bold">
            Protocol Error: {error}
          </div>
        )}

        {(authorFilter === 'batch' || (authorFilter === 'all' && filteredAuthors.length > 0)) && (
          <div className="space-y-4 pt-2 border-t border-ink/5">
            <button 
              onClick={syncBatch}
              disabled={isSyncing || (authorFilter === 'batch' && selectedNames.size === 0)}
              className="w-full py-4 bg-ink text-parchment rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-xl relative overflow-hidden"
            >
              {isSyncing ? (
                <div className="flex items-center gap-2">
                   <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   <span>Consulting Global Archives...</span>
                </div>
              ) : (
                <span>Synchronize {authorFilter === 'batch' ? selectedNames.size : filteredAuthors.length} Records</span>
              )}
            </button>

            {batchProgress && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.3em] text-ink/40">
                  <span>Archival Progress</span>
                  <span className="text-rose font-mono">{batchProgress.current} / {batchProgress.total}</span>
                </div>
                <div className="w-full h-2 bg-ink/5 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-plum via-rose to-peach transition-all duration-500 ease-out shadow-[0_0_10px_rgba(214,41,118,0.3)]" 
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="space-y-8">
        {filteredAuthors.length > 0 ? filteredAuthors.map((author) => {
          const isIndividualSyncing = syncingAuthors.has(author.name);
          const isBioExpanded = expandedBios.has(author.name);
          
          return (
            <article 
              key={author.name}
              className={`bg-mica-surface border p-8 rounded-[2.5rem] transition-all relative ${
                authorFilter === 'batch' && selectedNames.has(author.name) ? 'border-rose ring-4 ring-rose/5 translate-x-1' : 'border-ink/5 shadow-sm hover:shadow-xl'
              }`}
              onClick={() => authorFilter === 'batch' && setSelectedNames(prev => {
                const n = new Set(prev);
                if (n.has(author.name)) n.delete(author.name); else n.add(author.name);
                return n;
              })}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2 flex-1 pr-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-header text-4xl italic leading-none">{author.name}</h3>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onUpdateAuthor(author.name, { isFavorite: !author.isFavorite }); 
                      }}
                      className={`transition-colors active:scale-125 ${author.isFavorite ? 'text-rose' : 'text-ink/10 hover:text-ink/30'}`}
                    >
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isIndividualSyncing ? (
                      <div className="flex items-center gap-2 text-rose animate-pulse font-bold text-[9px] uppercase tracking-widest">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Synchronizing Archival Record...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${author.lastChecked ? 'bg-emerald-500' : 'bg-sunset animate-pulse'}`}></span>
                        <p className="text-[10px] font-mono tracking-widest uppercase">
                          {author.lastChecked ? (
                            <span className="text-ink/40">Last Archive Sync: {formatDate(author.lastChecked)}</span>
                          ) : (
                            <span className="text-sunset font-bold">Pending Sync</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <button 
                  disabled={isIndividualSyncing}
                  onClick={(e) => { e.stopPropagation(); syncAuthor(author.name); }}
                  className={`p-4 rounded-2xl transition-all shadow-md active:scale-95 ${
                    isIndividualSyncing 
                      ? 'bg-ink/5 text-ink cursor-wait' 
                      : 'bg-ink text-parchment hover:bg-rose'
                  }`}
                  title="Force Sync with Archive"
                >
                  <svg className={`w-5 h-5 ${isIndividualSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {author.biography && author.biography !== 'Initiated...' && (
                <div className="space-y-4 mb-8">
                  <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-ink/30 border-b border-ink/5 pb-2">Archivist's Abstract</h4>
                  <div className="relative group">
                    <p className={`text-sm italic leading-relaxed text-ink/70 transition-all ${isBioExpanded ? '' : 'line-clamp-4'}`}>
                      {author.biography}
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setExpandedBios(prev => {
                        const next = new Set(prev);
                        if (next.has(author.name)) next.delete(author.name); else next.add(author.name);
                        return next;
                      }); }}
                      className="mt-2 text-[9px] font-bold uppercase tracking-widest text-plum hover:text-rose transition-colors flex items-center gap-1"
                    >
                      {isBioExpanded ? 'Collapse Record' : 'Read Full Monograph'}
                    </button>
                    {author.historicalContext && (
                      <div className="mt-4 flex items-center gap-2 bg-rose/5 border border-rose/10 px-3 py-1.5 rounded-full w-fit">
                        <span className="text-[8px] font-bold uppercase text-rose/60">Epoch:</span>
                        <span className="text-[10px] italic font-semibold text-plum">{author.historicalContext}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {author.releases && author.releases.length > 0 && (
                <div className="space-y-4 mb-8">
                  <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-sunset border-b border-sunset/10 pb-2">Recent Acquisitions</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {author.releases.map((rel, idx) => {
                      const status = bookStatuses[`${author.name}|${rel.title}`] || { read: false, wishlist: false };
                      return (
                        <div key={idx} className="bg-sunset/5 border border-sunset/10 p-5 rounded-3xl flex justify-between items-center group/item hover:bg-sunset/10 transition-colors">
                          <div className="space-y-1 pr-4 flex-1">
                            <p className="text-sm font-bold italic text-ink/80">{rel.title}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-sunset font-bold">{rel.releaseDate}</span>
                              {rel.isUpcoming && (
                                <span className="text-[7px] bg-sunset text-parchment px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Future Folio</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                             <button 
                              onClick={(e) => { e.stopPropagation(); onToggleBookStatus(author.name, rel.title, 'wishlist'); }} 
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${status.wishlist ? 'bg-rose text-parchment shadow-md' : 'bg-ink/5 text-ink/20 hover:text-ink/40'}`}
                             >
                               <svg className="w-4 h-4" fill={status.wishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                             </button>
                             <button 
                              onClick={(e) => { e.stopPropagation(); onToggleBookStatus(author.name, rel.title, 'read'); }} 
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${status.read ? 'bg-emerald-500 text-parchment shadow-md' : 'bg-ink/5 text-ink/20 hover:text-ink/40'}`}
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                             </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {author.bibliography && author.bibliography.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-plum border-b border-plum/10 pb-2">The Canon</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {author.bibliography.map((book, idx) => {
                      const status = bookStatuses[`${author.name}|${book}`] || { read: false, wishlist: false };
                      return (
                        <div key={idx} className="bg-plum/5 border border-plum/10 p-5 rounded-3xl flex justify-between items-center group/item hover:bg-plum/10 transition-colors">
                          <div className="space-y-1 pr-4 flex-1">
                            <p className="text-sm font-bold italic text-ink/80">{book}</p>
                            <p className="text-[10px] font-mono text-plum/60 tracking-widest uppercase font-bold">Canon Record</p>
                          </div>
                          <div className="flex gap-2">
                             <button 
                              onClick={(e) => { e.stopPropagation(); onToggleBookStatus(author.name, book, 'wishlist'); }} 
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${status.wishlist ? 'bg-rose text-parchment shadow-md' : 'bg-ink/5 text-ink/20 hover:text-ink/40'}`}
                             >
                               <svg className="w-4 h-4" fill={status.wishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                             </button>
                             <button 
                              onClick={(e) => { e.stopPropagation(); onToggleBookStatus(author.name, book, 'read'); }} 
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${status.read ? 'bg-emerald-500 text-parchment shadow-md' : 'bg-ink/5 text-ink/20 hover:text-ink/40'}`}
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                             </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>
          );
        }) : (
          <div className="text-center py-32 bg-mica-surface rounded-[3rem] border border-dashed border-ink/10 opacity-30">
            <p className="font-header text-3xl italic">
              {authorSearchTerm ? 'No scribes found matching your query.' : 'Archival records are currently vacant.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorsView;
