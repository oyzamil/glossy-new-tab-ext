import { useEffect, useState } from 'react';
import { Settings } from '@/app.config';
import { useAntd } from '@/providers/ThemeProvider';
import { Icon } from '@iconify/react';
import {
  Button,
  Card,
  Divider,
  Empty,
  Form,
  List,
  Popconfirm,
  Segmented,
  Slider,
  Switch,
  Tabs,
  Upload,
} from 'antd';
import { debounce } from 'lodash';

interface SidebarProps {
  onBackgroundChange: (url: string | null, type: 'image' | 'video') => void;
  onSettingsChange: (settings: AppSettings) => void;
  onWidgetSettingsChange: (settings: WidgetSettings) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

interface WidgetSettings {
  clock: boolean;
  weather: boolean;
  audioPlayer: boolean;
}

interface AppSettings {
  glassMorphism: boolean;
  blurAmount: number;
  videoPlayback: boolean;
  audioLoop: boolean;
}

interface DefaultWallpaper {
  id: string;
  name: string;
  path: string;
  type: 'image' | 'video';
  category?: string;
}

const defaultWallpapers: DefaultWallpaper[] = [
  {
    id: 'default-1',
    name: 'Black Glass',
    path: '/wallpapers/black-glass.jpg',
    type: 'image',
    category: 'abstract',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  onBackgroundChange,
  onSettingsChange,
  onWidgetSettingsChange,
  videoRef,
}) => {
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
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>({
    clock: true,
    weather: true,
    audioPlayer: false,
  });
  const [appSettings, setAppSettings] = useState<AppSettings>({
    glassMorphism: true,
    blurAmount: 10,
    videoPlayback: true,
    audioLoop: true,
  });

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
      message.success({ key: 'saving', content: 'Settings saved' });
    } catch (error) {
      message.error({
        key: 'saving',
        content: 'Saving failed, please try again',
      });
    }
  }

  useEffect(() => {
    loadBackgrounds();
    loadCurrentBackground();
    loadSettings();
    updateStorageSize();
  }, []);

  const loadSettings = async () => {
    // Load settings from localStorage or your settings store
    const savedWidgets = localStorage.getItem('widgetSettings');
    const savedApp = localStorage.getItem('appSettings');

    if (savedWidgets) {
      const widgets = JSON.parse(savedWidgets);
      setWidgetSettings(widgets);
      onWidgetSettingsChange(widgets);
    }

    if (savedApp) {
      const app = JSON.parse(savedApp);
      setAppSettings(app);
      onSettingsChange(app);
    }
  };

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
      const defaultWallpaper = defaultWallpapers.find((w) => w.id === activeWallpaperId);
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
      const wallpaper = defaultWallpapers.find((w) => w.id === id);
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

  const handleWidgetToggle = async (key: keyof WidgetSettings, value: boolean) => {
    const newSettings = { ...widgetSettings, [key]: value };
    setWidgetSettings(newSettings);
    localStorage.setItem('widgetSettings', JSON.stringify(newSettings));
    onWidgetSettingsChange(newSettings);
  };

  const handleAppSettingToggle = async (key: keyof AppSettings, value: boolean | number) => {
    const newSettings = { ...appSettings, [key]: value };
    setAppSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    onSettingsChange(newSettings);
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

  const labelColumn = { flex: '80px' };

  return (
    <div className="space-y-4">
      <Form
        className="mb-0"
        form={form}
        initialValues={settings}
        onValuesChange={(_, allValues) => {
          debouncedSubmit(allValues);
        }}
        layout="inline"
      >
        <Form.Item className="-mt-1 w-full" label="Theme" name="theme" labelCol={labelColumn}>
          <Segmented
            onChange={(value) => {
              form.setFieldValue('theme', value);
            }}
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'System', value: 'system' },
            ]}
            block
          />
        </Form.Item>
      </Form>

      {/* Widget Toggles */}
      <Card className="glass-card" title="Widgets" size="small">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Clock</span>
            <Switch
              checked={widgetSettings.clock}
              onChange={(checked) => handleWidgetToggle('clock', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Weather</span>
            <Switch
              checked={widgetSettings.weather}
              onChange={(checked) => handleWidgetToggle('weather', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Audio Player</span>
            <Switch
              checked={widgetSettings.audioPlayer}
              onChange={(checked) => handleWidgetToggle('audioPlayer', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Appearance Settings */}
      <Card className="glass-card" title="Appearance" size="small">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Glass Morphism</span>
            <Switch
              checked={appSettings.glassMorphism}
              onChange={(checked) => handleAppSettingToggle('glassMorphism', checked)}
            />
          </div>
          {appSettings.glassMorphism && (
            <div className="space-y-2">
              <span className="text-sm">Blur Amount</span>
              <Slider
                min={0}
                max={100}
                value={appSettings.blurAmount}
                onChange={(value) => handleAppSettingToggle('blurAmount', value)}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Video Controls */}
      {isVideoBackground && (
        <Card className="glass-card" title="Video Controls" size="small">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Video Playback</span>
              <Switch
                checked={appSettings.videoPlayback}
                onChange={(checked) => {
                  handleAppSettingToggle('videoPlayback', checked);
                  if (videoRef?.current) {
                    if (checked) {
                      videoRef.current.play();
                    } else {
                      videoRef.current.pause();
                    }
                  }
                }}
              />
            </div>
          </div>
        </Card>
      )}

      <Divider />

      {/* Backgrounds Tabs */}
      <Tabs
        defaultActiveKey="custom"
        items={[
          {
            key: 'custom',
            label: 'My Backgrounds',
            children: (
              <div className="space-y-4">
                {/* Upload Background */}
                <Card className="glass-card" title="Upload Background" size="small">
                  <Upload.Dragger
                    beforeUpload={handleUpload}
                    showUploadList={false}
                    accept="image/*,video/*"
                    disabled={uploading}
                  >
                    <p className="ant-upload-drag-icon">
                      <Icon
                        className="text-4xl text-blue-400"
                        icon="material-symbols:cloud-upload"
                      />
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
                <List
                  dataSource={backgrounds}
                  locale={{ emptyText: <Empty description="No custom backgrounds" /> }}
                  renderItem={(bg) => (
                    <List.Item
                      className={`${activeWallpaperId === bg.id ? 'bg-blue-500/20' : ''} rounded-lg px-2 transition-colors hover:bg-white/5`}
                      actions={[
                        <Button
                          type="link"
                          size="small"
                          onClick={() => handleSetBackground(bg.id)}
                          disabled={activeWallpaperId === bg.id}
                          icon={<Icon icon="material-symbols:check-circle" />}
                        >
                          {activeWallpaperId === bg.id ? 'Active' : 'Apply'}
                        </Button>,
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
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          bg.type === 'image' ? (
                            <img
                              className="h-12 w-12 rounded object-cover"
                              src={getBackgroundURL(bg.data, bg.id)}
                              alt={bg.name}
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-700">
                              <Icon className="text-2xl" icon="material-symbols:videocam" />
                            </div>
                          )
                        }
                        title={<span className="text-sm">{bg.name}</span>}
                        description={
                          <span className="text-xs text-white/60">
                            {bg.type === 'image' ? 'Image' : 'Video'} • {formatSize(bg.data.size)}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            ),
          },
          {
            key: 'default',
            label: 'Default Wallpapers',
            children: (
              <List
                dataSource={defaultWallpapers}
                locale={{
                  emptyText: (
                    <Empty description="No default wallpapers available. Add wallpapers to public/wallpapers/" />
                  ),
                }}
                renderItem={(wallpaper) => {
                  const isActive = localStorage.getItem('defaultWallpaperId') === wallpaper.id;
                  return (
                    <List.Item
                      className={`${isActive ? 'bg-blue-500/20' : ''} cursor-pointer rounded-lg px-2 transition-colors hover:bg-white/5`}
                      onClick={() => handleSetBackground(wallpaper.id, true)}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className="flex h-12 w-12 items-center justify-center rounded bg-linear-to-br from-blue-500 to-purple-600">
                            <Icon
                              className="text-2xl text-white"
                              icon={
                                wallpaper.type === 'image'
                                  ? 'material-symbols:image'
                                  : 'material-symbols:videocam'
                              }
                            />
                          </div>
                        }
                        title={<span className="text-sm">{wallpaper.name}</span>}
                        description={
                          <span className="text-xs text-white/60">
                            {wallpaper.category || 'Default'} • {wallpaper.type}
                          </span>
                        }
                      />
                      {isActive && (
                        <Icon
                          className="text-xl text-blue-400"
                          icon="material-symbols:check-circle"
                        />
                      )}
                    </List.Item>
                  );
                }}
              />
            ),
          },
        ]}
      />

      {(activeWallpaperId || localStorage.getItem('defaultWallpaperId')) && (
        <Button
          type="primary"
          danger
          block
          onClick={handleClearBackground}
          icon={<Icon icon="material-symbols:clear" />}
        >
          Clear Current Background
        </Button>
      )}
    </div>
  );
};
