import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Check, Share, X, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'settings' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
          <Check className="w-4 h-4" />
          <span>App Installed on Device</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // If neither Chromium prompt is ready nor iOS detected, show a helpful fallback trigger in settings
  if (!isInstallable && !isIOS && variant !== 'settings') {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 font-medium text-xs rounded-xl transition-all active:scale-95 ${
          variant === 'header'
            ? 'px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15'
            : variant === 'compact'
            ? 'p-2 bg-white/10 hover:bg-white/20 text-white border border-white/10'
            : 'w-full justify-between p-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10'
        } ${className}`}
        title="Install FabTune as standalone app"
      >
        <div className="flex items-center gap-2">
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Install App</span>
        </div>
        {variant === 'settings' && (
          <span className="text-[11px] text-zinc-400">Offline PWA</span>
        )}
      </button>

      {/* iOS Safari Guided Install Sheet */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-white/15 p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <p>
                  Tap the <strong className="text-white">Share button</strong> (box with arrow) at the bottom or top of Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <p>
                  Scroll down the menu and tap <strong className="text-white">Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <p>
                  Tap <strong className="text-white">Add</strong> in the top right corner to enjoy fullscreen offline music!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
