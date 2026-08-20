(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    const MarkdownIt = require("markdown-it");
    module.exports = factory(MarkdownIt);
  } else {
    root.NcstMarkdown = factory(root.markdownit);
  }
})(typeof self !== "undefined" ? self : this, function (MarkdownIt) {
  const CALLOUT_RE = /^\[!(note|tip|warning|info|danger|quote|abstract|todo|success|question|failure|bug|example)\]([+-])?\s*(.*)$/i;

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function splitFrontmatter(src) {
    const text = String(src || "");
    const match = text.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/);
    if (!match) return { frontmatter: null, body: text };
    return { frontmatter: match[1], body: text.slice(match[0].length) };
  }

  function wikilinksPlugin(md) {
    md.inline.ruler.before("link", "wikilink", (state, silent) => {
      if (state.src.slice(state.pos, state.pos + 2) !== "[[") return false;
      const close = state.src.indexOf("]]", state.pos + 2);
      if (close < 0) return false;
      const inner = state.src.slice(state.pos + 2, close);
      if (!inner || inner.includes("\n")) return false;
      const pipe = inner.indexOf("|");
      const target = (pipe >= 0 ? inner.slice(0, pipe) : inner).trim();
      const alias = (pipe >= 0 ? inner.slice(pipe + 1) : target).trim();
      if (!target) return false;
      if (!silent) {
        const token = state.push("wikilink", "a", 0);
        token.attrSet("href", "#");
        token.attrSet("class", "wikilink");
        token.attrSet("data-note", target);
        token.content = alias || target;
      }
      state.pos = close + 2;
      return true;
    });
    md.renderer.rules.wikilink = (tokens, idx) => {
      const token = tokens[idx];
      const note = escapeHtml(token.attrGet("data-note") || "");
      const text = escapeHtml(token.content || "");
      return `<a href="#" class="wikilink" data-note="${note}">${text}</a>`;
    };
  }

  function hashtagPlugin(md) {
    md.inline.ruler.push("hashtag", (state, silent) => {
      if (state.src.charCodeAt(state.pos) !== 0x23) return false;
      if (state.pos > 0 && !/\s/.test(state.src.charAt(state.pos - 1))) return false;
      const slice = state.src.slice(state.pos);
      const match = slice.match(/^#([A-Za-z][\w/-]*)/);
      if (!match) return false;
      if (!silent) {
        const token = state.push("hashtag", "span", 0);
        token.content = match[0];
      }
      state.pos += match[0].length;
      return true;
    });
    md.renderer.rules.hashtag = (tokens, idx) => {
      const text = escapeHtml(tokens[idx].content);
      return `<span class="tag">${text}</span>`;
    };
  }

  function taskListPlugin(md) {
    md.core.ruler.after("inline", "ncst-task-lists", (state) => {
      const tokens = state.tokens;
      for (let i = 2; i < tokens.length; i++) {
        if (tokens[i].type !== "inline") continue;
        if (tokens[i - 1].type !== "paragraph_open") continue;
        if (tokens[i - 2].type !== "list_item_open") continue;
        const children = tokens[i].children;
        if (!children || !children.length) continue;
        let idx = 0;
        if (children[0].type === "softbreak") idx = 1;
        const first = children[idx];
        if (!first || first.type !== "text") continue;
        const match = first.content.match(/^\[([ xX])\]\s+/);
        if (!match) continue;
        const checked = match[1] !== " ";
        first.content = first.content.slice(match[0].length);
        tokens[i - 2].attrJoin("class", "task-list-item");
        const checkbox = new state.Token("html_inline", "", 0);
        checkbox.content = `<input type="checkbox" disabled${checked ? " checked" : ""}> `;
        children.splice(idx, 0, checkbox);
      }
    });
  }

  function calloutPlugin(md) {
    md.core.ruler.after("inline", "obsidian-callouts", (state) => {
      const tokens = state.tokens;
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type !== "blockquote_open") continue;
        let inline = null;
        for (let j = i + 1; j < tokens.length && tokens[j].type !== "blockquote_close"; j++) {
          if (tokens[j].type === "inline") {
            inline = tokens[j];
            break;
          }
        }
        if (!inline || !inline.children) continue;
        const firstText = inline.children.find((t) => t.type === "text");
        if (!firstText) continue;
        const lines = firstText.content.split(/\r?\n/);
        const header = CALLOUT_RE.exec(lines[0].trim());
        if (!header) continue;
        const kind = header[1].toLowerCase();
        const title = header[3] || kind.charAt(0).toUpperCase() + kind.slice(1);
        tokens[i].attrJoin("class", `callout callout-${kind}`);
        lines[0] = title;
        firstText.content = lines.join("\n");
      }
    });
  }

  function createParser() {
    const md = new MarkdownIt({
      html: false,
      linkify: true,
      typographer: false,
      breaks: false,
    });
    md.use(wikilinksPlugin);
    md.use(hashtagPlugin);
    md.use(taskListPlugin);
    md.use(calloutPlugin);
    return md;
  }

  const parser = createParser();

  function frontmatterHtml(raw) {
    if (!raw) return "";
    return `<aside class="frontmatter"><pre>${escapeHtml(raw)}</pre></aside>`;
  }

  function markdownToHtml(src) {
    const { frontmatter, body } = splitFrontmatter(src);
    const html = parser.render(body || "");
    return frontmatterHtml(frontmatter) + html;
  }

  function plainTextToHtml(src) {
    return `<pre class="plain">${escapeHtml(src || "")}</pre>`;
  }

  return {
    splitFrontmatter,
    escapeHtml,
    markdownToHtml,
    plainTextToHtml,
    createParser,
  };
});
