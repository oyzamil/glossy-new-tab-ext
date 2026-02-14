import { InitExtension } from './managers/developerManager';
import { openPage } from './managers/newTabManager';
import { notify } from './managers/notificationManager';
import { isUsingInactiveTab, offscreenManager } from './managers/offscreenManager';

export default defineBackground(() => {
  try {
    browser.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => {
      try {
        await offscreenManager.create();
        console.log(
          `Audio player initialized using ${isUsingInactiveTab ? 'inactive tab' : 'offscreen document'}`
        );

        InitExtension({ reason });
      } catch (error) {
        console.error(error);
      }
    });

    onMessage(GENERAL_MESSAGES.SHOW_NOTIFICATION, ({ data }) => {
      notify(data);
    });

    onMessage(GENERAL_MESSAGES.OPEN_TAB, async ({ data }) => {
      return openPage(data.url, data.options);
    });

    audioMessaging.onMessage('play', async () => {
      await offscreenManager.create();
      const state = await audioMessaging.sendMessage('play', undefined);
      await broadcastStateToTabs(state);
      return state;
    });

    audioMessaging.onMessage('pause', async () => {
      await offscreenManager.create();
      const state = await audioMessaging.sendMessage('pause', undefined);
      await broadcastStateToTabs(state);
      return state;
    });

    audioMessaging.onMessage('toggle', async () => {
      await offscreenManager.create();
      const state = await audioMessaging.sendMessage('toggle', undefined);
      await broadcastStateToTabs(state);
      return state;
    });

    audioMessaging.onMessage('setVolume', async ({ data }) => {
      await offscreenManager.create();
      const state = await audioMessaging.sendMessage('setVolume', data);
      await broadcastStateToTabs(state);
      return state;
    });

    audioMessaging.onMessage('setSpeed', async ({ data }) => {
      await offscreenManager.create();
      const state = await audioMessaging.sendMessage('setSpeed', data);
      await broadcastStateToTabs(state);
      return state;
    });

    audioMessaging.onMessage('setLoop', async ({ data }) => {
      await offscreenManager.create();
      const state = await audioMessaging.sendMessage('setLoop', data);
      await broadcastStateToTabs(state);
      return state;
    });

    audioMessaging.onMessage('seek', async ({ data }) => {
      await offscreenManager.create();
      const state = await audioMessaging.sendMessage('seek', data);
      await broadcastStateToTabs(state);
      return state;
    });

    audioMessaging.onMessage('setTrack', async ({ data }) => {
      await offscreenManager.create();
      const state = await audioMessaging.sendMessage('setTrack', data);
      await broadcastStateToTabs(state);
      return state;
    });

    audioMessaging.onMessage('skip', async ({ data }) => {
      await offscreenManager.create();
      const state = await audioMessaging.sendMessage('skip', data);
      await broadcastStateToTabs(state);
      return state;
    });

    audioMessaging.onMessage('getState', async () => {
      await offscreenManager.create();
      return await audioMessaging.sendMessage('getState', undefined);
    });

    audioMessaging.onMessage('updateTracks', async ({ data }) => {
      try {
        await offscreenManager.create();
        const state = await audioMessaging.sendMessage('updateTracks', data);
        return state; // ✅ Must return the state
      } catch (error) {
        console.error('Failed to update tracks:', error);
        // Return current state even on error
        try {
          return await audioMessaging.sendMessage('getState', undefined);
        } catch {
          // Fallback state
          return {
            currentAudioIndex: 0,
            audioPlaying: false,
            audioVolume: 1,
            audioLoop: false,
            audioSpeed: 1,
            currentTime: 0,
            duration: 0,
          };
        }
      }
    });

    async function broadcastStateToTabs(state: AudioState): Promise<void> {
      try {
        const tabs = await browser.tabs.query({});

        await Promise.allSettled(
          tabs.map(async (tab) => {
            if (tab.id) {
              try {
                await audioMessaging.sendMessage('syncState', state);
              } catch (error) {}
            }
          })
        );
      } catch (error) {
        console.error('Error broadcasting state to tabs:', error);
      }
    }
  } catch (error) {
    console.error('Service Worker Error:', error);
  }
});
