import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Drawer, FloatButton } from 'antd';
import { AudioPlayer } from './components/AudioPlayer';
import { Clock } from './components/Clock';
import { SearchBar } from './components/SearchBar';
import { Shortcuts } from './components/Shortcuts';
import { Sidebar } from './components/Sidebar';
import { Weather } from './components/Weather';

interface AppSettings {
  glassMorphism: boolean;
  blurAmount: number;
  videoPlayback: boolean;
  audioLoop: boolean;
}

interface WidgetSettings {
  clock: boolean;
  weather: boolean;
  audioPlayer: boolean;
}

interface DefaultWallpaper {
  id: string;
  name: string;
  path: string;
  type: 'image' | 'video';
  category?: string;
}

// Import or define your default wallpapers
const defaultWallpapers: DefaultWallpaper[] = [
  // Add your default wallpapers here
  // Example:
  // { id: 'default-1', name: 'Mountain View', path: '/wallpapers/mountain.jpg', type: 'image', category: 'Nature' },
];

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image');
  const [appSettings, setAppSettings] = useState<AppSettings>({
    glassMorphism: true,
    blurAmount: 10,
    videoPlayback: true,
    audioLoop: true,
  });
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>({
    clock: true,
    weather: true,
    audioPlayer: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Use the wallpaper store hook
  const { activeWallpaperId, loadWallpaperUrl, getWallpaperBlob } = useWallpaperStore();

  const { activeUrl, fade } = useBackgroundMedia({
    url: backgroundUrl,
    type: backgroundType,
    videoRef,
    autoPlay: appSettings.videoPlayback,
  });

  // Helper functions for settings
  const getWidgetSettings = (): WidgetSettings => {
    const saved = localStorage.getItem('widgetSettings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      clock: true,
      weather: true,
      audioPlayer: false,
    };
  };

  const getAppSettings = (): AppSettings => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      glassMorphism: true,
      blurAmount: 10,
      videoPlayback: true,
      audioLoop: true,
    };
  };

  // ✅ LOAD SETTINGS AND INITIAL BACKGROUND ON APP START
  useEffect(() => {
    const initialize = async () => {
      // Load settings from localStorage
      const widgets = getWidgetSettings();
      const app = getAppSettings();

      setWidgetSettings(widgets);
      setAppSettings(app);

      // Check for default wallpaper first
      const defaultWallpaperId = localStorage.getItem('defaultWallpaperId');
      if (defaultWallpaperId) {
        const defaultWallpaper = defaultWallpapers.find((w) => w.id === defaultWallpaperId);
        if (defaultWallpaper) {
          setBackgroundUrl(defaultWallpaper.path);
          setBackgroundType(defaultWallpaper.type);
          return;
        }
      }

      // Load custom wallpaper from IndexedDB via hook
      if (activeWallpaperId) {
        const url = await loadWallpaperUrl(activeWallpaperId);
        const blob = await getWallpaperBlob(activeWallpaperId);

        if (url && blob) {
          setBackgroundUrl(url);
          setBackgroundType(blob.type.startsWith('video/') ? 'video' : 'image');
        }
      }
    };

    initialize();
  }, []); // Run once on mount

  // ✅ WATCH FOR CHANGES TO ACTIVE WALLPAPER ID
  useEffect(() => {
    const updateBackground = async () => {
      if (!activeWallpaperId) return;

      const url = await loadWallpaperUrl(activeWallpaperId);
      const blob = await getWallpaperBlob(activeWallpaperId);

      if (url && blob) {
        // Clean up old blob URL if it exists
        if (backgroundUrl && backgroundUrl.startsWith('blob:')) {
          URL.revokeObjectURL(backgroundUrl);
        }

        setBackgroundUrl(url);
        setBackgroundType(blob.type.startsWith('video/') ? 'video' : 'image');
      }
    };

    updateBackground();
  }, [activeWallpaperId]); // Runs when activeWallpaperId changes

  // ✅ CLEANUP BLOB URLs ON UNMOUNT
  useEffect(() => {
    return () => {
      if (backgroundUrl && backgroundUrl.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundUrl);
      }
    };
  }, [backgroundUrl]);

  // ✅ Handle visibility change for video playback
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!videoRef.current) return;
      if (backgroundType !== 'video') return;

      if (document.hidden) {
        videoRef.current.pause();
      } else if (appSettings.videoPlayback) {
        videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [backgroundType, appSettings.videoPlayback]);

  const handleBackgroundChange = (url: string | null, type: 'image' | 'video') => {
    // Clean up old blob URL if it exists
    if (backgroundUrl && backgroundUrl.startsWith('blob:')) {
      URL.revokeObjectURL(backgroundUrl);
    }

    setBackgroundUrl(url);
    setBackgroundType(type);
  };

  const handleSettingsChange = (settings: AppSettings) => {
    setAppSettings(settings);
  };

  const handleWidgetSettingsChange = (settings: WidgetSettings) => {
    setWidgetSettings(settings);
  };

  return (
    <div
      className="relative flex h-dvh w-dvw items-center"
      style={
        {
          // CSS variables must be written in quotes if they have a dash
          '--blur-amount': `${appSettings.blurAmount}px`,
        } as React.CSSProperties
      }
    >
      {/* ✅ Background Layer */}
      <div className="absolute inset-0">
        {activeUrl &&
          (backgroundType === 'video' ? (
            <video
              className={`h-dvh w-dvw object-cover object-center ${fade ? 'fade-in' : ''}`}
              key={activeUrl}
              ref={videoRef}
              src={activeUrl}
              loop
              muted
              playsInline
              autoPlay={appSettings.videoPlayback}
            />
          ) : (
            <img
              className={`h-dvh w-dvw object-cover object-center ${fade ? 'fade-in' : ''}`}
              key={activeUrl}
              src={activeUrl}
              alt="Background"
            />
          ))}
      </div>

      {/* ✅ Clock Widget */}
      <div className="absolute top-3 right-3 z-10 space-y-3">
        {widgetSettings.clock && <Clock />}
      </div>

      {/* ✅ Search Bar */}
      <div className="search-section absolute top-1/2 z-10 w-full -translate-y-1/2">
        <SearchBar />
      </div>

      {/* ✅ Shortcuts */}
      <div className="shortcuts-section absolute right-0 bottom-4 left-0 z-10 flex items-center justify-center">
        <Shortcuts />
      </div>

      {/* ✅ Bottom Left Widgets */}
      <div className="absolute bottom-3 left-3 z-10 space-y-3">
        {widgetSettings.audioPlayer && <AudioPlayer />}
        {widgetSettings.weather && <Weather />}
      </div>

      {/* ✅ Settings Button */}
      <FloatButton
        icon={<Icon icon="material-symbols:settings" />}
        type="primary"
        style={{ right: 24, bottom: 24 }}
        onClick={() => setSidebarOpen(true)}
      />

      {/* ✅ Settings Drawer */}
      <Drawer
        title="Settings"
        placement="right"
        onClose={() => setSidebarOpen(false)}
        open={sidebarOpen}
        size={400}
        styles={{
          body: {
            padding: '16px',
          },
        }}
      >
        <Sidebar
          onBackgroundChange={handleBackgroundChange}
          onSettingsChange={handleSettingsChange}
          onWidgetSettingsChange={handleWidgetSettingsChange}
          videoRef={videoRef}
        />
      </Drawer>
    </div>
  );
};

export default App;
