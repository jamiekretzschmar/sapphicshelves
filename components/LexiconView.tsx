
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
  const [tagMap, setTagMap] = useState<Record<string, TagState>>({});
  const [shuffledPool, setShuffledPool] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [activeSearch, setActiveSearch] = useState('');
  const [isScouting, setIsScouting] = useState(false);
  const [scoutedBooks, setScoutedBooks] = useState<any[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

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

  const handleSuggest = async () => {
    setIsSuggesting(true);
    haptics.trigger('medium');
    try {
      const suggestions = await geminiService.suggestLexiconTags(shuffledPool);
      setShuffledPool(prev => [...new Set([...suggestions, ...prev])].slice(0, 24));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggesting(false);
    }
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
    <div className="space-y-10 pb-32 px-4">
      <header className="bg-mica-surface border border-ink/5 p-10 rounded-[3rem] shadow-sm">
        <h2 className="font-header text-5xl mb-3 italic text-brand-deep">The Lexicon</h2>
        <p className="text-xs text-ink/60 max-w-lg leading-relaxed italic">
          Map your monograph via binary signifiers. Inscribe tropes you desire, and redact those you wish to exclude.
        </p>
      </header>

      <section className="bg-mica-surface/50 border border-ink/5 p-8 rounded-[2.5rem] space-y-6 shadow-inner">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-cyan">Thematic Signifiers</h3>
          <div className="flex gap-4">
            <button 
              onClick={handleSuggest}
              disabled={isSuggesting}
              className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-brand-cyan hover:text-brand-deep transition-all"
            >
              {isSuggesting ? 'Analyzing...' : 'Suggest Signifiers'}
            </button>
            <button 
              onClick={handleShuffle}
              className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-ink/40 hover:text-plum transition-all"
            >
              Shuffle Pool
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {shuffledPool.map(tag => (
            <button
              key={tag}
              onClick={() => cycleTagState(tag)}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                tagMap[tag] === 'include' ? 'bg-brand-cyan text-white border-brand-cyan shadow-lg' :
                tagMap[tag] === 'exclude' ? 'bg-plum text-white border-plum line-through' :
                'bg-white text-ink/40 border-ink/5 hover:border-brand-cyan/20'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        <input 
          type="text"
          placeholder="Filter monograph by title or scribe..."
          value={activeSearch}
          onChange={(e) => setActiveSearch(e.target.value)}
          className="w-full bg-mica-surface border border-ink/10 px-6 py-4 rounded-[2rem] text-sm italic shadow-inner"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLibrary.map(book => (
            <div 
              key={book.id}
              onClick={() => onBookClick(book)}
              className="bg-mica-surface border border-ink/5 p-4 rounded-3xl flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div className="w-10 h-14 bg-ink/5 rounded-lg border border-ink/10 shrink-0 overflow-hidden relative">
                {book.coverUrl && <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} />}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm italic group-hover:text-brand-cyan transition-colors truncate">{book.title}</h4>
                <p className="text-[10px] text-ink/40">{book.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LexiconView;
