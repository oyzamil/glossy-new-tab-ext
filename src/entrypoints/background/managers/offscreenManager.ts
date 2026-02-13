interface OffscreenManager {
  path: string;
  create(): Promise<void>;
  hasOffscreenDocument(): Promise<boolean>;
  close(): Promise<void>;
}

// Detect browser type
const useInactiveTab = typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox');

// Chrome-style offscreen document implementation
class ChromeOffscreenManager implements OffscreenManager {
  path = '/offscreen.html' as const;
  private creating: Promise<void> | null = null;

  async create(): Promise<void> {
    if (await this.hasOffscreenDocument()) {
      return;
    }

    if (this.creating) {
      await this.creating;
      return;
    }

    this.creating = (async () => {
      // @ts-ignore - offscreen API not in webextension-polyfill types yet
      await browser.offscreen.createDocument({
        url: browser.runtime.getURL(this.path),
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Playing audio across all tabs',
      });
    })();

    await this.creating;
    this.creating = null;
  }

  async hasOffscreenDocument(): Promise<boolean> {
    // Use the new getContexts API if supported
    // @ts-ignore - getContexts not in types yet
    if (browser.runtime?.getContexts) {
      // @ts-ignore
      const contexts = await browser.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [browser.runtime.getURL(this.path)],
      });
      return contexts.length > 0;
    } else {
      // Fallback for older Chrome versions
      const matchedClients = await (self as any).clients?.matchAll();
      if (!matchedClients) return false;
      return matchedClients.some(
        (client: any) => client.url.includes(browser.runtime.id) && client.url.includes(this.path)
      );
    }
  }

  async close(): Promise<void> {
    if (!(await this.hasOffscreenDocument())) {
      return;
    }
    // @ts-ignore - offscreen API not in types
    await browser.offscreen.closeDocument();
  }
}

// Firefox/Opera inactive tab implementation
class InactiveTabManager implements OffscreenManager {
  path = '/offscreen.html' as const;
  private tabId: number | null = null;

  async create(): Promise<void> {
    if (await this.hasOffscreenDocument()) {
      return;
    }

    // Create an inactive tab for audio playback
    const tab = await browser.tabs.create({
      url: browser.runtime.getURL(this.path),
      active: false,
      pinned: true,
    });

    this.tabId = tab.id || null;

    // Optionally update tab properties
    if (this.tabId) {
      try {
        await browser.tabs.update(this.tabId, {
          muted: false,
        });
      } catch (e) {
        console.warn('Could not update tab properties:', e);
      }
    }
  }

  async hasOffscreenDocument(): Promise<boolean> {
    if (this.tabId === null) {
      return false;
    }

    try {
      const tab = await browser.tabs.get(this.tabId);
      return !!(tab && tab.url?.includes(this.path));
    } catch (e) {
      // Tab doesn't exist
      this.tabId = null;
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.tabId !== null) {
      try {
        await browser.tabs.remove(this.tabId);
        this.tabId = null;
      } catch (e) {
        console.warn('Could not close tab:', e);
      }
    }
  }
}

// Export singleton instance based on browser
export const offscreenManager: OffscreenManager = useInactiveTab
  ? new InactiveTabManager()
  : new ChromeOffscreenManager();

export const isUsingInactiveTab = useInactiveTab;
