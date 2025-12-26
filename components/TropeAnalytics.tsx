
import React, { useMemo, useState } from 'react';
import { Book } from '../types';

interface TropeAnalyticsProps {
  books: Book[];
}

const TropeAnalytics: React.FC<TropeAnalyticsProps> = ({ books }) => {
  const [isReportOpen, setIsReportOpen] = useState(false);

  const analytics = useMemo(() => {
    const counts: Record<string, number> = {};
    const tropeToBooks: Record<string, string[]> = {};

    books.forEach(book => {
      book.tropes?.forEach(trope => {
        counts[trope] = (counts[trope] || 0) + 1;
        if (!tropeToBooks[trope]) {
          tropeToBooks[trope] = [];
        }
        if (!tropeToBooks[trope].includes(book.title)) {
          tropeToBooks[trope].push(book.title);
        }
      });
    });

    const top5 = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([trope, count]) => ({
        trope,
        count,
        books: tropeToBooks[trope]
      }));

    return {
      top5,
      fullJson: JSON.stringify(
        top5.reduce((acc, item) => ({
          ...acc,
          [item.trope]: {
            frequency: item.count,
            volumes: item.books
          }
        }), {}),
        null,
        2
      )
    };
  }, [books]);

  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(analytics.fullJson);
    // Note: Toast feedback is handled by parent if needed, 
    // but we can assume success for this utility.
  };

  if (books.length === 0) return null;

  return (
    <section className="bg-mica-surface border border-ink/5 p-6 rounded-3xl space-y-4 shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-header text-xl italic">Thematic Distribution</h3>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-ink/30">Top 5 Archival Tropes</p>
        </div>
        <button 
          onClick={() => setIsReportOpen(!isReportOpen)}
          className="text-[9px] font-bold uppercase tracking-widest text-plum hover:text-rose transition-colors px-3 py-1 border border-plum/20 rounded-lg"
        >
          {isReportOpen ? 'Close Digest' : 'View Digest'}
        </button>
      </div>

      <div className="space-y-4">
        {analytics.top5.map(({ trope, count, books: tropeBooks }) => (
          <div key={trope} className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-ink/60">
              <span className="flex items-center gap-2">
                {trope}
                <span className="text-[8px] bg-plum/5 px-1.5 py-0.5 rounded text-plum/40">{count}</span>
              </span>
              <span className="text-plum opacity-40 italic">{Math.round((count / books.length) * 100)}% of Archive</span>
            </div>
            <div className="w-full h-1 bg-ink/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-plum to-rose transition-all duration-1000 ease-out"
                style={{ width: `${(count / books.length) * 100}%` }}
              />
            </div>
            
            {isReportOpen && (
              <ul className="pl-4 border-l border-plum/10 space-y-1 animate-in slide-in-from-left duration-300">
                {tropeBooks.map(title => (
                  <li key={title} className="text-[10px] italic text-ink/50 list-disc list-inside">
                    {title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {isReportOpen && (
        <div className="pt-4 mt-2 border-t border-ink/5 flex justify-end">
          <button 
            onClick={copyJsonToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-plum text-parchment rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose transition-all shadow-md active:scale-95"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Protocol JSON
          </button>
        </div>
      )}
    </section>
  );
};

export default TropeAnalytics;
