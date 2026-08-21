(() => {
  const host = window.api;
  if (!host) return;

  const panels = {
    general: document.getElementById("tab-general"),
    toolbar: document.getElementById("tab-toolbar"),
    drawer: document.getElementById("tab-drawer"),
    context: document.getElementById("tab-context"),
    icons: document.getElementById("tab-icons"),
  };
  let tab = "general";
  let settings = null;
  let iconTarget = null;
  const picker = document.getElementById("icon-picker");

  const editors = {};

  function iconMap() {
    return settings && settings.iconMap ? settings.iconMap : {};
  }

  function openPicker(actionId, anchor) {
    iconTarget = actionId;
    picker.innerHTML = "";
    NcstTools.ICON_KEYS.forEach((key) => {
      const b = document.createElement("button");
      b.type = "button";
      b.title = key;
      b.dataset.iconKey = key;
      b.innerHTML = NcstTools.iconSvg(key);
      picker.appendChild(b);
    });
    picker.classList.remove("hidden");
    const r = anchor.getBoundingClientRect();
    picker.style.left = Math.min(r.left, window.innerWidth - 280) + "px";
    picker.style.top = Math.min(r.bottom + 4, window.innerHeight - 280) + "px";
  }

  picker.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-icon-key]");
    if (!btn || !iconTarget) return;
    settings.iconMap = Object.assign({}, iconMap(), { [iconTarget]: btn.dataset.iconKey });
    Object.keys(editors).forEach((k) => {
      editors[k].setIconMap(settings.iconMap);
      editors[k].refreshIcons();
    });
    paintIconTab();
    picker.classList.add("hidden");
    iconTarget = null;
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".icon-picker") && !e.target.closest(".icon-pick") && !e.target.closest("[data-icon-for]")) {
      picker.classList.add("hidden");
    }
  });

  function onIconPick(id, anchor) {
    openPicker(id, anchor);
  }

  editors.toolbar = NcstCustomize.createListEditor(document.getElementById("list-toolbar"), {
    allowed: NcstTools.ALLOWED,
    unusedIds: NcstTools.CATALOG.map((t) => t.id),
    allowGroup: true,
    allowDropdown: true,
    iconMap: {},
    onIconPick,
  });
  editors.drawer = NcstCustomize.createListEditor(document.getElementById("list-drawer"), {
    allowed: NcstTools.COMMAND_IDS,
    unusedIds: [...NcstTools.COMMAND_IDS],
    allowGroup: false,
    allowDropdown: false,
    iconMap: {},
    onIconPick,
  });
  editors.context = NcstCustomize.createListEditor(document.getElementById("list-context"), {
    allowed: NcstTools.COMMAND_IDS,
    unusedIds: [...NcstTools.COMMAND_IDS],
    allowGroup: false,
    allowDropdown: true,
    iconMap: {},
    onIconPick,
  });

  function showTab(name) {
    tab = name;
    document.querySelectorAll(".settings-tabs .tab").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === name);
    });
    Object.keys(panels).forEach((key) => {
      panels[key].classList.toggle("hidden", key !== name);
    });
  }

  document.querySelector(".settings-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab]");
    if (btn) showTab(btn.dataset.tab);
  });

  document.querySelectorAll("[data-for]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ed = editors[btn.getAttribute("data-for")];
      const act = btn.getAttribute("data-act");
      if (!ed) return;
      if (act === "divider") ed.addDivider();
      if (act === "group") ed.wrap("group");
      if (act === "dropdown") ed.wrap("dropdown");
    });
  });

  function loadGeneral(s) {
    document.getElementById("opt-toolbar").checked = s.toolbarVisible !== false;
    document.getElementById("opt-spell").checked = s.spellcheck !== false;
    document.getElementById("opt-date").value = s.dateFormat || "MM/DD/YY";
    document.getElementById("opt-time").value = s.timeFormat || "h:mm A";
    document.getElementById("opt-combined").value = s.combinedFormat || "{date} {time}";
    const recent = document.getElementById("recent-files");
    recent.innerHTML = "";
    (s.recentFiles || []).forEach((p) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = p.split(/[/\\]/).pop();
      b.title = p;
      b.addEventListener("click", () => host.openInEditor(p));
      li.appendChild(b);
      recent.appendChild(li);
    });
    if (!(s.recentFiles || []).length) {
      const li = document.createElement("li");
      li.textContent = "None yet";
      li.style.color = "#5c5c5c";
      recent.appendChild(li);
    }
  }

  function paintIconTab() {
    const list = document.getElementById("icon-assign-list");
    list.innerHTML = "";
    const ids = new Set([
      ...NcstTools.flattenLayout(settings.toolbarLayout),
      ...NcstTools.flattenLayoutWith(settings.drawerLayout, NcstTools.COMMAND_IDS, NcstTools.DEFAULT_DRAWER_LAYOUT),
      ...NcstTools.flattenLayoutWith(settings.contextLayout, NcstTools.COMMAND_IDS, NcstTools.DEFAULT_CONTEXT_LAYOUT),
    ]);
    [...ids].sort().forEach((id) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "icon-pick";
      btn.dataset.iconFor = id;
      btn.innerHTML = NcstTools.resolveIcon(id, iconMap()).svg;
      const span = document.createElement("span");
      span.className = "tool-label";
      span.textContent = NcstTools.commandLabel(id);
      li.appendChild(btn);
      li.appendChild(span);
      list.appendChild(li);
    });
  }

  function applyLoaded(s) {
    settings = s;
    loadGeneral(s);
    Object.keys(editors).forEach((k) => editors[k].setIconMap(s.iconMap || {}));
    editors.toolbar.paint(s.toolbarLayout);
    editors.drawer.paint(s.drawerLayout);
    editors.context.paint(s.contextLayout);
    paintIconTab();
  }

  function collectGeneral() {
    return {
      toolbarVisible: document.getElementById("opt-toolbar").checked,
      spellcheck: document.getElementById("opt-spell").checked,
      dateFormat: document.getElementById("opt-date").value.trim() || "MM/DD/YY",
      timeFormat: document.getElementById("opt-time").value.trim() || "h:mm A",
      combinedFormat: document.getElementById("opt-combined").value.trim() || "{date} {time}",
    };
  }

  document.getElementById("settings-save").addEventListener("click", () => {
    const partial = Object.assign(collectGeneral(), {
      toolbarLayout: editors.toolbar.collect(),
      drawerLayout: editors.drawer.collect(),
      contextLayout: editors.context.collect(),
      iconMap: settings.iconMap || {},
    });
    host.setSettings(partial).then((next) => {
      applyLoaded(next);
    });
  });

  document.getElementById("settings-reset").addEventListener("click", () => {
    if (tab === "toolbar") editors.toolbar.paint(NcstTools.DEFAULT_LAYOUT);
    else if (tab === "drawer") editors.drawer.paint(NcstTools.DEFAULT_DRAWER_LAYOUT);
    else if (tab === "context") editors.context.paint(NcstTools.DEFAULT_CONTEXT_LAYOUT);
    else if (tab === "icons") {
      settings.iconMap = {};
      Object.keys(editors).forEach((k) => {
        editors[k].setIconMap({});
        editors[k].refreshIcons();
      });
      paintIconTab();
    } else {
      loadGeneral({
        toolbarVisible: true,
        spellcheck: true,
        dateFormat: "MM/DD/YY",
        timeFormat: "h:mm A",
        combinedFormat: "{date} {time}",
        recentFiles: settings.recentFiles || [],
      });
    }
  });

  document.getElementById("icon-assign-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-icon-for]");
    if (btn) openPicker(btn.getAttribute("data-icon-for"), btn);
  });

  host.getSettings().then(applyLoaded);
  if (host.onSettingsChanged) host.onSettingsChanged(applyLoaded);
})();
