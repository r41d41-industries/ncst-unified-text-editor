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
      "Shift-Enter": ({ editor }) => editor.commands.setHardBreak(),
    };
  },
});

const ACTIONS = {
  bold: (ed) => ed.chain().focus().toggleBold().run(),
  italic: (ed) => ed.chain().focus().toggleItalic().run(),
  strike: (ed) => ed.chain().focus().toggleStrike().run(),
  heading: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run(),
  paragraph: (ed) => ed.chain().focus().setParagraph().run(),
  h1: (ed) => ed.chain().focus().setHeading({ level: 1 }).run(),
  h2: (ed) => ed.chain().focus().setHeading({ level: 2 }).run(),
  h3: (ed) => ed.chain().focus().setHeading({ level: 3 }).run(),
  h4: (ed) => ed.chain().focus().setHeading({ level: 4 }).run(),
  h5: (ed) => ed.chain().focus().setHeading({ level: 5 }).run(),
  h6: (ed) => ed.chain().focus().setHeading({ level: 6 }).run(),
  ul: (ed) => ed.chain().focus().toggleBulletList().run(),
  task: (ed) => ed.chain().focus().toggleTaskList().run(),
  quote: (ed) => ed.chain().focus().toggleBlockquote().run(),
  code: (ed) => ed.chain().focus().toggleCode().run(),
  link: (ed) =>
    ed.chain().focus().extendMarkRange("link").setLink({ href: "https://" }).run(),
  table: (ed) => ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  hr: (ed) => ed.chain().focus().setHorizontalRule().run(),
};

function blockInfo(editor) {
  for (let level = 1; level <= 6; level += 1) {
    if (editor.isActive("heading", { level })) {
      return { type: "heading", level, label: "H" + level, kind: "h" + level };
    }
  }
  if (editor.isActive("orderedList")) return { type: "list", label: "OL", kind: "ol" };
  if (editor.isActive("taskList")) return { type: "list", label: "☑", kind: "task" };
  if (editor.isActive("bulletList")) return { type: "list", label: "UL", kind: "ul" };
  if (editor.isActive("blockquote")) return { type: "quote", label: "“", kind: "quote" };
  if (editor.isActive("codeBlock")) return { type: "code", label: "{}", kind: "code" };
  return { type: "paragraph", label: "P", kind: "paragraph" };
}

function caretRect(editor, relativeTo) {
  const { from } = editor.state.selection;
  const coords = editor.view.coordsAtPos(from);
  const origin = relativeTo.getBoundingClientRect();
  return {
    top: coords.top - origin.top,
    height: Math.max(16, coords.bottom - coords.top),
  };
}

function createEditor(element, markdown, spellcheck, onUpdate, onSelection) {
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
      if (onSelection) onSelection();
    },
    onSelectionUpdate: () => {
      if (onSelection) onSelection();
    },
  });
}

export function mount(options) {
  const element = options.element;
  const onUpdate = options.onUpdate;
  const onSelection = options.onSelection;
  let editor = createEditor(
    element,
    options.markdown || "",
    options.spellcheck !== false,
    onUpdate,
    onSelection
  );

  return {
    getMarkdown() {
      return editor.getMarkdown ? editor.getMarkdown() : "";
    },
    getBlockInfo() {
      return blockInfo(editor);
    },
    caretRect(relativeTo) {
      return caretRect(editor, relativeTo || element);
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
