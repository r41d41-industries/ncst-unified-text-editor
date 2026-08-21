const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { safeStem, suggestedSavePath } = require("../lib/files");

test("safeStem strips illegal filename characters", () => {
  assert.equal(safeStem("Meet:ing*1"), "Meet ing 1");
  assert.equal(safeStem("  Notes  "), "Notes");
  assert.equal(safeStem(""), "Untitled");
});

test("suggestedSavePath uses title for unsaved files", () => {
  assert.equal(suggestedSavePath(null, "Weekly Report", "markdown"), "Weekly Report.md");
  assert.equal(suggestedSavePath(null, "log", "text"), "log.txt");
});

test("suggestedSavePath keeps folder and swaps the stem", () => {
  const current = path.join("D:", "notes", "old.md");
  const next = suggestedSavePath(current, "New Name", "markdown");
  assert.equal(path.basename(next), "New Name.md");
  assert.equal(path.dirname(next), path.dirname(current));
});
