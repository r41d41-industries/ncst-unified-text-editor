const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  newFile: () => ipcRenderer.invoke("file:new"),
  openFile: () => ipcRenderer.invoke("file:open"),
  openPath: (filePath) => ipcRenderer.invoke("file:openPath", filePath),
  saveFile: (content, suggestedName) => ipcRenderer.invoke("file:save", content, suggestedName),
  saveFileAs: (content, suggestedName) => ipcRenderer.invoke("file:saveAs", content, suggestedName),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: (partial) => ipcRenderer.invoke("settings:set", partial),
  openSettings: () => ipcRenderer.invoke("settings:open"),
  openInEditor: (filePath) => ipcRenderer.invoke("host:open-in-editor", filePath),
  onSettingsChanged: (cb) => {
    ipcRenderer.on("settings:changed", (_e, data) => cb(data));
  },
  onOpenPath: (cb) => {
    ipcRenderer.on("host:open-path", (_e, filePath) => cb(filePath));
  },
  formatDateTime: (kind) => ipcRenderer.invoke("datetime:format", kind),
  addToDictionary: (word) => ipcRenderer.invoke("dict:add", word),
  ignoreWord: (word) => ipcRenderer.invoke("dict:ignore", word),
  confirmUnsaved: () => ipcRenderer.invoke("doc:confirm"),
  setDirty: (dirty, title) => ipcRenderer.invoke("doc:state", { dirty, title }),
  allowClose: () => ipcRenderer.invoke("host:allow-close"),
  onSpellContext: (cb) => {
    ipcRenderer.on("spell:context", (_e, data) => cb(data));
  },
  onRequestClose: (cb) => {
    ipcRenderer.on("doc:close-check", () => cb());
  },
  onSaveThenQuit: (cb) => {
    ipcRenderer.on("doc:save-then-quit", () => cb());
  },
});
