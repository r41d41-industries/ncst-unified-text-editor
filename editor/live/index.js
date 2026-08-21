import { Editor, Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { TableKit } from "@tiptap/extension-table";
import { TaskItem, TaskList } from "@tiptap/extension-list";

const LiveKeys = Extension.create({
  name: "ncstLiveKeys",
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (editor.commands.goToNextCell()) return true;
        if (editor.commands.sinkListItem("listItem")) return true;
        if (editor.commands.sinkListItem("taskItem")) return true;
        return true;
      },
      "Shift-Tab": ({ editor }) => {
        if (editor.commands.goToPreviousCell()) return true;
        if (editor.commands.liftListItem("listItem")) return true;
        if (editor.commands.liftListItem("taskItem")) return true;
        return true;
      },
      Enter: ({ editor }) => {
        if (!editor.isActive("table")) return false;
        const moved = editor.commands.goToNextCell();
        if (moved) return true;
        return editor.chain().addRowAfter().goToNextCell().run();
      },
    };
  },
});

const ACTIONS = {
  bold: (ed) => ed.chain().focus().toggleBold().run(),
  italic: (ed) => ed.chain().focus().toggleItalic().run(),
  strike: (ed) => ed.chain().focus().toggleStrike().run(),
  heading: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run(),
  ul: (ed) => ed.chain().focus().toggleBulletList().run(),
  task: (ed) => ed.chain().focus().toggleTaskList().run(),
  quote: (ed) => ed.chain().focus().toggleBlockquote().run(),
  code: (ed) => ed.chain().focus().toggleCode().run(),
  link: (ed) =>
    ed.chain().focus().extendMarkRange("link").setLink({ href: "https://" }).run(),
  table: (ed) => ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  hr: (ed) => ed.chain().focus().setHorizontalRule().run(),
};

function createEditor(element, markdown, spellcheck, onUpdate) {
  return new Editor({
    element,
    content: markdown || "",
    contentType: "markdown",
    editorProps: {
      attributes: {
        spellcheck: spellcheck ? "true" : "false",
        class: "tiptap",
      },
    },
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({
        table: { resizable: false },
      }),
      Markdown.configure({
        markedOptions: { gfm: true, breaks: false },
        indentation: { style: "space", size: 2 },
      }),
      LiveKeys,
    ],
    onUpdate: () => {
      if (onUpdate) onUpdate();
    },
  });
}

export function mount(options) {
  const element = options.element;
  const onUpdate = options.onUpdate;
  let editor = createEditor(element, options.markdown || "", options.spellcheck !== false, onUpdate);

  return {
    getMarkdown() {
      return editor.getMarkdown ? editor.getMarkdown() : "";
    },
    setMarkdown(markdown) {
      editor.commands.setContent(markdown || "", { contentType: "markdown", emitUpdate: false });
    },
    setSpellcheck(on) {
      const view = editor.view;
      if (view && view.dom) view.dom.setAttribute("spellcheck", on ? "true" : "false");
    },
    focus() {
      editor.commands.focus();
    },
    run(action) {
      const fn = ACTIONS[action];
      if (fn) fn(editor);
    },
    insertText(text) {
      editor.chain().focus().insertContent(String(text || "")).run();
    },
    destroy() {
      editor.destroy();
    },
  };
}
