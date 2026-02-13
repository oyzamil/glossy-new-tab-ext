import Dexie, { Table } from 'dexie';

const BroadcastDB = 'wallpapers';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export interface Wallpaper {
  id: string;
  name: string;
  type: 'image' | 'video';
  path: string;
  thumbnail?: string;
  category?: string;
}

export interface StoredWallpaper {
  id?: string;
  type: 'image' | 'video';
  data: Blob;
  name: string;
  createdAt: number;
  updatedAt?: number;
}

export interface WallpaperListItem {
  id: string;
  createdAt: number;
  expiresAt?: number;
}

export interface WallpaperResult {
  items: WallpaperListItem[];
  totalCount: number;
  nextCursor?: number;
}

// Define the database
class WallpaperDatabase extends Dexie {
  wallpapers!: Table<StoredWallpaper, string>;
  meta!: Table<{ key: string; value: string }, string>;

  constructor() {
    super('wallpapers');

    this.version(6).stores({
      wallpapers: 'id, type, createdAt',
      meta: 'key',
    });
  }
}

const db = new WallpaperDatabase();

/* ------------------------------------------------------------------ */
/* Save / Load                                                         */
/* ------------------------------------------------------------------ */

type ActiveWallpaperListener = (id: string, file: Blob) => void;
const activeWallpaperListeners = new Set<ActiveWallpaperListener>();

export async function saveWallpaper({
  id,
  file,
  setAsActive = true,
}: {
  id?: string;
  file: File;
  expireDays?: number;
  setAsActive?: boolean;
}) {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  // Validate file size
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }
  const type = isImage ? 'image' : 'video';

  const now = Date.now();
  const wallpaperId = id ?? crypto.randomUUID();

  await cleanupExpiredWallpapers();

  await db.transaction('rw', db.wallpapers, db.meta, async () => {
    const existing = id ? await db.wallpapers.get(wallpaperId) : undefined;

    if (existing) {
      await db.wallpapers.put({
        ...existing,
        type,
        data: file,
        name: file.name,
        updatedAt: now,
      });
    } else {
      await db.wallpapers.put({
        id: wallpaperId,
        type,
        data: file,
        name: file.name,
        createdAt: now,
      });
    }

    if (setAsActive) {
      await db.meta.put({ key: 'activeWallpaperId', value: wallpaperId });
    }
  });

  activeWallpaperListeners.forEach((fn) => fn(wallpaperId, file));
  broadcastActiveWallpaper(wallpaperId);

  return { id: wallpaperId, file };
}

export async function setActiveWallpaperId(id: string) {
  await db.meta.put({ key: 'activeWallpaperId', value: id });
  broadcastActiveWallpaper(id);
}

export async function getActiveWallpaperId(): Promise<string | undefined> {
  const record = await db.meta.get('activeWallpaperId');
  return record?.value;
}

