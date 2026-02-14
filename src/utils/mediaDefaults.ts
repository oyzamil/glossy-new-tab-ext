export interface Wallpaper {
  id: string;
  name: string;
  type: 'image' | 'video';
  path: string;
  category?: string;
}

export interface Audio {
  id: string;
  name: string;
  path: string;
}
/* ------------------------------------------------------------------ */

function extractName(filePath: string): string {
  const fileName = filePath.split('/').pop() || '';
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function generateId(filePath: string, prefix: string = ''): string {
  const hash = filePath.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  return `${prefix}${Math.abs(hash).toString(36)}`;
}

function getMediaType(filePath: string): 'image' | 'video' {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const videoExts = ['mp4', 'webm', 'ogg', 'mov'];
  return videoExts.includes(ext || '') ? 'video' : 'image';
}

/* ------------------------------------------------------------------ */
/* FACTORY FUNCTIONS                                                  */
/* ------------------------------------------------------------------ */

export function createWallpaper(
  path: string,
  overrides?: Partial<Omit<Wallpaper, 'id' | 'path'>>
): Wallpaper {
  return {
    id: generateId(path, 'wp-'),
    name: extractName(path),
    type: getMediaType(path),
    path,
    category: 'default',
    ...overrides,
  };
}

export function createAudio(path: string, overrides?: Partial<Omit<Audio, 'id' | 'path'>>): Audio {
  return {
    id: generateId(path, 'audio-'),
    name: extractName(path),
    path,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* TRANSFORM SIMPLE INPUT → FULL CONFIG                               */
/* ------------------------------------------------------------------ */

export const ALL_DEFAULT_AUDIO: Audio[] = DEFAULT_TRACKS.map((path) => createAudio(path));

export const ALL_DEFAULT_WALLPAPERS: Wallpaper[] = DEFAULT_WALLPAPERS.map((item) =>
  createWallpaper(item.path, {
    category: item.category,
  })
);

/* ------------------------------------------------------------------ */
/* GETTERS                                                            */
/* ------------------------------------------------------------------ */

export async function getAllWallpapers(customWallpapers: Wallpaper[] = []): Promise<Wallpaper[]> {
  return [...customWallpapers, ...ALL_DEFAULT_WALLPAPERS];
}

export async function getAllAudio(customAudio: Audio[] = []): Promise<Audio[]> {
  return [...customAudio, ...ALL_DEFAULT_AUDIO];
}
