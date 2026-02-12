import { config, Settings } from '@/app.config';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? (T[P] extends any[] ? T[P] : DeepPartial<T[P]>) : T[P];
};

type SettingsStore = {
  settings: Settings;
  saveSettings: (patch: DeepPartial<Settings>) => void;
  removeSettings: (keys: (keyof Settings)[]) => void;
  resetSettings: () => void;
};

const throttleMs = 800; // Adjust as needed (500-1200ms is typical for good UX)

type StorageChangeListener<T> = (value: T | null) => void;
// Base adapter for browser.storage.local
export const baseChromeAdapter = {
  /**
   * Read
   */
  getItem: (name: string) =>
    new Promise<string | null>((resolve) => {
      browser.storage.local.get([name], (result) => {
        const val = result[name];
        resolve(val != null ? JSON.stringify(val) : null);
      });
    }),

  /**
   * Write
   */
  setItem: (name: string, value: string) =>
    new Promise<void>((resolve) => {
      browser.storage.local.set({ [name]: JSON.parse(value) }, () => resolve());
    }),

  /**
   * Remove
   */
  removeItem: (name: string) =>
    new Promise<void>((resolve) => {
      browser.storage.local.remove([name], () => resolve());
    }),

  /**
   * 🔥 Subscribe to external changes (multi-tab sync)
   * Zustand will call this automatically if present
   */
  subscribe: <T>(name: string, callback: StorageChangeListener<T>) => {
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== 'local') return;

      const change = changes[name];
      if (!change) return;

      callback(change.newValue != null ? (change.newValue as T) : null);
    };

    browser.storage.onChanged.addListener(listener);

    // Zustand expects an unsubscribe function
    return () => {
      browser.storage.onChanged.removeListener(listener);
    };
  },
};

// Wrap setItem with throttle for delayed writes
const throttledSetItem = throttle(baseChromeAdapter.setItem, throttleMs, {
  leading: false, // Don't write immediately
  trailing: true, // Write after the last call in the throttle window
});

// Custom storage with throttled writes
const throttledChromeAdapter = {
  ...baseChromeAdapter,
  setItem: throttledSetItem,
};

const chromeJSONStorage = createJSONStorage(() => throttledChromeAdapter);
const cloneDefaults = (): Settings => structuredClone(config.SETTINGS);

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: cloneDefaults(),

      saveSettings: (patch: DeepPartial<Settings>) =>
        set((state) => ({
          settings: deepMerge(state.settings, patch) as Settings,
        })),

      removeSettings: (keys: (keyof Settings)[]) =>
        set((state) => {
          const updated = structuredClone(state.settings);
          for (const key of keys) {
            delete updated[key];
          }
          return { settings: updated };
        }),

      resetSettings: () => set({ settings: cloneDefaults() }),
    }),
    {
      name: config.APP.storageBucket,

      // ✅ adapter with subscribe/onChanged
      storage: chromeJSONStorage,

      // persist only what we need
      partialize: (state) => ({ settings: state.settings }),

      // ✅ correct hydration merge order
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SettingsStore> | undefined;

        const merged = deepMerge(cloneDefaults(), persisted?.settings ?? {});

        return {
          ...currentState,
          settings: merged,
        };
      },
    }
  )
);

// Usage examples remain the same as in your original code
/*
//! Get the current state
const currentSettings = useSettingsStore.getState().settings;

//! Call actions directly
useSettingsStore.getState().saveSettings({ theme: 'dark' });
useSettingsStore.getState().removeSettings(['watermark']);
useSettingsStore.getState().resetSettings();

//! Subscribe to changes (optional)
const unsubscribe = useSettingsStore.subscribe((state) => {
  console.log('Settings changed:', state.settings);
});

useSettingsStore.persist.onFinishHydration(() => {
	useSettingsStore.subscribe(
        (s) => s.settings,
        (state) => {
          console.log('Settings changed:', state);
		  scanForMedia();
		}
    );
});

//! Later, unsubscribe
unsubscribe();
*/
