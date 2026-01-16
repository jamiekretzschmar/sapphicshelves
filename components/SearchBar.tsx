import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative w-full mb-6 z-10">
      {/* Decorative Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-ink opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* The Input Field with your new color class */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full 
          pl-11 pr-4 py-3.5 
          rounded-2xl 
          bg-input-surface 
          text-ink 
          placeholder-ink/40 
          border border-ink/5 
          focus:outline-none 
          focus:ring-2 focus:ring-brand-cyan/50
          transition-all duration-300
          shadow-sm
        "
        placeholder="Search titles..."
      />
    </div>
  );
};

