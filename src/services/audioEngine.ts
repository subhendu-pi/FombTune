import { EQPreset, Song } from '../types/music';
import { backgroundPlayerService } from './backgroundPlayer';
import { mediaSessionManager } from './mediaSession';

export const EQ_FREQUENCIES = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
export const EQ_LABELS = ['60Hz', '170Hz', '310Hz', '600Hz', '1kHz', '3kHz', '6kHz', '12kHz', '14kHz', '16kHz'];

export const EQ_PRESETS: EQPreset[] = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Bass Boost', gains: [7, 6, 4, 2, 0, 0, 1, 2, 3, 3] },
  { name: 'Lo-Fi Warmth', gains: [4, 5, 3, 1, -1, -2, -2, -4, -6, -8] },
  { name: 'Vocal Booster', gains: [-2, -1, 1, 3, 5, 4, 3, 1, 0, -1] },
  { name: 'Electronic', gains: [6, 5, 2, 0, -1, 2, 3, 4, 5, 6] },
  { name: 'Rock / Dynamic', gains: [5, 4, -1, -2, 0, 2, 4, 5, 4, 3] },
  { name: 'Acoustic / Live', gains: [3, 2, 1, 2, 3, 3, 3, 4, 3, 2] },
  { name: 'Treble Crisp', gains: [-3, -2, -1, 0, 1, 3, 5, 7, 8, 9] },
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private audioElement: HTMLAudioElement | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;

  private currentSong: Song | null = null;
  private isPlaying: boolean = false;
  private isUserInitiatedPause: boolean = true;
  private currentTime: number = 0;
  private playbackRate: number = 1.0;
  private volume: number = 0.85;
  private isMuted: boolean = false;
  private onTimeUpdateCallback: ((time: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;

  // YouTube Player iframe integration
  private ytPlayer: any = null;
  private isYtReady: boolean = false;
  private pendingVideoId: string | null = null;
  private ytPollInterval: number | null = null;
  private lastTickTimestamp: number = 0;

  constructor() {
    this.ensureYouTubeIframeApi();
    this.initBackgroundListeners();
  }

  private initBackgroundListeners() {
    if (typeof window === 'undefined') return;

    // Web Worker high-resolution ticks (runs in background thread even when screen is locked)
    backgroundPlayerService.subscribeTick(() => {
      this.handleBackgroundTick();
    });

    // Visibility change handler for screen lock / home button
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        const isHidden = document.visibilityState === 'hidden';
        if (isHidden) {
          // Screen turned off or user switched to another app
          if (this.isPlaying && !this.isUserInitiatedPause) {
            backgroundPlayerService.ensureKeepAliveAudio();
            // Maintain YouTube iframe playback in the background
            if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
              try {
                this.ytPlayer.playVideo();
              } catch {}
            }
          }
        } else {
          // Returning to foreground
          if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
          }
          if (this.isPlaying && !this.isUserInitiatedPause && this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
            try {
              this.ytPlayer.playVideo();
            } catch {}
          }
        }
      });
    }
  }

  private ensureYouTubeIframeApi() {
    if (typeof window === 'undefined') return;
    if ((window as any).YT && (window as any).YT.Player) {
      this.isYtReady = true;
      return;
    }

    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);

      (window as any).onYouTubeIframeAPIReady = () => {
        this.isYtReady = true;
        this.initYtPlayer();
      };
    }
  }

  private initYtPlayer() {
    if (typeof document === 'undefined' || this.ytPlayer) return;

    let container = document.getElementById('yt-audio-player-frame');
    if (!container) {
      container = document.createElement('div');
      container.id = 'yt-audio-player-frame';
      // Fullscreen, low-opacity active container prevents mobile browsers from treating it
      // as an offscreen 1px hidden element (which triggers aggressive background pausing)
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.style.zIndex = '-999';
      container.style.opacity = '0.001';
      container.style.pointerEvents = 'none';
      container.style.overflow = 'hidden';
      document.body.appendChild(container);
    }

    try {
      this.ytPlayer = new (window as any).YT.Player('yt-audio-player-frame', {
        height: '100%',
        width: '100%',
        videoId: this.pendingVideoId || 'dQw4w9WgXcQ',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onReady: (event: any) => {
            this.isYtReady = true;
            event.target.setVolume(this.isMuted ? 0 : this.volume * 100);
            if (this.pendingVideoId) {
              event.target.loadVideoById(this.pendingVideoId, this.currentTime);
              this.pendingVideoId = null;
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (event.data === 1) {
              this.isPlaying = true;
              this.isUserInitiatedPause = false;
              this.startYtPolling();
              backgroundPlayerService.onPlaybackStarted();
              mediaSessionManager.updatePlaybackState(true);
            } else if (event.data === 2) {
              // Pause event
              if (this.isUserInitiatedPause) {
                // Legitimate user pause
                this.isPlaying = false;
                this.stopYtPolling();
                backgroundPlayerService.onPlaybackPaused();
                mediaSessionManager.updatePlaybackState(false);
              } else {
                // Background/screen-lock triggered pause by browser/OS policy
                // Automatically re-trigger playback to keep the audio flowing seamlessly
                if (backgroundPlayerService.getBackgroundPlayEnabled()) {
                  setTimeout(() => {
                    if (!this.isUserInitiatedPause && this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
                      try {
                        this.ytPlayer.playVideo();
                      } catch {}
                    }
                  }, 50);
                }
              }
            } else if (event.data === 0) {
              // Track completed
              this.isPlaying = false;
              this.stopYtPolling();
              backgroundPlayerService.onPlaybackPaused();
              mediaSessionManager.updatePlaybackState(false);
              this.onEndedCallback?.();
            }
          },
          onError: (err: any) => {
            console.warn('YouTube Player playback warning:', err);
          },
        },
      });
    } catch (e) {
      console.warn('Failed to construct YT.Player:', e);
    }
  }

  private startYtPolling() {
    this.stopYtPolling();
    this.ytPollInterval = window.setInterval(() => {
      this.pollYtCurrentTime();
    }, 250);
  }

  private stopYtPolling() {
    if (this.ytPollInterval) {
      clearInterval(this.ytPollInterval);
      this.ytPollInterval = null;
    }
  }

  private pollYtCurrentTime() {
    if (this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
      try {
        const time = this.ytPlayer.getCurrentTime();
        if (typeof time === 'number' && !isNaN(time) && time >= 0) {
          this.currentTime = time;
          this.onTimeUpdateCallback?.(this.currentTime);

          if (this.currentSong?.duration) {
            mediaSessionManager.updatePositionState(
              this.currentSong.duration,
              this.currentTime,
              this.playbackRate
            );

            if (this.currentTime >= this.currentSong.duration - 0.5) {
              this.isPlaying = false;
              this.stopYtPolling();
              this.onEndedCallback?.();
            }
          }
        }
      } catch {}
    }
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.85;

      // Build 10-band Equalizer chain
      this.filters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.ctx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Chain filters: filter[0] -> filter[1] -> ... -> masterGain -> analyser -> destination
      for (let i = 0; i < this.filters.length - 1; i++) {
        this.filters[i].connect(this.filters[i + 1]);
      }

      this.filters[this.filters.length - 1].connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Setup audio element for local files and URL audio streams
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.setAttribute('playsinline', 'true');
      this.audioElement.setAttribute('webkit-playsinline', 'true');
      this.audioElement.addEventListener('timeupdate', () => {
        if (this.currentSong?.audioType === 'local' && this.audioElement) {
          this.currentTime = this.audioElement.currentTime;
          this.onTimeUpdateCallback?.(this.currentTime);
          if (this.currentSong?.duration) {
            mediaSessionManager.updatePositionState(
              this.currentSong.duration,
              this.currentTime,
              this.playbackRate
            );
          }
        }
      });
      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        backgroundPlayerService.onPlaybackPaused();
        mediaSessionManager.updatePlaybackState(false);
        this.onEndedCallback?.();
      });

      try {
        this.mediaSource = this.ctx.createMediaElementSource(this.audioElement);
        this.mediaSource.connect(this.filters[0]);
      } catch (e) {
        console.warn('Media element source setup:', e);
      }
    } catch (err) {
      console.warn('AudioContext init error:', err);
    }
  }

  public setCallbacks(onTimeUpdate: (t: number) => void, onEnded: () => void) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndedCallback = onEnded;
  }

  public async loadAndPlay(song: Song, startTime = 0) {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.isUserInitiatedPause = false;
    this.stopYtPolling();
    this.currentSong = song;
    this.currentTime = startTime;
    this.lastTickTimestamp = performance.now();

    // Instantly synchronize lock screen metadata & position before any async loads
    mediaSessionManager.updateMetadata(song);
    mediaSessionManager.updatePlaybackState(true);
    mediaSessionManager.updatePositionState(song.duration || 180, startTime, this.playbackRate, true);

    // Trigger keepalive carrier so Android and iOS audio daemons recognize continuous playback
    backgroundPlayerService.onPlaybackStarted();

    // 1. YouTube track playback
    if (song.videoId || (song.id && !song.id.startsWith('track-') && song.audioType !== 'local')) {
      const vId = song.videoId || song.id;

      if (this.audioElement) {
        this.audioElement.pause();
      }

      if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
        try {
          this.ytPlayer.loadVideoById(vId, startTime);
          this.ytPlayer.setVolume(this.isMuted ? 0 : this.volume * 100);
          this.ytPlayer.setPlaybackRate(this.playbackRate);
          this.isPlaying = true;
          this.startYtPolling();
          // Explicitly call playVideo to ensure playback begins even if screen is locked
          setTimeout(() => {
            if (!this.isUserInitiatedPause && this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
              try {
                this.ytPlayer.playVideo();
              } catch {}
            }
          }, 60);
          return;
        } catch (e) {
          console.warn('YouTube loadVideoById error:', e);
        }
      } else {
        this.pendingVideoId = vId;
        this.initYtPlayer();
        this.isPlaying = true;
        this.startYtPolling();
        return;
      }
    }

    // 2. Local audio files / direct URL tracks
    if (song.audioType === 'local' && song.audioUrl) {
      if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
        try {
          this.ytPlayer.pauseVideo();
        } catch {}
      }

      if (this.audioElement) {
        this.audioElement.src = song.audioUrl;
        this.audioElement.currentTime = startTime;
        this.audioElement.playbackRate = this.playbackRate;
        try {
          await this.audioElement.play();
          this.isPlaying = true;
          return;
        } catch (e) {
          console.warn('Local playback error:', e);
        }
      }
    }
  }

  public async play() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.isUserInitiatedPause = false;
    backgroundPlayerService.onPlaybackStarted();
    mediaSessionManager.updatePlaybackState(true);

    if (this.currentSong?.videoId && this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
      this.ytPlayer.playVideo();
      this.isPlaying = true;
      this.startYtPolling();
      return;
    }

    if (this.currentSong?.audioType === 'local' && this.audioElement && this.audioElement.src) {
      try {
        await this.audioElement.play();
        this.isPlaying = true;
      } catch {}
      return;
    }

    if (this.currentSong) {
      await this.loadAndPlay(this.currentSong, this.currentTime);
    }
  }

  public pause() {
    this.isUserInitiatedPause = true;
    this.isPlaying = false;
    backgroundPlayerService.onPlaybackPaused();
    mediaSessionManager.updatePlaybackState(false);

    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try {
        this.ytPlayer.pauseVideo();
      } catch {}
    }
    this.stopYtPolling();

    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.currentSong?.duration || 300));

    if (this.ytPlayer && typeof this.ytPlayer.seekTo === 'function' && this.currentSong?.videoId) {
      try {
        this.ytPlayer.seekTo(this.currentTime, true);
      } catch {}
    }

    if (this.audioElement && this.currentSong?.audioType === 'local') {
      this.audioElement.currentTime = this.currentTime;
    }

    this.onTimeUpdateCallback?.(this.currentTime);
    mediaSessionManager.updatePositionState(
      this.currentSong?.duration || 180,
      this.currentTime,
      this.playbackRate,
      true
    );
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }

    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
    }

    if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
      try {
        this.ytPlayer.setVolume(this.isMuted ? 0 : this.volume * 100);
      } catch {}
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    this.setVolume(this.volume);
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;

    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }

    if (this.ytPlayer && typeof this.ytPlayer.setPlaybackRate === 'function') {
      try {
        this.ytPlayer.setPlaybackRate(rate);
      } catch {}
    }
  }

  public setEQBandGain(bandIndex: number, gainDb: number) {
    if (this.filters[bandIndex] && this.ctx) {
      this.filters[bandIndex].gain.setValueAtTime(gainDb, this.ctx.currentTime);
    }
  }

  public setEQPreset(preset: EQPreset) {
    preset.gains.forEach((g, idx) => {
      this.setEQBandGain(idx, g);
    });
  }

  // Purely visual reactive audio data synthesizer — NO AUDIBLE SOUND IS PRODUCED!
  // Replaces the old oscillator buzzing pulse with a silent, beautiful reactive visualizer curve
  public getVisualizerData(): { frequency: Uint8Array; waveform: Uint8Array } {
    const binCount = 128;
    const freqData = new Uint8Array(binCount);
    const waveData = new Uint8Array(binCount);

    if (!this.isPlaying) {
      freqData.fill(0);
      waveData.fill(128);
      return { frequency: freqData, waveform: waveData };
    }

    // If local audio is piping through Web Audio analyser, read authentic FFT
    if (this.analyser && this.currentSong?.audioType === 'local') {
      this.analyser.getByteFrequencyData(freqData);
      this.analyser.getByteTimeDomainData(waveData);
      return { frequency: freqData, waveform: waveData };
    }

    // For YouTube streams: Generate smooth, rhythmic, and realistic frequency motion
    // completely silently in memory (zero audio nodes created, zero buzzing!)
    const now = performance.now() / 1000;
    const tempo = (this.currentSong?.bpm || 110) / 60;
    const beat = Math.pow(Math.max(0, Math.sin(now * Math.PI * tempo)), 2.5);

    for (let i = 0; i < binCount; i++) {
      const decay = Math.exp(-i / 32);
      const bassEnergy = beat * Math.exp(-i / 12) * 110;
      const ripple = Math.sin(now * 4 + i * 0.28) * 18;
      const val = Math.min(255, Math.max(10, Math.floor(100 * decay + bassEnergy + ripple)));
      freqData[i] = val;

      const waveOffset = Math.sin(i * 0.14 + now * 5) * (18 + beat * 16);
      waveData[i] = Math.floor(128 + waveOffset);
    }

    return { frequency: freqData, waveform: waveData };
  }

  // Lookahead beat & timeline updater that stays active when phone screen is locked
  private handleBackgroundTick() {
    if (!this.isPlaying || !this.currentSong) return;

    // Background Watchdog: If device locked screen and YouTube paused without user intent, resume it!
    if (!this.isUserInitiatedPause && this.ytPlayer && typeof this.ytPlayer.getPlayerState === 'function') {
      try {
        const pState = this.ytPlayer.getPlayerState();
        if (pState === 2) {
          this.ytPlayer.playVideo();
        }
      } catch {}
    }

    const nowPerf = performance.now();
    const deltaSeconds = Math.max(0, (nowPerf - this.lastTickTimestamp) / 1000) * this.playbackRate;
    this.lastTickTimestamp = nowPerf;

    if (this.currentSong.audioType === 'local' && this.audioElement) {
      this.currentTime = this.audioElement.currentTime;
      this.onTimeUpdateCallback?.(this.currentTime);
      return;
    }

    // For YouTube stream: read actual time or advance smoothly
    if (this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
      try {
        const t = this.ytPlayer.getCurrentTime();
        if (typeof t === 'number' && !isNaN(t) && t >= 0) {
          this.currentTime = t;
          this.onTimeUpdateCallback?.(this.currentTime);

          if (this.currentSong.duration && this.currentTime >= this.currentSong.duration - 0.5) {
            this.isPlaying = false;
            this.onEndedCallback?.();
            return;
          }
          return;
        }
      } catch {}
    }

    // Fallback advancement if iframe polling is throttled during background lock
    if (deltaSeconds > 0 && deltaSeconds < 1.5) {
      this.currentTime += deltaSeconds;
      this.onTimeUpdateCallback?.(this.currentTime);

      if (this.currentSong.duration && this.currentTime >= this.currentSong.duration) {
        this.isPlaying = false;
        this.currentTime = 0;
        this.onEndedCallback?.();
      }
    }
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioEngine = new AudioEngine();
