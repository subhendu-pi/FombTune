import React, { useState, useEffect, useCallback } from 'react';
import {
  ActiveTab,
  ColorTheme,
  Playlist,
  Song,
  ThemeBrightness,
  UserListeningStats,
} from './types/music';
import { INITIAL_PLAYLISTS, INITIAL_SONGS } from './data/musicData';
import { useMusicPlayer } from './hooks/useMusicPlayer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSleepTimer } from './hooks/useSleepTimer';

// Navigation & Modals
import { HeaderNav } from './components/navigation/HeaderNav';
import { MobileNavBar } from './components/navigation/MobileNavBar';
import { KeyboardShortcutToast } from './components/common/KeyboardShortcutToast';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

// Views
import { HomeView } from './components/views/HomeView';
import { ExploreView } from './components/views/ExploreView';
import { LibraryView } from './components/views/LibraryView';
import { SearchView } from './components/views/SearchView';
import { SettingsModal } from './components/views/SettingsModal';
import { PlaylistDetailModal } from './components/views/PlaylistDetailModal';
import { WrappedModal } from './components/wrapped/WrappedModal';

// Player Components
import { MiniPlayer } from './components/player/MiniPlayer';
import { FullPlayerModal } from './components/player/FullPlayerModal';

const STORAGE_KEY_LIKES = 'fabtune_liked_ids';
const STORAGE_KEY_PLAYLISTS = 'fabtune_playlists';
const STORAGE_KEY_THEME = 'fabtune_theme';
const STORAGE_KEY_BRIGHTNESS = 'fabtune_brightness';
const STORAGE_KEY_STATS = 'fabtune_stats';
const STORAGE_KEY_RECENTLY_PLAYED = 'fabtune_recently_played';

const ACCENT_COLORS: Record<ColorTheme, string> = {
  'monet-teal': '#14b8a6',
  'monet-purple': '#818cf8',
  'sunset-amber': '#f59e0b',
  'cyber-blue': '#06b6d4',
  'forest-emerald': '#10b981',
  'rose-quartz': '#f43f5e',
};

