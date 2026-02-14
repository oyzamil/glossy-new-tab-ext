import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Button, Card, Empty, message, Popconfirm, Tabs, Upload } from 'antd';

// Custom List Component
const CustomList = ({ dataSource, renderItem, empty, className = '' }: any) => {
  if (!dataSource || dataSource.length === 0) {
    return <div className="py-8">{empty}</div>;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {dataSource.map((item: any, index: number) => (
        <div key={item.id || index}>{renderItem(item)}</div>
      ))}
    </div>
  );
};

// Format file size
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function MediaSettings() {
  const {
    wallpaperUrl,
    activeWallpaperId,
    saveWallpaper,
    setActiveWallpaperId,
    listWallpapers,
    deleteWallpapers,
    getWallpaperBlob,
  } = useWallpaperStore();

  const {
    audioUrl,
    activeAudioId,
    saveAudio,
    setActiveAudioId,
    listAudio,
    deleteAudio,
    getAudioBlob,
  } = useAudioStore();

  const [backgrounds, setBackgrounds] = useState<any[]>([]);
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [storageSize, setStorageSize] = useState({ wallpapers: 0, audio: 0 });

  // Load custom wallpapers
  useEffect(() => {
    loadBackgrounds();
  }, []);

  // Load custom audio
  useEffect(() => {
    loadAudioTracks();
  }, []);

  const loadBackgrounds = async () => {
    try {
      const { items } = await listWallpapers();
      const backgrounds = await Promise.all(
        items.map(async (item) => {
          const blob = await getWallpaperBlob(item.id);
          return {
            id: item.id,
            name: blob ? 'Custom Background' : item.id,
            type: blob?.type.startsWith('video/') ? 'video' : 'image',
            data: blob,
            createdAt: item.createdAt,
          };
        })
      );
      setBackgrounds(backgrounds);

      // Calculate storage
      const totalSize = backgrounds.reduce((acc, bg) => acc + (bg.data?.size || 0), 0);
      setStorageSize((prev) => ({ ...prev, wallpapers: totalSize }));
    } catch (error) {
      console.error('Failed to load backgrounds:', error);
    }
  };

  const loadAudioTracks = async () => {
    try {
      const { items } = await listAudio();
      const tracks = await Promise.all(
        items.map(async (item) => {
          const blob = await getAudioBlob(item.id);
          return {
            id: item.id,
            name: item.name || 'Custom Audio',
            data: blob,
            createdAt: item.createdAt,
          };
        })
      );
      setAudioTracks(tracks);

      // Calculate storage
      const totalSize = tracks.reduce((acc, track) => acc + (track.data?.size || 0), 0);
      setStorageSize((prev) => ({ ...prev, audio: totalSize }));
    } catch (error) {
      console.error('Failed to load audio:', error);
    }
  };

  /* ---------------------------------------------------------------- */
  /* WALLPAPER HANDLERS                                               */
  /* ---------------------------------------------------------------- */

  const handleWallpaperUpload = async (file: File) => {
    setUploading(true);
    try {
      await saveWallpaper({ file, setAsActive: true });
      message.success('Wallpaper uploaded successfully!');
      await loadBackgrounds();
    } catch (error: any) {
      message.error(error.message || 'Failed to upload wallpaper');
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload
  };

  const handleSetWallpaper = async (id: string, isDefault = false) => {
    try {
      if (isDefault) {
        // Set default wallpaper
        localStorage.setItem('defaultWallpaperId', id);
        const wallpaper = ALL_DEFAULT_WALLPAPERS.find((w) => w.id === id);
        if (wallpaper) {
          // Trigger app to reload default wallpaper
          window.dispatchEvent(new CustomEvent('wallpaper-changed', { detail: wallpaper }));
        }
      } else {
        // Set custom wallpaper
        await setActiveWallpaperId(id);
        localStorage.removeItem('defaultWallpaperId');
      }
      message.success('Wallpaper applied!');
    } catch (error) {
      message.error('Failed to apply wallpaper');
    }
  };

  const handleRemoveWallpaper = async (id: string) => {
    try {
      await deleteWallpapers(id);
      message.success('Wallpaper deleted');
      await loadBackgrounds();
    } catch (error) {
      message.error('Failed to delete wallpaper');
    }
  };

  const getBackgroundURL = (blob: Blob | null, id: string): string => {
    if (!blob) return '';
    return URL.createObjectURL(blob);
  };

  /* ---------------------------------------------------------------- */
  /* AUDIO HANDLERS                                                   */
  /* ---------------------------------------------------------------- */

  const handleAudioUpload = async (file: File) => {
    setUploading(true);
    try {
      await saveAudio({ file, setAsActive: true });
      message.success('Audio uploaded successfully!');
      await loadAudioTracks();
    } catch (error: any) {
      message.error(error.message || 'Failed to upload audio');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleSetAudio = async (id: string, isDefault = false) => {
    try {
      if (isDefault) {
        localStorage.setItem('defaultAudioId', id);
        const audio = ALL_DEFAULT_AUDIO.find((a) => a.id === id);
        if (audio) {
          window.dispatchEvent(new CustomEvent('audio-changed', { detail: audio }));
        }
      } else {
        await setActiveAudioId(id);
        localStorage.removeItem('defaultAudioId');
      }
      message.success('Audio applied!');
    } catch (error) {
      message.error('Failed to apply audio');
    }
  };

  const handleRemoveAudio = async (id: string) => {
    try {
      await deleteAudio(id);
      message.success('Audio deleted');
      await loadAudioTracks();
    } catch (error) {
      message.error('Failed to delete audio');
    }
  };

  const getAudioURL = (blob: Blob | null): string => {
    if (!blob) return '';
    return URL.createObjectURL(blob);
  };

  /* ---------------------------------------------------------------- */
  /* COMBINED WALLPAPERS (DEFAULT + CUSTOM)                          */
  /* ---------------------------------------------------------------- */

  const allWallpapers = [
    ...backgrounds.map((bg) => ({
      ...bg,
      isCustom: true,
      isActive: activeWallpaperId === bg.id,
    })),
    ...ALL_DEFAULT_WALLPAPERS.map((wp) => ({
      ...wp,
      isCustom: false,
      isActive: localStorage.getItem('defaultWallpaperId') === wp.id,
    })),
  ];

  /* ---------------------------------------------------------------- */
  /* COMBINED AUDIO (DEFAULT + CUSTOM)                               */
  /* ---------------------------------------------------------------- */

  const allAudio = [
    ...audioTracks.map((track) => ({
      ...track,
      isCustom: true,
      isActive: activeAudioId === track.id,
    })),
    ...ALL_DEFAULT_AUDIO.map((audio) => ({
      ...audio,
      isCustom: false,
      isActive: localStorage.getItem('defaultAudioId') === audio.id,
    })),
  ];

  return (
    <Tabs
      defaultActiveKey="wallpapers"
      items={[
        {
          key: 'wallpapers',
          label: (
            <span className="flex items-center gap-2">
              <Icon icon="material-symbols:wallpaper" />
              Wallpapers
            </span>
          ),
          children: (
            <div className="space-y-3">
              {/* Upload Card */}
              <Card className="glass-card" title="Upload Wallpaper" size="small">
                <Upload.Dragger
                  beforeUpload={handleWallpaperUpload}
                  showUploadList={false}
                  accept="image/*,video/*"
                  disabled={uploading}
                >
                  <p className="ant-upload-drag-icon">
                    <Icon className="text-4xl" icon="material-symbols:cloud-upload" />
                  </p>
                  <p className="ant-upload-text">Click or drag file to upload</p>
                  <p className="ant-upload-hint text-white/60">
                    Images: 10MB max | Videos: 100MB max
                  </p>
                </Upload.Dragger>
              </Card>

              {/* Storage Info */}
              <div className="flex items-center justify-between text-sm opacity-70">
                <span>Custom wallpapers: {formatSize(storageSize.wallpapers)}</span>
              </div>

              {/* Combined List */}
              <CustomList
                className="max-h-100 overflow-y-auto pr-1"
                dataSource={allWallpapers}
                empty={<Empty description="No wallpapers available" />}
                renderItem={(item: any) => (
                  <div
                    className={`group flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-200 ${
                      item.isActive ? 'bg-gray-400/10' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Left Side */}
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      {item.isCustom ? (
                        item.type === 'image' ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={getBackgroundURL(item.data, item.id)}
                            alt={item.name}
                          />
                        ) : (
                          <div
                            className="glass flex h-12 w-12 items-center justify-center rounded-lg"
                          >
                            <Icon className="text-2xl" icon="material-symbols:videocam" />
                          </div>
                        )
                      ) : (
                        <div className="glass flex h-12 w-12 items-center justify-center rounded-lg">
                          <Icon
                            className="text-2xl"
                            icon={
                              item.type === 'image'
                                ? 'material-symbols:image'
                                : 'material-symbols:videocam'
                            }
                          />
                        </div>
                      )}

                      {/* Text */}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-xs capitalize opacity-70">
                          {item.isCustom ? (
                            <>
                              Custom • {item.type} • {formatSize(item.data?.size || 0)}
                            </>
                          ) : (
                            <>
                              Default • {item.category || 'Preset'} • {item.type}
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                      {/* Apply Button */}
                      <Button
                        type={item.isActive ? 'default' : 'link'}
                        size="small"
                        disabled={item.isActive}
                        onClick={() => handleSetWallpaper(item.id, !item.isCustom)}
                        icon={<Icon icon="material-symbols:check-circle" />}
                      >
                        {item.isActive ? 'Active' : 'Apply'}
                      </Button>

                      {/* Delete (only for custom) */}
                      {item.isCustom && (
                        <Popconfirm
                          title="Delete wallpaper"
                          description="Are you sure?"
                          onConfirm={() => handleRemoveWallpaper(item.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            type="link"
                            size="small"
                            danger
                            icon={<Icon icon="material-symbols:delete" />}
                          />
                        </Popconfirm>
                      )}
                    </div>
                  </div>
                )}
              />
            </div>
          ),
        },
        {
          key: 'audio',
          label: (
            <span className="flex items-center gap-2">
              <Icon icon="material-symbols:audio-file" />
              Audio
            </span>
          ),
          children: (
            <div className="space-y-3">
              {/* Upload Card */}
              <Card className="glass-card" title="Upload Audio" size="small">
                <Upload.Dragger
                  beforeUpload={handleAudioUpload}
                  showUploadList={false}
                  accept="audio/*"
                  disabled={uploading}
                >
                  <p className="ant-upload-drag-icon">
                    <Icon className="text-4xl" icon="material-symbols:cloud-upload" />
                  </p>
                  <p className="ant-upload-text">Click or drag file to upload</p>
                  <p className="ant-upload-hint text-white/60">Audio files: 50MB max</p>
                </Upload.Dragger>
              </Card>

              {/* Storage Info */}
              <div className="flex items-center justify-between text-sm opacity-70">
                <span>Custom audio: {formatSize(storageSize.audio)}</span>
              </div>

              {/* Combined List */}
              <CustomList
                className="max-h-100 overflow-y-auto pr-1"
                dataSource={allAudio}
                empty={<Empty description="No audio available" />}
                renderItem={(item: any) => (
                  <div
                    className={`group flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-200 ${
                      item.isActive ? 'bg-gray-400/10' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Left Side */}
                    <div className="flex items-center gap-3">
                      <div className="glass flex h-12 w-12 items-center justify-center rounded-lg">
                        <Icon
                          className="text-2xl"
                          icon={
                            item.isCustom
                              ? 'material-symbols:audio-file'
                              : 'material-symbols:library-music'
                          }
                        />
                      </div>

                      {/* Text */}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-xs opacity-70">
                          {item.isCustom ? (
                            <>Custom • {formatSize(item.data?.size || 0)}</>
                          ) : (
                            <>Default • Preset</>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                      {/* Apply Button */}
                      <Button
                        type={item.isActive ? 'default' : 'link'}
                        size="small"
                        disabled={item.isActive}
                        onClick={() => handleSetAudio(item.id, !item.isCustom)}
                        icon={<Icon icon="material-symbols:check-circle" />}
                      >
                        {item.isActive ? 'Active' : 'Apply'}
                      </Button>

                      {/* Delete (only for custom) */}
                      {item.isCustom && (
                        <Popconfirm
                          title="Delete audio"
                          description="Are you sure?"
                          onConfirm={() => handleRemoveAudio(item.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            type="link"
                            size="small"
                            danger
                            icon={<Icon icon="material-symbols:delete" />}
                          />
                        </Popconfirm>
                      )}
                    </div>
                  </div>
                )}
              />
            </div>
          ),
        },
      ]}
    />
  );
}
