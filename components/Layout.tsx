
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { NavigationTab, Theme } from '../types';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  settings: {
    canadianFocus: boolean;
    hapticsEnabled: boolean;
  };
  onExport: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  theme, 
  onToggleTheme, 
  onOpenSettings,
  settings,
  onExport
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleNav = (tab: NavigationTab) => {
    onTabChange(tab);
    setIsDrawerOpen(false);
  };

  return (
    <div className="android-device" data-theme={theme}>
      <div className="status-bar">
        <span>12:45</span>
      </div>
      
      <div className="screen">
        {/* Navigation Scrim */}
        {isDrawerOpen && (
          <div 
            className="fixed inset-0 bg-brand-deep/20 backdrop-blur-[2px] z-[190] animate-in fade-in duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        {/* The Archivist's Cloister (Drawer) */}
        <aside 
          className={`fixed inset-y-0 left-0 w-[280px] bg-parchment z-[200] shadow-2xl transition-transform duration-300 ease-out border-r border-black/5 flex flex-col ${
            isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-8 space-y-8 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between">
              <Logo size={40} />
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 text-ink/40"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="font-header text-2xl italic text-brand-deep leading-tight">The Cloister</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-plum opacity-40">Archival Navigation</p>
            </div>

            <nav className="space-y-2">
              <DrawerItem 
                active={activeTab === NavigationTab.LIBRARY}
                onClick={() => handleNav(NavigationTab.LIBRARY)}
                icon={<ICONS.Library className="w-5 h-5" />}
                label="Monograph Library"
                sublabel="The complete volume collection"
              />
              <DrawerItem 
                active={activeTab === NavigationTab.BEHOLD}
                onClick={() => handleNav(NavigationTab.BEHOLD)}
                icon={<ICONS.Behold className="w-5 h-5" />}
                label="Thematic Shelves"
                sublabel="Visual structural integrity"
              />
              <DrawerItem 
                active={activeTab === NavigationTab.LEXICON}
                onClick={() => handleNav(NavigationTab.LEXICON)}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                label="The Lexicon"
                sublabel="Binary signifier mapping"
              />
              <DrawerItem 
                active={activeTab === NavigationTab.PULSES}
                onClick={() => handleNav(NavigationTab.PULSES)}
                icon={<ICONS.Pulse className="w-5 h-5" />}
                label="Author Pulses"
                sublabel="Historical scribe tracking"
              />
              <DrawerItem 
                active={activeTab === NavigationTab.DISCOVER}
                onClick={() => handleNav(NavigationTab.DISCOVER)}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                label="Discovery Engine"
                sublabel="ARC and acquisition scouting"
              />
            </nav>

            <div className="pt-8 border-t border-black/5 space-y-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-plum opacity-40">Protocol Settings</p>
              <div className="space-y-3">
                <button 
                  onClick={onToggleTheme}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-black/5 hover:bg-black/10 transition-colors"
                >
                  <span className="text-[10px] font-bold italic text-brand-deep">Cycle Theme</span>
                  <span className="text-[10px] text-brand-cyan">{theme.toUpperCase()}</span>
                </button>
                <div className="w-full flex items-center justify-between p-3 rounded-xl bg-black/5">
                  <span className="text-[10px] font-bold italic text-brand-deep">Haptics</span>
                  <div className={`w-6 h-3 rounded-full ${settings.hapticsEnabled ? 'bg-brand-cyan' : 'bg-black/10'}`} />
                </div>
                <button 
                  onClick={onExport}
                  className="w-full py-3 border-2 border-brand-deep/10 text-brand-deep rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-deep hover:text-parchment transition-all"
                >
                  Export Archive
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-brand-deep/5 border-t border-black/5">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-brand-deep flex items-center justify-center text-parchment font-header italic text-xl">A</div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep">Head Archivist</p>
                 <p className="text-[9px] italic text-ink/40">Protocol V4.0.0 Active</p>
               </div>
             </div>
          </div>
        </aside>

        <header className="top-app-bar border-b border-black/5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 -ml-2 rounded-full hover:bg-black/5 text-md-sys-primary"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h12M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <h1 className="font-header text-xl font-bold text-md-sys-primary italic leading-none">Sapphic Shelves</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onOpenSettings} className="p-2 rounded-full hover:bg-black/5 text-md-sys-outline">
              <ICONS.Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="scroll-container">
          {children}
        </div>

        {activeTab !== NavigationTab.SCANNER && (
          <button 
            className="fab"
            onClick={() => onTabChange(NavigationTab.SCANNER)}
            aria-label="Acquire New Volume"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        <nav className="bottom-nav">
          <NavItem 
            active={activeTab === NavigationTab.LIBRARY} 
            onClick={() => onTabChange(NavigationTab.LIBRARY)} 
            icon={<ICONS.Library className="w-6 h-6" />} 
            label="Library" 
          />
          <NavItem 
            active={activeTab === NavigationTab.BEHOLD} 
            onClick={() => onTabChange(NavigationTab.BEHOLD)} 
            icon={<ICONS.Behold className="w-6 h-6" />} 
            label="Shelves" 
          />
          <NavItem 
            active={activeTab === NavigationTab.LEXICON} 
            onClick={() => onTabChange(NavigationTab.LEXICON)} 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>} 
            label="Lexicon" 
          />
          <NavItem 
            active={activeTab === NavigationTab.PULSES} 
            onClick={() => onTabChange(NavigationTab.PULSES)} 
            icon={<ICONS.Pulse className="w-6 h-6" />} 
            label="Pulses" 
          />
        </nav>
      </div>
    </div>
  );
};

const DrawerItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; sublabel: string }> = ({ 
  active, onClick, icon, label, sublabel 
}) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
      active ? 'bg-brand-cyan text-parchment shadow-lg' : 'hover:bg-black/5 text-brand-deep'
    }`}
  >
    <div className={`${active ? 'text-parchment' : 'text-brand-cyan'}`}>
      {icon}
    </div>
    <div className="text-left">
      <p className="text-[11px] font-bold italic leading-none mb-1">{label}</p>
      <p className={`text-[8px] font-bold uppercase tracking-widest ${active ? 'opacity-60' : 'opacity-30'}`}>{sublabel}</p>
    </div>
  </button>
);

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ 
  active, onClick, icon, label 
}) => (
  <div 
    onClick={onClick}
    className={`nav-item ripple ${active ? 'active' : ''}`}
  >
    <div className="nav-icon-bg">
      {icon}
    </div>
    <span className="nav-label">{label}</span>
  </div>
);

export default Layout;
