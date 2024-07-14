import React, { useCallback, useRef } from "react"

function JupyterEmbedded({ className }: { className?: string }) {
  const iframeRef = useRef(null)
  const [theme, setTheme] = React.useState("Default")

  const toggle = useCallback(() => {
    window.frames.jupyterlab.postMessage({ type: "from-host-to-iframe" })
  }, [])

  // Effect to listen for messages from the iframe
  React.useEffect(() => {
    const handleMessage = (event) => {
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
        src="/jupy_lite/lab/index.html?kernel=python"
        className={className}
        sandbox="allow-scripts allow-same-origin"
      />
    </>
  )
}

export default JupyterEmbedded
