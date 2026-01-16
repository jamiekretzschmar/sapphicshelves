import React from 'react';
import { NavigationTab, Settings } from '../types'; 

interface LayoutProps {
  children: React.ReactNode;
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  theme: 'light' | 'dark' | 'sepia';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  settings: Settings;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  activeTasks: Set<string>;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
}) => {
  const isActive = (tab: NavigationTab) => activeTab === tab;

  return (
    <div className="android-device flex flex-col h-full bg-parchment text-ink relative overflow-hidden">
      
      {/* HEADER */}
      <div className="pt-12 px-6 pb-4 flex justify-between items-end bg-parchment/95 backdrop-blur-sm z-30 sticky top-0 border-b border-ink/5">
        <div onClick={() => onTabChange(NavigationTab.LIBRARY)}>
          <h2 className="font-header text-3xl italic text-ink/60">Sapphic</h2>
          <h1 className="font-header text-5xl font-bold text-ink leading-none">Shelves</h1>
        </div>
        <button 
          onClick={onToggleTheme}
          className="h-10 w-10 rounded-full bg-input-surface flex items-center justify-center text-xl shadow-sm border border-ink/10 active:scale-95 transition-transform"
        >
          {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🍂'}
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto relative scroll-container pb-32">
        {children}
      </div>

      {/* FLOATING ACTION BUTTON */}
      <button 
        className="absolute bottom-24 right-6 w-14 h-14 rounded-2xl bg-brand-cyan text-white shadow-xl shadow-brand-cyan/40 flex items-center justify-center z-40 active:scale-90 transition-transform"
        onClick={() => console.log('Open Add Menu')} 
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* BOTTOM NAVIGATION */}
      <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-parchment/90 backdrop-blur-md border-t border-ink/5 flex items-start justify-around pt-3 z-50">
        <NavButton icon={<BookIcon />} label="Library" active={isActive(NavigationTab.LIBRARY)} onClick={() => onTabChange(NavigationTab.LIBRARY)} />
        <NavButton icon={<UsersIcon />} label="Authors" active={isActive(NavigationTab.AUTHORS)} onClick={() => onTabChange(NavigationTab.AUTHORS)} />
        <NavButton icon={<GlobeIcon />} label="Lexicon" active={isActive(NavigationTab.LEXICON)} onClick={() => onTabChange(NavigationTab.LEXICON)} />
        <NavButton icon={<CogIcon />} label="Settings" active={isActive(NavigationTab.SETTINGS)} onClick={() => onTabChange(NavigationTab.SETTINGS)} />
      </div>
    </div>
  );
};

// Icons
const NavButton = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-brand-cyan' : 'text-ink/40'}`}>
    {icon} <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
  </button>
);
const BookIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const UsersIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const GlobeIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CogIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

