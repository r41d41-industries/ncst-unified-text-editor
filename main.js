const { app, BrowserWindow, ipcMain, dialog, clipboard } = require("electron");
const path = require("path");
const { loadSettings, saveSettings, pushRecent } = require("./lib/settings");
const { formatDateTime } = require("./lib/datetime");
const { loadWords, addWord, applyToSession } = require("./lib/dictionary");
const files = require("./lib/files");

let mainWindow = null;
let currentPath = null;
let dirty = false;
let allowClose = false;
const ignoredWords = new Set();

function userData() {
  return app.getPath("userData");
}

function getSettings() {
  return loadSettings(userData());
}

function titleFrom(filePath, isDirty) {
  const name = filePath ? path.basename(filePath) : "Untitled";
  return `${isDirty ? "• " : ""}${name} — NCST Unified Text Editor`;
}

function applyTitle(partial) {
  if (!mainWindow) return;
  mainWindow.setTitle(partial || titleFrom(currentPath, dirty));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    title: "NCST Unified Text Editor",
    backgroundColor: "#ffffff",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  const session = mainWindow.webContents.session;
  try {
    session.setSpellCheckerLanguages(["en-US"]);
  } catch {
    /* language pack may be missing offline */
  }
  applyToSession(session, loadWords(userData()));

  mainWindow.loadFile(path.join(__dirname, "editor", "index.html"));

  mainWindow.webContents.on("context-menu", (_event, params) => {
    const word = params.misspelledWord || "";
    if (word && ignoredWords.has(word.toLowerCase())) {
      mainWindow.webContents.send("spell:context", {
        misspelledWord: "",
        dictionarySuggestions: [],
        x: params.x,
        y: params.y,
        isEditable: !!params.isEditable,
      });
      return;
    }
    mainWindow.webContents.send("spell:context", {
      misspelledWord: word,
      dictionarySuggestions: params.dictionarySuggestions || [],
      x: params.x,
      y: params.y,
      selectionText: params.selectionText || "",
      isEditable: !!params.isEditable,
    });
  });

  mainWindow.on("close", (e) => {
    if (allowClose || !dirty) return;
    e.preventDefault();
    mainWindow.webContents.send("doc:close-check");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function filePayload(result) {
  if (!result) return { canceled: true };
  currentPath = result.path || null;
  dirty = false;
  applyTitle();
  let settings = getSettings();
  if (result.path) {
    settings = saveSettings(userData(), pushRecent(settings, result.path));
  }
  return {
    canceled: false,
    path: result.path || null,
    content: result.content == null ? "" : String(result.content),
    kind: result.kind || files.kindFromPath(result.path),
    recentFiles: settings.recentFiles,
  };
}

ipcMain.handle("file:new", () => {
  currentPath = null;
  dirty = false;
  applyTitle();
  return { canceled: false, cleared: true, path: null, content: "", kind: "markdown" };
});

ipcMain.handle("file:open", async () => {
  const result = await files.openDialog(mainWindow);
  return filePayload(result);
});

ipcMain.handle("file:openPath", async (_e, filePath) => {
  try {
    return filePayload(files.readFile(String(filePath)));
  } catch (err) {
    return { canceled: true, error: String(err.message || err) };
  }
});

ipcMain.handle("file:save", async (_e, content, suggestedName) => {
  if (!currentPath) {
    const defaultPath = files.suggestedSavePath(null, suggestedName, "markdown");
    const result = await files.saveDialog(mainWindow, content, defaultPath);
    return filePayload(result ? { ...result, content } : null);
  }
  const result = files.writeFile(currentPath, content);
  return filePayload({ ...result, content });
});

ipcMain.handle("file:saveAs", async (_e, content, suggestedName) => {
  const defaultPath = files.suggestedSavePath(currentPath, suggestedName, files.kindFromPath(currentPath));
  const result = await files.saveDialog(mainWindow, content, defaultPath);
  return filePayload(result ? { ...result, content } : null);
});

ipcMain.handle("settings:get", () => getSettings());

ipcMain.handle("settings:set", (_e, partial) => {
  const current = getSettings();
  return saveSettings(userData(), { ...current, ...(partial || {}) });
});

ipcMain.handle("datetime:format", (_e, kind) => formatDateTime(kind, getSettings()));

ipcMain.handle("dict:add", (_e, word) => {
  const words = addWord(userData(), word);
  if (mainWindow) applyToSession(mainWindow.webContents.session, [word]);
  return { ok: true, words };
});

ipcMain.handle("dict:ignore", (_e, word) => {
  ignoredWords.add(String(word || "").toLowerCase());
  return { ok: true };
});

ipcMain.handle("doc:confirm", async () => {
  const res = await dialog.showMessageBox(mainWindow, {
    type: "question",
    buttons: ["Save", "Don't Save", "Cancel"],
    defaultId: 0,
    cancelId: 2,
    title: "Unsaved changes",
    message: "Save changes before continuing?",
  });
  return ["save", "discard", "cancel"][res.response];
});

ipcMain.handle("doc:state", (_e, payload) => {
  dirty = !!(payload && payload.dirty);
  if (payload && payload.title) applyTitle(payload.title + " — NCST Unified Text Editor");
  else applyTitle();
});

ipcMain.handle("host:allow-close", () => {
  allowClose = true;
  if (mainWindow) mainWindow.close();
  return { ok: true };
});

ipcMain.handle("copy-text", (_e, text) => {
  clipboard.writeText(String(text || ""));
  return { ok: true };
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
