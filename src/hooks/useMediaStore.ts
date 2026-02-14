import { useCallback, useEffect, useState } from 'react';
import Dexie, { Table } from 'dexie';

const BroadcastDB = 'media-store';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface StoredMedia {
  id?: string;
  type: 'image' | 'video' | 'audio';
  data: Blob;
  name: string;
  createdAt: number;
  updatedAt?: number;
}

export interface MediaListItem {
  id: string;
  createdAt: number;
  type: 'image' | 'video' | 'audio';
  name: string;
}

export interface MediaResult {
  items: MediaListItem[];
  totalCount: number;
  nextCursor?: number;
}

/* ------------------------------------------------------------------ */
/* Database Definition                                                 */
/* ------------------------------------------------------------------ */

class MediaDatabase extends Dexie {
  wallpapers!: Table<StoredMedia, string>;
  audio!: Table<StoredMedia, string>;
  // Add more tables as needed (e.g., documents, videos, etc.)
  meta!: Table<{ key: string; value: string }, string>;

  constructor() {
    super('media-store');

    this.version(1).stores({
      wallpapers: 'id, type, createdAt',
      audio: 'id, type, createdAt',
      meta: 'key',
    });
  }
}

const db = new MediaDatabase();

/* ------------------------------------------------------------------ */
/* Generic Media Operations                                            */
/* ------------------------------------------------------------------ */

type MediaTable = 'wallpapers' | 'audio';

function getTable(tableType: MediaTable): Table<StoredMedia, string> {
  return db[tableType];
}

function validateMediaFile(file: File, tableType: MediaTable) {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type);

  if (tableType === 'wallpapers' && !isImage && !isVideo) {
    throw new Error(`Unsupported wallpaper type: ${file.type}`);
  }

  if (tableType === 'audio' && !isAudio) {
    throw new Error(`Unsupported audio type: ${file.type}`);
  }

  // Validate file size
  let maxSize: number;
  if (isVideo) maxSize = MAX_VIDEO_SIZE;
  else if (isAudio) maxSize = MAX_AUDIO_SIZE;
  else maxSize = MAX_IMAGE_SIZE;

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }

  const type: 'image' | 'video' | 'audio' = isVideo ? 'video' : isAudio ? 'audio' : 'image';
  return type;
}

export async function saveMedia({
  tableType,
  id,
  file,
  setAsActive = true,
}: {
  tableType: MediaTable;
  id?: string;
  file: File;
  setAsActive?: boolean;
}) {
  const type = validateMediaFile(file, tableType);
  const now = Date.now();
  const mediaId = id ?? crypto.randomUUID();
  const table = getTable(tableType);

  await db.transaction('rw', table, db.meta, async () => {
    const existing = id ? await table.get(mediaId) : undefined;

    if (existing) {
      await table.put({
        ...existing,
        type,
        data: file,
        name: file.name,
        updatedAt: now,
      });
    } else {
      await table.put({
        id: mediaId,
        type,
        data: file,
        name: file.name,
        createdAt: now,
      });
    }

    if (setAsActive) {
      await db.meta.put({ key: `active_${tableType}`, value: mediaId });
    }
  });

  broadcastMediaUpdate(tableType, mediaId);
  return { id: mediaId, file };
}

export async function setActiveMedia(tableType: MediaTable, id: string) {
  await db.meta.put({ key: `active_${tableType}`, value: id });
  broadcastMediaUpdate(tableType, id);
}

export async function getActiveMediaId(tableType: MediaTable): Promise<string | undefined> {
  const record = await db.meta.get(`active_${tableType}`);
  return record?.value;
}

export async function getMediaBlob(tableType: MediaTable, id: string): Promise<Blob | null> {
  const table = getTable(tableType);
  const record = await table.get(id);
  if (!record) return null;
  return record.data;
}

