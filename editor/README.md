# Editor module

Reusable renderer for NCST Unified Text Editor. The shell (`main.js` / `preload.js`) is the host. Other Electron apps can copy this folder and implement `window.api`.

## Load

`BrowserWindow` → `loadFile(.../editor/index.html)` with `contextIsolation: true` and a preload that exposes `window.api`.

Scripts expect `../node_modules/markdown-it/dist/markdown-it.min.js` relative to `editor/`.

## `window.api` contract

| Method | Returns |
| --- | --- |
| `newFile()` | `{ canceled, cleared?, path, content, kind }` |
| `openFile()` | same, from a file dialog |
| `openPath(path)` | same, or `{ canceled, error }` |
| `saveFile(content)` | saved payload (`save` or `save as` if no path) |
| `saveFileAs(content)` | saved payload |
| `getSettings()` | settings object |
| `setSettings(partial)` | merged settings |
| `formatDateTime(kind)` | string (`date` \| `time` \| `combined`) |
| `addToDictionary(word)` | `{ ok, words }` |
| `ignoreWord(word)` | `{ ok }` |
| `confirmUnsaved()` | `"save"` \| `"discard"` \| `"cancel"` |
| `setDirty(dirty, title)` | void |
| `allowClose()` | void |

Events (register a callback):

- `onSpellContext({ misspelledWord, dictionarySuggestions, x, y, isEditable })`
- `onRequestClose()`
- `onSaveThenQuit()`

## Colors

- Window `#ffffff`
- Menus / drawer / toolbar `#f3f3f3`
- Accent `#f7921e`
