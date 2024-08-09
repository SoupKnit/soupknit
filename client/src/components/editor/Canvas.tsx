import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"

import { ActionCallout } from "./ActionsCallout"
import { Sidebar } from "./EditorSidebar"
import { ActionsContainer } from "./LeftPanel"
import { NativeEditor } from "./native/NativeEditor"
import ProjectList from "./ProjectList"
import JupyterEmbedded from "@/components/editor/JupyterEmbedded"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import supa from "@/lib/supabaseClient"

export function Canvas() {
  const [theme, setTheme] = useState("light")
  const [layout, setLayout] = useState<"focused" | "full">("focused")
  const [editorLoaded, setEditorLoaded] = useState(false)

  const editorRef = useRef<HTMLIFrameElement>(null)
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
