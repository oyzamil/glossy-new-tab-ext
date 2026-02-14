import { defineExtensionMessaging } from '@webext-core/messaging';

export interface Track {
  id: string;
  name: string;
  path: string;
  isCustom?: boolean;
}

export interface AudioState {
  currentAudioIndex: number;
  audioPlaying: boolean;
  audioVolume: number;
  audioLoop: boolean;
  audioSpeed: number;
  currentTime: number;
  duration: number;
}

// Define messaging protocol
export const audioMessaging = defineExtensionMessaging<{
  play: () => AudioState;
  pause: () => AudioState;
  toggle: () => AudioState;
  setVolume: (volume: number) => AudioState;
  setSpeed: (speed: number) => AudioState;
  setLoop: (loop: boolean) => AudioState;
  seek: (time: number) => AudioState;
  setTrack: (data: { index: number; autoPlay: boolean }) => AudioState;
  skip: (direction: 'next' | 'prev') => AudioState;
  getState: () => AudioState;
  syncState: (state: AudioState) => void;
  updateTracks: (tracks: Track[]) => AudioState; // NEW: Update track list
}>();
