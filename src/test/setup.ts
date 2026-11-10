import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { DEFAULT_SETTINGS } from '../save/settings';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  useGameStore.setState(useGameStore.getInitialState(), true);
  useSettingsStore.setState({ settings: DEFAULT_SETTINGS });
  delete document.documentElement.dataset.motion;
  delete document.documentElement.dataset.textSize;
});
