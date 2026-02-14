import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Drawer, FloatButton } from 'antd';
import { motion } from 'framer-motion';
import { AudioPlayer } from './components/AudioPlayer';
import MultiWidget from './components/MultiWidget';
import Digital from './components/MultiWidget/Digital';
import Quotes from './components/Quotes';
import { SearchBar } from './components/SearchBar';
import { Shortcuts } from './components/Shortcuts';
import { Sidebar } from './components/Sidebar';

async function getMediaType(blob: Blob): Promise<'image' | 'video'> {
  return blob.type.startsWith('video/') ? 'video' : 'image';
}

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image');
  const { settings } = useSettings();

  const videoRef = useRef<HTMLVideoElement>(null);

  // Use the wallpaper store hook
  const {
    wallpaperUrl,
    isLoading: wallpaperLoading,
    activeWallpaperId,
    getWallpaperBlob,
  } = useWallpaperStore();

  const { activeUrl } = useBackgroundMedia({
    url: backgroundUrl,
    type: backgroundType,
    videoRef,
    autoPlay: settings.videoPlayback,
  });

  useEffect(() => {
    if (wallpaperLoading) return;

    const initialize = async () => {
      // 1. If user has a custom wallpaper, use it
      if (wallpaperUrl && activeWallpaperId) {
        const blob = await getWallpaperBlob(activeWallpaperId);
        if (blob) {
          const type = await getMediaType(blob);
          setBackgroundUrl(wallpaperUrl);
          setBackgroundType(type);
          return;
        }
      }

      // 2. Check for saved default wallpaper preference
      const defaultWallpaperId = localStorage.getItem('defaultWallpaperId');
      if (defaultWallpaperId) {
        const defaultWallpaper = ALL_DEFAULT_WALLPAPERS.find((w) => w.id === defaultWallpaperId);
        if (defaultWallpaper) {
          setBackgroundUrl(defaultWallpaper.path);
          setBackgroundType(defaultWallpaper.type);
          return;
        }
      }

      // 3. Show a random default wallpaper
      if (ALL_DEFAULT_WALLPAPERS.length > 0) {
        const randomWallpaper =
          ALL_DEFAULT_WALLPAPERS[Math.floor(Math.random() * ALL_DEFAULT_WALLPAPERS.length)];
        setBackgroundUrl(randomWallpaper.path);
        setBackgroundType(randomWallpaper.type);
      }
    };

    initialize();
  }, [wallpaperLoading, wallpaperUrl, activeWallpaperId]);

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

  const opacityClass =
    settings.hideControlsOnInactivity && !isActive ? 'opacity-10' : 'opacity-100';

  return (
    <div
      className="relative flex h-dvh w-dvw items-center"
      style={
        {
          '--blur-amount': `${!settings.glassMorphism ? 0 : settings.blurAmount}px`,
        } as React.CSSProperties
      }
    >
      {/* ✅ Background Layer */}
      <div className="absolute inset-0">
        {activeUrl &&
          (backgroundType === 'video' ? (
            <motion.video
              className={'h-dvh w-dvw object-cover object-center'}
              initial={{ '--blur': '10px' } as any}
              animate={{ '--blur': '0px' } as any}
              transition={{ duration: 0.1 }}
              style={{
                filter: 'blur(var(--blur))',
              }}
              key={activeUrl}
              ref={videoRef}
              src={activeUrl}
              loop
              muted
              playsInline
              autoPlay={settings.videoPlayback}
            />
          ) : (
            <motion.img
              className={'h-dvh w-dvw object-cover object-center'}
              initial={{ '--blur': '10px' } as any}
              animate={{ '--blur': '0px' } as any}
              transition={{ duration: 0.1 }}
              style={{
                filter: 'blur(var(--blur))',
              }}
              key={activeUrl}
              src={activeUrl}
              alt="Background"
            />
          ))}
      </div>
      <div className={cn('z-10 transition-all duration-300', opacityClass)}>
        {/* ✅ Clock Widget */}
        <div className="absolute top-3 right-3 space-y-3">
          {settings.multiWidget && <MultiWidget />}
        </div>

        {/* ✅ Search Bar */}
        <div className="search-section text-theme-inverse absolute top-1/2 w-full -translate-y-1/2">
          {settings.clockWidget && <Digital />}
          <SearchBar />
        </div>

        {/* ✅ Shortcuts */}
        <div className="shortcuts-section absolute right-0 bottom-4 left-0 flex items-center justify-center">
          <Shortcuts />
        </div>

        {/* Top Left Widgets */}
        <div className="absolute top-3 left-3 space-y-3">
          {settings.audioPlayerWidget && <AudioPlayer />}
        </div>

        {/* ✅ Bottom Left Widgets */}
        <div className="absolute bottom-3 left-3 space-y-3">
          {settings.quotesWidget && <Quotes />}
        </div>

        {/* ✅ Settings Button */}

        <FloatButton
          className="glass text-2xl hover:scale-120"
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
        size={350}
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
