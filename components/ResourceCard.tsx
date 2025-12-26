
import React, { useState } from 'react';
// Fix: Import Opportunity instead of missing ISearchableResource and ResourceType
import { Opportunity } from '../types';

interface ResourceCardProps {
  resource: Opportunity;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const [revealed, setRevealed] = useState(false);

  // Note: Opportunity interface in types.ts does not currently include an expirationDate.
  // We keep this helper for future protocol expansion but initialize daysRemaining as null.
  const getDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = null; 

  // Abstract Factory Logic: Switching render based on Polymorphic Type from Opportunity interface
  const renderAcquisitionData = () => {
    if (!revealed) {
      return (
        <button 
          onClick={() => setRevealed(true)}
          className="w-full py-2 bg-ink text-parchment text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gold transition-colors"
        >
          Secure Access
        </button>
      );
    }

    // Fix: Use resource.category and string literals as defined in OpportunityType
    switch (resource.category) {
      case 'Contest':
        return (
          <a href={resource.source_link} target="_blank" rel="noopener" className="block text-center py-2 bg-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90">
            Enter Arena
          </a>
        );
      case 'Arc':
        return (
          <a href={resource.source_link} target="_blank" rel="noopener" className="block text-center py-2 bg-gold text-parchment text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90">
            Request ARC
          </a>
        );
      case 'Free Book':
        return (
          <a href={resource.source_link} target="_blank" rel="noopener" className="block text-center py-2 border-2 border-ink text-ink text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-ink hover:text-parchment">
            Acquire Folio
          </a>
        );
      default:
        return (
          <a href={resource.source_link} target="_blank" rel="noopener" className="block text-center py-2 bg-ink/10 text-ink text-[10px] font-black uppercase tracking-widest rounded-xl">
            Visit Source
          </a>
        );
    }
  };

  return (
    <div className="bg-mica-surface border border-ink/5 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        {/* Fix: Use resource.category for thematic color mapping */}
        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
          resource.category === 'Arc' ? 'bg-gold/20 text-gold' :
          resource.category === 'Contest' ? 'bg-emerald-500/20 text-emerald-600' :
          'bg-plum/10 text-plum'
        }`}>
          {resource.category}
        </span>
      </div>

      <div className="flex-1 mb-4">
        <h4 className="font-header text-xl font-bold leading-tight line-clamp-2">{resource.title}</h4>
        <p className="text-[10px] text-ink/40 italic mb-2">by {resource.author}</p>
        <p className="text-xs text-ink/60 line-clamp-3 mb-3">{resource.description}</p>
        
        {/* Note: tags property removed as it is not present in the Opportunity interface */}
      </div>

      <div className="pt-4 border-t border-ink/5 space-y-3">
        {daysRemaining !== null && (
          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
            <span className="text-ink/30">Expiry Protocol</span>
            <span className={daysRemaining < 7 ? 'text-red-500' : 'text-gold'}>
              {daysRemaining} Days Remaining
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-[9px] font-mono text-ink/30 uppercase">
          <span>Logged</span>
          <span>{new Date(resource.timestamp).toLocaleDateString()}</span>
        </div>
        
        {renderAcquisitionData()}
      </div>
    </div>
  );
};

export default ResourceCard;
