const fs = require("fs");
const path = require("path");
const tools = require("../editor/tools");

const DEFAULT_TOOLBAR_ITEMS = tools.DEFAULT_ITEMS.slice();
const ALLOWED_TOOLBAR_ITEMS = tools.ALLOWED;

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
  toolbarLayout: tools.DEFAULT_LAYOUT.map((e) => JSON.parse(JSON.stringify(e))),
  drawerLayout: tools.DEFAULT_DRAWER_LAYOUT.map((e) => JSON.parse(JSON.stringify(e))),
  contextLayout: tools.DEFAULT_CONTEXT_LAYOUT.map((e) => JSON.parse(JSON.stringify(e))),
  iconMap: {},
};

function normalizeSettings(data) {
  const incoming = data || {};
  const next = { ...DEFAULTS, ...incoming };
  next.recentFiles = Array.isArray(next.recentFiles) ? next.recentFiles.filter(Boolean).slice(0, 10) : [];
  next.toolbarLayout = tools.normalizeLayout(incoming.toolbarLayout, incoming.toolbarItems);
  next.toolbarItems = tools.flattenLayout(next.toolbarLayout);
  next.drawerLayout = tools.normalizeLayoutWith(
    incoming.drawerLayout,
    null,
    tools.COMMAND_IDS,
    tools.DEFAULT_DRAWER_LAYOUT
  );
  next.contextLayout = tools.normalizeLayoutWith(
    incoming.contextLayout,
    null,
    tools.COMMAND_IDS,
    tools.DEFAULT_CONTEXT_LAYOUT
  );
  next.iconMap = tools.normalizeIconMap(incoming.iconMap);
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
