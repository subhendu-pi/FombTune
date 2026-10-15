// Procedural Ambient Audio Generator for FabTune
// Uses Web Audio API to create relaxing ambient sound layers without external files:
// - Rain (filtered noise with random droplet impulses)
// - Coffeehouse (warm murmur & crackle)
// - Forest Breeze (modulated gentle pink noise)
// - Cosmic Drone (deep dual detuned sine oscillators)

export type AmbientSoundType = 'rain' | 'coffeehouse' | 'forest' | 'cosmic';

export interface AmbientLayerConfig {
  id: AmbientSoundType;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export const AMBIENT_LAYERS: AmbientLayerConfig[] = [
  {
    id: 'rain',
    name: 'Midnight Rain',
    icon: 'CloudRain',
    description: 'Gentle window rainfall & distant drops',
    color: '#06b6d4',
  },
  {
    id: 'coffeehouse',
    name: 'Vinyl Crackle & Cafe',
    icon: 'Coffee',
    description: 'Warm analog warmth & gentle ambience',
    color: '#f59e0b',
  },
  {
    id: 'forest',
    name: 'Forest Breeze',
    icon: 'Trees',
    description: 'Whispering pine trees and wind',
    color: '#10b981',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Drone',
    icon: 'Moon',
    description: 'Deep resonant ambient meditation drone',
    color: '#8b5cf6',
  },
];

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeLayers: Map<
    AmbientSoundType,
    {
      gainNode: GainNode;
      sources: (AudioNode | number)[];
    }
  > = new Map();
  private volumes: Record<AmbientSoundType, number> = {
    rain: 0.35,
    coffeehouse: 0.3,
    forest: 0.35,
    cosmic: 0.4,
  };

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isLayerActive(type: AmbientSoundType): boolean {
    return this.activeLayers.has(type);
  }

  public getVolume(type: AmbientSoundType): number {
    return this.volumes[type] ?? 0.3;
  }

  public setVolume(type: AmbientSoundType, volume: number) {
    this.volumes[type] = Math.max(0, Math.min(1, volume));
    const layer = this.activeLayers.get(type);
    if (layer && this.ctx) {
      layer.gainNode.gain.setValueAtTime(this.volumes[type], this.ctx.currentTime);
    }
  }

  public toggleLayer(type: AmbientSoundType): boolean {
    if (this.isLayerActive(type)) {
      this.stopLayer(type);
      return false;
    } else {
      this.startLayer(type);
      return true;
    }
  }

  public startLayer(type: AmbientSoundType) {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    if (this.activeLayers.has(type)) return;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(this.volumes[type], this.ctx.currentTime);
    gainNode.connect(this.masterGain);

    const sources: (AudioNode | number)[] = [];

    switch (type) {
      case 'rain': {
        // Pink-like noise through lowpass filter
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2) * 0.11;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        whiteNoise.start();

        sources.push(whiteNoise);
        break;
      }

      case 'coffeehouse': {
        // Crackling vinyl texture + warm rumble
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          // Occasional vinyl click
          if (Math.random() < 0.003) {
            data[i] = (Math.random() * 2 - 1) * 0.8;
          } else {
            data[i] = (Math.random() * 2 - 1) * 0.02;
          }
        }

        const crackleSource = this.ctx.createBufferSource();
        crackleSource.buffer = buffer;
        crackleSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
        filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

        crackleSource.connect(filter);
        filter.connect(gainNode);
        crackleSource.start();

        sources.push(crackleSource);
        break;
      }

      case 'forest': {
        // Modulated brown noise (wind through trees)
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, this.ctx.currentTime);

        // Wind swell LFO
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        noise.connect(filter);
        filter.connect(gainNode);
        noise.start();
        lfo.start();

        sources.push(noise, lfo);
        break;
      }

      case 'cosmic': {
        // Deep dual detuned sine drone
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(65.8, this.ctx.currentTime); // slight detune for cosmic beat

        const subOsc = this.ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(32.7, this.ctx.currentTime); // C1 sub

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        subOsc.connect(filter);
        filter.connect(gainNode);

        osc1.start();
        osc2.start();
        subOsc.start();

        sources.push(osc1, osc2, subOsc);
        break;
      }
    }

    this.activeLayers.set(type, { gainNode, sources });
  }

  public stopLayer(type: AmbientSoundType) {
    const layer = this.activeLayers.get(type);
    if (!layer) return;

    layer.sources.forEach((s) => {
      if (typeof s === 'object' && 'stop' in s && typeof (s as any).stop === 'function') {
        try {
          (s as any).stop();
        } catch {}
      }
    });

    try {
      layer.gainNode.disconnect();
    } catch {}

    this.activeLayers.delete(type);
  }

  public stopAll() {
    const active = Array.from(this.activeLayers.keys());
    active.forEach((t) => this.stopLayer(t));
  }
}

export const ambientEngine = new AmbientEngine();
