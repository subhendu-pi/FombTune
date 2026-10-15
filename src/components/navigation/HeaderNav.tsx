import React from 'react';
import { ActiveTab } from '../../types/music';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { Disc, Sparkles, Sliders, Settings } from 'lucide-react';

interface HeaderNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  accentHex: string;
  onOpenWrapped: () => void;
  onOpenFullPlayer: () => void;
  onOpenSettings: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  onTabChange,
  accentHex,
  onOpenWrapped,
  onOpenFullPlayer,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl shrink-0">
      {/* Zone 1: Brand Wordmark */}
      <div
        onClick={() => onTabChange('home')}
        className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 group"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:rotate-180 duration-700 shadow-md"
          style={{ backgroundColor: accentHex }}
        >
          <Disc className="w-4 h-4 text-black fill-black" />
        </div>
        <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
          FabTune
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
        <button
          onClick={() => onTabChange('home')}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'home' ? 'text-white font-bold border-b-2' : 'hover:text-white'
          }`}
          style={{ borderColor: activeTab === 'home' ? accentHex : 'transparent' }}
        >
          Discover
        </button>

        <button
          onClick={() => onTabChange('explore')}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'explore' ? 'text-white font-bold border-b-2' : 'hover:text-white'
          }`}
          style={{ borderColor: activeTab === 'explore' ? accentHex : 'transparent' }}
        >
          Charts &amp; Moods
        </button>

        <button
          onClick={() => onTabChange('library')}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'library' ? 'text-white font-bold border-b-2' : 'hover:text-white'
          }`}
          style={{ borderColor: activeTab === 'library' ? accentHex : 'transparent' }}
        >
          Library
        </button>

        <button
          onClick={() => onTabChange('search')}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'search' ? 'text-white font-bold border-b-2' : 'hover:text-white'
          }`}
          style={{ borderColor: activeTab === 'search' ? accentHex : 'transparent' }}
        >
          Search
        </button>

        <button
          onClick={onOpenWrapped}
          className="flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Wrapped &apos;24</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action & Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <PWAInstallButton variant="header" />

        <button
          onClick={onOpenFullPlayer}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          title="Open Equalizer & Player"
        >
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Equalizer</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 transition-colors"
          title="Appearance & Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
