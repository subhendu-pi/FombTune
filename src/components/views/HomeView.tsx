import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Playlist, Song } from '../../types/music';
import { CoverArt } from '../common/CoverArt';
import {
  Play,
  Pause,
  Sparkles,
  Shuffle,
  Heart,
  Clock,
  Radio,
  ListPlus,
  Flame,
  Volume2,
  CloudRain,
  Coffee,
  Trees,
  Moon,
  Zap,
  Disc,
  Sliders,
  Timer,
  Mic2,
  Check,
  RotateCw,
  Search,
  Upload,
  Compass,
} from 'lucide-react';
import { audioEngine, EQ_PRESETS } from '../../services/audioEngine';
import { ambientEngine, AmbientSoundType, AMBIENT_LAYERS } from '../../services/ambientEngine';

interface HomeViewProps {
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  isPlaying: boolean;
  likedSongIds: string[];
  recentlyPlayed: Song[];
  onPlaySong: (song: Song) => void;
  onTogglePlay: () => void;
  onToggleLike: (songId: string) => void;
  onSelectPlaylist?: (playlist: Playlist) => void;
  onOpenWrapped: () => void;
  onAddToQueue: (song: Song) => void;
  onPlayPhaseShuffle?: (phaseSongs: Song[]) => void;
  onOpenTurntable?: () => void;
  onOpenLyrics?: () => void;
  onSetSleepTimer?: (minutes: number) => void;
  sleepTimerRemaining?: number | null;
  onSpeedChange?: (speed: number) => void;
  speed?: number;
  onNavigateTab?: (tab: 'home' | 'search' | 'library' | 'explore') => void;
  onAddLocalSong?: (song: Song) => void;
}

type AudioVibeMode = 'flat' | 'nightcore' | 'slowed' | 'lofi' | 'bass';

