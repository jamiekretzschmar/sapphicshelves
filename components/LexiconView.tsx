
import React, { useState, useMemo, useEffect } from 'react';
import { Book, TagState } from '../types';
import { geminiService } from '../services/gemini';
import { useHaptics } from '../hooks/useHaptics';

interface LexiconViewProps {
  books: Book[];
  onBookClick: (book: Book) => void;
  onUpdateBook: (book: Book) => void;
  onAcquireBook: (book: { title: string; author: string }) => void;
  canadianFocus: boolean;
}

const SUGGESTED_LEXICON = [
  'Slow Burn', 'Enemies to Lovers', 'Sword & Sorcery', 'Historical', 
  'Found Family', 'Cottagecore', 'Gothic', 'Butch/Femme', 'Academic', 
  'Small Town', 'Sci-Fi', 'Urban Fantasy', 'Trans Lead', 'BIPOC Lead',
  'Fake Dating', 'Second Chance', 'Forbidden Love', 'Sports Romance'
];

const LexiconView: React.FC<LexiconViewProps> = ({ books, onBookClick, onAcquireBook, canadianFocus }) => {
  const haptics = useHaptics();
  
  // State: The Core Lexicon Pool
  const [tagMap, setTagMap] = useState<Record<string, TagState>>({});
  const [shuffledPool, setShuffledPool] = useState<string[]>([]);
  
  // State: Discovery & Search
  const [activeSearch, setActiveSearch] = useState('');
  const [isScouting, setIsScouting] = useState(false);
  const [scoutedBooks, setScoutedBooks] = useState<any[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Initialization: Populate Pool
  useEffect(() => {
    const history = new Set<string>();
    books.forEach(b => b.tropes?.forEach(t => history.add(t)));
    const combined = Array.from(new Set([...SUGGESTED_LEXICON, ...Array.from(history)]));
    setShuffledPool([...combined].sort(() => Math.random() - 0.5).slice(0, 18));
  }, [books]);

  const cycleTagState = (tag: string) => {
    haptics.trigger('light');
    setTagMap(prev => {
      const current = prev[tag] || 'neutral';
      let next: TagState = 'include';
      if (current === 'include') next = 'exclude';
      else if (current === 'exclude') next = 'neutral';
      
      const nextState = { ...prev };
      if (next === 'neutral') delete nextState[tag];
      else nextState[tag] = next;
      
      return nextState;
    });
  };

  const handleShuffle = () => {
    haptics.trigger('medium');
    const history = new Set<string>();
    books.forEach(b => b.tropes?.forEach(t => history.add(t)));
    const allTags = Array.from(new Set([...SUGGESTED_LEXICON, ...Array.from(history)]));
    
    const activeTags = Object.keys(tagMap);
    const idleTags = allTags.filter(t => !activeTags.includes(t));
    const newIdle = [...idleTags].sort(() => Math.random() - 0.5).slice(0, 18 - activeTags.length);
    setShuffledPool([...activeTags, ...newIdle]);
  };

  const handleScoutArchive = async () => {
    const included = Object.keys(tagMap).filter(t => tagMap[t] === 'include');
    if (included.length === 0) return;

    setIsScouting(true);
    haptics.trigger('heavy');
    try {
      const results = await geminiService.discoverBooks(included, { canadianFocus });
      setScoutedBooks(results);
    } catch (e) {
      console.error("Scout failed", e);
    } finally {
      setIsScouting(false);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim();
    cycleTagState(tag);
    if (!shuffledPool.includes(tag)) {
      setShuffledPool(prev => [tag, ...prev]);
    }
    setNewTagInput('');
  };

  // Zero-Failure Local Retrieval Logic
  const filteredLibrary = useMemo(() => {
    const included = Object.keys(tagMap).filter(t => tagMap[t] === 'include');
    const excluded = Object.keys(tagMap).filter(t => tagMap[t] === 'exclude');
    
    if (included.length === 0 && excluded.length === 0 && !activeSearch) return [];
    
    return books.filter(book => {
      const bookTropes = book.tropes || [];
      const matchesSearch = activeSearch 
        ? book.title.toLowerCase().includes(activeSearch.toLowerCase()) || 
          book.author.toLowerCase().includes(activeSearch.toLowerCase())
        : true;
      const matchesInscribed = included.every(tag => bookTropes.includes(tag));
      const matchesRedacted = !excluded.some(tag => bookTropes.includes(tag));
      return matchesSearch && matchesInscribed && matchesRedacted;
    }).slice(0, 10);
  }, [books, tagMap, activeSearch]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32">
      <header className="bg-mica-surface border border-ink/5 p-10 rounded-[3rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-plum/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        <h2 className="font-header text-5xl mb-3 foil-stamping italic">The Lexicon</h2>
        <p className="text-sm text-ink/60 max-w-lg leading-relaxed italic">
          Map your monograph via binary signifiers. Inscribe tropes you desire, and redact those you wish to exclude from archival memory.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          
          {/* Tag Engine Section */}
          <section className="bg-mica-surface/50 border border-ink/5 p-8 rounded-[2.5rem] space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-plum flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-plum"></span>
                Active Signifiers
              </h3>
              <button 
                onClick={handleShuffle}
                className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-ink/40 hover:text-plum transition-all"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Shuffle Pool
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {shuffledPool.map(tag => (
                <button
                  key={tag}
                  onClick={() => cycleTagState(tag)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border ${
                    tagMap[tag] === 'include' ? 'bg-plum text-parchment border-plum shadow-md' :
                    tagMap[tag] === 'exclude' ? 'bg-rose text-parchment border-rose line-through' :
                    'bg-mica-surface text-ink/40 border-ink/5 hover:border-plum/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {tagMap[tag] === 'include' && <span className="w-1 h-1 rounded-full bg-parchment animate-pulse" />}
                    {tag}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4 flex gap-6 border-t border-ink/5">
               <div className="flex items-center gap-2 text-[8px] font-black uppercase text-ink/30">
                 <div className="w-1.5 h-1.5 rounded-full bg-plum" />
                 Include
               </div>
               <div className="flex items-center gap-2 text-[8px] font-black uppercase text-ink/30">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose" />
                 Exclude
               </div>
               <div className="flex items-center gap-2 text-[8px] font-black uppercase text-ink/30">
                 <div className="w-1.5 h-1.5 rounded-full bg-ink/10" />
                 Idle
               </div>
            </div>
          </section>

          {/* Local Library Retrievals */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-ink/5 pb-4">
              <h3 className="font-header text-3xl italic">Library Retrievals</h3>
              <span className="text-[10px] font-mono text-ink/30 uppercase tracking-widest">{filteredLibrary.length} Active Vol.</span>
            </div>

            <div className="relative group">
              <input 
                type="text"
                placeholder="Specific retrieval by title or scribe..."
                value={activeSearch}
                onChange={(e) => setActiveSearch(e.target.value)}
                className="w-full bg-ink/5 border border-ink/10 px-6 py-4 rounded-[2rem] text-sm italic focus:outline-none focus:ring-2 focus:ring-plum/20 transition-all"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-ink/20 group-focus-within:text-plum">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLibrary.length > 0 ? filteredLibrary.map(book => (
                <div 
                  key={book.id}
                  onClick={() => onBookClick(book)}
                  className="bg-mica-surface border border-ink/5 p-4 rounded-3xl flex items-center gap-4 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-14 bg-ink/5 rounded-lg border border-ink/10 shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                    {book.coverUrl && <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm italic group-hover:text-plum transition-colors line-clamp-1">{book.title}</h4>
                    <p className="text-[10px] text-ink/40 truncate">{book.author}</p>
                  </div>
                </div>
              )) : (
                <div className="md:col-span-2 text-center py-20 border-2 border-dashed border-ink/5 rounded-[3rem] opacity-30">
                  <p className="font-header text-xl italic">Define signifiers to retrieve matching library volumes.</p>
                </div>
              )}
            </div>
          </section>

          {/* Discovery Bridge Section */}
          {(Object.keys(tagMap).some(k => tagMap[k] === 'include') || scoutedBooks.length > 0) && (
            <section className="space-y-6 pt-10 border-t border-ink/5">
              <div className="flex items-center justify-between border-b border-ink/5 pb-4">
                <h3 className="font-header text-3xl italic text-gold">Scouted Acquisitions</h3>
                <button 
                  onClick={handleScoutArchive}
                  disabled={isScouting}
                  className={`text-[9px] font-black uppercase tracking-widest text-gold hover:text-plum transition-all flex items-center gap-2 ${isScouting ? 'animate-pulse' : ''}`}
                >
                  <svg className={`w-3 h-3 ${isScouting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  {isScouting ? 'Consulting Grand Archive...' : 'Scout External Volumes'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scoutedBooks.length > 0 ? scoutedBooks.map((rec, i) => (
                  <div key={i} className="bg-mica-surface border border-gold/10 p-5 rounded-3xl shadow-sm hover:shadow-xl transition-all flex flex-col group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-gold/5 -mr-4 -mt-4 rounded-full blur-xl" />
                    <div className="flex-1 space-y-1 mb-4">
                      <span className="text-[7px] font-black bg-gold/10 text-gold px-2 py-0.5 rounded-full uppercase tracking-widest">Grand Archive</span>
                      <h4 className="font-header text-xl font-bold leading-tight group-hover:text-gold transition-colors">{rec.title}</h4>
                      <p className="text-[10px] text-ink/40 italic">by {rec.author}</p>
                      <p className="text-[10px] text-ink/60 mt-2 italic leading-relaxed line-clamp-2">"{rec.reason}"</p>
                    </div>
                    <button 
                      onClick={() => onAcquireBook({ title: rec.title, author: rec.author })}
                      className="w-full py-2 bg-gold text-parchment text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-ink transition-all shadow-md active:scale-95"
                    >
                      Inscribe Volume
                    </button>
                  </div>
                )) : !isScouting && (
                   <div className="md:col-span-3 text-center py-12 opacity-30 italic text-sm">
                     The Discovery engine is primed. Tap Scout to consult the external monograph.
                   </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Signifier Management */}
        <aside className="space-y-10">
          <section className="bg-ink text-parchment p-8 rounded-[2.5rem] shadow-xl space-y-6">
            <h3 className="font-header text-2xl italic text-rose">Custom Inscriptions</h3>
            <p className="text-[10px] leading-relaxed opacity-60 uppercase tracking-widest font-black">Add bespoke thematic signifiers to your archival pool.</p>
            
            <form onSubmit={handleAddCustomTag} className="space-y-4">
              <input 
                type="text"
                placeholder="Inscribe Signifier..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                className="w-full bg-parchment/10 border border-parchment/10 rounded-xl px-4 py-3 text-xs italic focus:outline-none focus:border-rose/50 text-parchment placeholder:text-parchment/30"
              />
              <button type="submit" className="w-full py-3 bg-rose text-parchment rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-plum transition-all active:scale-95">
                Commit to Lexicon
              </button>
            </form>

            <div className="pt-6 border-t border-parchment/10 space-y-4">
              <h4 className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Selected Gatekeepers</h4>
              <div className="space-y-2">
                {Object.entries(tagMap).map(([tag, state]) => (
                  <div key={tag} className={`flex items-center justify-between px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${
                    state === 'include' ? 'bg-plum/20 border-plum/30 text-plum' : 
                    state === 'exclude' ? 'bg-rose/20 border-rose/30 text-rose' : 'hidden'
                  }`}>
                    <span>{state === 'exclude' && 'Redacted: '}{tag}</span>
                    <button onClick={() => cycleTagState(tag)} className="hover:opacity-100 opacity-40">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-plum/5 border border-plum/10 p-8 rounded-[2.5rem] text-center space-y-3">
            <p className="text-[10px] italic text-plum font-header text-lg leading-snug">"Your Lexicon is the spiritual index of your monograph."</p>
            <div className="flex justify-center gap-1.5 pt-2">
               {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-plum/20" />)}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default LexiconView;
