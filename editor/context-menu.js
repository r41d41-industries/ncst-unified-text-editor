(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NcstContextMenu = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const FORMAT_ITEMS = [
    { action: "bold", label: "Bold" },
    { action: "italic", label: "Italic" },
    { action: "strike", label: "Strikethrough" },
    { action: "heading", label: "Heading" },
    { action: "ul", label: "List" },
    { action: "task", label: "Checklist" },
    { action: "quote", label: "Quote" },
    { action: "code", label: "Code" },
    { action: "link", label: "Link" },
    { action: "table", label: "Table" },
    { action: "hr", label: "Horizontal rule" },
  ];

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

  function addItem(menu, { action, label, disabled }, onPick) {
    const btn = el("button", { type: "button", class: "ctx-item", disabled: !!disabled });
    btn.textContent = label;
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

  function buildMenu(root, payload, onPick) {
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
    addItem(root, { action: "edit:cut", label: "Cut" }, onPick);
    addItem(root, { action: "edit:copy", label: "Copy" }, onPick);
    addItem(root, { action: "edit:paste", label: "Paste" }, onPick);
    addSep(root);
    FORMAT_ITEMS.forEach((item) => addItem(root, item, onPick));
    addSep(root);
    addItem(root, { action: "dt:date", label: "Insert date" }, onPick);
    addItem(root, { action: "dt:time", label: "Insert time" }, onPick);
    addItem(root, { action: "dt:combined", label: "Insert date and time" }, onPick);
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

  return { FORMAT_ITEMS, buildMenu, place, hide };
});
