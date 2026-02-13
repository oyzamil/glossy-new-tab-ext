import { Settings } from '@/app.config';
import { useAntd } from '@/providers/ThemeProvider';
import { Icon } from '@iconify/react';
import {
  Button,
  Card,
  Empty,
  Form,
  Popconfirm,
  Segmented,
  Slider,
  Switch,
  Tabs,
  Upload,
} from 'antd';
import { debounce } from 'lodash';
import CustomList from './CustomList';

interface SidebarProps {
  onBackgroundChange: (url: string | null, type: 'image' | 'video') => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export const Sidebar: React.FC<SidebarProps> = ({ onBackgroundChange, videoRef }) => {
  const { message } = useAntd();
  const {
    saveWallpaper,
    loadWallpaperUrl,
    activeWallpaperId,
    setActiveWallpaperId,
    listWallpapers,
    deleteWallpapers,
    cleanupExpiredWallpapers,
    getWallpaperBlob,
  } = useWallpaperStore();

  const [backgrounds, setBackgrounds] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [storageSize, setStorageSize] = useState<number>(0);
  const { settings, saveSettings } = useSettings();

  const [form] = Form.useForm<Settings>();

  const debouncedSubmit = useRef(debounce(onSubmit, 500)).current;

  async function onSubmit(settings: Settings) {
    message.open({
      key: 'saving',
      type: 'loading',
      content: 'Saving...',
      duration: 0,
    });
    try {
      saveSettings(settings);
      message.success({ key: 'saving', content: 'Settings Applied 🎊' });
    } catch (error) {
      message.error({
        key: 'saving',
        content: 'Saving failed, please try again',
      });
    }
  }

  useEffect(() => {
    loadBackgrounds();
    // loadCurrentBackground();
    updateStorageSize();
  }, []);

  const loadBackgrounds = async () => {
    try {
      const result = await listWallpapers();
      // Load full wallpaper data with blobs
      const wallpapersWithData = await Promise.all(
        result.items.map(async (item) => {
          const blob = await getWallpaperBlob(item.id);
          if (!blob) return null;

          // Determine type from blob
          const type = blob.type.startsWith('video/') ? 'video' : 'image';

          return {
            id: item.id,
            type,
            data: blob,
            name: `Background ${new Date(item.createdAt).toLocaleDateString()}`,
            createdAt: item.createdAt,
          };
        })
      );

      setBackgrounds(wallpapersWithData.filter(Boolean) as any[]);
    } catch (error) {
      console.error('Failed to load backgrounds:', error);
    }
  };

  const updateStorageSize = async () => {
    try {
      const result = await listWallpapers();
      let totalSize = 0;

      for (const item of result.items) {
        const blob = await getWallpaperBlob(item.id);
        if (blob) {
          totalSize += blob.size;
        }
      }

      setStorageSize(totalSize);
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
    }
  };

  const loadCurrentBackground = async () => {
    if (activeWallpaperId) {
      // Check if it's a default wallpaper
      const defaultWallpaper = DEFAULT_WALLPAPERS.find((w) => w.id === activeWallpaperId);
      if (defaultWallpaper) {
        onBackgroundChange(defaultWallpaper.path, defaultWallpaper.type);
        return;
      }

      // Otherwise, load from IndexedDB
      const url = await loadWallpaperUrl(activeWallpaperId);
      if (url) {
        const blob = await getWallpaperBlob(activeWallpaperId);
        const type = blob?.type.startsWith('video/') ? 'video' : 'image';
        onBackgroundChange(url, type);
      }
    }
  };

  // Re-load background when activeWallpaperId changes
  useEffect(() => {
    loadCurrentBackground();
  }, [activeWallpaperId]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await saveWallpaper({ file, setAsActive: true });
      message.success('Background uploaded successfully!');
      await loadBackgrounds();
      await updateStorageSize();

      // Background is already set as active by saveWallpaper
      const url = await loadWallpaperUrl(result.id);
      if (url) {
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        onBackgroundChange(url, type);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to upload background');
      console.error(error);
    } finally {
      setUploading(false);
    }

    return false;
  };

  const handleSetBackground = async (id: string, isDefault: boolean = false) => {
    if (isDefault) {
      // Handle default wallpaper
      const wallpaper = DEFAULT_WALLPAPERS.find((w) => w.id === id);
      if (wallpaper) {
        // Store default wallpaper ID in localStorage since it's not in IndexedDB
        localStorage.setItem('defaultWallpaperId', id);
        onBackgroundChange(wallpaper.path, wallpaper.type);
        message.success('Background applied!');
      }
    } else {
      // Handle user-uploaded background
      await setActiveWallpaperId(id);
      const url = await loadWallpaperUrl(id);
      if (url) {
        const blob = await getWallpaperBlob(id);
        const type = blob?.type.startsWith('video/') ? 'video' : 'image';
        onBackgroundChange(url, type);
        message.success('Background applied!');
      }
    }
  };

  const handleRemoveBackground = async (id: string) => {
    try {
      await deleteWallpapers(id);

      if (activeWallpaperId === id) {
        onBackgroundChange(null, 'image');
      }

      await loadBackgrounds();
      await updateStorageSize();
      message.success('Background removed!');
    } catch (error) {
      message.error('Failed to remove background');
      console.error(error);
    }
  };

  const handleClearBackground = async () => {
    localStorage.removeItem('defaultWallpaperId');
    onBackgroundChange(null, 'image');
    message.success('Background cleared!');
  };

  const handleCleanup = async () => {
    try {
      await cleanupExpiredWallpapers();
      await loadBackgrounds();
      await updateStorageSize();
      message.success('Old backgrounds cleaned up!');
    } catch (error) {
      message.error('Failed to cleanup backgrounds');
      console.error(error);
    }
  };

  const handleCaptureFrame = () => {
    if (videoRef?.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            // Convert blob to File for saveWallpaper
            const file = new File([blob], `captured-frame-${Date.now()}.png`, {
              type: 'image/png',
            });

            try {
              const result = await saveWallpaper({ file, setAsActive: true });
              const url = await loadWallpaperUrl(result.id);
              if (url) {
                onBackgroundChange(url, 'image');
                message.success('Frame captured as image!');
                await loadBackgrounds();
                await updateStorageSize();
              }
            } catch (error) {
              message.error('Failed to capture frame');
              console.error(error);
            }
          }
        }, 'image/png');
      }
    }
  };

  const currentBackground = backgrounds.find((b) => b.id === activeWallpaperId);
  const isVideoBackground = currentBackground?.type === 'video';

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getBackgroundURL = (blob: Blob, id: string) => {
    return URL.createObjectURL(blob);
  };

  return (
    <div className="space-y-4">
      <Form
        className="mb-0 space-y-3"
        form={form}
        initialValues={settings}
        onValuesChange={(_, allValues) => {
          debouncedSubmit(allValues);
        }}
        layout="inline"
      >
        <Form.Item label="Theme" name="theme">
          <Segmented
            className="w-auto"
            onChange={(value) => {
              form.setFieldValue('theme', value);
            }}
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'System', value: 'system' },
            ]}
          />
        </Form.Item>
        {/* Widget Toggles */}
        <Card className="w-full" title="Widgets" size="small">
          <Form.Item label="Clock" name="clockWidget">
            <Switch
              checked={settings.clockWidget}
              onChange={(checked) => form.setFieldValue('clockWidget', checked)}
            />
          </Form.Item>

          <Form.Item label="Player" name="audioPlayerWidget">
            <Switch
              checked={settings.audioPlayerWidget}
              onChange={(checked) => {
                form.setFieldValue('audioPlayerWidget', checked);
                form.setFieldValue('audioPlaying', checked);
              }}
            />
          </Form.Item>
          <Form.Item label="Quotes" name="quotesWidget">
            <Switch
              checked={settings.quotesWidget}
              onChange={(checked) => {
                form.setFieldValue('quotesWidget', checked);
              }}
            />
          </Form.Item>
          <Form.Item label="Multi Widget" name="multiWidget">
            <Switch
              checked={settings.multiWidget}
              onChange={(checked) => form.setFieldValue('multiWidget', checked)}
            />
          </Form.Item>
        </Card>

        <Card className="w-full" title="Appearance" size="small">
          <Form.Item label="Blur Amount" name="blurAmount">
            <Slider
              min={1}
              max={100}
              value={settings.blurAmount}
              onChange={(value) => form.setFieldValue('blurAmount', value)}
            />
          </Form.Item>
          <Form.Item label="Glass Effect" name="glassMorphism">
            <Switch
              checked={settings.glassMorphism}
              onChange={(checked) => form.setFieldValue('glassMorphism', checked)}
            />
          </Form.Item>

          {/* <Form.Item label="Show Time in Standby" name="showTimeInStandby">
            <Switch
              checked={settings.showTimeInStandby}
              onChange={(checked) => form.setFieldValue('showTimeInStandby', checked)}
            />
          </Form.Item> */}
          <Form.Item label="Hide Controls on Inactivity" name="hideControlsOnInactivity">
            <Switch
              checked={settings.hideControlsOnInactivity}
              onChange={(checked) => form.setFieldValue('hideControlsOnInactivity', checked)}
            />
          </Form.Item>
        </Card>
        {isVideoBackground && (
          <Card className="w-full" title="Wallpaper Controls" size="small">
            <Form.Item label="Video Playback" name="videoPlayback">
              <Switch
                checked={settings.videoPlayback}
                onChange={(checked) => {
                  form.setFieldValue('videoPlayback', checked);
                  if (videoRef?.current) {
                    if (checked) {
                      videoRef.current.play();
                    } else {
                      videoRef.current.pause();
                    }
                  }
                }}
                checkedChildren={'Dynamic'}
                unCheckedChildren={'Static'}
              />
            </Form.Item>
          </Card>
        )}
      </Form>

      <Tabs
        styles={{
          header: {
            marginBottom: '5px',
          },
        }}
        defaultActiveKey="custom"
        items={[
          {
            key: 'custom',
            label: 'My Wallpapers',
            children: (
              <div className="space-y-3">
                <Card className="glass-card" title="Upload Wallpaper" size="small">
                  <Upload.Dragger
                    beforeUpload={handleUpload}
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
                  <span>Storage used: {formatSize(storageSize)}</span>
                  {backgrounds.length > 5 && (
                    <Button type="link" size="small" onClick={handleCleanup}>
                      Cleanup Old
                    </Button>
                  )}
                </div>

                {/* Background List */}
                <CustomList
                  className="max-h-100 overflow-y-auto pr-1"
                  dataSource={backgrounds}
                  empty={<Empty description="No custom backgrounds" />}
                  renderItem={(bg) => {
                    const isActive = activeWallpaperId === bg.id;

                    return (
                      <div
                        className={`group flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-200 ${isActive ? 'bg-gray-400/10' : 'hover:bg-white/5'} `}
                      >
                        {/* LEFT SIDE */}
                        <div className="flex items-center gap-3">
                          {/* Thumbnail */}
                          {bg.type === 'image' ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={getBackgroundURL(bg.data, bg.id)}
                              alt={bg.name}
                            />
                          ) : (
                            <div className="glass flex h-12 w-12 items-center justify-center rounded-lg">
                              <Icon className="text-2xl" icon="material-symbols:videocam" />
                            </div>
                          )}

                          {/* Text */}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{bg.name}</span>

                            <span className="text-xs capitalize opacity-70">
                              {bg.type === 'image' ? 'Image' : 'Video'} • {formatSize(bg.data.size)}
                            </span>
                          </div>
                        </div>

                        {/* RIGHT SIDE ACTIONS */}
                        <div className="flex items-center gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                          {/* Apply Button */}
                          <Button
                            type={isActive ? 'default' : 'link'}
                            size="small"
                            disabled={isActive}
                            onClick={() => handleSetBackground(bg.id)}
                            icon={<Icon icon="material-symbols:check-circle" />}
                          >
                            {isActive ? 'Active' : 'Apply'}
                          </Button>

                          {/* Delete */}
                          <Popconfirm
                            title="Delete background"
                            description="Are you sure?"
                            onConfirm={() => handleRemoveBackground(bg.id)}
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
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            ),
          },
          {
            key: 'default',
            label: 'Default Wallpapers',
            children: (
              <CustomList
                dataSource={DEFAULT_WALLPAPERS}
                empty={<Empty description="No default wallpapers available." />}
                renderItem={(wallpaper) => {
                  const isActive = localStorage.getItem('defaultWallpaperId') === wallpaper.id;

                  return (
                    <div
                      className={`flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors ${isActive ? 'bg-gray-400/10' : 'hover:bg-white/5'} `}
                      onClick={() => handleSetBackground(wallpaper.id, true)}
                    >
                      {/* Left Side */}
                      <div className="flex items-center gap-3">
                        <div className="glass flex h-12 w-12 items-center justify-center rounded">
                          <Icon
                            className="text-2xl"
                            icon={
                              wallpaper.type === 'image'
                                ? 'material-symbols:image'
                                : 'material-symbols:videocam'
                            }
                          />
                        </div>

                        <div className="flex flex-col">
                          <span className="text-sm">{wallpaper.name}</span>
                          <span className="text-xs capitalize">
                            {wallpaper.category || 'Default'} • {wallpaper.type}
                          </span>
                        </div>
                      </div>

                      {/* Right Side */}
                      {isActive && (
                        <Icon
                          className="text-app-500 text-xl"
                          icon="material-symbols:check-circle"
                        />
                      )}
                    </div>
                  );
                }}
              />
            ),
          },
        ]}
      />

      {/* {(activeWallpaperId || localStorage.getItem('defaultWallpaperId')) && (
        <Button
          type="primary"
          danger
          block
          onClick={handleClearBackground}
          icon={<Icon icon="material-symbols:clear" />}
        >
          Clear Current Background
        </Button>
      )} */}
    </div>
  );
};
