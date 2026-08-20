const fs = require("fs");
const path = require("path");

const DEFAULTS = {
  drawerOpen: true,
  toolbarVisible: true,
  preview: false,
  spellcheck: true,
  dateFormat: "MM/DD/YY",
  timeFormat: "h:mm A",
  combinedFormat: "{date} {time}",
  recentFiles: [],
};

function settingsPath(userData) {
  return path.join(userData, "settings.json");
}

function loadSettings(userData) {
  try {
    const raw = fs.readFileSync(settingsPath(userData), "utf8");
    const data = JSON.parse(raw);
    return { ...DEFAULTS, ...data, recentFiles: Array.isArray(data.recentFiles) ? data.recentFiles : [] };
  } catch {
    return { ...DEFAULTS, recentFiles: [] };
  }
}

function saveSettings(userData, settings) {
  const next = { ...DEFAULTS, ...settings };
  if (!Array.isArray(next.recentFiles)) next.recentFiles = [];
  next.recentFiles = next.recentFiles.filter(Boolean).slice(0, 10);
  fs.writeFileSync(settingsPath(userData), JSON.stringify(next, null, 2), "utf8");
  return next;
}

function pushRecent(settings, filePath) {
  const next = { ...settings, recentFiles: [...(settings.recentFiles || [])] };
  next.recentFiles = [filePath, ...next.recentFiles.filter((p) => p !== filePath)].slice(0, 10);
  return next;
}

module.exports = { DEFAULTS, loadSettings, saveSettings, pushRecent, settingsPath };
