let audioElement: HTMLAudioElement | null = null;
let currentState: AudioState = {
  currentAudioIndex: 0,
  audioPlaying: false,
  audioVolume: 1,
  audioLoop: false,
  audioSpeed: 1,
  currentTime: 0,
  duration: 0,
};

// Track list (will be updated from UI)
let tracks: Track[] = [];

// Load default tracks from manifest on initialization
async function loadDefaultTracks() {
  try {
    // Import DEFAULT_AUDIO if available
    // For now, we'll wait for updateTracks from UI
    console.log('Waiting for tracks from UI...');
  } catch (error) {
    console.error('Failed to load default tracks:', error);
  }
}

// Detect if running in inactive tab or offscreen document
const isInactiveTab =
  window.location !== window.parent.location || document.visibilityState !== undefined;

function initAudio(): void {
  if (!audioElement) {
    audioElement = new Audio();

    audioElement.addEventListener('timeupdate', () => {
      if (audioElement) {
        currentState.currentTime = audioElement.currentTime;
        broadcastState();
      }
    });

    audioElement.addEventListener('loadedmetadata', () => {
      if (audioElement) {
        currentState.duration = audioElement.duration;
        broadcastState();
      }
    });

    audioElement.addEventListener('ended', () => {
      if (currentState.audioLoop && audioElement) {
        audioElement.currentTime = 0;
        audioElement.play();
      } else {
        handleSkip('next');
      }
    });

    audioElement.addEventListener('play', () => {
      currentState.audioPlaying = true;
      broadcastState();
    });

    audioElement.addEventListener('pause', () => {
      currentState.audioPlaying = false;
      broadcastState();
    });

    // Set initial properties
    audioElement.volume = currentState.audioVolume;
    audioElement.playbackRate = currentState.audioSpeed;
  }
}

function broadcastState(): void {
  // Broadcast state changes back to background
  audioMessaging.sendMessage('syncState', { ...currentState }).catch(() => {});
}

function handleSkip(direction: 'next' | 'prev'): void {
  if (tracks.length === 0) return;

  if (direction === 'next') {
    currentState.currentAudioIndex = (currentState.currentAudioIndex + 1) % tracks.length;
  } else {
    currentState.currentAudioIndex =
      currentState.currentAudioIndex === 0 ? tracks.length - 1 : currentState.currentAudioIndex - 1;
  }
  loadTrack();
  if (currentState.audioPlaying && audioElement) {
    audioElement.play();
  }
}

function loadTrack(): void {
  if (tracks.length === 0) return;

  const track = tracks[currentState.currentAudioIndex];
  if (audioElement && track) {
    // Handle both blob URLs (custom tracks) and regular URLs (default tracks)
    if (track.path.startsWith('blob:')) {
      audioElement.src = track.path;
    } else {
      audioElement.src = browser.runtime.getURL(track.path as any);
    }
    audioElement.load();
  }
}

// Message handlers
audioMessaging.onMessage('play', async () => {
  initAudio();
  if (audioElement) {
    await audioElement.play().catch((e) => console.error('Play failed:', e));
  }
  return { ...currentState };
});

audioMessaging.onMessage('pause', async () => {
  initAudio();
  if (audioElement) {
    audioElement.pause();
  }
  return { ...currentState };
});

audioMessaging.onMessage('toggle', async () => {
  initAudio();
  if (audioElement) {
    if (currentState.audioPlaying) {
      audioElement.pause();
    } else {
      await audioElement.play().catch((e) => console.error('Play failed:', e));
    }
  }
  return { ...currentState };
});

audioMessaging.onMessage('setVolume', async ({ data: volume }) => {
  initAudio();
  if (audioElement) {
    currentState.audioVolume = volume;
    audioElement.volume = volume;
    audioElement.muted = volume === 0;
  }
  return { ...currentState };
});

audioMessaging.onMessage('setSpeed', async ({ data: speed }) => {
  initAudio();
  if (audioElement) {
    currentState.audioSpeed = speed;
    audioElement.playbackRate = speed;
  }
  return { ...currentState };
});

audioMessaging.onMessage('setLoop', async ({ data: loop }) => {
  initAudio();
  currentState.audioLoop = loop;
  return { ...currentState };
});

audioMessaging.onMessage('seek', async ({ data: time }) => {
  initAudio();
  if (audioElement) {
    audioElement.currentTime = time;
  }
  return { ...currentState };
});

audioMessaging.onMessage('setTrack', async ({ data }) => {
  initAudio();

  // Validate track index
  if (tracks.length === 0) {
    console.warn('No tracks available yet');
    return { ...currentState };
  }

  if (data.index < 0 || data.index >= tracks.length) {
    console.warn('Invalid track index:', data.index);
    return { ...currentState };
  }

  currentState.currentAudioIndex = data.index;
  loadTrack();

  if (data.autoPlay && audioElement) {
    currentState.audioPlaying = true;
    await audioElement.play().catch((e) => console.error('Play failed:', e));
  }

  return { ...currentState };
});

audioMessaging.onMessage('skip', async ({ data: direction }) => {
  initAudio();
  handleSkip(direction);
  return { ...currentState };
});

audioMessaging.onMessage('getState', async () => {
  initAudio();
  return { ...currentState };
});

// NEW: Update tracks handler
audioMessaging.onMessage('updateTracks', async ({ data: newTracks }) => {
  tracks = newTracks;
  console.log(
    `Tracks updated: ${tracks.length} total (${tracks.filter((t) => t.isCustom).length} custom, ${tracks.filter((t) => !t.isCustom).length} default)`
  );

  // If currently playing a track that no longer exists, stop
  if (currentState.currentAudioIndex >= tracks.length) {
    currentState.currentAudioIndex = 0;
    if (audioElement) {
      audioElement.pause();
      currentState.audioPlaying = false;
    }
  }

  return { ...currentState };
});

// Initialize on load
initAudio();
console.log(`Audio player initialized in ${isInactiveTab ? 'inactive tab' : 'offscreen document'}`);
