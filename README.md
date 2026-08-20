# NCST Unified Text Editor

Electron markdown/text editor for local `.md` and `.txt` files. Standalone app, with a reusable `editor/` module other Electron apps can load.

## Features

- New, open, edit, save, save as (`.md` or `.txt`)
- Toggle formatting bar
- Right-click format menu, date/time insert, and spell suggestions
- Collapsible left drawer with icon links and Options
- Obsidian-style markdown subset (GFM, wikilinks, callouts, YAML frontmatter, `#tags`)
- Edit / Preview toggle (markdown → HTML; `.txt` is escaped plain text)
- Custom spellcheck dictionary (add / ignore)

## Setup

```powershell
npm install
```

## Run

```powershell
.\scripts\launch.ps1
```

No leftover CMD: `scripts\launch-hidden.vbs`.

Desktop shortcut:

```powershell
.\scripts\install-desktop-shortcut.ps1
```

## Tests

```powershell
npm test
```

## Embed in another Electron app

Copy the `editor/` folder and expose the same host API from your preload (see `editor/README.md` and `preload.js`). Load `editor/index.html` in a `BrowserWindow` with `contextIsolation` and a matching preload.

## Settings

Stored in Electron `userData` (`settings.json`, `custom-dictionary.json`). Date insert default is `MM/DD/YY`; time `h:mm A`; combined `{date} {time}`.
