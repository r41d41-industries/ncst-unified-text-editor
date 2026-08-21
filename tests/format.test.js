const { test } = require("node:test");
const assert = require("node:assert/strict");
const { headingLevelOfLine, setLineBlock } = require("../editor/format");

test("headingLevelOfLine reads ATX headings", () => {
  assert.equal(headingLevelOfLine("# Title"), 1);
  assert.equal(headingLevelOfLine("### Title"), 3);
  assert.equal(headingLevelOfLine("Paragraph"), 0);
});

function fakeTextarea(value, pos) {
  return {
    value,
    selectionStart: pos,
    selectionEnd: pos,
    setSelectionRange(a, b) {
      this.selectionStart = a;
      this.selectionEnd = b;
    },
    focus() {},
    dispatchEvent() {},
  };
}

test("setLineBlock converts heading to paragraph", () => {
  const el = fakeTextarea("## Hello", 3);
  setLineBlock(el, "p");
  assert.equal(el.value, "Hello");
});

test("setLineBlock sets heading 1", () => {
  const el = fakeTextarea("Hello", 0);
  setLineBlock(el, "h1");
  assert.equal(el.value, "# Hello");
});
