/* ================================
   Default Wallpapers
================================ */

export interface Wallpaper {
  id: string;
  name: string;
  type: 'image' | 'video';
  path: string;
  thumbnail?: string;
  category?: string;
}

export const defaultWallpapers: Wallpaper[] = [
  {
    id: 'default-1',
    name: 'Black Glass',
    type: 'image',
    path: '/wallpapers/images/black-glass.png',
    category: 'abstract',
  },
];

/* ================================
   Wallpaper Categories
================================ */

export const wallpaperCategories = [
  { id: 'all', name: 'All' },
  { id: 'nature', name: 'Nature' },
  { id: 'urban', name: 'Urban' },
  { id: 'abstract', name: 'Abstract' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'space', name: 'Space' },
  { id: 'anime', name: 'Anime' },
  { id: 'custom', name: 'Custom' },
];

/* ================================
   Wallpaper Helpers
================================ */

export const getWallpapersByCategory = (category: string): Wallpaper[] => {
  if (category === 'all') {
    return defaultWallpapers;
  }
  return defaultWallpapers.filter((w) => w.category === category);
};

export const getWallpaperById = (id: string): Wallpaper | undefined => {
  return defaultWallpapers.find((w) => w.id === id);
};

export const getRandomWallpaper = (): Wallpaper | undefined => {
  if (defaultWallpapers.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * defaultWallpapers.length);
  return defaultWallpapers[randomIndex];
};

/* ================================
   Wallpaper Utilities
================================ */

export const isWallpaperAvailable = async (path: string): Promise<boolean> => {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

export const preloadWallpaper = (path: string, type: 'image' | 'video'): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (type === 'image') {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = path;
    } else {
      const video = document.createElement('video');
      video.onloadeddata = () => resolve();
      video.onerror = reject;
      video.src = path;
    }
  });
};
