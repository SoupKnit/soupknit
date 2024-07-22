import React, { useEffect, useRef, useState } from "react"
import { defaultKeymap, indentWithTab } from "@codemirror/commands"
import { python } from "@codemirror/lang-python"
import { EditorState } from "@codemirror/state"
import { oneDark } from "@codemirror/theme-one-dark"
import { EditorView, keymap } from "@codemirror/view"
import { githubLight } from "@uiw/codemirror-theme-github"

import "./marimocell.css"

export const EditorCell = ({
  index,
  initCode,
}: {
  index: number
  initCode: string
}) => {
  const editor = useRef(null)
  const [code, setCode] = useState(initCode)

  const onUpdate = EditorView.updateListener.of((v) => {
    setCode(v.state.doc.toString())
    console.log(v.state.doc.toString())
  })

  const myTheme = EditorView.baseTheme({
    "&": {
      color: "white",
      backgroundColor: "#282c34",
    },
  })

  useEffect(() => {
    if (!editor.current) return
    const startState = EditorState.create({
      doc: code,
      extensions: [
        keymap.of([...defaultKeymap, indentWithTab]),
        // oneDark,
        githubLight,
        python(),
        onUpdate,
      ],
    })

    const view = new EditorView({ state: startState, parent: editor.current })

    return () => {
      view.destroy()
    }
  }, [])

  return (
    <div id="cell" data-id={index}>
      <div ref={editor}></div>
    </div>
  )
}
