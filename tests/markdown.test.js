const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  markdownToHtml,
  plainTextToHtml,
  splitFrontmatter,
  escapeHtml,
} = require("../editor/markdown");

test("renders headings and bold", () => {
  const html = markdownToHtml("## Hello **world**");
  assert.match(html, /<h2>/);
  assert.match(html, /<strong>world<\/strong>/);
});

test("renders GFM tables", () => {
  const src = "| A | B |\n| --- | --- |\n| 1 | 2 |";
  const html = markdownToHtml(src);
  assert.match(html, /<table>/);
  assert.match(html, /<td>1<\/td>/);
});

test("renders task lists", () => {
  const html = markdownToHtml("- [ ] open\n- [x] done");
  assert.match(html, /task-list-item/);
  assert.match(html, /type="checkbox"/);
  assert.match(html, /checked/);
});

test("renders wikilink and alias", () => {
  const html = markdownToHtml("See [[Note]] and [[Note|shown]]");
  assert.match(html, /class="wikilink"/);
  assert.match(html, /data-note="Note"/);
  assert.match(html, />shown</);
});

test("renders callouts", () => {
  const html = markdownToHtml("> [!note] Heads up\n> Body text");
  assert.match(html, /callout callout-note/);
  assert.match(html, /Heads up/);
  assert.doesNotMatch(html, /\[!note\]/);
});

test("strips YAML frontmatter from the body and shows it aside", () => {
  const src = "---\ntitle: Test\n---\n# After";
  const { frontmatter, body } = splitFrontmatter(src);
  assert.equal(frontmatter.trim(), "title: Test");
  assert.match(body, /^# After/);
  const html = markdownToHtml(src);
  assert.match(html, /class="frontmatter"/);
  assert.match(html, /<h1>/);
  assert.doesNotMatch(html, /<hr>/);
});

test("renders #tags", () => {
  const html = markdownToHtml("status #wip and done");
  assert.match(html, /<span class="tag">#wip<\/span>/);
});

test("does not execute script in markdown", () => {
  const html = markdownToHtml('<script>window.__xss=1</script>\n\n**ok**');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<strong>ok<\/strong>/);
});

test("plain text preview escapes HTML", () => {
  const html = plainTextToHtml("<b>x</b>");
  assert.match(html, /class="plain"/);
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
});

test("escapeHtml encodes markup", () => {
  assert.equal(escapeHtml('<a href="x">'), "&lt;a href=&quot;x&quot;&gt;");
});
