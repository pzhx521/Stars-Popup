/**
 * Stars Popup - Content Script
 * Renders floating widgets on every page, handles drag and panel interactions.
 */
(() => {
  const WIDGET_SIZE = 40;
  const DRAG_THRESHOLD = 5;
  const PANEL_WIDTH = 280;
  const PANEL_GAP = 8;
  const VIEWPORT_PADDING = 8;
  const SAVE_DEBOUNCE_MS = 300;

  let shadowRoot = null;
  let tooltip = null;
  let currentPanel = null;
  let currentPanelWidgetId = null;
  let saveTimer = null;
  // ======================== Initialization ========================

  async function init() {
    const existing = document.getElementById('stars-popup-root');
    if (existing) existing.remove();

    const host = document.createElement('div');
    host.id = 'stars-popup-root';
    shadowRoot = host.attachShadow({ mode: 'closed' });

    // Inject CSS
    const cssUrl = chrome.runtime.getURL('content/content.css');
    const cssText = await fetch(cssUrl).then(r => r.text());
    const style = document.createElement('style');
    style.textContent = cssText;
    shadowRoot.appendChild(style);

    // Create tooltip element
    tooltip = document.createElement('div');
    tooltip.className = 'sp-tooltip';
    shadowRoot.appendChild(tooltip);

    document.body.appendChild(host);

    const theme = await StarsPopupStorage.getTheme();
    applyTheme(theme);

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.theme) {
        applyTheme(changes.theme.newValue || 'light');
      }
    });

    await renderWidgets();
    setupGlobalListeners();
  }

  async function renderWidgets() {
    // Remove existing widgets and panels
    shadowRoot.querySelectorAll('.sp-widget, .sp-panel').forEach(el => el.remove());
    currentPanel = null;
    currentPanelWidgetId = null;

    const widgets = await StarsPopupStorage.getWidgets();
    const positions = await StarsPopupStorage.getPositions();

    const visibleWidgets = widgets.filter(w => w.visible !== false);
    visibleWidgets.forEach((widget, index) => {
      const pos = positions[widget.id];
      const defaultX = window.innerWidth - WIDGET_SIZE - 20;
      const defaultY = window.innerHeight - WIDGET_SIZE - 20 - index * (WIDGET_SIZE + 10);

      const el = createWidgetElement(widget, pos || { x: defaultX, y: defaultY });
      shadowRoot.appendChild(el);
    });
  }

  // ======================== Widget Element ========================

  function createWidgetElement(widget, position) {
    const el = document.createElement('div');
    el.className = 'sp-widget';
    el.dataset.widgetId = widget.id;
    el.style.backgroundImage = `url(${StarsPopupStorage.sanitizeIcon(widget.icon)})`;
    el.style.left = `${clampX(position.x)}px`;
    el.style.top = `${clampY(position.y)}px`;

    setupDrag(el, widget);
    setupTooltip(el, widget.tooltip);

    return el;
  }

  // ======================== Tooltip ========================

  function setupTooltip(el, text) {
    el.addEventListener('pointerenter', () => {
      if (el.classList.contains('sp-dragging')) return;
      tooltip.textContent = text;
      const rect = el.getBoundingClientRect();
      tooltip.style.left = `${rect.left + WIDGET_SIZE / 2}px`;
      tooltip.style.top = `${rect.top - 30}px`;
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.classList.add('sp-visible');
    });

    el.addEventListener('pointerleave', () => {
      tooltip.classList.remove('sp-visible');
    });
  }

  // ======================== Drag Logic ========================

  function setupDrag(el, widget) {
    let startX, startY, offsetX, offsetY, isDragging = false;

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);

      const rect = el.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      isDragging = false;

      el.classList.add('sp-dragging');
      tooltip.classList.remove('sp-visible');
    });

    el.addEventListener('pointermove', (e) => {
      if (!el.hasPointerCapture(e.pointerId)) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!isDragging && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
      isDragging = true;

      const newX = clampX(e.clientX - offsetX);
      const newY = clampY(e.clientY - offsetY);
      el.style.left = `${newX}px`;
      el.style.top = `${newY}px`;
    });

    el.addEventListener('pointerup', (e) => {
      el.classList.remove('sp-dragging');

      if (!isDragging) {
        togglePanel(widget, el);
      } else {
        const x = parseInt(el.style.left);
        const y = parseInt(el.style.top);
        debounceSavePosition(widget.id, x, y);
      }
    });
  }

  function debounceSavePosition(widgetId, x, y) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      StarsPopupStorage.savePosition(widgetId, x, y);
    }, SAVE_DEBOUNCE_MS);
  }

  // ======================== Panel ========================

  function togglePanel(widget, widgetEl) {
    if (currentPanelWidgetId === widget.id) {
      closePanel();
      return;
    }

    closePanel();

    const panel = document.createElement('div');
    panel.className = 'sp-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'sp-panel-header';

    const headerIcon = document.createElement('img');
    headerIcon.className = 'sp-panel-header-icon';
    headerIcon.src = StarsPopupStorage.sanitizeIcon(widget.icon);
    header.appendChild(headerIcon);

    const headerTitle = document.createElement('span');
    headerTitle.className = 'sp-panel-header-title';
    headerTitle.textContent = widget.tooltip;
    header.appendChild(headerTitle);

    panel.appendChild(header);

    // Links
    if (widget.links && widget.links.length > 0) {
      const list = document.createElement('ul');
      list.className = 'sp-panel-links';

      widget.links.forEach(link => {
        if (!StarsPopupStorage.isSafeUrl(link.url)) return;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'sp-panel-link';
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        // todo 暂时移除图标显示
        // const icon = document.createElement('img');
        // icon.className = 'sp-panel-link-icon';
        // icon.src = getFaviconUrl(link.url);
        // icon.onerror = () => { icon.style.display = 'none'; };
        // a.appendChild(icon);

        const title = document.createElement('span');
        title.className = 'sp-panel-link-title';
        title.textContent = link.title || link.url;
        a.appendChild(title);

        li.appendChild(a);
        list.appendChild(li);
      });

      panel.appendChild(list);
    } else {
      const empty = document.createElement('div');
      empty.className = 'sp-panel-empty';
      empty.textContent = 'No links yet. Click the extension icon to add some.';
      panel.appendChild(empty);
    }

    shadowRoot.appendChild(panel);

    // Position the panel
    positionPanel(panel, widgetEl);

    // Animate in
    requestAnimationFrame(() => {
      panel.classList.add('sp-visible');
    });

    currentPanel = panel;
    currentPanelWidgetId = widget.id;
  }

  function positionPanel(panel, widgetEl) {
    const wr = widgetEl.getBoundingClientRect();
    const panelHeight = Math.min(panel.scrollHeight, 420);
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left, top;

    // Horizontal: prefer left of widget, fallback to right
    if (wr.left - PANEL_WIDTH - PANEL_GAP >= VIEWPORT_PADDING) {
      left = wr.left - PANEL_WIDTH - PANEL_GAP;
    } else if (wr.right + PANEL_GAP + PANEL_WIDTH <= vw - VIEWPORT_PADDING) {
      left = wr.right + PANEL_GAP;
    } else {
      left = Math.max(VIEWPORT_PADDING, (vw - PANEL_WIDTH) / 2);
    }

    // Vertical: center on widget, clamp to viewport
    top = wr.top + wr.height / 2 - panelHeight / 2;
    top = Math.max(VIEWPORT_PADDING, Math.min(top, vh - panelHeight - VIEWPORT_PADDING));

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  function closePanel() {
    if (currentPanel) {
      currentPanel.remove();
      currentPanel = null;
      currentPanelWidgetId = null;
    }
  }

  // ======================== Global Listeners ========================

  function setupGlobalListeners() {
    // Close panel on click outside
    document.addEventListener('pointerdown', (e) => {
      if (!currentPanel) return;
      const host = document.getElementById('stars-popup-root');
      if (host && !host.contains(e.target)) {
        closePanel();
      }
    });

    // Close panel on click inside shadow root but outside panel/widget
    shadowRoot.addEventListener('pointerdown', (e) => {
      if (!currentPanel) return;
      const target = e.composedPath()[0];
      if (!target.closest('.sp-panel') && !target.closest('.sp-widget')) {
        closePanel();
      }
    });

    // Close panel on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePanel();
    });

    // Recalculate positions on resize (throttled)
    let resizeRafId = null;
    window.addEventListener('resize', () => {
      if (resizeRafId) return;
      resizeRafId = requestAnimationFrame(() => {
        resizeRafId = null;
        shadowRoot.querySelectorAll('.sp-widget').forEach(el => {
          const x = clampX(parseInt(el.style.left));
          const y = clampY(parseInt(el.style.top));
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
        });
        if (currentPanel) {
          const widgetEl = shadowRoot.querySelector(
            `.sp-widget[data-widget-id="${currentPanelWidgetId}"]`
          );
          if (widgetEl) positionPanel(currentPanel, widgetEl);
        }
      });
    });

    // Listen for reload messages from service worker
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'reload-widgets') {
        renderWidgets();
      }
    });
  }

  // ======================== Theme ========================

  function applyTheme(theme) {
    const host = document.getElementById('stars-popup-root');
    if (host) {
      host.dataset.theme = theme;
    }
    if (shadowRoot) {
      shadowRoot.host.dataset.theme = theme;
      // Update CSS custom property on the shadow root's inner wrapper
      const root = shadowRoot.querySelector('.sp-theme-root');
      if (root) root.dataset.theme = theme;
    }
  }

  // ======================== Utilities ========================

  function clampX(x) {
    return Math.max(0, Math.min(x, window.innerWidth - WIDGET_SIZE));
  }

  function clampY(y) {
    return Math.max(0, Math.min(y, window.innerHeight - WIDGET_SIZE));
  }

  function getFaviconUrl(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return '';
    }
  }

  // ======================== Start ========================

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
