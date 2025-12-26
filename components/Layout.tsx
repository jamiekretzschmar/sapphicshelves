
import React from 'react';
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
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, theme, onToggleTheme, onOpenSettings }) => {
  return (
    <div className="android-device" data-theme={theme}>
      <div className="status-bar">
        <span>12:45</span>
      </div>
      
      <div className="screen">
        <header className="top-app-bar border-b border-black/5">
          <div className="flex items-center gap-2">
            <Logo size={32} className="shrink-0" />
            <h1 className="font-header text-lg font-bold text-md-sys-primary italic leading-none">Sapphic Shelves</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-black/5 transition-colors text-md-sys-outline">
              {theme === 'dark' ? '🌙' : theme === 'sepia' ? '📜' : '☀️'}
            </button>
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
          <NavItem 
            active={activeTab === NavigationTab.DISCOVER} 
            onClick={() => onTabChange(NavigationTab.DISCOVER)} 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>} 
            label="Engine" 
          />
        </nav>
      </div>
    </div>
  );
};

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
