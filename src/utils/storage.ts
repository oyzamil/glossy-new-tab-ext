export interface Shortcut {
  id: string;
  title: string;
  url: string;
  icon?: string;
  iconFile?: string;
  color?: string;
  textColor?: string;
}

export interface AudioFile {
  id: string;
  name: string;
  path: string;
}

export interface WidgetSettings {
  clock: boolean;
  weather: boolean;
  audioPlayer: boolean;
}

export interface AppSettings {
  glassMorphism: boolean;
  blurAmount: number;
  videoPlayback: boolean;
  audioLoop: boolean;
}

const SHORTCUTS_KEY = 'shortcuts';
const AUDIO_FILES_KEY = 'audioFiles';
const SEARCH_ENGINE_KEY = 'searchEngine';
const WIDGET_SETTINGS_KEY = 'widgetSettings';
const APP_SETTINGS_KEY = 'appSettings';

export const getShortcuts = async (): Promise<Shortcut[]> => {
  const result = await chrome.storage.local.get(SHORTCUTS_KEY);
  return (result[SHORTCUTS_KEY] as Shortcut[]) ?? [];
};

export const saveShortcuts = async (shortcuts: Shortcut[]): Promise<void> => {
  await chrome.storage.local.set({ [SHORTCUTS_KEY]: shortcuts });
};

export const addShortcut = async (shortcut: Omit<Shortcut, 'id'>): Promise<void> => {
  const shortcuts = await getShortcuts();
  const newShortcut: Shortcut = {
    ...shortcut,
    id: `shortcut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  await saveShortcuts([...shortcuts, newShortcut]);
};

export const updateShortcut = async (id: string, updates: Partial<Shortcut>): Promise<void> => {
  const shortcuts = await getShortcuts();
  const updatedShortcuts = shortcuts.map((s) => (s.id === id ? { ...s, ...updates } : s));
  await saveShortcuts(updatedShortcuts);
};

export const deleteShortcut = async (id: string): Promise<void> => {
  const shortcuts = await getShortcuts();
  await saveShortcuts(shortcuts.filter((s) => s.id !== id));
};

export const getAudioFiles = async (): Promise<AudioFile[]> => {
  const result = await chrome.storage.local.get(AUDIO_FILES_KEY);
  return (result[AUDIO_FILES_KEY] as AudioFile[]) ?? [];
};

export const saveAudioFiles = async (files: AudioFile[]): Promise<void> => {
  await chrome.storage.local.set({ [AUDIO_FILES_KEY]: files });
};

export const getSearchEngine = async (): Promise<string> => {
  const result = await chrome.storage.local.get(SEARCH_ENGINE_KEY);
  return (result[SEARCH_ENGINE_KEY] as string) ?? 'google';
};

export const saveSearchEngine = async (engine: string): Promise<void> => {
  await chrome.storage.local.set({ [SEARCH_ENGINE_KEY]: engine });
};

export const getWidgetSettings = async (): Promise<WidgetSettings> => {
  const result = await chrome.storage.local.get(WIDGET_SETTINGS_KEY);
  return (
    (result[WIDGET_SETTINGS_KEY] as WidgetSettings) ?? {
      clock: true,
      weather: true,
      audioPlayer: false,
    }
  );
};

export const saveWidgetSettings = async (settings: WidgetSettings): Promise<void> => {
  await chrome.storage.local.set({ [WIDGET_SETTINGS_KEY]: settings });
};

export const getAppSettings = async (): Promise<AppSettings> => {
  const result = await chrome.storage.local.get(APP_SETTINGS_KEY);
  return (
    (result[APP_SETTINGS_KEY] as AppSettings) || {
      glassMorphism: true,
      blurAmount: 10,
      videoPlayback: true,
      audioLoop: true,
    }
  );
};

export const saveAppSettings = async (settings: AppSettings): Promise<void> => {
  await chrome.storage.local.set({ [APP_SETTINGS_KEY]: settings });
};
