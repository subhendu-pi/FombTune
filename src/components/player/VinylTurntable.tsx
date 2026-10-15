import React, { useState } from 'react';
import { Song } from '../../types/music';
import { CoverArt } from '../common/CoverArt';
import { Disc, Play, Pause, RotateCw } from 'lucide-react';

interface VinylTurntableProps {
  song: Song;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  audioActivityLevel?: number; // 0 to 1
}

export const VinylTurntable: React.FC<VinylTurntableProps> = ({
  song,
  isPlaying,
  onTogglePlay,
  speed,
  onSpeedChange,
  audioActivityLevel = 0.5,
}) => {
  const [rpmMode, setRpmMode] = useState<33 | 45>(33);

  const toggleRpm = () => {
    const nextRpm = rpmMode === 33 ? 45 : 33;
    setRpmMode(nextRpm);
    onSpeedChange(nextRpm === 33 ? 1.0 : 1.25);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 select-none max-h-full">
      {/* Turntable Plinth / Body */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 max-w-[84vw] max-h-[84vw] rounded-3xl bg-gradient-to-br from-zinc-900 via-neutral-900 to-black p-3 sm:p-4 md:p-6 shadow-2xl border border-white/10 overflow-hidden flex items-center justify-center">
        {/* Subtle Brushed Metal Finish */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.05),transparent_70%)] pointer-events-none" />

        {/* Status Strobe Light (Top-Left) */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              isPlaying
                ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse'
                : 'bg-zinc-700'
            }`}
          />
          <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
            {rpmMode} RPM
          </span>
        </div>

        {/* Speed Selector Button (Top-Right) */}
        <button
          onClick={toggleRpm}
          className="absolute top-4 right-4 text-xs font-mono px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 transition-colors"
          title="Toggle RPM (33 / 45)"
        >
          {rpmMode}
        </button>

        {/* Spinning Vinyl Platter */}
        <div
          onClick={onTogglePlay}
          className={`relative w-56 h-56 sm:w-64 sm:h-64 md:w-76 md:h-76 rounded-full cursor-pointer transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center ${
            isPlaying ? 'animate-spin-slow' : 'paused'
          }`}
          style={{
            animationDuration: rpmMode === 33 ? '3.6s' : '2.4s',
            boxShadow: `0 0 35px rgba(0, 0, 0, 0.8), 0 0 ${20 * audioActivityLevel}px ${song.accentColor}40`,
          }}
        >
          {/* Vinyl Disc Base */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-4 border-zinc-800">
            {/* Concentric Grooves */}
            <div className="absolute inset-2 rounded-full border border-white/[0.04]" />
            <div className="absolute inset-4 rounded-full border border-white/[0.03]" />
            <div className="absolute inset-7 rounded-full border border-white/[0.05]" />
            <div className="absolute inset-10 rounded-full border border-white/[0.03]" />
            <div className="absolute inset-13 rounded-full border border-white/[0.04]" />
            <div className="absolute inset-16 rounded-full border border-white/[0.03]" />
            <div className="absolute inset-20 rounded-full border border-white/[0.04]" />

            {/* Specular Vinyl Light Reflection Sheen */}
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.08)_45deg,transparent_90deg,transparent_180deg,rgba(255,255,255,0.08)_225deg,transparent_270deg)] pointer-events-none" />
          </div>

          {/* Record Center Label (Album Artwork) */}
          <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-zinc-800 overflow-hidden shadow-md flex items-center justify-center bg-zinc-900">
            <CoverArt song={song} isVinylLabel={true} />
            {/* Center Spindle Hole */}
            <div className="absolute w-4 h-4 rounded-full bg-zinc-950 border border-zinc-600 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            </div>
          </div>
        </div>

        {/* Realistic Tonearm Assembly */}
        <div
          className="absolute top-2 right-6 w-20 h-48 pointer-events-none transition-transform duration-700 ease-out origin-top-right z-20"
          style={{
            transform: isPlaying ? 'rotate(24deg)' : 'rotate(-6deg)',
          }}
        >
          {/* Tonearm Base / Pivot Ring */}
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gradient-to-b from-zinc-400 to-zinc-700 border border-zinc-300 shadow-md flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-zinc-800" />
          </div>

          {/* Curved Arm Rod */}
          <div className="absolute top-7 right-4 w-1.5 h-36 bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-400 shadow-sm rounded-full origin-top" />

          {/* Cartridge & Stylus Needle Head */}
          <div className="absolute bottom-2 right-2.5 w-4 h-7 bg-zinc-900 border border-zinc-500 rounded-sm shadow-md flex flex-col items-center justify-between p-0.5">
            <div className="w-2.5 h-2 bg-red-600 rounded-xs" />
            <div className="w-0.5 h-2 bg-zinc-300" />
          </div>
        </div>

        {/* Play/Pause Overlay Touch Hint */}
        <div
          onClick={onTogglePlay}
          className="absolute bottom-4 left-4 z-20 flex items-center gap-2 cursor-pointer bg-black/40 hover:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs transition-colors"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 text-zinc-300" />
              <span>Tap to pause disc</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>Tap to spin vinyl</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
