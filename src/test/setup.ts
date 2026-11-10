import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { useGameStore } from '../store/gameStore';

afterEach(() => {
  cleanup();
  useGameStore.setState(useGameStore.getInitialState(), true);
});
