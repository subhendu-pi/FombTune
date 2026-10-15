import React, { useState, useEffect } from 'react';
import { Song, UserListeningStats } from '../../types/music';
import { CoverArt } from '../common/CoverArt';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Clock,
  Music,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Headphones,
  Play,
  RotateCcw,
} from 'lucide-react';

interface WrappedModalProps {
  stats: UserListeningStats;
  songs: Song[];
  onPlaySong: (song: Song) => void;
  onClose: () => void;
}

export const WrappedModal: React.FC<WrappedModalProps> = ({
  stats,
  songs,
  onPlaySong,
  onClose,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 5;

  const topSong = songs.find((s) => s.id === stats.topSongId) || songs[0];

  // Sort songs by plays
  const top5Songs = [...songs]
    .sort((a, b) => (stats.playedTrackCounts[b.id] || b.plays) - (stats.playedTrackCounts[a.id] || a.plays))
    .slice(0, 5);

  useEffect(() => {
    if (currentSlide === totalSlides - 1) {
      // Fire confetti on finale slide
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [currentSlide]);

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleShare = () => {
    const summary = `🎵 My FabTune Wrapped:\n⏱️ ${stats.totalMinutes} minutes listened\n🏆 Top Song: "${topSong.title}" by ${topSong.artist}\n🔮 Musical Persona: ${stats.personaTitle}`;
    navigator.clipboard?.writeText(summary);
    alert('Copied your FabTune Wrapped stats to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-[580px] sm:h-[640px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/20 bg-gradient-to-b from-zinc-950 via-purple-950/80 to-slate-950 text-white">
        {/* Top Story Progress Bars */}
        <div className="relative z-20 flex gap-1.5 p-4 pb-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  idx < currentSlide
                    ? 'w-full'
                    : idx === currentSlide
                    ? 'w-full animate-pulse'
                    : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Top Bar with Title and Close */}
        <div className="relative z-20 flex items-center justify-between px-5 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FabTune Wrapped</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Content Area */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
          {/* SLIDE 0: Welcome / Intro */}
          {currentSlide === 0 && (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6">
                <Headphones className="w-10 h-10 text-white" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-300 mb-2">
                Annual Listening Journey
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-3">
                Your Year in Music
              </h2>
              <p className="text-sm text-zinc-300 max-w-xs leading-relaxed">
                You listened without limits. Let\'s look back at the beats, melodies, and late-night frequencies that defined your soundtrack.
              </p>
            </div>
          )}

          {/* SLIDE 1: Total Minutes */}
          {currentSlide === 1 && (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mb-4 text-indigo-300">
                <Clock className="w-7 h-7" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1">
                Time Spent in Flow
              </span>
              <div className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-pink-300 to-white my-3 font-mono">
                {stats.totalMinutes.toLocaleString()}
              </div>
              <span className="text-lg font-semibold text-zinc-200">
                Minutes of pure audio immersion
              </span>
              <p className="text-xs text-zinc-400 mt-4 max-w-xs leading-relaxed">
                That’s over {(stats.totalMinutes / 60).toFixed(1)} hours of sound waves tuned through your headphones.
              </p>
            </div>
          )}

          {/* SLIDE 2: Musical Persona */}
          {currentSlide === 2 && (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
              <span className="text-xs font-mono uppercase tracking-widest text-fuchsia-300 mb-2">
                Auditory DNA Archetype
              </span>
              <div className="p-4 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md mb-4 shadow-xl flex flex-col items-center">
                <Trophy className="w-10 h-10 text-amber-300 mb-2" />
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  {stats.personaTitle}
                </h3>
              </div>
              <p className="text-sm text-zinc-300 max-w-xs leading-relaxed">
                {stats.personaDescription}
              </p>
            </div>
          )}

          {/* SLIDE 3: Top 5 Songs */}
          {currentSlide === 3 && (
            <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-300">
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-300 mb-3">
                Your Most Played Tracks
              </span>
              <div className="w-full space-y-2 max-h-72 overflow-y-auto px-1">
                {top5Songs.map((track, i) => (
                  <div
                    key={track.id}
                    onClick={() => onPlaySong(track)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold font-mono text-indigo-400 w-5">
                        #{i + 1}
                      </span>
                      <CoverArt song={track} size="xs" />
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold text-white truncate">{track.title}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                      </div>
                    </div>
                    <Play className="w-3.5 h-3.5 text-zinc-400 shrink-0 hover:text-white" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 4: Finale Recap Card */}
          {currentSlide === 4 && (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300 w-full">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900/90 via-purple-900/90 to-zinc-900 border border-white/20 shadow-2xl w-full flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Music className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold tracking-wider uppercase text-white">
                    FabTune Wrapped 2024
                  </span>
                </div>

                <CoverArt song={topSong} size="lg" className="shadow-lg mb-3" />

                <h3 className="text-base font-bold text-white truncate max-w-full">
                  #1 Track: {topSong.title}
                </h3>
                <p className="text-xs text-zinc-400 mb-3">{topSong.artist}</p>

                <div className="grid grid-cols-2 gap-2 w-full pt-2 border-t border-white/10 text-xs">
                  <div className="p-2 bg-white/5 rounded-xl">
                    <span className="text-[10px] text-zinc-400 block">Total Minutes</span>
                    <span className="font-mono font-bold text-white">{stats.totalMinutes}</span>
                  </div>
                  <div className="p-2 bg-white/5 rounded-xl">
                    <span className="text-[10px] text-zinc-400 block">Top Genre</span>
                    <span className="font-semibold text-white">{stats.topGenre}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="relative z-20 flex items-center justify-between p-5 pt-0">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={`p-2.5 rounded-full bg-white/10 text-white transition-opacity ${
              currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {currentSlide === totalSlides - 1 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentSlide(0)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs flex items-center gap-1 hover:bg-zinc-200 transition-colors shadow-md"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
