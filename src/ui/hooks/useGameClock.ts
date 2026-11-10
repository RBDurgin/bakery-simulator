import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

/**
 * Drives the engine from animation frames while `running` is true: walking
 * in every phase, and the shop clock while the shop is open. The game pauses
 * itself when the browser tab is hidden.
 */
export function useGameClock(running: boolean) {
  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) useGameStore.getState().dispatch({ type: 'pause' });
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);

    let frame = 0;
    if (running) {
      let last = performance.now();
      const loop = (now: number) => {
        useGameStore.getState().tick(now - last);
        last = now;
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    }

    return () => {
      document.removeEventListener('visibilitychange', pauseWhenHidden);
      cancelAnimationFrame(frame);
    };
  }, [running]);
}
