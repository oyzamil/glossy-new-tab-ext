import { useEffect, useRef, useState } from 'react';

interface UseBackgroundMediaOptions {
  url: string | null;
  type: 'image' | 'video';
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  autoPlay?: boolean;
}

export const useBackgroundMedia = ({
  url,
  type,
  videoRef,
  autoPlay = true,
}: UseBackgroundMediaOptions) => {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [fade, setFade] = useState(false);
  const previousUrlRef = useRef<string | null>(null);

  /* ========================
     Preload Media
  ======================== */
  useEffect(() => {
    if (!url) return;

    let cancelled = false;

    const preload = async () => {
      if (type === 'image') {
        const img = new Image();
        img.src = url;

        await img.decode().catch(() => {});

        if (!cancelled) switchMedia();
      }

      if (type === 'video') {
        const video = document.createElement('video');
        video.src = url;
        video.preload = 'auto';

        await video.play().catch(() => {});
        video.pause();

        if (!cancelled) switchMedia();
      }
    };

    const switchMedia = () => {
      setFade(false);

      setTimeout(() => {
        cleanupOldUrl();
        setActiveUrl(url);
        setFade(true);
      }, 100);
    };

    preload();

    return () => {
      cancelled = true;
    };
  }, [url, type]);

  /* ========================
     Cleanup old object URLs
  ======================== */
  const cleanupOldUrl = () => {
    if (previousUrlRef.current && previousUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(previousUrlRef.current);
    }

    previousUrlRef.current = url;
  };

  /* ========================
     Video Playback Control
  ======================== */
  useEffect(() => {
    if (!videoRef?.current) return;
    if (type !== 'video') return;

    if (autoPlay) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [type, autoPlay, activeUrl]);

  /* ========================
     Final Cleanup on Unmount
  ======================== */
  useEffect(() => {
    return () => cleanupOldUrl();
  }, []);

  return {
    activeUrl,
    fade,
  };
};
