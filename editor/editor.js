(() => {
  const editor = document.getElementById("editor");
  const preview = document.getElementById("preview");
  const drawer = document.getElementById("drawer");
  const drawerToggle = document.getElementById("drawer-toggle");
  const toolbar = document.getElementById("toolbar");
  const optionsPanel = document.getElementById("options-panel");
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
    preview: false,
    optionsOpen: false,
    misspelled: "",
    settings: null,
  };

  function basename(filePath) {
    if (!filePath) return "Untitled";
    return filePath.split(/[/\\]/).pop();
  }

  function syncTitle() {
    const name = basename(state.path);
    const title = (state.dirty ? "• " : "") + name;
    host.setDirty(state.dirty, title);
  }

  function markDirty() {
    const next = editor.value !== state.savedContent;
    if (next !== state.dirty) {
      state.dirty = next;
      syncTitle();
    }
  }

  function setContent(content, filePath, kind) {
    editor.value = content == null ? "" : String(content);
    state.path = filePath || null;
    state.kind = kind || (filePath && filePath.toLowerCase().endsWith(".txt") ? "text" : "markdown");
    state.savedContent = editor.value;
    state.dirty = false;
    if (state.preview) renderPreview();
    syncTitle();
  }

  function renderPreview() {
    if (state.kind === "text") {
      preview.innerHTML = NcstMarkdown.plainTextToHtml(editor.value);
    } else {
      preview.innerHTML = NcstMarkdown.markdownToHtml(editor.value);
    }
  }

  function setPreview(on) {
    state.preview = !!on;
    editor.classList.toggle("hidden", state.preview);
    preview.classList.toggle("hidden", !state.preview);
    btnPreview.classList.toggle("active", state.preview);
    toolbar.querySelectorAll("button").forEach((b) => {
      b.disabled = state.preview;
    });
    if (state.preview) renderPreview();
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
    optDate.value = settings.dateFormat || "MM/DD/YY";
    optTime.value = settings.timeFormat || "h:mm A";
    optCombined.value = settings.combinedFormat || "{date} {time}";
    setPreview(!!settings.preview);
    renderRecent(settings.recentFiles || []);
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
      const result = await host.saveFile(editor.value);
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
    applyOpened(await host.saveFile(editor.value));
  }

  async function cmdSaveAs() {
    applyOpened(await host.saveFileAs(editor.value));
  }

  function cmdPreview() {
    setPreview(!state.preview);
    persist({ preview: state.preview });
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

  async function onMenuAction(action) {
    hideCtx();
    if (action === "noop") return;
    if (state.preview && !action.startsWith("edit:")) return;
    if (action.startsWith("suggest:")) {
      NcstFormat.replaceWordAt(editor, state.misspelled, action.slice(8));
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
      NcstFormat.insertAtCaret(editor, text);
      return;
    }
    NcstFormat.run(action, editor);
  }

  editor.addEventListener("input", () => {
    markDirty();
    if (state.preview) renderPreview();
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
      else if (cmd === "preview") cmdPreview();
      else if (cmd === "options") cmdOptions();
    });
  });

  toolbar.querySelectorAll("[data-fmt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.preview) return;
      NcstFormat.run(btn.getAttribute("data-fmt"), editor);
    });
  });

  optToolbar.addEventListener("change", () => {
    setToolbarVisible(optToolbar.checked);
    persist({ toolbarVisible: optToolbar.checked });
  });
  optSpell.addEventListener("change", () => {
    editor.spellcheck = optSpell.checked;
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
      cmdPreview();
    } else if (ctrl && e.key === "\\") {
      e.preventDefault();
      const open = !drawer.classList.contains("open");
      setDrawerOpen(open);
      persist({ drawerOpen: open });
    } else if (ctrl && e.key === "b" && !state.preview) {
      e.preventDefault();
      NcstFormat.run("bold", editor);
    } else if (ctrl && e.key === "i" && !state.preview) {
      e.preventDefault();
      NcstFormat.run("italic", editor);
    } else if (e.key === "Escape") {
      hideCtx();
    }
  });

  host.onSpellContext((payload) => {
    if (state.preview || (payload && payload.isEditable === false)) return;
    showCtx(payload, payload.x || 0, payload.y || 0);
  });

  host.onSaveThenQuit(async () => {
    const result = await host.saveFile(editor.value);
    if (result && !result.canceled && !result.error) {
      applyOpened(result);
      host.allowClose();
    }
  });

  host.onRequestClose(async () => {
    const choice = await confirmIfDirty();
    if (choice === "cancel") return;
    if (choice === "save") {
      const result = await host.saveFile(editor.value);
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
