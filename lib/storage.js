/**
 * Stars Popup - Storage Layer
 * Wraps chrome.storage.local for widget config and positions (no cloud sync for privacy).
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
    const result = await chrome.storage.local.get('widgets');
    return result.widgets || DEFAULT_WIDGETS;
  }

  async function saveWidgets(widgets) {
    await chrome.storage.local.set({ widgets });
  }

  let positionsCache = null;

  async function getPositions() {
    if (positionsCache) return positionsCache;
    const result = await chrome.storage.local.get('positions');
    positionsCache = result.positions || {};
    return positionsCache;
  }

  async function savePosition(widgetId, x, y) {
    if (!positionsCache) {
      positionsCache = await getPositions();
    }
    positionsCache[widgetId] = { x, y };
    await chrome.storage.local.set({ positions: positionsCache });
  }

  function getDefaultIcon() {
    return DEFAULT_ICON;
  }

  function getDefaultWidgets() {
    return JSON.parse(JSON.stringify(DEFAULT_WIDGETS));
  }

  /** Returns true if the string is a safe image data-URI. */
  function isSafeIcon(str) {
    return typeof str === 'string' &&
      /^data:image\/(png|jpeg|svg\+xml|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(str);
  }

  /** Returns the icon if safe, otherwise the default icon. */
  function sanitizeIcon(icon) {
    return isSafeIcon(icon) ? icon : DEFAULT_ICON;
  }

  /** Returns true if the URL uses http or https protocol. */
  function isSafeUrl(str) {
    if (typeof str !== 'string') return false;
    try {
      const protocol = new URL(str).protocol;
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  }

  return {
    getWidgets,
    saveWidgets,
    getPositions,
    savePosition,
    getDefaultIcon,
    getDefaultWidgets,
    sanitizeIcon,
    isSafeUrl
  };
})();
