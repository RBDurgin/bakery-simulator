import { useEffect } from 'react';
import type { Settings } from '../save/settings';
import { useSettingsStore } from '../store/settingsStore';

const QUERY = '(prefers-reduced-motion: reduce)';

/** The device's own "reduce motion" setting, where the browser can tell us. */
export function deviceWantsLessMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;
}

/** Less movement: the player's choice, or the device's setting if they have not chosen. */
export function wantsLessMotion(settings: Settings): boolean {
  return settings.reducedMotion ?? deviceWantsLessMotion();
}

/**
 * Puts the settings on the page for the stylesheets to use: `data-motion` and
 * `data-text-size` on the root element. See theme.css.
 */
export function useApplySettings() {
  const settings = useSettingsStore((store) => store.settings);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      root.dataset.textSize = settings.textSize;
      root.dataset.motion = wantsLessMotion(settings) ? 'reduced' : 'full';
    };
    apply();
    // Follow the device if its setting changes while the game is open.
    const query = typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null;
    query?.addEventListener('change', apply);
    return () => query?.removeEventListener('change', apply);
  }, [settings]);
}
