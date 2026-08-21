(() => {
  const editor = document.getElementById("editor");
  const preview = document.getElementById("preview");
  const liveEl = document.getElementById("live");
  const drawer = document.getElementById("drawer");
  const drawerToggle = document.getElementById("drawer-toggle");
  const toolbar = document.getElementById("toolbar");
  const optionsPanel = document.getElementById("options-panel");
  const btnLive = document.getElementById("btn-live");
  const btnPreview = document.getElementById("btn-preview");
  const btnOptions = document.getElementById("btn-options");
  const optToolbar = document.getElementById("opt-toolbar");
  const optSpell = document.getElementById("opt-spell");
  const optDate = document.getElementById("opt-date");
  const optTime = document.getElementById("opt-time");
  const optCombined = document.getElementById("opt-combined");
  const recentList = document.getElementById("recent-files");
  const ctx = document.getElementById("ctx");

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
  };

  let liveHandle = null;

  function basename(filePath) {
    if (!filePath) return "Untitled";
    return filePath.split(/[/\\]/).pop();
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
    const name = basename(state.path);
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
    toolbar.querySelectorAll("button").forEach((b) => {
      b.disabled = mode === "reading";
    });
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
      const result = await host.saveFile(currentMarkdown());
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
    applyOpened(await host.saveFile(currentMarkdown()));
  }

  async function cmdSaveAs() {
    applyOpened(await host.saveFileAs(currentMarkdown()));
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
  });

  document.addEventListener("click", (e) => {
    if (!ctx.contains(e.target)) hideCtx();
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

  toolbar.querySelectorAll("[data-fmt]").forEach((btn) => {
    btn.addEventListener("click", () => runFormat(btn.getAttribute("data-fmt")));
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
    }
  });

  host.onSpellContext((payload) => {
    if (state.mode === "reading" || (payload && payload.isEditable === false)) return;
    showCtx(payload, payload.x || 0, payload.y || 0);
  });

  host.onSaveThenQuit(async () => {
    const result = await host.saveFile(currentMarkdown());
    if (result && !result.canceled && !result.error) {
      applyOpened(result);
      host.allowClose();
    }
  });

  host.onRequestClose(async () => {
    const choice = await confirmIfDirty();
    if (choice === "cancel") return;
    if (choice === "save") {
      const result = await host.saveFile(currentMarkdown());
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
