import { Song } from '../types/music';

export interface MediaSessionCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onRelativeSeek?: (deltaSeconds: number) => void;
}

class MediaSessionManager {
  private isSupported: boolean = false;
  private currentSong: Song | null = null;
  private lastPosition: number = 0;
  private lastDuration: number = 180;
  private lastPositionUpdateTime: number = 0;
  private isHandlersRegistered: boolean = false;
  private callbacks: MediaSessionCallbacks | null = null;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'mediaSession' in navigator;
  }

  public init(callbacks: MediaSessionCallbacks) {
    this.callbacks = callbacks;
    if (!this.isSupported || this.isHandlersRegistered) return;

    try {
      const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
        ['play', () => {
          this.callbacks?.onPlay();
          this.updatePlaybackState(true);
        }],
        ['pause', () => {
          this.callbacks?.onPause();
          this.updatePlaybackState(false);
        }],
        ['previoustrack', () => {
          this.callbacks?.onPrevious();
        }],
        ['nexttrack', () => {
          this.callbacks?.onNext();
        }],
        ['stop', () => {
          this.callbacks?.onPause();
          this.updatePlaybackState(false);
        }],
        [
          'seekto',
          (details) => {
            if (details.seekTime !== undefined) {
              this.lastPosition = details.seekTime;
              this.callbacks?.onSeek(details.seekTime);
              this.updatePositionState(this.lastDuration, details.seekTime, 1.0, true);
            }
          },
        ],
        [
          'seekbackward',
          (details) => {
            const skip = details.seekOffset || 10;
            if (this.callbacks?.onRelativeSeek) {
              this.callbacks.onRelativeSeek(-skip);
            } else {
              const target = Math.max(0, this.lastPosition - skip);
              this.lastPosition = target;
              this.callbacks?.onSeek(target);
              this.updatePositionState(this.lastDuration, target, 1.0, true);
            }
          },
        ],
        [
          'seekforward',
          (details) => {
            const skip = details.seekOffset || 10;
            if (this.callbacks?.onRelativeSeek) {
              this.callbacks.onRelativeSeek(skip);
            } else {
              const target = Math.min(this.lastDuration, this.lastPosition + skip);
              this.lastPosition = target;
              this.callbacks?.onSeek(target);
              this.updatePositionState(this.lastDuration, target, 1.0, true);
            }
          },
        ],
      ];

      for (const [action, handler] of actions) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch {
          // Action not supported on this specific OS
        }
      }
      this.isHandlersRegistered = true;
    } catch (e) {
      console.warn('Failed to register MediaSession action handlers:', e);
    }
  }

  public updateMetadata(song: Song) {
    if (!this.isSupported) return;

    try {
      this.currentSong = song;
      const artworkSrc = song.coverUrl || '/pwa-512x512.png';

      // Provide multi-tier artwork with local PWA fallbacks to ensure the lock screen
      // album art renders reliably even when offline or behind CDN policies
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album || 'FabTune Music',
        artwork: [
          { src: artworkSrc, sizes: '512x512' },
          { src: artworkSrc, sizes: '384x384' },
          { src: artworkSrc, sizes: '256x256' },
          { src: artworkSrc, sizes: '192x192' },
          { src: artworkSrc, sizes: '128x128' },
          { src: artworkSrc, sizes: '96x96' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        ],
      });
    } catch (e) {
      console.warn('Failed to update MediaMetadata:', e);
    }
  }

  public updatePlaybackState(isPlaying: boolean) {
    if (!this.isSupported) return;

    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {
      // Ignored
    }
  }

  // Updates lock screen duration and scrub position with optimal throttling for SystemUI
  public updatePositionState(
    duration: number,
    currentTime: number,
    playbackRate = 1.0,
    force = false
  ) {
    if (!this.isSupported || typeof navigator.mediaSession.setPositionState !== 'function') return;

    const now = performance.now();
    // Throttle to at most once every 1000ms unless forced (e.g. on seek or track start)
    if (!force && now - this.lastPositionUpdateTime < 1000) {
      return;
    }
    this.lastPositionUpdateTime = now;

    this.lastPosition = currentTime;
    this.lastDuration = duration;

    try {
      if (duration > 0 && currentTime >= 0 && currentTime <= duration + 1) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(1, duration),
          playbackRate: Math.max(0.1, playbackRate),
          position: Math.min(Math.max(0, currentTime), duration),
        });
      }
    } catch {
      // Ignored on edge cases
    }
  }
}

export const mediaSessionManager = new MediaSessionManager();
