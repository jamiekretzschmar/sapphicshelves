
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
  onDeleteAuthor: (name: string) => void;
  libraryBooks: Book[];
}

const AuthorsView: React.FC<AuthorsViewProps> = ({ 
  authorPulses, 
  bookStatuses = {}, // Default fallback
  authorFilter,
  authorSearchTerm = '',
  onUpdateAuthor, 
  onToggleBookStatus,
  onSetAuthorFilter,
  onSetAuthorSearchTerm,
  onAddAuthor,
  onDeleteAuthor,
  libraryBooks
}) => {
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingAuthors, setSyncingAuthors] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<{ current: number, total: number } | null>(null);
  const [newAuthorName, setNewAuthorName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedBios, setExpandedBios] = useState<Set<string>>(new Set());
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const [sortOrder, setSortOrder] = useState<'updated' | 'alpha'>('updated');
  const [showFreshOnly, setShowFreshOnly] = useState(false);

  const authors = useMemo(() => Object.values(authorPulses) as AuthorPulse[], [authorPulses]);

  // Handle outside click to close menus
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenu && !(event.target as Element).closest('.author-menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

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

    if (showFreshOnly) {
      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      
      result = result.filter(a => a.releases?.some(r => {
        const d = new Date(r.releaseDate);
        return d > oneMonthAgo || r.isUpcoming;
      }));
    }

    result = [...result].sort((a, b) => {
      if (sortOrder === 'alpha') {
        return a.name.localeCompare(b.name);
      } else {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        const dateA = a.lastChecked ? new Date(a.lastChecked).getTime() : 0;
        const dateB = b.lastChecked ? new Date(b.lastChecked).getTime() : 0;
        return dateB - dateA;
      }
    });

    return result;
  }, [authors, authorFilter, authorSearchTerm, sortOrder, showFreshOnly]);

  const recentReleases = useMemo(() => {
    return authors.flatMap(a => (a.releases || []).map(r => ({ ...r, author: a.name })))
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
  }, [authors]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
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

  const toggleBio = (name: string) => {
    setExpandedBios(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const handleDelete = (name: string) => {
      if(confirm(`Are you sure you want to stop tracking ${name}? This will remove their pulse history.`)) {
          onDeleteAuthor(name);
      }
      setActiveMenu(null);
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

      {/* Fresh Intelligence Banner */}

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
          <div className="flex flex-col md:flex-row gap-2">
             <div className="relative group flex-1">
              <input 
                type="text"
                placeholder="Search..."
                value={authorSearchTerm}
                onChange={(e) => onSetAuthorSearchTerm(e.target.value)}
                className="w-full bg-ink/5 border border-ink/5 px-5 py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose/20 transition-all italic pr-12 font-light"
              />
              {authorSearchTerm ? (
                <button 
                  onClick={() => onSetAuthorSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/30 hover:text-rose transition-colors"
                >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              ) : (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/20 group-focus-within:text-rose transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
               <button 
                 onClick={() => setSortOrder(prev => prev === 'alpha' ? 'updated' : 'alpha')}
                 className="px-4 bg-ink/5 rounded-2xl text-[9px] font-bold uppercase tracking-widest text-ink/60 hover:bg-ink/10 transition-colors whitespace-nowrap"
               >
                 Sort: {sortOrder === 'alpha' ? 'A-Z' : 'Latest'}
               </button>
               
               <button 
                 onClick={() => setShowFreshOnly(!showFreshOnly)}
                 className={`px-4 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
                   showFreshOnly ? 'bg-gold text-parchment' : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
                 }`}
               >
                 Fresh Only
               </button>
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
              className={`bg-mica-surface border p-8 rounded-[2.5rem] transition-all relative cursor-pointer ${
                authorFilter === 'batch' && selectedNames.has(author.name) ? 'border-rose ring-4 ring-rose/5 translate-x-1' : 'border-ink/5 shadow-sm hover:shadow-xl'
              }`}
              onClick={() => {
                if (authorFilter === 'batch') {
                   setSelectedNames(prev => {
                    const n = new Set(prev);
                    if (n.has(author.name)) n.delete(author.name); else n.add(author.name);
                    return n;
                   });
                } else {
                   toggleBio(author.name);
                }
              }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2 flex-1 pr-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-header text-4xl italic leading-none">{author.name}</h3>
                    
                    {/* Quick Options Menu */}
                    <div className="relative author-menu-container">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === author.name ? null : author.name); }}
                            className="p-1 rounded-full text-ink/20 hover:bg-ink/5 hover:text-ink transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="12" r="2"/></svg>
                        </button>
                        
                        {activeMenu === author.name && (
                            <div className="absolute left-0 top-full mt-2 w-48 bg-parchment border border-ink/10 rounded-xl shadow-xl z-20 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col py-1">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onUpdateAuthor(author.name, { isFavorite: !author.isFavorite }); setActiveMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-xs hover:bg-ink/5 flex items-center gap-2 text-ink"
                                >
                                    <span className={author.isFavorite ? 'text-rose' : 'text-ink/40'}>♥</span>
                                    {author.isFavorite ? 'Unfavorite' : 'Add to Favorites'}
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); syncAuthor(author.name); setActiveMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-xs hover:bg-ink/5 flex items-center gap-2 text-ink"
                                >
                                    <span>↻</span> Force Sync
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(author.name); }}
                                    className="w-full text-left px-4 py-2 text-xs hover:bg-rose/10 text-rose flex items-center gap-2 font-bold"
                                >
                                    <span>✕</span> Untrack Scribe
                                </button>
                            </div>
                        )}
                    </div>
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
                    <p className={`text-base leading-7 text-ink/90 transition-all ${isBioExpanded ? '' : 'line-clamp-4'}`}>
                      {author.biography}
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleBio(author.name); }}
                      className="mt-3 text-[9px] font-bold uppercase tracking-widest text-ink/40 hover:text-brand-cyan transition-colors"
                    >
                      {isBioExpanded ? 'Fold Abstract' : 'Expand Abstract'}
                    </button>
                  </div>
                </div>
              )}

              {/* Author Releases */}
              {author.releases && author.releases.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-ink/30 border-b border-ink/5 pb-2">Recent & Upcoming Inscriptions</h4>
                  <div className="grid gap-3">
                    {author.releases.slice(0, 3).map((release, i) => (
                      <div key={i} className="bg-ink/5 p-4 rounded-xl flex justify-between items-center group/release hover:bg-ink hover:text-parchment transition-all">
                        <div>
                          <p className="font-header italic text-lg">{release.title}</p>
                          <p className="text-[10px] uppercase tracking-widest opacity-60">{formatDate(release.releaseDate)}</p>
                        </div>
                        {release.isUpcoming && (
                          <span className="px-3 py-1 bg-brand-cyan text-white text-[9px] font-black uppercase tracking-widest rounded-full">Upcoming</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        }) : (
            <div className="py-20 text-center flex flex-col items-center opacity-50">
                <span className="text-4xl mb-2">🪶</span>
                <p className="text-xs font-bold uppercase tracking-widest text-ink/60">No scribes found.</p>
                <button onClick={() => { onSetAuthorFilter('all'); onSetAuthorSearchTerm(''); }} className="mt-4 text-xs text-brand-cyan underline">Reset Filters</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AuthorsView;
