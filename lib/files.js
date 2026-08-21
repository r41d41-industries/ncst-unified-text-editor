const fs = require("fs");
const path = require("path");
const { dialog } = require("electron");

const FILTERS = [
  { name: "Markdown", extensions: ["md"] },
  { name: "Text", extensions: ["txt"] },
  { name: "Markdown and text", extensions: ["md", "txt"] },
  { name: "All Files", extensions: ["*"] },
];

function safeStem(name) {
  let s = String(name == null ? "" : name).trim();
  s = s.replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ").replace(/\s+/g, " ").replace(/[. ]+$/g, "");
  return s || "Untitled";
}

function suggestedSavePath(currentPath, title, kind) {
  let name = safeStem(title);
  if (!/\.(md|txt|markdown)$/i.test(name)) {
    const ext = currentPath ? path.extname(currentPath) : kind === "text" ? ".txt" : ".md";
    name += ext || ".md";
  }
  if (currentPath) return path.join(path.dirname(currentPath), name);
  return name;
}

function kindFromPath(filePath) {
  if (!filePath) return "markdown";
  return path.extname(filePath).toLowerCase() === ".txt" ? "text" : "markdown";
}

function readFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return { path: filePath, content, kind: kindFromPath(filePath) };
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content == null ? "" : String(content), "utf8");
  return { path: filePath, kind: kindFromPath(filePath) };
}

async function openDialog(win) {
  const res = await dialog.showOpenDialog(win, {
    title: "Open",
    properties: ["openFile"],
    filters: FILTERS,
  });
  if (res.canceled || !res.filePaths[0]) return null;
  return readFile(res.filePaths[0]);
}

async function saveDialog(win, content, defaultPath) {
  const res = await dialog.showSaveDialog(win, {
    title: "Save As",
    defaultPath: defaultPath || "untitled.md",
    filters: FILTERS,
  });
  if (res.canceled || !res.filePath) return null;
  return writeFile(res.filePath, content);
}

module.exports = {
  FILTERS,
  kindFromPath,
  readFile,
  writeFile,
  openDialog,
  saveDialog,
  safeStem,
  suggestedSavePath,
};
