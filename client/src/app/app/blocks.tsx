import { createFileRoute, Outlet } from "@tanstack/react-router"

import { EditorHeaderAndSidebar } from "@/components/editor/Controls"
import { StatusBar } from "@/components/editor/StatusBar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Sidebar } from "@/components/editor/EditorSidebar"
import { CSVViewer } from "@/components/editor/CSVViewer"

export const Route = createFileRoute("/app/blocks")({
  component: BaseLayout,
})

function BaseLayout() {
  return (
    
    <TooltipProvider>
      <div className="flex h-dvh w-full flex-col overflow-hidden">
        <EditorHeaderAndSidebar />

        <ScrollArea
          className="flex h-full w-full flex-col [&>[data-orientation=vertical]]:!top-14 [&>[data-orientation=vertical]]:!h-auto"
          type="scroll"
        >
          <main className="flex flex-1 overflow-x-hidden">
            <CSVViewer />
          </main>
        </ScrollArea>
        <StatusBar />
      </div>
    </TooltipProvider>
  )
}