export const HomeView: React.FC<HomeViewProps> = ({
  songs,
  currentSong,
  isPlaying,
  likedSongIds,
  recentlyPlayed,
  onPlaySong,
  onTogglePlay,
  onToggleLike,
  onOpenWrapped,
  onAddToQueue,
  onPlayPhaseShuffle,
  onOpenTurntable,
  onOpenLyrics,
  onSetSleepTimer,
  sleepTimerRemaining,
  onSpeedChange,
  speed = 1.0,
  onNavigateTab,
  onAddLocalSong,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Spotlight featured song (safely null when songs list is empty)
  const featuredSong = songs.length > 0 ? (songs[1] || songs[0]) : null;

  // 3x3 Phase Deck State
  const [phaseSeed, setPhaseSeed] = useState<number>(1);
  const [isReshuffling, setIsReshuffling] = useState<boolean>(false);

  // Audio Vibe FX State
  const [activeVibe, setActiveVibe] = useState<AudioVibeMode>('flat');

  // Ambient Sounds State
  const [ambientStates, setAmbientStates] = useState<Record<AmbientSoundType, boolean>>({
    rain: false,
    coffeehouse: false,
    forest: false,
    cosmic: false,
  });

  const [ambientVols, setAmbientVols] = useState<Record<AmbientSoundType, number>>({
    rain: 0.35,
    coffeehouse: 0.3,
    forest: 0.35,
    cosmic: 0.4,
  });

  // Calculate 9 distinct songs for the 3x3 Shuffling Play Card Phase
  const phaseCards = useMemo(() => {
    if (songs.length === 0) return [];
    // Pseudo-random deterministic shuffle based on phaseSeed
    const pool = [...songs];
    const shuffled: Song[] = [];
    let s = phaseSeed * 9301 + 49297;

    for (let i = pool.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Always guarantee exactly 9 cards
    for (let i = 0; i < 9; i++) {
      shuffled.push(pool[i % pool.length]);
    }
    return shuffled;
  }, [songs, phaseSeed]);

  // Reshuffle 3x3 Deck Handler
  const handleReshufflePhase = useCallback(() => {
    setIsReshuffling(true);
    setPhaseSeed((prev) => prev + 1);
    setTimeout(() => {
      setIsReshuffling(false);
    }, 450);
  }, []);

  // Play All 9 Cards in Shuffle Mode
  const handlePlayPhaseDeck = useCallback(() => {
    if (phaseCards.length === 0) return;
    if (onPlayPhaseShuffle) {
      onPlayPhaseShuffle(phaseCards);
    } else {
      // Fallback: play random card from the 9
      const randIdx = Math.floor(Math.random() * phaseCards.length);
      onPlaySong(phaseCards[randIdx]);
    }
  }, [phaseCards, onPlayPhaseShuffle, onPlaySong]);

  // Fallback 3 already played tracks if user hasn't played 3 yet
  const displayPlayedTracks = useMemo(() => {
    const list = [...recentlyPlayed];
    // Fill up to 3 using available songs
    songs.forEach((s) => {
      if (list.length < 3 && !list.some((item) => item.id === s.id)) {
        list.push(s);
      }
    });
    return list.slice(0, 3);
  }, [recentlyPlayed, songs]);

  // Apply Audio Vibe Warp
  const handleSelectVibe = useCallback(
    (mode: AudioVibeMode) => {
      setActiveVibe(mode);
      switch (mode) {
        case 'nightcore':
          onSpeedChange?.(1.25);
          audioEngine.setPlaybackRate(1.25);
          const treblePreset = EQ_PRESETS.find((p) => p.name === 'Treble Crisp');
          if (treblePreset) audioEngine.setEQPreset(treblePreset);
          break;
        case 'slowed':
          onSpeedChange?.(0.85);
          audioEngine.setPlaybackRate(0.85);
          const bassPreset = EQ_PRESETS.find((p) => p.name === 'Bass Boost');
          if (bassPreset) audioEngine.setEQPreset(bassPreset);
          break;
        case 'lofi':
          onSpeedChange?.(1.0);
          audioEngine.setPlaybackRate(1.0);
          const lofiPreset = EQ_PRESETS.find((p) => p.name === 'Lo-Fi Warmth');
          if (lofiPreset) audioEngine.setEQPreset(lofiPreset);
          break;
        case 'bass':
          onSpeedChange?.(1.0);
          audioEngine.setPlaybackRate(1.0);
          const heavyBass = EQ_PRESETS.find((p) => p.name === 'Bass Boost');
          if (heavyBass) audioEngine.setEQPreset(heavyBass);
          break;
        case 'flat':
        default:
          onSpeedChange?.(1.0);
          audioEngine.setPlaybackRate(1.0);
          const flatPreset = EQ_PRESETS.find((p) => p.name === 'Flat');
          if (flatPreset) audioEngine.setEQPreset(flatPreset);
          break;
      }
    },
    [onSpeedChange]
  );

  // Toggle Ambient Layer
  const handleToggleAmbient = useCallback((type: AmbientSoundType) => {
    const isNowActive = ambientEngine.toggleLayer(type);
    setAmbientStates((prev) => ({ ...prev, [type]: isNowActive }));
  }, []);

  // Update Ambient Volume
  const handleAmbientVolume = useCallback((type: AmbientSoundType, val: number) => {
    ambientEngine.setVolume(type, val);
    setAmbientVols((prev) => ({ ...prev, [type]: val }));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const fileName = file.name.replace(/\.[^/.]+$/, '');

    const newLocalSong: Song = {
      id: `local-${Date.now()}`,
      title: fileName,
      artist: 'Local Track',
      album: 'Local Upload',
      duration: 180,
      genre: 'Local',
      year: new Date().getFullYear(),
      plays: 1,
      coverGradient: 'from-amber-600 via-orange-700 to-zinc-950',
      accentColor: '#f59e0b',
      coverArtworkType: 'acoustic',
      audioType: 'local',
      audioUrl: fileUrl,
      lyrics: [{ time: 0, text: `♪ Playing local audio: ${fileName} ♪` }],
    };

    onAddLocalSong?.(newLocalSong);
    onPlaySong(newLocalSong);
  };

  return (
    <div className="space-y-10 pb-32">
      {/* Hidden File Input for quick local audio uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 1. Hero Spotlight / Welcome Banner */}
      {featuredSong ? (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-white/10 p-6 md:p-10 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-fuchsia-600/25 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-indigo-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Spotlight Release · Material 3 Sound</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                {featuredSong.title}
              </h1>

              <p className="text-sm md:text-base text-zinc-300 max-w-xl">
                By <span className="font-semibold text-white">{featuredSong.artist}</span> · {featuredSong.album} ({featuredSong.year})
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <button
                  onClick={() => {
                    if (currentSong?.id === featuredSong.id) {
                      onTogglePlay();
                    } else {
                      onPlaySong(featuredSong);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black hover:bg-zinc-200 font-bold text-sm shadow-xl transition-transform active:scale-95"
                >
                  {currentSong?.id === featuredSong.id && isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-black" />
                      <span>Pause Track</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                      <span>Listen Now</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onOpenWrapped}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 font-semibold text-sm transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>View Wrapped 2024</span>
                </button>
              </div>
            </div>

            <div
              className="shrink-0 group cursor-pointer"
              onClick={() => onPlaySong(featuredSong)}
            >
              <CoverArt
                song={featuredSong}
                size="lg"
                className="shadow-2xl group-hover:scale-105 transition-transform"
              />
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-white/10 p-6 md:p-10 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-indigo-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>FabTune Music Player · Ready For Your Tracks</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                Your Pure Music Canvas
              </h1>

              <p className="text-sm md:text-base text-zinc-300 max-w-xl">
                Default songs removed. Search millions of online tracks via YouTube Music or upload your local audio files to create your custom library.
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <button
                  onClick={() => onNavigateTab?.('search')}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black hover:bg-zinc-200 font-bold text-sm shadow-xl transition-transform active:scale-95"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Online Songs</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl transition-transform active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Local Audio</span>
                </button>

                <button
                  onClick={() => onNavigateTab?.('explore')}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 font-semibold text-sm transition-all"
                >
                  <Compass className="w-4 h-4 text-indigo-300" />
                  <span>Explore Charts</span>
                </button>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-center w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white/5 border border-white/10 shadow-2xl">
              <Disc className="w-16 h-16 text-indigo-400 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
          </div>
        </section>
      )}

      {/* 2. Shuffling Play Card on Home Screen in 3x3 Phase */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                3x3 Shuffling Phase Matrix
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Phase #{phaseSeed} · Nine dynamically shuffled cards ready for instant playback
            </p>
          </div>

          {/* Shuffle Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleReshufflePhase}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-white/10 text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Reshuffle the 3x3 Phase Cards"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isReshuffling ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Reshuffle Deck</span>
            </button>

            <button
              onClick={handlePlayPhaseDeck}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              title="Queue and shuffle all 9 phase cards"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Phase</span>
            </button>
          </div>
        </div>

        {/* 3x3 Grid Phase Layout */}
        {phaseCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {phaseCards.map((song, index) => {
              const isCurrent = currentSong?.id === song.id;
              const isCardPlaying = isCurrent && isPlaying;
              const isLiked = likedSongIds.includes(song.id);
              const phaseLabel = `0${index + 1}`.slice(-2);

              return (
                <div
                  key={`${song.id}-phase-${phaseSeed}-${index}`}
                  onClick={() => {
                    if (isCurrent) {
                      onTogglePlay();
                    } else {
                      onPlaySong(song);
                    }
                  }}
                  className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
                    isCurrent
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/30'
                      : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/5 hover:border-white/20'
                  }`}
                >
                  {/* Active ambient glow when playing */}
                  {isCardPlaying && (
                    <div
                      className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40"
                      style={{ backgroundColor: song.accentColor || '#6366f1' }}
                    />
                  )}

                  {/* Top Phase Header Tag */}
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-indigo-300">
                        PHASE {phaseLabel}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {song.genre || 'Soundtrack'}
                      </span>
                    </div>

                    <span className="font-mono text-[11px] text-zinc-400">
                      {Math.floor((song.duration || 180) / 60)}:
                      {`0${Math.floor((song.duration || 180) % 60)}`.slice(-2)}
                    </span>
                  </div>

                  {/* Middle Content */}
                  <div className="flex items-center gap-3.5 relative z-10">
                    <div className="relative shrink-0">
                      <CoverArt song={song} size="md" className="rounded-xl shadow-md" />

                      {/* Overlay Play / Pause Icon Button */}
                      <div
                        className={`absolute inset-0 bg-black/45 rounded-xl flex items-center justify-center transition-opacity ${
                          isCardPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isCardPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      <h3
                        className={`text-sm font-bold truncate transition-colors ${
                          isCurrent ? 'text-indigo-300' : 'text-zinc-100 group-hover:text-white'
                        }`}
                      >
                        {song.title}
                      </h3>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{song.album}</p>
                    </div>
                  </div>

                  {/* Bottom Control Bar */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 relative z-10">
                    {/* Playing Equalizer Animation or Plays */}
                    {isCardPlaying ? (
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-3.5 bg-indigo-400 animate-pulse rounded-full" />
                        <div className="w-1 h-5 bg-indigo-300 animate-bounce rounded-full" />
                        <div className="w-1 h-2 bg-indigo-400 animate-pulse rounded-full" />
                        <span className="text-[10px] font-mono text-indigo-300 ml-1.5 uppercase font-bold tracking-wider">
                          Playing
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {song.bpm ? `${song.bpm} BPM` : `${((song.plays || 120000) / 1000).toFixed(0)}k plays`}
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {/* Add to Queue */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToQueue(song);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        title="Add to queue"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                      </button>

                      {/* Like */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLike(song.id);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        title="Favorite track"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isLiked ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 md:p-12 rounded-3xl border border-dashed border-white/15 bg-zinc-900/40 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 mb-4">
              <Shuffle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              3x3 Phase Deck Ready
            </h3>
            <p className="text-xs md:text-sm text-zinc-400 max-w-md mb-6">
              Search any song online or upload your audio tracks. Nine dynamically shuffled cards will populate here with instant one-click phase playback.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onNavigateTab?.('search')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-transform active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Search &amp; Play Song</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/10 transition-transform active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Local Music</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. Already Played Songs Play Bar of 3 in Vertical */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Recently Played
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Jump back into your last three played tracks
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-mono font-medium">3-Track Vertical Bar</span>
        </div>

        {/* Vertical Stack of 3 Bars */}
        {displayPlayedTracks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {displayPlayedTracks.map((song, index) => {
            const isCurrent = currentSong?.id === song.id;
            const isBarPlaying = isCurrent && isPlaying;
            const isLiked = likedSongIds.includes(song.id);
            const barIndex = `0${index + 1}`.slice(-2);

            return (
              <div
                key={`played-bar-${song.id}-${index}`}
                onClick={() => {
                  if (isCurrent) {
                    onTogglePlay();
                  } else {
                    onPlaySong(song);
                  }
                }}
                className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                  isCurrent
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/20'
                    : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/5 hover:border-white/15'
                }`}
              >
                {/* Left: Number + Thumbnail + Info */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  {/* Vertical Position Badge */}
                  <span
                    className={`font-mono text-xs sm:text-sm font-bold w-6 text-center ${
                      isCurrent ? 'text-amber-400' : 'text-zinc-400'
                    }`}
                  >
                    #{barIndex}
                  </span>

                  {/* Thumbnail with overlay */}
                  <div className="relative shrink-0">
                    <CoverArt song={song} size="md" className="rounded-xl shadow-md" />
                    <div
                      className={`absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center transition-opacity ${
                        isBarPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isBarPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm sm:text-base font-bold truncate transition-colors ${
                          isCurrent ? 'text-amber-300' : 'text-zinc-100 group-hover:text-white'
                        }`}
                      >
                        {song.title}
                      </h3>
                      {isBarPlaying && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          Streaming
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 truncate">
                      <span className="font-medium text-zinc-300 truncate">{song.artist}</span>
                      <span>·</span>
                      <span className="truncate">{song.album}</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline text-zinc-400">{song.genre}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Waveform hint, Duration & Actions */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  {/* Waveform graphic simulator */}
                  <div className="hidden md:flex items-center gap-0.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/5">
                    {[12, 24, 16, 28, 20, 32, 14, 22, 18, 30].map((h, i) => (
                      <div
                        key={i}
                        className={`w-0.5 rounded-full transition-all duration-300 ${
                          isBarPlaying
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-zinc-400'
                        }`}
                        style={{ height: `${isBarPlaying ? Math.max(6, (h * (i % 2 === 0 ? 1 : 0.7))) : h * 0.5}px` }}
                      />
                    ))}
                  </div>

                  {/* Duration */}
                  <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                    {Math.floor((song.duration || 180) / 60)}:
                    {`0${Math.floor((song.duration || 180) % 60)}`.slice(-2)}
                  </span>

                  {/* Like Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLike(song.id);
                    }}
                    className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                    title="Toggle Favorite"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isLiked ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
                      }`}
                    />
                  </button>

                  {/* Add to Queue */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToQueue(song);
                    }}
                    className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors hidden sm:block"
                    title="Add to queue"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>

                  {/* Play Button Pill */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrent) {
                        onTogglePlay();
                      } else {
                        onPlaySong(song);
                      }
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {isBarPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-dashed border-white/15 bg-zinc-900/40 text-center flex flex-col items-center justify-center py-8">
          <Clock className="w-8 h-8 text-zinc-500 mb-2" />
          <p className="text-sm font-semibold text-zinc-300">No tracks played yet</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Your last 3 played songs will appear here as quick-access vertical playback bars with live progress.
          </p>
        </div>
      )}
    </section>

      {/* 4. Extra Features Suite: Audio Vibe Warp, Procedural Ambient Sounds & Quick Studio Tools */}
      <section className="space-y-6 pt-2">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Extra Sound Studio Features
          </h2>
        </div>

        {/* Feature 4A: Instant Audio Vibe & Tempo Warp */}
        <div className="p-5 md:p-6 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Instant Audio Vibe & Tempo Warper</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Apply one-tap realtime audio transformations to active playback
              </p>
            </div>
            <span className="font-mono text-xs text-zinc-400">Current Speed: {speed.toFixed(2)}x</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { id: 'flat' as AudioVibeMode, label: 'Studio Flat', desc: '1.0x · Natural EQ', color: 'border-zinc-700' },
              { id: 'nightcore' as AudioVibeMode, label: '⚡ Nightcore', desc: '1.25x · Treble Sparkle', color: 'border-fuchsia-500/40 text-fuchsia-300' },
              { id: 'slowed' as AudioVibeMode, label: '🌙 Slowed + Reverb', desc: '0.85x · Deep Resonance', color: 'border-indigo-500/40 text-indigo-300' },
              { id: 'lofi' as AudioVibeMode, label: '📻 Vinyl Warmth', desc: '1.0x · Midrange Warmth', color: 'border-amber-500/40 text-amber-300' },
              { id: 'bass' as AudioVibeMode, label: '🚀 Bass Cannon', desc: '1.0x · Club Sub-Bass', color: 'border-emerald-500/40 text-emerald-300' },
            ].map((vibe) => {
              const isSelected = activeVibe === vibe.id;
              return (
                <button
                  key={vibe.id}
                  onClick={() => handleSelectVibe(vibe.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-white/15 border-white/50 ring-1 ring-white/30 shadow-md'
                      : 'bg-zinc-800/50 hover:bg-zinc-800 border-white/5'
                  }`}
                >
                  <div className="font-bold text-xs text-white flex items-center justify-between">
                    <span>{vibe.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1 font-mono">{vibe.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature 4B: Procedural Ambient Immersion Mixer */}
        <div className="p-5 md:p-6 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-cyan-400" />
                <span>Ambient Immersion Soundscape Mixer</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Blend procedural relaxing ambient sound layers under your music (zero bandwidth, 100% offline)
              </p>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Web Audio Generator</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {AMBIENT_LAYERS.map((layer) => {
              const isActive = ambientStates[layer.id];
              const vol = ambientVols[layer.id];

              return (
                <div
                  key={layer.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-zinc-800/90 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-zinc-800/40 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {layer.id === 'rain' && <CloudRain className="w-4 h-4 text-cyan-400" />}
                      {layer.id === 'coffeehouse' && <Coffee className="w-4 h-4 text-amber-400" />}
                      {layer.id === 'forest' && <Trees className="w-4 h-4 text-emerald-400" />}
                      {layer.id === 'cosmic' && <Moon className="w-4 h-4 text-purple-400" />}
                      <span className="text-xs font-bold text-white">{layer.name}</span>
                    </div>

                    <button
                      onClick={() => handleToggleAmbient(layer.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        isActive
                          ? 'bg-cyan-500 text-black shadow-sm'
                          : 'bg-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isActive ? 'Active' : 'Off'}
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug line-clamp-1 mb-3">
                    {layer.description}
                  </p>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3 h-3 text-zinc-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={vol}
                      onChange={(e) => handleAmbientVolume(layer.id, parseFloat(e.target.value))}
                      disabled={!isActive}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-400 bg-zinc-700 disabled:opacity-30"
                    />
                    <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">
                      {Math.round(vol * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature 4C: One-Touch Quick Studio Launchers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Quick Sleep Timer */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <Timer className="w-4 h-4" />
                <span>Quick Sleep Timer</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {sleepTimerRemaining ? `Fading out in ${sleepTimerRemaining} mins` : 'Auto-stop playback when you sleep'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => onSetSleepTimer?.(mins)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    sleepTimerRemaining === mins
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Vinyl Turntable Fullscreen Launcher */}
          <div
            onClick={onOpenTurntable}
            className="p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Disc className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                <span>Vinyl Studio View</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Realistic 33⅓ RPM analog turntable with dynamic tonearm & vinyl dust
              </p>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-300 font-semibold">
              <span>Open Turntable</span>
              <span>→</span>
            </div>
          </div>

          {/* Synchronized Lyrics Studio */}
          <div
            onClick={onOpenLyrics}
            className="p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Mic2 className="w-4 h-4" />
                <span>Karaoke Lyrics Mode</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Auto-scrolling line-by-line synchronized lyrics with romanized translations
              </p>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-300 font-semibold">
              <span>View Lyrics</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
