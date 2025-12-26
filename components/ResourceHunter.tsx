
import React, { useState, useEffect, useCallback } from 'react';
import { Opportunity } from '../types';
import { resourceHunterService } from '../services/resourceService';
import { useHaptics } from '../hooks/useHaptics';
import ResourceCard from './ResourceCard';

/**
 * MODULE: Opportunity Scout Module (OSM-V1.0)
 * ROLE: System Interface
 */

const BATCH_LIMIT = 5;

export default function ResourceHunter() {
  const haptics = useHaptics();
  
  // Pagination State Machine
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [offset, setOffset] = useState(0);
  const [isScouting, setIsScouting] = useState(false);
  const [endOfResults, setEndOfResults] = useState(false);
  const [query, setQuery] = useState('Sapphic');

  const executeScout = useCallback(async (isLoadMore: boolean = false) => {
    setIsScouting(true);
    haptics.trigger('heavy');
    
    try {
      const currentOffset = isLoadMore ? offset + BATCH_LIMIT : 0;
      const batch = await resourceHunterService.discoverResources({ 
        query, 
        offset: currentOffset,
        limit: BATCH_LIMIT 
      });

      if (isLoadMore) {
        setOpportunities(prev => [...prev, ...batch]);
        setOffset(currentOffset);
      } else {
        setOpportunities(batch);
        setOffset(0);
      }

      if (batch.length < BATCH_LIMIT) {
        setEndOfResults(true);
      } else {
        setEndOfResults(false);
      }
    } catch (e) {
      console.error("OSM-V1.0 System Error:", e);
    } finally {
      setIsScouting(false);
    }
  }, [query, offset, haptics]);

  useEffect(() => {
    executeScout();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeScout(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-32">
      <header className="bg-mica-surface border border-ink/5 p-12 rounded-[3.5rem] shadow-sm relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-plum/5" />
        <h2 className="font-header text-6xl mb-4 foil-stamping italic">The Engine</h2>
        <p className="text-sm text-ink/60 max-w-lg mx-auto leading-relaxed italic">
          Initiate Opportunity Discovery Protocol. Real-time aggregation of ARCs, Contests, and Free Editions within the sapphic literary landscape.
        </p>
      </header>

      <section className="max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for more opportunities..."
            className="w-full bg-mica-surface border border-ink/10 px-8 py-5 rounded-[2.5rem] text-sm italic focus:outline-none focus:ring-4 focus:ring-brand-cyan/5 transition-all shadow-inner"
          />
          <button 
            type="submit"
            disabled={isScouting}
            className="absolute right-3 top-2 bottom-2 px-8 bg-brand-deep text-brand-cyan rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-ink transition-all disabled:opacity-30"
          >
            {isScouting ? 'Scouting...' : 'Query'}
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {opportunities.map((opp, idx) => (
          <ResourceCard key={`${opp.id}-${idx}`} resource={opp} />
        ))}
        
        {opportunities.length === 0 && !isScouting && (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-ink/10 rounded-[3rem] opacity-30 italic">
            No relevant opportunities found at this time.
          </div>
        )}
      </div>

      {!endOfResults && opportunities.length > 0 && (
        <div className="flex flex-col items-center gap-6 pt-12">
          <button 
            onClick={() => executeScout(true)}
            disabled={isScouting}
            className="group flex flex-col items-center gap-3 transition-transform hover:scale-105"
          >
            <div className={`p-8 rounded-full bg-brand-deep text-brand-cyan shadow-2xl transition-all group-hover:bg-ink ${isScouting ? 'animate-pulse' : ''}`}>
              <svg className={`w-8 h-8 ${isScouting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-ink/30">Load More Context</span>
          </button>
        </div>
      )}
    </div>
  );
}
