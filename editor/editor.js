(() => {
  const editor = document.getElementById("editor");
  const preview = document.getElementById("preview");
  const liveEl = document.getElementById("live");
  const compose = document.getElementById("compose");
  const gutter = document.getElementById("gutter");
  const gutterMarks = document.getElementById("gutter-marks");
  const headingMenu = document.getElementById("heading-menu");
  const drawer = document.getElementById("drawer");
  const drawerToggle = document.getElementById("drawer-toggle");
  const rail = document.getElementById("rail");
  const toolbar = document.getElementById("toolbar");
  const ctx = document.getElementById("ctx");
  const docTitle = document.getElementById("doc-title");

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
        spellcheck: !state.settings || state.settings.spellcheck !== false,
        onUpdate: () => markDirty(),
        onSelection: () => scheduleGutter(),
      });
    } else {
      liveHandle.setMarkdown(body || "");
      liveHandle.setSpellcheck(!state.settings || state.settings.spellcheck !== false);
    }
    return liveHandle;
  }

  function applyModeChrome() {
    const mode = state.mode;
    editor.classList.toggle("hidden", mode !== "source");
    liveEl.classList.toggle("hidden", mode !== "live");
    preview.classList.toggle("hidden", mode !== "reading");
    const liveBtn = rail.querySelector('[data-cmd="live"]');
    const readBtn = rail.querySelector('[data-cmd="reading"]');
    if (liveBtn) {
      liveBtn.classList.toggle("active", mode === "live");
      liveBtn.disabled = state.kind === "text";
    }
    if (readBtn) readBtn.classList.toggle("active", mode === "reading");
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
  }

  function iconFor(id) {
    return NcstTools.resolveIcon(id, state.settings && state.settings.iconMap).svg;
  }

  function renderRail() {
    const layout = NcstTools.normalizeLayoutWith(
      state.settings && state.settings.drawerLayout,
      null,
      NcstTools.COMMAND_IDS,
      NcstTools.DEFAULT_DRAWER_LAYOUT
    );
    rail.innerHTML = "";
    layout.forEach((entry) => {
      if (entry.t === "divider") {
        const sep = document.createElement("div");
        sep.className = "rail-sep";
        rail.appendChild(sep);
        return;
      }
      const id = entry.id;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.cmd = id;
      btn.title = NcstTools.commandLabel(id);
      const ic = document.createElement("span");
      ic.className = "icon";
      ic.innerHTML = iconFor(id);
      const label = document.createElement("span");
      label.className = "label";
      label.textContent = NcstTools.commandLabel(id);
      btn.appendChild(ic);
      btn.appendChild(label);
      rail.appendChild(btn);
    });
    applyModeChrome();
  }

  function applySettings(settings) {
    state.settings = settings;
    setDrawerOpen(settings.drawerOpen !== false);
    setToolbarVisible(settings.toolbarVisible !== false);
    editor.spellcheck = settings.spellcheck !== false;
    if (liveHandle) liveHandle.setSpellcheck(settings.spellcheck !== false);
    renderToolbar(settings.toolbarLayout || settings.toolbarItems);
    renderRail();
  }

  function persist(partial) {
    return host.setSettings(partial).then((settings) => {
      state.settings = settings;
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
    btn.innerHTML = iconFor(tool.id) + '<span class="sr-only">' + tool.label + "</span>";
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
        btn.innerHTML = iconFor(iconId) + "<span>" + entry.label + "</span>" + NcstTools.ICONS.chevron;
        const menu = document.createElement("div");
        menu.className = "toolbar-dd-menu hidden";
        entry.items.forEach((id) => {
          const tool = NcstTools.BY_ID[id];
          if (!tool) return;
          const item = document.createElement("button");
          item.type = "button";
          item.dataset.fmt = tool.id;
          item.innerHTML = iconFor(tool.id) + "<span>" + tool.label + "</span>";
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
    host.openSettings();
  }

  function hideCtx() {
    NcstContextMenu.hide(ctx);
  }

  function showCtx(payload, x, y) {
    state.misspelled = (payload && payload.misspelledWord) || "";
    NcstContextMenu.buildMenu(
      ctx,
      payload,
      dispatchAction,
      state.settings && state.settings.contextLayout,
      state.settings && state.settings.iconMap
    );
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

  function dispatchAction(action) {
    hideCtx();
    if (action === "new") return cmdNew();
    if (action === "open") return cmdOpen();
    if (action === "save") return cmdSave();
    if (action === "saveAs") return cmdSaveAs();
    if (action === "live") return cmdLive();
    if (action === "reading") return cmdReading();
    if (action === "options") return cmdOptions();
    return onMenuAction(action);
  }

  document.addEventListener("click", (e) => {
    if (!ctx.contains(e.target)) hideCtx();
    if (!headingMenu.contains(e.target) && !e.target.closest("#gutter")) hideHeadingMenu();
    if (!e.target.closest(".toolbar-dd")) closeToolbarMenus();
  });

  drawerToggle.addEventListener("click", () => {
    const open = !drawer.classList.contains("open");
    setDrawerOpen(open);
    persist({ drawerOpen: open });
  });

  rail.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cmd]");
    if (btn) dispatchAction(btn.getAttribute("data-cmd"));
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
    } else if (ctrl && e.key === ",") {
      e.preventDefault();
      cmdOptions();
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
      closeToolbarMenus();
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
    if (settings.viewMode) state.mode = settings.viewMode;
    setContent("", null, "markdown");
  });
  if (host.onSettingsChanged) {
    host.onSettingsChanged((settings) => {
      const mode = state.mode;
      applySettings(settings);
      state.mode = mode;
      applyModeChrome();
    });
  }
  if (host.onOpenPath) {
    host.onOpenPath((filePath) => {
      if (filePath) openRecent(filePath);
    });
  }
})();
