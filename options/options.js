/**
 * Stars Popup - Options Page
 * Manages widget configuration: CRUD widgets and links, icon upload.
 */
(() => {
  const widgetList = document.getElementById('widget-list');
  const btnAddWidget = document.getElementById('btn-add-widget');
  let widgets = [];

  // ======================== Initialization ========================

  const btnExport = document.getElementById('btn-export');
  const btnImport = document.getElementById('btn-import');
  const importFile = document.getElementById('import-file');

  async function init() {
    widgets = await StarsPopupStorage.getWidgets();
    render();
    btnAddWidget.addEventListener('click', addWidget);
    btnExport.addEventListener('click', exportConfig);
    btnImport.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importConfig);
  }

  // ======================== Rendering ========================

  function render() {
    widgetList.innerHTML = '';

    if (widgets.length === 0) {
      widgetList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">&#9734;</div>
          <p class="empty-state-text">No widgets yet. Click "Add Widget" to get started.</p>
        </div>
      `;
      return;
    }

    widgets.forEach((widget, index) => {
      widgetList.appendChild(createWidgetCard(widget, index));
    });
  }

  function createWidgetCard(widget, index) {
    const card = document.createElement('div');
    card.className = 'widget-card';

    // Header: icon preview + tooltip input + actions
    const header = document.createElement('div');
    header.className = 'widget-card-header';

    // Icon preview (clickable to upload)
    const iconPreview = document.createElement('div');
    iconPreview.className = 'widget-icon-preview';
    iconPreview.style.backgroundImage = `url(${widget.icon})`;
    iconPreview.title = 'Click to change icon';
    iconPreview.addEventListener('click', () => uploadIcon(index));
    header.appendChild(iconPreview);

    // Hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png,image/jpeg,image/svg+xml,image/webp';
    fileInput.style.display = 'none';
    fileInput.dataset.index = index;
    fileInput.addEventListener('change', (e) => handleIconUpload(e, index));
    header.appendChild(fileInput);

    // Info area
    const info = document.createElement('div');
    info.className = 'widget-card-info';

    const tooltipGroup = document.createElement('div');
    const tooltipInput = document.createElement('input');
    tooltipInput.type = 'text';
    tooltipInput.className = 'form-input';
    tooltipInput.value = widget.tooltip;
    tooltipInput.placeholder = 'Widget name / tooltip';
    tooltipInput.addEventListener('input', (e) => {
      widgets[index].tooltip = e.target.value;
      save();
    });
    tooltipGroup.appendChild(tooltipInput);
    info.appendChild(tooltipGroup);

    header.appendChild(info);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'widget-card-actions';

    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn btn-danger btn-sm';
    btnDelete.textContent = 'Delete';
    btnDelete.addEventListener('click', () => deleteWidget(index));
    actions.appendChild(btnDelete);

    header.appendChild(actions);
    card.appendChild(header);

    // Links section
    const linksSection = document.createElement('div');
    linksSection.className = 'links-section';

    const linksHeader = document.createElement('div');
    linksHeader.className = 'links-header';

    const linksTitle = document.createElement('span');
    linksTitle.className = 'links-title';
    linksTitle.textContent = 'Links';
    linksHeader.appendChild(linksTitle);

    const btnAddLink = document.createElement('button');
    btnAddLink.className = 'btn btn-sm';
    btnAddLink.textContent = '+ Add Link';
    btnAddLink.addEventListener('click', () => addLink(index));
    linksHeader.appendChild(btnAddLink);

    linksSection.appendChild(linksHeader);

    // Link items
    const linksContainer = document.createElement('div');
    linksContainer.className = 'links-container';

    (widget.links || []).forEach((link, linkIndex) => {
      linksContainer.appendChild(createLinkItem(index, linkIndex, link));
    });

    linksSection.appendChild(linksContainer);
    card.appendChild(linksSection);

    return card;
  }

  function createLinkItem(widgetIndex, linkIndex, link) {
    const item = document.createElement('div');
    item.className = 'link-item';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'form-input link-input-title';
    titleInput.value = link.title;
    titleInput.placeholder = 'Title';
    titleInput.addEventListener('input', (e) => {
      widgets[widgetIndex].links[linkIndex].title = e.target.value;
      save();
    });
    item.appendChild(titleInput);

    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.className = 'form-input link-input-url';
    urlInput.value = link.url;
    urlInput.placeholder = 'https://example.com';
    urlInput.addEventListener('input', (e) => {
      widgets[widgetIndex].links[linkIndex].url = e.target.value;
      save();
    });
    item.appendChild(urlInput);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'link-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Remove link';
    removeBtn.addEventListener('click', () => removeLink(widgetIndex, linkIndex));
    item.appendChild(removeBtn);

    return item;
  }

  // ======================== Actions ========================

  function addWidget() {
    widgets.push({
      id: `w_${Date.now()}`,
      icon: StarsPopupStorage.getDefaultIcon(),
      tooltip: 'New Widget',
      links: []
    });
    save();
    render();
  }

  function deleteWidget(index) {
    if (!confirm(`Delete widget "${widgets[index].tooltip}"?`)) return;
    widgets.splice(index, 1);
    save();
    render();
  }

  function addLink(widgetIndex) {
    if (!widgets[widgetIndex].links) widgets[widgetIndex].links = [];
    widgets[widgetIndex].links.push({ title: '', url: '' });
    save();
    render();
  }

  function removeLink(widgetIndex, linkIndex) {
    widgets[widgetIndex].links.splice(linkIndex, 1);
    save();
    render();
  }

  // ======================== Icon Upload ========================

  function uploadIcon(widgetIndex) {
    const fileInput = document.querySelector(`input[type="file"][data-index="${widgetIndex}"]`);
    if (fileInput) fileInput.click();
  }

  const MAX_ICON_FILE_SIZE = 512 * 1024; // 512KB max upload size
  const ICON_RENDER_SIZE = 40;
  const MAX_DATAURL_SIZE = 8 * 1024; // 8KB max data-URI (sync storage limit per item)

  function handleIconUpload(event, widgetIndex) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > MAX_ICON_FILE_SIZE) {
      alert(`Icon file is too large (${(file.size / 1024).toFixed(0)}KB). Maximum allowed size is ${MAX_ICON_FILE_SIZE / 1024}KB.`);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = ICON_RENDER_SIZE;
        canvas.height = ICON_RENDER_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, ICON_RENDER_SIZE, ICON_RENDER_SIZE);

        // Try PNG first, fallback to lower quality JPEG if too large
        let dataUrl = canvas.toDataURL('image/png');
        if (dataUrl.length > MAX_DATAURL_SIZE) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        }
        if (dataUrl.length > MAX_DATAURL_SIZE) {
          alert('Icon is still too large after compression. Please use a simpler or smaller image.');
          return;
        }

        widgets[widgetIndex].icon = dataUrl;
        save();
        render();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ======================== Export / Import ========================

  function exportConfig() {
    const data = JSON.stringify({ widgets }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stars-popup-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.widgets || !Array.isArray(data.widgets)) {
          throw new Error('Invalid format: missing "widgets" array');
        }
        // Validate each widget has required fields
        for (const w of data.widgets) {
          if (!w.id || !w.tooltip) {
            throw new Error('Invalid widget: missing id or tooltip');
          }
          if (!w.icon) w.icon = StarsPopupStorage.getDefaultIcon();
          if (!w.links) w.links = [];
        }
        if (!confirm(`Import ${data.widgets.length} widget(s)? This will replace your current configuration.`)) return;
        widgets = data.widgets;
        await StarsPopupStorage.saveWidgets(widgets);
        render();
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // ======================== Persistence ========================

  let saveTimer = null;

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await StarsPopupStorage.saveWidgets(widgets);
    }, 300);
  }

  // ======================== Start ========================

  init();
})();
