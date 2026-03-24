# Stars Popup

A Chromium browser extension (Chrome / Edge) that adds draggable floating widgets to every page, giving you quick access to your favorite websites.

## Features

- **Floating Widgets** — Small draggable icons that float over any web page, stay fixed during scrolling
- **Quick-Access Panels** — Click a widget to expand a panel with your bookmarked links; click a link to open it in a new tab
- **Multi-Widget Support** — Create multiple widgets, each with its own icon, tooltip, and link list
- **Custom Icons** — Upload custom images for each widget (auto-resized to 40x40, size-limited for performance)
- **Drag & Persist** — Drag widgets anywhere on the page; position is saved and restored across page loads
- **Export / Import** — One-click export configuration to JSON; import to restore or share across browsers
- **Live Reload** — Changes in the settings page take effect immediately on all open tabs without refreshing

## Project Structure

```
stars-popup/
├── manifest.json                 # Extension manifest (Manifest V3)
├── icons/                        # Extension toolbar icons (16/48/128px)
├── background/
│   └── service-worker.js         # Init default config, open settings, hot-reload notifications
├── lib/
│   └── storage.js                # Storage abstraction (chrome.storage.sync / local)
├── content/
│   ├── content.js                # Widget rendering, drag, panel interaction (Shadow DOM)
│   └── content.css               # Widget and panel styles (isolated in Shadow DOM)
├── options/
│   ├── options.html              # Settings page entry
│   ├── options.js                # Widget/link CRUD, icon upload, export/import
│   └── options.css               # Settings page styles
└── context/
    └── history/                  # Development plan history
```

## Installation (Development)

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd stars-popup
   ```

2. Open your browser's extension management page:
   - **Edge**: `edge://extensions/`
   - **Chrome**: `chrome://extensions/`

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **Load unpacked** and select the `stars-popup` directory

5. The extension is now active. Open any web page to see the default widget in the bottom-right corner.

## Usage

| Action | Result |
|---|---|
| Hover over a widget | Shows the tooltip (memo text) |
| Click a widget | Opens / closes the link panel |
| Drag a widget | Moves it to any position (saved automatically) |
| Click the extension toolbar icon | Opens the settings page |
| Settings: + Add Widget | Creates a new widget with default star icon |
| Settings: Click icon circle | Upload a custom icon image |
| Settings: + Add Link | Adds a new link entry to a widget |
| Settings: Export Config | Downloads current config as JSON |
| Settings: Import Config | Loads config from a JSON file |

## Build / Package

The extension uses no build tools — all source files are directly loadable. To create a distributable `.zip`:

```bash
# From the project root directory
zip -r stars-popup-v1.0.0.zip \
  manifest.json \
  icons/ \
  background/ \
  lib/ \
  content/ \
  options/ \
  -x "*.DS_Store"
```

The resulting `stars-popup-v1.0.0.zip` can be:
- Uploaded to the [Chrome Web Store](https://chrome.google.com/webstore/devconsole) or [Edge Add-ons](https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview)
- Shared directly and loaded via **Load unpacked** after unzipping

## Tech Stack

- **Manifest V3** — Latest Chrome extension standard
- **Vanilla JS / CSS** — No frameworks, no build step
- **Shadow DOM (closed)** — Isolates widget styles from host page
- **chrome.storage.sync** — Widget config synced across devices
- **chrome.storage.local** — Widget positions stored per device
- **Pointer Events** — Reliable cross-browser drag handling

## Browser Compatibility

- Google Chrome 88+
- Microsoft Edge 88+
- Any Chromium-based browser supporting Manifest V3

## License

GPL-3.0
