import { useEffect, useRef, useState } from 'react';
import { Settings } from '@/app.config';
import { useAntd } from '@/providers/ThemeProvider';
import { Icon } from '@iconify/react';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
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

  // Wallpaper Store
  const {
    saveWallpaper,
    activeWallpaperId,
    setActiveWallpaperId,
    listWallpapers,
    deleteWallpapers,
    getWallpaperBlob,
  } = useWallpaperStore();

  // Audio Store
  const { saveAudio, activeAudioId, setActiveAudioId, listAudio, deleteAudio, getAudioBlob } =
    useAudioStore();

  const [backgrounds, setBackgrounds] = useState<any[]>([]);
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [storageSize, setStorageSize] = useState({ wallpapers: 0, audio: 0 });
  const [wallpaperSearch, setWallpaperSearch] = useState('');
  const [audioSearch, setAudioSearch] = useState('');
  const [activeWallpaperType, setActiveWallpaperType] = useState<'custom' | 'default' | null>(null);
  const [, forceUpdate] = useState({}); // Force re-render trigger
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

  // Load data on mount
  useEffect(() => {
    loadBackgrounds();
    loadAudioTracks();

    // Determine which wallpaper is active
    const defaultId = localStorage.getItem('defaultWallpaperId');
    if (defaultId) {
      setActiveWallpaperType('default');
    } else if (activeWallpaperId) {
      setActiveWallpaperType('custom');
    }
  }, []);

  // Sync activeWallpaperType when activeWallpaperId changes
  useEffect(() => {
    const defaultId = localStorage.getItem('defaultWallpaperId');

    if (defaultId && !activeWallpaperId) {
      setActiveWallpaperType('default');
    } else if (activeWallpaperId) {
      setActiveWallpaperType('custom');
    } else {
      setActiveWallpaperType(null);
    }
  }, [activeWallpaperId]);

  /* ---------------------------------------------------------------- */
  /* WALLPAPER FUNCTIONS                                              */
  /* ---------------------------------------------------------------- */

  const loadBackgrounds = async () => {
    try {
      const result = await listWallpapers();
      const wallpapersWithData = await Promise.all(
        result.items.map(async (item) => {
          const blob = await getWallpaperBlob(item.id);
          if (!blob) return null;

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

      const filtered = wallpapersWithData.filter(Boolean) as any[];
      setBackgrounds(filtered);

      // Calculate storage
      const totalSize = filtered.reduce((acc, bg) => acc + bg.data.size, 0);
      setStorageSize((prev) => ({ ...prev, wallpapers: totalSize }));
    } catch (error) {
      console.error('Failed to load backgrounds:', error);
    }
  };

  const handleWallpaperUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await saveWallpaper({ file, setAsActive: true });
      message.success('Wallpaper uploaded successfully!');

      await loadBackgrounds();

      // Clear default wallpaper selection
      localStorage.removeItem('defaultWallpaperId');
      setActiveWallpaperType('custom');

      // Apply the uploaded wallpaper
      const blob = await getWallpaperBlob(result.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        onBackgroundChange(url, type);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to upload wallpaper');
      console.error(error);
    } finally {
      setUploading(false);
    }

    return false;
  };

  const handleSetWallpaper = async (id: string, isDefault = false) => {
    try {
      if (isDefault) {
        // Set default wallpaper
        const wallpaper = ALL_DEFAULT_WALLPAPERS.find((w) => w.id === id);
        if (!wallpaper) return;

        // Clear custom wallpaper active state
        if (activeWallpaperId) {
          await setActiveWallpaperId('');
        }

        // Set default as active
        localStorage.setItem('defaultWallpaperId', id);
        setActiveWallpaperType('default');

        // Force re-render to update UI
        forceUpdate({});

        // Apply the default wallpaper
        onBackgroundChange(wallpaper.path, wallpaper.type);

        message.success('Wallpaper applied!');
      } else {
        // Set custom wallpaper

        // Clear default wallpaper active state
        localStorage.removeItem('defaultWallpaperId');

        // Set custom as active
        await setActiveWallpaperId(id);
        setActiveWallpaperType('custom');

        // Force re-render to update UI
        forceUpdate({});

        // Apply the custom wallpaper
        const blob = await getWallpaperBlob(id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const type = blob.type.startsWith('video/') ? 'video' : 'image';
          onBackgroundChange(url, type);
        }

        message.success('Wallpaper applied!');
      }
    } catch (error) {
      message.error('Failed to apply wallpaper');
      console.error(error);
    }
  };

  const handleRemoveWallpaper = async (id: string) => {
    try {
      await deleteWallpapers(id);

      if (activeWallpaperId === id) {
        onBackgroundChange(null, 'image');
      }

      await loadBackgrounds();
      message.success('Wallpaper deleted');
    } catch (error) {
      message.error('Failed to delete wallpaper');
      console.error(error);
    }
  };

  /* ---------------------------------------------------------------- */
  /* AUDIO FUNCTIONS                                                  */
  /* ---------------------------------------------------------------- */

  const loadAudioTracks = async () => {
    try {
      const result = await listAudio();
      const tracksWithData = await Promise.all(
        result.items.map(async (item) => {
          const blob = await getAudioBlob(item.id);
          if (!blob) return null;

          return {
            id: item.id,
            data: blob,
            name: item.name || `Audio ${new Date(item.createdAt).toLocaleDateString()}`,
            createdAt: item.createdAt,
          };
        })
      );

      const filtered = tracksWithData.filter(Boolean) as any[];
      setAudioTracks(filtered);

      // Calculate storage
      const totalSize = filtered.reduce((acc, track) => acc + track.data.size, 0);
      setStorageSize((prev) => ({ ...prev, audio: totalSize }));
    } catch (error) {
      console.error('Failed to load audio:', error);
    }
  };

  const handleAudioUpload = async (file: File) => {
    setUploading(true);
    try {
      await saveAudio({ file, setAsActive: true });
      message.success('Audio uploaded successfully!');
      await loadAudioTracks();

      // Notify audio player of new upload
      window.dispatchEvent(new Event('audio-uploaded'));

      // ✅ Wait for AudioPlayer to send updated tracks to offscreen
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Now play the newly uploaded track (custom tracks appear first)
      await audioMessaging.sendMessage('setTrack', {
        index: 0,
        autoPlay: true,
      });
    } catch (error: any) {
      message.error(error.message || 'Failed to upload audio');
    } finally {
      setUploading(false);
    }

    return false;
  };

  const handleRemoveAudio = async (id: string) => {
    try {
      await deleteAudio(id);
      await loadAudioTracks();
      message.success('Audio deleted');

      // Notify audio player of deletion
      window.dispatchEvent(new Event('audio-uploaded'));
    } catch (error) {
      message.error('Failed to delete audio');
      console.error(error);
    }
  };

  /* ---------------------------------------------------------------- */
  /* HELPER FUNCTIONS                                                 */
  /* ---------------------------------------------------------------- */

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getBackgroundURL = (blob: Blob) => {
    return URL.createObjectURL(blob);
  };

  /* ---------------------------------------------------------------- */
  /* COMBINED DATA WITH SEARCH AND SORTING                            */
  /* ---------------------------------------------------------------- */

  const allWallpapers = [
    ...backgrounds.map((bg) => ({
      ...bg,
      isCustom: true,
      isActive: activeWallpaperType === 'custom' && activeWallpaperId === bg.id,
    })),
    ...ALL_DEFAULT_WALLPAPERS.map((wp) => ({
      ...wp,
      isCustom: false,
      isActive:
        activeWallpaperType === 'default' && localStorage.getItem('defaultWallpaperId') === wp.id,
    })),
  ];

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

  // Filter and sort wallpapers
  const filteredWallpapers = allWallpapers
    .filter((wp) => wp.name.toLowerCase().includes(wallpaperSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter and sort audio
  const filteredAudio = allAudio
    .filter((audio) => audio.name.toLowerCase().includes(audioSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const currentBackground = backgrounds.find((b) => b.id === activeWallpaperId);
  const isVideoBackground = currentBackground?.type === 'video';

  /* ---------------------------------------------------------------- */
  /* RENDER                                                           */
  /* ---------------------------------------------------------------- */

  function truncateMiddle(text: string, maxLength = 24) {
    if (text.length <= maxLength) return text;

    const start = text.slice(0, Math.ceil(maxLength / 2) - 1);
    const end = text.slice(-Math.floor(maxLength / 2) + 1);

    return `${start}…${end}`;
  }

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
                    <div className="flex-col-center">
                      <p className="ant-upload-drag-icon">
                        <Icon className="text-4xl" icon="material-symbols:cloud-upload" />
                      </p>
                      <p className="ant-upload-text text-xs">Click or drag file to upload</p>
                      <p className="ant-upload-hint text-xs">
                        Images: 10MB max | Videos: 100MB max
                      </p>
                    </div>
                  </Upload.Dragger>
                </Card>

                {/* Search Input */}
                <Input
                  placeholder="Search wallpapers..."
                  prefix={<Icon icon="material-symbols:search" />}
                  value={wallpaperSearch}
                  onChange={(e) => setWallpaperSearch(e.target.value)}
                  allowClear
                />

                {/* Storage Info */}
                <div className="flex items-center justify-between text-sm opacity-70">
                  <span>Custom: {formatSize(storageSize.wallpapers)}</span>
                  <span>{filteredWallpapers.length} wallpapers</span>
                </div>

                {/* Combined List */}
                <CustomList
                  className="max-h-100 overflow-y-auto pr-1"
                  dataSource={filteredWallpapers}
                  empty={<Empty description="No wallpapers found" />}
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
                              src={getBackgroundURL(item.data)}
                              alt={item.name}
                            />
                          ) : (
                            <div className="glass flex h-12 w-12 items-center justify-center rounded-lg">
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
                        <div className="flex flex-col" title={item.name}>
                          <span className="text-sm font-medium">{truncateMiddle(item.name)}</span>
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
                <Card title="Upload Audio" size="small">
                  <Upload.Dragger
                    beforeUpload={handleAudioUpload}
                    showUploadList={false}
                    accept="audio/*"
                    disabled={uploading}
                  >
                    <div className="flex-col-center">
                      <p className="ant-upload-drag-icon">
                        <Icon className="text-4xl" icon="material-symbols:cloud-upload" />
                      </p>
                      <p className="ant-upload-text text-xs">Click or drag file to upload</p>
                      <p className="ant-upload-hint text-xs">Audio files: 50MB max</p>
                    </div>
                  </Upload.Dragger>
                </Card>

                {/* Search Input */}
                <Input
                  placeholder="Search audio..."
                  prefix={<Icon icon="material-symbols:search" />}
                  value={audioSearch}
                  onChange={(e) => setAudioSearch(e.target.value)}
                  allowClear
                />

                {/* Storage Info */}
                <div className="flex items-center justify-between text-sm opacity-70">
                  <span>Custom: {formatSize(storageSize.audio)}</span>
                  <span>{filteredAudio.length} tracks</span>
                </div>

                {/* Combined List */}
                <CustomList
                  className="max-h-100 overflow-y-auto pr-1"
                  dataSource={filteredAudio}
                  empty={<Empty description="No audio found" />}
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
                        <div className="flex flex-col" title={item.name}>
                          <span className="text-sm font-medium">{truncateMiddle(item.name)}</span>
                          <span className="text-xs opacity-70">
                            {item.isCustom ? (
                              <>Custom • {formatSize(item.data?.size || 0)}</>
                            ) : (
                              <>Default</>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Right Side - Only Delete button for custom audio */}
                      {item.isCustom && (
                        <div className="flex items-center gap-2 opacity-80 transition-opacity group-hover:opacity-100">
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
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};
