import React, { useCallback, useRef } from "react"

type WindowWithJupyter = Window & {
  jupyterlab: {
    postMessage: (message: { type: string; content: string }) => void
  }
}

function JupyterEmbedded({ className }: { className?: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [theme, setTheme] = React.useState("Default")

  const toggle = useCallback(() => {
    ;(window.frames as WindowWithJupyter).jupyterlab?.postMessage({
      type: "add_cell",
      content: `
# We can insert whatever the fuck we want
print("Hello, world!")
a = 2 + 3
b = a * 2
        `,
    })
  }, [])

  // Effect to listen for messages from the iframe
  React.useEffect(() => {
    const handleMessage = (event: {
      data: { type: string; theme: React.SetStateAction<string> }
    }) => {
      if (event.data.type === "from-iframe-to-host") {
        setTheme(event.data.theme)
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  return (
    <>
      <button onClick={toggle}>Toggle Theme</button>
      <iframe
        ref={iframeRef}
        name="jupyterlab"
        id="jupyter-iframe"  // Added id here
        src="/jupy_lite/lab/index.html?kernel=python"
        className={className}
        sandbox="allow-scripts allow-same-origin"
      />
    </>
  )
}

export default JupyterEmbedded