export async function getWallpaperBlob(id: string): Promise<Blob | null> {
  const record = await db.wallpapers.get(id);
  if (!record) return null;

  return record.data;
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

export async function listWallpapers(options?: {
  limit?: number;
  cursor?: number;
}): Promise<WallpaperResult> {
  const { limit, cursor } = options || {};

  const totalCount = await db.wallpapers.count();

  let query = db.wallpapers.orderBy('createdAt').reverse();

  if (cursor !== undefined) {
    query = query.filter((img) => img.createdAt < cursor);
  }

  const records = limit ? await query.limit(limit).toArray() : await query.toArray();

  const items: WallpaperListItem[] = records.map((r) => ({
    id: r.id!,
    createdAt: r.createdAt,
  }));

  const nextCursor =
    limit && items.length === limit ? items[items.length - 1].createdAt : undefined;

  return { items, totalCount, nextCursor };
}

/* ------------------------------------------------------------------ */
/* Cleanup & Delete                                                    */
/* ------------------------------------------------------------------ */

export async function cleanupExpiredWallpapers(): Promise<number> {
  // Note: The current schema doesn't have expiresAt, so this is a no-op
  // You can expand this if you add expiration functionality
  return 0;
}

export async function deleteWallpapers(ids: string | string[]) {
  await db.wallpapers.bulkDelete(Array.isArray(ids) ? ids : [ids]);

  // If the deleted wallpaper was active, clear the active wallpaper
  const activeId = await getActiveWallpaperId();
  const deletedIds = Array.isArray(ids) ? ids : [ids];
  if (activeId && deletedIds.includes(activeId)) {
    await db.meta.delete('activeWallpaperId');
  }
}

export async function clearImages() {
  await db.wallpapers.clear();
  await db.meta.delete('activeWallpaperId');
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function broadcastActiveWallpaper(id: string) {
  const bc = new BroadcastChannel(BroadcastDB);
  bc.postMessage({ type: 'WALLPAPER_UPDATED', id });
  bc.close();
}

/* ------------------------------------------------------------------ */
/* React Hook                                                          */
/* ------------------------------------------------------------------ */

export function useWallpaperStore() {
  const [activeWallpaperId, setActiveWallpaperIdState] = useState<string | null>(null);
  const [lastWallpaperUrl, setActiveWallpaperUrl] = useState<string | null>(null);

  const save = useCallback(
    async ({
      id,
      file,
      expireDays,
      setAsActive,
    }: {
      id?: string;
      file: File;
      expireDays?: number;
      setAsActive?: boolean;
    }) => {
      return await saveWallpaper({
        id,
        file,
        expireDays,
        setAsActive,
      });
    },
    []
  );

  const loadWallpaperUrl = useCallback(async (id: string) => {
    const blob = await getWallpaperBlob(id);
    return blob ? URL.createObjectURL(blob) : null;
  }, []);

  const updateActiveWallpaperId = useCallback(async (id: string) => {
    await setActiveWallpaperId(id);
    setActiveWallpaperIdState(id);
  }, []);

  // Load initial wallpaper
  useEffect(() => {
    (async () => {
      const id = await getActiveWallpaperId();
      if (!id) return;

      setActiveWallpaperIdState(id);
      const blob = await getWallpaperBlob(id);
      if (blob) setActiveWallpaperUrl(URL.createObjectURL(blob));
    })();
  }, []);

  // Subscribe to in-memory updates
  useEffect(() => {
    const listener: ActiveWallpaperListener = (id, blob) => {
      setActiveWallpaperIdState(id);
      if (lastWallpaperUrl) URL.revokeObjectURL(lastWallpaperUrl);
      setActiveWallpaperUrl(URL.createObjectURL(blob));
    };

    activeWallpaperListeners.add(listener);
    return () => void activeWallpaperListeners.delete(listener);
  }, [lastWallpaperUrl]);

  // Subscribe to cross-tab updates
  useEffect(() => {
    const bc = new BroadcastChannel(BroadcastDB);

    bc.onmessage = async (event) => {
      if (event.data.type === 'WALLPAPER_UPDATED') {
        const id = event.data.id;
        setActiveWallpaperIdState(id);

        const blob = await getWallpaperBlob(id);
        if (blob) {
          if (lastWallpaperUrl) URL.revokeObjectURL(lastWallpaperUrl);
          setActiveWallpaperUrl(URL.createObjectURL(blob));
        }
      }
    };

    return () => bc.close();
  }, [lastWallpaperUrl]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (lastWallpaperUrl) URL.revokeObjectURL(lastWallpaperUrl);
    };
  }, [lastWallpaperUrl]);

  return {
    saveWallpaper: save,
    loadWallpaperUrl,
    getWallpaperBlob,
    activeWallpaperId: activeWallpaperId,
    setActiveWallpaperId: updateActiveWallpaperId,
    listWallpapers,
    deleteWallpapers,
    cleanupExpiredWallpapers,
    clearImages,
  };
}
