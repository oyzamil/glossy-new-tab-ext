import { config } from '@/app.config';
import { notify } from './notifier';
import { openPage } from './openPage';

export default defineBackground(() => {
  try {
    browser.runtime.onInstalled.addListener(({ reason, previousVersion }) => {
      if (import.meta.env.PROD) {
        browser.tabs.create({
          url: `${config.APP.extensionPage}?event=${getPackageProp('name')}-${reason}`,
        });
      }
    });

    onMessage(GENERAL_MESSAGES.SHOW_NOTIFICATION, ({ data }) => {
      notify(data);
    });

    onMessage(GENERAL_MESSAGES.OPEN_TAB, async ({ data }) => {
      return openPage(data.url, data.options);
    });
  } catch (error) {
    console.error('Service Worker Error:', error);
  }
});
