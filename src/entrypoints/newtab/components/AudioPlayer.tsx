import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Space } from 'antd';

interface Track {
  id: string;
  name: string;
  path: string;
}

interface AudioPlayerProps {}

const defaultTracks: Track[] = [
  { id: 'c-1', name: '1', path: '/audio/1.mp3' },
  { id: 'c-2', name: '2', path: '/audio/2.mp3' },
  { id: '1', name: 'Bar', path: '/audio/bar.wav' },
  { id: '2', name: 'Beach', path: '/audio/beach.mp3' },
  { id: '3', name: 'Birds', path: '/audio/birds.mp3' },
  { id: '4', name: 'Campfire', path: '/audio/campfire.wav' },
  { id: '5', name: 'Chimes', path: '/audio/chimes.mp3' },
  { id: '7', name: 'City Night', path: '/audio/city_night.mp3' },
  { id: '8', name: 'City', path: '/audio/city.wav' },
  { id: '9', name: 'Desert', path: '/audio/desert.wav' },
  { id: '10', name: 'End Sound Timer', path: '/audio/end_sound_timer.mp3' },
  { id: '11', name: 'Forest Ambience', path: '/audio/forest-ambience.mp3' },
  { id: '12', name: 'Night', path: '/audio/night.wav' },
  { id: '13', name: 'Plane', path: '/audio/plane.wav' },
  { id: '14', name: 'Playground', path: '/audio/playground.wav' },
  { id: '15', name: 'Rain', path: '/audio/rain.wav' },
  { id: '16', name: 'River', path: '/audio/river.mp3' },
  { id: '17', name: 'Storm', path: '/audio/storm.wav' },
  { id: '18', name: 'Submarine', path: '/audio/submarine.wav' },
  { id: '19', name: 'Swamp', path: '/audio/swamp.wav' },
  { id: '20', name: 'Train', path: '/audio/train.wav' },
  { id: '21', name: 'Vinyl', path: '/audio/vinyl.mp3' },
  { id: '22', name: 'Waterfall', path: '/audio/waterfall.wav' },
  { id: '23', name: 'White Noise', path: '/audio/white_noise.mp3' },
];

