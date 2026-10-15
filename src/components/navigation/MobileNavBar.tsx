import React from 'react';
import { ActiveTab } from '../../types/music';
import { Disc, Compass, Library, Search } from 'lucide-react';

interface MobileNavBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  accentHex: string;
  onTriggerHaptic: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  onTabChange,
  accentHex,
  onTriggerHaptic,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 grid grid-cols-4 items-center h-14 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.5)]"
    >
      <button
        onClick={() => {
          onTriggerHaptic();
          onTabChange('home');
        }}
        className={`flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
          activeTab === 'home' ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
        style={{ color: activeTab === 'home' ? accentHex : undefined }}
      >
        <Disc className={`w-4 h-4 ${activeTab === 'home' ? 'animate-spin-slow' : ''}`} />
        <span className="text-[10px] mt-0.5 font-medium">Home</span>
      </button>

      <button
        onClick={() => {
          onTriggerHaptic();
          onTabChange('explore');
        }}
        className={`flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
          activeTab === 'explore' ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
        style={{ color: activeTab === 'explore' ? accentHex : undefined }}
      >
        <Compass className="w-4 h-4" />
        <span className="text-[10px] mt-0.5 font-medium">Explore</span>
      </button>

      <button
        onClick={() => {
          onTriggerHaptic();
          onTabChange('library');
        }}
        className={`flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
          activeTab === 'library' ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
        style={{ color: activeTab === 'library' ? accentHex : undefined }}
      >
        <Library className="w-4 h-4" />
        <span className="text-[10px] mt-0.5 font-medium">Library</span>
      </button>

      <button
        onClick={() => {
          onTriggerHaptic();
          onTabChange('search');
        }}
        className={`flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
          activeTab === 'search' ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
        style={{ color: activeTab === 'search' ? accentHex : undefined }}
      >
        <Search className="w-4 h-4" />
        <span className="text-[10px] mt-0.5 font-medium">Search</span>
      </button>
    </nav>
  );
};
