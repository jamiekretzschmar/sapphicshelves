
import React from 'react';
import { ICONS } from '../constants';
import { NavigationTab, Theme } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  archivistIcon?: string;
  theme: Theme;
  onToggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, archivistIcon, theme, onToggleTheme }) => {
  return (
    <div className={`flex dvh-screen ${theme === 'dark' ? 'bg-zinc-900 text-zinc-100' : theme === 'sepia' ? 'bg-[#f4ecd8] text-[#5b4636]' : 'bg-parchment text-ink'} selection:bg-celeste overflow-hidden transition-colors duration-500`}>
      
      {/* Desktop Navigation Rail */}
      <aside className="hidden md:flex flex-col w-20 border-r border-ink/5 bg-mica-surface items-center py-8 space-y-8 z-50">
        <div className="mb-4">
           {archivistIcon ? <img src={archivistIcon} className="w-10 h-10 rounded-full border border-gold/30" /> : <div className="w-10 h-10 rounded-full bg-gold/10" />}
        </div>
        <RailButton active={activeTab === NavigationTab.LIBRARY} onClick={() => onTabChange(NavigationTab.LIBRARY)} icon={<ICONS.Library className="w-5 h-5" />} label="Monograph" />
        <RailButton active={activeTab === NavigationTab.PULSES} onClick={() => onTabChange(NavigationTab.PULSES)} icon={<ICONS.Pulse className="w-5 h-5" />} label="Favored" />
        <RailButton active={activeTab === NavigationTab.SCANNER} onClick={() => onTabChange(NavigationTab.SCANNER)} icon={<ICONS.Scanner className="w-5 h-5" />} label="Acquire" />
        <div className="flex-1" />
        <RailButton active={false} onClick={onToggleTheme} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>} label="Theme" />
        <RailButton active={activeTab === NavigationTab.SETTINGS} onClick={() => onTabChange(NavigationTab.SETTINGS)} icon={<ICONS.Settings className="w-5 h-5" />} label="Folio" />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden px-6 py-4 flex items-center justify-between border-b border-ink/5 bg-mica-surface">
          <h1 className="font-header text-2xl font-semibold foil-stamping">Sapphic Shelves</h1>
          {archivistIcon && <img src={archivistIcon} className="w-8 h-8 rounded-full" />}
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-24 md:pb-8 pt-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Mobile Nav Plinth */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 mica-surface plinth-shadow border-t border-ink/10 pb-[env(safe-area-inset-bottom)] z-50">
          <div className="flex items-center justify-around h-16">
            <RailButton active={activeTab === NavigationTab.LIBRARY} onClick={() => onTabChange(NavigationTab.LIBRARY)} icon={<ICONS.Library className="w-5 h-5" />} label="Library" />
            <RailButton active={activeTab === NavigationTab.PULSES} onClick={() => onTabChange(NavigationTab.PULSES)} icon={<ICONS.Pulse className="w-5 h-5" />} label="Favored" />
            <RailButton active={activeTab === NavigationTab.SCANNER} onClick={() => onTabChange(NavigationTab.SCANNER)} icon={<ICONS.Scanner className="w-5 h-5" />} label="Scan" />
            <RailButton active={activeTab === NavigationTab.SETTINGS} onClick={() => onTabChange(NavigationTab.SETTINGS)} icon={<ICONS.Settings className="w-5 h-5" />} label="Folio" />
          </div>
        </nav>
      </div>
    </div>
  );
};

const RailButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ 
  active, onClick, icon, label 
}) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center transition-all duration-300 ${
      active ? 'text-gold' : 'text-ink/40 hover:text-ink/70'
    }`}
  >
    {icon}
    <span className="text-[8px] font-bold tracking-widest uppercase mt-1 hidden md:block">{label}</span>
  </button>
);

export default Layout;
