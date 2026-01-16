import React from 'react';

interface FilterRowProps {
  activeFilter: string;
  onSelect: (filter: string) => void;
}

const filters = ["All", "Romance", "Mystery", "Sci-Fi", "Poetry"];

export const FilterRow: React.FC<FilterRowProps> = ({ activeFilter, onSelect }) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onSelect(f)}
          className={`
            px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 border
            ${activeFilter === f 
              ? 'bg-brand-cyan text-white border-brand-cyan shadow-md' 
              : 'bg-input-surface text-ink/70 border-ink/5 hover:border-ink/20'
            }
          `}
        >
          {f}
        </button>
      ))}
    </div>
  );
};

