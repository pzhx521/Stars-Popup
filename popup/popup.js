/**
 * Stars Popup - Popup Page
 * Quick widget visibility management from the toolbar.
 */
(() => {
  const widgetListEl = document.getElementById('widget-list');
  const btnToggleAll = document.getElementById('btn-toggle-all');
  const btnSettings = document.getElementById('btn-settings');
  const btnTheme = document.getElementById('btn-theme');
  let widgets = [];

  const MOON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const SUN_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

  async function init() {
    widgets = await StarsPopupStorage.getWidgets();
    render();
    btnToggleAll.addEventListener('click', toggleAll);
    btnSettings.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    const theme = await StarsPopupStorage.getTheme();
    updateThemeButton(theme);
    btnTheme.addEventListener('click', async () => {
      const current = await StarsPopupStorage.getTheme();
      const next = current === 'light' ? 'dark' : 'light';
      await StarsPopupStorage.saveTheme(next);
      updateThemeButton(next);
    });
  }

  function updateThemeButton(theme) {
    btnTheme.innerHTML = theme === 'light' ? MOON_SVG : SUN_SVG;
    btnTheme.title = theme === 'light' ? '切换到深色主题' : '切换到浅色主题';
  }

  function render() {
    widgetListEl.innerHTML = '';

    if (widgets.length === 0) {
      widgetListEl.innerHTML = '<div class="empty-state">No widgets configured.</div>';
      updateToggleAllButton();
      return;
    }

    widgets.forEach((widget, index) => {
      const isVisible = widget.visible !== false;

      const item = document.createElement('div');
      item.className = `widget-item${isVisible ? '' : ' widget-item-hidden'}`;

      const icon = document.createElement('div');
      icon.className = 'widget-icon';
      icon.style.backgroundImage = `url(${StarsPopupStorage.sanitizeIcon(widget.icon)})`;
      item.appendChild(icon);

      const name = document.createElement('span');
      name.className = 'widget-name';
      name.textContent = widget.tooltip || 'Untitled';
      item.appendChild(name);

      const toggle = document.createElement('button');
      toggle.className = `widget-toggle${isVisible ? '' : ' widget-toggle-show'}`;
      toggle.textContent = isVisible ? 'Hide' : 'Show';
      toggle.addEventListener('click', () => toggleWidget(index));
      item.appendChild(toggle);

      widgetListEl.appendChild(item);
    });

    updateToggleAllButton();
  }

  function updateToggleAllButton() {
    const allHidden = widgets.length > 0 && widgets.every(w => w.visible === false);
    btnToggleAll.textContent = allHidden ? 'Show All' : 'Hide All';
  }

  async function toggleWidget(index) {
    widgets[index].visible = widgets[index].visible === false ? true : false;
    await StarsPopupStorage.saveWidgets(widgets);
    render();
  }

  async function toggleAll() {
    const allHidden = widgets.every(w => w.visible === false);
    const newState = allHidden ? true : false;
    widgets.forEach(w => { w.visible = newState; });
    await StarsPopupStorage.saveWidgets(widgets);
    render();
  }

  init();
})();
