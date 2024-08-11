import { useEffect, useRef, useState } from "react"

import ProjectList from "./ProjectList"

export function Canvas() {
  const [_, setTheme] = useState("light")
  const [layout] = useState<"focused" | "full">("focused")

  // Effect to listen for messages from the iframe
  useEffect(() => {
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
    <main
      className={`${layout === "focused" ? "container max-w-screen-xl" : "grid"} flex flex-col items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-8`}
    >
      {/* <div className="my-2">
        <ActionCallout />
      </div> */}
      <ProjectList />
    </main>
  )
}
