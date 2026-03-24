/**
 * Stars Popup - Storage Layer
 * Wraps chrome.storage.sync (widget config) and chrome.storage.local (positions).
 */
const StarsPopupStorage = (() => {
  const DEFAULT_ICON = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="#FFD700"><path d="M24 2l6.18 12.52L44 16.54l-10 9.74L36.36 40 24 33.27 11.64 40 14 26.28 4 16.54l13.82-2.02z"/></svg>`)}`;

  const DEFAULT_WIDGETS = [
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
  ];

  async function getWidgets() {
    const result = await chrome.storage.sync.get('widgets');
    return result.widgets || DEFAULT_WIDGETS;
  }

  async function saveWidgets(widgets) {
    await chrome.storage.sync.set({ widgets });
  }

  async function getPositions() {
    const result = await chrome.storage.local.get('positions');
    return result.positions || {};
  }

  async function savePosition(widgetId, x, y) {
    const positions = await getPositions();
    positions[widgetId] = { x, y };
    await chrome.storage.local.set({ positions });
  }

  function getDefaultIcon() {
    return DEFAULT_ICON;
  }

  function getDefaultWidgets() {
    return JSON.parse(JSON.stringify(DEFAULT_WIDGETS));
  }

  return {
    getWidgets,
    saveWidgets,
    getPositions,
    savePosition,
    getDefaultIcon,
    getDefaultWidgets
  };
})();