export async function listMedia(
  tableType: MediaTable,
  options?: {
    limit?: number;
    cursor?: number;
  }
): Promise<MediaResult> {
  const { limit, cursor } = options || {};
  const table = getTable(tableType);

  const totalCount = await table.count();

  let query = table.orderBy('createdAt').reverse();

  if (cursor !== undefined) {
    query = query.filter((item) => item.createdAt < cursor);
  }

  const records = limit ? await query.limit(limit).toArray() : await query.toArray();

  const items: MediaListItem[] = records.map((r) => ({
    id: r.id!,
    createdAt: r.createdAt,
    type: r.type,
    name: r.name,
  }));

  const nextCursor =
    limit && items.length === limit ? items[items.length - 1].createdAt : undefined;

  return { items, totalCount, nextCursor };
}

export async function deleteMedia(tableType: MediaTable, ids: string | string[]) {
  const table = getTable(tableType);
  await table.bulkDelete(Array.isArray(ids) ? ids : [ids]);

  // If the deleted media was active, clear the active media
  const activeId = await getActiveMediaId(tableType);
  const deletedIds = Array.isArray(ids) ? ids : [ids];
  if (activeId && deletedIds.includes(activeId)) {
    await db.meta.delete(`active_${tableType}`);
  }
}

export async function clearMedia(tableType: MediaTable) {
  const table = getTable(tableType);
  await table.clear();
  await db.meta.delete(`active_${tableType}`);
}

/* ------------------------------------------------------------------ */
/* Broadcast Helper                                                    */
/* ------------------------------------------------------------------ */

function broadcastMediaUpdate(tableType: MediaTable, id: string) {
  const bc = new BroadcastChannel(BroadcastDB);
  bc.postMessage({ type: 'MEDIA_UPDATED', tableType, id });
  bc.close();
}

/* ------------------------------------------------------------------ */
/* React Hook for Wallpapers                                           */
/* ------------------------------------------------------------------ */

type ActiveMediaListener = (id: string, file: Blob) => void;
const activeWallpaperListeners = new Set<ActiveMediaListener>();

