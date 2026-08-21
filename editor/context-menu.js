(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NcstContextMenu = factory(root.NcstTools);
  }
})(typeof self !== "undefined" ? self : this, function (tools) {
  tools = tools || {};

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k.startsWith("data-")) node.setAttribute(k, v);
      else node[k] = v;
    });
    (children || []).forEach((c) => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  }

  function addItem(menu, { action, label, disabled, icon }, onPick) {
    const btn = el("button", { type: "button", class: "ctx-item", disabled: !!disabled });
    if (icon) {
      const wrap = el("span", { class: "ctx-icon" });
      wrap.innerHTML = icon;
      btn.appendChild(wrap);
    }
    btn.appendChild(document.createTextNode(label));
    btn.dataset.action = action;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onPick(action, label);
    });
    menu.appendChild(btn);
  }

  function addSep(menu) {
    menu.appendChild(el("div", { class: "ctx-sep" }));
  }

  function commandIcon(id, iconMap) {
    if (!tools.resolveIcon) return "";
    return tools.resolveIcon(id, iconMap).svg;
  }

  function addCommand(menu, id, iconMap, onPick) {
    addItem(
      menu,
      {
        action: id,
        label: (tools.commandLabel && tools.commandLabel(id)) || id,
        icon: commandIcon(id, iconMap),
      },
      onPick
    );
  }

  function buildFromLayout(root, layout, iconMap, onPick) {
    (layout || []).forEach((entry) => {
      if (entry.t === "divider") {
        addSep(root);
        return;
      }
      if (entry.t === "tool") {
        addCommand(root, entry.id, iconMap, onPick);
        return;
      }
      if (entry.t === "dropdown" || entry.t === "group") {
        const wrap = el("div", { class: "ctx-sub" });
        const btn = el("button", { type: "button", class: "ctx-item ctx-sub-btn" });
        const ic = el("span", { class: "ctx-icon" });
        ic.innerHTML = (tools.ICONS && tools.ICONS.submenu) || "";
        btn.appendChild(ic);
        btn.appendChild(document.createTextNode(entry.label || "More"));
        const chev = el("span", { class: "ctx-caret" });
        chev.textContent = "▸";
        btn.appendChild(chev);
        const sub = el("div", { class: "ctx-sub-menu hidden" });
        (entry.items || []).forEach((id) => addCommand(sub, id, iconMap, onPick));
        btn.addEventListener("mouseenter", () => sub.classList.remove("hidden"));
        wrap.addEventListener("mouseleave", () => sub.classList.add("hidden"));
        wrap.appendChild(btn);
        wrap.appendChild(sub);
        root.appendChild(wrap);
      }
    });
  }

  function buildMenu(root, payload, onPick, layout, iconMap) {
    root.innerHTML = "";
    const miss = payload && payload.misspelledWord;
    const suggestions = (payload && payload.dictionarySuggestions) || [];
    if (miss) {
      if (suggestions.length) {
        suggestions.slice(0, 6).forEach((s) => addItem(root, { action: "suggest:" + s, label: s }, onPick));
      } else {
        addItem(root, { action: "noop", label: "No suggestions", disabled: true }, onPick);
      }
      addItem(root, { action: "dict:add", label: `Add “${miss}” to dictionary` }, onPick);
      addItem(root, { action: "dict:ignore", label: `Ignore “${miss}”` }, onPick);
      addSep(root);
    }
    const useLayout =
      layout && layout.length
        ? layout
        : (tools.DEFAULT_CONTEXT_LAYOUT || []).map((e) => JSON.parse(JSON.stringify(e)));
    buildFromLayout(root, useLayout, iconMap || {}, onPick);
  }

  function place(root, x, y) {
    root.classList.remove("hidden");
    const pad = 8;
    const rect = root.getBoundingClientRect();
    const left = Math.min(Math.max(pad, x), window.innerWidth - rect.width - pad);
    const top = Math.min(Math.max(pad, y), window.innerHeight - rect.height - pad);
    root.style.left = left + "px";
    root.style.top = top + "px";
  }

  function hide(root) {
    root.classList.add("hidden");
  }

  return { buildMenu, place, hide };
});
