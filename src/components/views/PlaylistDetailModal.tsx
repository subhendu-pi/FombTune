import React from 'react';
import { Playlist, Song } from '../../types/music';
import { CoverArt } from '../common/CoverArt';
import { Play, Pause, Shuffle, Disc, X, Clock, Trash2, Heart } from 'lucide-react';

interface PlaylistDetailModalProps {
  playlist: Playlist;
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  likedSongIds: string[];
  onPlaySong: (song: Song) => void;
  onTogglePlay: () => void;
  onToggleLike: (songId: string) => void;
  onClose: () => void;
  onPlayAll: (songs: Song[], shuffle?: boolean) => void;
  onRemoveTrackFromPlaylist?: (playlistId: string, songId: string) => void;
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  playlist,
  songs,
  currentSong,
  isPlaying,
  likedSongIds,
  onPlaySong,
  onTogglePlay,
  onToggleLike,
  onClose,
  onPlayAll,
  onRemoveTrackFromPlaylist,
}) => {
  const playlistSongs = songs.filter((s) => playlist.songIds.includes(s.id));
  const totalDuration = playlistSongs.reduce((acc, curr) => acc + curr.duration, 0);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header Hero Banner */}
        <div
          className={`relative p-6 sm:p-8 bg-gradient-to-br ${playlist.coverGradient} flex flex-col sm:flex-row items-center sm:items-end gap-6 shrink-0`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-black/30 border border-white/20 shadow-2xl flex items-center justify-center shrink-0">
            <Disc className="w-16 h-16 text-white/80" />
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <span className="text-[11px] font-mono uppercase tracking-widest text-white/70">
              Playlist Collection
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate mt-1">
              {playlist.title}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 mt-1 line-clamp-2 leading-relaxed">
              {playlist.description}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-white/90 font-mono">
              <span>{playlistSongs.length} Tracks</span>
              <span>·</span>
              <span>{Math.floor(totalDuration / 60)} min total</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center gap-3 p-4 px-6 border-b border-white/10 bg-zinc-900/40 shrink-0">
          <button
            onClick={() => onPlayAll(playlistSongs, false)}
            disabled={playlistSongs.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 shadow-md transition-transform active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-black ml-0.5" />
            <span>Play All</span>
          </button>

          <button
            onClick={() => onPlayAll(playlistSongs, true)}
            disabled={playlistSongs.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition-colors disabled:opacity-50"
          >
            <Shuffle className="w-4 h-4" />
            <span>Shuffle</span>
          </button>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {playlistSongs.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              This playlist is currently empty.
            </div>
          ) : (
            playlistSongs.map((song, idx) => {
              const isCurrent = currentSong?.id === song.id;
              const isLiked = likedSongIds.includes(song.id);

              return (
                <div
                  key={`${song.id}-${idx}`}
                  onClick={() => onPlaySong(song)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-white/15 border-white/30'
                      : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="w-5 text-center text-xs font-mono text-zinc-500">
                      {idx + 1}
                    </span>
                    <CoverArt song={song} size="sm" />
                    <div className="min-w-0 pr-2">
                      <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-indigo-400' : 'text-white'}`}>
                        {song.title}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono tabular-nums text-zinc-400 hidden sm:inline">
                      {formatDuration(song.duration)}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(song.id);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-white"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    {playlist.isCustom && onRemoveTrackFromPlaylist && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTrackFromPlaylist(playlist.id, song.id);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                        title="Remove track from playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) {
                          onTogglePlay();
                        } else {
                          onPlaySong(song);
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-black" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
