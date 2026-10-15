import React, { useState } from 'react';
import { Moon, Clock, Check, X } from 'lucide-react';

interface SleepTimerMenuProps {
  remainingMinutes: number | null;
  onSetTimer: (minutes: number | null) => void;
  onClose: () => void;
}

export const SleepTimerMenu: React.FC<SleepTimerMenuProps> = ({
  remainingMinutes,
  onSetTimer,
  onClose,
}) => {
  const options = [
    { label: '5 minutes', value: 5 },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '60 minutes', value: 60 },
  ];

  return (
    <div className="absolute right-0 top-12 z-50 w-64 p-3 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Sleep Timer</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-1 rounded-full transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {remainingMinutes !== null && (
        <div className="mb-2 p-2 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 animate-spin-slow" />
            Active: ~{remainingMinutes}m remaining
          </span>
          <button
            onClick={() => onSetTimer(null)}
            className="text-[11px] underline text-indigo-400 hover:text-indigo-200"
          >
            Turn Off
          </button>
        </div>
      )}

      <div className="space-y-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              onSetTimer(opt.value);
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <span>{opt.label}</span>
            {remainingMinutes === opt.value && <Check className="w-3.5 h-3.5 text-indigo-400" />}
          </button>
        ))}
        {remainingMinutes !== null && (
          <button
            onClick={() => {
              onSetTimer(null);
              onClose();
            }}
            className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            Cancel Timer
          </button>
        )}
      </div>
    </div>
  );
};
