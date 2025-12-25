
import React, { useState, useMemo } from 'react';
import { AuthorPulse, AuthorRelease } from '../types';
import { geminiService } from '../services/gemini';

interface AuthorsViewProps {
  authorPulses: Record<string, AuthorPulse>;
  onUpdateAuthor: (name: string, data: Partial<AuthorPulse>) => void;
  onAddAuthor: (name: string) => void;
}

type FilterMode = 'all' | 'favorites' | 'batch';

const AuthorsView: React.FC<AuthorsViewProps> = ({ authorPulses, onUpdateAuthor, onAddAuthor }) => {
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingAuthors, setSyncingAuthors] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<{ current: number, total: number } | null>(null);
  const [newAuthorName, setNewAuthorName] = useState('');

  const authors = useMemo(() => Object.values(authorPulses), [authorPulses]);

  const filteredAuthors = useMemo(() => {
    if (filter === 'favorites') return authors.filter(a => a.isFavorite);
    return authors;
  }, [authors, filter]);

  const recentReleases = useMemo(() => {
    return authors.flatMap(a => (a.releases || []).map(r => ({ ...r, author: a.name })))
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
  }, [authors]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const toggleFavorite = (name: string, current: boolean) => {
    onUpdateAuthor(name, { isFavorite: !current });
  };

  const toggleSelection = (name: string) => {
    const next = new Set(selectedNames);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedNames(next);
  };

  const syncAuthor = async (name: string) => {
    setSyncingAuthors(prev => new Set(prev).add(name));
    try {
      const releases = await geminiService.checkAuthorReleases(name);
      onUpdateAuthor(name, { 
        releases, 
        lastChecked: new Date().toISOString() 
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingAuthors(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
  };

  const syncBatch = async () => {
    const targets = filter === 'batch' ? Array.from(selectedNames) : authors.map(a => a.name);
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

  const handleAdd = () => {
    if (!newAuthorName.trim()) return;
    onAddAuthor(newAuthorName.trim());
    setNewAuthorName('');
    setFilter('all');
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Alert Banner for Recent Updates */}
      {recentReleases.length > 0 && (
        <section className="bg-ink text-parchment p-6 rounded-3xl animate-in slide-in-from-top duration-700 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 blur-3xl -mr-10 -mt-10 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gold"></span>
              </span>
              <h2 className="font-header text-2xl italic">Intelligence Alerts</h2>
            </div>
            <div className="space-y-3">
              {recentReleases.slice(0, 3).map((alert, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-parchment/10 pb-2 last:border-0">
                  <div className="flex flex-col">
                    <span className="font-bold text-gold uppercase tracking-tighter">{alert.author}</span>
                    <span className="italic opacity-80">{alert.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {alert.isUpcoming ? (
                      <span className="text-[8px] px-2 py-0.5 bg-gold text-ink rounded-full font-bold uppercase tracking-tighter shadow-sm">Upcoming</span>
                    ) : (
                      <span className="text-[8px] px-2 py-0.5 bg-celeste/20 text-celeste rounded-full font-bold uppercase tracking-tighter">Recent</span>
                    )}
                    <span className="font-mono opacity-60 text-[9px]">{formatDate(alert.releaseDate).split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Control Plinth */}
      <section className="bg-mica-surface border border-ink/5 p-6 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-header text-3xl">The Favored</h2>
            <div className="flex bg-ink/5 p-1 rounded-xl">
              {(['all', 'favorites', 'batch'] as FilterMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setFilter(m); setSelectedNames(new Set()); }}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    filter === m ? 'bg-ink text-parchment' : 'text-ink/40 hover:text-ink/60'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
             <input 
              type="text" 
              placeholder="Name of scribe..."
              value={newAuthorName}
              onChange={e => setNewAuthorName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAdd()}
              className="flex-1 bg-ink/5 border border-ink/5 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-gold transition-colors italic font-light"
             />
             <button 
              onClick={handleAdd}
              className="px-6 py-2.5 bg-ink text-parchment rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gold transition-colors"
             >
               Inscribe
             </button>
          </div>
        </div>

        {(filter === 'batch' || (filter === 'all' && authors.length > 0)) && (
          <div className="space-y-4">
            <button 
              onClick={syncBatch}
              disabled={isSyncing || (filter === 'batch' && selectedNames.size === 0)}
              className="w-full py-3.5 bg-gold/10 border-2 border-gold/30 text-gold rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gold hover:text-parchment transition-all disabled:opacity-30 flex flex-col items-center justify-center gap-2"
            >
              {isSyncing ? (
                <span className="flex items-center gap-2">
                   <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   Syncing Selected Monograph...
                </span>
              ) : (
                `Synchronize ${filter === 'batch' ? selectedNames.size : 'All'} Records`
              )}
            </button>
            
            {batchProgress && (
              <div className="w-full space-y-1">
                <div className="flex justify-between text-[8px] uppercase font-bold tracking-widest text-gold opacity-80">
                  <span>Batch Progress</span>
                  <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-ink/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gold transition-all duration-500 ease-out" 
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Authors List */}
      <div className="space-y-4">
        {filteredAuthors.length > 0 ? filteredAuthors.map((author) => {
          const isIndividualSyncing = syncingAuthors.has(author.name);
          
          return (
            <div 
              key={author.name}
              className={`bg-mica-surface border p-6 rounded-3xl transition-all relative cursor-pointer ${
                filter === 'batch' 
                  ? selectedNames.has(author.name) 
                    ? 'border-gold ring-1 ring-gold/50 shadow-md translate-x-1' 
                    : 'border-ink/5 opacity-70' 
                  : 'border-ink/5 shadow-sm hover:shadow-md'
              }`}
              onClick={() => filter === 'batch' && toggleSelection(author.name)}
            >
              {filter === 'batch' && (
                <div className={`absolute top-4 left-4 w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center ${
                  selectedNames.has(author.name) ? 'bg-gold border-gold' : 'border-ink/20'
                }`}>
                  {selectedNames.has(author.name) && <span className="text-[10px] text-parchment">✓</span>}
                </div>
              )}

              <div className={`flex justify-between items-start ${filter === 'batch' ? 'pl-8' : ''}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-header text-3xl italic leading-tight">{author.name}</h3>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(author.name, !!author.isFavorite); }}
                      className={`transition-colors p-1 ${author.isFavorite ? 'text-gold' : 'text-ink/10 hover:text-ink/30'}`}
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                    </button>
                  </div>
                  
                  {/* Clearly indicated last sync date */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] uppercase tracking-widest text-gold font-bold">Last Synchronized:</span>
                    <span className="text-[9px] font-mono text-ink/60 font-bold bg-ink/5 px-2 py-0.5 rounded border border-ink/5">
                      {author.lastChecked ? formatDate(author.lastChecked) : 'Pending Archive Record'}
                    </span>
                  </div>
                </div>
                
                {filter !== 'batch' && (
                  <button 
                    disabled={isIndividualSyncing}
                    onClick={(e) => { e.stopPropagation(); syncAuthor(author.name); }}
                    className={`p-3 rounded-2xl transition-all shadow-sm ${
                      isIndividualSyncing 
                      ? 'bg-gold/10 text-gold animate-pulse' 
                      : 'bg-ink text-parchment hover:bg-gold hover:scale-110'
                    }`}
                    title="Manual Audit"
                  >
                    {isIndividualSyncing ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    )}
                  </button>
                )}
              </div>

              {author.releases && author.releases.length > 0 && (
                <div className={`mt-6 space-y-3 ${filter === 'batch' ? 'pl-8' : ''}`}>
                  {author.releases.map((rel, ridx) => (
                    <div key={ridx} className="flex justify-between items-center bg-gold/5 p-4 rounded-2xl border border-gold/10 group hover:bg-gold/10 transition-colors">
                      <div className="flex-1 pr-6">
                        <p className="text-xs font-bold italic text-ink/80">{rel.title}</p>
                        {rel.synopsis && <p className="text-[10px] text-ink/50 mt-1 line-clamp-1 italic">{rel.synopsis}</p>}
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-[10px] font-mono text-gold font-black">{formatDate(rel.releaseDate).split(' ')[0]}</p>
                        {rel.isUpcoming && <span className="text-[7px] bg-gold text-ink px-1.5 py-0.5 rounded-full font-black uppercase mt-1">Future Folio</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }) : (
          <div className="text-center py-20 bg-mica-surface rounded-3xl border border-dashed border-ink/10">
            <p className="font-header text-2xl italic opacity-30 italic">No records found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorsView;
