const fs = require("fs");
const path = require("path");

const DEFAULT_TOOLBAR_ITEMS = [
  "bold",
  "italic",
  "strike",
  "heading",
  "ul",
  "task",
  "quote",
  "code",
  "link",
  "table",
  "hr",
];

const ALLOWED_TOOLBAR_ITEMS = new Set([
  ...DEFAULT_TOOLBAR_ITEMS,
  "paragraph",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
]);

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
  toolbarItems: DEFAULT_TOOLBAR_ITEMS.slice(),
};

function normalizeSettings(data) {
  const incoming = data || {};
  const next = { ...DEFAULTS, ...incoming };
  next.recentFiles = Array.isArray(next.recentFiles) ? next.recentFiles.filter(Boolean).slice(0, 10) : [];
  const toolbarSeen = new Set();
  const toolbarItems = [];
  (Array.isArray(incoming.toolbarItems) ? incoming.toolbarItems : DEFAULT_TOOLBAR_ITEMS).forEach((id) => {
    if (ALLOWED_TOOLBAR_ITEMS.has(id) && !toolbarSeen.has(id)) {
      toolbarSeen.add(id);
      toolbarItems.push(id);
    }
  });
  next.toolbarItems = toolbarItems.length ? toolbarItems : DEFAULT_TOOLBAR_ITEMS.slice();
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

module.exports = {
  DEFAULTS,
  DEFAULT_TOOLBAR_ITEMS,
  ALLOWED_TOOLBAR_ITEMS,
  normalizeSettings,
  loadSettings,
  saveSettings,
  pushRecent,
  settingsPath,
};
