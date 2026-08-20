(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NcstFormat = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  function emitInput(textarea) {
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function applyWrap(textarea, before, after, placeholder) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.slice(start, end);
    const inner = selected || placeholder || "";
    textarea.value = value.slice(0, start) + before + inner + after + value.slice(end);
    const innerStart = start + before.length;
    textarea.setSelectionRange(innerStart, innerStart + inner.length);
    textarea.focus();
    emitInput(textarea);
  }

  function insertAtCaret(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    textarea.value = value.slice(0, start) + text + value.slice(end);
    const pos = start + text.length;
    textarea.setSelectionRange(pos, pos);
    textarea.focus();
    emitInput(textarea);
  }

  function lineRange(value, start, end) {
    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    let lineEnd = value.indexOf("\n", end);
    if (lineEnd < 0) lineEnd = value.length;
    return { lineStart, lineEnd };
  }

  function prefixLines(textarea, prefix) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const { lineStart, lineEnd } = lineRange(value, start, end);
    const block = value.slice(lineStart, lineEnd);
    const nextBlock = block
      .split("\n")
      .map((line) => (line.startsWith(prefix) ? line : prefix + line))
      .join("\n");
    textarea.value = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
    textarea.setSelectionRange(lineStart, lineStart + nextBlock.length);
    textarea.focus();
    emitInput(textarea);
  }

  function replaceWordAt(textarea, word, replacement) {
    if (!word) return;
    const start = textarea.selectionStart;
    const value = textarea.value;
    const from = Math.max(0, start - word.length - 20);
    const window = value.slice(from, start + word.length + 20);
    const idx = window.toLowerCase().indexOf(String(word).toLowerCase());
    if (idx < 0) {
      insertAtCaret(textarea, replacement);
      return;
    }
    const abs = from + idx;
    textarea.value = value.slice(0, abs) + replacement + value.slice(abs + word.length);
    const pos = abs + replacement.length;
    textarea.setSelectionRange(pos, pos);
    textarea.focus();
    emitInput(textarea);
  }

  const ACTIONS = {
    bold: (el) => applyWrap(el, "**", "**", "bold"),
    italic: (el) => applyWrap(el, "*", "*", "italic"),
    strike: (el) => applyWrap(el, "~~", "~~", "text"),
    heading: (el) => prefixLines(el, "## "),
    ul: (el) => prefixLines(el, "- "),
    task: (el) => prefixLines(el, "- [ ] "),
    quote: (el) => prefixLines(el, "> "),
    code: (el) => applyWrap(el, "`", "`", "code"),
    link: (el) => {
      const selected = el.value.slice(el.selectionStart, el.selectionEnd) || "text";
      applyWrap(el, "[", "](https://)", selected === "text" ? "text" : selected);
    },
    table: (el) => insertAtCaret(el, "\n| Column | Column |\n| --- | --- |\n|  |  |\n"),
    hr: (el) => insertAtCaret(el, "\n---\n"),
  };

  function run(action, textarea) {
    const fn = ACTIONS[action];
    if (fn && textarea) fn(textarea);
  }

  return { applyWrap, insertAtCaret, prefixLines, replaceWordAt, run, ACTIONS };
});
