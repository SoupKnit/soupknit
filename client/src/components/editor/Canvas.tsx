import { useEffect, useRef, useState } from "react"

import { ActionCallout } from "./ActionsCallout"
import { Sidebar } from "./EditorSidebar"
import { ActionsContainer } from "./LeftPanel"
import { NativeEditor } from "./native/NativeEditor"
import JupyterEmbedded from "@/components/editor/JupyterEmbedded"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function Editor() {
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
      className={`${layout === "focused" ? "container max-w-screen-lg" : "grid"} flex flex-col items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-8`}
    >
      <div className="my-2">
        <ActionCallout />
      </div>
      <div className="order-last col-span-3 w-full">
        <ActionsContainer editorRef={editorRef} editorLoaded={editorLoaded} />
      </div>
      <Tabs className="col-span-5 w-full" defaultValue="native">
        <TabsList>
          <TabsTrigger value="native">Native</TabsTrigger>
          <TabsTrigger value="jupyter">Jupyter</TabsTrigger>
          {/* <TabsTrigger value="year">Yet Another View</TabsTrigger> */}
        </TabsList>
        <div>
          <TabsContent value="native" className="h-full">
            <NativeEditor />
          </TabsContent>
          <TabsContent value="jupyter" className="">
            <Card>
              <CardContent className="flex h-full min-h-[85vh] flex-col items-center justify-center p-2">
                <JupyterEmbedded
                  ref={editorRef}
                  className="padding-none margin-none w-full flex-grow border-none"
                  onLoad={() => setEditorLoaded(true)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </main>
  )
}