export function useWallpaperStore() {
  const [activeWallpaperId, setActiveWallpaperIdState] = useState<string | null>(null);
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const save = useCallback(
    async ({ id, file, setAsActive }: { id?: string; file: File; setAsActive?: boolean }) => {
      return await saveMedia({
        tableType: 'wallpapers',
        id,
        file,
        setAsActive,
      });
    },
    []
  );

  const loadWallpaperUrl = useCallback(async (id: string) => {
    const blob = await getMediaBlob('wallpapers', id);
    return blob ? URL.createObjectURL(blob) : null;
  }, []);

  const updateActiveWallpaperId = useCallback(
    async (id: string) => {
      await setActiveMedia('wallpapers', id);
      setActiveWallpaperIdState(id);

      const blob = await getMediaBlob('wallpapers', id);
      if (blob) {
        if (wallpaperUrl) URL.revokeObjectURL(wallpaperUrl);
        setWallpaperUrl(URL.createObjectURL(blob));
      }
    },
    [wallpaperUrl]
  );

  // Load initial wallpaper
  useEffect(() => {
    (async () => {
      try {
        const id = await getActiveMediaId('wallpapers');

        if (id) {
          setActiveWallpaperIdState(id);
          const blob = await getMediaBlob('wallpapers', id);
          if (blob) {
            setWallpaperUrl(URL.createObjectURL(blob));
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Subscribe to in-memory updates
  useEffect(() => {
    const listener: ActiveMediaListener = (id, blob) => {
      setActiveWallpaperIdState(id);
      if (wallpaperUrl) URL.revokeObjectURL(wallpaperUrl);
      setWallpaperUrl(URL.createObjectURL(blob));
    };

    activeWallpaperListeners.add(listener);
    return () => void activeWallpaperListeners.delete(listener);
  }, [wallpaperUrl]);

  // Subscribe to cross-tab updates
  useEffect(() => {
    const bc = new BroadcastChannel(BroadcastDB);

    bc.onmessage = async (event) => {
      if (event.data.type === 'MEDIA_UPDATED' && event.data.tableType === 'wallpapers') {
        const id = event.data.id;
        setActiveWallpaperIdState(id);

        const blob = await getMediaBlob('wallpapers', id);
        if (blob) {
          if (wallpaperUrl) URL.revokeObjectURL(wallpaperUrl);
          setWallpaperUrl(URL.createObjectURL(blob));
        }
      }
    };

    return () => bc.close();
  }, [wallpaperUrl]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (wallpaperUrl) URL.revokeObjectURL(wallpaperUrl);
    };
  }, [wallpaperUrl]);

  return {
    saveWallpaper: save,
    loadWallpaperUrl,
    getWallpaperBlob: (id: string) => getMediaBlob('wallpapers', id),
    activeWallpaperId,
    wallpaperUrl,
    isLoading,
    setActiveWallpaperId: updateActiveWallpaperId,
    listWallpapers: (options?: { limit?: number; cursor?: number }) =>
      listMedia('wallpapers', options),
    deleteWallpapers: (ids: string | string[]) => deleteMedia('wallpapers', ids),
    clearWallpapers: () => clearMedia('wallpapers'),
  };
}

/* ------------------------------------------------------------------ */
/* React Hook for Audio                                                */
/* ------------------------------------------------------------------ */

const activeAudioListeners = new Set<ActiveMediaListener>();

export function useAudioStore() {
  const [activeAudioId, setActiveAudioIdState] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const save = useCallback(
    async ({ id, file, setAsActive }: { id?: string; file: File; setAsActive?: boolean }) => {
      return await saveMedia({
        tableType: 'audio',
        id,
        file,
        setAsActive,
      });
    },
    []
  );

  const loadAudioUrl = useCallback(async (id: string) => {
    const blob = await getMediaBlob('audio', id);
    return blob ? URL.createObjectURL(blob) : null;
  }, []);

  const updateActiveAudioId = useCallback(
    async (id: string) => {
      await setActiveMedia('audio', id);
      setActiveAudioIdState(id);

      const blob = await getMediaBlob('audio', id);
      if (blob) {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
      }
    },
    [audioUrl]
  );

  // Load initial audio
  useEffect(() => {
    (async () => {
      try {
        const id = await getActiveMediaId('audio');

        if (id) {
          setActiveAudioIdState(id);
          const blob = await getMediaBlob('audio', id);
          if (blob) {
            setAudioUrl(URL.createObjectURL(blob));
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Subscribe to in-memory updates
  useEffect(() => {
    const listener: ActiveMediaListener = (id, blob) => {
      setActiveAudioIdState(id);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(blob));
    };

    activeAudioListeners.add(listener);
    return () => void activeAudioListeners.delete(listener);
  }, [audioUrl]);

  // Subscribe to cross-tab updates
  useEffect(() => {
    const bc = new BroadcastChannel(BroadcastDB);

    bc.onmessage = async (event) => {
      if (event.data.type === 'MEDIA_UPDATED' && event.data.tableType === 'audio') {
        const id = event.data.id;
        setActiveAudioIdState(id);

        const blob = await getMediaBlob('audio', id);
        if (blob) {
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          setAudioUrl(URL.createObjectURL(blob));
        }
      }
    };

    return () => bc.close();
  }, [audioUrl]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return {
    saveAudio: save,
    loadAudioUrl,
    getAudioBlob: (id: string) => getMediaBlob('audio', id),
    activeAudioId,
    audioUrl,
    isLoading,
    setActiveAudioId: updateActiveAudioId,
    listAudio: (options?: { limit?: number; cursor?: number }) => listMedia('audio', options),
    deleteAudio: (ids: string | string[]) => deleteMedia('audio', ids),
    clearAudio: () => clearMedia('audio'),
  };
}
