import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Space } from 'antd';
import { motion } from 'framer-motion';

interface Track {
  id: string;
  name: string;
  path: string;
  isCustom?: boolean;
  data?: Blob;
}

const AudioPlayer: React.FC = () => {
  const { getAudioBlob, listAudio } = useAudioStore();

  // State from background
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(1);
  const [audioLoop, setAudioLoop] = useState<boolean>(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // UI State
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
  const [showVolumeTooltip, setShowVolumeTooltip] = useState<boolean>(false);
  const [showSpeedTooltip, setShowSpeedTooltip] = useState<boolean>(false);
  const [playlistPosition, setPlaylistPosition] = useState<'top' | 'bottom'>('top');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [customTracks, setCustomTracks] = useState<any[]>([]);

  const playerRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastKnownPlayingState = useRef<boolean>(false);

  // Load custom audio tracks
  const loadCustomTracks = useCallback(async () => {
    try {
      const { items } = await listAudio();
      const tracks = await Promise.all(
        items.map(async (item) => {
          const blob = await getAudioBlob(item.id);
          return {
            id: item.id,
            name: item.name,
            data: blob,
            createdAt: item.createdAt,
          };
        })
      );
      setCustomTracks(tracks.filter(Boolean));
    } catch (error) {
      console.error('Failed to load custom audio tracks:', error);
      setCustomTracks([]);
    }
  }, [listAudio, getAudioBlob]);

  // Initial load
  useEffect(() => {
    loadCustomTracks();
  }, [loadCustomTracks]);

  // Listen for audio updates (when new audio is uploaded)
  useEffect(() => {
    const handleAudioUpdate = () => {
      loadCustomTracks();
    };

    window.addEventListener('audio-uploaded', handleAudioUpdate);

    // BroadcastChannel for cross-tab updates
    const bc = new BroadcastChannel('media-store');
    bc.onmessage = (event) => {
      if (event.data.type === 'MEDIA_UPDATED' && event.data.tableType === 'audio') {
        loadCustomTracks();
      }
    };

    return () => {
      window.removeEventListener('audio-uploaded', handleAudioUpdate);
      bc.close();
    };
  }, [loadCustomTracks]);

  // Memoize combined tracks to prevent recreation
  const allTracks: Track[] = useMemo(
    () => [
      ...customTracks.map((track) => ({
        id: track.id,
        name: track.name,
        path: track.data ? URL.createObjectURL(track.data) : '',
        isCustom: true,
        data: track.data,
      })),
      ...ALL_DEFAULT_AUDIO.map((audio) => ({
        ...audio,
        isCustom: false,
      })),
    ],
    [customTracks]
  );

  // Send tracks to offscreen when they change (with debouncing)
  useEffect(() => {
    if (allTracks.length === 0) return;

    // Debounce to prevent rapid updates
    const timeoutId = setTimeout(async () => {
      try {
        await audioMessaging.sendMessage('updateTracks', allTracks);
        console.log('Tracks sent to offscreen:', allTracks.length);
      } catch (error) {
        // Silently ignore - offscreen may not be ready yet
        console.debug('Offscreen not ready for tracks update');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [allTracks.length]); // ✅ Only depend on length, not the whole array

  const currentTrack = allTracks[currentAudioIndex];
  const isPlaylistEffectivelyVisible = showPlaylist && !showVolumeTooltip && !showSpeedTooltip;

  // Update local state from audio state
  const updateStateFromResponse = useCallback((state: AudioState): void => {
    setCurrentAudioIndex(state.currentAudioIndex);
    setAudioPlaying(state.audioPlaying);
    setAudioVolume(state.audioVolume);
    setIsMuted(state.audioVolume === 0);
    setAudioLoop(state.audioLoop);
    setAudioSpeed(state.audioSpeed);
    setCurrentTime(state.currentTime);
    setDuration(state.duration);
    lastKnownPlayingState.current = state.audioPlaying;
  }, []);

  // Initial setup - load first track if empty
  useEffect(() => {
    const initializePlayer = async () => {
      try {
        // Wait a bit for offscreen to be ready
        await new Promise((resolve) => setTimeout(resolve, 500));

        const state = await audioMessaging.sendMessage('getState', undefined);

        // If duration is 0, load the first track
        if (!state.duration || state.duration === 0) {
          console.log('No track loaded, loading first track...');

          // Wait for tracks to be available
          if (allTracks.length > 0) {
            const newState = await audioMessaging.sendMessage('setTrack', {
              index: 0,
              autoPlay: false,
            });
            updateStateFromResponse(newState);
          }
        } else {
          updateStateFromResponse(state);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize player:', error);
        setIsInitialized(true);
      }
    };

    // Only initialize after tracks are loaded
    if (allTracks.length > 0) {
      initializePlayer();
    }
  }, [updateStateFromResponse, allTracks.length]);

  // Listen for state sync messages from background
  useEffect(() => {
    const unsubscribe = audioMessaging.onMessage('syncState', async ({ data: state }) => {
      updateStateFromResponse(state);
    });

    return unsubscribe;
  }, [updateStateFromResponse]);

  // Periodic polling for time updates
  useEffect(() => {
    if (!isInitialized) return;

    const pollState = async () => {
      try {
        const state = await audioMessaging.sendMessage('getState', undefined);
        setCurrentTime(state.currentTime);
        setDuration(state.duration);

        if (state.audioPlaying !== lastKnownPlayingState.current) {
          setAudioPlaying(state.audioPlaying);
          lastKnownPlayingState.current = state.audioPlaying;
        }

        if (state.currentAudioIndex !== currentAudioIndex) {
          updateStateFromResponse(state);
        }
      } catch (error) {
        // Silently ignore
      }
    };

    pollIntervalRef.current = setInterval(pollState, 1000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [currentAudioIndex, isInitialized, updateStateFromResponse]);

  const formatTime = (time: number): string => {
    if (!isFinite(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async (): Promise<void> => {
    try {
      const state = await audioMessaging.sendMessage('toggle', undefined);
      updateStateFromResponse(state);
    } catch (error) {
      console.error('Failed to toggle playback:', error);
    }
  };

  const handleProgressChange = async (e: React.MouseEvent<HTMLDivElement>): Promise<void> => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;

      try {
        const state = await audioMessaging.sendMessage('seek', newTime);
        updateStateFromResponse(state);
      } catch (error) {
        console.error('Failed to seek:', error);
      }
    }
  };

  const toggleMute = async (): Promise<void> => {
    const newVolume = isMuted ? 1 : 0;
    try {
      const state = await audioMessaging.sendMessage('setVolume', newVolume);
      updateStateFromResponse(state);
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const setVolumeLevel = async (level: number): Promise<void> => {
    try {
      const state = await audioMessaging.sendMessage('setVolume', level);
      updateStateFromResponse(state);
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  };

  const setPlaybackSpeed = async (newSpeed: number): Promise<void> => {
    try {
      const state = await audioMessaging.sendMessage('setSpeed', newSpeed);
      updateStateFromResponse(state);
    } catch (error) {
      console.error('Failed to set speed:', error);
    }
  };

  const handleSkip = useCallback(
    async (direction: 'next' | 'prev'): Promise<void> => {
      try {
        const state = await audioMessaging.sendMessage('skip', direction);
        updateStateFromResponse(state);
      } catch (error) {
        console.error('Failed to skip:', error);
      }
    },
    [updateStateFromResponse]
  );

  const toggleLoop = async (): Promise<void> => {
    try {
      const state = await audioMessaging.sendMessage('setLoop', !audioLoop);
      updateStateFromResponse(state);
    } catch (error) {
      console.error('Failed to toggle loop:', error);
    }
  };

  const handleSelectTrack = async (index: number): Promise<void> => {
    try {
      const state = await audioMessaging.sendMessage('setTrack', { index, autoPlay: true });
      updateStateFromResponse(state);
    } catch (error) {
      console.error('Failed to select track:', error);
    }
  };

  const updatePlaylistPosition = (): void => {
    if (playerRef.current) {
      const rect = playerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const playlistHeight = 300;

      if (spaceAbove < playlistHeight) {
        setPlaylistPosition('bottom');
      } else {
        setPlaylistPosition('top');
      }
    }
  };

  const volumeLevels = [0, 0.25, 0.5, 0.75, 1];
  const speedLevels = [0.6, 0.8, 1, 1.2, 1.4];

  return (
    <div
      className="relative flex w-full flex-col items-center"
      ref={playerRef}
      onMouseEnter={() => {
        updatePlaylistPosition();
        setShowPlaylist(true);
      }}
      onMouseLeave={() => setShowPlaylist(false)}
    >
      <div
        className={cn(
          'absolute inset-x-0 z-10 origin-center transform transition-transform duration-300',
          isPlaylistEffectivelyVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-95 opacity-0',
          playlistPosition === 'top' ? 'bottom-full pb-3' : 'top-full pt-3'
        )}
      >
        <Playlist
          tracks={allTracks}
          currentIndex={currentAudioIndex}
          isPlaying={audioPlaying}
          onSelect={handleSelectTrack}
        />
      </div>

      <div className="glass widget relative z-20 h-16 w-87">
        <motion.div
          className="flex items-center gap-2"
          key={'player-widget'}
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <button
            className="shrink-0 transition-transform hover:scale-110"
            onClick={handlePlayPause}
          >
            <Icon
              className="text-2xl"
              icon={audioPlaying ? 'material-symbols:pause' : 'material-symbols:play-arrow'}
            />
          </button>

          <div className="flex min-w-12 items-center gap-0.5 text-xs font-medium">
            <span>{formatTime(currentTime)}</span>
            <span className="opacity-40">/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div
            className="group relative h-1 grow cursor-pointer rounded-full bg-white dark:bg-black"
            ref={progressRef}
            onClick={handleProgressChange}
          >
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-black transition-all duration-100 dark:bg-white"
              style={{
                width: `${isFinite(currentTime) && isFinite(duration) && duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
            <div
              className="absolute -top-1 h-3 w-3 rounded-full bg-slate-900 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-white"
              style={{
                left: `calc(${isFinite(currentTime) && isFinite(duration) && duration > 0 ? (currentTime / duration) * 100 : 0}% - 6px)`,
              }}
            />
          </div>

          <Space.Compact className="flex items-center gap-2">
            <div
              className="group/vol relative flex h-full items-center"
              onMouseEnter={() => setShowVolumeTooltip(true)}
              onMouseLeave={() => setShowVolumeTooltip(false)}
            >
              <button onClick={toggleMute}>
                {isMuted || audioVolume === 0 ? (
                  <Icon className="text-xl" icon="material-symbols:volume-mute" />
                ) : (
                  <Icon className="text-xl" icon="material-symbols:volume-up" />
                )}
              </button>

              <div
                className={cn(
                  `absolute bottom-full left-1/2 z-30 origin-bottom -translate-x-1/2 transform pb-4 transition-all duration-300`,
                  showVolumeTooltip
                    ? 'translate-y-2 scale-100 opacity-100'
                    : 'pointer-events-none translate-y-2 scale-90 opacity-0'
                )}
              >
                <div className="glass bg-app-900/70 flex items-center gap-1 rounded-xl px-2 py-1.5 text-center text-xs">
                  {volumeLevels.map((v) => (
                    <button
                      className={cn(
                        'rounded-md px-3 py-1 font-bold transition-all',
                        (isMuted && v === 0) || (!isMuted && audioVolume === v)
                          ? 'bg-black/90'
                          : 'hover:bg-black/90'
                      )}
                      key={v}
                      onClick={() => setVolumeLevel(v)}
                    >
                      {v === 0 ? 'Off' : `${Math.round(v * 100)}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Speed Segmented Tooltip */}
            <div
              className="group/speed relative flex h-full items-center"
              onMouseEnter={() => setShowSpeedTooltip(true)}
              onMouseLeave={() => setShowSpeedTooltip(false)}
            >
              <button className="flex size-6 items-center justify-center text-sm font-bold">
                {audioSpeed}x
              </button>

              <div
                className={cn(
                  `absolute bottom-full left-1/2 z-30 origin-bottom -translate-x-1/2 transform pb-4 transition-all duration-300`,
                  showSpeedTooltip
                    ? 'translate-y-2 scale-100 opacity-100'
                    : 'pointer-events-none translate-y-2 scale-90 opacity-0'
                )}
              >
                <div className="glass bg-app-900/70 flex items-center gap-1 rounded-xl px-2 py-1.5 text-center text-xs">
                  {speedLevels.map((s) => (
                    <button
                      className={cn(
                        'rounded-md px-3 py-1 font-bold transition-all',
                        audioSpeed === s ? 'bg-black/90' : 'hover:bg-black/90'
                      )}
                      key={s}
                      onClick={() => setPlaybackSpeed(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Loop Toggle Button */}
            <button
              className={cn(
                'rounded-full p-2 transition-all hover:scale-110',
                audioLoop ? 'bg-black/10 dark:bg-white/10' : 'opacity-40 hover:opacity-70'
              )}
              onMouseEnter={() => {
                updatePlaylistPosition();
                setShowPlaylist(false);
              }}
              onMouseLeave={() => setShowPlaylist(true)}
              onClick={toggleLoop}
            >
              <Icon className="text-xl" icon="material-symbols:repeat" />
            </button>
          </Space.Compact>
        </motion.div>
      </div>
    </div>
  );
};

export { AudioPlayer };

interface PlaylistProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  onSelect: (index: number) => void;
}

const Playlist: React.FC<PlaylistProps> = ({ tracks, currentIndex, isPlaying, onSelect }) => {
  // Derive active track ID from currentIndex
  const activeTrackId = tracks[currentIndex]?.id;

  return (
    <div className="glass widget flex max-h-64 flex-col overflow-hidden p-0">
      <div className="playlist-scroll space-y-0.5 overflow-y-auto p-1.5">
        {tracks.map((track) => {
          const isActive = track.id === activeTrackId;

          return (
            <button
              className={`group flex w-full items-center gap-1 rounded-md px-2 py-2 transition-all duration-200 ${isActive ? 'bg-black/50' : 'hover:bg-black/50'}`}
              key={track.id}
              onClick={() => {
                // Find real index at time of click
                const realIndex = tracks.findIndex((t) => t.id === track.id);
                onSelect(realIndex);
              }}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                {isActive ? (
                  <Icon
                    className="text-3xl"
                    icon={isPlaying ? 'material-symbols:pause' : 'material-symbols:play-arrow'}
                  />
                ) : (
                  <Icon
                    className="text-3xl opacity-0 transition-opacity group-hover:opacity-40"
                    icon="material-symbols:play-arrow"
                  />
                )}
              </div>

              <span className="line-clamp-1 grow text-left text-sm font-medium">{track.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
