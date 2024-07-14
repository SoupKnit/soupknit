import React, { useRef } from "react"

function JupyterEmbedded({ className }: { className?: string }) {
  const iframeRef = useRef(null)
  const [theme, setTheme] = React.useState("Default")

  // Handler to send a message to the iframe
  const toggleTheme = () => {
    const iframeWindow = iframeRef?.current?.contentWindow
    iframeWindow.postMessage({ type: "from-host-to-iframe" }, "*")
  }

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
    <iframe
      ref={iframeRef}
      name="jupyterlab"
      src="/jupy_assets/lab/index.html?kernel=python"
      className={className}
      sandbox="allow-scripts allow-same-origin"
    />
  )
}

export default JupyterEmbedded