export default function App() {
  // Navigation & Modal Views
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showFullPlayer, setShowFullPlayer] = useState<boolean>(false);
  const [showWrapped, setShowWrapped] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Appearance Themes
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    return (localStorage.getItem(STORAGE_KEY_THEME) as ColorTheme) || 'monet-teal';
  });

  const [themeBrightness, setThemeBrightness] = useState<ThemeBrightness>(() => {
    return (localStorage.getItem(STORAGE_KEY_BRIGHTNESS) as ThemeBrightness) || 'dark';
  });

  // Playlists & Favorites (purges default 4 playlists if in cache)
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYLISTS);
      if (saved) {
        const parsed: Playlist[] = JSON.parse(saved);
        return parsed.filter(
          (p) => !['pl-lofi', 'pl-synthwave', 'pl-acoustic', 'pl-top50'].includes(p.id)
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  // Recently / Already Played Tracks (Vertical 3-bar stack on Home)
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECENTLY_PLAYED);
      if (saved) {
        const parsed: Song[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((s) => s && !s.id.startsWith('track-'));
        }
      }
    } catch {}
    return [];
  });

  const [likedSongIds, setLikedSongIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LIKES);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((id) => !id.startsWith('track-'));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Listening Stats for Wrapped
  const [stats, setStats] = useState<UserListeningStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.playedTrackCounts) {
          const cleaned: Record<string, number> = {};
          for (const [k, v] of Object.entries(parsed.playedTrackCounts)) {
            if (!k.startsWith('track-')) cleaned[k] = v as number;
          }
          parsed.playedTrackCounts = cleaned;
        }
        return parsed;
      }
    } catch {}
    return {
      totalMinutes: 0,
      topSongId: '',
      topArtist: 'Explorer',
      topGenre: 'Discovering',
      playedTrackCounts: {},
      personaTitle: 'Music Pioneer',
      personaDescription:
        'Your library is a blank slate. Search and stream tracks via YouTube Music or upload local audio files to craft your listening journey.',
    };
  });

  // Persist State
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(likedSongIds));
  }, [likedSongIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BRIGHTNESS, themeBrightness);
  }, [themeBrightness]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECENTLY_PLAYED, JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  // Haptic feedback trigger for mobile devices
  const triggerHaptic = useCallback((ms = 10) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(ms);
      } catch {}
    }
  }, []);

  // Update listening stats and recently played on track playback
  const handleSongPlayed = useCallback((song: Song) => {
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((s) => s.id !== song.id);
      return [song, ...filtered].slice(0, 10);
    });

    setStats((prev) => {
      const currentCount = prev.playedTrackCounts[song.id] || 0;
      return {
        ...prev,
        totalMinutes: prev.totalMinutes + Math.round((song.duration || 180) / 60),
        playedTrackCounts: {
          ...prev.playedTrackCounts,
          [song.id]: currentCount + 1,
        },
      };
    });
  }, []);

  // Music Player Core Engine Hook
  const {
    songs,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    queue,
    setQueue,
    volume,
    isMuted,
    playbackSpeed,
    repeatMode,
    isShuffle,
    isInfinity,
    isAutoRecommend,
    recommendations,
    isLoadingRecommendations,
    playSong,
    togglePlay,
    handleSeek,
    handleNextTrack,
    handlePreviousTrack,
    toggleRepeat,
    toggleShuffle,
    toggleInfinity,
    toggleAutoRecommend,
    handleAddRecommendationToQueue,
    handleAddAllRecommendations,
    handleVolumeChange,
    toggleMute,
    handleSpeedChange,
    handlePlayAllFromPlaylist,
    handleAddToQueue,
    handleRemoveQueueSong,
    handleAddLocalSong,
    fetchRecommendations,
    pausePlayback,
  } = useMusicPlayer({
    onSongPlayed: handleSongPlayed,
    onShortcutFeedback: (key, action) => showShortcutFeedback(key, action),
  });

  // Sleep Timer Hook
  const { sleepTimerRemaining, handleSetSleepTimer } = useSleepTimer({
    onTimerExpire: pausePlayback,
  });

  // Global Keyboard Shortcuts Hook with HUD Toast
  const { keyboardToast, showShortcutFeedback } = useKeyboardShortcuts({
    togglePlay,
    handleSeek,
    handleNextTrack,
    handlePreviousTrack,
    handleVolumeChange,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    toggleInfinity,
    currentTime,
    duration,
    volume,
    isPlaying,
    isMuted,
    onOpenSearch: () => setActiveTab('search'),
  });

  // Playlist Management Handlers
  const handleCreatePlaylist = (title: string, description: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      title,
      description,
      coverGradient: 'from-fuchsia-600 via-purple-700 to-indigo-950',
      songIds: currentSong ? [currentSong.id] : [],
      createdAt: new Date().toISOString().slice(0, 10),
      isCustom: true,
    };
    setPlaylists((prev) => [newPl, ...prev]);
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    if (selectedPlaylist?.id === id) {
      setSelectedPlaylist(null);
    }
  };

  const handleRemoveTrackFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId ? { ...p, songIds: p.songIds.filter((id) => id !== songId) } : p
      )
    );
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist((prev) =>
        prev ? { ...prev, songIds: prev.songIds.filter((id) => id !== songId) } : null
      );
    }
  };

  const handlePlayPhaseShuffle = useCallback(
    (phaseSongs: Song[]) => {
      if (phaseSongs.length === 0) return;
      setQueue(phaseSongs);
      if (!isShuffle) {
        toggleShuffle();
      }
      playSong(phaseSongs[0]);
    },
    [isShuffle, playSong, setQueue, toggleShuffle]
  );

  const toggleLike = (songId: string) => {
    setLikedSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  const handleResetData = () => {
    setPlaylists(INITIAL_PLAYLISTS);
    setLikedSongIds(['track-1', 'track-2']);
    setColorTheme('monet-teal');
    setThemeBrightness('dark');
  };

  const getThemeBgClass = () => {
    if (themeBrightness === 'oled') return 'bg-black text-white';
    if (themeBrightness === 'light') return 'bg-slate-50 text-slate-900';
    return 'bg-zinc-950 text-white';
  };

  const accentHex = ACCENT_COLORS[colorTheme] || '#14b8a6';

  return (
    <div className={`min-h-screen ${getThemeBgClass()} flex flex-col transition-colors duration-300 font-sans`}>
      {/* Offline Connectivity Notification Banner */}
      <OfflineIndicator />

      {/* Keyboard Shortcut HUD Toast */}
      <KeyboardShortcutToast toast={keyboardToast} />

      {/* Top Navigation Bar */}
      <HeaderNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentHex={accentHex}
        onOpenWrapped={() => setShowWrapped(true)}
        onOpenFullPlayer={() => setShowFullPlayer(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 pt-4 sm:pt-6 pb-36 md:pb-28">
        {activeTab === 'home' && (
          <HomeView
            songs={songs}
            playlists={playlists}
            currentSong={currentSong}
            isPlaying={isPlaying}
            likedSongIds={likedSongIds}
            recentlyPlayed={recentlyPlayed}
            onPlaySong={playSong}
            onTogglePlay={togglePlay}
            onToggleLike={toggleLike}
            onSelectPlaylist={setSelectedPlaylist}
            onOpenWrapped={() => setShowWrapped(true)}
            onAddToQueue={handleAddToQueue}
            onPlayPhaseShuffle={handlePlayPhaseShuffle}
            onOpenTurntable={() => setShowFullPlayer(true)}
            onOpenLyrics={() => setShowFullPlayer(true)}
            onSetSleepTimer={handleSetSleepTimer}
            sleepTimerRemaining={sleepTimerRemaining}
            onSpeedChange={handleSpeedChange}
            speed={playbackSpeed}
            onNavigateTab={setActiveTab}
            onAddLocalSong={handleAddLocalSong}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreView
            songs={songs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            likedSongIds={likedSongIds}
            onPlaySong={playSong}
            onToggleLike={toggleLike}
          />
        )}

        {activeTab === 'library' && (
          <LibraryView
            songs={songs}
            playlists={playlists}
            likedSongIds={likedSongIds}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlaySong={playSong}
            onTogglePlay={togglePlay}
            onToggleLike={toggleLike}
            onSelectPlaylist={setSelectedPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onAddLocalSong={handleAddLocalSong}
            onImportBackup={(data) => {
              setPlaylists(data.playlists);
              setLikedSongIds(data.likedSongIds);
            }}
          />
        )}

        {activeTab === 'search' && (
          <SearchView
            songs={songs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            likedSongIds={likedSongIds}
            onPlaySong={playSong}
            onToggleLike={toggleLike}
            onAddToQueue={handleAddToQueue}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Dock */}
      <MobileNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentHex={accentHex}
        onTriggerHaptic={triggerHaptic}
      />

      {/* Pinned Bottom MiniPlayer */}
      {currentSong && (
        <MiniPlayer
          song={currentSong}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          isLiked={likedSongIds.includes(currentSong.id)}
          onTogglePlay={togglePlay}
          onNext={handleNextTrack}
          onToggleLike={toggleLike}
          onOpenFullPlayer={() => setShowFullPlayer(true)}
          repeatMode={repeatMode}
          onToggleRepeat={toggleRepeat}
          isShuffle={isShuffle}
          onToggleShuffle={toggleShuffle}
          isInfinity={isInfinity}
          onToggleInfinity={toggleInfinity}
        />
      )}

      {/* Full Player Modal */}
      {showFullPlayer && currentSong && (
        <FullPlayerModal
          song={currentSong}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          repeatMode={repeatMode}
          isShuffle={isShuffle}
          isLiked={likedSongIds.includes(currentSong.id)}
          queue={queue}
          speed={playbackSpeed}
          remainingSleepTimerMinutes={sleepTimerRemaining}
          onClose={() => setShowFullPlayer(false)}
          onTogglePlay={togglePlay}
          onSeek={handleSeek}
          onNext={handleNextTrack}
          onPrevious={handlePreviousTrack}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute}
          onToggleRepeat={toggleRepeat}
          onToggleShuffle={toggleShuffle}
          onToggleLike={toggleLike}
          onSpeedChange={handleSpeedChange}
          onSetSleepTimer={handleSetSleepTimer}
          onPlayQueueSong={playSong}
          onRemoveQueueSong={handleRemoveQueueSong}
          isInfinity={isInfinity}
          onToggleInfinity={toggleInfinity}
          recommendations={recommendations}
          isLoadingRecommendations={isLoadingRecommendations}
          isAutoRecommend={isAutoRecommend}
          onToggleAutoRecommend={toggleAutoRecommend}
          onAddRecommendationToQueue={handleAddRecommendationToQueue}
          onAddAllRecommendations={handleAddAllRecommendations}
          onRefreshRecommendations={() => fetchRecommendations(currentSong)}
        />
      )}

      {/* Playlist Detail Modal */}
      {selectedPlaylist && (
        <PlaylistDetailModal
          playlist={selectedPlaylist}
          songs={songs}
          currentSong={currentSong}
          isPlaying={isPlaying}
          likedSongIds={likedSongIds}
          onPlaySong={playSong}
          onTogglePlay={togglePlay}
          onToggleLike={toggleLike}
          onClose={() => setSelectedPlaylist(null)}
          onPlayAll={handlePlayAllFromPlaylist}
          onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
        />
      )}

      {/* FabTune Wrapped Modal */}
      {showWrapped && (
        <WrappedModal
          stats={stats}
          songs={songs}
          onPlaySong={playSong}
          onClose={() => setShowWrapped(false)}
        />
      )}

      {/* Settings & Appearance Modal */}
      {showSettings && (
        <SettingsModal
          colorTheme={colorTheme}
          themeBrightness={themeBrightness}
          onColorThemeChange={setColorTheme}
          onThemeBrightnessChange={setThemeBrightness}
          onClose={() => setShowSettings(false)}
          onResetData={handleResetData}
        />
      )}
    </div>
  );
}
