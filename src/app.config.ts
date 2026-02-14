import { defineAppConfig } from 'wxt/utils/define-app-config';

export const config = {
  APP: {
    color: '#00aa45',
    font: 'Poppins',
    storageBucket: 'glossy-new-tab-ext',
    extensionPage: 'https://muzammil.work/',
  },
  SETTINGS: {
    theme: 'system' as 'light' | 'dark' | 'system',
    licenseModalVisible: false,
    licenseInfo: {
      email: null as string | null,
      isLicensed: false,
      licenseKey: null as null | string,
      verificationDate: '' as string | number,
      consecutiveFailures: 0 as number,
      subscriptionId: null as null | string,
      subscriptionStatus: 'inactive',
      lastSuccessfulCheck: '' as string,
      error: '' as string,
    },
    glassMorphism: true as boolean,
    blurAmount: 10 as number,
    showTimeInStandby: false as boolean,
    clockWidget: true as boolean,
    quotesWidget: false as boolean,
    multiWidget: false as boolean,
    audioPlayerWidget: false as boolean,
    audioLoop: true as boolean,
    audioVolume: 0.25 as number,
    audioPlaying: false as boolean,
    audioSpeed: 1 as number,
    currentAudioIndex: 0 as number,
    videoPlayback: true as boolean,
    hideControlsOnInactivity: true as boolean,
    multiWidgetMode: 'weather' as 'weather' | 'clock' | 'calender',
  },
  ROUTES: {
    HOME: '/',
    SETTINGS: '/settings',
  },
  GUMROAD: {
    GUMROAD_PRODUCT_ID: '',
    GUMROAD_URL: '',
  },
};

export default defineAppConfig(config);

export type Settings = typeof config.SETTINGS;

declare module 'wxt/utils/define-app-config' {
  export interface WxtAppConfig {
    APP: typeof config.APP;
    SETTINGS: typeof config.SETTINGS;
    ROUTES: typeof config.ROUTES;
    GUMROAD: typeof config.GUMROAD;
  }
}
