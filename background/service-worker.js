/**
 * Stars Popup - Service Worker
 * Handles installation, toolbar click, and config change notifications.
 */

// Initialize default config on first install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const result = await chrome.storage.local.get('widgets');
    if (!result.widgets) {
      const DEFAULT_ICON = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="#FFD700"><path d="M24 2l6.18 12.52L44 16.54l-10 9.74L36.36 40 24 33.27 11.64 40 14 26.28 4 16.54l13.82-2.02z"/></svg>`)}`;
      await chrome.storage.local.set({
        widgets: [
          {
            id: 'w_default_1',
            icon: DEFAULT_ICON,
            tooltip: 'Quick Links',
            links: [
              { title: 'Google', url: 'https://www.google.com' },
              { title: 'GitHub', url: 'https://github.com' },
              { title: 'Stack Overflow', url: 'https://stackoverflow.com' }
            ]
          }
        ]
      });
    }
  }
});

// Notify all tabs to reload widgets when config changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.widgets) {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { type: 'reload-widgets' }).catch(() => {
          // Tab may not have content script loaded, ignore
        });
      }
    });
  }
});
