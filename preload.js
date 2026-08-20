const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  newFile: () => ipcRenderer.invoke("file:new"),
  openFile: () => ipcRenderer.invoke("file:open"),
  openPath: (filePath) => ipcRenderer.invoke("file:openPath", filePath),
  saveFile: (content) => ipcRenderer.invoke("file:save", content),
  saveFileAs: (content) => ipcRenderer.invoke("file:saveAs", content),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: (partial) => ipcRenderer.invoke("settings:set", partial),
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
