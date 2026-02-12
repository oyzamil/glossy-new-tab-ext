import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Drawer, FloatButton } from 'antd';
import { AudioPlayer } from './components/AudioPlayer';
import { Clock } from './components/Clock';
import { SearchBar } from './components/SearchBar';
import { Shortcuts } from './components/Shortcuts';
import { Sidebar } from './components/Sidebar';
import { Weather } from './components/Weather';

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(defaultWallpapers[0].path);
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image');
  const { settings } = useSettings();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Use the wallpaper store hook
  const { activeWallpaperId, loadWallpaperUrl, getWallpaperBlob } = useWallpaperStore();

  const { activeUrl, fade } = useBackgroundMedia({
    url: backgroundUrl,
    type: backgroundType,
    videoRef,
    autoPlay: settings.videoPlayback,
  });

  // ✅ LOAD SETTINGS AND INITIAL BACKGROUND ON APP START
  useEffect(() => {
    const initialize = async () => {
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
      } else if (settings.videoPlayback) {
        videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [backgroundType, settings.videoPlayback]);

  const handleBackgroundChange = (url: string | null, type: 'image' | 'video') => {
    // Clean up old blob URL if it exists
    if (backgroundUrl && backgroundUrl.startsWith('blob:')) {
      URL.revokeObjectURL(backgroundUrl);
    }

    setBackgroundUrl(url);
    setBackgroundType(type);
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetActivity = () => {
      setIsActive(true); // user interacted
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsActive(false), 5000); // 5s of inactivity
    };

    // Listen to user interactions
    window.addEventListener('mousemove', resetActivity);
    window.addEventListener('keydown', resetActivity);
    window.addEventListener('scroll', resetActivity);

    // Start initial inactivity timer
    timeout = setTimeout(() => setIsActive(false), 5000);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('scroll', resetActivity);
    };
  }, []);

  return (
    <div
      className="relative flex h-dvh w-dvw items-center"
      style={
        {
          // CSS variables must be written in quotes if they have a dash
          '--blur-amount': `${settings.blurAmount}px`,
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
              autoPlay={settings.videoPlayback}
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
      <div className={cn('transition-all duration-300', isActive ? 'opacity-100' : 'opacity-10')}>
        {/* ✅ Clock Widget */}
        <div className="absolute top-3 right-3 z-10 space-y-3">
          {settings.clockWidget && <Clock />}
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
          {settings.audioPlayerWidget && <AudioPlayer />}
          {settings.weatherWidget && <Weather />}
        </div>

        {/* ✅ Settings Button */}
        <FloatButton
          className="glass hover:scale-120"
          icon={<Icon icon="material-symbols:settings" />}
          type="primary"
          style={{ right: 24, bottom: 24 }}
          onClick={() => setSidebarOpen(true)}
        />
      </div>

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
        mask={{
          closable: true,
        }}
      >
        <Sidebar onBackgroundChange={handleBackgroundChange} videoRef={videoRef} />
      </Drawer>
    </div>
  );
};

export default App;
