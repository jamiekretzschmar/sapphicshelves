
import { useCallback } from 'react';

export function useHaptics() {
  const trigger = useCallback((style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!('vibrate' in navigator)) return;
    
    switch (style) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(30);
        break;
      case 'heavy':
        navigator.vibrate([50, 30, 50]);
        break;
    }
  }, []);

  return { trigger };
}
