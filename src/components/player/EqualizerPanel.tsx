import React, { useState } from 'react';
import { EQ_FREQUENCIES, EQ_LABELS, EQ_PRESETS, audioEngine } from '../../services/audioEngine';
import { VisualizerCanvas } from './VisualizerCanvas';
import { Sliders, RotateCcw } from 'lucide-react';

interface EqualizerPanelProps {
  isPlaying: boolean;
  accentColor?: string;
}

export const EqualizerPanel: React.FC<EqualizerPanelProps> = ({
  isPlaying,
  accentColor = '#818cf8',
}) => {
  const [gains, setGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [activePreset, setActivePreset] = useState<string>('Flat');

  const handleGainChange = (index: number, val: number) => {
    const updated = [...gains];
    updated[index] = val;
    setGains(updated);
    audioEngine.setEQBandGain(index, val);
    setActivePreset('Custom');
  };

  const handleSelectPreset = (presetName: string) => {
    const preset = EQ_PRESETS.find((p) => p.name === presetName);
    if (!preset) return;
    setGains([...preset.gains]);
    setActivePreset(preset.name);
    audioEngine.setEQPreset(preset);
  };

  const resetFlat = () => {
    handleSelectPreset('Flat');
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto p-4 select-none">
      {/* Live Audio Visualizer Canvas */}
      <VisualizerCanvas isPlaying={isPlaying} accentColor={accentColor} className="mb-4 w-full" />

      {/* Preset Selector & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-6">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            EQ Presets:
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activePreset}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="text-xs bg-zinc-800 text-zinc-200 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {EQ_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
            {activePreset === 'Custom' && <option value="Custom">Custom</option>}
          </select>

          <button
            onClick={resetFlat}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 transition-colors"
            title="Reset to 0dB Flat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 10-Band Sliders Grid */}
      <div className="w-full bg-zinc-900/80 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
        <div className="grid grid-cols-10 gap-1.5 sm:gap-2 h-48 items-center">
          {EQ_LABELS.map((label, idx) => {
            const gain = gains[idx] || 0;
            return (
              <div key={label} className="flex flex-col items-center h-full justify-between">
                {/* dB Value */}
                <span className="text-[10px] font-mono tabular-nums text-zinc-400">
                  {gain > 0 ? `+${gain}` : gain}
                </span>

                {/* Vertical Range Slider */}
                <div className="relative flex-1 flex items-center justify-center my-1 w-full">
                  {/* Center zero line indicator */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 pointer-events-none" />

                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    onChange={(e) => handleGainChange(idx, Number(e.target.value))}
                    className="w-24 h-1.5 -rotate-90 origin-center cursor-pointer appearance-none bg-zinc-700 rounded-lg accent-indigo-500 focus:outline-none"
                    style={{
                      accentColor,
                    }}
                  />
                </div>

                {/* Frequency Band Label */}
                <span className="text-[10px] font-medium text-zinc-400 mt-1 whitespace-nowrap">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between w-full mt-3 text-[11px] text-zinc-500">
        <span>-12 dB Cut</span>
        <span className="font-mono text-zinc-400">Biquad Filter Array</span>
        <span>+12 dB Boost</span>
      </div>
    </div>
  );
};
