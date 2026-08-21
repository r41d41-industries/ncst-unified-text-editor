# NCST Unified Text Editor

Electron markdown/text editor for local `.md` and `.txt` files. Standalone app, with a reusable `editor/` module other Electron apps can load.

## Features

- New, open, edit, save, save as (`.md` or `.txt`)
- Toggle formatting bar
- Right-click format menu, date/time insert, and spell suggestions
- Collapsible left drawer with icon links and Options
- Obsidian-style markdown subset (GFM, wikilinks, callouts, YAML frontmatter, `#tags`)
- Three views: **Source** (raw markdown), **Live** (edit inside formatted lists/tables), **Reading** (HTML)
- Live Preview: Enter continues a list or starts a new paragraph; Shift+Enter is a soft line break (same list item, tight spacing)
- Line gutter: current heading/paragraph chip; click to set Paragraph or Heading 1–6
- Options → **Customize formatting bar** to show/hide and reorder toolbar buttons
- Live Preview: Tab / Shift+Tab indent or outdent lists; type in table cells
- Custom spellcheck dictionary (add / ignore)
- `.txt` files stay Source / Reading (no Live)

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

View shortcuts: **Ctrl+E** cycles Source → Live → Reading. Drawer **Live** / **Reading** buttons toggle that mode off back to Source.

**Enter vs Shift+Enter (Live):** Enter at the end of a paragraph starts a new paragraph (full gap). Enter in a list starts the next item. **Shift+Enter** (or Ctrl+Enter) inserts a hard line break — tight spacing, and in a list it continues the same item with indent instead of making a new bullet/number. In Source, Shift+Enter writes a markdown hard break (`  ` + newline).
