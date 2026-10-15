// Background Playback and Screen-Lock Engine for FabTune
// Handles Media Session synchronization, Mobile OS audio keep-alive,
// Screen Wake Lock API, and visibility state transitions.

const STORAGE_KEY_BG_PLAY = 'fabtune_bg_play_enabled';
const STORAGE_KEY_WAKE_LOCK = 'fabtune_wake_lock_enabled';
const STORAGE_KEY_LOCK_CONTROLS = 'fabtune_lock_controls_enabled';

class BackgroundPlayerService {
  private isSupported: boolean = typeof window !== 'undefined';
  private bgPlayEnabled: boolean = true;
  private wakeLockEnabled: boolean = false;
  private lockControlsEnabled: boolean = true;
  private wakeLockSentinel: any = null;
  private silentAudioElement: HTMLAudioElement | null = null;
  private isRunning: boolean = false;
  private isTabHidden: boolean = false;
  private worker: Worker | null = null;
  private tickListeners: Set<() => void> = new Set();
  private cachedWavUrl: string | null = null;

  constructor() {
    if (!this.isSupported) return;

    // Load user preferences
    const savedBg = localStorage.getItem(STORAGE_KEY_BG_PLAY);
    if (savedBg !== null) this.bgPlayEnabled = savedBg === 'true';

    const savedWake = localStorage.getItem(STORAGE_KEY_WAKE_LOCK);
    if (savedWake !== null) this.wakeLockEnabled = savedWake === 'true';

    const savedLock = localStorage.getItem(STORAGE_KEY_LOCK_CONTROLS);
    if (savedLock !== null) this.lockControlsEnabled = savedLock === 'true';

    this.initVisibilityListener();
    this.initWorkerClock();
  }

  // Generate a bit-perfect, pristine 44.1kHz silent 5-second PCM WAV to keep Android & iOS audio sessions alive
  // All sample bytes are strictly 0x00 (pure silence).
  private getSilentWavUrl(): string {
    if (this.cachedWavUrl) return this.cachedWavUrl;

    const sampleRate = 44100;
    const numSeconds = 5;
    const numSamples = sampleRate * numSeconds;
    const dataSize = numSamples * 2; // 16-bit mono
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF identifier
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // "fmt " sub-chunk
    view.setUint32(12, 0x666d7420, false);
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // PCM = 1
    view.setUint16(22, 1, true); // Mono = 1
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample

    // "data" sub-chunk
    view.setUint32(36, 0x64617461, false);
    view.setUint32(40, dataSize, true);

    // Audio samples: ArrayBuffer is zero-initialized by default (100% pure zero amplitude silence)
    const blob = new Blob([buffer], { type: 'audio/wav' });
    this.cachedWavUrl = URL.createObjectURL(blob);
    return this.cachedWavUrl;
  }

