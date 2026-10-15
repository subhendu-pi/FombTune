import React from 'react';
import { Song } from '../../types/music';
import { Disc, Music, Waves, Radio, Moon, Sun, Cpu, Sparkles } from 'lucide-react';

interface CoverArtProps {
  song: Song;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isVinylLabel?: boolean;
}

export const CoverArt: React.FC<CoverArtProps> = ({
  song,
  size = 'md',
  className = '',
  isVinylLabel = false,
}) => {
  const sizeClasses = {
    xs: 'w-10 h-10 rounded-md',
    sm: 'w-12 h-12 rounded-lg',
    md: 'w-16 h-16 rounded-xl',
    lg: 'w-32 h-32 md:w-44 md:h-44 rounded-2xl',
    xl: 'w-56 h-56 md:w-72 md:h-72 rounded-3xl',
  };

  const [imgError, setImgError] = React.useState(false);

  const getArtworkVisual = () => {
    if (song.coverUrl && !imgError) {
      return (
        <img
          src={song.coverUrl}
          alt={song.title}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      );
    }

    switch (song.coverArtworkType) {
      case 'synthwave':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-900 to-rose-950" />
            {/* Geometric Sun */}
            <div className="relative w-1/2 h-1/2 rounded-full bg-gradient-to-t from-yellow-300 via-rose-500 to-fuchsia-600 shadow-lg shadow-rose-500/30 flex items-center justify-center">
              <Sun className="w-1/2 h-1/2 text-white/80" />
            </div>
            {/* Grid Horizon */}
            <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-cyan-900/60 to-transparent border-t border-cyan-400/40" />
          </div>
        );

      case 'acoustic':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-950 to-stone-950" />
            <div className="relative z-10 flex flex-col items-center">
              <Waves className="w-1/2 h-1/2 text-emerald-300/80 mb-1" />
              <div className="w-12 h-0.5 bg-emerald-400/40 rounded-full" />
            </div>
          </div>
        );

      case 'ambient':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950 via-blue-900 to-slate-950" />
            <div className="relative z-10 w-2/3 h-2/3 rounded-full border border-cyan-400/30 flex items-center justify-center animate-pulse">
              <Moon className="w-1/2 h-1/2 text-cyan-300/80" />
            </div>
          </div>
        );

      case 'cyber':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-bl from-purple-950 via-fuchsia-950 to-zinc-950" />
            <Cpu className="relative z-10 w-1/2 h-1/2 text-fuchsia-400/80" />
            <div className="absolute inset-0 border border-fuchsia-500/20" />
          </div>
        );

      case 'piano':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-zinc-900 to-black" />
            <div className="relative z-10 flex gap-1 items-end h-1/3 opacity-80">
              <div className="w-2.5 h-full bg-white rounded-t-sm" />
              <div className="w-2.5 h-2/3 bg-white rounded-t-sm" />
              <div className="w-2.5 h-full bg-white rounded-t-sm" />
              <div className="w-2.5 h-4/5 bg-white rounded-t-sm" />
            </div>
          </div>
        );

      case 'lofi':
      default:
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-violet-950 to-slate-950" />
            <div className="relative z-10 flex flex-col items-center text-indigo-300">
              <Disc className="w-1/2 h-1/2 text-indigo-300/80" />
            </div>
            {/* Subtle stars */}
            <Sparkles className="absolute top-2 right-2 w-3.5 h-3.5 text-amber-200/50" />
          </div>
        );
    }
  };

  if (isVinylLabel) {
    return (
      <div className={`w-full h-full rounded-full overflow-hidden shadow-inner flex items-center justify-center ${className}`}>
        {getArtworkVisual()}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden shrink-0 shadow-md ${sizeClasses[size]} ${className}`}
      style={{
        boxShadow: `0 8px 24px -6px ${song.accentColor}33`,
      }}
    >
      {getArtworkVisual()}
      {/* Vinyl edge light reflection overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/20 pointer-events-none" />
    </div>
  );
};