const AudioPlayer: React.FC<AudioPlayerProps> = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showVolumeTooltip, setShowVolumeTooltip] = useState(false);
  const [showSpeedTooltip, setShowSpeedTooltip] = useState(false);
  const [playlistPosition, setPlaylistPosition] = useState<'top' | 'bottom'>('top');

  const playerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const currentTrack = defaultTracks[currentTrackIndex];

  const isPlaylistEffectivelyVisible = showPlaylist && !showVolumeTooltip && !showSpeedTooltip;

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      audioRef.current.currentTime = percentage * duration;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const setVolumeLevel = (level: number) => {
    setVolume(level);
    setIsMuted(level === 0);
    if (audioRef.current) {
      audioRef.current.volume = level;
      audioRef.current.muted = level === 0;
    }
  };

  const setPlaybackSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleSkip = useCallback(
    (direction: 'next' | 'prev') => {
      setCurrentTrackIndex((prev) => {
        if (direction === 'next') {
          return (prev + 1) % defaultTracks.length;
        } else {
          return prev === 0 ? defaultTracks.length - 1 : prev - 1;
        }
      });
      setIsPlaying(true);
    },
    [defaultTracks.length]
  );

  const onEnded = () => {
    if (isLooping && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      handleSkip('next');
    }
  };

  const toggleLoop = () => setIsLooping(!isLooping);

  const handleSelectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const updatePlaylistPosition = () => {
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

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch((e) => console.error('Playback failed', e));
    }
  }, [currentTrackIndex, isPlaying]);

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
      <audio
        ref={audioRef}
        src={currentTrack.path}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
      />

      {/* Height-aware, Full-width Playlist Panel */}
      <div
        className={`absolute inset-x-0 z-10 origin-center transform transition-all duration-500 ${
          isPlaylistEffectivelyVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-95 opacity-0'
          } ${playlistPosition === 'top' ? 'bottom-full pb-3' : 'top-full pt-3'}`}
      >
        <Playlist
          tracks={defaultTracks}
          currentIndex={currentTrackIndex}
          isPlaying={isPlaying}
          onSelect={handleSelectTrack}
          currentTrack={currentTrack}
        />
      </div>

      <div className="glass widget relative z-20 flex h-16 w-full items-center gap-2">
        <button className="shrink-0 transition-transform hover:scale-110" onClick={handlePlayPause}>
          <Icon
            className="text-2xl"
            icon={isPlaying ? 'material-symbols:pause' : 'material-symbols:play-arrow'}
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
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div
            className="absolute -top-1 h-3 w-3 rounded-full bg-slate-900 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-white"
            style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
          />
        </div>

        <Space.Compact className="flex items-center gap-2">
          {/* Volume Segmented Tooltip */}
          <div
            className="group/vol relative flex h-full items-center"
            onMouseEnter={() => setShowVolumeTooltip(true)}
            onMouseLeave={() => setShowVolumeTooltip(false)}
          >
            <button onClick={toggleMute}>
              {isMuted || volume === 0 ? (
                <Icon className="text-xl" icon="material-symbols:volume-mute" />
              ) : (
                <Icon className="text-xl" icon="material-symbols:volume-up" />
              )}
            </button>

            <div
              className={`absolute bottom-full left-1/2 z-30 origin-bottom -translate-x-1/2 transform pb-4 transition-all duration-300 ${
                showVolumeTooltip
                  ? 'translate-y-2 scale-100 opacity-100'
                  : 'pointer-events-none translate-y-2 scale-90 opacity-0'
              }`}
            >
              <div className="glass flex items-center gap-1 rounded-xl px-2 py-1.5 whitespace-nowrap shadow-xl">
                {volumeLevels.map((v) => (
                  <button
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                      (isMuted && v === 0) || (!isMuted && volume === v)
                        ? 'bg-black/10 dark:bg-white/20'
                        : 'hover:bg-black/10 dark:hover:bg-white/20'
                    }`}
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
            <button className="flex size-6 items-center justify-center text-sm font-bold transition-opacity hover:opacity-70">
              {speed}x
            </button>

            <div
              className={`absolute bottom-full left-1/2 z-30 origin-bottom -translate-x-1/2 transform pb-4 transition-all duration-300 ${
                showSpeedTooltip
                  ? 'translate-y-2 scale-100 opacity-100'
                  : 'pointer-events-none translate-y-2 scale-90 opacity-0'
              }`}
            >
              <div className="glass flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs">
                {speedLevels.map((s) => (
                  <button
                    className={`rounded-md px-3 py-1 font-bold transition-all ${
                      speed === s
                        ? 'bg-black/10 dark:bg-white/20'
                        : 'hover:bg-black/10 dark:hover:bg-white/20'
                    }`}
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
            className={`rounded-full p-2 transition-all hover:scale-110 ${isLooping ? 'bg-black/10 dark:bg-white/10' : 'opacity-40 hover:opacity-70'}`}
            onClick={toggleLoop}
          >
            <Icon className="text-xl" icon="material-symbols:repeat" />
          </button>
        </Space.Compact>
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
  currentTrack: Track;
}

const Playlist: React.FC<PlaylistProps> = ({
  tracks,
  currentIndex,
  isPlaying,
  onSelect,
  currentTrack,
}) => {
  return (
    <div className="glass widget flex max-h-64 flex-col overflow-hidden p-0">
      {/* Track List - Slimmed down version */}
      <div className="playlist-scroll overflow-y-auto p-1.5">
        {tracks.map((track, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              className={`group flex w-full items-center gap-3 rounded-md px-4 py-2.5 transition-all duration-200 ${isActive ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/3 dark:hover:bg-white/5'}`}
              key={track.id}
              onClick={() => onSelect(index)}
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
                    icon={'material-symbols:play-arrow'}
                  />
                )}
              </div>

              <span className={'line-clamp-1 grow text-left text-sm font-medium'}>
                {track.name}
              </span>

              <span className="ml-auto text-[11px] tabular-nums opacity-40">--.--</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
