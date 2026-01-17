
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/gemini';
import { Book, ChatMessage } from '../types';
import { useHaptics } from '../hooks/useHaptics';

interface TheLibrarianProps {
  books: Book[];
  onClose: () => void;
}

const TheLibrarian: React.FC<TheLibrarianProps> = ({ books, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'assistant', content: 'The stacks are open. What do you seek?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const haptics = useHaptics();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    haptics.trigger('light');

    try {
      const response = await geminiService.askLibrarian(userMsg.content, books);
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: response };
      setMessages(prev => [...prev, botMsg]);
      haptics.trigger('medium');
    } catch (error) {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: "I seem to have misplaced my glasses. Ask again later." }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-[100] w-[90%] max-w-[350px] animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-mica-surface/95 backdrop-blur-xl border border-ink/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[500px]">
        {/* Header */}
        <div className="p-4 bg-brand-deep text-parchment flex justify-between items-center cursor-pointer" onClick={onClose}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-parchment rounded-full flex items-center justify-center text-brand-deep font-header italic text-lg">L</div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest">The Librarian</h3>
              <p className="text-[9px] opacity-70 italic">AI Curator • {books.length} Volumes</p>
            </div>
          </div>
          <button className="text-parchment/50 hover:text-parchment">✕</button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]" ref={scrollRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-ink text-parchment rounded-br-none' 
                    : 'bg-white border border-ink/5 text-ink rounded-bl-none shadow-sm italic'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isThinking && (
             <div className="flex justify-start">
               <div className="bg-white border border-ink/5 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1">
                 <span className="w-1.5 h-1.5 bg-ink/30 rounded-full animate-bounce" />
                 <span className="w-1.5 h-1.5 bg-ink/30 rounded-full animate-bounce delay-75" />
                 <span className="w-1.5 h-1.5 bg-ink/30 rounded-full animate-bounce delay-150" />
               </div>
             </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-ink/5 bg-white/50">
          <div className="relative">
            <input 
              className="w-full bg-white border border-ink/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-cyan/50"
              placeholder="Ask for recommendations..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isThinking}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isThinking}
              className="absolute right-2 top-2 p-1.5 bg-brand-cyan text-white rounded-lg disabled:opacity-50 hover:bg-brand-deep transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TheLibrarian;
