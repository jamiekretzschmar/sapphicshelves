import React, { useState, useMemo, useEffect } from 'react';
import { Book, TagState } from '../types';
import { geminiService } from '../services/gemini';
import { useHaptics } from '../hooks/useHaptics';

interface LexiconViewProps {
  books: Book[];
  lexiconFavorites: string[];
  onBookClick: (book: Book) => void;
  onUpdateBook: (book: Book) => void;
  onAcquireBook: (book: { title: string; author: string }) => void;
  onAddFavorite: (tag: string) => void;
  onRemoveFavorite: (tag: string) => void;
  canadianFocus: boolean;
  startTask: (label: string) => string;
  endTask: (id: string) => void;
}

const SUGGESTED_LEXICON = [
  'Slow Burn', 'Enemies to Lovers', 'Sword & Sorcery', 'Historical', 
  'Found Family', 'Cottagecore', 'Gothic', 'Butch/Femme', 'Academic', 
  'Small Town', 'Sci-Fi', 'Urban Fantasy', 'Trans Lead', 'BIPOC Lead',
  'Fake Dating', 'Second Chance', 'Forbidden Love', 'Sports Romance'
];

type LexiconTab = 'pool' | 'favorites';

const LexiconView: React.FC<LexiconViewProps> = ({ 
  books, 
  lexiconFavorites,
  onBookClick, 
  onAcquireBook, 
  onAddFavorite,
  onRemoveFavorite,
  startTask,
  endTask,
  onUpdateBook,
  canadianFocus
}) => {
  const haptics = useHaptics();
  const [activeTab, setActiveTab] = useState<LexiconTab>('pool');
  const [tagMap, setTagMap] = useState<Record<string, TagState>>({});
  const [shuffledPool, setShuffledPool] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [activeSearch, setActiveSearch] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Initial random shuffle
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

  const handleSuggest = async () => {
    if (isSuggesting) return;
    setIsSuggesting(true);
    haptics.trigger('heavy');
    const taskId = startTask('Consulting Lexicon');
    try {
      const suggestions = await geminiService.suggestLexiconTags(shuffledPool);
      if (suggestions && suggestions.length > 0) {
        setShuffledPool(prev => [...new Set([...suggestions, ...prev])].slice(0, 24));
      }
    } catch (e) {
      console.error("Suggestion failed", e);
    } finally {
      setIsSuggesting(false);
      endTask(taskId);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTag.trim()) {
      onAddFavorite(customTag.trim());
      setCustomTag('');
      haptics.trigger('medium');
    }
  };

  const handleSearchBooks = async () => {
    if (isSearching) return;
    
    const included = Object.keys(tagMap).filter(t => tagMap[t] === 'include');
    const excluded = Object.keys(tagMap).filter(t => tagMap[t] === 'exclude');
    
    if (included.length === 0) {
      alert("Please include at least one signifier to guide the search.");
      return;
    }

    setIsSearching(true);
    const taskId = startTask('Scouting Volumes');
    haptics.trigger('heavy');
    setRecommendations([]);
    
    try {
      const results = await geminiService.recommendBooksByTropes(included, excluded);
      setRecommendations(results);
    } catch (e) {
      console.error("Search failed", e);
      alert("The Curator is currently unreachable. Check your API key.");
    } finally {
      setIsSearching(false);
      endTask(taskId);
    }
  };

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
    }).slice(0, 12);
  }, [books, tagMap, activeSearch]);

  return (
    <div className="space-y-10 pb-32 px-4 animate-in fade-in duration-700">
      <header className="bg-mica-surface border border-ink/5 p-10 rounded-[3rem] shadow-sm">
        <h2 className="font-header text-5xl mb-3 italic text-brand-deep">The Lexicon</h2>
        <p className="text-xs text-ink/60 max-w-lg leading-relaxed italic">
          Map your monograph via binary signifiers. Inscribe tropes you desire, and redact those you wish to exclude.
        </p>
      </header>

      <section className="bg-mica-surface/50 border border-ink/5 p-6 rounded-[2.5rem] space-y-6 shadow-inner relative overflow-hidden">
        {/* Tab Switcher */}
        <div className="flex bg-ink/5 p-1 rounded-2xl w-full max-w-sm mx-auto mb-4">
            <button 
                onClick={() => setActiveTab('pool')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === 'pool' ? 'bg-ink text-parchment shadow-md' : 'text-ink/50'}`}
            >
                The Pool
            </button>
            <button 
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === 'favorites' ? 'bg-ink text-parchment shadow-md' : 'text-ink/50'}`}
            >
                Favorites
            </button>
        </div>

        <div className="flex justify-between items-center relative z-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-cyan">Active Signifiers</h3>
          
          {activeTab === 'pool' && (
              <div className="flex gap-4">
                <button 
                  onClick={handleSuggest}
                  disabled={isSuggesting}
                  className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-brand-cyan hover:text-brand-deep transition-all ${isSuggesting ? 'opacity-50' : ''}`}
                >
                  {isSuggesting ? 'Suggesting...' : 'Suggest Signifiers'}
                </button>
                <button 
                  onClick={handleShuffle}
                  className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-ink/40 hover:text-plum transition-all"
                >
                  Shuffle Pool
                </button>
              </div>
          )}
        </div>

        {/* Favorites Input */}
        {activeTab === 'favorites' && (
            <form onSubmit={handleAddCustomTag} className="relative z-10 flex gap-2 mb-4">
                <input 
                    type="text" 
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Inscribe custom signifier..."
                    className="flex-1 bg-parchment border border-ink/10 rounded-xl px-4 py-2 text-xs italic focus:outline-none focus:border-brand-cyan"
                />
                <button 
                    type="submit"
                    className="px-4 bg-ink text-parchment rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                    Add
                </button>
            </form>
        )}

        {/* Tag Cloud */}
        <div className="flex flex-wrap gap-2 relative z-10 min-h-[100px] content-start">
          {(activeTab === 'pool' ? shuffledPool : lexiconFavorites).map(tag => (
            <div key={tag} className="group relative">
                <button
                onClick={() => cycleTagState(tag)}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    tagMap[tag] === 'include' ? 'bg-brand-cyan text-white border-brand-cyan shadow-lg' :
                    tagMap[tag] === 'exclude' ? 'bg-plum text-white border-plum line-through' :
                    'bg-white text-ink/40 border-ink/5 hover:border-brand-cyan/20'
                }`}
                >
                {tag}
                </button>
                {activeTab === 'favorites' && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRemoveFavorite(tag); }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-rose text-white rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                        ✕
                    </button>
                )}
            </div>
          ))}
          {activeTab === 'favorites' && lexiconFavorites.length === 0 && (
              <div className="w-full text-center py-8 text-ink/20 text-xs italic">
                  No favorite signifiers inscribed.
              </div>
          )}
        </div>

        {/* Curator Action */}
        <div className="pt-6 border-t border-ink/5 flex justify-end">
            <button 
                onClick={handleSearchBooks}
                disabled={isSearching}
                className={`bg-brand-deep text-brand-cyan px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-ink transition-all shadow-lg flex items-center gap-2 ${isSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isSearching ? (
                  <span className="animate-pulse">Consulting Curator...</span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Consult Curator for New Volumes
                  </>
                )}
            </button>
        </div>
      </section>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
          <section className="space-y-4 animate-in slide-in-from-bottom-8 duration-700">
             <div className="flex items-center gap-3">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-deep">Curator's Selection</h3>
                 <div className="flex-1 h-px bg-brand-deep/10"></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {recommendations.map((rec, idx) => (
                     <div key={idx} className="bg-white border border-brand-cyan/20 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                         <div>
                             <h4 className="font-header text-xl italic text-brand-deep">{rec.title}</h4>
                             <p className="text-[10px] uppercase tracking-widest text-ink/50 mb-2">{rec.author}</p>
                             <p className="text-xs text-ink/70 italic leading-relaxed mb-3">{rec.synopsis}</p>
                             <div className="flex flex-wrap gap-1 mb-4">
                                 {rec.tropes?.map((t: string) => (
                                     <span key={t} className="text-[8px] px-2 py-0.5 bg-brand-cyan/5 text-brand-cyan rounded-full font-bold uppercase">{t}</span>
                                 ))}
                             </div>
                         </div>
                         <button 
                             onClick={() => onAcquireBook({ title: rec.title, author: rec.author })}
                             className="w-full py-2 bg-brand-cyan text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-brand-deep transition-colors"
                         >
                             Acquire Volume
                         </button>
                     </div>
                 ))}
             </div>
          </section>
      )}

      {/* Library Filter Section */}
      <div className="space-y-6">
        <div className="relative">
          <input 
            type="text"
            placeholder="Filter local library..."
            value={activeSearch}
            onChange={(e) => setActiveSearch(e.target.value)}
            className="w-full bg-mica-surface border border-ink/10 px-6 py-4 rounded-[2rem] text-sm italic shadow-inner outline-none focus:ring-2 focus:ring-brand-cyan/10 transition-all"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-ink/20 pointer-events-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredLibrary.map(book => (
            <div 
              key={book.id}
              onClick={() => onBookClick(book)}
              className="bg-mica-surface border border-ink/5 p-4 rounded-3xl flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div className="w-12 h-18 bg-ink/5 rounded-lg border border-ink/10 shrink-0 overflow-hidden relative shadow-sm">
                {book.coverUrl && <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} />}
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-deep/20 to-transparent pointer-events-none" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm italic group-hover:text-brand-cyan transition-colors truncate leading-tight">{book.title}</h4>
                <p className="text-[10px] text-ink/40 font-medium truncate">{book.author}</p>
              </div>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          ))}
          {filteredLibrary.length === 0 && (activeSearch || Object.keys(tagMap).length > 0) && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-ink/5 rounded-[2rem] opacity-30 italic text-xs">
              No matching volumes found in local archive.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LexiconView;
