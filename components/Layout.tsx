
import React, { useState, useRef } from 'react';
import { ICONS } from '../constants';
import { NavigationTab, Theme, SystemTask } from '../types';
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
    largeText: boolean;
  };
  onExport: () => void;
  onImport: (file: File) => Promise<boolean>;
  onReset: () => void;
  activeTasks?: SystemTask[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  theme, 
  onToggleTheme, 
  onOpenSettings,
  settings,
  onExport,
  onImport,
  onReset,
  activeTasks = []
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNav = (tab: NavigationTab) => {
    onTabChange(tab);
    setIsDrawerOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const success = await onImport(e.target.files[0]);
       if (success) {
         setIsDrawerOpen(false);
       }
    }
  };

  const handleReset = () => {
    if (confirm("WARNING: This will obliterate your entire archive. This action cannot be undone. Proceed?")) {
      onReset();
    }
  };

  const activeTaskLabel = activeTasks.length > 0 ? activeTasks[activeTasks.length - 1].label : null;

  return (
    <div className={`android-device ${settings.largeText ? 'text-lg' : ''}`} data-theme={theme}>
      {/* Fake Status Bar - Hidden on Mobile */}
      <div className="hidden md:flex status-bar justify-between items-center px-6 pt-2 opacity-60 text-[10px] font-medium font-sans select-none text-ink">
        <span>SAPPHIC.OS</span>
        <span>100%</span>
      </div>
      
      <div className="screen" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Navigation Scrim */}
        {isDrawerOpen && (
          <div 
            className="absolute inset-0 bg-brand-deep/20 backdrop-blur-sm z-[190] animate-fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Global Task Indicator */}
        {activeTaskLabel && (
           <div className="absolute top-20 right-4 left-4 z-[180] pointer-events-none flex justify-center animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-3 shadow-glass-sm">
               <div className="relative w-2 h-2">
                 <span className="absolute inset-0 rounded-full bg-brand-cyan/50 animate-ping"></span>
                 <span className="absolute inset-0 rounded-full bg-brand-cyan"></span>
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-ink">{activeTaskLabel}</span>
             </div>
           </div>
        )}

        {/* The Archivist's Cloister (Drawer) */}
        <aside 
          className={`absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-parchment/95 backdrop-blur-xl z-[200] shadow-2xl transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col border-r border-ink/5 ${
            isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="p-8 space-y-10 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between">
              <Logo size={48} />
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-ink hover:bg-ink/5 transition-colors"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="font-header text-4xl font-medium text-ink leading-none tracking-tight">The Cloister</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-cyan">Protocol Navigation</p>
            </div>

            <nav className="space-y-1">
              <DrawerItem 
                active={activeTab === NavigationTab.LIBRARY}
                onClick={() => handleNav(NavigationTab.LIBRARY)}
                icon={<ICONS.Library className="w-5 h-5" />}
                label="Monograph Library"
              />
              <DrawerItem 
                active={activeTab === NavigationTab.BEHOLD}
                onClick={() => handleNav(NavigationTab.BEHOLD)}
                icon={<ICONS.Behold className="w-5 h-5" />}
                label="Thematic Shelves"
              />
              <DrawerItem 
                active={activeTab === NavigationTab.LEXICON}
                onClick={() => handleNav(NavigationTab.LEXICON)}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                label="The Lexicon"
              />
              <DrawerItem 
                active={activeTab === NavigationTab.PULSES}
                onClick={() => handleNav(NavigationTab.PULSES)}
                icon={<ICONS.Pulse className="w-5 h-5" />}
                label="Author Pulses"
              />
              <DrawerItem 
                active={activeTab === NavigationTab.DISCOVER}
                onClick={() => handleNav(NavigationTab.DISCOVER)}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                label="Discovery Engine"
              />
            </nav>

            <div className="pt-8 border-t border-ink/10 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink/40">System Config</p>
              
              <button 
                onClick={onToggleTheme}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/40 hover:bg-white/60 transition-colors border border-ink/5"
              >
                <span className="text-xs font-semibold text-ink font-header text-lg">Visual Theme</span>
                <span className="text-[10px] font-bold text-ink/60 uppercase tracking-wider">{theme}</span>
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button onClick={onExport} className="p-4 bg-white/40 text-ink rounded-xl text-[10px] font-bold uppercase tracking-wider border border-ink/5 hover:bg-white/60 transition-colors">Export</button>
                <button onClick={handleImportClick} className="p-4 bg-white/40 text-ink rounded-xl text-[10px] font-bold uppercase tracking-wider border border-ink/5 hover:bg-white/60 transition-colors">Import</button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
              
              <button 
                onClick={handleReset}
                className="w-full py-3 text-rose hover:bg-rose/5 rounded-xl text-[10px] font-bold uppercase tracking-widest mt-4 transition-colors"
              >
                Reset Protocol
              </button>
            </div>
          </div>
        </aside>

        {/* Floating Glass Header */}
        <header className="absolute top-4 left-4 right-4 h-16 glass-panel rounded-2xl flex items-center justify-between px-5 z-40 select-none">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="p-1 rounded-full text-ink hover:text-brand-cyan transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </button>
            <h1 className="font-header text-3xl font-medium text-ink tracking-tight pt-1">Sapphic Shelves</h1>
          </div>
          <button 
            onClick={onOpenSettings} 
            className="p-2 rounded-full text-ink/60 hover:text-ink transition-colors"
          >
            <ICONS.Settings className="w-5 h-5" />
          </button>
        </header>

        {/* Main Scroll Area */}
        <div className="scroll-container bg-parchment pt-24">
          {children}
        </div>

        {/* Floating Action Button */}
        {activeTab !== NavigationTab.SCANNER && activeTab !== NavigationTab.LIBRARY && (
          <button 
            className="fab hover:scale-105 active:scale-95 transition-all"
            onClick={() => onTabChange(NavigationTab.SCANNER)}
            aria-label="Acquire New Volume"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        {/* Glass Bottom Nav */}
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

const DrawerItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ 
  active, onClick, icon, label 
}) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all border border-transparent ${
      active ? 'bg-white shadow-sm border-ink/5 text-brand-deep' : 'hover:bg-ink/5 text-ink/70'
    }`}
  >
    <div className={active ? 'text-brand-cyan' : 'text-ink/40'}>{icon}</div>
    <span className={`text-lg font-header pt-1 ${active ? 'font-medium' : 'font-normal'}`}>{label}</span>
  </button>
);

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ 
  active, onClick, icon, label 
}) => (
  <div 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 w-16 h-full cursor-pointer transition-all duration-300 group`}
  >
    <div className={`p-1.5 rounded-full transition-all duration-300 ${active ? 'bg-brand-deep text-parchment transform -translate-y-1 shadow-lg' : 'text-ink/50 group-hover:text-ink'}`}>
      {React.cloneElement(icon as React.ReactElement, { 
        className: `w-5 h-5 stroke-[1.5]`
      })}
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-widest transition-opacity duration-300 ${active ? 'opacity-100 text-ink' : 'opacity-0 h-0 overflow-hidden'}`}>
      {label}
    </span>
  </div>
);

export default Layout;
