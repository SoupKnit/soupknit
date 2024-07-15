import { useCallback, useEffect } from "react"

import { Button } from "@/components/ui/button"

type WindowWithJupyter = Window & {
  jupyterlab: {
    postMessage: (message: { type: string; content: string }) => void
  }
}

export function CellActions({
  jupyter,
}: {
  jupyter?: React.RefObject<HTMLIFrameElement> | null
}) {
  const addCell = useCallback(() => {
    const jupyterLab = (window.frames as WindowWithJupyter)?.jupyterlab
    jupyterLab.postMessage({
      type: "add_cell",
      content: `
# We can insert whatever the fuck we want
print("Hello, world!")
a = 2 + 3
b = a * 2
        `,
    })
  }, [])

  return <Button onClick={addCell}>Add Cell</Button>
}
