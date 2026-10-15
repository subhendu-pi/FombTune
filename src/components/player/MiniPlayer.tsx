import React from 'react';
import { PlaybackRepeat, Song } from '../../types/music';
import { CoverArt } from '../common/CoverArt';
import { Play, Pause, SkipForward, Heart, Disc, Maximize2, Repeat, Repeat1, Infinity, Shuffle } from 'lucide-react';

interface MiniPlayerProps {
  song: Song;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLiked: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onToggleLike: (songId: string) => void;
  onOpenFullPlayer: () => void;
  onOpenLyrics?: () => void;
  onOpenTurntable?: () => void;
  repeatMode?: PlaybackRepeat;
  onToggleRepeat?: () => void;
  isShuffle?: boolean;
  onToggleShuffle?: () => void;
  isInfinity?: boolean;
  onToggleInfinity?: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  song,
  isPlaying,
  currentTime,
  duration,
  isLiked,
  onTogglePlay,
  onNext,
  onToggleLike,
  onOpenFullPlayer,
  repeatMode = 'all',
  onToggleRepeat,
  isShuffle = false,
  onToggleShuffle,
  isInfinity = true,
  onToggleInfinity,
}) => {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(10);
      } catch {}
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <aside
      aria-label="Audio Player"
      className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-0 inset-x-0 z-30 bg-zinc-900/95 dark:bg-black/95 backdrop-blur-xl border-t border-white/10 shadow-2xl transition-all select-none"
    >
      {/* Top Border Progress Scrubber Bar */}
      <div className="relative w-full h-1 bg-white/10 overflow-hidden">
        <div
          className="h-full transition-all duration-200"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: song.accentColor || '#818cf8',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Left: Cover Art + Info (Clickable to expand) */}
        <div
          onClick={onOpenFullPlayer}
          className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer group"
        >
          <div className="relative shrink-0">
            <CoverArt song={song} size="sm" />
            {isPlaying && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black/80 border border-white/20 flex items-center justify-center animate-spin-slow">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0 pr-2">
            <h4 className="text-sm font-semibold tracking-tight text-white truncate group-hover:text-indigo-400 transition-colors">
              {song.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="truncate">{song.artist}</span>
              <span aria-hidden="true" className="opacity-40">·</span>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider hidden sm:inline">
                {song.genre}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Like Heart Button */}
          <button
            onClick={() => onToggleLike(song.id)}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
            title={isLiked ? 'Liked' : 'Like'}
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                isLiked ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
              }`}
            />
          </button>

          {/* Shuffle Toggle Button */}
          {onToggleShuffle && (
            <button
              onClick={onToggleShuffle}
              className={`p-2 rounded-full transition-colors hidden sm:flex items-center justify-center ${
                isShuffle
                  ? 'text-indigo-400 bg-white/10'
                  : 'text-zinc-500 hover:text-white'
              }`}
              title={`Shuffle: ${isShuffle ? 'ON' : 'OFF'}`}
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* 3-Tap Repeat / Loop Button */}
          {onToggleRepeat && (
            <button
              onClick={onToggleRepeat}
              className={`p-2 rounded-full transition-colors hidden sm:flex items-center justify-center ${
                repeatMode !== 'off'
                  ? 'text-indigo-400 bg-white/10'
                  : 'text-zinc-500 hover:text-white'
              }`}
              title={`Loop Mode (Tap to cycle): ${
                repeatMode === 'one' ? 'Loop Once' : repeatMode === 'all' ? 'Loop All' : 'Loop Off'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              ) : (
                <Repeat className={`w-4 h-4 sm:w-5 sm:h-5 ${repeatMode === 'all' ? 'text-indigo-400' : ''}`} />
              )}
            </button>
          )}

          {/* Infinity Autoplay Button */}
          {onToggleInfinity && (
            <button
              onClick={onToggleInfinity}
              className={`p-2 rounded-full transition-colors hidden sm:flex items-center justify-center ${
                isInfinity
                  ? 'text-indigo-400 bg-white/10 shadow-[0_0_10px_rgba(129,140,248,0.25)]'
                  : 'text-zinc-500 hover:text-white'
              }`}
              title={`Infinity Autoplay: ${isInfinity ? 'ON (Endless Radio Recommendations)' : 'OFF'}`}
            >
              <Infinity className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Quick Turntable Mode Button */}
          <button
            onClick={onOpenFullPlayer}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-colors hidden sm:flex items-center justify-center"
            title="Vinyl Turntable"
          >
            <Disc className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          </button>

          {/* Play / Pause Toggle Button */}
          <button
            onClick={() => {
              triggerHaptic();
              onTogglePlay();
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md"
            style={{
              backgroundColor: song.accentColor || '#818cf8',
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-black fill-black" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-black fill-black ml-0.5" />
            )}
          </button>

          {/* Skip Forward */}
          <button
            onClick={() => {
              triggerHaptic();
              onNext();
            }}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 active:scale-90 transition-all"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Expand Full Player Button */}
          <button
            onClick={onOpenFullPlayer}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
            title="Expand Full Player"
          >
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
