import { forwardRef } from "react"

const JupyterEmbedded = forwardRef<
  HTMLIFrameElement,
  { className?: string; onLoad: () => void }
>((props, ref) => {
  return (
    <iframe
      ref={ref}
      id="jupyter-embedded"
      title="JupyterLab Embedded"
      name="jupyterlab"
      src="/jupy_lite/lab/index.html?kernel=python"
      className={props.className}
      sandbox="allow-scripts allow-same-origin"
      onLoad={props.onLoad}
    />
  )
})

JupyterEmbedded.displayName = "JupyterEmbedded"

export default JupyterEmbedded
