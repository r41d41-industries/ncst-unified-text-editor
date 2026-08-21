(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NcstTools = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const CATALOG = [
    { id: "bold", label: "Bold", glyph: "B" },
    { id: "italic", label: "Italic", glyph: "I" },
    { id: "strike", label: "Strikethrough", glyph: "S" },
    { id: "paragraph", label: "Paragraph", glyph: "P" },
    { id: "h1", label: "Heading 1", glyph: "H1" },
    { id: "h2", label: "Heading 2", glyph: "H2" },
    { id: "h3", label: "Heading 3", glyph: "H3" },
    { id: "h4", label: "Heading 4", glyph: "H4" },
    { id: "h5", label: "Heading 5", glyph: "H5" },
    { id: "h6", label: "Heading 6", glyph: "H6" },
    { id: "heading", label: "Heading", glyph: "H" },
    { id: "ul", label: "List", glyph: "•" },
    { id: "task", label: "Checklist", glyph: "☑" },
    { id: "quote", label: "Quote", glyph: "“" },
    { id: "code", label: "Code", glyph: "</>" },
    { id: "link", label: "Link", glyph: "🔗" },
    { id: "table", label: "Table", glyph: "▦" },
    { id: "hr", label: "Horizontal rule", glyph: "—" },
  ];

  const DEFAULT_ITEMS = [
    "bold",
    "italic",
    "strike",
    "heading",
    "ul",
    "task",
    "quote",
    "code",
    "link",
    "table",
    "hr",
  ];

  const BY_ID = Object.fromEntries(CATALOG.map((t) => [t.id, t]));

  function normalizeItems(items) {
    if (!Array.isArray(items) || !items.length) return DEFAULT_ITEMS.slice();
    const seen = new Set();
    const out = [];
    items.forEach((id) => {
      if (BY_ID[id] && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    });
    return out.length ? out : DEFAULT_ITEMS.slice();
  }

  return { CATALOG, DEFAULT_ITEMS, BY_ID, normalizeItems };
});
