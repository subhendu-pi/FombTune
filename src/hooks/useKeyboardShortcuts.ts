import { useState, useRef, useEffect, useCallback } from 'react';

interface UseKeyboardShortcutsProps {
  togglePlay: () => void;
  handleSeek: (seconds: number) => void;
  handleNextTrack: () => void;
  handlePreviousTrack: () => void;
  handleVolumeChange: (volume: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleInfinity: () => void;
  currentTime: number;
  duration: number;
  volume: number;
  isPlaying: boolean;
  isMuted: boolean;
  onOpenSearch?: () => void;
}

export function useKeyboardShortcuts({
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
  onOpenSearch,
}: UseKeyboardShortcutsProps) {
  const [keyboardToast, setKeyboardToast] = useState<{ key: string; action: string } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showShortcutFeedback = useCallback((key: string, action: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setKeyboardToast({ key, action });
    toastTimeoutRef.current = window.setTimeout(() => {
      setKeyboardToast(null);
    }, 1200);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is actively interacting with form controls
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // 1. Space: Play / Pause
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        togglePlay();
        showShortcutFeedback('Space', isPlaying ? 'Pause' : 'Play');
        return;
      }

      // 2. ArrowLeft: Seek backward 5 seconds
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const newTime = Math.max(0, currentTime - 5);
        handleSeek(newTime);
        showShortcutFeedback('←', `-5s (${Math.floor(newTime)}s)`);
        return;
      }

      // 3. ArrowRight: Seek forward 5 seconds
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const newTime = Math.min(duration, currentTime + 5);
        handleSeek(newTime);
        showShortcutFeedback('→', `+5s (${Math.floor(newTime)}s)`);
        return;
      }

      // 4. J: Previous track
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        handlePreviousTrack();
        showShortcutFeedback('J', 'Previous Track');
        return;
      }

      // 5. K: Next track
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handleNextTrack();
        showShortcutFeedback('K', 'Next Track');
        return;
      }

      // 6. ArrowUp: Volume up by 5%
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const nextVol = Math.min(1, Math.round((volume + 0.05) * 100) / 100);
        handleVolumeChange(nextVol);
        showShortcutFeedback('↑', `Volume ${Math.round(nextVol * 100)}%`);
        return;
      }

      // 7. ArrowDown: Volume down by 5%
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextVol = Math.max(0, Math.round((volume - 0.05) * 100) / 100);
        handleVolumeChange(nextVol);
        showShortcutFeedback('↓', `Volume ${Math.round(nextVol * 100)}%`);
        return;
      }

      // 8. M: Mute / Unmute
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
        showShortcutFeedback('M', isMuted ? 'Unmuted' : 'Muted');
        return;
      }

      // 9. L or R: 3-Tap Loop (Off -> All -> Once)
      if (e.key === 'l' || e.key === 'L' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        toggleRepeat();
        return;
      }

      // 10. S: Shuffle
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        toggleShuffle();
        return;
      }

      // 11. I: Infinity Autoplay
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        toggleInfinity();
        return;
      }

      // 12. / : Focus search
      if (e.key === '/' && onOpenSearch) {
        e.preventDefault();
        onOpenSearch();
        showShortcutFeedback('/', 'Search Songs');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    handleSeek,
    handleNextTrack,
    handlePreviousTrack,
    handleVolumeChange,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    toggleInfinity,
    onOpenSearch,
    showShortcutFeedback,
  ]);

  return {
    keyboardToast,
    showShortcutFeedback,
  };
}
