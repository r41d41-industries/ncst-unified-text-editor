const fs = require("fs");
const path = require("path");

const DEFAULTS = {
  drawerOpen: true,
  toolbarVisible: true,
  viewMode: "source",
  preview: false,
  spellcheck: true,
  dateFormat: "MM/DD/YY",
  timeFormat: "h:mm A",
  combinedFormat: "{date} {time}",
  recentFiles: [],
};

function normalizeSettings(data) {
  const incoming = data || {};
  const next = { ...DEFAULTS, ...incoming };
  next.recentFiles = Array.isArray(next.recentFiles) ? next.recentFiles.filter(Boolean).slice(0, 10) : [];
  const rawMode = incoming.viewMode;
  if (rawMode === "source" || rawMode === "live" || rawMode === "reading") {
    next.viewMode = rawMode;
  } else {
    next.viewMode = incoming.preview ? "reading" : "source";
  }
  return next;
}

function settingsPath(userData) {
  return path.join(userData, "settings.json");
}

function loadSettings(userData) {
  try {
    const raw = fs.readFileSync(settingsPath(userData), "utf8");
    const data = JSON.parse(raw);
    return normalizeSettings(data);
  } catch {
    return normalizeSettings({});
  }
}

function saveSettings(userData, settings) {
  const next = normalizeSettings(settings);
  fs.writeFileSync(settingsPath(userData), JSON.stringify(next, null, 2), "utf8");
  return next;
}

function pushRecent(settings, filePath) {
  const next = { ...settings, recentFiles: [...(settings.recentFiles || [])] };
  next.recentFiles = [filePath, ...next.recentFiles.filter((p) => p !== filePath)].slice(0, 10);
  return next;
}

module.exports = { DEFAULTS, normalizeSettings, loadSettings, saveSettings, pushRecent, settingsPath };
