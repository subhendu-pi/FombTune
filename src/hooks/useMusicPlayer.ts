import { useState, useEffect, useCallback, useRef } from 'react';
import { PlaybackRepeat, Song } from '../types/music';
import { audioEngine } from '../services/audioEngine';
import { mediaSessionManager } from '../services/mediaSession';
import { INITIAL_SONGS } from '../data/musicData';

const STORAGE_KEY_REPEAT = 'fabtune_repeat';
const STORAGE_KEY_SHUFFLE = 'fabtune_shuffle';
const STORAGE_KEY_INFINITY = 'fabtune_infinity';
const STORAGE_KEY_AUTO_RECOMMEND = 'fabtune_auto_recommend';

interface UseMusicPlayerOptions {
  onSongPlayed?: (song: Song) => void;
  onShortcutFeedback?: (key: string, action: string) => void;
}

export function useMusicPlayer({ onSongPlayed, onShortcutFeedback }: UseMusicPlayerOptions = {}) {
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('fabtune_custom_songs');
      if (saved) {
        const parsed: Song[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((s) => !s.id.startsWith('track-'));
        }
      }
    } catch {}
    return INITIAL_SONGS;
  });

  const [currentSong, setCurrentSong] = useState<Song | null>(() => {
    try {
      const saved = localStorage.getItem('fabtune_custom_songs');
      if (saved) {
        const parsed: Song[] = JSON.parse(saved);
        const filtered = Array.isArray(parsed) ? parsed.filter((s) => !s.id.startsWith('track-')) : [];
        if (filtered.length > 0) return filtered[0];
      }
    } catch {}
    return null;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [queue, setQueue] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('fabtune_custom_songs');
      if (saved) {
        const parsed: Song[] = JSON.parse(saved);
        const filtered = Array.isArray(parsed) ? parsed.filter((s) => !s.id.startsWith('track-')) : [];
        if (filtered.length > 0) return filtered;
      }
    } catch {}
    return [];
  });
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const [repeatMode, setRepeatMode] = useState<PlaybackRepeat>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_REPEAT);
    return (saved as PlaybackRepeat) || 'all';
  });

  const [isShuffle, setIsShuffle] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_SHUFFLE) === 'true';
  });

  const [isInfinity, setIsInfinity] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INFINITY);
    return saved !== null ? saved === 'true' : true;
  });

  const [isAutoRecommend, setIsAutoRecommend] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTO_RECOMMEND);
    return saved !== null ? saved === 'true' : true;
  });

  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);

  // Keep ref to avoid stale closures in listeners
  const playerRef = useRef({
    currentSong,
    queue,
    repeatMode,
    isShuffle,
    isInfinity,
    recommendations,
    isAutoRecommend,
  });

  useEffect(() => {
    playerRef.current = {
      currentSong,
      queue,
      repeatMode,
      isShuffle,
      isInfinity,
      recommendations,
      isAutoRecommend,
    };
  }, [currentSong, queue, repeatMode, isShuffle, isInfinity, recommendations, isAutoRecommend]);

  // Persist playback settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REPEAT, repeatMode);
  }, [repeatMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHUFFLE, String(isShuffle));
  }, [isShuffle]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INFINITY, String(isInfinity));
  }, [isInfinity]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUTO_RECOMMEND, String(isAutoRecommend));
  }, [isAutoRecommend]);

  useEffect(() => {
    localStorage.setItem('fabtune_custom_songs', JSON.stringify(songs));
  }, [songs]);

  // Recommendation engine
  const fetchRecommendations = useCallback(async (targetSong: Song | null) => {
    if (!targetSong) return;
    setIsLoadingRecommendations(true);

    // 1. Instantly match relevant songs from existing catalogue
    const localMatches = songs.filter((s) => {
      if (s.id === targetSong.id) return false;
      const sameArtist = s.artist.toLowerCase() === targetSong.artist.toLowerCase();
      const genreA = (s.genre || '').toLowerCase();
      const genreB = (targetSong.genre || '').toLowerCase();
      const sameGenre =
        genreA.includes(genreB) ||
        genreB.includes(genreA) ||
        genreA.split('/')[0].trim() === genreB.split('/')[0].trim();
      return sameArtist || sameGenre;
    });

    localMatches.sort((a, b) => {
      if (a.artist === targetSong.artist && b.artist !== targetSong.artist) return -1;
      if (b.artist === targetSong.artist && a.artist !== targetSong.artist) return 1;
      return (b.plays || 0) - (a.plays || 0);
    });

    let combinedRecs: Song[] = [...localMatches];
    setRecommendations(combinedRecs);

    // 2. Fetch YouTube Music radio recommendations
    try {
      const vId = targetSong.videoId || (targetSong.id.startsWith('track-') ? '' : targetSong.id);
      const params = new URLSearchParams({
        videoId: vId,
        artist: targetSong.artist,
        genre: targetSong.genre,
        title: targetSong.title,
      });

      const res = await fetch(`/api/yt/recommendations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
          const existingIds = new Set(combinedRecs.map((r) => r.id));
          const ytRecs = data.recommendations.filter(
            (r: Song) => r.id !== targetSong.id && !existingIds.has(r.id)
          );
          combinedRecs = [...combinedRecs, ...ytRecs];
          setRecommendations(combinedRecs);
        }
      }
    } catch {
      // Offline fallback: local matches stay active
    } finally {
      setIsLoadingRecommendations(false);
    }

    // 3. Auto-queue recommendations if enabled
    if (playerRef.current.isAutoRecommend && combinedRecs.length > 0) {
      setQueue((prevQueue) => {
        const existingQueueIds = new Set(prevQueue.map((s) => s.id));
        const newTracksToAdd = combinedRecs
          .filter((s) => !existingQueueIds.has(s.id) && s.id !== targetSong.id)
          .slice(0, 5);

        return newTracksToAdd.length > 0 ? [...prevQueue, ...newTracksToAdd] : prevQueue;
      });
    }
  }, [songs]);

  // Play a specific song
  const playSong = useCallback(async (song: Song) => {
    let playableSong: Song = { ...song };

    // Fetch synchronized lyrics if missing
    if ((!playableSong.lyrics || playableSong.lyrics.length === 0) && (playableSong.videoId || playableSong.title)) {
      const qParams = new URLSearchParams({
        title: playableSong.title,
        artist: playableSong.artist,
        videoId: playableSong.videoId || (playableSong.id.startsWith('track-') ? '' : playableSong.id),
      });

      fetch(`/api/yt/lyrics?${qParams.toString()}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.lyrics && data.lyrics.length > 0) {
            setCurrentSong((prev) => (prev && prev.id === playableSong.id ? { ...prev, lyrics: data.lyrics } : prev));
          }
        })
        .catch(() => {});
    }

    // Ensure played song is retained in user songs library
    setSongs((prev) => (prev.some((s) => s.id === playableSong.id) ? prev : [playableSong, ...prev]));
    setQueue((prev) => (prev.some((s) => s.id === playableSong.id) ? prev : [...prev, playableSong]));

    setCurrentSong(playableSong);
    setDuration(playableSong.duration || 180);
    setCurrentTime(0);
    setIsPlaying(true);

    onSongPlayed?.(playableSong);
    mediaSessionManager.updateMetadata(playableSong);
    fetchRecommendations(playableSong);

    await audioEngine.loadAndPlay(playableSong, 0);
  }, [fetchRecommendations, onSongPlayed]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current.currentSong) return;
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((seconds: number) => {
    if (!playerRef.current.currentSong) return;
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
  }, []);

  const handleNextTrack = useCallback(() => {
    const { queue: currentQueue, currentSong: activeSong, isShuffle: shuffle, repeatMode: repeat, isInfinity: infinity, recommendations: recs } = playerRef.current;
    if (currentQueue.length === 0 || !activeSong) return;

    if (shuffle) {
      if (currentQueue.length === 1) {
        if (infinity && recs.length > 0) {
          const nextRec = recs.find((r) => r.id !== activeSong.id) || recs[0];
          setQueue((prev) => [...prev, nextRec]);
          playSong(nextRec);
          return;
        }
        playSong(currentQueue[0]);
        return;
      }
      const currentIndex = currentQueue.findIndex((s) => s.id === activeSong.id);
      let randIdx = Math.floor(Math.random() * currentQueue.length);
      if (randIdx === currentIndex) {
        randIdx = (randIdx + 1) % currentQueue.length;
      }
      playSong(currentQueue[randIdx]);
      return;
    }

    const currentIndex = currentQueue.findIndex((s) => s.id === activeSong.id);
    if (currentIndex >= 0 && currentIndex < currentQueue.length - 1) {
      playSong(currentQueue[currentIndex + 1]);
    } else if (repeat === 'all') {
      playSong(currentQueue[0]);
    } else if (infinity && recs.length > 0) {
      const queueIds = new Set(currentQueue.map((s) => s.id));
      const nextRec = recs.find((r) => !queueIds.has(r.id)) || recs[0];
      setQueue((prev) => [...prev, nextRec]);
      playSong(nextRec);
    } else {
      audioEngine.pause();
      setIsPlaying(false);
    }
  }, [playSong]);

  const handlePreviousTrack = useCallback(() => {
    if (currentTime > 4) {
      handleSeek(0);
      return;
    }
    const { queue: currentQueue, currentSong: activeSong } = playerRef.current;
    if (currentQueue.length === 0 || !activeSong) return;
    const currentIndex = currentQueue.findIndex((s) => s.id === activeSong.id);
    if (currentIndex > 0) {
      playSong(currentQueue[currentIndex - 1]);
    } else {
      playSong(currentQueue[currentQueue.length - 1]);
    }
  }, [currentTime, handleSeek, playSong]);

  // AudioEngine callbacks
  useEffect(() => {
    audioEngine.setCallbacks(
      (time) => {
        setCurrentTime(time);
      },
      () => {
        if (playerRef.current.repeatMode === 'one') {
          audioEngine.seek(0);
          audioEngine.play();
          return;
        }
        handleNextTrack();
      }
    );
  }, [handleNextTrack]);

  const timeRef = useRef({ currentTime, duration });
  useEffect(() => {
    timeRef.current = { currentTime, duration };
  }, [currentTime, duration]);

  // MediaSession API integration
  useEffect(() => {
    mediaSessionManager.init({
      onPlay: () => {
        audioEngine.play();
        setIsPlaying(true);
      },
      onPause: () => {
        audioEngine.pause();
        setIsPlaying(false);
      },
      onNext: () => handleNextTrack(),
      onPrevious: () => handlePreviousTrack(),
      onSeek: (seconds) => handleSeek(seconds),
      onRelativeSeek: (delta) => {
        const target = Math.max(
          0,
          Math.min(timeRef.current.duration, timeRef.current.currentTime + delta)
        );
        handleSeek(target);
      },
    });
  }, [handleNextTrack, handlePreviousTrack, handleSeek]);

  useEffect(() => {
    mediaSessionManager.updatePlaybackState(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    mediaSessionManager.updatePositionState(duration, currentTime, playbackSpeed);
  }, [duration, currentTime, playbackSpeed]);

  // Mount-time initial recommendations if a track is present
  useEffect(() => {
    if (currentSong) {
      fetchRecommendations(currentSong);
    }
  }, [currentSong, fetchRecommendations]);

  // Toggles and Controls
  const toggleRepeat = useCallback(() => {
    const modes: PlaybackRepeat[] = ['off', 'all', 'one'];
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
    const modeLabels: Record<PlaybackRepeat, string> = {
      off: 'Loop Off',
      all: 'Loop All',
      one: 'Loop Once',
    };
    onShortcutFeedback?.('Loop', modeLabels[next]);
  }, [repeatMode, onShortcutFeedback]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      onShortcutFeedback?.('Shuffle', next ? 'Shuffle ON' : 'Shuffle OFF');
      return next;
    });
  }, [onShortcutFeedback]);

  const toggleInfinity = useCallback(() => {
    setIsInfinity((prev) => {
      const next = !prev;
      onShortcutFeedback?.('Infinity', next ? 'Endless Autoplay ON' : 'Endless Autoplay OFF');
      return next;
    });
  }, [onShortcutFeedback]);

  const toggleAutoRecommend = useCallback(() => {
    setIsAutoRecommend((prev) => {
      const next = !prev;
      onShortcutFeedback?.('Queue Recs', next ? 'Auto Mode (Default)' : 'Manual Mode');
      if (next && recommendations.length > 0) {
        setQueue((currQueue) => {
          const queueIds = new Set(currQueue.map((s) => s.id));
          const toAdd = recommendations.filter((r) => !queueIds.has(r.id)).slice(0, 5);
          return toAdd.length > 0 ? [...currQueue, ...toAdd] : currQueue;
        });
      }
      return next;
    });
  }, [onShortcutFeedback, recommendations]);

  const handleAddRecommendationToQueue = useCallback((song: Song) => {
    setQueue((prev) => {
      if (prev.some((s) => s.id === song.id)) return prev;
      return [...prev, song];
    });
    onShortcutFeedback?.('Queue', `Added "${song.title.slice(0, 18)}"`);
  }, [onShortcutFeedback]);

  const handleAddAllRecommendations = useCallback(() => {
    setQueue((prev) => {
      const queueIds = new Set(prev.map((s) => s.id));
      const toAdd = recommendations.filter((r) => !queueIds.has(r.id));
      if (toAdd.length === 0) return prev;
      onShortcutFeedback?.('Queue', `Added ${toAdd.length} recommendations`);
      return [...prev, ...toAdd];
    });
  }, [onShortcutFeedback, recommendations]);

  const handleVolumeChange = useCallback((vol: number) => {
    setVolume(vol);
    setIsMuted(false);
    audioEngine.setVolume(vol);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      audioEngine.setMute(next);
      return next;
    });
  }, []);

  const handleSpeedChange = useCallback((spd: number) => {
    setPlaybackSpeed(spd);
    audioEngine.setPlaybackRate(spd);
  }, []);

  const handlePlayAllFromPlaylist = useCallback((playlistSongs: Song[], shuffle = false) => {
    if (playlistSongs.length === 0) return;
    setQueue(playlistSongs);
    if (shuffle) {
      setIsShuffle(true);
      const rand = Math.floor(Math.random() * playlistSongs.length);
      playSong(playlistSongs[rand]);
    } else {
      setIsShuffle(false);
      playSong(playlistSongs[0]);
    }
  }, [playSong]);

  const handleAddToQueue = useCallback((song: Song) => {
    setQueue((prev) => [...prev, song]);
  }, []);

  const handleRemoveQueueSong = useCallback((songId: string) => {
    setQueue((prev) => prev.filter((s) => s.id !== songId));
  }, []);

  const handleAddLocalSong = useCallback(
    (newSong: Song) => {
      setSongs((prev) => [newSong, ...prev.filter((s) => s.id !== newSong.id)]);
      setQueue((prev) => [newSong, ...prev.filter((s) => s.id !== newSong.id)]);
      playSong(newSong);
    },
    [playSong]
  );

  const pausePlayback = useCallback(() => {
    audioEngine.pause();
    setIsPlaying(false);
  }, []);

  return {
    songs,
    setSongs,
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
  };
}
