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
