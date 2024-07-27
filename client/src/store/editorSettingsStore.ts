import { atom } from "jotai"

// create an atom to store the user settings
export const editorSettingsStore = atom({
  showPrintMargin: true,
  printMarginColumn: 80,
  readOnly: false,
  showInvisibles: false,
  showScrollbars: true,
  theme: "light",
  keybindings: "default",
  fontFamily: "monospace",
  autosave: true,
  autosaveInterval: 30000,
  showLineNumbers: true,
  showGutter: true,
  showIndentGuides: true,
  highlightActiveLine: true,
  highlightGutterLine: true,
  wrap: false,
  indentWithTabs: false,
})
