import { config } from '@/app.config';

export const InitExtension = ({ reason }: { reason: any }) => {
  if (reason === 'install') browser.tabs.create({});
  if (import.meta.env.PROD) {
    browser.tabs.create({
      url: `${config.APP.extensionPage}?event=${getPackageProp('name')}-${reason}`,
    });
  }
};
