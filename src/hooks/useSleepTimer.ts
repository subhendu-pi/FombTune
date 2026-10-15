import { useState, useRef, useEffect } from 'react';

interface UseSleepTimerOptions {
  onTimerExpire: () => void;
}

export function useSleepTimer({ onTimerExpire }: UseSleepTimerOptions) {
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const sleepTimerRef = useRef<number | null>(null);

  const handleSetSleepTimer = (minutes: number | null) => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    setSleepTimerRemaining(minutes);

    if (minutes !== null) {
      let remaining = minutes;
      sleepTimerRef.current = window.setInterval(() => {
        remaining -= 1;
        setSleepTimerRemaining(remaining);
        if (remaining <= 0) {
          onTimerExpire();
          setSleepTimerRemaining(null);
          if (sleepTimerRef.current) {
            clearInterval(sleepTimerRef.current);
            sleepTimerRef.current = null;
          }
        }
      }, 60000);
    }
  };

  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    };
  }, []);

  return {
    sleepTimerRemaining,
    handleSetSleepTimer,
  };
}
