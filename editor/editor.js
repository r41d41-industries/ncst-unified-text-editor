(() => {
  const editor = document.getElementById("editor");
  const preview = document.getElementById("preview");
  const liveEl = document.getElementById("live");
  const compose = document.getElementById("compose");
  const gutter = document.getElementById("gutter");
  const gutterMarks = document.getElementById("gutter-marks");
  const headingMenu = document.getElementById("heading-menu");
  const toolbarModal = document.getElementById("toolbar-modal");
  const toolbarToolList = document.getElementById("toolbar-tool-list");
  const drawer = document.getElementById("drawer");
  const drawerToggle = document.getElementById("drawer-toggle");
  const toolbar = document.getElementById("toolbar");
  const optionsPanel = document.getElementById("options-panel");
  const btnLive = document.getElementById("btn-live");
  const btnPreview = document.getElementById("btn-preview");
  const btnOptions = document.getElementById("btn-options");
  const optToolbar = document.getElementById("opt-toolbar");
  const optCustomizeToolbar = document.getElementById("opt-customize-toolbar");
  const optSpell = document.getElementById("opt-spell");
  const optDate = document.getElementById("opt-date");
  const optTime = document.getElementById("opt-time");
  const optCombined = document.getElementById("opt-combined");
  const recentList = document.getElementById("recent-files");
  const ctx = document.getElementById("ctx");
  const docTitle = document.getElementById("doc-title");

  document.querySelectorAll("[data-icon]").forEach((el) => {
    const svg = NcstTools.DRAWER_ICONS[el.getAttribute("data-icon")];
    if (svg) el.innerHTML = svg;
  });

  const host = window.api;
  if (!host) {
    document.body.prepend(
      Object.assign(document.createElement("p"), {
        textContent: "This editor needs an Electron host that exposes window.api.",
        style: "padding:12px;color:#a00",
      })
    );
    return;
  }

  const state = {
    path: null,
    kind: "markdown",
    savedContent: "",
    dirty: false,
    mode: "source",
    optionsOpen: false,
    misspelled: "",
    settings: null,
    frontmatter: null,
    docTitle: "Untitled",
    titleEdited: false,
  };

  let liveHandle = null;

  function basename(filePath) {
    if (!filePath) return "Untitled";
    return filePath.split(/[/\\]/).pop();
  }

  function stemFromPath(filePath) {
    const base = basename(filePath);
    return base.replace(/\.(md|txt|markdown)$/i, "") || "Untitled";
  }

  function suggestedFileName() {
    const raw = (docTitle.textContent || state.docTitle || "Untitled").replace(/\s+/g, " ").trim();
    return raw.replace(/[<>:"/\\|?*]/g, "").trim() || "Untitled";
  }

  function setDocTitle(text, fromFile) {
    const next = String(text || "Untitled").trim() || "Untitled";
    state.docTitle = next;
    if (fromFile) state.titleEdited = false;
    if (document.activeElement !== docTitle) docTitle.textContent = next;
  }

  function joinFrontmatter(frontmatter, body) {
    if (frontmatter == null || frontmatter === "") return body == null ? "" : String(body);
    const bodyText = body == null ? "" : String(body);
    return "---\n" + frontmatter + "\n---\n" + bodyText;
  }

  function splitSource(src) {
    return NcstMarkdown.splitFrontmatter(src == null ? "" : String(src));
  }

  function currentMarkdown() {
    if (state.mode === "live" && liveHandle) {
      return joinFrontmatter(state.frontmatter, liveHandle.getMarkdown());
    }
    return editor.value;
  }

  function syncLiveToTextarea() {
    if (state.mode === "live" && liveHandle) {
      editor.value = joinFrontmatter(state.frontmatter, liveHandle.getMarkdown());
    }
  }

  function syncTitle() {
    const name = state.docTitle || stemFromPath(state.path);
    const title = (state.dirty ? "• " : "") + name;
    host.setDirty(state.dirty, title);
  }

  function markDirty() {
    const next = currentMarkdown() !== state.savedContent;
    if (next !== state.dirty) {
      state.dirty = next;
      syncTitle();
    }
  }

  function renderPreview() {
    const src = currentMarkdown();
    if (state.kind === "text") {
      preview.innerHTML = NcstMarkdown.plainTextToHtml(src);
    } else {
      preview.innerHTML = NcstMarkdown.markdownToHtml(src);
    }
  }

  function canLive() {
    return state.kind !== "text" && window.NcstLive && typeof window.NcstLive.mount === "function";
  }

  function ensureLive(body) {
    if (!canLive()) return null;
    if (!liveHandle) {
      liveHandle = window.NcstLive.mount({
        element: liveEl,
        markdown: body || "",
        spellcheck: optSpell.checked,
        onUpdate: () => markDirty(),
        onSelection: () => scheduleGutter(),
      });
    } else {
      liveHandle.setMarkdown(body || "");
      liveHandle.setSpellcheck(optSpell.checked);
    }
    return liveHandle;
  }

  function applyModeChrome() {
    const mode = state.mode;
    editor.classList.toggle("hidden", mode !== "source");
    liveEl.classList.toggle("hidden", mode !== "live");
    preview.classList.toggle("hidden", mode !== "reading");
    btnLive.classList.toggle("active", mode === "live");
    btnPreview.classList.toggle("active", mode === "reading");
    btnLive.disabled = state.kind === "text";
    gutter.classList.toggle("hidden", mode === "reading");
    toolbar.querySelectorAll("button").forEach((b) => {
      b.disabled = mode === "reading";
    });
    scheduleGutter();
  }

  function setMode(next, persistIt) {
    let mode = next || "source";
    if (mode === "live" && !canLive()) mode = "source";
    if (state.mode === "live" && mode !== "live") syncLiveToTextarea();
    state.mode = mode;
    if (mode === "live") {
      const split = splitSource(editor.value);
      state.frontmatter = split.frontmatter;
      ensureLive(split.body);
    } else if (mode === "reading") {
      renderPreview();
    } else {
      const split = splitSource(editor.value);
      state.frontmatter = split.frontmatter;
    }
    applyModeChrome();
    if (mode === "live" && liveHandle) liveHandle.focus();
    else if (mode === "source") editor.focus();
    if (persistIt !== false) persist({ viewMode: mode, preview: mode === "reading" });
  }

  function setContent(content, filePath, kind) {
    const text = content == null ? "" : String(content);
    editor.value = text;
    state.path = filePath || null;
    state.kind = kind || (filePath && filePath.toLowerCase().endsWith(".txt") ? "text" : "markdown");
    const split = splitSource(text);
    state.frontmatter = split.frontmatter;
    state.savedContent = text;
    state.dirty = false;
    setDocTitle(filePath ? stemFromPath(filePath) : "Untitled", true);
    let mode = state.mode;
    if (state.kind === "text" && mode === "live") mode = "source";
    if (mode === "live") ensureLive(split.body);
    setMode(mode, false);
    syncTitle();
  }

  function setDrawerOpen(open) {
    drawer.classList.toggle("open", !!open);
    drawerToggle.textContent = open ? "«" : "»";
    drawerToggle.title = open ? "Collapse drawer" : "Expand drawer";
  }

  function setToolbarVisible(visible) {
    toolbar.classList.toggle("hidden", !visible);
    optToolbar.checked = !!visible;
  }

  function applySettings(settings) {
    state.settings = settings;
    setDrawerOpen(settings.drawerOpen !== false);
    setToolbarVisible(settings.toolbarVisible !== false);
    optSpell.checked = settings.spellcheck !== false;
    editor.spellcheck = settings.spellcheck !== false;
    if (liveHandle) liveHandle.setSpellcheck(settings.spellcheck !== false);
    optDate.value = settings.dateFormat || "MM/DD/YY";
    optTime.value = settings.timeFormat || "h:mm A";
    optCombined.value = settings.combinedFormat || "{date} {time}";
    renderToolbar(settings.toolbarLayout || settings.toolbarItems);
    renderRecent(settings.recentFiles || []);
    state.mode = settings.viewMode || "source";
  }

  function persist(partial) {
    return host.setSettings(partial).then((settings) => {
      state.settings = settings;
      renderRecent(settings.recentFiles || []);
      return settings;
    });
  }

  function toolButton(id) {
    const tool = NcstTools.BY_ID[id];
    if (!tool) return null;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.fmt = tool.id;
    btn.title = tool.label;
    btn.innerHTML = (tool.icon || "") + '<span class="sr-only">' + tool.label + "</span>";
    return btn;
  }

  function closeToolbarMenus() {
    toolbar.querySelectorAll(".toolbar-dd-menu").forEach((el) => el.classList.add("hidden"));
  }

  function renderToolbar(layoutOrItems) {
    const layout = NcstTools.normalizeLayout(
      Array.isArray(layoutOrItems) && layoutOrItems[0] && typeof layoutOrItems[0] === "object"
        ? layoutOrItems
        : state.settings && state.settings.toolbarLayout,
      Array.isArray(layoutOrItems) && typeof layoutOrItems[0] === "string" ? layoutOrItems : state.settings && state.settings.toolbarItems
    );
    toolbar.innerHTML = "";
    layout.forEach((entry) => {
      if (entry.t === "divider") {
        const sep = document.createElement("span");
        sep.className = "toolbar-sep";
        sep.setAttribute("aria-hidden", "true");
        toolbar.appendChild(sep);
        return;
      }
      if (entry.t === "group") {
        const wrap = document.createElement("span");
        wrap.className = "toolbar-group";
        entry.items.forEach((id) => {
          const btn = toolButton(id);
          if (btn) wrap.appendChild(btn);
        });
        toolbar.appendChild(wrap);
        return;
      }
      if (entry.t === "dropdown") {
        const wrap = document.createElement("div");
        wrap.className = "toolbar-dd";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "toolbar-dd-btn";
        btn.title = entry.label;
        const iconId = entry.items[0] || "heading";
        btn.innerHTML =
          (NcstTools.BY_ID[iconId] && NcstTools.BY_ID[iconId].icon ? NcstTools.BY_ID[iconId].icon : NcstTools.ICONS.heading) +
          '<span>' +
          entry.label +
          "</span>" +
          NcstTools.ICONS.chevron;
        const menu = document.createElement("div");
        menu.className = "toolbar-dd-menu hidden";
        entry.items.forEach((id) => {
          const tool = NcstTools.BY_ID[id];
          if (!tool) return;
          const item = document.createElement("button");
          item.type = "button";
          item.dataset.fmt = tool.id;
          item.innerHTML = (tool.icon || "") + "<span>" + tool.label + "</span>";
          menu.appendChild(item);
        });
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const open = menu.classList.contains("hidden");
          closeToolbarMenus();
          if (open) menu.classList.remove("hidden");
        });
        wrap.appendChild(btn);
        wrap.appendChild(menu);
        toolbar.appendChild(wrap);
        return;
      }
      const btn = toolButton(entry.id);
      if (btn) toolbar.appendChild(btn);
    });
    toolbar.querySelectorAll("button").forEach((b) => {
      b.disabled = state.mode === "reading";
    });
  }

  function sourceLineKind(line) {
    const level = NcstFormat.headingLevelOfLine(line);
    if (level) return { kind: "h" + level, label: "H" + level, formatted: true };
    if (/^\s*[-*+]\s+\[[ xX]\]/.test(line)) return { kind: "task", label: "☑", formatted: true };
    if (/^\s*\d+\.\s+/.test(line)) return { kind: "ol", label: "OL", formatted: true };
    if (/^\s*[-*+]\s+/.test(line)) return { kind: "ul", label: "UL", formatted: true };
    if (/^\s*>/.test(line)) return { kind: "quote", label: "“", formatted: true };
    return { kind: "paragraph", label: "P", formatted: false };
  }

  function sourceGutterMarks() {
    const value = editor.value;
    const caret = editor.selectionStart;
    const caretLine = (value.slice(0, caret).match(/\n/g) || []).length;
    const cs = window.getComputedStyle(editor);
    const lineHeight = parseFloat(cs.lineHeight) || 21;
    const paddingTop = parseFloat(cs.paddingTop) || 0;
    const lines = value.split("\n");
    const marks = [];
    lines.forEach((line, i) => {
      const info = sourceLineKind(line);
      const active = i === caretLine;
      if (!info.formatted && !active) return;
      marks.push({
        lineIndex: i,
        kind: info.kind,
        label: info.label,
        formatted: info.formatted,
        active,
        top: paddingTop + i * lineHeight - editor.scrollTop,
        height: lineHeight,
      });
    });
    return marks;
  }

  function paintGutterMarks(marks) {
    gutterMarks.innerHTML = "";
    const viewH = compose.clientHeight || 0;
    marks.forEach((mark) => {
      if (mark.top + mark.height < -8 || mark.top > viewH + 8) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gutter-chip" + (mark.active ? " is-active" : " is-ghost");
      btn.textContent = mark.label;
      btn.title = mark.active ? "Set heading or paragraph" : mark.label;
      btn.dataset.kind = mark.kind;
      if (mark.pos != null) btn.dataset.pos = String(mark.pos);
      if (mark.lineIndex != null) btn.dataset.line = String(mark.lineIndex);
      btn.style.top = Math.round(mark.top) + "px";
      btn.style.height = Math.round(mark.height) + "px";
      gutterMarks.appendChild(btn);
    });
  }

  function updateGutter() {
    if (state.mode === "reading") {
      gutterMarks.innerHTML = "";
      return;
    }
    if (state.mode === "live" && liveHandle) {
      try {
        paintGutterMarks(liveHandle.getGutterMarks(compose));
      } catch {
        gutterMarks.innerHTML = "";
      }
      return;
    }
    if (state.mode === "source") {
      paintGutterMarks(sourceGutterMarks());
      return;
    }
    gutterMarks.innerHTML = "";
  }

  function scheduleGutter() {
    requestAnimationFrame(updateGutter);
  }

  function hideHeadingMenu() {
    headingMenu.classList.add("hidden");
  }

  function showHeadingMenu(anchor) {
    hideCtx();
    const chip = anchor || gutterMarks.querySelector(".gutter-chip.is-active") || gutterMarks.querySelector(".gutter-chip");
    if (!chip) return;
    headingMenu.classList.remove("hidden");
    const chipRect = chip.getBoundingClientRect();
    const menuRect = headingMenu.getBoundingClientRect();
    let left = chipRect.right + 4;
    let top = chipRect.top;
    if (left + menuRect.width > window.innerWidth - 8) left = chipRect.left - menuRect.width - 4;
    if (top + menuRect.height > window.innerHeight - 8) top = window.innerHeight - menuRect.height - 8;
    headingMenu.style.left = Math.max(8, left) + "px";
    headingMenu.style.top = Math.max(8, top) + "px";
  }

  function applyBlockKind(kind) {
    if (state.mode === "live" && liveHandle) liveHandle.run(kind);
    else NcstFormat.run(kind, editor);
    scheduleGutter();
  }

  function currentLayout() {
    return NcstTools.normalizeLayout(state.settings && state.settings.toolbarLayout, state.settings && state.settings.toolbarItems);
  }

  function usedToolIds(layout) {
    return new Set(NcstTools.flattenLayout(layout));
  }

  function rowHtml(entry, nested) {
    const li = document.createElement("li");
    if (nested) li.className = "nest";
    if (entry.t === "divider") {
      li.dataset.kind = "divider";
      li.innerHTML =
        (NcstTools.ICONS.divider || "") +
        '<span class="tool-label">Vertical divider</span>' +
        '<button type="button" class="tool-move" data-act="remove">✕</button>' +
        '<button type="button" class="tool-move" data-move="up">↑</button>' +
        '<button type="button" class="tool-move" data-move="down">↓</button>';
      return li;
    }
    if (entry.t === "tool") {
      const tool = NcstTools.BY_ID[entry.id];
      if (!tool) return null;
      li.dataset.kind = "tool";
      li.dataset.id = entry.id;
      li.innerHTML =
        '<span class="tool-icon">' +
        (tool.icon || "") +
        '</span><input type="checkbox" checked /><span class="tool-label">' +
        tool.label +
        '</span><button type="button" class="tool-move" data-move="up">↑</button><button type="button" class="tool-move" data-move="down">↓</button>';
      return li;
    }
    if (entry.t === "group" || entry.t === "dropdown") {
      li.dataset.kind = entry.t;
      const icon = entry.t === "dropdown" ? NcstTools.ICONS.dropdown : NcstTools.ICONS.group;
      const labelInput =
        entry.t === "dropdown"
          ? '<input type="text" data-dd-label value="' +
            String(entry.label || "Menu").replace(/"/g, "&quot;") +
            '" />'
          : '<span class="tool-label">Button group</span>';
      li.innerHTML =
        '<span class="tool-icon">' +
        icon +
        "</span>" +
        labelInput +
        '<button type="button" class="tool-move" data-act="ungroup">Ungroup</button>' +
        '<button type="button" class="tool-move" data-move="up">↑</button>' +
        '<button type="button" class="tool-move" data-move="down">↓</button>';
      const sub = document.createElement("ul");
      entry.items.forEach((id) => {
        const child = rowHtml({ t: "tool", id }, true);
        if (child) {
          child.querySelector("input").checked = true;
          sub.appendChild(child);
        }
      });
      li.appendChild(sub);
      return li;
    }
    return null;
  }

  function paintCustomizer(layout) {
    toolbarToolList.innerHTML = "";
    layout.forEach((entry) => {
      const row = rowHtml(entry, false);
      if (row) toolbarToolList.appendChild(row);
    });
    const used = usedToolIds(layout);
    NcstTools.CATALOG.forEach((tool) => {
      if (used.has(tool.id)) return;
      const li = document.createElement("li");
      li.dataset.kind = "tool";
      li.dataset.id = tool.id;
      li.innerHTML =
        '<span class="tool-icon">' +
        (tool.icon || "") +
        '</span><input type="checkbox" /><span class="tool-label">' +
        tool.label +
        '</span><button type="button" class="tool-move" data-move="up">↑</button><button type="button" class="tool-move" data-move="down">↓</button>';
      toolbarToolList.appendChild(li);
    });
  }

  function collectLayout() {
    const layout = [];
    [...toolbarToolList.children].forEach((li) => {
      const kind = li.dataset.kind;
      if (kind === "divider") {
        layout.push({ t: "divider" });
        return;
      }
      if (kind === "tool") {
        const box = li.querySelector("input[type='checkbox']");
        if (box && box.checked && li.dataset.id) layout.push({ t: "tool", id: li.dataset.id });
        return;
      }
      if (kind === "group" || kind === "dropdown") {
        const items = [...li.querySelectorAll(":scope > ul > li[data-id]")]
          .filter((row) => {
            const box = row.querySelector("input[type='checkbox']");
            return box && box.checked;
          })
          .map((row) => row.dataset.id);
        if (!items.length) return;
        if (kind === "dropdown") {
          const labelEl = li.querySelector("[data-dd-label]");
          layout.push({ t: "dropdown", label: (labelEl && labelEl.value) || "Menu", items });
        } else layout.push({ t: "group", items });
      }
    });
    return NcstTools.normalizeLayout(layout, NcstTools.DEFAULT_ITEMS);
  }

  function openToolbarModal() {
    paintCustomizer(currentLayout());
    toolbarModal.classList.remove("hidden");
  }

  function closeToolbarModal() {
    toolbarModal.classList.add("hidden");
  }

  function saveToolbarLayout(layout) {
    const next = NcstTools.normalizeLayout(layout);
    renderToolbar(next);
    persist({ toolbarLayout: next, toolbarItems: NcstTools.flattenLayout(next) });
  }

  function selectedTopTools() {
    return [...toolbarToolList.children]
      .filter((li) => li.dataset.kind === "tool" && li.querySelector("input") && li.querySelector("input").checked)
      .map((li) => li.dataset.id);
  }

  function wrapSelected(kind) {
    const ids = selectedTopTools();
    if (ids.length < 2) return;
    const layout = collectLayout();
    const firstIndex = layout.findIndex((e) => e.t === "tool" && e.id === ids[0]);
    const without = layout.filter((e) => !(e.t === "tool" && ids.includes(e.id)));
    const at = firstIndex < 0 ? without.length : Math.min(firstIndex, without.length);
    const block =
      kind === "dropdown"
        ? { t: "dropdown", label: (NcstTools.BY_ID[ids[0]] && NcstTools.BY_ID[ids[0]].label) || "Menu", items: ids }
        : { t: "group", items: ids };
    without.splice(at, 0, block);
    paintCustomizer(NcstTools.normalizeLayout(without));
  }

  function renderRecent(paths) {
    recentList.innerHTML = "";
    if (!paths.length) {
      const li = document.createElement("li");
      li.textContent = "None yet";
      li.style.color = "#5c5c5c";
      recentList.appendChild(li);
      return;
    }
    paths.forEach((p) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.title = p;
      btn.textContent = basename(p);
      btn.addEventListener("click", () => openRecent(p));
      li.appendChild(btn);
      recentList.appendChild(li);
    });
  }

  async function confirmIfDirty() {
    if (!state.dirty) return "discard";
    return host.confirmUnsaved();
  }

  async function maybeSaveChoice(choice) {
    if (choice === "cancel") return false;
    if (choice === "save") {
      const result = await host.saveFile(currentMarkdown(), suggestedFileName());
      if (!result || result.canceled) return false;
      applyOpened(result);
    }
    return true;
  }

  function applyOpened(result) {
    if (!result || result.canceled) return;
    if (result.error) {
      window.alert(result.error);
      return;
    }
    if (result.cleared) {
      setContent("", null, "markdown");
      return;
    }
    setContent(result.content, result.path, result.kind);
  }

  async function cmdNew() {
    const choice = await confirmIfDirty();
    if (!(await maybeSaveChoice(choice))) return;
    applyOpened(await host.newFile());
  }

  async function cmdOpen() {
    const choice = await confirmIfDirty();
    if (!(await maybeSaveChoice(choice))) return;
    applyOpened(await host.openFile());
  }

  async function openRecent(filePath) {
    const choice = await confirmIfDirty();
    if (!(await maybeSaveChoice(choice))) return;
    applyOpened(await host.openPath(filePath));
  }

  async function cmdSave() {
    applyOpened(await host.saveFile(currentMarkdown(), suggestedFileName()));
  }

  async function cmdSaveAs() {
    applyOpened(await host.saveFileAs(currentMarkdown(), suggestedFileName()));
  }

  function cmdLive() {
    setMode(state.mode === "live" ? "source" : "live");
  }

  function cmdReading() {
    setMode(state.mode === "reading" ? "source" : "reading");
  }

  function cycleMode() {
    if (state.kind === "text") {
      setMode(state.mode === "reading" ? "source" : "reading");
      return;
    }
    const order = ["source", "live", "reading"];
    const idx = order.indexOf(state.mode);
    setMode(order[(idx + 1) % order.length]);
  }

  function cmdOptions() {
    state.optionsOpen = !state.optionsOpen;
    optionsPanel.classList.toggle("hidden", !state.optionsOpen);
    btnOptions.classList.toggle("active", state.optionsOpen);
    if (state.optionsOpen && !drawer.classList.contains("open")) {
      setDrawerOpen(true);
      persist({ drawerOpen: true });
    }
  }

  function hideCtx() {
    NcstContextMenu.hide(ctx);
  }

  function showCtx(payload, x, y) {
    state.misspelled = (payload && payload.misspelledWord) || "";
    NcstContextMenu.buildMenu(ctx, payload, onMenuAction);
    NcstContextMenu.place(ctx, x, y);
  }

  function runFormat(action) {
    if (state.mode === "reading") return;
    if (state.mode === "live" && liveHandle) {
      liveHandle.run(action);
      return;
    }
    NcstFormat.run(action, editor);
  }

  async function onMenuAction(action) {
    hideCtx();
    if (action === "noop") return;
    if (state.mode === "reading" && !action.startsWith("edit:")) return;
    if (action.startsWith("suggest:")) {
      if (state.mode === "live" && liveHandle) {
        liveHandle.insertText(action.slice(8));
      } else {
        NcstFormat.replaceWordAt(editor, state.misspelled, action.slice(8));
      }
      return;
    }
    if (action === "dict:add" && state.misspelled) {
      await host.addToDictionary(state.misspelled);
      return;
    }
    if (action === "dict:ignore" && state.misspelled) {
      await host.ignoreWord(state.misspelled);
      return;
    }
    if (action === "edit:cut") {
      document.execCommand("cut");
      return;
    }
    if (action === "edit:copy") {
      document.execCommand("copy");
      return;
    }
    if (action === "edit:paste") {
      document.execCommand("paste");
      return;
    }
    if (action.startsWith("dt:")) {
      const text = await host.formatDateTime(action.slice(3));
      if (state.mode === "live" && liveHandle) liveHandle.insertText(text);
      else NcstFormat.insertAtCaret(editor, text);
      return;
    }
    runFormat(action);
  }

  editor.addEventListener("input", () => {
    markDirty();
    if (state.mode === "reading") renderPreview();
    scheduleGutter();
  });
  editor.addEventListener("keyup", scheduleGutter);
  editor.addEventListener("click", scheduleGutter);
  editor.addEventListener("scroll", scheduleGutter);
  liveEl.addEventListener("scroll", scheduleGutter);

  gutterMarks.addEventListener("click", (e) => {
    const chip = e.target.closest(".gutter-chip");
    if (!chip) return;
    e.preventDefault();
    e.stopPropagation();
    if (state.mode === "live" && liveHandle && chip.dataset.pos != null) {
      liveHandle.selectPos(chip.dataset.pos);
    } else if (state.mode === "source" && chip.dataset.line != null) {
      const lines = editor.value.split("\n");
      let pos = 0;
      const target = Number(chip.dataset.line);
      for (let i = 0; i < target && i < lines.length; i += 1) pos += lines[i].length + 1;
      editor.focus();
      editor.setSelectionRange(pos, pos);
    }
    scheduleGutter();
    showHeadingMenu(chip);
  });

  headingMenu.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-block]");
    if (!btn) return;
    e.stopPropagation();
    applyBlockKind(btn.getAttribute("data-block"));
    hideHeadingMenu();
  });

  optCustomizeToolbar.addEventListener("click", () => openToolbarModal());
  document.getElementById("toolbar-modal-close").addEventListener("click", closeToolbarModal);
  document.getElementById("toolbar-done").addEventListener("click", () => {
    saveToolbarLayout(collectLayout());
    closeToolbarModal();
  });
  document.getElementById("toolbar-reset").addEventListener("click", () => {
    saveToolbarLayout(NcstTools.DEFAULT_LAYOUT);
    paintCustomizer(NcstTools.DEFAULT_LAYOUT);
  });
  document.getElementById("toolbar-add-divider").addEventListener("click", () => {
    const next = collectLayout();
    next.push({ t: "divider" });
    paintCustomizer(next);
  });
  document.getElementById("toolbar-make-group").addEventListener("click", () => wrapSelected("group"));
  document.getElementById("toolbar-make-dropdown").addEventListener("click", () => wrapSelected("dropdown"));
  toolbarToolList.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    const act = e.target.getAttribute("data-act");
    if (act === "remove") {
      li.remove();
      return;
    }
    if (act === "ungroup") {
      const kids = [...li.querySelectorAll(":scope > ul > li")];
      kids.forEach((kid) => li.parentNode.insertBefore(kid, li));
      li.remove();
      return;
    }
    const move = e.target.getAttribute("data-move");
    if (!move) return;
    const parent = li.parentNode;
    const siblings = [...parent.children].filter((n) => n.tagName === "LI");
    const idx = siblings.indexOf(li);
    if (move === "up" && idx > 0) parent.insertBefore(li, siblings[idx - 1]);
    else if (move === "down" && idx >= 0 && idx < siblings.length - 1) parent.insertBefore(siblings[idx + 1], li);
  });

  document.addEventListener("click", (e) => {
    if (!ctx.contains(e.target)) hideCtx();
    if (!headingMenu.contains(e.target) && !e.target.closest("#gutter")) hideHeadingMenu();
    if (e.target === toolbarModal) closeToolbarModal();
    if (!e.target.closest(".toolbar-dd")) closeToolbarMenus();
  });

  drawerToggle.addEventListener("click", () => {
    const open = !drawer.classList.contains("open");
    setDrawerOpen(open);
    persist({ drawerOpen: open });
  });

  drawer.querySelectorAll("[data-cmd]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cmd = btn.getAttribute("data-cmd");
      if (cmd === "new") cmdNew();
      else if (cmd === "open") cmdOpen();
      else if (cmd === "save") cmdSave();
      else if (cmd === "saveAs") cmdSaveAs();
      else if (cmd === "live") cmdLive();
      else if (cmd === "reading") cmdReading();
      else if (cmd === "options") cmdOptions();
    });
  });

  toolbar.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-fmt]");
    if (btn) {
      runFormat(btn.getAttribute("data-fmt"));
      closeToolbarMenus();
    }
  });

  docTitle.addEventListener("input", () => {
    state.titleEdited = true;
    state.docTitle = (docTitle.textContent || "").replace(/\s+/g, " ").trim() || "Untitled";
    syncTitle();
  });
  docTitle.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      docTitle.blur();
    }
  });
  docTitle.addEventListener("blur", () => {
    setDocTitle(docTitle.textContent, false);
    state.titleEdited = true;
    syncTitle();
  });

  optToolbar.addEventListener("change", () => {
    setToolbarVisible(optToolbar.checked);
    persist({ toolbarVisible: optToolbar.checked });
  });
  optSpell.addEventListener("change", () => {
    editor.spellcheck = optSpell.checked;
    if (liveHandle) liveHandle.setSpellcheck(optSpell.checked);
    persist({ spellcheck: optSpell.checked });
  });
  function saveFormats() {
    persist({
      dateFormat: optDate.value.trim() || "MM/DD/YY",
      timeFormat: optTime.value.trim() || "h:mm A",
      combinedFormat: optCombined.value.trim() || "{date} {time}",
    });
  }
  optDate.addEventListener("change", saveFormats);
  optTime.addEventListener("change", saveFormats);
  optCombined.addEventListener("change", saveFormats);

  document.addEventListener("keydown", (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === "n") {
      e.preventDefault();
      cmdNew();
    } else if (ctrl && e.key === "o") {
      e.preventDefault();
      cmdOpen();
    } else if (ctrl && e.shiftKey && (e.key === "S" || e.key === "s")) {
      e.preventDefault();
      cmdSaveAs();
    } else if (ctrl && e.key === "s") {
      e.preventDefault();
      cmdSave();
    } else if (ctrl && e.key === "e") {
      e.preventDefault();
      cycleMode();
    } else if (ctrl && e.key === "\\") {
      e.preventDefault();
      const open = !drawer.classList.contains("open");
      setDrawerOpen(open);
      persist({ drawerOpen: open });
    } else if (ctrl && e.key === "b" && state.mode === "source") {
      e.preventDefault();
      NcstFormat.run("bold", editor);
    } else if (ctrl && e.key === "i" && state.mode === "source") {
      e.preventDefault();
      NcstFormat.run("italic", editor);
    } else if (e.key === "Escape") {
      hideCtx();
      hideHeadingMenu();
      closeToolbarModal();
    } else if (e.key === "Enter" && e.shiftKey && state.mode === "source") {
      e.preventDefault();
      NcstFormat.insertAtCaret(editor, state.kind === "text" ? "\n" : "  \n");
    }
  });

  host.onSpellContext((payload) => {
    if (state.mode === "reading" || (payload && payload.isEditable === false)) return;
    showCtx(payload, payload.x || 0, payload.y || 0);
  });

  host.onSaveThenQuit(async () => {
    const result = await host.saveFile(currentMarkdown(), suggestedFileName());
    if (result && !result.canceled && !result.error) {
      applyOpened(result);
      host.allowClose();
    }
  });

  host.onRequestClose(async () => {
    const choice = await confirmIfDirty();
    if (choice === "cancel") return;
    if (choice === "save") {
      const result = await host.saveFile(currentMarkdown(), suggestedFileName());
      if (!result || result.canceled || result.error) return;
      applyOpened(result);
    }
    host.allowClose();
  });

  host.getSettings().then((settings) => {
    applySettings(settings);
    setContent("", null, "markdown");
  });
})();
