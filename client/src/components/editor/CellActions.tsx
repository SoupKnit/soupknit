import { useCallback, useEffect } from "react"

import ModelGenerator from "./ModelGenerator"
import { Button } from "@/components/ui/button"

import type { CodeActionComponent } from "@/lib/model"

type WindowWithJupyter = Window & {
  jupyterlab: {
    postMessage: (message: { type: string; content: string }) => void
  }
}

export const CellActions: CodeActionComponent = ({ editorRef }) => {
  return (
    <>
      <ModelGenerator editorRef={editorRef} />
    </>
  )
}
