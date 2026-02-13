import { defineExtensionMessaging } from '@webext-core/messaging';

export interface Track {
  id: string;
  name: string;
  path: string;
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

export interface AudioPlayMessage {
  type: 'AUDIO_PLAY';
}

export interface AudioPauseMessage {
  type: 'AUDIO_PAUSE';
}

export interface AudioToggleMessage {
  type: 'AUDIO_TOGGLE';
}

export interface AudioSetVolumeMessage {
  type: 'AUDIO_SET_VOLUME';
  volume: number;
}

export interface AudioSetSpeedMessage {
  type: 'AUDIO_SET_SPEED';
  speed: number;
}

export interface AudioSetLoopMessage {
  type: 'AUDIO_SET_LOOP';
  loop: boolean;
}

export interface AudioSeekMessage {
  type: 'AUDIO_SEEK';
  time: number;
}

export interface AudioSetTrackMessage {
  type: 'AUDIO_SET_TRACK';
  index: number;
  autoPlay: boolean;
}

export interface AudioSkipMessage {
  type: 'AUDIO_SKIP';
  direction: 'next' | 'prev';
}

export interface AudioGetStateMessage {
  type: 'AUDIO_GET_STATE';
}

export interface AudioStateSyncMessage {
  type: 'AUDIO_STATE_SYNC';
  state: AudioState;
}

export type AudioMessage =
  | AudioPlayMessage
  | AudioPauseMessage
  | AudioToggleMessage
  | AudioSetVolumeMessage
  | AudioSetSpeedMessage
  | AudioSetLoopMessage
  | AudioSeekMessage
  | AudioSetTrackMessage
  | AudioSkipMessage
  | AudioGetStateMessage
  | AudioStateSyncMessage;

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
}>();
