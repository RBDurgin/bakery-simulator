import { create } from 'zustand';
import { readSettings, writeSettings, type Settings } from '../save/settings';

interface SettingsStore {
  settings: Settings;
  /** Changes some settings and stores them. They are kept apart from the save slots. */
  change: (changes: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  settings: readSettings(),
  change: (changes) => {
    const settings = { ...get().settings, ...changes };
    // If storing fails the choice still holds until the page is closed.
    writeSettings(settings);
    set({ settings });
  },
}));
