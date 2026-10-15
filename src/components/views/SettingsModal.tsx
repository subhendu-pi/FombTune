import React, { useState } from 'react';
import { ColorTheme, ThemeBrightness } from '../../types/music';
import {
  Palette,
  Sun,
  Moon,
  Shield,
  Volume2,
  X,
  Sparkles,
  Check,
  Keyboard,
  Lock,
  Radio,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { backgroundPlayerService } from '../../services/backgroundPlayer';

interface SettingsModalProps {
  colorTheme: ColorTheme;
  themeBrightness: ThemeBrightness;
  onColorThemeChange: (theme: ColorTheme) => void;
  onThemeBrightnessChange: (b: ThemeBrightness) => void;
  onClose: () => void;
  onResetData: () => void;
}

const THEME_OPTIONS: { id: ColorTheme; label: string; hex: string }[] = [
  { id: 'monet-teal', label: 'Material Monet Mint', hex: '#14b8a6' },
  { id: 'monet-purple', label: 'Material Iris Purple', hex: '#818cf8' },
  { id: 'sunset-amber', label: 'Sunset Amber', hex: '#f59e0b' },
  { id: 'cyber-blue', label: 'Cyan Pulse', hex: '#06b6d4' },
  { id: 'forest-emerald', label: 'Forest Emerald', hex: '#10b981' },
  { id: 'rose-quartz', label: 'Neon Rose', hex: '#f43f5e' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  colorTheme,
  themeBrightness,
  onColorThemeChange,
  onThemeBrightnessChange,
  onClose,
  onResetData,
}) => {
  const [bgPlay, setBgPlay] = useState<boolean>(() =>
    backgroundPlayerService.getBackgroundPlayEnabled()
  );
  const [wakeLock, setWakeLock] = useState<boolean>(() =>
    backgroundPlayerService.getWakeLockEnabled()
  );
  const [lockControls, setLockControls] = useState<boolean>(() =>
    backgroundPlayerService.getLockControlsEnabled()
  );

  const handleToggleBgPlay = () => {
    const next = !bgPlay;
    setBgPlay(next);
    backgroundPlayerService.setBackgroundPlayEnabled(next);
  };

  const handleToggleWakeLock = () => {
    const next = !wakeLock;
    setWakeLock(next);
    backgroundPlayerService.setWakeLockEnabled(next);
  };

  const handleToggleLockControls = () => {
    const next = !lockControls;
    setLockControls(next);
    backgroundPlayerService.setLockControlsEnabled(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl p-6 text-white space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 sticky top-0 bg-zinc-950 z-10">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold tracking-tight">App Settings &amp; Playback</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Background Playback & Lock Screen Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Background Play &amp; Screen Lock</span>
            </label>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Engine Active</span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Toggle 1: Background Playback */}
            <div
              onClick={handleToggleBgPlay}
              className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-white/5 cursor-pointer transition-colors"
            >
              <div className="space-y-0.5 pr-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-zinc-200">
                    Background Audio Playback
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-snug">
                  Keep music streaming when you press Home, switch apps, or turn off the screen.
                </p>
              </div>
              <div
                className={`w-11 h-6 shrink-0 rounded-full transition-colors flex items-center px-1 ${
                  bgPlay ? 'bg-emerald-500 justify-end' : 'bg-zinc-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
              </div>
            </div>

            {/* Toggle 2: Lock Screen Media Controls */}
            <div
              onClick={handleToggleLockControls}
              className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-white/5 cursor-pointer transition-colors"
            >
              <div className="space-y-0.5 pr-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-zinc-200">
                    Lock Screen Media Controls
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-snug">
                  Control play/pause, seek ±10s, next/previous tracks, and view album art on lock screen.
                </p>
              </div>
              <div
                className={`w-11 h-6 shrink-0 rounded-full transition-colors flex items-center px-1 ${
                  lockControls ? 'bg-indigo-500 justify-end' : 'bg-zinc-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
              </div>
            </div>

            {/* Toggle 3: Keep Screen Awake */}
            <div
              onClick={handleToggleWakeLock}
              className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-white/5 cursor-pointer transition-colors"
            >
              <div className="space-y-0.5 pr-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-zinc-200">
                    Keep Screen Awake (Wake Lock)
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-snug">
                  Prevent screen timeout while turntable disc or live synchronized lyrics are active.
                </p>
              </div>
              <div
                className={`w-11 h-6 shrink-0 rounded-full transition-colors flex items-center px-1 ${
                  wakeLock ? 'bg-amber-500 justify-end' : 'bg-zinc-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Material 3 Palette */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Material 3 Dynamic Palette
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onColorThemeChange(opt.id)}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  colorTheme === opt.id
                    ? 'bg-white/15 border-white/40 shadow-sm'
                    : 'bg-zinc-900/60 hover:bg-zinc-800 border-white/5'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full shadow-inner shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: opt.hex }}
                >
                  {colorTheme === opt.id && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="text-xs font-semibold text-zinc-200 truncate">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Brightness */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Appearance Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'dark', label: 'Dark Slate', icon: Moon },
              { id: 'oled', label: 'OLED Pure Black', icon: Shield },
              { id: 'light', label: 'Light', icon: Sun },
            ].map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => onThemeBrightnessChange(mode.id as ThemeBrightness)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-xs font-medium ${
                    themeBrightness === mode.id
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* App Installation */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Install App
          </label>
          <div>
            <PWAInstallButton variant="settings" />
          </div>
        </div>

        {/* Global Keyboard Shortcuts Cheat Sheet */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Playback Keyboard Shortcuts</span>
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-white/5">
              <span className="text-zinc-300">Play / Pause</span>
              <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-zinc-200">Space</kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-white/5">
              <span className="text-zinc-300">Seek ±5s</span>
              <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-zinc-200">← / →</kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-white/5">
              <span className="text-zinc-300">Prev / Next</span>
              <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-zinc-200">J / K</kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-white/5">
              <span className="text-zinc-300">Volume ±5%</span>
              <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-zinc-200">↑ / ↓</kbd>
            </div>
          </div>
        </div>

        {/* Audio Engine Specs */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2 font-semibold text-zinc-200">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Audio Architecture &amp; Background Playback</span>
          </div>
          <p className="leading-relaxed">
            Engineered with Web Audio lookahead scheduling, mobile OS audio keep-alive session, Web Worker clock, MediaSession lock screen actions, and 10-band BiquadFilter equalizer.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <button
            onClick={() => {
              if (confirm('Reset custom playlists and restore defaults?')) {
                onResetData();
                onClose();
              }
            }}
            className="text-xs text-rose-400 hover:underline"
          >
            Reset to Factory Defaults
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
