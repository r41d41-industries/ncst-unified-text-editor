(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NcstTools = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  function svg(inner) {
    return (
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      inner +
      "</svg>"
    );
  }

  const ICONS = {
    bold: svg('<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z"/><path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z"/>'),
    italic: svg('<path d="M10 5h8"/><path d="M6 19h8"/><path d="M14 5l-4 14"/>'),
    strike: svg('<path d="M6 12h12"/><path d="M16 7.5A4 4 0 0 0 9 8"/><path d="M8 16.5A4 4 0 0 0 15 16"/>'),
    paragraph: svg('<path d="M13 5v14"/><path d="M17 5v14"/><path d="M13 5h5"/><path d="M13 5a4 4 0 1 0 0 8"/>'),
    h1: svg('<path d="M5 7v10"/><path d="M13 7v10"/><path d="M5 12h8"/><path d="M17 19v-7l-2 2"/>'),
    h2: svg('<path d="M4 7v10"/><path d="M11 7v10"/><path d="M4 12h7"/><path d="M15 12c1.5 0 3 1 3 2.5S17 17 15 17h4"/>'),
    h3: svg('<path d="M4 7v10"/><path d="M11 7v10"/><path d="M4 12h7"/><path d="M15 10h4l-3 3h2a2 2 0 1 1-2 2"/>'),
    h4: svg('<path d="M4 7v10"/><path d="M11 7v10"/><path d="M4 12h7"/><path d="M20 17V9l-4 6h5"/>'),
    h5: svg('<path d="M4 7v10"/><path d="M11 7v10"/><path d="M4 12h7"/><path d="M19 10h-4v3h3a2 2 0 1 1 0 4h-3"/>'),
    h6: svg('<path d="M4 7v10"/><path d="M11 7v10"/><path d="M4 12h7"/><circle cx="18" cy="16" r="2.5"/><path d="M20 11c-2-1-4 0-4 2"/>'),
    heading: svg('<path d="M6 5v14"/><path d="M18 5v14"/><path d="M6 12h12"/>'),
    ul: svg('<circle cx="6" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="6" cy="17" r="1.2" fill="currentColor" stroke="none"/><path d="M10 7h9"/><path d="M10 12h9"/><path d="M10 17h9"/>'),
    task: svg('<rect x="4" y="4" width="6" height="6" rx="1"/><path d="M5.5 7l1.5 1.5L10 6"/><path d="M13 7h7"/><path d="M13 12h7"/><path d="M13 17h7"/><path d="M4 13h6"/><path d="M4 18h6"/>'),
    quote: svg('<path d="M8 11a3 3 0 0 0-3 3v3h4v-3H7a2 2 0 0 1 2-2v-1z"/><path d="M16 11a3 3 0 0 0-3 3v3h4v-3h-2a2 2 0 0 1 2-2v-1z"/>'),
    code: svg('<path d="M9 8l-4 4 4 4"/><path d="M15 8l4 4-4 4"/>'),
    link: svg('<path d="M10 13a5 5 0 0 0 7.5.5l1.5-1.5a5 5 0 0 0-7-7L11 6"/><path d="M14 11a5 5 0 0 0-7.5-.5L5 12a5 5 0 0 0 7 7l1-1"/>'),
    table: svg('<rect x="4" y="5" width="16" height="14" rx="1"/><path d="M4 10h16"/><path d="M4 15h16"/><path d="M10 5v14"/>'),
    hr: svg('<path d="M5 12h14"/>'),
    divider: svg('<path d="M12 5v14"/>'),
    group: svg('<rect x="4" y="6" width="7" height="12" rx="1"/><rect x="13" y="6" width="7" height="12" rx="1"/>'),
    dropdown: svg('<rect x="4" y="6" width="16" height="12" rx="1"/><path d="M8 12h5"/><path d="M16 10.5l2 2-2 2"/>'),
    chevron: svg('<path d="M7 10l5 5 5-5"/>'),
    fileNew: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>'),
    fileOpen: svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    save: svg('<path d="M5 5h11l3 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M8 5v5h8V5"/><path d="M8 19v-6h8v6"/>'),
    saveAs: svg('<path d="M5 5h11l3 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M9 15h6"/><path d="M12 12v6"/>'),
    live: svg('<path d="M4 12h3l2-6 4 12 2-6h5"/>'),
    reading: svg('<path d="M2 6c4-2 8-2 10 0v14c-2-2-6-2-10 0z"/><path d="M22 6c-4-2-8-2-10 0v14c2-2 6-2 10 0z"/>'),
    options: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3v2"/><path d="M12 19v2"/><path d="M5 6.5l1.7 1"/><path d="M17.3 16.5l1.7 1"/><path d="M3 12h2"/><path d="M19 12h2"/><path d="M5 17.5l1.7-1"/><path d="M17.3 7.5l1.7-1"/>'),
    cut: svg('<path d="M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M8.5 8.5L20 20"/><path d="M8.5 15.5L20 4"/>'),
    copy: svg('<rect x="9" y="9" width="10" height="12" rx="1"/><path d="M5 15V5h10"/>'),
    paste: svg('<path d="M8 5h2a2 2 0 0 1 4 0h2v3H8z"/><rect x="6" y="8" width="12" height="12" rx="1"/>'),
    date: svg('<rect x="4" y="6" width="16" height="14" rx="1"/><path d="M4 10h16"/><path d="M8 4v4"/><path d="M16 4v4"/>'),
    time: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>'),
    datetime: svg('<rect x="3" y="5" width="11" height="10" rx="1"/><path d="M3 9h11"/><circle cx="18" cy="16" r="4"/><path d="M18 14v2l1.5 1"/>'),
    submenu: svg('<path d="M5 7h10"/><path d="M5 12h14"/><path d="M16 12l3 3-3 3"/><path d="M5 17h7"/>'),
  };

  const CATALOG = [
    { id: "bold", label: "Bold" },
    { id: "italic", label: "Italic" },
    { id: "strike", label: "Strikethrough" },
    { id: "paragraph", label: "Paragraph" },
    { id: "h1", label: "Heading 1" },
    { id: "h2", label: "Heading 2" },
    { id: "h3", label: "Heading 3" },
    { id: "h4", label: "Heading 4" },
    { id: "h5", label: "Heading 5" },
    { id: "h6", label: "Heading 6" },
    { id: "heading", label: "Heading" },
    { id: "ul", label: "List" },
    { id: "task", label: "Checklist" },
    { id: "quote", label: "Quote" },
    { id: "code", label: "Code" },
    { id: "link", label: "Link" },
    { id: "table", label: "Table" },
    { id: "hr", label: "Horizontal rule" },
  ].map((t) => ({ ...t, glyph: t.id.replace(/^h/, "H").slice(0, 2).toUpperCase(), icon: ICONS[t.id] || "" }));

  const BY_ID = Object.fromEntries(CATALOG.map((t) => [t.id, t]));
  const ALLOWED = new Set(CATALOG.map((t) => t.id));

  const DEFAULT_ITEMS = ["bold", "italic", "strike", "heading", "ul", "task", "quote", "code", "link", "table", "hr"];

  const DEFAULT_LAYOUT = [
    { t: "tool", id: "bold" },
    { t: "tool", id: "italic" },
    { t: "tool", id: "strike" },
    { t: "divider" },
    {
      t: "dropdown",
      label: "Heading",
      items: ["paragraph", "h1", "h2", "h3", "h4", "h5", "h6"],
    },
    { t: "divider" },
    { t: "group", items: ["ul", "task"] },
    { t: "tool", id: "quote" },
    { t: "divider" },
    { t: "tool", id: "code" },
    { t: "tool", id: "link" },
    { t: "tool", id: "table" },
    { t: "tool", id: "hr" },
  ];

  function cleanIds(ids) {
    const seen = new Set();
    const out = [];
    (ids || []).forEach((id) => {
      if (ALLOWED.has(id) && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    });
    return out;
  }

  function normalizeEntry(entry) {
    if (!entry || typeof entry !== "object") return null;
    if (entry.t === "divider" || entry.type === "divider") return { t: "divider" };
    if (entry.t === "tool" || entry.type === "tool" || entry.id) {
      const id = entry.id;
      if (!ALLOWED.has(id)) return null;
      return { t: "tool", id };
    }
    if (entry.t === "group" || entry.type === "group") {
      const items = cleanIds(entry.items);
      if (!items.length) return null;
      return { t: "group", items };
    }
    if (entry.t === "dropdown" || entry.type === "dropdown") {
      const items = cleanIds(entry.items);
      if (!items.length) return null;
      const label = String(entry.label || (BY_ID[items[0]] && BY_ID[items[0]].label) || "Menu").slice(0, 24);
      return { t: "dropdown", label, items };
    }
    return null;
  }

  function normalizeLayout(layout, fallbackItems) {
    if (Array.isArray(layout) && layout.length) {
      const out = layout.map(normalizeEntry).filter(Boolean);
      if (out.length) return out;
    }
    if (Array.isArray(fallbackItems) && fallbackItems.length) {
      const ids = cleanIds(fallbackItems);
      if (ids.length) return ids.map((id) => ({ t: "tool", id }));
    }
    return DEFAULT_LAYOUT.map((e) => JSON.parse(JSON.stringify(e)));
  }

  function flattenLayout(layout) {
    const ids = [];
    normalizeLayout(layout).forEach((entry) => {
      if (entry.t === "tool") ids.push(entry.id);
      if (entry.t === "group" || entry.t === "dropdown") ids.push(...entry.items);
    });
    return cleanIds(ids);
  }

  function normalizeItems(items) {
    const ids = cleanIds(items);
    return ids.length ? ids : DEFAULT_ITEMS.slice();
  }

  const COMMANDS = {
    new: { label: "New", icon: "fileNew", kind: "file" },
    open: { label: "Open", icon: "fileOpen", kind: "file" },
    save: { label: "Save", icon: "save", kind: "file" },
    saveAs: { label: "Save As", icon: "saveAs", kind: "file" },
    live: { label: "Live", icon: "live", kind: "view" },
    reading: { label: "Reading", icon: "reading", kind: "view" },
    options: { label: "Options", icon: "options", kind: "view" },
    "edit:cut": { label: "Cut", icon: "cut", kind: "edit" },
    "edit:copy": { label: "Copy", icon: "copy", kind: "edit" },
    "edit:paste": { label: "Paste", icon: "paste", kind: "edit" },
    "dt:date": { label: "Insert date", icon: "date", kind: "insert" },
    "dt:time": { label: "Insert time", icon: "time", kind: "insert" },
    "dt:combined": { label: "Insert date and time", icon: "datetime", kind: "insert" },
  };
  CATALOG.forEach((t) => {
    COMMANDS[t.id] = { label: t.label, icon: t.id, kind: "format" };
  });
  const COMMAND_IDS = new Set(Object.keys(COMMANDS));

  const DEFAULT_DRAWER_LAYOUT = [
    { t: "tool", id: "new" },
    { t: "tool", id: "open" },
    { t: "tool", id: "save" },
    { t: "tool", id: "saveAs" },
    { t: "divider" },
    { t: "tool", id: "live" },
    { t: "tool", id: "reading" },
    { t: "tool", id: "options" },
  ];

  const DEFAULT_CONTEXT_LAYOUT = [
    { t: "tool", id: "edit:cut" },
    { t: "tool", id: "edit:copy" },
    { t: "tool", id: "edit:paste" },
    { t: "divider" },
    { t: "dropdown", label: "Format", items: ["bold", "italic", "strike", "heading", "ul", "task", "quote", "code", "link", "table", "hr"] },
    { t: "divider" },
    { t: "tool", id: "dt:date" },
    { t: "tool", id: "dt:time" },
    { t: "tool", id: "dt:combined" },
  ];

  const ICON_KEYS = Object.keys(ICONS);

  function commandLabel(id) {
    return (COMMANDS[id] && COMMANDS[id].label) || id;
  }

  function defaultIconKey(id) {
    return (COMMANDS[id] && COMMANDS[id].icon) || id;
  }

  function iconSvg(key) {
    return ICONS[key] || ICONS.heading;
  }

  function resolveIcon(id, iconMap) {
    const key = (iconMap && iconMap[id] && ICONS[iconMap[id]] && iconMap[id]) || defaultIconKey(id);
    return { key, svg: iconSvg(key) };
  }

  function normalizeIconMap(map) {
    const out = {};
    if (!map || typeof map !== "object") return out;
    Object.keys(map).forEach((id) => {
      if (ICONS[map[id]]) out[id] = map[id];
    });
    return out;
  }

  function cleanIdsIn(ids, allowed) {
    const seen = new Set();
    const out = [];
    (ids || []).forEach((id) => {
      if (allowed.has(id) && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    });
    return out;
  }

  function normalizeLayoutWith(layout, fallbackItems, allowed, defaultLayout) {
    function entryOf(raw) {
      if (!raw || typeof raw !== "object") return null;
      if (raw.t === "divider" || raw.type === "divider") return { t: "divider" };
      if (raw.t === "group" || raw.type === "group") {
        const items = cleanIdsIn(raw.items, allowed);
        return items.length ? { t: "group", items } : null;
      }
      if (raw.t === "dropdown" || raw.type === "dropdown" || raw.t === "submenu") {
        const items = cleanIdsIn(raw.items, allowed);
        if (!items.length) return null;
        const label = String(raw.label || commandLabel(items[0]) || "Menu").slice(0, 32);
        return { t: "dropdown", label, items };
      }
      const id = raw.id;
      if (!allowed.has(id)) return null;
      return { t: "tool", id };
    }
    if (Array.isArray(layout) && layout.length) {
      const out = layout.map(entryOf).filter(Boolean);
      if (out.length) return out;
    }
    if (Array.isArray(fallbackItems) && fallbackItems.length) {
      const ids = cleanIdsIn(fallbackItems, allowed);
      if (ids.length) return ids.map((id) => ({ t: "tool", id }));
    }
    return (defaultLayout || []).map((e) => JSON.parse(JSON.stringify(e)));
  }

  function flattenLayoutWith(layout, allowed, defaultLayout) {
    const ids = [];
    normalizeLayoutWith(layout, null, allowed, defaultLayout).forEach((entry) => {
      if (entry.t === "tool") ids.push(entry.id);
      if (entry.t === "group" || entry.t === "dropdown") ids.push(...entry.items);
    });
    return cleanIdsIn(ids, allowed);
  }

  const DRAWER_ICONS = {
    new: ICONS.fileNew,
    open: ICONS.fileOpen,
    save: ICONS.save,
    saveAs: ICONS.saveAs,
    live: ICONS.live,
    reading: ICONS.reading,
    options: ICONS.options,
  };

  return {
    CATALOG,
    BY_ID,
    ICONS,
    ICON_KEYS,
    DRAWER_ICONS,
    COMMANDS,
    COMMAND_IDS,
    ALLOWED,
    DEFAULT_ITEMS,
    DEFAULT_LAYOUT,
    DEFAULT_DRAWER_LAYOUT,
    DEFAULT_CONTEXT_LAYOUT,
    svg,
    commandLabel,
    defaultIconKey,
    iconSvg,
    resolveIcon,
    normalizeIconMap,
    normalizeItems,
    normalizeLayout,
    normalizeLayoutWith,
    flattenLayout,
    flattenLayoutWith,
    cleanIds,
    cleanIdsIn,
  };
});

