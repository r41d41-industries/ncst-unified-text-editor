(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NcstCustomize = factory(root.NcstTools);
  }
})(typeof self !== "undefined" ? self : this, function (tools) {
  tools = tools || (typeof require === "function" ? require("./tools") : null);

  function createListEditor(container, opts) {
    const allowDropdown = opts.allowDropdown !== false;
    const allowGroup = !!opts.allowGroup;
    const allowed = opts.allowed || tools.COMMAND_IDS;
    const unused = opts.unusedIds || [...allowed];
    let iconMap = opts.iconMap || {};
    let onIconPick = opts.onIconPick || function () {};

    function paint(layout) {
      container.innerHTML = "";
      layout.forEach((entry) => container.appendChild(row(entry, false)));
      const used = new Set(tools.flattenLayoutWith(layout, allowed, layout));
      unused.forEach((id) => {
        if (!allowed.has(id) || used.has(id)) return;
        container.appendChild(toolRow(id, false, false));
      });
    }

    function iconBtn(id) {
      const resolved = tools.resolveIcon(id, iconMap);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "icon-pick";
      btn.title = "Change icon";
      btn.dataset.iconFor = id;
      btn.innerHTML = resolved.svg;
      return btn;
    }

    function toolRow(id, checked, nested) {
      const li = document.createElement("li");
      li.dataset.kind = "tool";
      li.dataset.id = id;
      if (nested) li.className = "nest";
      const label = tools.commandLabel(id);
      li.appendChild(iconBtn(id));
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = !!checked;
      li.appendChild(box);
      const span = document.createElement("span");
      span.className = "tool-label";
      span.textContent = label;
      li.appendChild(span);
      addMoves(li, false);
      return li;
    }

    function addMoves(li, extraRemove) {
      if (extraRemove) {
        const rm = document.createElement("button");
        rm.type = "button";
        rm.className = "tool-move";
        rm.dataset.act = extraRemove;
        rm.textContent = extraRemove === "ungroup" ? "Ungroup" : "✕";
        li.appendChild(rm);
      }
      ["up", "down"].forEach((dir) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tool-move";
        b.dataset.move = dir;
        b.textContent = dir === "up" ? "↑" : "↓";
        li.appendChild(b);
      });
    }

    function row(entry) {
      if (entry.t === "divider") {
        const li = document.createElement("li");
        li.dataset.kind = "divider";
        const ic = document.createElement("span");
        ic.className = "tool-icon";
        ic.innerHTML = tools.ICONS.divider;
        li.appendChild(ic);
        const span = document.createElement("span");
        span.className = "tool-label";
        span.textContent = "Divider";
        li.appendChild(span);
        addMoves(li, "remove");
        return li;
      }
      if (entry.t === "tool") return toolRow(entry.id, true, false);
      if (entry.t === "group" || entry.t === "dropdown") {
        const li = document.createElement("li");
        li.dataset.kind = entry.t;
        const ic = document.createElement("span");
        ic.className = "tool-icon";
        ic.innerHTML = entry.t === "dropdown" ? tools.ICONS.submenu : tools.ICONS.group;
        li.appendChild(ic);
        if (entry.t === "dropdown") {
          const input = document.createElement("input");
          input.type = "text";
          input.dataset.ddLabel = "1";
          input.value = entry.label || "Menu";
          li.appendChild(input);
        } else {
          const span = document.createElement("span");
          span.className = "tool-label";
          span.textContent = "Group";
          li.appendChild(span);
        }
        addMoves(li, "ungroup");
        const sub = document.createElement("ul");
        (entry.items || []).forEach((id) => sub.appendChild(toolRow(id, true, true)));
        li.appendChild(sub);
        return li;
      }
      return toolRow(entry.id, true, false);
    }

    function collect() {
      const layout = [];
      [...container.children].forEach((li) => {
        const kind = li.dataset.kind;
        if (kind === "divider") layout.push({ t: "divider" });
        else if (kind === "tool") {
          const box = li.querySelector("input[type='checkbox']");
          if (box && box.checked && li.dataset.id) layout.push({ t: "tool", id: li.dataset.id });
        } else if (kind === "group" || kind === "dropdown") {
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
      return tools.normalizeLayoutWith(layout, null, allowed, layout);
    }

    function selectedTopTools() {
      return [...container.children]
        .filter((li) => li.dataset.kind === "tool" && li.querySelector("input") && li.querySelector("input").checked)
        .map((li) => li.dataset.id);
    }

    function wrap(kind) {
      const ids = selectedTopTools();
      if (ids.length < 2) return;
      const layout = collect();
      const firstIndex = layout.findIndex((e) => e.t === "tool" && e.id === ids[0]);
      const without = layout.filter((e) => !(e.t === "tool" && ids.includes(e.id)));
      const at = firstIndex < 0 ? without.length : Math.min(firstIndex, without.length);
      const block =
        kind === "dropdown"
          ? { t: "dropdown", label: tools.commandLabel(ids[0]), items: ids }
          : { t: "group", items: ids };
      without.splice(at, 0, block);
      paint(tools.normalizeLayoutWith(without, null, allowed, without));
    }

    container.addEventListener("click", (e) => {
      const pick = e.target.closest("[data-icon-for]");
      if (pick) {
        e.preventDefault();
        onIconPick(pick.getAttribute("data-icon-for"), pick);
        return;
      }
      const li = e.target.closest("li");
      if (!li) return;
      const act = e.target.getAttribute("data-act");
      if (act === "remove") li.remove();
      if (act === "ungroup") {
        const kids = [...li.querySelectorAll(":scope > ul > li")];
        kids.forEach((kid) => li.parentNode.insertBefore(kid, li));
        li.remove();
      }
      const move = e.target.getAttribute("data-move");
      if (!move) return;
      const parent = li.parentNode;
      const siblings = [...parent.children].filter((n) => n.tagName === "LI");
      const idx = siblings.indexOf(li);
      if (move === "up" && idx > 0) parent.insertBefore(li, siblings[idx - 1]);
      else if (move === "down" && idx >= 0 && idx < siblings.length - 1) parent.insertBefore(siblings[idx + 1], li);
    });

    return {
      paint,
      collect,
      wrap,
      addDivider() {
        const next = collect();
        next.push({ t: "divider" });
        paint(next);
      },
      setIconMap(next) {
        iconMap = next || {};
      },
      refreshIcons() {
        container.querySelectorAll("[data-icon-for]").forEach((btn) => {
          const id = btn.getAttribute("data-icon-for");
          btn.innerHTML = tools.resolveIcon(id, iconMap).svg;
        });
      },
      allowDropdown,
      allowGroup,
    };
  }

  return { createListEditor };
});
