import { forwardRef, useCallback, useEffect } from "react"

import type { Ref } from "react"

function JupyterFrame({
  className,
  ref,
}: {
  className?: string
  ref: Ref<HTMLIFrameElement>
}) {
  const addCell = useCallback(() => {
    const jupyterLab = (window.frames as any)?.jupyterlab
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

  return (
    <>
      <button onClick={addCell}>Add Cell</button>
      <iframe
        ref={ref}
        name="jupyterlab"
        src="/jupy_lite/lab/index.html?kernel=python"
        className={className}
        sandbox="allow-scripts allow-same-origin"
      />
    </>
  )
}

const JupyterEmbedded = forwardRef(JupyterFrame)
export default JupyterEmbedded
