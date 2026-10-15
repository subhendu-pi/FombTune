import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../../services/audioEngine';
import { Activity, BarChart2, Disc } from 'lucide-react';

interface VisualizerCanvasProps {
  isPlaying: boolean;
  accentColor?: string;
  className?: string;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  isPlaying,
  accentColor = '#818cf8',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visualMode, setVisualMode] = useState<'bars' | 'wave' | 'circle'>('bars');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const { frequency, waveform } = audioEngine.getVisualizerData();

      if (visualMode === 'bars') {
        // Draw Frequency Bars
        const barCount = 36;
        const barWidth = (width / barCount) - 3;
        const step = Math.floor(frequency.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const rawVal = isPlaying ? frequency[i * step] : 12;
          const barHeight = Math.max(4, (rawVal / 255) * (height - 8));
          const x = i * (barWidth + 3);
          const y = height - barHeight;

          // Gradient color
          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, accentColor);
          grad.addColorStop(1, '#ec4899');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();
        }
      } else if (visualMode === 'wave') {
        // Smooth Oscilloscope Line
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 8;

        const sliceWidth = width / waveform.length;
        let x = 0;

        for (let i = 0; i < waveform.length; i++) {
          const v = waveform[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (visualMode === 'circle') {
        // Radial Ring
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.28;

        ctx.beginPath();
        const totalPoints = 48;
        const step = Math.floor(frequency.length / totalPoints);

        for (let i = 0; i <= totalPoints; i++) {
          const angle = (i / totalPoints) * Math.PI * 2;
          const val = isPlaying ? (frequency[(i % totalPoints) * step] / 255) : 0.05;
          const r = baseRadius + val * 24;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = accentColor;
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, visualMode, accentColor]);

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={340}
        height={90}
        className="w-full h-24 max-w-sm rounded-xl"
      />
      {/* Mode Selector */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => setVisualMode('bars')}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            visualMode === 'bars'
              ? 'bg-white/20 text-white font-medium'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Frequency Spectrum Bars"
        >
          <BarChart2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setVisualMode('wave')}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            visualMode === 'wave'
              ? 'bg-white/20 text-white font-medium'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Waveform Oscilloscope"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setVisualMode('circle')}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            visualMode === 'circle'
              ? 'bg-white/20 text-white font-medium'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Radial Pulse"
        >
          <Disc className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