  private initWorkerClock() {
    if (typeof Worker === 'undefined') return;

    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (timer) clearInterval(timer);
            timer = setInterval(() => self.postMessage('tick'), 100);
          } else if (e.data === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      this.worker.onmessage = (e) => {
        if (e.data === 'tick') {
          this.tickListeners.forEach((cb) => {
            try {
              cb();
            } catch {}
          });
        }
      };
    } catch (err) {
      console.warn('Web Worker background clock unavailable, using timer fallback:', err);
    }
  }

  public subscribeTick(callback: () => void): () => void {
    this.tickListeners.add(callback);
    return () => this.tickListeners.delete(callback);
  }

  private initVisibilityListener() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      this.isTabHidden = document.visibilityState === 'hidden';

      if (this.isTabHidden) {
        // App went to background (Home button pressed or screen turned off)
        if (this.isRunning && this.bgPlayEnabled) {
          this.ensureKeepAliveAudio();
        }
      } else {
        // App returned to foreground
        if (this.wakeLockEnabled && this.isRunning) {
          this.requestWakeLock();
        }
      }
    });
  }

  // Ensures the HTML5 audio element plays continuously in background / screen lock
  public ensureKeepAliveAudio(): void {
    if (!this.bgPlayEnabled || typeof document === 'undefined') return;

    try {
      if (!this.silentAudioElement) {
        this.silentAudioElement = document.createElement('audio');
        this.silentAudioElement.id = 'fabtune-bg-keepalive';
        this.silentAudioElement.loop = true;
        this.silentAudioElement.preload = 'auto';
        this.silentAudioElement.style.display = 'none';
        this.silentAudioElement.src = this.getSilentWavUrl();
        this.silentAudioElement.setAttribute('playsinline', 'true');
        this.silentAudioElement.setAttribute('webkit-playsinline', 'true');
        // Volume 1.0 on a 100% zero-sample PCM buffer is mathematically 0 amplitude (pure silence),
        // but informs Android AudioFlinger and iOS CoreAudio that an active, audible media session is playing,
        // preventing the OS from putting the audio thread to sleep when the screen locks.
        this.silentAudioElement.volume = 1.0;

        // Auto-resume guard if OS background manager tries to pause it while track is playing
        this.silentAudioElement.addEventListener('pause', () => {
          if (this.isRunning && this.bgPlayEnabled && this.silentAudioElement) {
            setTimeout(() => {
              if (this.isRunning && this.bgPlayEnabled && this.silentAudioElement?.paused) {
                this.silentAudioElement.play().catch(() => {});
              }
            }, 50);
          }
        });

        document.body.appendChild(this.silentAudioElement);
      }

      if (this.silentAudioElement.paused) {
        this.silentAudioElement.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Background keepalive audio warning:', err);
    }
  }

  public pauseKeepAliveAudio(): void {
    if (this.silentAudioElement && !this.silentAudioElement.paused) {
      try {
        this.silentAudioElement.pause();
      } catch {}
    }
  }

  public onPlaybackStarted(): void {
    this.isRunning = true;
    this.ensureKeepAliveAudio();
    if (this.worker) {
      this.worker.postMessage('start');
    }
    if (this.wakeLockEnabled) {
      this.requestWakeLock();
    }
  }

  public onPlaybackPaused(): void {
    this.isRunning = false;
    this.pauseKeepAliveAudio();
    if (this.worker) {
      this.worker.postMessage('stop');
    }
    this.releaseWakeLock();
  }

  // Screen Wake Lock API
  public async requestWakeLock(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }
    try {
      this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      this.wakeLockSentinel.addEventListener('release', () => {
        this.wakeLockSentinel = null;
      });
      return true;
    } catch {
      return false;
    }
  }

  public releaseWakeLock(): void {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {}
      this.wakeLockSentinel = null;
    }
  }

  // Toggles and getters
  public setBackgroundPlayEnabled(enabled: boolean): void {
    this.bgPlayEnabled = enabled;
    localStorage.setItem(STORAGE_KEY_BG_PLAY, String(enabled));
    if (!enabled) {
      this.pauseKeepAliveAudio();
    } else if (this.isRunning) {
      this.ensureKeepAliveAudio();
    }
  }

  public getBackgroundPlayEnabled(): boolean {
    return this.bgPlayEnabled;
  }

  public setWakeLockEnabled(enabled: boolean): void {
    this.wakeLockEnabled = enabled;
    localStorage.setItem(STORAGE_KEY_WAKE_LOCK, String(enabled));
    if (enabled && this.isRunning) {
      this.requestWakeLock();
    } else {
      this.releaseWakeLock();
    }
  }

  public getWakeLockEnabled(): boolean {
    return this.wakeLockEnabled;
  }

  public setLockControlsEnabled(enabled: boolean): void {
    this.lockControlsEnabled = enabled;
    localStorage.setItem(STORAGE_KEY_LOCK_CONTROLS, String(enabled));
  }

  public getLockControlsEnabled(): boolean {
    return this.lockControlsEnabled;
  }

  public getIsTabHidden(): boolean {
    return this.isTabHidden;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const backgroundPlayerService = new BackgroundPlayerService();
