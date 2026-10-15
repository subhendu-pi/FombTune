import React from 'react';
import { PlaybackRepeat, Song } from '../../types/music';
import { CoverArt } from '../common/CoverArt';
import {
  Play,
  Pause,
  Trash2,
  ListMusic,
  Shuffle,
  Repeat,
  Repeat1,
  Infinity,
  Sparkles,
  Plus,
  RefreshCw,
  Check,
  Radio,
} from 'lucide-react';

interface QueueViewProps {
  queue: Song[];
  currentSong: Song;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onRemoveFromQueue: (songId: string) => void;
  onClearQueue?: () => void;
  accentColor?: string;

  // Recommendations & Modes
  recommendations?: Song[];
  isLoadingRecommendations?: boolean;
  isAutoRecommend?: boolean;
  onToggleAutoRecommend?: () => void;
  onAddRecommendationToQueue?: (song: Song) => void;
  onAddAllRecommendations?: () => void;
  onRefreshRecommendations?: () => void;

  // Playback options
  isInfinity?: boolean;
  onToggleInfinity?: () => void;
  repeatMode?: PlaybackRepeat;
  onToggleRepeat?: () => void;
  isShuffle?: boolean;
  onToggleShuffle?: () => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  queue,
  currentSong,
  isPlaying,
  onPlaySong,
  onRemoveFromQueue,
  accentColor = '#818cf8',
  recommendations = [],
  isLoadingRecommendations = false,
  isAutoRecommend = true,
  onToggleAutoRecommend,
  onAddRecommendationToQueue,
  onAddAllRecommendations,
  onRefreshRecommendations,
  isInfinity = true,
  onToggleInfinity,
  repeatMode = 'all',
  onToggleRepeat,
  isShuffle = false,
  onToggleShuffle,
}) => {
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col h-full max-h-[500px] p-2 select-none">
      {/* Top Controls Bar: Queue title + Options: Infinity, Repeat (3-tap), Shuffle */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-2.5 text-xs font-semibold text-zinc-400 border-b border-white/10 mb-2">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-indigo-400" />
          <span className="text-zinc-200">Queue ({queue.length} Tracks)</span>
        </div>

        {/* Options Toolbar */}
        <div className="flex items-center gap-1.5">
          {/* 1. Infinity (Endless Autoplay) Mode Toggle */}
          {onToggleInfinity && (
            <button
              onClick={onToggleInfinity}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                isInfinity
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40 shadow-sm'
                  : 'bg-zinc-800/80 text-zinc-400 border-white/5 hover:text-white'
              }`}
              title={`Infinity Autoplay: ${isInfinity ? 'ON (Endless Radio)' : 'OFF'}`}
            >
              <Infinity className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium hidden sm:inline">Infinity</span>
            </button>
          )}

          {/* 2. Shuffle Toggle */}
          {onToggleShuffle && (
            <button
              onClick={onToggleShuffle}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                isShuffle
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40 shadow-sm'
                  : 'bg-zinc-800/80 text-zinc-400 border-white/5 hover:text-white'
              }`}
              title={`Shuffle: ${isShuffle ? 'ON' : 'OFF'}`}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 3. 3-Tap Repeat / Loop Button: (Off -> All -> One) */}
          {onToggleRepeat && (
            <button
              onClick={onToggleRepeat}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                repeatMode !== 'off'
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40 shadow-sm'
                  : 'bg-zinc-800/80 text-zinc-400 border-white/5 hover:text-white'
              }`}
              title={`Loop Mode (Tap to cycle): ${
                repeatMode === 'one' ? 'Loop Once' : repeatMode === 'all' ? 'Loop All' : 'Loop Off'
              }`}
            >
              {repeatMode === 'one' ? (
                <>
                  <Repeat1 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-mono">Once</span>
                </>
              ) : (
                <>
                  <Repeat className={`w-3.5 h-3.5 ${repeatMode === 'all' ? 'text-indigo-400' : 'opacity-40'}`} />
                  <span className="text-[10px] font-mono">{repeatMode === 'all' ? 'All' : 'Off'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Container with Current Queue + Recommendations Section */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 py-1">
        {/* Current Active Queue */}
        <div className="space-y-1.5">
          {queue.map((track, idx) => {
            const isCurrent = track.id === currentSong.id;
            return (
              <div
                key={`${track.id}-${idx}`}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 ${
                  isCurrent
                    ? 'bg-white/10 border border-white/20'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div
                  onClick={() => onPlaySong(track)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <div className="relative group shrink-0">
                    <CoverArt song={track} size="sm" />
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col min-w-0 pr-2">
                    <p
                      className={`text-sm font-medium truncate ${
                        isCurrent ? 'text-white font-semibold' : 'text-zinc-200'
                      }`}
                      style={{ color: isCurrent ? accentColor : undefined }}
                    >
                      {track.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono tabular-nums text-zinc-400">
                    {formatDuration(track.duration)}
                  </span>
                  {queue.length > 1 && (
                    <button
                      onClick={() => onRemoveFromQueue(track.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* =========================================================================
            RECOMMENDED SONGS SECTION (Auto / Manual Mode)
            ========================================================================= */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Queue Recommendations
              </span>
            </div>

            {/* Auto vs Manual Mode Switch */}
            <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => {
                  if (!isAutoRecommend) onToggleAutoRecommend?.();
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  isAutoRecommend
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Automatically queue relevant songs when tracks play/end"
              >
                Auto (Default)
              </button>
              <button
                onClick={() => {
                  if (isAutoRecommend) onToggleAutoRecommend?.();
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  !isAutoRecommend
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Manually inspect and add recommended songs"
              >
                Manual
              </button>
            </div>
          </div>

          {/* Auto Mode Informational Banner */}
          {isAutoRecommend && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>
                  Autoplay will seamlessly play similar songs after &ldquo;{currentSong.title}&rdquo;
                </span>
              </div>
              {onRefreshRecommendations && (
                <button
                  onClick={onRefreshRecommendations}
                  disabled={isLoadingRecommendations}
                  className="p-1 text-indigo-300 hover:text-white rounded-lg transition-colors"
                  title="Refresh recommendations"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecommendations ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          )}

          {/* Manual Mode: Actions Bar */}
          {!isAutoRecommend && recommendations.length > 0 && onAddAllRecommendations && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-zinc-400">
                {recommendations.length} songs tailored to your vibe
              </span>
              <button
                onClick={onAddAllRecommendations}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add All to Queue</span>
              </button>
            </div>
          )}

          {/* Recommendation Tracks List */}
          <div className="space-y-1.5">
            {isLoadingRecommendations && recommendations.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Finding matching songs...</span>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="py-4 text-center text-xs text-zinc-500">
                Play any song to load smart queue recommendations.
              </div>
            ) : (
              recommendations.slice(0, 6).map((recSong, idx) => (
                <div
                  key={`${recSong.id}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                >
                  <div
                    onClick={() => onPlaySong(recSong)}
                    className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                  >
                    <CoverArt song={recSong} size="xs" />
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-white truncate">{recSong.title}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{recSong.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onAddRecommendationToQueue?.(recSong)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                      title="Add to queue"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onPlaySong(recSong)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white text-white hover:text-black transition-colors"
                      title="Play now"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
