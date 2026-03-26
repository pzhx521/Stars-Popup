/**
 * Stars Popup - Popup Page
 * Quick widget visibility management from the toolbar.
 */
(() => {
  const widgetListEl = document.getElementById('widget-list');
  const btnToggleAll = document.getElementById('btn-toggle-all');
  const btnSettings = document.getElementById('btn-settings');
  let widgets = [];

  async function init() {
    widgets = await StarsPopupStorage.getWidgets();
    render();
    btnToggleAll.addEventListener('click', toggleAll);
    btnSettings.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
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
