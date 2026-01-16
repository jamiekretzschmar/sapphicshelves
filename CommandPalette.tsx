import React, { useState, useEffect, useRef } from 'react';
import { NavigationTab, Book } from './types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
  books: Book[];
  authorPulses: Record<string, boolean>;
  syncingAuthors: Set<string>;
  onSyncAuthor: (author: string) => void;
  onSelectBook: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  books,
  authorPulses,
  syncingAuthors,
  onSyncAuthor,
  onSelectBook,
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter books locally for the palette based on internal input
  // (We prioritize the internal input if typed, otherwise show passed books)
  const displayBooks = input.trim() 
    ? books.filter(b => b.title.toLowerCase().includes(input.toLowerCase()))
    : books;

  const commands = [
    { label: 'Go to Library', action: () => onNavigate(NavigationTab.LIBRARY), icon: '📚' },
    { label: 'Go to Authors', action: () => onNavigate(NavigationTab.AUTHORS), icon: '👥' },
    { label: 'Go to Settings', action: () => onNavigate(NavigationTab.SETTINGS), icon: '⚙️' },
  ];

  const filteredCommands = commands.filter(c => 
    c.label.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Palette Box */}
      <div className="relative w-full max-w-xl bg-parchment rounded-xl shadow-2xl border border-ink/10 overflow-hidden flex flex-col max-h-[60vh] animate-fade-in">
        
        {/* Input */}
        <div className="p-4 border-b border-ink/5 flex items-center gap-3">
          <svg className="w-5 h-5 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-lg text-ink placeholder-ink/30 focus:outline-none"
            placeholder="Type a command or search..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          />
          <div className="px-2 py-1 rounded bg-ink/5 text-xs text-ink/40 font-mono">ESC</div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2">
          
          {/* Navigation Commands */}
          {filteredCommands.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-bold text-ink/30 uppercase tracking-wider px-3 py-2">Commands</div>
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => { cmd.action(); onClose(); }}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-ink/5 flex items-center gap-3 text-ink transition-colors"
                >
                  <span className="text-lg">{cmd.icon}</span>
                  <span className="font-medium">{cmd.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Book Results */}
          <div className="text-xs font-bold text-ink/30 uppercase tracking-wider px-3 py-2">Books</div>
          {displayBooks.length === 0 ? (
            <div className="px-3 py-4 text-ink/40 italic text-sm">No books found matching "{input}"</div>
          ) : (
            displayBooks.map((book) => (
              <button
                key={book.id}
                onClick={() => onSelectBook(book.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-ink/5 flex items-center gap-3 text-ink group transition-colors"
              >
                <div className="w-8 h-10 bg-brand-deep/10 rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{book.title}</div>
                  <div className="text-xs text-ink/50 truncate">{book.author}</div>
                </div>
              </button>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="p-2 bg-ink/5 text-[10px] text-ink/40 text-center border-t border-ink/5">
          Press <span className="font-bold">↑↓</span> to navigate • <span className="font-bold">↵</span> to select
        </div>
      </div>
    </div>
  );
};

