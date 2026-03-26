/**
 * Stars Popup - Options Page
 * Manages widget configuration: CRUD widgets and links, icon upload.
 */
(() => {
  const widgetList = document.getElementById('widget-list');
  const btnAddWidget = document.getElementById('btn-add-widget');
  let widgets = [];

  // ======================== Initialization ========================

  const btnToggleAll = document.getElementById('btn-toggle-all');
  const btnExport = document.getElementById('btn-export');
  const btnImport = document.getElementById('btn-import');
  const importFile = document.getElementById('import-file');

  async function init() {
    widgets = await StarsPopupStorage.getWidgets();
    render();
    btnAddWidget.addEventListener('click', addWidget);
    btnToggleAll.addEventListener('click', toggleAll);
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

    updateToggleAllButton();
  }

  function updateToggleAllButton() {
    const allHidden = widgets.length > 0 && widgets.every(w => w.visible === false);
    btnToggleAll.textContent = allHidden ? 'Show All' : 'Hide All';
  }

  function createWidgetCard(widget, index) {
    const card = document.createElement('div');
    card.className = `widget-card${widget.visible === false ? ' widget-card-hidden' : ''}`;
    // Header: icon preview + tooltip input + actions
    const header = document.createElement('div');
    header.className = 'widget-card-header';

    // Icon preview (clickable to upload)
    const iconPreview = document.createElement('div');
    iconPreview.className = 'widget-icon-preview';
    iconPreview.style.backgroundImage = `url(${StarsPopupStorage.sanitizeIcon(widget.icon)})`;
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

    const isVisible = widget.visible !== false;
    const btnToggle = document.createElement('button');
    btnToggle.className = `btn btn-sm ${isVisible ? '' : 'btn-warning'}`;
    btnToggle.textContent = isVisible ? 'Hide' : 'Show';
    btnToggle.addEventListener('click', () => toggleWidget(index));
    actions.appendChild(btnToggle);

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
      const linkItem = createLinkItem(index, linkIndex, link);
      linkItem.draggable = true;
      linkItem.dataset.linkIndex = linkIndex;
      linksContainer.appendChild(linkItem);
    });

    setupDragSort(linksContainer, widget.links, () => { save(); render(); });

    linksSection.appendChild(linksContainer);
    card.appendChild(linksSection);

    return card;
  }

  function createLinkItem(widgetIndex, linkIndex, link) {
    const item = document.createElement('div');
    item.className = 'link-item';

    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '&#x2630;';
    dragHandle.title = 'Drag to reorder';
    item.appendChild(dragHandle);

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

  function renderCard(index) {
    const oldCard = widgetList.children[index];
    const newCard = createWidgetCard(widgets[index], index);
    if (oldCard) {
      widgetList.replaceChild(newCard, oldCard);
    }
  }

  function toggleWidget(index) {
    widgets[index].visible = widgets[index].visible === false ? true : false;
    save();
    renderCard(index);
    updateToggleAllButton();
  }

  function toggleAll() {
    const allHidden = widgets.every(w => w.visible === false);
    const newState = allHidden ? true : false;
    widgets.forEach(w => { w.visible = newState; });
    save();
    render();
  }

  function addWidget() {
    widgets.push({
      id: `w_${Date.now()}`,
      icon: StarsPopupStorage.getDefaultIcon(),
      tooltip: 'New Widget',
      visible: true,
      links: []
    });
    save();
    render();
  }

  function deleteWidget(index) {
    const name = widgets[index].tooltip;
    const input = prompt(`To delete "${name}", please type the widget name to confirm:`);
    if (input === null) return;
    if (input !== name) {
      alert('Name does not match. Deletion cancelled.');
      return;
    }
    widgets.splice(index, 1);
    save();
    render();
  }

  function addLink(widgetIndex) {
    if (!widgets[widgetIndex].links) widgets[widgetIndex].links = [];
    widgets[widgetIndex].links.push({ title: '', url: '' });
    save();
    renderCard(widgetIndex);
  }

  function removeLink(widgetIndex, linkIndex) {
    widgets[widgetIndex].links.splice(linkIndex, 1);
    save();
    renderCard(widgetIndex);
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
        // Validate each widget has required fields with correct types
        for (const w of data.widgets) {
          if (typeof w.id !== 'string' || typeof w.tooltip !== 'string') {
            throw new Error('Invalid widget: id and tooltip must be strings');
          }
          // Sanitize icon: must be a valid image data-URI
          w.icon = StarsPopupStorage.sanitizeIcon(w.icon);
          if (!Array.isArray(w.links)) w.links = [];
          // Sanitize links: filter out entries with non-string fields or unsafe URLs
          w.links = w.links.filter(link =>
            typeof link === 'object' && link !== null &&
            typeof link.title === 'string' &&
            typeof link.url === 'string' &&
            StarsPopupStorage.isSafeUrl(link.url)
          );
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

  // ======================== Drag Sort ========================

  function setupDragSort(container, array, onChange) {
    let dragIndex = null;
    let lastOverTarget = null;

    container.addEventListener('dragstart', (e) => {
      const item = e.target.closest('[draggable="true"]');
      if (!item || item.parentElement !== container) return;
      dragIndex = [...container.children].indexOf(item);
      item.classList.add('drag-active');
      e.dataTransfer.effectAllowed = 'move';
      lastOverTarget = null;
    });

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const target = e.target.closest('[draggable="true"]');
      if (!target || target.parentElement !== container) return;

      const rect = target.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const isTop = e.clientY < midY;

      if (lastOverTarget && lastOverTarget !== target) {
        lastOverTarget.classList.remove('drag-over-top', 'drag-over-bottom');
      }
      lastOverTarget = target;

      target.classList.remove('drag-over-top', 'drag-over-bottom');
      target.classList.add(isTop ? 'drag-over-top' : 'drag-over-bottom');
    });

    container.addEventListener('dragleave', (e) => {
      const target = e.target.closest('[draggable="true"]');
      if (target) target.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      if (lastOverTarget) {
        lastOverTarget.classList.remove('drag-over-top', 'drag-over-bottom');
      }
      const dragItem = dragIndex !== null ? container.children[dragIndex] : null;
      if (dragItem) dragItem.classList.remove('drag-active');

      const target = e.target.closest('[draggable="true"]');
      if (!target || target.parentElement !== container || dragIndex === null) return;

      const rect = target.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      let dropIndex = [...container.children].indexOf(target);
      if (e.clientY >= midY) dropIndex++;
      if (dropIndex > dragIndex) dropIndex--;

      if (dropIndex !== dragIndex && dropIndex >= 0 && dropIndex < array.length) {
        const [moved] = array.splice(dragIndex, 1);
        array.splice(dropIndex, 0, moved);
        onChange();
      }
      dragIndex = null;
      lastOverTarget = null;
    });

    container.addEventListener('dragend', () => {
      if (lastOverTarget) {
        lastOverTarget.classList.remove('drag-over-top', 'drag-over-bottom');
      }
      const dragItem = dragIndex !== null ? container.children[dragIndex] : null;
      if (dragItem) dragItem.classList.remove('drag-active');
      dragIndex = null;
      lastOverTarget = null;
    });
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
