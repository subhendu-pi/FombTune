import React, { useState, useRef } from 'react';
import { Playlist, Song } from '../../types/music';
import { CoverArt } from '../common/CoverArt';
import {
  Heart,
  Plus,
  Disc,
  Upload,
  Download,
  Trash2,
  Play,
  Pause,
  Library,
  Check,
  FileAudio,
} from 'lucide-react';

interface LibraryViewProps {
  songs: Song[];
  playlists: Playlist[];
  likedSongIds: string[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onTogglePlay: () => void;
  onToggleLike: (songId: string) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onCreatePlaylist: (title: string, description: string) => void;
  onDeletePlaylist: (id: string) => void;
  onAddLocalSong: (song: Song) => void;
  onImportBackup: (data: { playlists: Playlist[]; likedSongIds: string[] }) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  songs,
  playlists,
  likedSongIds,
  currentSong,
  isPlaying,
  onPlaySong,
  onTogglePlay,
  onToggleLike,
  onSelectPlaylist,
  onCreatePlaylist,
  onDeletePlaylist,
  onAddLocalSong,
  onImportBackup,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'local'>('playlists');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const likedSongs = songs.filter((s) => likedSongIds.includes(s.id));
  const localSongs = songs.filter((s) => s.audioType === 'local');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylist(newTitle.trim(), newDesc.trim() || 'Custom user playlist');
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const fileName = file.name.replace(/\.[^/.]+$/, '');

    const newLocalSong: Song = {
      id: `local-${Date.now()}`,
      title: fileName,
      artist: 'Local Device File',
      album: 'Local Audio',
      duration: 180, // estimated or updated upon load
      genre: 'Local',
      year: new Date().getFullYear(),
      plays: 1,
      coverGradient: 'from-amber-700 via-orange-800 to-zinc-950',
      accentColor: '#f59e0b',
      coverArtworkType: 'acoustic',
      audioType: 'local',
      audioUrl: fileUrl,
      lyrics: [
        { time: 0, text: `♪ Playing local audio: ${fileName} ♪` },
        { time: 10, text: 'Custom uploaded audio stream' },
      ],
    };

    onAddLocalSong(newLocalSong);
    onPlaySong(newLocalSong);
    setActiveTab('local');
  };

  const handleExportBackup = () => {
    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      playlists,
      likedSongIds,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fabtune_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.playlists || parsed.likedSongIds) {
          onImportBackup({
            playlists: parsed.playlists || [],
            likedSongIds: parsed.likedSongIds || [],
          });
          alert('Backup restored successfully!');
        }
      } catch (err) {
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-widest">
            <Library className="w-4 h-4" />
            <span>Personal Collection</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
            Your Library
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Local Song File Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-white/10 transition-colors"
            title="Import audio file (MP3, WAV, FLAC, OGG)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Audio</span>
          </button>

          {/* Backup & Restore */}
          <input
            ref={backupInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackupFile}
            className="hidden"
          />
          <button
            onClick={handleExportBackup}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 transition-colors"
            title="Export Playlists Backup JSON"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => backupInputRef.current?.click()}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 transition-colors"
            title="Restore Playlists Backup JSON"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
          </button>

          {/* Create Playlist Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold shadow-md transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Playlist</span>
          </button>
        </div>
      </div>

      {/* Library Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'playlists'
              ? 'bg-white/15 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Playlists ({playlists.length})
        </button>
        <button
          onClick={() => setActiveTab('liked')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'liked'
              ? 'bg-white/15 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Liked Songs ({likedSongs.length})
        </button>
        <button
          onClick={() => setActiveTab('local')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'local'
              ? 'bg-white/15 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Local Files ({localSongs.length})
        </button>
      </div>

      {/* TAB 1: Playlists */}
      {activeTab === 'playlists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Liked Songs Special Card */}
          <div
            onClick={() => setActiveTab('liked')}
            className="group p-5 rounded-2xl bg-gradient-to-br from-rose-900/60 via-purple-900/40 to-zinc-900 border border-rose-500/20 hover:border-rose-500/40 cursor-pointer transition-all flex flex-col justify-between h-44 shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400">
              <Heart className="w-6 h-6 fill-current" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                Liked Songs
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {likedSongs.length} favorite tracks
              </p>
            </div>
          </div>

          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl)}
              className="group p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between h-44"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pl.coverGradient} flex items-center justify-center shadow-md`}
                >
                  <Disc className="w-6 h-6 text-white" />
                </div>

                {pl.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete playlist "${pl.title}"?`)) {
                        onDeletePlaylist(pl.id);
                      }
                    }}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                  {pl.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{pl.description}</p>
                <span className="text-[11px] font-mono text-zinc-500 block mt-2">
                  {pl.songIds.length} tracks
                </span>
              </div>
            </div>
          ))}

          {playlists.length === 0 && (
            <div
              onClick={() => setShowCreateModal(true)}
              className="p-5 rounded-2xl border border-dashed border-white/20 hover:border-indigo-400/50 bg-zinc-900/30 hover:bg-zinc-900/60 cursor-pointer transition-all flex flex-col items-center justify-center text-center h-44 group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mt-3">
                Create First Playlist
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-[200px]">
                Organize your favorite tracks into custom collections
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Liked Songs */}
      {activeTab === 'liked' && (
        <div className="space-y-3">
          {likedSongs.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              You haven\'t liked any songs yet. Tap the heart icon while listening to save tracks here!
            </div>
          ) : (
            likedSongs.map((song) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => onPlaySong(song)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-white/15 border-white/30'
                      : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <CoverArt song={song} size="sm" />
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                      <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(song.id);
                      }}
                      className="p-2 text-rose-500 hover:text-rose-400"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlaySong(song);
                      }}
                      className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"
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
      )}

      {/* TAB 3: Local Files */}
      {activeTab === 'local' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 rounded-3xl border-2 border-dashed border-white/20 hover:border-indigo-400/50 bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
          >
            <FileAudio className="w-10 h-10 text-indigo-400 mb-2" />
            <h3 className="text-sm font-bold text-white">Upload / Play Local Audio Files</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Supports MP3, WAV, FLAC, OGG, AAC from your computer. Run through the live 10-band EQ!
            </p>
          </div>

          <div className="space-y-2">
            {localSongs.map((song) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => onPlaySong(song)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-white/15 border-white/30'
                      : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-indigo-900/60 flex items-center justify-center shrink-0">
                      <FileAudio className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                      <p className="text-xs text-zinc-400 truncate">Device Audio</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlaySong(song);
                    }}
                    className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-black" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md p-6 rounded-3xl bg-zinc-900 border border-white/15 shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-bold text-white">Create New Playlist</h3>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Playlist Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Synthwave Night Drive"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Description (Optional)
              </label>
              <textarea
                placeholder="A description for your playlist..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
