const { test } = require("node:test");
const assert = require("node:assert/strict");
const { normalizeSettings } = require("../lib/settings");

test("defaults to source view", () => {
  const s = normalizeSettings({});
  assert.equal(s.viewMode, "source");
});

test("migrates preview true to reading", () => {
  const s = normalizeSettings({ preview: true });
  assert.equal(s.viewMode, "reading");
});

test("keeps live viewMode", () => {
  const s = normalizeSettings({ viewMode: "live" });
  assert.equal(s.viewMode, "live");
});

test("rejects unknown viewMode", () => {
  const s = normalizeSettings({ viewMode: "split" });
  assert.equal(s.viewMode, "source");
});

test("keeps custom toolbar order and drops unknown tools", () => {
  const s = normalizeSettings({ toolbarItems: ["table", "bogus", "bold", "bold"] });
  assert.deepEqual(s.toolbarItems, ["table", "bold"]);
});

test("empty toolbar items fall back to default layout tools", () => {
  const s = normalizeSettings({ toolbarItems: [] });
  assert.ok(s.toolbarItems.includes("bold"));
  assert.ok(s.toolbarItems.includes("h1"));
  assert.ok(s.toolbarLayout.some((e) => e.t === "dropdown"));
});

test("migrates a flat toolbarItems list to layout tools", () => {
  const s = normalizeSettings({ toolbarItems: ["bold", "table"] });
  assert.deepEqual(
    s.toolbarLayout.filter((e) => e.t === "tool").map((e) => e.id),
    ["bold", "table"]
  );
});
