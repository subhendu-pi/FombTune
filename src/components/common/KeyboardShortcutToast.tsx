import React from 'react';

interface KeyboardShortcutToastProps {
  toast: { key: string; action: string } | null;
}

export const KeyboardShortcutToast: React.FC<KeyboardShortcutToastProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <aside
      aria-label="Keyboard Shortcut Notification"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-zinc-900/95 border border-white/20 text-white shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none"
    >
      <kbd className="px-2 py-0.5 rounded-lg bg-white/10 font-mono text-xs font-bold text-indigo-300 border border-white/10">
        {toast.key}
      </kbd>
      <span className="text-xs font-semibold">{toast.action}</span>
    </aside>
  );
};
