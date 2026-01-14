
import React, { useRef } from 'react';
import { ArchiveState, Theme } from '../types';
import { useHaptics } from '../hooks/useHaptics';

interface SettingsViewProps {
  settings: ArchiveState['settings'];
  onUpdateSettings: (settings: Partial<ArchiveState['settings']>) => void;
  onExport: () => void;
  onImport: (file: File) => Promise<boolean>;
  onReset: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExport,
  onImport,
  onReset,
  theme,
  onToggleTheme
}) => {
  const haptics = useHaptics();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggle = (key: keyof ArchiveState['settings']) => {
    haptics.trigger('light');
    onUpdateSettings({ [key]: !settings[key] });
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const success = await onImport(e.target.files[0]);
       if (success) {
         alert("Archive Restored Successfully");
       } else {
         alert("Archive Restoration Failed");
       }
    }
  };
  
  const handleRotateKey = async () => {
    // @ts-ignore - aistudio is injected globally
    if (typeof window.aistudio?.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    } else {
        alert("API Key selection not available in this environment.");
    }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <header className="bg-mica-surface border border-ink/5 p-8 rounded-[3rem] shadow-sm">
        <h2 className="font-header text-4xl italic text-brand-deep mb-2">Protocol Config</h2>
        <p className="text-xs text-ink/60 max-w-lg leading-relaxed italic">
          Calibrate the archival engine parameters and manage data sovereignty.
        </p>
      </header>

      <section className="space-y-4">
        <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-plum opacity-60">Preferences</h3>
        
        <div className="bg-mica-surface border border-ink/5 rounded-3xl overflow-hidden divide-y divide-ink/5">
            <ToggleItem 
                label="Canadian Focus" 
                desc="Prioritize True North authors in discovery."
                value={settings.canadianFocus} 
                onChange={() => handleToggle('canadianFocus')} 
            />
            <ToggleItem 
                label="Auto-Enrichment" 
                desc="Automatically fetch metadata upon acquisition."
                value={settings.autoEnrich} 
                onChange={() => handleToggle('autoEnrich')} 
            />
            <ToggleItem 
                label="Haptic Feedback" 
                desc="Tactile response for archival interactions."
                value={settings.hapticsEnabled} 
                onChange={() => handleToggle('hapticsEnabled')} 
            />
             <ToggleItem 
                label="Large Print" 
                desc="Increase typographic scale for readability."
                value={settings.largeText} 
                onChange={() => handleToggle('largeText')} 
            />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-brand-cyan opacity-60">Environment</h3>
        <div className="bg-mica-surface border border-ink/5 rounded-3xl overflow-hidden divide-y divide-ink/5">
            <div className="p-5 flex items-center justify-between hover:bg-black/5 transition-colors cursor-pointer" onClick={onToggleTheme}>
                <div>
                    <div className="font-bold text-sm text-ink">Visual Theme</div>
                    <div className="text-[10px] text-ink/50 uppercase tracking-widest">{theme.toUpperCase()} Mode</div>
                </div>
                 <div className="w-8 h-8 rounded-full border border-ink/20 flex items-center justify-center bg-parchment">
                    <span className="w-4 h-4 rounded-full bg-brand-deep"></span>
                 </div>
            </div>
             <div className="p-5 flex items-center justify-between hover:bg-black/5 transition-colors cursor-pointer" onClick={handleRotateKey}>
                <div>
                    <div className="font-bold text-sm text-ink">API Key</div>
                    <div className="text-[10px] text-ink/50 uppercase tracking-widest">Rotate Credentials</div>
                </div>
                <svg className="w-5 h-5 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-rose opacity-60">Data Sovereignty</h3>
         <div className="grid grid-cols-2 gap-4">
             <button onClick={onExport} className="bg-mica-surface border border-ink/5 p-6 rounded-3xl hover:shadow-md transition-all text-left group">
                 <svg className="w-6 h-6 text-brand-deep mb-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 <div className="font-bold text-sm text-ink">Export Archive</div>
                 <div className="text-[9px] text-ink/40 uppercase tracking-widest mt-1">Save JSON Protocol</div>
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="bg-mica-surface border border-ink/5 p-6 rounded-3xl hover:shadow-md transition-all text-left group">
                 <svg className="w-6 h-6 text-brand-deep mb-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m-4-4v12" /></svg>
                 <div className="font-bold text-sm text-ink">Import Archive</div>
                 <div className="text-[9px] text-ink/40 uppercase tracking-widest mt-1">Restore JSON Protocol</div>
             </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
         </div>
         
         <button onClick={() => { if(confirm('Nuke Protocol: Are you sure?')) onReset(); }} className="w-full p-4 border border-rose/20 text-rose bg-rose/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose hover:text-white transition-all">
             Nuke Protocol (Factory Reset)
         </button>
      </section>

      <div className="text-center pt-8">
          <div className="w-12 h-12 bg-brand-deep rounded-full flex items-center justify-center text-parchment font-header italic text-xl mx-auto border-2 border-brand-cyan/20 mb-3">A</div>
          <p className="text-[9px] font-black uppercase tracking-widest text-ink/30">Sapphic Shelves v5.0.0</p>
          <p className="text-[9px] italic text-ink/20">Archival Engine Online</p>
      </div>
    </div>
  );
};

const ToggleItem: React.FC<{ label: string; desc: string; value: boolean; onChange: () => void }> = ({ label, desc, value, onChange }) => (
    <div className="p-5 flex items-center justify-between hover:bg-black/5 transition-colors cursor-pointer" onClick={onChange}>
        <div className="pr-4">
            <div className="font-bold text-sm text-ink">{label}</div>
            <div className="text-[10px] text-ink/50 leading-tight mt-0.5">{desc}</div>
        </div>
        <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${value ? 'bg-brand-cyan' : 'bg-ink/20'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${value ? 'translate-x-4' : ''}`} />
        </div>
    </div>
);

export default SettingsView;
        