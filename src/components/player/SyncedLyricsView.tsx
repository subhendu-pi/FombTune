import React, { useEffect, useRef, useState } from 'react';
import { LyricsLine } from '../../types/music';
import { Languages, Volume2 } from 'lucide-react';

interface SyncedLyricsViewProps {
  lyrics: LyricsLine[];
  currentTime: number;
  onSeek: (time: number) => void;
  accentColor?: string;
}

export const SyncedLyricsView: React.FC<SyncedLyricsViewProps> = ({
  lyrics,
  currentTime,
  onSeek,
  accentColor = '#818cf8',
}) => {
  const [showRomanized, setShowRomanized] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Find the active index
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Auto-scroll active line to center
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <div className="relative w-full h-full max-h-[460px] flex flex-col items-center">
      {/* Top Controls: Romanization / Translation toggle */}
      <div className="sticky top-0 z-20 w-full flex items-center justify-between px-4 py-2 bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-transparent backdrop-blur-xs mb-2">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Volume2 className="w-3.5 h-3.5" />
          <span>Synced Lyrics (Click line to seek)</span>
        </div>

        <button
          onClick={() => setShowRomanized(!showRomanized)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            showRomanized
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
              : 'bg-zinc-800 text-zinc-400 border-white/10 hover:text-white'
          }`}
          title="Toggle Romanized Pronunciation / Translation"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{showRomanized ? 'Romaji / Sub: ON' : 'Romaji: OFF'}</span>
        </button>
      </div>

      {/* Lyrics Scrollable Area */}
      <div
        ref={containerRef}
        className="w-full flex-1 overflow-y-auto px-4 py-8 space-y-6 text-center select-none"
      >
        {lyrics.length === 0 ? (
          <div className="py-20 text-zinc-500 text-sm">
            No synchronized lyrics available for this track.
          </div>
        ) : (
          lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;

            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(line.time)}
                className={`group cursor-pointer transition-all duration-300 py-1.5 px-4 rounded-xl ${
                  isActive
                    ? 'scale-105 font-bold opacity-100'
                    : isPast
                    ? 'opacity-40 hover:opacity-75 font-medium'
                    : 'opacity-30 hover:opacity-60 font-medium'
                }`}
                style={{
                  color: isActive ? accentColor : undefined,
                  textShadow: isActive ? `0 0 20px ${accentColor}80` : undefined,
                }}
              >
                <p className="text-lg md:text-2xl leading-relaxed tracking-tight text-white transition-colors">
                  {line.text}
                </p>

                {showRomanized && line.romanized && (
                  <p className="text-xs md:text-sm text-zinc-400 font-mono mt-1 opacity-80">
                    {line.romanized}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
